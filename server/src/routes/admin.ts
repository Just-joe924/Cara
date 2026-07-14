import { Router, type Request, type Response } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const adminRouter = Router()

const ROLES = ['customer', 'seller', 'admin']

/**
 * GET /api/admin/stats — dashboard overview: entity counts, revenue, a 14-day
 * revenue/orders time series, role breakdown, and the most recent orders.
 */
adminRouter.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  const [usersC, sellersC, productsC, ordersRes, profilesRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sellers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('profiles').select('role'),
  ])

  const orders = (ordersRes.data ?? []) as Array<{ id: string; total_amount: number; status: string; created_at: string }>
  const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)

  // Role breakdown.
  const usersByRole: Record<string, number> = { customer: 0, seller: 0, admin: 0 }
  for (const p of (profilesRes.data ?? []) as Array<{ role: string }>) {
    usersByRole[p.role] = (usersByRole[p.role] ?? 0) + 1
  }

  // 14-day revenue/orders series, oldest → newest, keyed by YYYY-MM-DD.
  const days = 14
  const buckets = new Map<string, { revenue: number; orders: number }>()
  const labels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { revenue: 0, orders: 0 })
    labels.push(key)
  }
  for (const o of orders) {
    const key = new Date(o.created_at).toISOString().slice(0, 10)
    const b = buckets.get(key)
    if (b) {
      b.revenue += Number(o.total_amount)
      b.orders += 1
    }
  }
  const series = labels.map((date) => ({ date, ...buckets.get(date)! }))

  return res.json({
    counts: {
      users: usersC.count ?? 0,
      sellers: sellersC.count ?? 0,
      products: productsC.count ?? 0,
      orders: orders.length,
    },
    revenue,
    usersByRole,
    series,
    recentOrders: orders.slice(0, 6),
  })
})

/**
 * GET /api/admin/users — every profile enriched with auth email / last sign-in,
 * order count + lifetime spend, and whether they run a seller storefront.
 */
adminRouter.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  const [{ data: profiles }, authList, { data: orders }, { data: sellers }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin.from('orders').select('user_id, total_amount'),
    supabaseAdmin.from('sellers').select('user_id'),
  ])

  const authById = new Map(
    (authList.data?.users ?? []).map((u) => [u.id, { email: u.email ?? null, last_sign_in_at: u.last_sign_in_at ?? null }]),
  )
  const sellerSet = new Set((sellers ?? []).map((s: { user_id: string }) => s.user_id))

  const agg = new Map<string, { orders: number; spent: number }>()
  for (const o of (orders ?? []) as Array<{ user_id: string; total_amount: number }>) {
    const cur = agg.get(o.user_id) ?? { orders: 0, spent: 0 }
    cur.orders += 1
    cur.spent += Number(o.total_amount)
    agg.set(o.user_id, cur)
  }

  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
    email: authById.get(p.id)?.email ?? null,
    last_sign_in_at: authById.get(p.id)?.last_sign_in_at ?? null,
    is_seller: sellerSet.has(p.id),
    orders: agg.get(p.id)?.orders ?? 0,
    spent: agg.get(p.id)?.spent ?? 0,
  }))

  return res.json({ users })
})

/**
 * PATCH /api/admin/users/:id/role — change a user's role. Admins may not change
 * their own role (prevents accidentally locking themselves out).
 */
adminRouter.patch('/users/:id/role', requireAdmin, async (req: Request, res: Response) => {
  const role = String(req.body?.role ?? '')
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' })
  }

  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ id: req.params.id, role })
})

/**
 * DELETE /api/admin/users/:id — permanently delete an account. The auth user is
 * removed; profiles/cart/orders cascade via their FK to auth.users. Admins may
 * not delete themselves.
 */
adminRouter.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' })
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ id: req.params.id })
})

/**
 * GET /api/admin/products — all products (any seller, active or not) for moderation.
 */
adminRouter.get('/products', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, price, stock, is_active, image_url, created_at, categories(name), sellers(brand_name, business_name)')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ products: data ?? [] })
})

/**
 * PATCH /api/admin/products/:id — toggle a product's active (published) state.
 */
adminRouter.patch('/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const is_active = Boolean(req.body?.is_active)
  const { error } = await supabaseAdmin.from('products').update({ is_active }).eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ id: req.params.id, is_active })
})

/**
 * GET /api/admin/orders — the most recent orders across the whole store.
 */
adminRouter.get('/orders', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_amount, shipping_address, created_at, order_items(id, quantity, price_at_purchase, size, status, products(name))')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ orders: data ?? [] })
})
