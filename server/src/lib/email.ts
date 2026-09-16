import { env } from './env.js'
import { formatNaira } from './money.js'
import { supabaseAdmin } from './supabaseAdmin.js'

export interface EmailResult {
  ok: boolean
  /** True when sending was skipped (no key / no recipient) rather than attempted. */
  skipped?: boolean
  status?: number
  id?: string
  error?: string
}

interface SendOptions {
  /** Where a reply goes — used so contact-form replies reach the sender. */
  replyTo?: string
}

/**
 * Transactional email via Resend (https://resend.com), called over its REST API
 * so we need no SDK dependency. Sending is best-effort: if RESEND_API_KEY is
 * unset or the request fails, we log and move on — email must never break an
 * order or a fulfillment update. Returns a result so callers (the contact form,
 * the test script) can report what happened; the order triggers ignore it.
 */
async function sendEmail(
  to: string | null,
  subject: string,
  html: string,
  options: SendOptions = {},
): Promise<EmailResult> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}"`)
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not set' }
  }
  if (!to) {
    console.warn(`[email] no recipient — skipping "${subject}"`)
    return { ok: false, skipped: true, error: 'no recipient' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    })
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}) for "${subject}": ${body.message ?? ''}`)
      return { ok: false, status: res.status, error: body.message ?? `HTTP ${res.status}` }
    }
    return { ok: true, status: res.status, id: body.id }
  } catch (err) {
    console.error(`[email] send error for "${subject}":`, err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// --- shared presentation ---------------------------------------------------

const BRAND = '#088178'
const INK = '#1a1a1a'
const MUTED = '#6b7280'
const LINE = '#e6eaf0'

/** Escape anything a person typed before it goes into an HTML email. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escape, then turn newlines into <br> so typed paragraphs survive. */
function escMultiline(value: unknown): string {
  return esc(value).replace(/\r?\n/g, '<br>')
}

interface LayoutOptions {
  /** Preview text shown next to the subject in the inbox list. */
  preheader: string
  heading: string
  /** Small line under the heading, e.g. an order reference. */
  subheading?: string
  bodyHtml: string
  cta?: { label: string; url: string }
  footerNote: string
}

/**
 * The shared email shell: Cara wordmark on white, a teal accent rule, then the
 * content. Table-based and inline-styled because that is what Outlook and the
 * Gmail app actually render.
 */
function layout(o: LayoutOptions): string {
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fa;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 12px;font-family:${font};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:26px 32px 18px;border-bottom:3px solid ${BRAND};">
                <img src="${esc(env.LOGO_URL)}" alt="Cara" height="30" style="display:block;height:30px;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 34px;color:${INK};">
                <h1 style="margin:0;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${esc(o.heading)}</h1>
                ${o.subheading ? `<p style="margin:6px 0 0;font-size:13px;color:${MUTED};">${esc(o.subheading)}</p>` : ''}
                <div style="margin-top:20px;font-size:15px;line-height:1.6;color:#374151;">${o.bodyHtml}</div>
                ${
                  o.cta
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;">
                         <tr><td style="border-radius:8px;background:${BRAND};">
                           <a href="${esc(o.cta.url)}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${esc(o.cta.label)}</a>
                         </td></tr>
                       </table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 22px;border-top:1px solid #f1f3f6;background:#fafbfc;color:#9099a8;font-size:12px;line-height:1.6;">
                ${esc(o.footerNote)}<br>
                <a href="${esc(env.CLIENT_ORIGIN)}" style="color:${BRAND};text-decoration:none;">Cara Marketplace</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** A label/value row used in the receipt's detail panel. */
function detailRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:5px 0;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:5px 0 5px 16px;font-size:13px;color:${INK};text-align:right;vertical-align:top;">${valueHtml}</td>
  </tr>`
}

/** Resolve the buyer's email + first name from the order's shipping snapshot, falling back to their auth email. */
async function resolveRecipient(
  shipping: Record<string, unknown> | null,
  userId: string | null,
): Promise<{ email: string | null; name: string }> {
  const s = shipping ?? {}
  let email = typeof s.email === 'string' ? s.email : null
  const fullName = typeof s.full_name === 'string' ? s.full_name : ''
  const name = fullName ? fullName.split(' ')[0] : 'there'
  if (!email && userId) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
    email = data?.user?.email ?? null
  }
  return { email, name }
}

