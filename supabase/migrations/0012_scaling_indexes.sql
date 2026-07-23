-- Finjaro — indexes for the hot buyer queries so they stay fast as the catalog
-- grows to thousands/millions of rows. All additive + IF NOT EXISTS (safe to
-- re-run). Only touches Finjaro's own tables. pg_trgm was enabled in 0010.

-- Home "Trending": WHERE is_active ORDER BY views DESC LIMIT 12
create index if not exists idx_products_active_views
  on public.products (is_active, views desc);

-- Category listing: WHERE category = ? AND is_active ORDER BY views DESC
create index if not exists idx_products_category_views
  on public.products (category, views desc) where is_active;

-- Shop → its products (foreign key lookups)
create index if not exists idx_products_shop_id
  on public.products (shop_id);

-- Search: products.name ILIKE '%term%' (trigram)
create index if not exists idx_products_name_trgm
  on public.products using gin (name gin_trgm_ops);

-- Home + Near You shops: WHERE status='active' ORDER BY followers_count DESC
create index if not exists idx_shops_status_followers
  on public.shops (status, followers_count desc);

-- Near You country filter: WHERE status='active' AND country = ?
create index if not exists idx_shops_status_country
  on public.shops (status, country);

-- Search: shops.name ILIKE '%term%' (trigram)
create index if not exists idx_shops_name_trgm
  on public.shops using gin (name gin_trgm_ops);
