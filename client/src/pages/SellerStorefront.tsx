import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import { getSellerById, listStoreProducts } from '../api/sellers'
import type { Product, Seller } from '../types'

export default function SellerStorefront() {
  const { id } = useParams()
  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    ;(async () => {
      const s = await getSellerById(id)
      if (!active) return
      setSeller(s)
      if (s) setProducts(await listStoreProducts(s.id))
      if (active) setLoading(false)
    })().catch(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <section className="section-x flex min-h-[50vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </section>
    )
  }

  if (!seller) {
    return (
      <section className="section-x flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h2 className="text-3xl">Store not found</h2>
        <p className="my-4 text-muted">This seller doesn't exist.</p>
        <Link to="/shop"><button className="btn-primary">Browse Shop</button></Link>
      </section>
    )
  }

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>{seller.brand_name || seller.business_name}</h2>
        {seller.business_type && <p className="text-white">{seller.business_type}</p>}
      </section>

      <section className="section-x">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {seller.logo_url && (
            <img src={seller.logo_url} alt={seller.business_name} className="h-20 w-20 rounded-full object-cover" />
          )}
          <div>
            <h2 className="text-2xl font-semibold text-ink">{seller.business_name}</h2>
            {seller.description && <p className="mt-1 max-w-2xl text-sm text-muted">{seller.description}</p>}
            {seller.website && (
              <a href={seller.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-primary">
                Visit website →
              </a>
            )}
          </div>
        </div>

        {(seller.address_line || seller.phone || seller.email) && (
          <div className="mb-8 grid gap-4 rounded-md border border-[#e2e9e1] p-5 sm:grid-cols-2">
            {seller.address_line && (
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-location-dot mt-1 text-primary"></i>
                <div className="text-sm">
                  <span className="block font-semibold text-ink">Visit the shop</span>
                  <span className="text-muted">
                    {[seller.address_line, seller.city, seller.state].filter(Boolean).join(', ')}
                  </span>
                  {seller.landmark && (
                    <span className="block text-xs text-muted-2">Close to {seller.landmark}</span>
                  )}
                </div>
              </div>
            )}
            {(seller.phone || seller.email) && (
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-comments mt-1 text-primary"></i>
                <div className="text-sm">
                  <span className="block font-semibold text-ink">Get in touch</span>
                  {seller.phone && (
                    <a href={`tel:${seller.phone}`} className="block text-muted hover:text-primary">
                      {seller.phone}
                      {seller.phone_alt ? ` · ${seller.phone_alt}` : ''}
                    </a>
                  )}
                  {seller.email && (
                    <a href={`mailto:${seller.email}`} className="block text-muted hover:text-primary">
                      {seller.email}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <p className="py-12 text-center text-muted">This store has no products yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Newsletter />
    </>
  )
}
