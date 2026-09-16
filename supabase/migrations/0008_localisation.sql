-- Localisation for the Nigerian launch:
--   1. Seller pickup/contact details (address, email, second phone)
--   2. Order payment metadata (online vs pay-on-pickup, Paystack reference)
--   3. Removal of the DummyJSON demo catalogue
-- Idempotent: safe to run more than once in the SQL editor.

-- ============================================================
-- 1. Seller contact + shop address
-- ============================================================
-- Buyers who choose "pay on pickup" need somewhere to actually go, so a shop
-- address is now part of the seller profile rather than optional metadata.

alter table public.sellers
  add column if not exists email          text,
  add column if not exists phone_alt      text,
  add column if not exists address_line   text,
  add column if not exists city           text,
  add column if not exists state          text,
  add column if not exists landmark       text;

comment on column public.sellers.phone_alt    is 'Optional second phone number (WhatsApp / alternate line).';
comment on column public.sellers.address_line is 'Street address of the physical shop buyers collect from.';
comment on column public.sellers.landmark     is 'Optional "close to ..." hint — how people actually navigate here.';

-- ============================================================
-- 2. Order payment metadata
-- ============================================================
-- payment_method: 'online'  -> paid via Paystack before collection
--                 'pickup'  -> pays cash/transfer when collecting in person
-- payment_reference: the Paystack transaction reference, used to verify and to
-- make webhook delivery idempotent.

alter table public.orders
  add column if not exists payment_method    text not null default 'online',
  add column if not exists payment_reference text,
  add column if not exists fulfilment        text not null default 'delivery';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('online', 'pickup'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_fulfilment_check'
  ) then
    alter table public.orders
      add constraint orders_fulfilment_check
      check (fulfilment in ('delivery', 'pickup'));
  end if;
end $$;

-- One order per Paystack reference — this is what makes replayed webhooks safe.
create unique index if not exists idx_orders_payment_reference
  on public.orders (payment_reference)
  where payment_reference is not null;

-- ============================================================
-- 3. Drop the DummyJSON demo catalogue
-- ============================================================
-- Seeded demo products were inserted before sellers existed, so they are exactly
-- the rows with no seller_id. Real listings always belong to a seller and are
-- left untouched. Dependent cart/wishlist rows cascade; order_items keep their
-- price snapshot and null out product_id, so past orders still read correctly.

delete from public.products where seller_id is null;

-- Categories left behind with nothing in them are noise in the shop filter.
delete from public.categories c
where not exists (select 1 from public.products p where p.category_id = c.id);
