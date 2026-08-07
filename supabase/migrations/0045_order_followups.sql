-- Relances automatiques Finia pour les commandes bloquées côté vendeuse
-- (jamais acceptées, ou acceptées mais jamais envoyées), avec annulation
-- automatique en dernier recours.
--
-- Étend `remind_pending_orders()` (déjà planifiée toutes les 6h, déjà signée
-- "Finia") au lieu d'ajouter un deuxième système parallèle. Ne touche QUE
-- status in ('new','confirmed') — jamais une commande déjà envoyée: à ce
-- stade la marchandise a peut-être déjà bougé, l'annuler automatiquement
-- serait dangereux. C'est la vendeuse qui doit agir, donc c'est elle qui est
-- relancée.
--
-- Calendrier (depuis la création de la commande): 7 jours -> 10 jours ->
-- 21 jours -> 30 jours = annulation automatique.
alter table public.orders
  add column if not exists followup_stage integer not null default 0;

comment on column public.orders.followup_stage is
  '0=aucune relance, 1=relance à 7 jours, 2=relance à 10 jours, '
  '3=dernière relance à 21 jours. À 30 jours sans mouvement: annulation automatique.';

-- Les commandes déjà bloquées au moment de la migration démarrent au stade
-- correspondant à leur âge réel, pour ne pas envoyer d'un coup toutes les
-- relances "en retard" le jour du déploiement.
update public.orders
set followup_stage = case
  when created_at < now() - interval '21 days' then 3
  when created_at < now() - interval '10 days' then 2
  when created_at < now() - interval '7 days' then 1
  else 0
end
where status in ('new', 'confirmed');

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

  -- Relance existante, inchangée: commandes JAMAIS acceptées, entre 6h et
  -- 14 jours, une notification groupée par vendeuse toutes les 6h tant
  -- qu'elles restent en attente.
  for r in
    select s.owner_id, count(*) as pending
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '6 hours'
      and o.created_at > now() - interval '14 days'
    group by s.owner_id
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Finia — commandes en attente',
        'body', r.pending || ' commande(s) attendent ta validation. Une réponse rapide rassure tes clientes !',
        'url', '/vendor/orders',
        'tag', 'order-reminder'
      )
    );
  end loop;

  -- Étape 1 — une semaine sans mouvement (jamais acceptée, ou acceptée mais
  -- jamais envoyée).
  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 0
      and o.created_at < now() - interval '7 days'
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Finia — des nouvelles de ta commande ?',
        'body', 'La commande #' || r.order_no || ' est en attente depuis une semaine. Ça en est où ?',
        'url', '/vendor/orders',
        'tag', 'order-followup-' || r.id
      )
    );
    update public.orders set followup_stage = 1 where id = r.id;
  end loop;

  -- Étape 2 — dix jours au total.
  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 1
      and o.created_at < now() - interval '10 days'
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Finia — deuxième relance',
        'body', 'La commande #' || r.order_no || ' est toujours en attente. Ta cliente attend une réponse.',
        'url', '/vendor/orders',
        'tag', 'order-followup-' || r.id
      )
    );
    update public.orders set followup_stage = 2 where id = r.id;
  end loop;

  -- Étape 3 — trois semaines, dernière relance avant annulation.
  for r in
    select o.id, o.order_no, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status in ('new', 'confirmed')
      and o.followup_stage = 2
      and o.created_at < now() - interval '21 days'
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Finia — dernière relance',
        'body', 'La commande #' || r.order_no || ' sera annulée automatiquement d''ici une dizaine de jours si elle n''avance pas.',
        'url', '/vendor/orders',
        'tag', 'order-followup-' || r.id
      )
    );
    update public.orders set followup_stage = 3 where id = r.id;
  end loop;

  -- Étape finale — un mois sans mouvement: annulation automatique,
  -- notification aux deux parties (même mécanisme que les autres
  -- changements de statut, voir on_order_status).
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
          cancel_reason = 'Annulée automatiquement — aucune réponse de la vendeuse après plusieurs relances.'
      where id = r.id;
    perform public.notify(r.buyer_id, 'order_cancelled', 'Commande annulée',
      'Ta commande #' || r.order_no || ' a été annulée faute de réponse de la boutique.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
    perform public.notify(r.owner_id, 'order_cancelled', 'Commande annulée automatiquement',
      'La commande #' || r.order_no || ' a été annulée faute de réponse.',
      jsonb_build_object('order_id', r.id, 'order_no', r.order_no));
  end loop;
end;
$function$;
