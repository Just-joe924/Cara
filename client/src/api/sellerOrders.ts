import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface SellerOrderItem {
  id: string
  name: string
  image_url: string | null
  quantity: number
  price_at_purchase: number
  size: string
  status: string
}

export interface SellerOrder {
  order: {
    id: string
    status: string
    created_at: string
    shipping_address: Record<string, unknown> | null
  }
  items: SellerOrderItem[]
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in.')
  return { Authorization: `Bearer ${session.access_token}` }
}

export async function listSellerOrders(): Promise<SellerOrder[]> {
  const res = await fetch(`${API_URL}/api/seller/orders`, { headers: await authHeader() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Failed to load orders')
  return (json.orders ?? []) as SellerOrder[]
}

export async function updateItemStatus(itemId: string, status: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/seller/orders/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ status }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Failed to update status')
}
