# Cara — Setup

Full-stack marketplace: **Vite + React + TS + Tailwind** (client), **Express + TS** (server), **Supabase** (DB/Auth), **Paystack** (NGN payments), **Resend** (email).

## Prerequisites
- Node 20+ and npm 10+
- A Supabase project (target: `ivwdfxjvnexqsrqwnkoy`)
- A Paystack account (for online payments)
- A Resend account (for receipts and contact-form email)

## 1. Install
```bash
npm install            # installs all workspaces (client + server)
```

## 2. Environment
Copy each example file and fill in values from Supabase → **Project Settings → API**:
```bash
cp .env.example .env                 # root: SUPABASE_URL + SERVICE_ROLE key (seed only)
cp client/.env.example client/.env   # VITE_SUPABASE_URL + ANON key
cp server/.env.example server/.env   # server keys
```
- **anon/public key** → browser (client). Safe to ship; protected by RLS.
- **service-role key** → root `.env` (seed) and `server/.env` only. **Secret.**

## 3. Database schema
Apply the migrations **in order**, either:
- **Dashboard:** SQL Editor → paste each file → Run, or
- **CLI:** `supabase link --project-ref <ref>` then `supabase db push`.

1. `0001_init.sql` — tables, auto-profile trigger, RLS policies.
2. `0002_fix_profile_trigger.sql` — makes `profiles.full_name` nullable and the
   signup trigger null-safe.
3. `0003_marketplace.sql` — sellers, seller-owned products, image galleries.
4. `0004_seller_role.sql` · `0005_sizes_and_fulfillment.sql` · `0006_promote_admin.sql` · `0007_reviews.sql`
5. `0008_localisation.sql` — **⚠️ deletes the DummyJSON demo catalogue.** Adds
   seller shop address + contact columns, and order payment columns
   (`payment_method`, `fulfilment`, `payment_reference`).

> `0008` removes every product with no `seller_id` — that is exactly the demo
> data seeded in step 4. Real seller listings are untouched. Skip this migration
> if you want to keep the demo products.

## 4. Seed products (dev only)
```bash
npm run seed           # imports ~100 products from DummyJSON into the DB
```
Skip this for a real launch — `0008_localisation.sql` deletes whatever it adds.
Prices are treated as **naira**, so seeded values (9.99, 249.99…) look wrong;
add real products through the seller dashboard instead.

## 5. Run
```bash
npm run dev            # client (5173) + server (4000) together
# or individually:
npm run dev:client
npm run dev:server
```

## Workspace layout
```
client/    Vite + React + TS + Tailwind frontend
server/    Express + TS API (orders, payments, contact, seller, admin)
supabase/  migrations/ + seed/
legacy/    original static HTML/CSS site (reference only)
```

## 6. Payments — Paystack

Cara charges in **naira**. Paystack is used rather than Stripe because Stripe
does not onboard Nigerian businesses. Without a key, `POST /api/checkout/session`
returns `501` and online payment is disabled — **pay-on-pickup still works**.

1. Paystack Dashboard → **Settings → API Keys & Webhooks**. Copy the *secret*
   key into `server/.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...      # sk_live_... once your business is approved
   ```
2. On the same page, set the **webhook URL** to your deployed API:
   ```
   https://YOUR_API_HOST/api/webhooks/paystack
   ```
   Paystack cannot reach `localhost`, so no webhook fires in local dev. That's
   fine: the success page also verifies and fulfills via
   `GET /api/checkout/verify?reference=…`, so orders finalize either way.

**Flow:** `POST /api/checkout/session` creates a **pending** order, stamps a
`payment_reference` on it, and opens a Paystack transaction → the buyer is
redirected to Paystack → on success the webhook (or the verify endpoint) runs
the idempotent `markOrderPaid()` — decrement stock, clear cart, set `paid`, email
the receipt. Both paths check that the amount collected covers the order total
before fulfilling.

**Test cards:** Paystack test mode accepts `4084 0840 8408 4081`
(any future expiry, CVV `408`, PIN `0000`, OTP `123456`).

### Pay on pickup
Buyers who choose *pick up at the shop* can select **pay on pickup**. That path
skips Paystack entirely: `POST /api/orders` reserves the order (stock is
decremented, cart cleared), leaves it `pending`, and emails a receipt showing the
amount due and the shop address. The seller marks the item `delivered` when the
buyer collects and pays.

## 7. Email — Resend

Receipts, fulfillment updates and contact-form messages all go through Resend.
With `RESEND_API_KEY` unset, sends are skipped and logged — nothing breaks.

```
RESEND_API_KEY=re_...
EMAIL_FROM=Cara <hello@yourdomain.ng>   # must be a verified sender/domain
CONTACT_EMAIL_TO=you@yourdomain.ng      # where contact-form messages land
LOGO_URL=https://yourdomain.ng/img/logo.png   # must be publicly reachable
```

`onboarding@resend.dev` works for early testing but only delivers to your own
Resend account email — verify a domain to reach anyone else. `LOGO_URL` defaults
to `CLIENT_ORIGIN/img/logo.png`; a `localhost` value renders as a broken image
in real inboxes, so set it explicitly once deployed.

```bash
npm run test:email -w server -- you@example.com   # end-to-end send check
npm run preview:email -w server                   # render every email to HTML, no sending
```

`preview:email` writes `server/.email-preview/*.html` — open them in a browser
to check the design without placing an order.

## Status
- ✅ Monorepo + Tailwind migration
- ✅ DB schema + RLS
- ✅ Frontend ↔ Supabase (auth, products, cart, wishlist, reviews)
- ✅ Order finalization (`POST /api/orders`)
- ✅ Paystack checkout (session + webhook + verify)
- ✅ Naira pricing, pay-on-pickup, emailed receipts, seller shop addresses
