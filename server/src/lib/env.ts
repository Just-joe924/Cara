import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required env var: ${name}. See server/.env.example`)
    process.exit(1)
  }
  return value
}

// `||` rather than `??` throughout: a key present but blank in .env (the normal
// way to "leave it unset") is an empty string, which `??` would happily keep.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

export const env = {
  PORT: Number(process.env.PORT || 4000),
  CLIENT_ORIGIN,
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  // Paystack — NGN payments (cards, bank transfer, USSD).
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Cara <onboarding@resend.dev>',
  /** Inbox that contact-form submissions are forwarded to. */
  CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO || '',
  /**
   * Absolute URL of the logo shown in emails. Must be publicly reachable —
   * a localhost URL will render as a broken image in real inboxes.
   */
  LOGO_URL: process.env.LOGO_URL || `${CLIENT_ORIGIN}/img/logo.png`,
}
