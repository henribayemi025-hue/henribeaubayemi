-- Finjaro — Cycle 6: real push (server-side VAPID storage), vendor gamification
-- points, and a trigram-based "similar products" recommendation RPC.
-- Idempotent.

-- 1) Private server-only config store ---------------------------------------
-- Holds secrets the edge functions read with the service role (e.g. VAPID
-- keys). RLS is enabled with NO policies, so anon/authenticated clients can
-- never read it; only the service role (which bypasses RLS) can.
create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

-- 2) Vendor gamification: seller points --------------------------------------
alter table public.shops add column if not exists seller_points integer not null default 0;

-- Award points when an order is marked delivered. SECURITY DEFINER so it runs
-- with the owner's rights and bypasses the buyer's RLS (the buyer who confirms
-- receipt can't write to the shop row directly).
create or replace function public.award_seller_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'delivered' and coalesce(old.status, '') is distinct from 'delivered' then
    update public.shops
      set seller_points = seller_points + 10
      where id = new.shop_id;
  end if;
  return new;
end;
$$;
revoke all on function public.award_seller_points() from anon, authenticated;

drop trigger if exists trg_award_seller_points on public.orders;
create trigger trg_award_seller_points
  after update of status on public.orders
  for each row
  execute function public.award_seller_points();

-- 3) Recommendations: trigram similarity fallback ----------------------------
-- Vector (pgvector / Gemini embeddings) can replace the body later; pg_trgm
-- gives useful "vous aimerez aussi" results today with zero embedding cost.
create extension if not exists pg_trgm;

create or replace function public.similar_products(p_product_id uuid, p_limit integer default 8)
returns setof public.products
language sql
stable
as $$
  with src as (
    select name, category from public.products where id = p_product_id
  )
  select p.*
  from public.products p, src
  where p.id <> p_product_id
    and p.stock > 0
    and (p.category = src.category or similarity(p.name, src.name) > 0.2)
  order by
    (p.category = src.category) desc,
    similarity(p.name, src.name) desc,
    p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 8), 24));
$$;
grant execute on function public.similar_products(uuid, integer) to anon, authenticated;
