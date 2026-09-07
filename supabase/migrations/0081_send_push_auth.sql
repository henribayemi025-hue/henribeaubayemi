-- Authentifie enfin l'envoi à UNE personne de send-push, trouvé grand
-- ouvert en audit sécurité du 07/09: n'importe qui connaissant l'adresse de
-- la fonction pouvait écrire — au nom de Finjaro, push ET e-mail — à
-- n'importe quel compte désigné par son id. Seuls les envois COLLECTIFS
-- (audience) étaient déjà protégés.
--
-- Le correctif touche deux bouts:
--   1. Ici (SQL): push_notify() — la passerelle déjà commune à 5 triggers
--      (on_chat_message, on_order_created, on_order_status, et
--      alert_admins() pour on_support_ticket/on_demande_acheteur) — porte
--      désormais un jeton partagé en en-tête x-finjaro-token, même principe
--      que moderation_sweep (migration 0056) mais un secret DISTINCT: une
--      fuite de l'un ne compromet pas l'autre.
--   2. Là (edge function, même commit): send-push exige cette preuve — ou
--      la clé de service (déjà utilisée telle quelle par finou-chat et
--      miroir-ia), ou un compte administrateur authentifié (AdminRelances)
--      — avant d'accepter un envoi à un destinataire précis.
--
-- Restait quatre fonctions qui appelaient net.http_post DIRECTEMENT, sans
-- passer par push_notify — donc sans jeton, et qui seraient sinon
-- rejetées par le correctif ci-dessus: remind_empty_shops,
-- remind_pending_orders (quatre appels), chase_stale_orders (deux appels),
-- report_unmet_demand. Toutes les quatre sont recopiées ici à l'identique,
-- seul le bloc d'envoi change — le titre, le corps, l'URL et le tag de
-- chaque message restent mot pour mot ceux d'aujourd'hui.
insert into public.app_secrets (name, value)
values ('send_push', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.push_notify(p_user_id uuid, p_title text, p_body text, p_url text, p_tag text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare base_url text; jeton text;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  select value into jeton from public.app_secrets where name = 'send_push';
  if base_url is null or base_url = '' or p_user_id is null then
    return;
  end if;
  perform net.http_post(
    url := base_url || '/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := jsonb_build_object('user_id', p_user_id, 'title', p_title, 'body', p_body, 'url', p_url, 'tag', p_tag)
  );
exception when others then
  null;
end;
$function$;

create or replace function public.chase_stale_orders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select o.id, o.order_no, o.total_fcfa, s.owner_id, s.name as boutique
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '24 hours'
      and o.vendor_reminded_at is null
  loop
    perform public.push_notify(
      r.owner_id,
      'Commande n°' || r.order_no || ' en attente',
      'Une cliente attend ta réponse depuis hier. Accepte-la ou refuse-la — sans réponse, elle ira ailleurs.',
      '/vendor/orders',
      'stale-order-vendor-' || r.id
    );
    update public.orders set vendor_reminded_at = now() where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, o.buyer_id, s.name as boutique
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '48 hours'
      and o.buyer_informed_at is null
      and o.buyer_id is not null
  loop
    perform public.push_notify(
      r.buyer_id,
      'Ta commande n°' || r.order_no || ' attend toujours',
      r.boutique || ' n''a pas encore confirmé. Tu peux lui écrire directement depuis ta commande — rien ne t''a été débité.',
      '/profile/orders',
      'stale-order-buyer-' || r.id
    );
    update public.orders set buyer_informed_at = now() where id = r.id;
  end loop;
end;
$function$;

create or replace function public.remind_empty_shops()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
  msg_title text;
  msg_body text;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select s.id, s.name, s.owner_id, s.empty_catalog_reminders_sent as sent
    from public.shops s
    where s.status = 'active'
      and s.created_at < now() - interval '2 days'
      and (s.empty_catalog_reminded_at is null
           or s.empty_catalog_reminded_at < now() - interval '7 days')
      and s.empty_catalog_reminders_sent < 4
      and not exists (select 1 from public.products p where p.shop_id = s.id)
      and not (
        exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'SERVICE')
        and not exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'PRODUCT')
      )
  loop
    if r.sent = 0 then
      msg_title := 'Finia — ajoute tes premiers articles';
      msg_body := 'Ta boutique "' || r.name || '" est prête mais encore vide. Ajoute tes articles pour que les clientes puissent te trouver !';
    elsif r.sent = 1 then
      msg_title := 'Finia — ta boutique n''apparaît pas encore';
      msg_body := 'Sans article, "' || r.name || '" ne remonte pas dans les recherches. Trois photos suffisent pour démarrer.';
    elsif r.sent = 2 then
      msg_title := 'Finia — je peux t''aider à publier';
      msg_body := 'Pas le temps de tout saisir ? Envoie-moi une photo de ton article, je rédige la fiche pour toi.';
    else
      msg_title := 'Finia — dernier rappel';
      msg_body := 'Ta boutique "' || r.name || '" t''attend quand tu veux. On ne te relancera plus, mais elle reste ouverte.';
    end if;

    perform public.push_notify(
      r.owner_id,
      msg_title,
      msg_body,
      '/vendor/products/bulk',
      'empty-shop-' || r.id || '-' || r.sent
    );

    update public.shops
      set empty_catalog_reminded_at = now(),
          empty_catalog_reminders_sent = empty_catalog_reminders_sent + 1
      where id = r.id;
  end loop;
