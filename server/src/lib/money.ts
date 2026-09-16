export const NAIRA = '₦'

/**
 * Format a price in naira for emails and API text. Mirrors the client's
 * `client/src/lib/money.ts` so a receipt reads exactly like the checkout page.
 * Kobo are hidden unless the value actually has them.
 */
export function formatNaira(value: number | string | null | undefined): string {
  const n = Number(value) || 0
  const hasKobo = Math.round(n * 100) % 100 !== 0
  return `${NAIRA}${n.toLocaleString('en-NG', {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Paystack charges in kobo — the smallest denomination. */
export function toKobo(naira: number): number {
  return Math.round(Number(naira) * 100)
}
