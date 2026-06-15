import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

export default function Wishlist() {
  const { items, loading, toggle } = useWishlist()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#wishlist</h2>
        <p className="text-white">The pieces you've saved for later</p>
      </section>

      <section className="section-x">
        {loading ? (
          <p className="text-muted">Loading your wishlist…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <i className="fa-regular fa-heart mb-4 text-5xl text-primary-border"></i>
            <h4 className="mb-4 text-xl">Your wishlist is empty.</h4>
            <Link to="/shop">
              <button className="btn-primary">Browse Products</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <div key={product.id} className="pro-card w-full">
                <img
                  className="w-full rounded-[20px]"
                  src={product.image_url ?? ''}
                  alt={product.name}
                  onClick={() => navigate(`/product/${product.slug}`)}
                />
                <div className="py-2.5 text-start">
                  <span className="text-xs text-muted-2">{product.categories?.name ?? ''}</span>
                  <h5 className="pt-[7px] text-sm text-[#1a1a1a]">{product.name}</h5>
                  <h4 className="pt-[7px] text-[15px] font-bold text-primary">
                    ${product.price}
                  </h4>
                </div>
                <div className="absolute bottom-5 right-2.5 flex gap-2">
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-border bg-primary-soft text-primary transition hover:bg-primary hover:text-white"
                    aria-label="Add to cart"
                    onClick={() => addToCart(product)}
                  >
                    <i className="fas fa-shopping-cart"></i>
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-border bg-white text-accent transition hover:bg-accent hover:text-white"
                    aria-label="Remove from wishlist"
                    onClick={() => toggle(product)}
                  >
                    <i className="fas fa-heart"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
