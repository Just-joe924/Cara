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

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in.')
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * Start a Stripe Checkout session for the current cart and return the hosted
 * checkout URL to redirect the browser to.
 */
export async function createCheckoutSession(
  shippingAddress: Record<string, unknown>,
): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/api/checkout/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ shipping_address: shippingAddress }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 409 && Array.isArray(json.items)) {
      const names = json.items.map((i: { name: string }) => i.name).join(', ')
      throw new Error(`Some items are out of stock: ${names}`)
    }
    if (res.status === 501) throw new Error('Card payments are not enabled yet.')
    throw new Error(json.error || 'Failed to start checkout')
  }
  if (!json.url) throw new Error('Checkout session did not return a URL')
  return { url: json.url as string }
}

/** Confirm a completed Stripe session and fulfill its order. */
export async function verifyCheckout(
  sessionId: string,
): Promise<{ paid: boolean; order_id?: string }> {
  const res = await fetch(
    `${API_URL}/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
    { headers: await authHeader() },
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Failed to verify checkout')
  return { paid: Boolean(json.paid), order_id: json.order_id }
}
