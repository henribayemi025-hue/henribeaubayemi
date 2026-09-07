-- Beau (capture d'écran) : Finia trouve « Hegshair » une fois dans la
-- conversation, puis dit ne pas la trouver juste après, et invente
-- « l'orthographe est parfois sensible » pour se couvrir.
--
-- CAUSE RÉELLE. find_shops faisait `ilike('name', '%' || query || '%')` —
-- une correspondance de SOUS-CHAÎNE stricte. La boutique s'appelle
-- « Hegshair » (un seul mot). Quand la personne (ou le modèle, en la
-- recopiant) tape « Hegs Hair » ou « Hegs Hairs », la requête devient
-- `%Hegs Hair%` : l'espace qu'elle contient n'existe nulle part dans
-- « Hegshair », donc zéro résultat — pas parce que le nom est mal
-- orthographié, mais parce qu'un espace en trop suffit à tout casser.
-- Un nom de boutique n'est pas un mot du dictionnaire: personne ne le
-- connaît au caractère près, et il faut donc que la recherche l'accepte
-- approximatif.
--
-- CORRECTIF, en base plutôt que dans la fonction edge: comparer les deux
-- côtés en ayant retiré tous les espaces (« hegshair » == « hegs hair »
-- une fois les espaces enlevés), et ajouter pg_trgm (déjà installée) en
-- filet pour les fautes plus larges qu'un simple espace — sans lui, une
-- vraie faute de frappe ("Hegshaïr") resterait tout aussi invisible.
create or replace function public.find_shops_search(
  p_query text default null, p_city text default null, p_country text default null
)
returns table (id uuid, name text, slug text, city text, country text, rating numeric, is_verified boolean)
language sql stable as $$
  select s.id, s.name, s.slug, s.city, s.country, s.rating, s.is_verified
  from public.shops s
  where s.status = 'active'
    and (
      p_query is null or btrim(p_query) = ''
      or regexp_replace(lower(s.name), '\s+', '', 'g')
           like '%' || regexp_replace(lower(btrim(p_query)), '\s+', '', 'g') || '%'
      or similarity(s.name, p_query) > 0.35
    )
    and (p_city is null or btrim(p_city) = '' or s.city ilike '%' || btrim(p_city) || '%')
    and (p_country is null or btrim(p_country) = '' or s.country = upper(btrim(p_country)))
  order by
    case when p_query is not null and btrim(p_query) <> '' then similarity(s.name, p_query) else 0 end desc,
    s.rating desc nulls last
  limit 6;
$$;
