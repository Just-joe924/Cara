import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import {
  OrderError,
  assertStock,
  clearCart,
  createOrderWithItems,
  decrementStock,
  loadCartLines,
} from '../services/orders.js'
import { sendOrderReceipt } from '../lib/email.js'

export const ordersRouter = Router()

/**
 * GET /api/orders — list the authenticated user's orders with items.
 */
ordersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, image_url, slug))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ orders: data })
})

/**
 * POST /api/orders — finalize a pay-on-pickup order directly from the cart. The
 * buyer collects and pays at the shop, so the order is reserved now: prices come
 * from the DB, stock is validated + decremented, and the cart is cleared. It
 * stays `pending` until the seller marks it collected. Online payments go
 * through /api/checkout/session instead.
 */
ordersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const shipping = (req.body?.shipping_address ?? null) as Record<string, unknown> | null

  try {
    const lines = await loadCartLines(userId)
    assertStock(lines)
    const { order, orderItems } = await createOrderWithItems(userId, shipping, lines, 'pending', {
      payment_method: 'pickup',
      fulfilment: 'pickup',
    })
    await decrementStock(lines)
    await clearCart(userId)
    await sendOrderReceipt(order.id)
    return res.status(201).json({ order: { ...order, order_items: orderItems } })
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.status).json({ error: err.message, items: err.extra })
    }
    return res.status(500).json({ error: 'Failed to place order' })
  }
})
