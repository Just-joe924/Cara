export const NAIRA = '₦'

/**
 * Format a price in naira. Kobo are hidden unless the value actually has them,
 * so the common case reads "₦12,500" rather than "₦12,500.00". Built on
 * toLocaleString rather than Intl currency formatting so the ₦ symbol is
 * guaranteed regardless of the browser's ICU data.
 */
export function formatNaira(value: number | string | null | undefined): string {
  const n = Number(value) || 0
  const hasKobo = Math.round(n * 100) % 100 !== 0
  return `${NAIRA}${n.toLocaleString('en-NG', {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}
