-- General-marketplace category taxonomy, two levels deep.
--
-- Sellers always pick a LEAF (e.g. "Watches"), never a top-level group
-- (e.g. "Jewellery & Accessories"). Vague top-level labels are what cause
-- miscategorisation — a smartwatch plausibly fits "Fashion" or "Electronics",
-- but "Watches" vs "Phone Accessories" is unambiguous.
--
-- Migration 0008 deleted every category left without products, which emptied
-- this table down to the two the real seller listings happened to use. This
-- rebuilds it properly.
--
-- Idempotent: upserts on slug, so re-running updates names/parents rather than
-- duplicating. Never deletes a category that still has products attached.

-- ============================================================
-- 1. Hierarchy columns
-- ============================================================

alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete cascade,
  add column if not exists position  int not null default 0;

create index if not exists idx_categories_parent on public.categories (parent_id);

comment on column public.categories.parent_id is
  'Null for a top-level group. Products are only ever attached to a child (leaf).';

-- ============================================================
-- 2. Top-level groups
-- ============================================================

insert into public.categories (name, slug, parent_id, position) values
  ('Fashion & Clothing',      'fashion-clothing',      null,  1),
  ('Shoes & Bags',            'shoes-bags',            null,  2),
  ('Jewellery & Accessories', 'jewellery-accessories', null,  3),
  ('Phones & Tablets',        'phones-tablets',        null,  4),
  ('Electronics',             'electronics',           null,  5),
  ('Home & Kitchen',          'home-kitchen',          null,  6),
  ('Health & Beauty',         'health-beauty',         null,  7),
  ('Groceries & Drinks',      'groceries-drinks',      null,  8),
  ('Baby & Kids',             'baby-kids',             null,  9),
  ('Sports & Outdoors',       'sports-outdoors',       null, 10),
  ('Books & Stationery',      'books-stationery',      null, 11),
  ('Services',                'services',              null, 12),
  ('Other',                   'other',                 null, 99)
on conflict (slug) do update
  set name = excluded.name, parent_id = null, position = excluded.position;

-- ============================================================
-- 3. Leaves — what sellers actually choose from
-- ============================================================

with parent as (select id, slug from public.categories where parent_id is null)
insert into public.categories (name, slug, parent_id, position)
select v.name, v.slug, parent.id, v.position
from (values
  -- Fashion & Clothing
  ('Women''s Clothing',        'womens-clothing',      'fashion-clothing',      1),
  ('Men''s Clothing',          'mens-clothing',        'fashion-clothing',      2),
  ('Kids & Baby Clothing',     'kids-clothing',        'fashion-clothing',      3),
  ('Traditional & Ankara',     'traditional-ankara',   'fashion-clothing',      4),
  ('Underwear & Sleepwear',    'underwear-sleepwear',  'fashion-clothing',      5),
  -- Shoes & Bags
  ('Women''s Shoes',           'womens-shoes',         'shoes-bags',            1),
  -- Keeps the existing 'mens-shoes' slug, so the upsert above re-parents that
  -- row in place and its products stay attached.
  ('Men''s Shoes',             'mens-shoes',           'shoes-bags',            2),
  ('Kids'' Shoes',             'kids-shoes',           'shoes-bags',            3),
  ('Bags & Luggage',           'bags-luggage',         'shoes-bags',            4),
  -- Jewellery & Accessories
  ('Jewellery',                'jewellery',            'jewellery-accessories', 1),
  ('Watches',                  'watches',              'jewellery-accessories', 2),
  ('Belts, Hats & Scarves',    'belts-hats-scarves',   'jewellery-accessories', 3),
  ('Eyewear',                  'eyewear',              'jewellery-accessories', 4),
  -- Phones & Tablets
  ('Mobile Phones',            'mobile-phones',        'phones-tablets',        1),
  ('Tablets',                  'tablets',              'phones-tablets',        2),
  ('Phone Accessories',        'phone-accessories',    'phones-tablets',        3),
  ('Power Banks & Chargers',   'power-banks-chargers', 'phones-tablets',        4),
  -- Electronics
  ('Laptops & Computers',      'laptops-computers',    'electronics',           1),
  ('Audio & Headphones',       'audio-headphones',     'electronics',           2),
  ('TVs & Home Entertainment', 'tvs-entertainment',    'electronics',           3),
  ('Cameras',                  'cameras',              'electronics',           4),
  ('Gaming',                   'gaming',               'electronics',           5),
  -- Home & Kitchen
  ('Furniture',                'furniture',            'home-kitchen',          1),
  ('Kitchen & Dining',         'kitchen-dining',       'home-kitchen',          2),
  ('Bedding & Bath',           'bedding-bath',         'home-kitchen',          3),
  ('Home Decor',               'home-decor',           'home-kitchen',          4),
  ('Home Appliances',          'home-appliances',      'home-kitchen',          5),
  -- Health & Beauty
  ('Skincare',                 'skincare',             'health-beauty',         1),
  ('Haircare & Wigs',          'haircare-wigs',        'health-beauty',         2),
  ('Makeup',                   'makeup',               'health-beauty',         3),
  ('Fragrance',                'fragrance',            'health-beauty',         4),
  ('Personal Care',            'personal-care',        'health-beauty',         5),
  -- Groceries & Drinks
  ('Foodstuff & Provisions',   'foodstuff-provisions', 'groceries-drinks',      1),
  ('Snacks',                   'snacks',               'groceries-drinks',      2),
  ('Beverages',                'beverages',            'groceries-drinks',      3),
  -- Baby & Kids
  ('Baby Gear',                'baby-gear',            'baby-kids',             1),
  ('Toys & Games',             'toys-games',           'baby-kids',             2),
  ('School Supplies',          'school-supplies',      'baby-kids',             3),
  -- Sports & Outdoors
  ('Fitness Equipment',        'fitness-equipment',    'sports-outdoors',       1),
  ('Sportswear',               'sportswear',           'sports-outdoors',       2),
  ('Outdoor & Camping',        'outdoor-camping',      'sports-outdoors',       3),
  -- Books & Stationery
  ('Books',                    'books',                'books-stationery',      1),
  ('Stationery',               'stationery',           'books-stationery',      2),
  ('Musical Instruments',      'musical-instruments',  'books-stationery',      3),
  -- Services
  ('Tailoring & Alterations',  'tailoring',            'services',              1),
  ('Repairs',                  'repairs',              'services',              2),
  ('Events & Rentals',         'events-rentals',       'services',              3),
  -- Other
  ('Uncategorised',            'uncategorised',        'other',                 1)
) as v(name, slug, parent_slug, position)
join parent on parent.slug = v.parent_slug
on conflict (slug) do update
  set name      = excluded.name,
      parent_id = excluded.parent_id,
      position  = excluded.position;

