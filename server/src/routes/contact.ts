import { Router, type Request, type Response } from 'express'
import { sendContactMessage } from '../lib/email.js'

export const contactRouter = Router()

const MAX_MESSAGE = 5000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Crude per-IP throttle so the public endpoint can't be used to spam the inbox.
// In-memory is fine for a single instance; swap for Redis if this ever scales out.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
    }
  }
  return false
}

/**
 * POST /api/contact — forward a contact-form message to the site owner's inbox.
 * Public (no auth): anyone browsing the site can write in.
 */
contactRouter.post('/', async (req: Request, res: Response) => {
  const ip = req.ip ?? 'unknown'
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please try again in a few minutes.' })
  }

  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim()
  const subject = String(req.body?.subject ?? '').trim()
  const message = String(req.body?.message ?? '').trim()

  if (!name) return res.status(400).json({ error: 'Please tell us your name.' })
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
  if (!message) return res.status(400).json({ error: 'Please write a message.' })
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: 'That message is too long. Please keep it under 5000 characters.' })
  }

  const result = await sendContactMessage({ name, email, subject, message })

  if (!result.ok) {
    // Configuration problems are ours, not the sender's — don't leak details.
    console.error('[contact] send failed:', result.error)
    return res.status(502).json({ error: "We couldn't send your message right now. Please try again later." })
  }
  return res.json({ sent: true })
})
