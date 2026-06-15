import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product } from '../types'

interface CartContextValue {
  items: CartItem[]
  totalQuantity: number
  subtotal: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'cara-cart'

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  function removeFromCart(productId: number) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function setQuantity(productId: number, quantity: number) {
    const safe = Math.max(1, Math.floor(quantity) || 1)
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: safe } : i,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    return {
      items,
      totalQuantity,
      subtotal,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
