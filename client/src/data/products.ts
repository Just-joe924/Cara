import type { Product } from '../types'

const DESCRIPTION =
  'The Gildan Ultra Cotton T-shirt is made from a substantial 6.0 oz. per sq. yd. ' +
  'fabric constructed from 100% cotton, this classic fit preshrunk jersey knit provides ' +
  'unmatched comfort with each wear. Featuring a taped neck and shoulder, and a seamless ' +
  'double-needle collar, and available in a range of colors, it offers it all in the ' +
  'ultimate head-turning package.'

const GALLERY = [
  '/img/products/f1.jpg',
  '/img/products/f2.jpg',
  '/img/products/f3.jpg',
  '/img/products/f4.jpg',
]

interface Seed {
  brand: string
  name: string
  price: number
  rating: number
}

const featuredSeeds: Seed[] = [
  { brand: 'adidas', name: 'Cartoon Astronaut T-Shirt', price: 78, rating: 5 },
  { brand: 'adidas', name: 'Striped Crew Neck Tee', price: 65, rating: 4 },
  { brand: 'nike', name: 'Classic Sport T-Shirt', price: 82, rating: 5 },
  { brand: 'puma', name: 'Graphic Print Tee', price: 70, rating: 4 },
  { brand: 'adidas', name: 'Minimalist Logo Tee', price: 58, rating: 4 },
  { brand: 'gucci', name: 'Premium Cotton Shirt', price: 138, rating: 5 },
  { brand: 'zara', name: 'Relaxed Fit T-Shirt', price: 49, rating: 4 },
  { brand: 'h&m', name: 'Everyday Basic Tee', price: 39, rating: 4 },
]

const newSeeds: Seed[] = [
  { brand: 'adidas', name: 'Astronaut Print Tee', price: 78, rating: 5 },
  { brand: 'nike', name: 'Dri-FIT Training Tee', price: 88, rating: 5 },
  { brand: 'puma', name: 'Essential Logo Tee', price: 62, rating: 4 },
  { brand: 'zara', name: 'Oversized Street Tee', price: 54, rating: 4 },
  { brand: 'gucci', name: 'Embroidered Polo', price: 145, rating: 5 },
  { brand: 'adidas', name: 'Performance Crew Tee', price: 74, rating: 4 },
  { brand: 'levis', name: 'Vintage Wash T-Shirt', price: 69, rating: 5 },
  { brand: 'h&m', name: 'Soft Jersey Tee', price: 42, rating: 4 },
]

function build(seeds: Seed[], prefix: 'f' | 'n', category: Product['category']): Product[] {
  return seeds.map((seed, i) => {
    const image = `/img/products/${prefix}${i + 1}.jpg`
    return {
      id: prefix === 'f' ? i + 1 : 100 + i + 1,
      brand: seed.brand,
      name: seed.name,
      price: seed.price,
      rating: seed.rating,
      image,
      gallery: [image, ...GALLERY.filter((g) => g !== image)].slice(0, 4),
      category,
      description: DESCRIPTION,
    }
  })
}

export const featuredProducts: Product[] = build(featuredSeeds, 'f', 'featured')
export const newProducts: Product[] = build(newSeeds, 'n', 'new')

export const products: Product[] = [...featuredProducts, ...newProducts]

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id)
}
