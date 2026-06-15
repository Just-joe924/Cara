export interface Category {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  is_active: boolean
  created_at: string
  /** Joined category (when the query selects `categories(name, slug)`). */
  categories?: Pick<Category, 'name' | 'slug'> | null
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price_at_purchase: number
  products?: Pick<Product, 'name' | 'image_url' | 'slug'> | null
}

export interface Order {
  id: string
  user_id: string
  status: string
  total_amount: number
  shipping_address: Record<string, unknown> | null
  created_at: string
  order_items?: OrderItem[]
}

export interface BlogPost {
  id: number
  title: string
  excerpt: string
  image: string
  date: string // e.g. "13/01"
}
