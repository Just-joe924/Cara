/**
 * Product description generator.
 *
 * Default implementation is a deterministic TEMPLATE — no external API, no keys,
 * no cost. It composes a clean, buyer-facing description from the fields a seller
 * provides. If you ever want true AI generation (e.g. reading the product photo),
 * swap the body of `generateDescription` to call an LLM when a key is configured;
 * the rest of the app calls this one function and won't need to change.
 */

export interface DescribeInput {
  name?: string
  brand?: string | null
  category?: string | null
  condition?: string | null
  features?: string | null
  price?: number | null
}

export function generateDescription(input: DescribeInput): string {
  return composeTemplate(input)
}

function composeTemplate(input: DescribeInput): string {
  const name = (input.name ?? 'This product').trim()
  const brand = input.brand?.trim()
  const category = input.category?.trim().toLowerCase()
  const condition = input.condition?.trim().toLowerCase()
  const price = typeof input.price === 'number' && input.price > 0 ? input.price : null

  const featureList = (input.features ?? '')
    .split(/[,;\n]/)
    .map((f) => f.trim())
    .filter(Boolean)

  const sentences: string[] = []

  sentences.push(brand ? `Meet the ${name} by ${brand}.` : `Meet the ${name}.`)

  const descriptor = [condition, category].filter(Boolean).join(' ')
  if (descriptor) {
    sentences.push(
      `${capitalize(articleFor(descriptor))} ${descriptor} crafted to bring quality and style to your everyday.`,
    )
  } else {
    sentences.push('Thoughtfully made to bring quality and style to your everyday.')
  }

  if (featureList.length) {
    sentences.push(`Highlights include ${joinWithAnd(featureList)}.`)
  }

  sentences.push(
    price ? `Yours for $${price.toFixed(2)} — add it to your cart today.` : 'Add it to your cart today.',
  )

  return sentences.join(' ')
}

function articleFor(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function joinWithAnd(items: string[]): string {
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
