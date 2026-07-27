-- Finjaro — allow tracking Mirror AI (virtual try-on) usage in the existing
-- `events` table, so the miroir-ia edge function can enforce a daily quota
-- per user server-side (Gemini image generation is billed per call — this
-- caps Beau's exposure without relying on trust in the client).
do $$
declare c text;
begin
  select conname into c from pg_constraint
    where conrelid = 'public.events'::regclass and contype = 'c' limit 1;
  if c is not null then execute format('alter table public.events drop constraint %I', c); end if;
end $$;
alter table public.events add constraint events_type_check
  check (type in ('product_view','shop_view','category_view','product_click','follow','search','comment','mirror_try'));
