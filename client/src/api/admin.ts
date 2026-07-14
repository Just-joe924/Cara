import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface AdminStats {
  counts: { users: number; sellers: number; products: number; orders: number }
  revenue: number
  usersByRole: Record<string, number>
  series: Array<{ date: string; revenue: number; orders: number }>
  recentOrders: Array<{ id: string; total_amount: number; status: string; created_at: string }>
}

export interface AdminUser {
  id: string
  full_name: string | null
  role: string
  created_at: string
  email: string | null
  last_sign_in_at: string | null
  is_seller: boolean
  orders: number
  spent: number
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  is_active: boolean
  image_url: string | null
  created_at: string
  categories: { name: string } | null
  sellers: { brand_name: string | null; business_name: string } | null
}

export interface AdminOrder {
  id: string
  status: string
  total_amount: number
  shipping_address: Record<string, unknown> | null
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price_at_purchase: number
    size: string | null
    status: string
    products: { name: string } | null
  }>
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in.')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function get<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/admin/${path}`, { headers: await authHeader() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json[key] as T
}

export async function fetchStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers: await authHeader() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Failed to load stats')
  return json as AdminStats
}

export function fetchUsers(): Promise<AdminUser[]> {
  return get<AdminUser[]>('users', 'users')
}

export function fetchProducts(): Promise<AdminProduct[]> {
  return get<AdminProduct[]>('products', 'products')
}

export function fetchOrders(): Promise<AdminOrder[]> {
  return get<AdminOrder[]>('orders', 'orders')
}

async function mutate(path: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Request failed')
}

export function setUserRole(id: string, role: string): Promise<void> {
  return mutate(`users/${id}/role`, 'PATCH', { role })
}

export function deleteUser(id: string): Promise<void> {
  return mutate(`users/${id}`, 'DELETE')
}

export function setProductActive(id: string, is_active: boolean): Promise<void> {
  return mutate(`products/${id}`, 'PATCH', { is_active })
}
