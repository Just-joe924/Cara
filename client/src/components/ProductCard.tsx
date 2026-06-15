import { type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'

export default function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isWishlisted, toggle } = useWishlist()

  const wishlisted = isWishlisted(product.id)

  function handleAddToCart(e: MouseEvent) {
    e.stopPropagation()
    addToCart(product)
  }

  function handleWishlist(e: MouseEvent) {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    toggle(product)
  }

  return (
    <div className="pro-card w-full" onClick={() => navigate(`/product/${product.slug}`)}>
      <button
        className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-primary-border bg-white transition ${
          wishlisted ? 'text-accent' : 'text-muted-2 hover:text-accent'
        }`}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={handleWishlist}
      >
        <i className={`${wishlisted ? 'fas' : 'far'} fa-heart`}></i>
      </button>
      <img
        className="aspect-square w-full rounded-[20px] object-cover"
        src={product.image_url ?? ''}
        alt={product.name}
      />
      <div className="py-2.5 text-start">
        <span className="text-xs text-muted-2">{product.categories?.name ?? ''}</span>
        <h5 className="line-clamp-1 pt-[7px] text-sm text-[#1a1a1a]">{product.name}</h5>
        <h4 className="pt-[7px] text-[15px] font-bold text-primary">${product.price}</h4>
      </div>
      <button
        className="absolute bottom-5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-primary-border bg-primary-soft text-primary transition hover:bg-primary hover:text-white"
        aria-label={`Add ${product.name} to cart`}
        onClick={handleAddToCart}
      >
        <i className="fas fa-shopping-cart"></i>
      </button>
    </div>
  )
}
