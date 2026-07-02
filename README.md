# Cara — Fashion E-commerce (full-stack)

A full-stack e-commerce app, evolved from the original static HTML/CSS Cara template.

**Stack:** Vite + React + TypeScript + **Tailwind** (client) · Express + TypeScript (server) · **Supabase** (Postgres/Auth/RLS) · Stripe Checkout (later).

## Quick start

```bash
npm install      # installs the client + server workspaces
npm run dev      # runs client (5173) and server (4000) together
```

See **[SETUP.md](SETUP.md)** for environment variables, applying the database schema, and seeding products.

## Monorepo layout

```
client/    Vite + React + TS + Tailwind frontend
  src/components  Header, Footer, Newsletter, Feature, ProductCard, StarRating, Layout
  src/context     CartContext (+ AuthContext, Phase 3)
  src/pages       Home, Shop, Product, Cart, Checkout, Blog, About, Contact, NotFound
  src/data        products.ts, blog.ts (local data until Phase 3 wires Supabase)
server/    Express + TS API — thin: order finalization, Stripe, admin (Phase 4+)
supabase/  migrations/0001_init.sql (schema + RLS + triggers), seed/ (DummyJSON importer)
legacy/    Original static HTML/CSS/JS site, kept for reference
```

## Features

- Responsive Cara UI rebuilt in Tailwind (mobile nav, hero, product grid, banners, cart, checkout, blog, about, contact).
- Working cart with live totals and a header badge (localStorage now; moves to Supabase `cart_items` in Phase 3).
- Shop search + brand/category filter + sort; checkout flow with validation and order summary.

## Roadmap

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | Monorepo + full Tailwind migration | ✅ |
| 2 | Supabase schema + RLS + DummyJSON seed | ✅ (apply per SETUP.md) |
| 3 | Frontend ↔ Supabase: auth, products-from-DB, DB cart, wishlist | ⏳ |
| 4 | Express order-finalize endpoint | ✅ |
| 5 | Stripe Checkout (session + webhook + verify) | ✅ |
