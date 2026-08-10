import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { sendItemStatusEmail } from '../lib/email.js'

export const sellerRouter = Router()

const FULFILMENT_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled']

async function sellerIdFor(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('sellers').select('id').eq('user_id', userId).maybeSingle()
  return data?.id ?? null
}

/**
 * GET /api/seller/orders — orders that contain the seller's products, with only
 * this seller's line items, grouped by order (newest first).
 */
sellerRouter.get('/orders', requireAuth, async (req: Request, res: Response) => {
  const sellerId = await sellerIdFor(req.user!.id)
  if (!sellerId) return res.status(403).json({ error: 'Not a seller' })

  const { data: prods } = await supabaseAdmin.from('products').select('id').eq('seller_id', sellerId)
  const productIds = (prods ?? []).map((p) => p.id)
  if (productIds.length === 0) return res.json({ orders: [] })

  const { data: items, error } = await supabaseAdmin
    .from('order_items')
    .select('id, quantity, price_at_purchase, size, status, product_id, products(name, image_url), orders(id, status, created_at, shipping_address)')
    .in('product_id', productIds)
  if (error) return res.status(500).json({ error: error.message })

  // Group the seller's line items by their parent order.
  const byOrder = new Map<string, { order: Record<string, unknown>; items: unknown[] }>()
  for (const it of (items ?? []) as any[]) {
    const order = it.orders
    if (!order) continue
    if (!byOrder.has(order.id)) {
      byOrder.set(order.id, {
        order: {
          id: order.id,
          status: order.status,
          created_at: order.created_at,
          shipping_address: order.shipping_address,
        },
        items: [],
      })
    }
    byOrder.get(order.id)!.items.push({
      id: it.id,
      name: it.products?.name ?? 'Product',
      image_url: it.products?.image_url ?? null,
      quantity: it.quantity,
      price_at_purchase: it.price_at_purchase,
      size: it.size ?? '',
      status: it.status ?? 'processing',
    })
  }

  const orders = [...byOrder.values()].sort(
    (a, b) =>
      new Date(String(b.order.created_at)).getTime() - new Date(String(a.order.created_at)).getTime(),
  )
  return res.json({ orders })
})

/**
 * PATCH /api/seller/orders/items/:id — update the fulfillment status of one of
 * the seller's own order line items.
 */
sellerRouter.patch('/orders/items/:id', requireAuth, async (req: Request, res: Response) => {
  const sellerId = await sellerIdFor(req.user!.id)
  if (!sellerId) return res.status(403).json({ error: 'Not a seller' })

  const status = String(req.body?.status ?? '')
  if (!FULFILMENT_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  // Confirm this line item belongs to one of the seller's products.
  const { data: item } = await supabaseAdmin
    .from('order_items')
    .select('id, status, products(seller_id)')
    .eq('id', req.params.id)
    .maybeSingle()
  const owner = (item as any)?.products?.seller_id
  if (!item || owner !== sellerId) {
    return res.status(404).json({ error: 'Order item not found' })
  }
  const prevStatus = (item as any).status as string

  const { error } = await supabaseAdmin
    .from('order_items')
    .update({ status })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })

  // Notify the buyer on a real transition into shipped/delivered (best-effort).
  if (status !== prevStatus) {
    await sendItemStatusEmail(req.params.id, status)
  }

  return res.json({ id: req.params.id, status })
})
