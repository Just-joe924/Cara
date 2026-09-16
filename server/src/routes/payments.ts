import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../lib/env.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import {
  initializeTransaction,
  newReference,
  paystackEnabled,
  verifyTransaction,
  verifyWebhookSignature,
} from '../lib/paystack.js'
import {
  OrderError,
  assertStock,
  computeTotal,
  createOrderWithItems,
  loadCartLines,
  markOrderPaid,
} from '../services/orders.js'

export const paymentsRouter = Router()

/**
 * POST /api/checkout/session — create a pending order from the cart and open a
 * Paystack transaction for it. Returns the hosted checkout URL to redirect to.
 * Prices come from the DB, never the request body.
 */
paymentsRouter.post('/checkout/session', requireAuth, async (req: Request, res: Response) => {
  if (!paystackEnabled()) return res.status(501).json({ error: 'Paystack is not configured' })
  const userId = req.user!.id
  const shipping = (req.body?.shipping_address ?? null) as Record<string, unknown> | null

  const email = typeof shipping?.email === 'string' ? shipping.email.trim() : ''
  if (!email) return res.status(400).json({ error: 'An email address is required to pay online' })

  try {
    const lines = await loadCartLines(userId)
    assertStock(lines)

    const fulfilment = shipping?.fulfilment === 'pickup' ? 'pickup' : 'delivery'
    const reference = newReference()
    const { order } = await createOrderWithItems(userId, shipping, lines, 'pending', {
      payment_method: 'online',
      fulfilment,
      payment_reference: reference,
    })

    const transaction = await initializeTransaction({
      email,
      amountNaira: computeTotal(lines),
      reference,
      callbackUrl: `${env.CLIENT_ORIGIN}/checkout/success`,
      metadata: {
        order_id: order.id,
        user_id: userId,
        custom_fields: [
          { display_name: 'Order', variable_name: 'order', value: order.id.slice(0, 8) },
        ],
      },
    })

    return res.json({ url: transaction.authorization_url, reference, order_id: order.id })
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.status).json({ error: err.message, items: err.extra })
    }
    console.error('checkout/session error:', err)
    return res.status(500).json({ error: 'Failed to start checkout' })
  }
})

/**
 * GET /api/checkout/verify?reference=... — confirm a transaction was paid and
 * fulfill its order. Lets the success page finalize without depending on the
 * webhook (which needs a public URL, so it won't fire in local dev). Idempotent.
 */
paymentsRouter.get('/checkout/verify', requireAuth, async (req: Request, res: Response) => {
  if (!paystackEnabled()) return res.status(501).json({ error: 'Paystack is not configured' })
  const reference = String(req.query.reference ?? '')
  if (!reference) return res.status(400).json({ error: 'Missing reference' })

  try {
    const tx = await verifyTransaction(reference)
    if (tx.metadata?.user_id && tx.metadata.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'This transaction does not belong to you' })
    }

    const orderId = tx.metadata?.order_id ?? (await orderIdForReference(reference))
    if (!orderId) return res.status(404).json({ error: 'Order not found for this reference' })

    const paid = tx.status === 'success'
    if (paid) await fulfilIfAmountMatches(orderId, tx.amount, reference)
    return res.json({ paid, order_id: orderId })
  } catch (err) {
    console.error('checkout/verify error:', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
})

/**
 * Paystack webhook. Mounted in index.ts with a raw body parser — the signature
 * is an HMAC over the exact bytes. This is the authoritative fulfillment path in
 * production; /checkout/verify is the belt-and-braces one.
 */
export async function paystackWebhookHandler(req: Request, res: Response) {
  if (!paystackEnabled()) return res.status(501).json({ error: 'Paystack is not configured' })

  const raw = req.body as Buffer
  if (!verifyWebhookSignature(raw, req.headers['x-paystack-signature'] as string | undefined)) {
    return res.status(401).send('Invalid signature')
  }

  // Acknowledge immediately — Paystack retries on anything but a 200, and we do
  // not want a slow fulfillment to look like a delivery failure.
  res.sendStatus(200)

  try {
    const event = JSON.parse(raw.toString('utf8')) as {
      event: string
      data: { reference: string; amount: number; metadata?: { order_id?: string } }
    }
    if (event.event !== 'charge.success') return

    const reference = event.data.reference
    const orderId = event.data.metadata?.order_id ?? (await orderIdForReference(reference))
    if (orderId) await fulfilIfAmountMatches(orderId, event.data.amount, reference)
  } catch (err) {
    console.error('paystack webhook error:', err)
  }
}

/** Look an order up by the reference stamped on it when checkout started. */
async function orderIdForReference(reference: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('payment_reference', reference)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Fulfill only when the amount Paystack actually collected covers the order
 * total. Guards against an order being mutated between initialize and payment.
 */
async function fulfilIfAmountMatches(orderId: string, amountKobo: number, reference: string): Promise<void> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('total_amount')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return

  const expectedKobo = Math.round(Number(order.total_amount) * 100)
  if (amountKobo < expectedKobo) {
    console.error(
      `[paystack] underpayment on order ${orderId} (ref ${reference}): got ${amountKobo} kobo, expected ${expectedKobo}`,
    )
    return
  }
  await markOrderPaid(orderId)
}
