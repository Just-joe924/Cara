import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { stripe } from '../lib/stripe.js'
import { env } from '../lib/env.js'
import {
  OrderError,
  assertStock,
  createOrderWithItems,
  loadCartLines,
  markOrderPaid,
} from '../services/orders.js'

export const stripeRouter = Router()

/**
 * POST /api/checkout/session — create a pending order from the cart and open a
 * Stripe Checkout session for it. Returns the hosted-checkout URL to redirect to.
 */
stripeRouter.post('/checkout/session', requireAuth, async (req: Request, res: Response) => {
  if (!stripe) return res.status(501).json({ error: 'Stripe is not configured' })
  const userId = req.user!.id
  const shipping = (req.body?.shipping_address ?? null) as Record<string, unknown> | null

  try {
    const lines = await loadCartLines(userId)
    assertStock(lines)
    const { order } = await createOrderWithItems(userId, shipping, lines, 'pending')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(l.product.price * 100),
          product_data: {
            name: l.product.name,
            images: l.product.image_url ? [l.product.image_url] : [],
          },
        },
      })),
      success_url: `${env.CLIENT_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_ORIGIN}/cart`,
      client_reference_id: order.id,
      metadata: { order_id: order.id, user_id: userId },
      customer_email: typeof shipping?.email === 'string' ? (shipping.email as string) : undefined,
    })

    return res.json({ url: session.url, order_id: order.id })
  } catch (err) {
    if (err instanceof OrderError) {
      return res.status(err.status).json({ error: err.message, items: err.extra })
    }
    console.error('checkout/session error:', err)
    return res.status(500).json({ error: 'Failed to start checkout' })
  }
})

/**
 * GET /api/checkout/verify?session_id=... — confirm a session was paid and
 * fulfill its order. Lets the success page finalize without depending on the
 * webhook (useful in local dev without the Stripe CLI). Idempotent.
 */
stripeRouter.get('/checkout/verify', requireAuth, async (req: Request, res: Response) => {
  if (!stripe) return res.status(501).json({ error: 'Stripe is not configured' })
  const sessionId = String(req.query.session_id ?? '')
  if (!sessionId) return res.status(400).json({ error: 'Missing session_id' })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'This session does not belong to you' })
    }
    const orderId = session.metadata?.order_id
    const paid = session.payment_status === 'paid'
    if (paid && orderId) await markOrderPaid(orderId)
    return res.json({ paid, order_id: orderId })
  } catch (err) {
    console.error('checkout/verify error:', err)
    return res.status(500).json({ error: 'Failed to verify checkout' })
  }
})

/**
 * Stripe webhook. Mounted in index.ts with a raw body parser (signature check
 * needs the exact bytes). Fulfills the order on checkout.session.completed.
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: 'Stripe webhook is not configured' })
  }

  const signature = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature as string, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    return res.status(400).send(`Webhook Error: ${message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { order_id?: string } }
    const orderId = session.metadata?.order_id
    if (orderId) await markOrderPaid(orderId)
  }

  return res.json({ received: true })
}
