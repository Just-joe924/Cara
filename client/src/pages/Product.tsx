import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import { getProductBySlug, listRelated } from '../api/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
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
    addToCart(product, quantity)
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
          <img className="w-full rounded-lg" src={product.image_url ?? ''} alt={product.name} />
        </div>

        <div className="w-full pt-2 md:w-1/2">
          <h6 className="text-sm text-muted">Home / {product.categories?.name ?? 'Shop'}</h6>
          <h4 className="pb-5 pt-2 text-2xl font-semibold text-ink">{product.name}</h4>
          <h2 className="text-[26px] font-semibold text-ink">${product.price}</h2>
          <p className={`mt-2 text-sm font-semibold ${outOfStock ? 'text-accent' : 'text-primary'}`}>
            {outOfStock ? 'Out of stock' : `In stock (${product.stock} available)`}
          </p>

          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mb-2.5 mt-4 block rounded border border-[#e1e1e1] px-2.5 py-1.5 outline-none"
          >
            <option value="">Select Size</option>
            <option value="S">Small</option>
            <option value="L">Large</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>

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