// --- triggers --------------------------------------------------------------

interface ReceiptSeller {
  business_name: string
  brand_name: string | null
  address_line: string | null
  city: string | null
  state: string | null
  landmark: string | null
  phone: string | null
  phone_alt: string | null
}

export interface ReceiptOrder {
  id: string
  user_id: string | null
  status: string
  total_amount: number
  created_at: string
  payment_method: 'online' | 'pickup'
  fulfilment: 'delivery' | 'pickup'
  payment_reference: string | null
  shipping_address: Record<string, unknown> | null
  order_items: Array<{
    quantity: number
    price_at_purchase: number
    size: string | null
    products: { name: string; sellers: ReceiptSeller | null } | null
  }> | null
}

/** One block per distinct shop the buyer collects from. */
function pickupLocationsHtml(sellers: ReceiptSeller[]): string {
  if (sellers.length === 0) return ''
  const blocks = sellers
    .map((s) => {
      const where = [s.address_line, s.city, s.state].filter(Boolean).map(esc).join(', ')
      const phones = [s.phone, s.phone_alt].filter(Boolean).map(esc).join(' · ')
      return `<div style="margin-top:10px;">
        <strong style="color:${INK};">${esc(s.brand_name || s.business_name)}</strong><br>
        ${where ? `<span style="color:#374151;">${where}</span><br>` : ''}
        ${s.landmark ? `<span style="color:${MUTED};">Close to ${esc(s.landmark)}</span><br>` : ''}
        ${phones ? `<span style="color:${MUTED};">${phones}</span>` : ''}
      </div>`
    })
    .join('')
  return `<div style="margin-top:22px;padding:16px 18px;background:#f0f9f7;border-left:3px solid ${BRAND};border-radius:6px;font-size:14px;">
    <strong style="color:${INK};">Where to collect</strong>${blocks}
  </div>`
}

/**
 * Build the receipt's subject + HTML from order data alone. Kept pure and
 * exported so `npm run preview:email` can render it without touching the
 * database — and so the markup has exactly one home.
 */
