import Stripe from 'stripe'
import { env } from './env.js'

/**
 * Stripe client, or null when STRIPE_SECRET_KEY is not configured.
 * Routes should return 501 when this is null so the app runs without payments.
 */
export const stripe: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null
