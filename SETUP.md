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
Apply `supabase/migrations/0001_init.sql` to the project, either:
- **Dashboard:** SQL Editor → paste the file → Run, or
- **CLI:** `supabase link --project-ref <ref>` then `supabase db push`.

This creates all tables, the auto-profile trigger, and RLS policies.

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

## Status by phase
- ✅ Phase 1 — monorepo + full Tailwind migration (UI unchanged, still local data this phase)
- ✅ Phase 2 — DB schema + RLS + DummyJSON seed (files; apply with the steps above)
- ⏳ Phase 3 — frontend ↔ Supabase (auth, products-from-DB, DB cart, wishlist)
- ⏳ Phase 4 — Express order-finalize endpoint
- ⏳ Phase 5 — Stripe Checkout
