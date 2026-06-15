import { useMemo, useState } from 'react'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name: A–Z' },
]

const selectClass =
  'cursor-pointer rounded border border-primary-border bg-white px-2.5 py-2 text-sm outline-none'
const labelClass = 'flex flex-col gap-1.5 text-xs font-semibold text-muted'

export default function Shop() {
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('all')
  const [category, setCategory] = useState<'all' | 'featured' | 'new'>('all')
  const [sort, setSort] = useState<SortKey>('featured')

  const brands = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.brand))).sort()],
    [],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = products.filter((p) => {
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      const matchesBrand = brand === 'all' || p.brand === brand
      const matchesCategory = category === 'all' || p.category === category
      return matchesQuery && matchesBrand && matchesCategory
    })

    const sorted = [...filtered]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'featured':
      default:
        break
    }
    return sorted
  }, [query, brand, category, sort])

  const hasActiveFilters =
    query.trim() !== '' || brand !== 'all' || category !== 'all' || sort !== 'featured'

  function resetFilters() {
    setQuery('')
    setBrand('all')
    setCategory('all')
    setSort('featured')
  }

  return (
    <>
      <section className="page-banner bg-shop-header [background-position:top_25%_right_0]">
        <h2>#stayhome</h2>
        <p className="text-white">Save more with coupons &amp; up to 70% off</p>
      </section>

      <section className="flex flex-col items-stretch justify-between gap-5 px-5 pt-10 sm:px-10 lg:flex-row lg:items-center lg:px-20">
        <div className="flex max-w-sm flex-1 items-center gap-2.5 rounded border border-primary-border px-4 py-2.5">
          <i className="fa-solid fa-magnifying-glass text-primary"></i>
          <input
            type="search"
            placeholder="Search products or brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            className="w-full text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3.5">
          <label className={labelClass}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="featured">Featured</option>
              <option value="new">New Arrivals</option>
            </select>
          </label>

          <label className={labelClass}>
            Brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={selectClass}>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b === 'all' ? 'All Brands' : b}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="cursor-pointer self-end py-2.5 text-[13px] font-semibold text-primary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="section-x pt-6">
        <p className="mb-2.5 text-sm text-muted-2">
          Showing {visible.length} of {products.length} products
        </p>
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <i className="fa-regular fa-face-frown mb-4 text-5xl text-primary-border"></i>
            <h4 className="mb-4 text-xl">No products match your filters.</h4>
            <button type="button" className="btn-primary" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Newsletter />
    </>
  )
}
