import { supabase } from '../lib/supabase'
import type { CartItem, Product } from '../types'

interface CartRow {
  quantity: number
  size: string | null
  products: Product | null
}

/** Load the user's cart joined with product details. */
export async function fetchCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, size, products(*, categories(name, slug))')
    .eq('user_id', userId)
  if (error) throw error
  return ((data ?? []) as unknown as CartRow[])
    .filter((row): row is CartRow & { products: Product } => row.products !== null)
    .map((row) => ({ product: row.products, quantity: row.quantity, size: row.size ?? '' }))
}

/** Set an absolute quantity for a (product, size) line (insert or update). */
export async function setCartItem(userId: string, productId: string, size: string, quantity: number) {
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, size, quantity },
      { onConflict: 'user_id,product_id,size' },
    )
  if (error) throw error
}

export async function removeCartItem(userId: string, productId: string, size: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('size', size)
  if (error) throw error
}

export async function clearCartDb(userId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (error) throw error
}
