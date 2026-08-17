/**
 * Local email smoke test. Verifies RESEND_API_KEY + EMAIL_FROM by sending one
 * diagnostic email through the same code path the app uses.
 *
 *   npm run test:email -- you@example.com
 *   (or set TEST_EMAIL_TO in server/.env and run: npm run test:email)
 */
import { env } from '../src/lib/env.js'
import { sendTestEmail } from '../src/lib/email.js'

const to = process.argv[2] || process.env.TEST_EMAIL_TO

if (!to) {
  console.error('Usage: npm run test:email -- you@example.com')
  console.error('   (or set TEST_EMAIL_TO=you@example.com in server/.env)')
  process.exit(1)
}

if (!env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in server/.env — add it and retry.')
  process.exit(1)
}

console.log(`Sending test email from "${env.EMAIL_FROM}" to ${to} …`)
const result = await sendTestEmail(to)

if (result.ok) {
  console.log(`✅ Accepted by Resend (id: ${result.id ?? 'n/a'}). Check the inbox + Resend dashboard.`)
  if (env.EMAIL_FROM.includes('onboarding@resend.dev')) {
    console.log('   ℹ️  With the onboarding@resend.dev test sender, delivery only works to')
    console.log('      your own Resend account email. Verify a domain to reach any address.')
  }
} else {
  console.error(`❌ Failed: ${result.error ?? 'unknown error'}`)
  process.exit(1)
}
