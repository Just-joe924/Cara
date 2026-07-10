import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMySeller } from '../api/sellers'
import { deleteProduct, listCategories, listMyProducts } from '../api/products'
import ProductForm from '../components/seller/ProductForm'
import type { Category, Product, Seller } from '../types'

export default function SellerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const loadProducts = useCallback(async (sellerId: string) => {
    setProducts(await listMyProducts(sellerId))
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const s = await getMySeller(user.id)
      if (!active) return
      if (!s) {
        navigate('/seller/onboarding', { replace: true })
        return
      }
      setSeller(s)
      const [cats] = await Promise.all([listCategories(), loadProducts(s.id)])
      if (active) setCategories(cats)
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [user, navigate, loadProducts])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setFormOpen(true)
  }
  async function handleSaved() {
    setFormOpen(false)
    setEditing(null)
    if (seller) await loadProducts(seller.id)
  }
  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    await deleteProduct(p.id)
    if (seller) await loadProducts(seller.id)
  }

  if (loading || !seller || !user) {
    return (
      <section className="section-x flex min-h-[50vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </section>
    )
  }

  return (
    <>
      <section className="page-banner bg-shop-header [background-position:top_25%_right_0]">
        <h2>{seller.brand_name || seller.business_name}</h2>
        <p className="text-white">Seller Dashboard</p>
      </section>

      <section className="section-x">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Your Products</h2>
            <p className="text-sm text-muted">
              {products.length} product{products.length === 1 ? '' : 's'} ·{' '}
              <Link to="/seller/orders" className="font-semibold text-primary">
                Orders
              </Link>{' '}
              ·{' '}
              <Link to={`/store/${seller.id}`} className="font-semibold text-primary">
                View your storefront
              </Link>
            </p>
          </div>
          {!formOpen && (
            <button className="btn-primary" onClick={openAdd}>
              <i className="fa-solid fa-plus mr-2"></i> Add Product
            </button>
          )}
        </div>

        {formOpen && (
          <div className="mb-8">
            <ProductForm
              sellerId={seller.id}
              userId={user.id}
              sellerBrand={seller.brand_name}
              categories={categories}
              product={editing ?? undefined}
              onSaved={handleSaved}
              onCancel={() => {
                setFormOpen(false)
                setEditing(null)
              }}
            />
          </div>
        )}

        {products.length === 0 && !formOpen ? (
          <div className="rounded-lg border border-dashed border-primary-border py-16 text-center">
            <i className="fa-solid fa-box-open mb-4 text-4xl text-primary-border"></i>
            <h4 className="mb-2 text-lg">No products yet</h4>
            <p className="mb-4 text-sm text-muted">Add your first product to start selling.</p>
            <button className="btn-primary" onClick={openAdd}>Add Product</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-y border-header">
                <tr className="text-left text-xs font-bold uppercase text-ink">
                  <th className="py-3">Product</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-[#f0f0f0]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url ?? 'https://placehold.co/48x48?text=No+Img'}
                          alt={p.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <span className="font-medium text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3">${p.price.toFixed(2)}</td>
                    <td className="py-3">{p.stock}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-primary-soft text-primary' : 'bg-[#f0f0f0] text-muted-2'}`}>
                        {p.is_active ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => openEdit(p)} className="mr-4 font-semibold text-primary hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} className="font-semibold text-accent hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
