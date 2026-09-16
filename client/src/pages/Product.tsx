import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import ImageGallery from '../components/ImageGallery'
import StarRating from '../components/StarRating'
import ReviewsSection from '../components/ReviewsSection'
import { getProductBySlug, listRelated } from '../api/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { formatNaira } from '../lib/money'
import type { Product as ProductType } from '../types'

export default function Product() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isWishlisted, toggle } = useWishlist()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [related, setRelated] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState('')
  const [sizeError, setSizeError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    let active = true
    setLoading(true)
    setAdded(false)
    setQuantity(1)
    setSize('')
    getProductBySlug(slug)
      .then(async (p) => {
        if (!active) return
        setProduct(p)
        if (p) setRelated(await listRelated(p.id, 4))
      })
      .catch((err) => console.error('Failed to load product:', err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  // Full gallery: the main image first, then the extra product_images (ordered),
  // de-duplicated so the cover never appears twice.
  const gallery = useMemo(() => {
    const urls: string[] = []
    if (product?.image_url) urls.push(product.image_url)
    for (const img of [...(product?.product_images ?? [])].sort((a, b) => a.position - b.position)) {
      if (!urls.includes(img.url)) urls.push(img.url)
    }
    return urls
  }, [product])

  if (loading) {
    return (
      <section className="section-x flex min-h-[50vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="section-x flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h2 className="text-3xl">Product not found</h2>
        <p className="my-4 text-muted">The product you're looking for doesn't exist.</p>
        <Link to="/shop">
          <button className="btn-primary">Back to Shop</button>
        </Link>
      </section>
    )
  }

  const wishlisted = isWishlisted(product.id)
  const outOfStock = product.stock <= 0

  function handleAddToCart() {
    if (!product || outOfStock) return
    if (product.sizes.length > 0 && !size) {
      setSizeError('Please select a size.')
      return
    }
    addToCart(product, quantity, size)
    setAdded(true)
  }

  function handleWishlist() {
    if (!product) return
    if (!user) {
      navigate('/login')
      return
    }
    toggle(product)
  }

  return (
    <>
      <section className="section-x flex flex-col gap-10 md:flex-row">
        <div className="w-full md:w-2/5">
          <ImageGallery images={gallery} alt={product.name} />
        </div>

        <div className="w-full pt-2 md:w-1/2">
          <h6 className="text-sm text-muted">Home / {product.categories?.name ?? 'Shop'}</h6>
          <h4 className="pb-2 pt-2 text-2xl font-semibold text-ink">{product.name}</h4>
          {product.rating && product.rating.count > 0 && (
            <a href="#reviews" className="mb-3 flex items-center gap-2 text-sm">
              <StarRating value={product.rating.average} />
              <span className="text-muted">
                {product.rating.average.toFixed(1)} ({product.rating.count} review
                {product.rating.count === 1 ? '' : 's'})
              </span>
            </a>
          )}
          <h2 className="text-[26px] font-semibold text-ink">{formatNaira(product.price)}</h2>
          <p className={`mt-2 text-sm font-semibold ${outOfStock ? 'text-accent' : 'text-primary'}`}>
            {outOfStock ? 'Out of stock' : `In stock (${product.stock} available)`}
          </p>

          {product.sizes.length > 0 && (
            <div className="mb-4 mt-4">
              <p className="mb-2 text-sm font-semibold text-muted">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const labelText = s.uk ? `US ${s.us} · UK ${s.uk}` : `US ${s.us}`
                  return (
                    <button
                      key={labelText}
                      type="button"
                      onClick={() => {
                        setSize(labelText)
                        setSizeError('')
                        setAdded(false)
                      }}
                      className={`rounded border px-3 py-2 text-sm transition ${
                        size === labelText
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#e1e1e1] text-ink hover:border-primary'
                      }`}
                    >
                      {labelText}
                    </button>
                  )
                })}
              </div>
              {sizeError && <p className="mt-1 text-xs text-accent">{sizeError}</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="number"
              min={1}
              max={product.stock || undefined}
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, Number(e.target.value) || 1))
                setAdded(false)
              }}
              className="h-[47px] w-[60px] rounded border border-[#e1e1e1] pl-2.5 text-base outline-none"
            />
            <button className="btn-primary" onClick={handleAddToCart} disabled={outOfStock}>
              {added ? 'Added to cart ✓' : 'Add to cart'}
            </button>
            <button
              onClick={handleWishlist}
              className={`flex h-[47px] w-[47px] items-center justify-center rounded border transition ${
                wishlisted
                  ? 'border-accent bg-accent text-white'
                  : 'border-[#e1e1e1] text-muted-2 hover:border-accent hover:text-accent'
              }`}
              aria-label="Toggle wishlist"
            >
              <i className={`${wishlisted ? 'fas' : 'far'} fa-heart`}></i>
            </button>
          </div>

          <h4 className="pb-2.5 pt-10 text-xl font-semibold text-ink">Product Details</h4>
          <span className="leading-relaxed text-muted">{product.description}</span>
        </div>
      </section>

      <div id="reviews" className="scroll-mt-24">
        <ReviewsSection productId={product.id} />
      </div>

      {related.length > 0 && (
        <section className="section-x text-center">
          <h2 className="text-3xl text-ink sm:text-[46px]">You May Also Like</h2>
          <p className="text-muted">Summer Collection New Modern Design</p>
          <div className="grid grid-cols-1 gap-7 pt-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-5">
            <button className="btn-primary" onClick={() => navigate('/cart')}>
              View Cart
            </button>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  )
}
