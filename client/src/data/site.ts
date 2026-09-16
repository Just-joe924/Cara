/**
 * Cara's own contact details, shown in the footer and on the contact page.
 * Edit here and both places update.
 */
export const SITE_CONTACT = {
  address: 'Wale Abodunrin Close, Ade-oni Estate, Ojodu, Lagos, Nigeria',
  email: 'theemmanueljohnson@gmail.com',
  phone: '+234 705 489 4115',
}

/**
 * Google Maps embed for the contact page. The `q=…&output=embed` form needs no
 * API key — to move the pin, just change the address above and keep it in sync
 * here, or paste a different query.
 */
export const SITE_MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(
  SITE_CONTACT.address,
)}&output=embed`
