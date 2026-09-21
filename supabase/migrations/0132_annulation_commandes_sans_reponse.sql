-- Une commande ignorée n'avait pas de fin.
--
-- Constaté le 21/09 sur la production : une commande du 04/09 était encore
-- au statut `new` dix-sept jours plus tard. L'escalade de la migration 0113
-- avait pourtant bien tourné — rappel vendeuse, cliente prévenue, tâche cron
-- active. Le défaut n'était pas l'escalade : c'est qu'elle pose deux
-- horodatages et laisse la commande en `new` pour toujours. Personne ne la
-- reprend ensuite.
--
-- Conséquences : la commande remonte dans chaque rapport sans qu'on puisse
-- la solder, l'acheteuse reçoit un message puis plus rien, le stock reste
-- immobilisé chez une vendeuse qui ne répond pas, et tout comptage de
-- « commandes en cours » est faux.
--
-- Décision de Beau, 21/09 : au bout de sept jours après l'escalade, la
-- commande s'annule automatiquement. Annulation, pas un statut à part — donc
-- `restock_on_cancel()` (0128) recrédite le stock des lignes où il avait été
-- réellement retiré, et rien ne part côté comptabilité puisque la vente n'y
-- atterrit qu'à la livraison (0127).
--
-- Additif : une colonne, un cas de plus dans le verrou de statut, une
-- fonction, une tâche cron. Aucune colonne supprimée, aucune renommée.

-- ---------------------------------------------------------------------------
-- 1. Distinguer une annulation automatique d'une annulation humaine
-- ---------------------------------------------------------------------------
-- Sans ça, on ne peut plus faire la différence entre « la vendeuse a annulé »
-- et « personne n'a répondu » — deux situations qui ne se pilotent pas pareil.
alter table public.orders add column if not exists auto_cancelled_at timestamptz;

comment on column public.orders.auto_cancelled_at is
  'Renseignée quand la commande a été annulée automatiquement faute de réponse de la vendeuse (migration 0132). Nulle pour une annulation décidée par une personne.';

-- ---------------------------------------------------------------------------
-- 2. Le verrou de statut doit autoriser CE cas, et seulement lui
-- ---------------------------------------------------------------------------
-- `lock_order_status()` (0082, mis à jour en 0128) n'autorise la transition
-- vers `cancelled` qu'à la vendeuse ou à l'acheteuse. Depuis pg_cron il n'y a
-- ni JWT ni `auth.uid()` : la comparaison ne renvoie pas `false` mais NULL, et
-- l'annulation passerait par accident, parce que `not NULL` vaut NULL et
-- n'entre pas dans le `if`. Se reposer là-dessus serait un piège pour la
-- prochaine personne qui touche ce trigger.
--
-- On ajoute donc un cas explicite, ouvert par un réglage de transaction que
-- seule `annuler_commandes_sans_reponse()` pose. Un appel API direct ne peut
-- pas le poser : `set_config(..., true)` est local à la transaction, et la
-- fonction qui l'appelle n'est exécutable ni par `anon` ni par `authenticated`.
create or replace function public.lock_order_status()
returns trigger
language plpgsql
as $function$
declare
  est_vendeuse boolean;
  est_acheteuse boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Annulation automatique d'une commande restée sans réponse (0132).
  if coalesce(current_setting('finjaro.annulation_auto', true), '') = 'on'
     and old.status = 'new'
     and new.status = 'cancelled' then
    return new;
  end if;

  est_acheteuse := (auth.uid() = old.buyer_id);
  est_vendeuse := public.owns_shop(old.shop_id);

  if new.status is distinct from old.status then
    if not (
      -- Devis: la vendeuse chiffre (set_order_prices), la cliente accepte
      -- (accept_order_prices) ou refuse. Chacune des deux peut abandonner
      -- tant que le devis n'est pas accepté — aucun stock n'a bougé.
      (est_vendeuse and old.status = 'awaiting_price' and new.status = 'priced')
      or (est_acheteuse and old.status = 'priced' and new.status = 'new')
      or (est_acheteuse and old.status in ('awaiting_price', 'priced') and new.status = 'cancelled')
      or (est_vendeuse and old.status in ('awaiting_price', 'priced') and new.status = 'cancelled')
      -- Le parcours existant, inchangé.
      or (est_vendeuse and old.status = 'new' and new.status = 'confirmed')
      or (est_vendeuse and old.status = 'confirmed' and new.status = 'shipped')
      or (est_vendeuse and old.status = 'shipped' and new.status = 'delivered')
      or (est_vendeuse and old.status in ('new', 'confirmed', 'shipped') and new.status = 'cancelled')
      or (est_acheteuse and old.status = 'shipped' and new.status = 'delivered')
    ) then
      raise exception 'Transition de statut de commande non autorisée : % -> %', old.status, new.status;
    end if;
  end if;

  if new.buyer_received is distinct from old.buyer_received then
    if not (est_acheteuse and coalesce(old.buyer_received, false) = false and new.buyer_received = true) then
      raise exception 'Modification de buyer_received non autorisée.';
    end if;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. L'annulation elle-même
