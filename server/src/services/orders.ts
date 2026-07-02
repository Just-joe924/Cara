import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export interface OrderLine {
  product: { id: string; name: string; price: number; stock: number; image_url: string | null }
  quantity: number
}

/** Typed error carrying an HTTP status + optional payload for the response. */
export class OrderError extends Error {
  status: number
  extra?: unknown
  constructor(status: number, message: string, extra?: unknown) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

/** Load the user's cart joined with authoritative product data. Throws if empty. */
export async function loadCartLines(userId: string): Promise<OrderLine[]> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('quantity, products(id, name, price, stock, image_url)')
    .eq('user_id', userId)

  if (error) throw new OrderError(500, error.message)

  const rows = (data ?? []) as unknown as { quantity: number; products: OrderLine['product'] | null }[]
  const lines = rows
    .filter((r): r is { quantity: number; products: OrderLine['product'] } => r.products !== null)
    .map((r) => ({ product: r.products, quantity: r.quantity }))

  if (lines.length === 0) throw new OrderError(400, 'Cart is empty')
  return lines
}

/** Reject when any line exceeds available stock (409 with the offending items). */
export function assertStock(lines: OrderLine[]): void {
  const insufficient = lines
    .filter((l) => l.quantity > l.product.stock)
    .map((l) => ({ name: l.product.name, requested: l.quantity, available: l.product.stock }))
  if (insufficient.length > 0) throw new OrderError(409, 'Insufficient stock', insufficient)
}

export function computeTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0)
}

/**
 * Create an order row + its order_items (price snapshot). Does NOT touch stock
 * or the cart — callers decide when to fulfill (immediately for COD, on payment
 * for Stripe). Rolls back the order if item insertion fails.
 */
export async function createOrderWithItems(
  userId: string,
  shipping: Record<string, unknown> | null,
  lines: OrderLine[],
  status = 'pending',
) {
  const total = computeTotal(lines)
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({ user_id: userId, status, total_amount: total, shipping_address: shipping })
    .select()
    .single()

  if (error || !order) throw new OrderError(500, error?.message ?? 'Failed to create order')

  const orderItems = lines.map((l) => ({
    order_id: order.id,
    product_id: l.product.id,
    quantity: l.quantity,
    price_at_purchase: l.product.price,
  }))

  const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems)
  if (itemsErr) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw new OrderError(500, itemsErr.message)
  }

  return { order, orderItems }
}

export async function decrementStock(lines: OrderLine[]): Promise<void> {
  await Promise.all(
    lines.map((l) =>
      supabaseAdmin
        .from('products')
        .update({ stock: Math.max(0, l.product.stock - l.quantity) })
        .eq('id', l.product.id),
    ),
  )
}

export async function clearCart(userId: string): Promise<void> {
  await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)
}

/**
 * Idempotently mark an order paid: decrement stock from its order_items, clear
 * the owner's cart, and set status='paid'. Safe to call multiple times (Stripe
 * may deliver the webhook more than once). Returns what happened.
 */
export async function markOrderPaid(orderId: string): Promise<'fulfilled' | 'already' | 'missing'> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) return 'missing'
  if (order.status === 'paid') return 'already'

  const { data: oitems } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, products(stock)')
    .eq('order_id', orderId)

  const items = (oitems ?? []) as unknown as {
    product_id: string | null
    quantity: number
    products: { stock: number } | null
  }[]

  await Promise.all(
    items.map((it) =>
      it.products && it.product_id
        ? supabaseAdmin
            .from('products')
            .update({ stock: Math.max(0, it.products.stock - it.quantity) })
            .eq('id', it.product_id)
        : Promise.resolve(),
    ),
  )

  await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', orderId)
  await clearCart(order.user_id)
  return 'fulfilled'
}
