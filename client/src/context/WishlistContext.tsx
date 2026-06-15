import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../types'
import { useAuth } from './AuthContext'
import { addWishlist, fetchWishlist, removeWishlist } from '../api/wishlist'

interface WishlistContextValue {
  items: Product[]
  ids: Set<string>
  loading: boolean
  isWishlisted: (productId: string) => boolean
  toggle: (product: Product) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    fetchWishlist(user.id)
      .then((list) => {
        if (active) setItems(list)
      })
      .catch((err) => console.error('Wishlist load failed:', err))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const ids = new Set(items.map((p) => p.id))

  function isWishlisted(productId: string) {
    return ids.has(productId)
  }

  async function toggle(product: Product) {
    if (!user) return
    if (ids.has(product.id)) {
      await removeWishlist(user.id, product.id)
      setItems((prev) => prev.filter((p) => p.id !== product.id))
    } else {
      await addWishlist(user.id, product.id)
      setItems((prev) => [...prev, product])
    }
  }

  return (
    <WishlistContext.Provider value={{ items, ids, loading, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
