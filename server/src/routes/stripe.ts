import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'

// Scaffold for Phase 5. Returns 501 until Stripe keys + logic are wired in.
export const stripeRouter = Router()

stripeRouter.post('/checkout/session', requireAuth, (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Stripe Checkout not implemented yet (Phase 5)' })
})

// Stripe webhooks need the raw body; this is mounted with express.raw in index.ts.
stripeRouter.post('/webhooks/stripe', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Stripe webhook not implemented yet (Phase 5)' })
})
