import { useEffect, useMemo, useState } from 'react'
import { fetchProducts, setProductActive, type AdminProduct } from '../../api/admin'

export default function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchProducts()
      .then((p) => active && setProducts(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load products'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  async function toggle(p: AdminProduct) {
    setBusy(p.id)
    setError('')
    const next = !p.is_active
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_active: next } : x)))
    try {
      await setProductActive(p.id, next)
    } catch (e) {
      setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_active: p.is_active } : x)))
      setError(e instanceof Error ? e.message : 'Failed to update product')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">Products <span className="text-sm font-normal text-muted">({products.length})</span></h2>
        <input
          type="search"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded border border-[#e1e1e1] px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#e6eaf0] bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e6eaf0] text-left text-xs font-bold uppercase text-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#f0f2f5] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url ?? 'https://placehold.co/40x40?text=No+Img'}
                        alt={p.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.sellers?.brand_name || p.sellers?.business_name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.categories?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink">{p.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(p)}
                      disabled={busy === p.id}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        p.is_active ? 'bg-primary-soft text-primary hover:bg-primary hover:text-white' : 'bg-[#eef1f5] text-muted hover:bg-muted hover:text-white'
                      }`}
                      title="Click to toggle"
                    >
                      {p.is_active ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">No products match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