export function buildOrderReceipt(order: ReceiptOrder, buyerName: string): { subject: string; html: string } {
  const shipping = order.shipping_address
  const items = order.order_items ?? []
  const name = buyerName

  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f6;font-size:14px;color:${INK};">
          ${esc(it.products?.name ?? 'Product')}
          ${it.size ? `<span style="color:${MUTED};"> (${esc(it.size)})</span>` : ''}
          <span style="color:${MUTED};"> × ${it.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f6;font-size:14px;color:${INK};text-align:right;white-space:nowrap;">
          ${esc(formatNaira(it.price_at_purchase * it.quantity))}
        </td>
      </tr>`,
    )
    .join('')

  const payOnPickup = order.payment_method === 'pickup'
  const ref = order.id.slice(0, 8).toUpperCase()
  const placed = new Date(order.created_at as string).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Deduplicate the shops behind the items, for the collection block.
  const sellers: ReceiptSeller[] = []
  for (const it of items) {
    const s = it.products?.sellers
    if (s && !sellers.some((existing) => existing.business_name === s.business_name)) sellers.push(s)
  }

  const address = [shipping?.address, shipping?.city, shipping?.state]
    .filter((v) => typeof v === 'string' && v.trim())
    .map(esc)
    .join(', ')

  const intro = payOnPickup
    ? `Hi ${esc(name)}, your order is reserved. We've set these items aside for you — bring this receipt and pay <strong>${esc(formatNaira(Number(order.total_amount)))}</strong> when you collect.`
    : `Hi ${esc(name)}, thank you — your payment came through and your order is confirmed.`

  const body = `
    <p style="margin:0 0 20px;">${intro}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid ${LINE};border-radius:8px;padding:14px 18px;">
      ${detailRow('Order', `<strong>#${esc(ref)}</strong>`)}
      ${detailRow('Date', esc(placed))}
      ${detailRow(
        'Payment',
        payOnPickup
          ? `<span style="color:#b26a00;font-weight:600;">Due on collection</span>`
          : `<span style="color:#059669;font-weight:600;">Paid online</span>`,
      )}
      ${order.payment_reference && !payOnPickup ? detailRow('Reference', esc(order.payment_reference)) : ''}
      ${detailRow('Collection', payOnPickup || order.fulfilment === 'pickup' ? 'Pick up in store' : 'Delivery')}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;">
      ${rows}
      <tr>
        <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:${INK};">Total</td>
        <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:${BRAND};text-align:right;white-space:nowrap;">
          ${esc(formatNaira(Number(order.total_amount)))}
        </td>
      </tr>
    </table>

    ${
      payOnPickup || order.fulfilment === 'pickup'
        ? pickupLocationsHtml(sellers)
        : address
          ? `<div style="margin-top:22px;padding:16px 18px;background:#fafbfc;border-left:3px solid ${BRAND};border-radius:6px;font-size:14px;">
               <strong style="color:${INK};">Delivering to</strong><br>
               <span style="color:#374151;">${address}</span>
             </div>`
          : ''
    }`

  return {
    subject: payOnPickup
      ? `Cara order #${ref} — reserved for pickup`
      : `Your Cara receipt — order #${ref}`,
    html: layout({
      preheader: payOnPickup
        ? `Order #${ref} is reserved. Pay ${formatNaira(Number(order.total_amount))} when you collect.`
        : `Receipt for order #${ref} — ${formatNaira(Number(order.total_amount))} paid.`,
      heading: payOnPickup ? 'Order reserved' : 'Payment received',
      subheading: `Order #${ref} · ${placed}`,
      bodyHtml: body,
      cta: { label: 'Track your order', url: `${env.CLIENT_ORIGIN}/account` },
      footerNote: "You're receiving this because you placed an order on Cara.",
    }),
  }
}

/**
 * Order receipt — sent when an order is paid online, and when a pay-on-pickup
 * order is reserved. Itemised, with the amount, how it is being paid, and either
 * the delivery address or the shop(s) to collect from.
 */
export async function sendOrderReceipt(orderId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, user_id, status, total_amount, created_at, payment_method, fulfilment, payment_reference, shipping_address, ' +
        'order_items(quantity, price_at_purchase, size, products(name, sellers(business_name, brand_name, address_line, city, state, landmark, phone, phone_alt)))',
    )
    .eq('id', orderId)
    .maybeSingle()

  // The join is deeper than supabase-js can infer from a non-literal select
  // string, so the shape is asserted here instead.
  const order = data as unknown as ReceiptOrder | null
  if (!order) return

  const { email, name } = await resolveRecipient(order.shipping_address, order.user_id)
  const { subject, html } = buildOrderReceipt(order, name)
  await sendEmail(email, subject, html)
}

/**
 * Per-item fulfillment email. Fires when a seller moves an item to `shipped`
 * ("ready / on its way") or `delivered` (a review request). Other statuses are ignored.
 */
