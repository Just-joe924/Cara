# Cara — Setup

Full-stack e-commerce: **Vite + React + TS + Tailwind** (client), **Express + TS** (server, Phase 4+), **Supabase** (DB/Auth), **Stripe** (Phase 5).

## Prerequisites
- Node 20+ and npm 10+
- A Supabase project (target: `ivwdfxjvnexqsrqwnkoy`)

## 1. Install
```bash
npm install            # installs all workspaces (client + server)
```

## 2. Environment
Copy each example file and fill in values from Supabase → **Project Settings → API**:
```bash
cp .env.example .env                 # root: SUPABASE_URL + SERVICE_ROLE key (seed only)
cp client/.env.example client/.env   # VITE_SUPABASE_URL + ANON key
cp server/.env.example server/.env   # server keys (Phase 4+)
```
- **anon/public key** → browser (client). Safe to ship; protected by RLS.
- **service-role key** → root `.env` (seed) and `server/.env` only. **Secret.**

## 3. Database schema
Apply the migrations **in order** to the project, either:
- **Dashboard:** SQL Editor → paste each file → Run, or
- **CLI:** `supabase link --project-ref <ref>` then `supabase db push`.

1. `supabase/migrations/0001_init.sql` — tables, auto-profile trigger, RLS policies.
2. `supabase/migrations/0002_fix_profile_trigger.sql` — makes `profiles.full_name`
   nullable and the signup trigger null-safe (required if your `profiles.full_name`
   was created NOT NULL, which otherwise causes a 500 on signups without a name).

## 4. Seed products (dev)
```bash
npm run seed           # imports ~100 products from DummyJSON into the DB
```

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
server/    Express + TS API (thin: order finalization, Stripe, admin)
supabase/  migrations/ + seed/
legacy/    original static HTML/CSS site (reference only)
```

## 6. Stripe payments (Phase 5)
Card checkout uses Stripe Checkout. Without keys it returns `501` and card
payment is disabled (COD still works). To enable:

1. Add test keys to `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` or the dashboard
   ```
2. (Local webhooks, optional) forward events with the Stripe CLI:
   ```
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```
   The success page also verifies + fulfills via `GET /api/checkout/verify`,
   so orders finalize even without the CLI.

Flow: `POST /api/checkout/session` creates a **pending** order + Stripe session →
redirect to Stripe → on success, the webhook (or verify endpoint) runs the
idempotent `markOrderPaid()` (decrement stock, clear cart, set `paid`).

Use test card `4242 4242 4242 4242`, any future expiry/CVC.

## Status by phase
- ✅ Phase 1 — monorepo + full Tailwind migration
- ✅ Phase 2 — DB schema + RLS + DummyJSON seed
- ✅ Phase 3 — frontend ↔ Supabase (auth, products-from-DB, DB cart, wishlist)
- ✅ Phase 4 — Express order-finalize endpoint (`POST /api/orders`)
- ✅ Phase 5 — Stripe Checkout (session + webhook + verify; add keys to enable)
