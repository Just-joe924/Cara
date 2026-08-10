-- Product ratings & reviews.
--
-- One review per (user, product). Reviews are publicly readable; a user may only
-- write/edit/delete their own. `verified` is stamped at write time by the client
-- (the reviewer can see their own orders, so no cross-user RLS is needed). The
-- `product_ratings` view exposes per-product aggregates for cards/lists.
-- Idempotent: safe to re-run.

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_reviews_product on public.reviews (product_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public"
  on public.reviews for select
  using (true);

drop policy if exists "insert own review" on public.reviews;
create policy "insert own review"
  on public.reviews for insert
  with check (user_id = auth.uid());

drop policy if exists "update own review" on public.reviews;
create policy "update own review"
  on public.reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete own review" on public.reviews;
create policy "delete own review"
  on public.reviews for delete
  using (user_id = auth.uid());

-- Per-product rating aggregates. Reviews are public, so exposing averages/counts
-- through a view is safe. Granted to anon + authenticated for PostgREST access.
create or replace view public.product_ratings as
select
  product_id,
  round(avg(rating)::numeric, 2) as rating_avg,
  count(*)::int                  as rating_count
from public.reviews
group by product_id;

grant select on public.product_ratings to anon, authenticated;
