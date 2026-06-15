/**
 * DEV-ONLY product seeder.
 *
 * Imports products from DummyJSON into the Supabase `categories` + `products`
 * tables. A real shop should manage its own catalog; this exists so the app has
 * realistic data during development.
 *
 * Usage (from repo root):
 *   1. Fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the root .env
 *   2. npm run seed
 *
 * Idempotent: upserts on `slug`, so re-running updates rather than duplicates.
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the root .env file.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

interface DummyProduct {
  id: number
  title: string
  description: string
  price: number
  stock: number
  category: string
  thumbnail: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function titleCase(input: string): string {
  return input.replace(/(^|[-\s])\w/g, (m) => m.toUpperCase()).replace(/-/g, ' ')
}

async function main() {
  console.log('Fetching products from DummyJSON...')
  const res = await fetch('https://dummyjson.com/products?limit=100')
  if (!res.ok) throw new Error(`DummyJSON request failed: ${res.status}`)
  const { products } = (await res.json()) as { products: DummyProduct[] }
  console.log(`Fetched ${products.length} products.`)

  // --- Categories ---
  const categorySlugs = new Map<string, string>() // slug -> display name
  for (const p of products) categorySlugs.set(slugify(p.category), titleCase(p.category))

  const categoryRows = [...categorySlugs.entries()].map(([slug, name]) => ({ name, slug }))
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .upsert(categoryRows, { onConflict: 'slug' })
    .select('id, slug')
  if (catErr) throw catErr

  const categoryIdBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]))
  console.log(`Upserted ${cats?.length ?? 0} categories.`)

  // --- Products ---
  const productRows = products.map((p) => ({
    name: p.title,
    slug: `${slugify(p.title)}-${p.id}`, // suffix id to guarantee uniqueness
    description: p.description,
    price: p.price,
    stock: p.stock,
    image_url: p.thumbnail,
    category_id: categoryIdBySlug.get(slugify(p.category)) ?? null,
    is_active: true,
  }))

  const { error: prodErr } = await supabase
    .from('products')
    .upsert(productRows, { onConflict: 'slug' })
  if (prodErr) throw prodErr

  console.log(`Upserted ${productRows.length} products. Done.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
