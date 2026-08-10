-- Les commandes qui dorment.
--
-- Constat du 10/08/2026: sur 21 commandes, ONZE sont encore « nouvelle ».
-- Des clientes ont commandé et n'ont jamais eu de réponse. Rien ni personne
-- ne relançait: une commande pouvait rester en attente indéfiniment.
--
-- Deux relances, et deux seulement:
--   24 h  -> la vendeuse. Elle ne sait peut-être même pas: aucune boutique
--            n'a activé les notifications, et trois vendeuses n'ont pas
--            d'adresse e-mail du tout.
--   48 h  -> l'acheteuse. On lui dit la vérité — la boutique n'a pas encore
--            répondu — plutôt que de la laisser attendre dans le vide. Une
--            cliente prévenue peut relancer elle-même ou aller ailleurs;
--            une cliente ignorée ne revient jamais.
--
-- Chaque relance part UNE fois (horodatée), jamais deux. Une commande qui
-- avance (acceptée, annulée…) sort d'elle-même du champ de la requête.

alter table public.orders
  add column if not exists vendor_reminded_at timestamptz,
  add column if not exists buyer_informed_at timestamptz;

comment on column public.orders.vendor_reminded_at is
  'Date de la relance envoyée à la boutique pour une commande restée « nouvelle ».';
comment on column public.orders.buyer_informed_at is
  'Date où l''acheteuse a été prévenue que la boutique n''avait pas encore répondu.';

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

  -- 1) La vendeuse, après 24 h sans réponse.
  for r in
    select o.id, o.order_no, o.total_fcfa, s.owner_id, s.name as boutique
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '24 hours'
      and o.vendor_reminded_at is null
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Commande n°' || r.order_no || ' en attente',
        'body', 'Une cliente attend ta réponse depuis hier. Accepte-la ou refuse-la — sans réponse, elle ira ailleurs.',
        'url', '/vendor/orders',
        'tag', 'stale-order-vendor-' || r.id
      )
    );
    update public.orders set vendor_reminded_at = now() where id = r.id;
  end loop;

  -- 2) L'acheteuse, après 48 h. On ne promet rien, on ne l'inquiète pas
  --    inutilement: on lui donne le moyen d'agir.
  for r in
    select o.id, o.order_no, o.buyer_id, s.name as boutique
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.created_at < now() - interval '48 hours'
      and o.buyer_informed_at is null
      and o.buyer_id is not null
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.buyer_id,
        'title', 'Ta commande n°' || r.order_no || ' attend toujours',
        'body', r.boutique || ' n''a pas encore confirmé. Tu peux lui écrire directement depuis ta commande — rien ne t''a été débité.',
        'url', '/profile/orders',
        'tag', 'stale-order-buyer-' || r.id
      )
    );
    update public.orders set buyer_informed_at = now() where id = r.id;
  end loop;
end;
$function$;

revoke execute on function public.chase_stale_orders() from anon, authenticated;

-- Toutes les 6 heures: assez souvent pour qu'une commande du matin soit
-- relancée le lendemain matin, assez rare pour ne jamais ressembler à du
-- harcèlement.
select cron.schedule(
  'finjaro-stale-orders',
  '0 */6 * * *',
  $$select public.chase_stale_orders();$$
);
