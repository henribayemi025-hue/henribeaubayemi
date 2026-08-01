-- Cycle de commande complet + vitrine boutique (horaires, zones de livraison).
--
-- Constat de Beau (01/08): côté vendeur, le SEUL bouton passait une commande
-- directement de « nouvelle » à « envoyée » — pas de validation, pas de refus,
-- pas de suivi. Un vrai flux marketplace, c'est: l'acheteuse commande → la
-- boutique VALIDE (ou refuse en expliquant) → prépare/livre → livrée. Chaque
-- étape est horodatée pour afficher une vraie timeline de suivi côté
-- acheteuse.
--
-- Strictement ADDITIF (base partagée staging/production): colonnes nullables,
-- aucune valeur existante modifiée, aucune politique RLS touchée.

-- 1) Horodatage de chaque transition + raison de refus -----------------------
alter table public.orders add column if not exists confirmed_at timestamptz;
alter table public.orders add column if not exists shipped_at   timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;

comment on column public.orders.cancel_reason is
  'Raison donnée par la boutique quand elle refuse/annule (optionnelle mais affichée à l''acheteuse).';

-- 2) Vitrine boutique: horaires + zones de livraison -------------------------
-- opening_hours: { open: '08:00', close: '18:00', closed_days: [0] }
--   (closed_days en jours JS: 0=dimanche … 6=samedi). Simple volontairement:
--   mêmes horaires tous les jours ouverts — largement suffisant pour dire
--   « Ouvert / Fermé » sur la fiche, extensible plus tard par jour.
-- delivery_zones: [ { name: 'Yaoundé', fee_fcfa: 1000, days: 2 }, ... ]
--   La boutique liste où elle livre, à quel prix, sous combien de jours.
alter table public.shops add column if not exists opening_hours jsonb;
alter table public.shops add column if not exists delivery_zones jsonb;

-- 3) Rappel automatique Finia: commandes laissées sans réponse ---------------
-- Toutes les 6 h, chaque boutique ayant des commandes « new » de plus de 6 h
-- (et moins de 14 jours, pour ne pas rappeler l'archéologie) reçoit une
-- notification (push + e-mail via send-push). L'URL des fonctions est lue
-- dans app_config (clé functions_base_url): la même migration marche donc
-- sur le projet de test sans y activer les rappels (pas de clé -> no-op).
create or replace function public.remind_pending_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base_url text;
  r record;
begin
  -- value est jsonb: #>> '{}' extrait le texte SANS les guillemets JSON.
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return; -- projet sans rappels configurés (ex: base de test)
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
end;
$$;

revoke execute on function public.remind_pending_orders() from public, anon, authenticated;

-- (Re)programme le job sans doublon.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'finjaro-order-reminders') then
    perform cron.unschedule('finjaro-order-reminders');
  end if;
  perform cron.schedule('finjaro-order-reminders', '0 */6 * * *',
    $job$select public.remind_pending_orders()$job$);
end;
$$;
