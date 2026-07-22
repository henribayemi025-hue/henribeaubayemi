-- Finjaro — Maintenance Cycle: geolocation for "Près de vous" GPS search.
-- Idempotent. Adds optional coordinates to shops and near_you_listings.

alter table public.shops add column if not exists lat double precision;
alter table public.shops add column if not exists lng double precision;

alter table public.near_you_listings add column if not exists lat double precision;
alter table public.near_you_listings add column if not exists lng double precision;

create index if not exists shops_geo_idx on public.shops (lat, lng);
create index if not exists near_you_geo_idx on public.near_you_listings (lat, lng);
