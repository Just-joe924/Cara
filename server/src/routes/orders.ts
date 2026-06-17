import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const ordersRouter = Router()

interface CartRow {
  product_id: string
  quantity: number
  products: { id: string; name: string; price: number; stock: number } | null
}

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
 * POST /api/orders — finalize an order from the user's cart.
 *
 * Authoritative server-side write: prices come from the DB (not the client),
 * stock is validated and decremented, and the cart is cleared. Runs with the
 * service-role key, so it bypasses RLS.
 */
ordersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const shippingAddress = (req.body?.shipping_address ?? null) as Record<string, unknown> | null

  // 1. Load the cart with authoritative product data.
  const { data: cartData, error: cartErr } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, products(id, name, price, stock)')
    .eq('user_id', userId)

  if (cartErr) return res.status(500).json({ error: cartErr.message })

  const cart = (cartData ?? []) as unknown as CartRow[]
  const items = cart.filter((row): row is CartRow & { products: NonNullable<CartRow['products']> } =>
    row.products !== null,
  )

  if (items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' })
  }

  // 2. Validate stock.
  const insufficient = items
    .filter((it) => it.quantity > it.products.stock)
    .map((it) => ({ name: it.products.name, requested: it.quantity, available: it.products.stock }))

  if (insufficient.length > 0) {
    return res.status(409).json({ error: 'Insufficient stock', items: insufficient })
  }

  // 3. Compute total from DB prices.
  const totalAmount = items.reduce((sum, it) => sum + it.products.price * it.quantity, 0)

  // 4. Create the order.
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      status: 'pending',
      total_amount: totalAmount,
      shipping_address: shippingAddress,
    })
    .select()
    .single()

  if (orderErr || !order) {
    return res.status(500).json({ error: orderErr?.message ?? 'Failed to create order' })
  }

  // 5. Insert order items (price snapshot).
  const orderItems = items.map((it) => ({
    order_id: order.id,
    product_id: it.products.id,
    quantity: it.quantity,
    price_at_purchase: it.products.price,
  }))

  const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems)
  if (itemsErr) {
    // Roll back the order so we don't leave an empty shell.
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    return res.status(500).json({ error: itemsErr.message })
  }

  // 6. Decrement stock per product.
  await Promise.all(
    items.map((it) =>
      supabaseAdmin
        .from('products')
        .update({ stock: it.products.stock - it.quantity })
        .eq('id', it.products.id),
    ),
  )

  // 7. Clear the cart.
  await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)

  return res.status(201).json({ order: { ...order, order_items: orderItems } })
})
