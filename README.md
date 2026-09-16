# Cara — Marketplace (full-stack)

A full-stack marketplace where sellers open a storefront and buyers shop across
every store. Evolved from the original static HTML/CSS Cara template.

Prices are in **naira**. Buyers pay online through Paystack (card, bank transfer,
USSD) or reserve an order and pay the seller when they collect it in person.

**Stack:** Vite + React + TypeScript + **Tailwind** (client) · Express + TypeScript (server) · **Supabase** (Postgres/Auth/RLS) · **Paystack** (NGN payments) · **Resend** (email).

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
server/    Express + TS API — orders, Paystack payments, contact form, seller, admin
supabase/  migrations/0001_init.sql (schema + RLS + triggers), seed/ (DummyJSON importer)
legacy/    Original static HTML/CSS/JS site, kept for reference
```

## Features

- Responsive Cara UI in Tailwind (mobile nav, hero, product grid, cart, checkout, blog, about, contact).
- Seller storefronts: onboarding with shop address + contact details, product management, per-item fulfillment.
- Cart, wishlist and reviews backed by Supabase with RLS.
- Checkout in naira: pick up at the shop or have it delivered; pay online via Paystack or pay on collection.
- Transactional email via Resend — order receipts, "ready for collection", review requests, contact-form forwarding.
- Admin dashboard: users, products, orders, revenue.

## Roadmap

| Scope | Status |
| ----- | ------ |
| Monorepo + full Tailwind migration | ✅ |
| Supabase schema + RLS | ✅ (apply per SETUP.md) |
| Frontend ↔ Supabase: auth, products, cart, wishlist, reviews | ✅ |
| Express order-finalize endpoint | ✅ |
| Paystack checkout (initialize + webhook + verify) | ✅ |
| Naira pricing, pay-on-pickup, emailed receipts, seller shop addresses | ✅ |
