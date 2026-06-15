import { supabase } from '../lib/supabase'
import type { Product } from '../types'

interface WishlistRow {
  products: Product | null
}

export async function fetchWishlist(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('products(*, categories(name, slug))')
    .eq('user_id', userId)
  if (error) throw error
  return ((data ?? []) as unknown as WishlistRow[])
    .map((row) => row.products)
    .filter((p): p is Product => p !== null)
}

export async function addWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .upsert(
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id' },
    )
  if (error) throw error
}

export async function removeWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}
