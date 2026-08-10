import { supabase } from '../lib/supabase'
import type { ProductRating, Review } from '../types'

/** Reviews for one product, newest first. Public. */
export async function listReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Review[]
}

export interface ReviewInput {
  rating: number
  comment: string
  authorName: string | null
  verified: boolean
}

/**
 * Create or update the signed-in user's review for a product. The unique
 * (user_id, product_id) constraint makes this an upsert — editing an existing
 * review rather than stacking duplicates.
 */
export async function saveReview(productId: string, userId: string, input: ReviewInput): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      {
        product_id: productId,
        user_id: userId,
        rating: input.rating,
        comment: input.comment.trim() || null,
        author_name: input.authorName,
        verified: input.verified,
      },
      { onConflict: 'user_id,product_id' },
    )
    .select('*')
    .single()
  if (error) throw error
  return data as Review
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

/**
 * Whether this user has an order containing this product — powers the "Verified
 * purchase" badge. The buyer can read their own orders under RLS, so this runs
 * client-side at review time.
 */
export async function hasPurchased(productId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id)')
    .eq('product_id', productId)
    .eq('orders.user_id', userId)
    .limit(1)
  if (error) return false
  return (data ?? []).length > 0
}

/** Aggregate ratings for a set of products, keyed by product_id. */
export async function fetchRatings(productIds: string[]): Promise<Map<string, ProductRating>> {
  const map = new Map<string, ProductRating>()
  if (productIds.length === 0) return map
  const { data, error } = await supabase
    .from('product_ratings')
    .select('product_id, rating_avg, rating_count')
    .in('product_id', productIds)
  if (error) return map
  for (const r of (data ?? []) as Array<{ product_id: string; rating_avg: number; rating_count: number }>) {
    map.set(r.product_id, { average: Number(r.rating_avg), count: r.rating_count })
  }
  return map
}
