import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface DescribeInput {
  name: string
  brand?: string | null
  category?: string | null
  condition?: string | null
  features?: string | null
  price?: number | null
}

/** Ask the API to auto-generate a product description from the given fields. */
export async function generateDescription(input: DescribeInput): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in.')

  const res = await fetch(`${API_URL}/api/products/describe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Failed to generate description')
  return json.description as string
}
