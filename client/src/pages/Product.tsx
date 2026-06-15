import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import { getProductById, products } from '../data/products'
import { useCart } from '../context/CartContext'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const product = getProductById(Number(id))

  const [mainImg, setMainImg] = useState(product?.image ?? '')
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  // Reset local state whenever the route param changes to a new product.
  useEffect(() => {
    if (product) {
      setMainImg(product.image)
      setSize('')
      setQuantity(1)
      setAdded(false)
    }
  }, [product])

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

  const related = products.filter((p) => p.id !== product.id).slice(0, 4)

  function handleAddToCart() {
    if (!product) return
    addToCart(product, quantity)
    setAdded(true)
  }

  return (
    <>
      <section className="section-x flex flex-col gap-10 md:flex-row">
        <div className="w-full md:w-2/5">
          <img className="w-full" src={mainImg} alt={product.name} />
          <div className="mt-4 flex justify-between gap-2">
            {product.gallery.map((img) => (
              <div key={img} className="basis-[24%] cursor-pointer">
                <img
                  src={img}
                  alt={product.name}
                  className={`w-full rounded ${img === mainImg ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setMainImg(img)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full pt-2 md:w-1/2">
          <h6 className="text-sm text-muted">
            Home / {product.category === 'new' ? 'New Arrivals' : 'Featured'}
          </h6>
          <h4 className="pb-5 pt-2 text-2xl font-semibold text-ink">{product.name}</h4>
          <h2 className="text-[26px] font-semibold text-ink">${product.price}</h2>
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
          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, Number(e.target.value) || 1))
                setAdded(false)
              }}
              className="h-[47px] w-[60px] rounded border border-[#e1e1e1] pl-2.5 text-base outline-none"
            />
            <button className="btn-primary" onClick={handleAddToCart}>
              {added ? 'Added to cart ✓' : 'Add to cart'}
            </button>
          </div>
          <h4 className="pb-2.5 pt-10 text-xl font-semibold text-ink">Product Details</h4>
          <span className="leading-relaxed text-muted">{product.description}</span>
        </div>
      </section>

      <section className="section-x text-center">
        <h2 className="text-3xl text-ink sm:text-[46px]">Featured Products</h2>
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

      <Newsletter />
    </>
  )
}
