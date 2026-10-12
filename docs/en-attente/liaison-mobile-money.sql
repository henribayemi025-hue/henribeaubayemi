-- PROPOSITION — NON APPLIQUÉE, NON TESTÉE sur le projet de test.
-- Écrite le 12/10/2026 après la réunion n° 19 et la réponse de Claudinette du 09/10 9 h 35.
-- Touche la base COMMUNE (finia_events, trigger sur orders) : elle ne part qu'avec le mot de Beau,
-- et Claudinette est prévenue avant (Finjaro Accounting lit ces événements).
--
-- Constat mesuré le 12/10 (lecture seule) : orders.payment_status = 'cod' pour 20 commandes
-- (aucun fournisseur), 'failed' pour 8 essais Stripe. Rien de payé en ligne à ce jour : la
-- liaison actuelle (0127) est donc juste, et ce fichier ne sert qu'au PREMIER agrégateur mobile money.
--
-- Les deux conditions de Claudinette :
--   1. le debt.pay reprend l'identifiant de dette de la vente  -> on le LIT dans l'événement
--      sale.record de la commande (payload->'ids'->>'debt'), il n'est jamais recalculé ;
--   2. debt.pay n'est pas idempotent                          -> id d'événement, de règlement et
--      d'écriture DÉRIVÉS de la commande, et « on conflict (id) do nothing ».
--
-- Valeurs de payment_status connues : 'cod', 'paid', 'failed'. On suppose 'pending' pour un
-- paiement en ligne lancé et pas encore confirmé (À CONFIRMER avec le code de l'agrégateur).

-- (A) À la livraison : une commande déjà payée (paid) ou payée en main propre (cod) est encaissée ;
--     une commande dont le paiement en ligne n'est pas confirmé reste à encaisser (paid = 0).
--     Dans finia_order_to_sale(), remplacer les lignes 'paid' et 'method' par :
--
--   'paid', case when new.payment_status in ('paid', 'cod') then v_total else 0 end,
--   'method', case
--               when new.payment_provider = 'stripe' then 'CARD'
--               when new.payment_provider is not null then 'MOBILE'   -- agrégateur mobile money
--               else 'CASH'
--             end,
--
--   (le reste de la fonction ne change pas : le reducer d'Accounting crée la créance 411 tout seul
--    quand paid < total, vérifié par Claudinette le 09/10 sur une vente de 3 000 XAF).

-- (B) À la confirmation du paiement, après la livraison : règle la créance, une seule fois.
create or replace function public.finia_order_paid_to_debt_pay()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sale     jsonb;
  v_ws       uuid;
  v_owner    uuid;
  v_debt     text;
  v_total    bigint;
  v_paye     bigint;
  v_methode  text;
begin
  -- Seulement le passage à « paid » d'une commande déjà livrée.
  if new.payment_status is distinct from 'paid' or old.payment_status is not distinct from 'paid' then
    return new;
  end if;
  if new.status <> 'delivered' then
    return new;  -- livrée plus tard : la vente sera alors écrite directement payée (A)
  end if;

  -- La vente de cette commande (même identifiant que la commande, cf. 0127).
  select e.payload->'sale', e.workspace_id, e.actor_id, e.payload->'ids'->>'debt'
    into v_sale, v_ws, v_owner, v_debt
    from finia_events e
   where e.id = new.id and e.type = 'sale.record';

  if v_sale is null or v_debt is null then
    insert into finia_liaison_log(order_id, reason) values (new.id, 'paiement_sans_vente');
    return new;
  end if;

  v_total := (v_sale->>'total')::bigint;
  v_paye  := (v_sale->>'paid')::bigint;
  if v_paye >= v_total then
    return new;  -- déjà encaissée à la livraison : rien à régler
  end if;

  v_methode := case when new.payment_provider = 'stripe' then 'CARD' else 'MOBILE' end;

  -- Identifiants dérivés de la commande : rejouer ce trigger ne peut pas encaisser deux fois.
  insert into finia_events (id, workspace_id, actor_id, actor_name, at, type, payload)
  values (
    md5('debt.pay:' || new.id::text)::uuid, v_ws, v_owner, 'Finjaro',
    coalesce(new.paid_at, now()), 'debt.pay',
    jsonb_build_object(
      'debtId', v_debt,
      'payment', jsonb_build_object(
        'id', md5('debt.pay.payment:' || new.id::text)::uuid,
        'date', to_char(coalesce(new.paid_at, now()), 'YYYY-MM-DD'),
        'amount', v_total - v_paye,
        'method', v_methode
      ),
      'entryId', md5('debt.pay.entry:' || new.id::text)::uuid
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- drop trigger if exists trg_finia_order_paid_to_debt_pay on public.orders;   -- jamais de DROP sans Beau
-- create trigger trg_finia_order_paid_to_debt_pay
--   after update of payment_status on public.orders
--   for each row execute function public.finia_order_paid_to_debt_pay();

-- À rejouer par Claudinette dans le reducer avant toute application :
--   * vente CONFIRMED paid = 0, method 'MOBILE'  -> déjà rejoué le 09/10 (OK)
--   * puis ce debt.pay (même debtId, montant = reste dû) -> 411 soldé, 523 débité
--   * puis le MÊME debt.pay une seconde fois (même id d'événement) -> doit être ignoré par la
--     contrainte d'unicité côté finia_events, jamais compté deux fois.