-- ============================================================
-- 4. Fold the leftover DummyJSON categories into the new tree
-- ============================================================
-- 'mens-shirts' / 'mens-shoes' survived 0008 because real seller products point
-- at them. Move those products to the matching new leaf, then drop the old row.
-- Anything else unrecognised is parked under "Other" so no product is orphaned.

do $$
declare
  mapping record;
  target_id uuid;
  source_id uuid;
begin
  for mapping in
    select * from (values
      ('mens-shirts', 'mens-clothing'),
      ('womens-dresses', 'womens-clothing'),
      ('womens-shoes',   'womens-shoes'),
      ('womens-bags',    'bags-luggage'),
      ('womens-watches', 'watches'),
      ('mens-watches',   'watches'),
      ('sunglasses',     'eyewear'),
      ('tops',           'womens-clothing'),
      ('smartphones',    'mobile-phones'),
      ('laptops',        'laptops-computers'),
      ('fragrances',     'fragrance'),
      ('skincare',       'skincare'),
      ('groceries',      'foodstuff-provisions'),
      ('home-decoration', 'home-decor'),
      ('furniture',      'furniture'),
      ('lighting',       'home-decor'),
      ('automotive',     'other'),
      ('motorcycle',     'other')
    ) as m(old_slug, new_slug)
  loop
    select id into source_id from public.categories
      where slug = mapping.old_slug and parent_id is null;
    continue when source_id is null;

    select id into target_id from public.categories where slug = mapping.new_slug;
    continue when target_id is null;

    update public.products set category_id = target_id where category_id = source_id;
    delete from public.categories where id = source_id;
  end loop;
end $$;

-- Any remaining top-level category that is not part of the seeded tree gets
-- parked under "Other" rather than deleted — products keep their link.
update public.categories
set parent_id = (select id from public.categories where slug = 'other'),
    position  = 50
where parent_id is null
  and slug not in (
    'fashion-clothing', 'shoes-bags', 'jewellery-accessories', 'phones-tablets',
    'electronics', 'home-kitchen', 'health-beauty', 'groceries-drinks',
    'baby-kids', 'sports-outdoors', 'books-stationery', 'services', 'other'
  );
