import { type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import StarRating from './StarRating'

export default function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()

  function handleAddToCart(e: MouseEvent) {
    e.stopPropagation() // don't navigate to the product page
    addToCart(product)
  }

  return (
    <div className="pro-card w-full" onClick={() => navigate(`/product/${product.id}`)}>
      <img className="w-full rounded-[20px]" src={product.image} alt={product.name} />
      <div className="py-2.5 text-start">
        <span className="text-xs text-muted-2">{product.brand}</span>
        <h5 className="pt-[7px] text-sm text-[#1a1a1a]">{product.name}</h5>
        <StarRating rating={product.rating} />
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