end;
$function$;

create or replace function public.remind_pending_orders()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select s.owner_id, count(*) as pending
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '6 hours'
      and o.created_at > now() - interval '14 days'
    group by s.owner_id
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — commandes en attente',
      r.pending || ' commande(s) attendent ta validation. Une reponse rapide rassure tes clientes !',
      '/vendor/orders',
      'order-reminder'
    );
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 0
      and o.created_at < now() - interval '7 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — des nouvelles de ta commande ?',
      'La commande #' || r.order_no || ' est en attente depuis une semaine. Ca en est ou ?',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 1 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 1
      and o.created_at < now() - interval '10 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — deuxieme relance',
      'La commande #' || r.order_no || ' est toujours en attente. Ta cliente attend une reponse.',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 2 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 2
      and o.created_at < now() - interval '21 days'
  loop
    perform public.push_notify(
      r.owner_id,
      'Finia — derniere relance',
      'La commande #' || r.order_no || ' sera annulee automatiquement d''ici une dizaine de jours si elle n''avance pas.',
      '/vendor/orders',
      'order-followup-' || r.id
    );
    update public.orders set followup_stage = 3 where id = r.id;
  end loop;

  for r in
    select o.id, o.order_no, o.buyer_id, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 3
      and o.created_at < now() - interval '30 days'
  loop
    update public.orders
      set status = 'cancelled',
          cancelled_at = now(),
          cancel_reason = 'Annulee automatiquement - aucune reponse de la vendeuse apres plusieurs relances.'
      where id = r.id;
    perform public.notify(r.buyer_id, 'order_cancelled', 'Commande annulee',
      'Ta commande #' || r.order_no || ' a ete annulee faute de reponse de la boutique.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
    perform public.notify(r.owner_id, 'order_cancelled', 'Commande annulee automatiquement',
      'La commande #' || r.order_no || ' a ete annulee faute de reponse.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
  end loop;
end;
$function$;

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
      coalesce(e.user_id::text, 'anon') || '-'
        || floor(extract(epoch from e.created_at) / 600)::text as salve
    from public.events e
    where e.type = 'search'
      and e.created_at > now() - interval '7 days'
      and (e.meta->>'n') is not null
      and (e.meta->>'n')::int = 0
      and length(btrim(coalesce(e.meta->>'q', ''))) between 3 and 40
  ),
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
  if coalesce(total_navigation, 0) > 0 then
    if corps <> '' then corps := corps || ' — '; end if;
    corps := corps || total_navigation
          || ' personne(s) ont cherché comment VENDRE depuis la recherche: '
          || 'elles sont déjà dans l''app et ne trouvent pas le bouton.';
  end if;

  if corps = '' then
    return;
  end if;

  perform public.push_notify(
    admin_id,
    'Finjaro — recherches sans résultat',
    corps,
    '/admin',
    'unmet-demand-' || to_char(now(), 'IYYY-IW')
  );
end;
$function$;
