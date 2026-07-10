-- Cara marketplace: sellers, seller-owned products, product image galleries,
-- and a Storage bucket for uploads. Builds on 0001/0002.
-- Idempotent: safe to run once in the SQL editor.

-- ============================================================
-- Sellers
-- ============================================================

create table if not exists public.sellers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  business_name  text not null,
  -- Buyers search by brand_name; unique so a brand maps to one seller.
  brand_name     text unique,
  -- Free text, e.g. retail | wholesale | handmade | dropshipping | services | other
  business_type  text,
  description    text,
  logo_url       text,
  phone          text,
  website        text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists idx_sellers_brand on public.sellers (lower(brand_name));

-- Mark a user's profile role as 'seller' when they onboard (unless already admin).
create or replace function public.handle_new_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set role = 'seller'
    where id = new.user_id and role <> 'admin';
  return new;
end;
$$;

drop trigger if exists on_seller_created on public.sellers;
create trigger on_seller_created
  after insert on public.sellers
  for each row execute function public.handle_new_seller();

-- Convenience: the seller id owned by the current user (or null).
create or replace function public.current_seller_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.sellers where user_id = auth.uid()
$$;

-- ============================================================
-- Products: attribute to a seller
-- ============================================================

alter table public.products
  add column if not exists seller_id uuid references public.sellers (id) on delete cascade;

create index if not exists idx_products_seller on public.products (seller_id);

-- (Existing seeded products keep seller_id = null = "house"/platform products.)

-- ============================================================
-- Product images (gallery). products.image_url stays the primary thumbnail.
-- ============================================================

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images (product_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.sellers        enable row level security;
alter table public.product_images enable row level security;

-- sellers: anyone can read (brand/storefront info); a user manages their own row.
drop policy if exists "sellers_public_read" on public.sellers;
create policy "sellers_public_read" on public.sellers
  for select using (true);

drop policy if exists "sellers_insert_own" on public.sellers;
create policy "sellers_insert_own" on public.sellers
  for insert with check (user_id = auth.uid());

drop policy if exists "sellers_update_own" on public.sellers;
create policy "sellers_update_own" on public.sellers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- products: sellers get full control of their own rows (adds to the existing
-- public-read + admin-write policies from 0001).
drop policy if exists "products_seller_read_own" on public.products;
create policy "products_seller_read_own" on public.products
  for select using (seller_id = public.current_seller_id());

drop policy if exists "products_seller_insert" on public.products;
create policy "products_seller_insert" on public.products
  for insert with check (seller_id = public.current_seller_id());

drop policy if exists "products_seller_update" on public.products;
create policy "products_seller_update" on public.products
  for update using (seller_id = public.current_seller_id())
  with check (seller_id = public.current_seller_id());

drop policy if exists "products_seller_delete" on public.products;
create policy "products_seller_delete" on public.products
  for delete using (seller_id = public.current_seller_id());

-- product_images: public read; a seller manages images of their own products.
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select using (true);

drop policy if exists "product_images_seller_manage" on public.product_images;
create policy "product_images_seller_manage" on public.product_images
  for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = public.current_seller_id()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = public.current_seller_id()
    )
  );

-- ============================================================
-- Storage: public bucket for product images; sellers upload into their own
-- folder ("<auth.uid>/<file>"). Public bucket = images served via public URL.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_read" on storage.objects;
create policy "product_images_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_upload_own" on storage.objects;
create policy "product_images_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "product_images_update_own" on storage.objects;
create policy "product_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "product_images_delete_own" on storage.objects;
create policy "product_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
