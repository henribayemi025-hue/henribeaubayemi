-- Diversifie le fil d'accueil par boutique au lieu du pur ordre chronologique.
--
-- Un ajout en masse verse des dizaines d'articles à la même boutique en une
-- fois (ByFlora: 93 articles, 79% du catalogue camerounais). En tri purement
-- chronologique, cette seule boutique occupait tout le haut du fil et
-- écrasait les sept autres — constaté le 04/08.
--
-- `row_number() over (partition by shop_id order by created_at desc)` donne à
-- chaque article son rang au sein de SA boutique (1 = le plus récent de cette
-- boutique). Trier par ce rang puis par date revient à afficher d'abord
-- l'article le plus récent de CHAQUE boutique, puis le deuxième plus récent de
-- chacune, etc. — un vrai tour de table. Une boutique qui n'a que peu
-- d'articles épuise vite son quota et cède la place aux autres; une boutique
-- qui vient d'en verser 90 d'un coup ne peut plus en placer qu'un par tour.

create or replace function public.home_feed_page(
  p_local_country text,    -- restreint aux boutiques de ce pays (NULL = pas de restriction)
  p_exclude_country text,  -- exclut les boutiques de ce pays (NULL = pas d'exclusion)
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  price_fcfa integer,
  compare_at_price_fcfa integer,
  images text[],
  video_url text,
  price_on_request boolean,
  category text,
  stock integer,
  shop_id uuid,
  views integer,
  shop_name text,
  shop_slug text,
  shop_country text
)
language sql
stable
as $$
  select p.id, p.name, p.price_fcfa, p.compare_at_price_fcfa, p.images, p.video_url,
         p.price_on_request, p.category, p.stock, p.shop_id, p.views,
         s.name as shop_name, s.slug as shop_slug, s.country as shop_country
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.is_active = true
    and s.status = 'active'
    and (p_local_country is null or s.country = p_local_country)
    and (p_exclude_country is null or s.country <> p_exclude_country)
  order by
    row_number() over (partition by p.shop_id order by p.created_at desc, p.id desc) asc,
    p.created_at desc,
    p.id desc
  offset greatest(0, p_offset)
  limit greatest(1, least(coalesce(p_limit, 24), 48));
$$;
grant execute on function public.home_feed_page(text, text, integer, integer) to anon, authenticated;

-- Compte exact des articles d'un pays — sert uniquement à décider si le fil
-- doit se compléter avec l'étranger (voir src/lib/homeCache.js). Fonction à
-- part plutôt qu'une colonne « total » dans home_feed_page: un count exact sur
-- toute la table à chaque page coûterait cher pour une information qui ne
-- change pas d'une page à l'autre.
create or replace function public.home_feed_count(p_country text)
returns integer
language sql
stable
as $$
  select count(*)::int
  from public.products p
  join public.shops s on s.id = p.shop_id
  where p.is_active = true and s.status = 'active' and s.country = p_country;
$$;
grant execute on function public.home_feed_count(text) to anon, authenticated;