-- ---------------------------------------------------------------------------
-- Deux cas, parce que l'escalade ne peut pas tout couvrir :
--   a. la commande a été escaladée → sept jours après l'escalade ;
--   b. la commande n'a JAMAIS pu être escaladée (0113 exige `buyer_id`, donc
--      une commande passée sans compte ne l'est jamais) → dix jours après la
--      commande, soit le même délai total que le cas a.
-- Sans le cas b, le trou qu'on est en train de boucher resterait ouvert pour
-- toute commande sans compte.
create or replace function public.annuler_commandes_sans_reponse()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select o.id, o.order_no, o.buyer_id, o.shop_id,
           s.name as boutique, s.owner_id
    from public.orders o
    join public.shops s on s.id = o.shop_id
    where o.status = 'new'
      and o.auto_cancelled_at is null
      and (
        (o.buyer_escalated_at is not null and o.buyer_escalated_at < now() - interval '7 days')
        or (o.buyer_escalated_at is null and o.created_at < now() - interval '10 days')
      )
  loop
    -- Ouvre le cas prévu dans lock_order_status, pour cette transaction seule.
    perform set_config('finjaro.annulation_auto', 'on', true);

    update public.orders
       set status = 'cancelled',
           auto_cancelled_at = now()
     where id = r.id;

    perform set_config('finjaro.annulation_auto', 'off', true);

    -- L'acheteuse. On lui dit ce qui se passe et ce qu'elle peut faire, sans
    -- montant : le prix ne s'affiche que dans sa monnaie à elle, côté app.
    if r.buyer_id is not null then
      perform public.notify(
        r.buyer_id,
        'order_auto_cancelled',
        'Commande n°' || r.order_no || ' annulée',
        r.boutique || ' n''a pas répondu. On a annulé la commande pour toi — rien ne t''a été débité, et tu n''as plus à l''attendre. Les articles sont de nouveau disponibles ailleurs.',
        jsonb_build_object(
          'order_id', r.id, 'order_no', r.order_no, 'shop_id', r.shop_id,
          'path', '/profile/orders'
        )
      );
      perform public.push_notify(
        r.buyer_id,
        'Commande n°' || r.order_no || ' annulée',
        r.boutique || ' n''a pas répondu. Rien ne t''a été débité.',
        '/profile/orders',
        'order-auto-cancelled-' || r.id
      );
    end if;

    -- La vendeuse. Un fait, pas un reproche.
    perform public.push_notify(
      r.owner_id,
      'Commande n°' || r.order_no || ' annulée faute de réponse',
      'Elle attendait depuis dix jours. Les articles sont revenus dans ton stock.',
      '/vendor/orders',
      'order-auto-cancelled-vendor-' || r.id
    );

    perform public.alert_admins(
      'order_auto_cancelled',
      'Commande n°' || r.order_no || ' annulée automatiquement (' || r.boutique || ')',
      'Aucune réponse de la vendeuse après relance et escalade. Stock recrédité.',
      '/?s=veille',
      'order-auto-cancelled-admin-' || r.id,
      jsonb_build_object('order_id', r.id, 'shop_id', r.shop_id)
    );
  end loop;
end;
$$;

-- Le `revoke ... from anon, authenticated` utilisé jusqu'ici (0113 et suivantes)
-- ne ferme RIEN : Postgres accorde EXECUTE à `public` par défaut sur toute
-- fonction, et retirer le droit à deux rôles ne retire pas celui hérité de
-- `public`. Vérifié le 21/09 sur le projet de test :
-- has_function_privilege('authenticated', ...) répondait encore `true` après
-- le revoke. Il faut retirer `public` d'abord.
revoke execute on function public.annuler_commandes_sans_reponse() from public;
revoke execute on function public.annuler_commandes_sans_reponse() from anon, authenticated;

comment on function public.annuler_commandes_sans_reponse() is
  'Annule une commande restée sans réponse : sept jours après l''escalade (0113), ou dix jours après la commande quand l''escalade n''a pas pu avoir lieu. Le stock est recrédité par restock_on_cancel. Décision de Beau du 21/09.';

-- ---------------------------------------------------------------------------
-- 4. La tâche
-- ---------------------------------------------------------------------------
-- Un quart d'heure après l'escalade (30 */6), pour qu'une commande escaladée
-- dans le même cycle porte bien son horodatage avant d'être relue.
select cron.schedule(
  'finjaro-annulation-commandes-sans-reponse',
  '45 */6 * * *',
  $$select public.annuler_commandes_sans_reponse()$$
);
