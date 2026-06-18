import { supabase } from '../lib/supabase'
import type { Order } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_url, slug))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

/**
 * Finalize the current cart into an order via the Express API. The server
 * recomputes totals from the DB, validates stock, and clears the cart.
 */
export async function createOrder(shippingAddress: Record<string, unknown>): Promise<Order> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in to place an order.')

  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ shipping_address: shippingAddress }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 409 && Array.isArray(json.items)) {
      const names = json.items.map((i: { name: string }) => i.name).join(', ')
      throw new Error(`Some items are out of stock: ${names}`)
    }
    throw new Error(json.error || 'Failed to place order')
  }
  return json.order as Order
}
