-- Product sizes (US/UK) + size-aware cart/order lines + per-item fulfillment.
-- Idempotent; run once in the SQL editor.

-- Sizes a seller offers: a JSON array of { "us": "M", "uk": "12" } entries.
-- Empty array means the product has no sizes.
alter table public.products
  add column if not exists sizes jsonb not null default '[]'::jsonb;

-- A cart line is now identified by (user, product, size). '' = no size chosen.
alter table public.cart_items
  add column if not exists size text not null default '';

alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;
alter table public.cart_items drop constraint if exists cart_items_user_product_size_key;
alter table public.cart_items
  add constraint cart_items_user_product_size_key unique (user_id, product_id, size);

-- Order lines carry the purchased size + a per-item fulfillment status that the
-- owning seller updates (processing | shipped | delivered | cancelled).
alter table public.order_items
  add column if not exists size text not null default '';
alter table public.order_items
  add column if not exists status text not null default 'processing';
