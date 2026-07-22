-- Finjaro — Maintenance Cycle 1.
-- Idempotent. Apply once in the Supabase SQL editor (project `finjaro`).
-- Frontend deploys via Netlify; THIS file must be run manually.

-- ---------------------------------------------------------------------------
-- FIX 4 — let PostgREST join near_you_listings -> profiles(name).
-- user_id already FKs auth.users; add a named FK to public.profiles too
-- (profiles.id = auth.users.id, and a profile row always exists per user).
-- ---------------------------------------------------------------------------
alter table public.near_you_listings
  drop constraint if exists near_you_listings_profile_fk;
alter table public.near_you_listings
  add constraint near_you_listings_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- FIX 8 — ensure a user can create/update THEIR OWN shop (self-service vendor
-- activation). These policies likely already exist; recreated idempotently.
-- ---------------------------------------------------------------------------
alter table public.shops enable row level security;

drop policy if exists shops_insert on public.shops;
create policy shops_insert on public.shops
  for insert with check (owner_id = auth.uid());

drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops
  for update using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- FIX 10 — lightweight, invisible event tracking for a future recommendation
-- algorithm. Inserts allowed for everyone (incl. anon); reads limited to the
-- owner (analytics/service-role later).
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('product_view','shop_view','category_view','product_click','follow','search')),
  target_id text,          -- product / shop / category id concerned
  meta jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists events_type_idx on public.events(type);
create index if not exists events_user_idx on public.events(user_id);
create index if not exists events_created_idx on public.events(created_at);

alter table public.events enable row level security;

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert with check (true);

drop policy if exists events_read on public.events;
create policy events_read on public.events for select using (auth.uid() = user_id);
