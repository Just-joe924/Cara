import crypto from 'node:crypto'
import { env } from './env.js'

/**
 * Paystack over its REST API — no SDK dependency, same approach as the Resend
 * client in ./email.ts. Paystack is used instead of Stripe because Stripe does
 * not onboard Nigerian businesses; Paystack charges in NGN natively and covers
 * cards, bank transfer and USSD.
 *
 * Docs: https://paystack.com/docs/api/transaction
 */

const API = 'https://api.paystack.co'

export const paystackEnabled = (): boolean => Boolean(env.PAYSTACK_SECRET_KEY)

interface PaystackResponse<T> {
  status: boolean
  message: string
  data: T
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const body = (await res.json().catch(() => null)) as PaystackResponse<T> | null
  if (!res.ok || !body?.status) {
    throw new Error(body?.message ?? `Paystack request failed (${res.status})`)
  }
  return body.data
}

export interface InitializeResult {
  authorization_url: string
  access_code: string
  reference: string
}

/**
 * Open a transaction. `amountNaira` is converted to kobo here so callers never
 * have to think about the smallest denomination.
 */
export async function initializeTransaction(params: {
  email: string
  amountNaira: number
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}): Promise<InitializeResult> {
  return call<InitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      currency: 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: ['card', 'bank', 'bank_transfer', 'ussd', 'mobile_money', 'qr'],
    }),
  })
}

export interface VerifyResult {
  status: string // 'success' | 'failed' | 'abandoned' | ...
  reference: string
  amount: number // kobo
  currency: string
  paid_at: string | null
  channel: string | null
  metadata: { order_id?: string; user_id?: string } | null
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  return call<VerifyResult>(`/transaction/verify/${encodeURIComponent(reference)}`)
}

/**
 * Paystack signs webhooks with HMAC SHA512 of the RAW request body keyed by the
 * secret key. Compared in constant time so the check can't be timed.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature || !env.PAYSTACK_SECRET_KEY) return false
  const expected = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Human-readable, collision-resistant reference stamped on the order. */
export function newReference(): string {
  return `cara_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`
}
