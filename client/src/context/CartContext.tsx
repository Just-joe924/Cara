import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product } from '../types'
import { useAuth } from './AuthContext'
import { clearCartDb, fetchCart, removeCartItem, setCartItem } from '../api/cart'

interface CartContextValue {
  items: CartItem[]
  totalQuantity: number
  subtotal: number
  loading: boolean
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const GUEST_KEY = 'cara-cart-guest'

function loadGuest(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveGuest = (items: CartItem[]) => localStorage.setItem(GUEST_KEY, JSON.stringify(items))
const clearGuest = () => localStorage.removeItem(GUEST_KEY)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load the cart for the current identity. When a guest signs in, their
  // local cart is merged into the database cart, then cleared locally.
  useEffect(() => {
    let active = true
    const userId = user?.id ?? null

    async function sync() {
      setLoading(true)
      if (!userId) {
        if (active) setItems(loadGuest())
        if (active) setLoading(false)
        return
      }

      const guest = loadGuest()
      const dbItems = await fetchCart(userId)

      if (guest.length === 0) {
        if (active) setItems(dbItems)
        if (active) setLoading(false)
        return
      }

      // Merge guest cart into DB cart (sum quantities per product).
      const merged = new Map<string, CartItem>()
      for (const it of dbItems) merged.set(it.product.id, it)
      for (const g of guest) {
        const existing = merged.get(g.product.id)
        merged.set(g.product.id, {
          product: existing?.product ?? g.product,
          quantity: (existing?.quantity ?? 0) + g.quantity,
        })
      }
      await Promise.all(
        [...merged.values()].map((it) => setCartItem(userId, it.product.id, it.quantity)),
      )
      clearGuest()
      if (active) setItems([...merged.values()])
      if (active) setLoading(false)
    }

    sync().catch((err) => {
      console.error('Cart sync failed:', err)
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user?.id])

  async function addToCart(product: Product, quantity = 1) {
    const existing = items.find((i) => i.product.id === product.id)
    const newQty = (existing?.quantity ?? 0) + quantity
    if (user) await setCartItem(user.id, product.id, newQty)
    setItems((prev) => {
      const found = prev.some((i) => i.product.id === product.id)
      const next = found
        ? prev.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty } : i))
        : [...prev, { product, quantity: newQty }]
      if (!user) saveGuest(next)
      return next
    })
  }

  async function setQuantity(productId: string, quantity: number) {
    const safe = Math.max(1, Math.floor(quantity) || 1)
    if (user) await setCartItem(user.id, productId, safe)
    setItems((prev) => {
      const next = prev.map((i) => (i.product.id === productId ? { ...i, quantity: safe } : i))
      if (!user) saveGuest(next)
      return next
    })
  }

  async function removeFromCart(productId: string) {
    if (user) await removeCartItem(user.id, productId)
    setItems((prev) => {
      const next = prev.filter((i) => i.product.id !== productId)
      if (!user) saveGuest(next)
      return next
    })
  }

  async function clearCart() {
    if (user) await clearCartDb(user.id)
    else clearGuest()
    setItems([])
  }

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    return {
      items,
      totalQuantity,
      subtotal,
      loading,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading, user])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
