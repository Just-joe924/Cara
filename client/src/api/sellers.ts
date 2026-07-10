import { supabase } from '../lib/supabase'
import type { Product, Seller } from '../types'

export interface SellerInput {
  business_name: string
  brand_name: string | null
  business_type: string | null
  description: string | null
  phone: string | null
  website: string | null
  logo_url: string | null
}

/** The seller profile owned by the given user, or null if they haven't onboarded. */
export async function getMySeller(userId: string): Promise<Seller | null> {
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as Seller) ?? null
}

export async function createSeller(userId: string, input: SellerInput): Promise<Seller> {
  const { data, error } = await supabase
    .from('sellers')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data as Seller
}

export async function updateSeller(id: string, patch: Partial<SellerInput>): Promise<Seller> {
  const { data, error } = await supabase
    .from('sellers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Seller
}

/** Public: a seller's storefront by id. */
export async function getSellerById(id: string): Promise<Seller | null> {
  const { data, error } = await supabase.from('sellers').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Seller) ?? null
}

/** Public: active products for a seller's storefront. */
export async function listStoreProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('seller_id', sellerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}
