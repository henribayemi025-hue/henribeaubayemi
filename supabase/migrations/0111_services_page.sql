-- Page Services (/services) en UN aller-retour.
--
-- Avant: la page enchaînait cinq requêtes en trois vagues (boutiques +
-- annonces + « ailleurs », puis noms des auteures, puis produits + avis),
-- et `select('*')` sur shops rapatriait 43 colonnes (horaires, zones de
-- livraison, compteurs internes…) dont la carte n'utilise qu'une douzaine.
-- Mesuré en vrai (événement perf_page_load): 11 s de médiane, 20 s en 3G.
-- Sur un réseau lent, ce sont les allers-retours qui coûtent, pas les
-- octets — trois vagues à 1,5 s de latence, c'est 4,5 s perdues avant le
-- premier rendu.
--
-- SECURITY INVOKER: la fonction lit avec les droits de l'appelant, donc
-- les RLS existantes (boutiques actives, produits actifs, annonces
-- publiques, profiles_public) s'appliquent telles quelles. Aucun nouveau
-- droit n'est ouvert.
create or replace function public.services_page(p_country text default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with shops_sel as (
  select id, slug, name, avatar_url, banner_url, bio, city, neighborhood,
         country, categories, rating, is_verified, lat, lng, followers_count,
         responds_fast
  from shops
  where status = 'active'
    and (p_country is null or country = p_country)
  order by followers_count desc nulls last
  limit 150
),
prods as (
  select p.shop_id, p.price_fcfa, p.images[1] as photo, p.created_at
  from products p
  where p.is_active
    and p.shop_id in (select id from shops_sel)
),
photos_ranked as (
  select shop_id, photo,
         row_number() over (partition by shop_id order by created_at desc) as rn
  from prods
  where photo is not null and photo <> ''
),
portfolio as (
  select shop_id, jsonb_agg(photo order by rn) as photos
  from photos_ranked
  where rn <= 3
  group by shop_id
),
minp as (
  select shop_id, min(price_fcfa) as min_price
  from prods
  where price_fcfa is not null and price_fcfa > 0
  group by shop_id
),
revs as (
  select shop_id, count(*)::int as n
  from reviews
  where shop_id in (select id from shops_sel)
  group by shop_id
),
lst as (
  select l.id, l.user_id, l.type, l.category, l.description, l.photo_url,
         l.country, l.city, l.created_at, l.lat, l.lng, l.price_fcfa, l.price_unit,
         jsonb_build_object('name', pp.name) as profiles
  from near_you_listings l
  left join profiles_public pp on pp.id = l.user_id
  order by l.created_at desc
  limit 40
)
select jsonb_build_object(
  'shops', coalesce((select jsonb_agg(to_jsonb(s) order by s.followers_count desc nulls last) from shops_sel s), '[]'::jsonb),
  'portfolios', coalesce((select jsonb_object_agg(shop_id, photos) from portfolio), '{}'::jsonb),
  'min_prices', coalesce((select jsonb_object_agg(shop_id, min_price) from minp), '{}'::jsonb),
  'review_counts', coalesce((select jsonb_object_agg(shop_id, n) from revs), '{}'::jsonb),
  'listings', coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from lst l), '[]'::jsonb),
  'providers_elsewhere', case
    when p_country is null then 0
    else (select count(*)::int from shops where status = 'active' and country <> p_country)
  end
);
$$;

grant execute on function public.services_page(text) to anon, authenticated;
