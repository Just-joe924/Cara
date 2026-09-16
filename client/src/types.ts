export interface Category {
  id: string
  name: string
  slug: string
}

export interface Seller {
  id: string
  user_id: string
  business_name: string
  brand_name: string | null
  business_type: string | null
  description: string | null
  logo_url: string | null
  email: string | null
  phone: string | null
  /** Optional second line — WhatsApp or an alternate number. */
  phone_alt: string | null
  /** Street address of the physical shop buyers collect from. */
  address_line: string | null
  city: string | null
  state: string | null
  /** Optional "close to …" hint. */
  landmark: string | null
  website: string | null
  is_active: boolean
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  position: number
  created_at: string
}

/** A size option offered by a seller (UK is optional). */
export interface ProductSize {
  us: string
  uk?: string | null
}

/** Aggregate rating for a product (from the `product_ratings` view). */
export interface ProductRating {
  average: number
  count: number
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  author_name: string | null
  rating: number
  comment: string | null
  verified: boolean
  created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  seller_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  is_active: boolean
  sizes: ProductSize[]
  created_at: string
  /** Aggregate rating, attached by the products API layer when available. */
  rating?: ProductRating
  /** Joined category (when the query selects `categories(name, slug)`). */
  categories?: Pick<Category, 'name' | 'slug'> | null
  /** Joined seller (when the query selects `sellers(...)`). */
  sellers?: Pick<Seller, 'id' | 'brand_name' | 'business_name'> | null
  /** Joined gallery (when the query selects `product_images(...)`). */
  product_images?: ProductImage[]
}

export interface CartItem {
  product: Product
  quantity: number
  /** Selected size label (e.g. "US M · UK 12"); '' when the product has no sizes. */
  size: string
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
  size?: string
  status?: string
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
