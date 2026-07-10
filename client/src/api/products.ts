import { supabase } from '../lib/supabase'
import type { Category, Product, ProductSize } from '../types'

const PRODUCT_SELECT = '*, categories(name, slug), sellers(id, brand_name, business_name)'

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function listNewest(limit: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as Product) ?? null
}

export async function listRelated(excludeId: string, limit: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .neq('id', excludeId)
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

// ============================================================
// Seller-side product management
// ============================================================

export interface ProductInput {
  name: string
  description: string | null
  price: number
  stock: number
  category_id: string | null
  image_url: string | null
  is_active: boolean
  sizes: ProductSize[]
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** All of a seller's products (including inactive drafts). */
export async function listMyProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function createProduct(sellerId: string, input: ProductInput): Promise<Product> {
  const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`
  const { data, error } = await supabase
    .from('products')
    .insert({ seller_id: sellerId, slug, ...input })
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/**
 * Upload a product image to the `product-images` bucket under the user's own
 * folder (`<userId>/...`), which the Storage RLS policy requires. Returns the
 * public URL to store on the product.
 */
export async function uploadProductImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

/** Persist extra gallery images for a product. */
export async function addProductImages(productId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return
  const rows = urls.map((url, i) => ({ product_id: productId, url, position: i }))
  const { error } = await supabase.from('product_images').insert(rows)
  if (error) throw error
}
