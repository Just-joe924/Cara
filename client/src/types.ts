export interface Product {
  id: number
  brand: string
  name: string
  price: number
  rating: number // 0–5, rendered as stars
  image: string
  /** Additional gallery thumbnails for the single-product page. */
  gallery: string[]
  category: 'featured' | 'new'
  description: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface BlogPost {
  id: number
  title: string
  excerpt: string
  image: string
  date: string // e.g. "13/01"
}
