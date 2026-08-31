-- Le rapport hebdomadaire des recherches infructueuses disait faux.
--
-- Message reçu le 31/08: « 33 recherches sans résultat. Cette semaine:
-- devenir vendeur (10), devenir (6), vendre (5), devenir ve (4), dev (2)…
-- Ce sont des vendeuses à recruter. »
--
-- DEUX défauts, et la conclusion était l'inverse de la vérité.
--
-- 1. LE COMPTAGE. La recherche se déclenche à chaque frappe: taper
--    « devenir vendeur » produit « dev », « deve », « deven », « deveni »,
--    « devenir », « devenir v »… soit une quinzaine de lignes pour UNE
--    personne et UN mot. Les « 33 recherches » sont en réalité une poignée
--    de gens. On ne garde donc que le terme le plus long de chaque salve.
--
-- 2. LA CONCLUSION. « Ce sont des vendeuses à recruter » était écrit en dur.
--    Or ces gens-là sont DÉJÀ dans l'application: ils tapent « devenir
--    vendeur » ou « ma boutique » dans la recherche de PRODUITS parce
--    qu'ils ne trouvent pas le bouton. Ce n'est pas une demande à servir,
--    c'est un écran à corriger. Les deux cas sont désormais séparés.

create or replace function public.report_unmet_demand()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  admin_id uuid;
  lignes_produit text;
  total_produit int;
  total_navigation int;
  corps text;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  select (value #>> '{}')::uuid into admin_id from public.app_config where key = 'admin_user_id';
  if base_url is null or base_url = '' or admin_id is null then
    return;
  end if;

  with brut as (
    select
      lower(btrim(e.meta->>'q')) as terme,
      -- Une « salve »: la même personne, ou le même visiteur anonyme, dans
      -- la même tranche de dix minutes. Sans ça, chaque frappe compte pour
      -- un visiteur distinct.
      coalesce(e.user_id::text, 'anon') || '-'
        || floor(extract(epoch from e.created_at) / 600)::text as salve
    from public.events e
    where e.type = 'search'
      and e.created_at > now() - interval '7 days'
      and (e.meta->>'n') is not null
      and (e.meta->>'n')::int = 0
      and length(btrim(coalesce(e.meta->>'q', ''))) between 3 and 40
  ),
  -- On ne garde que le mot ACHEVÉ: si « devenir » est le début de
  -- « devenir vendeur » tapé dans la même salve, seul le second compte.
  acheves as (
    select b.terme, b.salve
      from brut b
     where not exists (
       select 1 from brut b2
        where b2.salve = b.salve
          and b2.terme <> b.terme
          and b2.terme like b.terme || '%'
     )
  ),
  classe as (
    select terme, salve,
           terme ~ '(vendre|vendeur|vendeuse|devenir|ma boutique|ouvrir.*boutique|inscri|compte)'
             as cherche_a_vendre
      from acheves
  ),
  produits as (
    select terme, count(distinct salve) as gens
      from classe where not cherche_a_vendre
     group by terme order by gens desc, terme limit 8
  )
  select
    (select string_agg(terme || ' (' || gens || ')', ', ' order by gens desc, terme) from produits),
    (select coalesce(sum(gens), 0) from produits),
    (select count(distinct salve) from classe where cherche_a_vendre)
  into lignes_produit, total_produit, total_navigation;

  corps := '';
  if coalesce(total_produit, 0) > 0 then
    corps := 'Cherché sans rien trouver: ' || lignes_produit
          || '. Ce sont des articles qui manquent au catalogue.';
  end if;
  -- Le signal le plus important est celui-ci, et il était invisible.
  if coalesce(total_navigation, 0) > 0 then
    if corps <> '' then corps := corps || ' — '; end if;
    corps := corps || total_navigation
          || ' personne(s) ont cherché comment VENDRE depuis la recherche: '
          || 'elles sont déjà dans l''app et ne trouvent pas le bouton.';
  end if;

  if corps = '' then
    return;
  end if;

  perform net.http_post(
    url := base_url || '/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', admin_id,
      'title', 'Finjaro — recherches sans résultat',
      'body', corps,
      'url', '/admin',
      'tag', 'unmet-demand-' || to_char(now(), 'IYYY-IW')
    )
  );
end;
$function$;

revoke execute on function public.report_unmet_demand() from anon, authenticated;