export async function sendItemStatusEmail(orderItemId: string, status: string): Promise<void> {
  if (status !== 'shipped' && status !== 'delivered') return

  const { data: item } = await supabaseAdmin
    .from('order_items')
    .select('id, size, products(name, slug), orders(user_id, shipping_address, fulfilment)')
    .eq('id', orderItemId)
    .maybeSingle()
  if (!item) return

  const product = (item as unknown as { products: { name: string; slug: string } | null }).products
  const order = (item as unknown as {
    orders: { user_id: string; shipping_address: Record<string, unknown> | null; fulfilment: string | null } | null
  }).orders
  if (!product || !order) return

  const { email, name } = await resolveRecipient(order.shipping_address, order.user_id)
  const productName = product.name
  const isPickup = order.fulfilment === 'pickup'

  if (status === 'shipped') {
    const body = isPickup
      ? `<p style="margin:0;">Good news, ${esc(name)} — your <strong>${esc(productName)}</strong> is packed and ready for collection at the shop.</p>`
      : `<p style="margin:0;">Good news, ${esc(name)} — your <strong>${esc(productName)}</strong> is on its way.</p>`
    await sendEmail(
      email,
      isPickup ? 'Your Cara order is ready for pickup 🛍️' : 'Your Cara item has shipped 📦',
      layout({
        preheader: isPickup ? `${productName} is ready to collect.` : `${productName} is on its way.`,
        heading: isPickup ? 'Ready for collection' : 'Your order is on its way',
        bodyHtml: body,
        cta: { label: 'View order', url: `${env.CLIENT_ORIGIN}/account` },
        footerNote: "You're receiving this because you placed an order on Cara.",
      }),
    )
    return
  }

  // delivered → ask for a review
  const body = `
    <p style="margin:0 0 14px;">Hi ${esc(name)}, your <strong>${esc(productName)}</strong> is with you. We'd love to hear what you think!</p>
    <p style="margin:0;">A quick rating helps other shoppers and the sellers on Cara.</p>`
  await sendEmail(
    email,
    `How was your ${productName}? Leave a review ⭐`,
    layout({
      preheader: `Rate your ${productName} on Cara.`,
      heading: 'Enjoying your purchase?',
      bodyHtml: body,
      cta: { label: 'Write a review', url: `${env.CLIENT_ORIGIN}/product/${product.slug}#reviews` },
      footerNote: "You're receiving this because you placed an order on Cara.",
    }),
  )
}

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

/** Build the forwarded contact message. Pure, for the same reason as buildOrderReceipt. */
export function buildContactMessage(input: ContactInput): { subject: string; html: string } {
  const subject = input.subject.trim() || 'New contact form message'
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid ${LINE};border-radius:8px;padding:14px 18px;">
      ${detailRow('From', `<strong>${esc(input.name)}</strong>`)}
      ${detailRow('Email', `<a href="mailto:${esc(input.email)}" style="color:${BRAND};text-decoration:none;">${esc(input.email)}</a>`)}
      ${detailRow('Subject', esc(subject))}
    </table>

    <div style="margin-top:22px;padding:18px;background:#ffffff;border:1px solid ${LINE};border-radius:8px;font-size:15px;line-height:1.7;color:#374151;">
      ${escMultiline(input.message) || '<em style="color:#9099a8;">(no message body)</em>'}
    </div>

    <p style="margin:20px 0 0;font-size:13px;color:${MUTED};">Hit reply to respond to ${esc(input.name)} directly.</p>`

  return {
    subject: `[Cara contact] ${subject}`,
    html: layout({
      preheader: `${input.name} <${input.email}>: ${input.message.slice(0, 100)}`,
      heading: 'New message from the contact page',
      subheading: new Date().toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' }),
      bodyHtml: body,
      footerNote: 'Sent from the contact form on your Cara site.',
    }),
  }
}

/** Contact-form submission, forwarded to CONTACT_EMAIL_TO with reply-to set to the sender. */
export async function sendContactMessage(input: ContactInput): Promise<EmailResult> {
  if (!env.CONTACT_EMAIL_TO) {
    console.warn('[email] CONTACT_EMAIL_TO not set — cannot forward contact form')
    return { ok: false, skipped: true, error: 'CONTACT_EMAIL_TO not set' }
  }
  const { subject, html } = buildContactMessage(input)
  return sendEmail(env.CONTACT_EMAIL_TO, subject, html, { replyTo: input.email })
}

/** Diagnostic send to confirm RESEND_API_KEY + EMAIL_FROM work end-to-end. */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  const body = `
    <p style="margin:0 0 12px;">This is a test email from your Cara server.</p>
    <p style="margin:0;">If you're reading this, <strong>RESEND_API_KEY</strong> and <strong>EMAIL_FROM</strong> are configured correctly. 🎉</p>`
  return sendEmail(
    to,
    'Cara email test ✅',
    layout({
      preheader: 'Your Cara email configuration works.',
      heading: 'Email is working',
      bodyHtml: body,
      cta: { label: 'Go to Cara', url: env.CLIENT_ORIGIN },
      footerNote: 'Diagnostic email from your Cara server.',
    }),
  )
}
