import type { Category, CategoryGroup } from '../types'

/**
 * Fold a flat category list into top-level groups with their leaves.
 *
 * Sellers only ever pick a leaf. Top-level names like "Electronics" are too
 * vague to categorise against — a smartwatch fits several — so they exist to
 * organise the dropdown, not to be chosen.
 */
export function groupCategories(all: Category[]): CategoryGroup[] {
  const groups = all
    .filter((c) => c.parent_id === null)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))

  return groups
    .map((group) => ({
      group,
      children: all
        .filter((c) => c.parent_id === group.id)
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.children.length > 0)
}

/** Every leaf, flattened — useful for lookups by id or slug. */
export function leafCategories(all: Category[]): Category[] {
  return all.filter((c) => c.parent_id !== null)
}

/**
 * Slugs matched when filtering the shop by `slug`: the category itself plus,
 * if it is a group, all of its leaves. Lets a shopper pick "Electronics" and
 * see everything underneath it.
 */
export function slugsUnder(all: Category[], slug: string): string[] {
  const match = all.find((c) => c.slug === slug)
  if (!match) return [slug]
  const children = all.filter((c) => c.parent_id === match.id).map((c) => c.slug)
  return [match.slug, ...children]
}

/**
 * Keyword hints, leaf slug → words that strongly imply it. Used only to
 * PRE-SELECT a category the seller can change — never to overrule them. Keep
 * the words specific; a vague hint that fires often is worse than no hint.
 */
const HINTS: Record<string, string[]> = {
  'mobile-phones': ['iphone', 'samsung galaxy', 'smartphone', 'android phone', 'tecno', 'infinix', 'itel'],
  'phone-accessories': ['phone case', 'screen protector', 'pop socket', 'phone holder'],
  'power-banks-chargers': ['power bank', 'charger', 'charging cable', 'adapter'],
  'laptops-computers': ['laptop', 'macbook', 'notebook pc', 'desktop pc', 'monitor'],
  'audio-headphones': ['headphone', 'earbud', 'airpod', 'earphone', 'speaker', 'soundbar'],
  tablets: ['ipad', 'tablet'],
  cameras: ['camera', 'dslr', 'camcorder'],
  gaming: ['playstation', 'xbox', 'nintendo', 'game console', 'gamepad'],
  watches: ['wristwatch', 'watch', 'smartwatch'],
  jewellery: ['necklace', 'bracelet', 'earring', 'anklet', 'pendant', 'ring'],
  eyewear: ['sunglasses', 'eyeglasses', 'spectacles', 'goggles'],
  'belts-hats-scarves': ['belt', 'cap', 'hat', 'scarf', 'headwrap', 'gele'],
  'bags-luggage': ['handbag', 'backpack', 'suitcase', 'tote', 'purse', 'duffel'],
  'womens-shoes': ['heels', 'stiletto', 'wedges', 'ladies shoe'],
  'mens-shoes': ['loafer', 'oxford shoe', 'brogue', 'men shoe'],
  'kids-shoes': ['kids shoe', 'children shoe'],
  'womens-clothing': ['dress', 'blouse', 'skirt', 'gown', 'jumpsuit'],
  'mens-clothing': ['shirt', 'trouser', 'suit', 'kaftan', 'polo'],
  'kids-clothing': ['kids wear', 'children wear', 'baby clothes', 'romper'],
  'traditional-ankara': ['ankara', 'aso oke', 'adire', 'agbada', 'kente', 'lace fabric'],
  'underwear-sleepwear': ['underwear', 'boxers', 'bra', 'pyjama', 'pajama', 'nightwear'],
  sportswear: ['jersey', 'tracksuit', 'sportswear', 'sneaker', 'trainers'],
  'fitness-equipment': ['dumbbell', 'treadmill', 'yoga mat', 'skipping rope'],
  skincare: ['moisturiser', 'moisturizer', 'body lotion', 'face wash', 'serum', 'sunscreen'],
  'haircare-wigs': ['wig', 'weavon', 'hair extension', 'shampoo', 'hair cream', 'braiding hair'],
  makeup: ['lipstick', 'foundation', 'mascara', 'eyeshadow', 'makeup'],
  fragrance: ['perfume', 'cologne', 'body spray', 'fragrance'],
  'personal-care': ['soap', 'toothpaste', 'deodorant', 'sanitary'],
  furniture: ['sofa', 'chair', 'table', 'wardrobe', 'bed frame', 'shelf'],
  'kitchen-dining': ['cookware', 'pot set', 'blender', 'cutlery', 'plate set', 'kettle'],
  'bedding-bath': ['bedsheet', 'duvet', 'pillow', 'towel', 'mattress'],
  'home-decor': ['wall art', 'curtain', 'rug', 'vase', 'lamp', 'mirror'],
  'home-appliances': ['microwave', 'refrigerator', 'freezer', 'washing machine', 'fan', 'air conditioner'],
  'foodstuff-provisions': ['rice', 'beans', 'garri', 'yam flour', 'palm oil', 'spaghetti'],
  snacks: ['chin chin', 'biscuit', 'plantain chips', 'snack'],
  beverages: ['juice', 'soft drink', 'malt', 'tea', 'coffee', 'water'],
  'baby-gear': ['stroller', 'baby carrier', 'car seat', 'diaper', 'feeding bottle'],
  'toys-games': ['toy', 'puzzle', 'lego', 'doll', 'board game'],
  'school-supplies': ['school bag', 'lunch box', 'school uniform'],
  books: ['novel', 'textbook', 'book'],
  stationery: ['notebook', 'biro', 'pen set', 'stapler', 'envelope'],
  'musical-instruments': ['guitar', 'keyboard piano', 'drum set', 'violin'],
  tailoring: ['tailoring', 'alteration', 'bespoke sewing'],
  repairs: ['repair', 'servicing', 'fixing'],
  'events-rentals': ['event rental', 'canopy rental', 'party rental'],
}

/**
 * Best-guess leaf category id for a product name, or null when nothing matches
 * confidently. The longest matching keyword wins, so "phone case" beats "phone".
 */
export function suggestCategoryId(name: string, all: Category[]): string | null {
  const text = name.toLowerCase().trim()
  if (text.length < 3) return null

  let bestSlug: string | null = null
  let bestLength = 0

  for (const [slug, words] of Object.entries(HINTS)) {
    for (const word of words) {
      if (word.length > bestLength && text.includes(word)) {
        bestSlug = slug
        bestLength = word.length
      }
    }
  }

  if (!bestSlug) return null
  return all.find((c) => c.slug === bestSlug)?.id ?? null
}
