import { env } from './env.js'
import { supabaseAdmin } from './supabaseAdmin.js'

/**
 * Transactional email via Resend (https://resend.com), called over its REST API
 * so we need no SDK dependency. Sending is best-effort: if RESEND_API_KEY is
 * unset or the request fails, we log and move on — email must never break an
 * order or a fulfillment update.
 */
async function sendEmail(to: string | null, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}"`)
    return
  }
  if (!to) {
    console.warn(`[email] no recipient — skipping "${subject}"`)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] send failed (${res.status}) for "${subject}": ${body}`)
    }
  } catch (err) {
    console.error(`[email] send error for "${subject}":`, err)
  }
}

// --- shared presentation ---------------------------------------------------

const money = (n: number) => `$${Number(n).toFixed(2)}`

function layout(heading: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `
  <div style="background:#f5f7fa;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6eaf0;">
      <div style="background:#088178;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:700;">Cara</div>
      <div style="padding:28px;color:#1a1a1a;">
        <h1 style="margin:0 0 12px;font-size:20px;">${heading}</h1>
        ${bodyHtml}
        <a href="${ctaUrl}" style="display:inline-block;margin-top:22px;background:#088178;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;">${ctaLabel}</a>
      </div>
      <div style="padding:18px 28px;border-top:1px solid #f0f0f0;color:#8a8a8a;font-size:12px;">
        You're receiving this because you placed an order at Cara.
      </div>
    </div>
  </div>`
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

/** Order confirmation — sent when an order is placed (COD) or paid (card). */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, total_amount, shipping_address, order_items(quantity, price_at_purchase, size, products(name))')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return

  const { email, name } = await resolveRecipient(order.shipping_address as Record<string, unknown> | null, order.user_id)
  const items = (order.order_items ?? []) as unknown as Array<{ quantity: number; price_at_purchase: number; size: string | null; products: { name: string } | null }>

  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:6px 0;">${it.products?.name ?? 'Product'}${it.size ? ` <span style="color:#8a8a8a;">(${it.size})</span>` : ''} × ${it.quantity}</td><td style="padding:6px 0;text-align:right;">${money(it.price_at_purchase * it.quantity)}</td></tr>`,
    )
    .join('')

  const body = `
    <p style="margin:0 0 16px;color:#555;">Hi ${name}, thanks for your order! We've received it and it's now being processed.</p>
    <p style="margin:0 0 8px;font-weight:600;">Order #${order.id.slice(0, 8)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
      <tr><td style="padding:10px 0 0;border-top:1px solid #f0f0f0;font-weight:700;">Total</td><td style="padding:10px 0 0;border-top:1px solid #f0f0f0;text-align:right;font-weight:700;">${money(Number(order.total_amount))}</td></tr>
    </table>`

  await sendEmail(email, `Your Cara order #${order.id.slice(0, 8)} is confirmed`, layout('Order confirmed 🎉', body, 'Track your order', `${env.CLIENT_ORIGIN}/account`))
}

/**
 * Per-item fulfillment email. Fires when a seller moves an item to `shipped`
 * ("on its way") or `delivered` (a review request). Other statuses are ignored.
 */
export async function sendItemStatusEmail(orderItemId: string, status: string): Promise<void> {
  if (status !== 'shipped' && status !== 'delivered') return

  const { data: item } = await supabaseAdmin
    .from('order_items')
    .select('id, size, products(name, slug), orders(user_id, shipping_address)')
    .eq('id', orderItemId)
    .maybeSingle()
  if (!item) return

  const product = (item as unknown as { products: { name: string; slug: string } | null }).products
  const order = (item as unknown as { orders: { user_id: string; shipping_address: Record<string, unknown> | null } | null }).orders
  if (!product || !order) return

  const { email, name } = await resolveRecipient(order.shipping_address, order.user_id)
  const productName = product.name

  if (status === 'shipped') {
    const body = `<p style="margin:0 0 16px;color:#555;">Good news, ${name}! Your item <strong>${productName}</strong> is on its way.</p>`
    await sendEmail(email, `Your Cara item has shipped 📦`, layout('Your order is on its way', body, 'View order', `${env.CLIENT_ORIGIN}/account`))
    return
  }

  // delivered → ask for a review
  const reviewUrl = `${env.CLIENT_ORIGIN}/product/${product.slug}#reviews`
  const body = `
    <p style="margin:0 0 16px;color:#555;">Hi ${name}, your <strong>${productName}</strong> has been delivered. We'd love to hear what you think!</p>
    <p style="margin:0 0 4px;color:#555;">A quick rating helps other shoppers and the sellers on Cara.</p>`
  await sendEmail(email, `How was your ${productName}? Leave a review ⭐`, layout('Enjoying your purchase?', body, 'Write a review', reviewUrl))
}
