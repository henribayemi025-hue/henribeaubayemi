-- PROPOSITION — NON APPLIQUÉE EN PRODUCTION. Essai sur le projet de test : voir la fin du fichier.
-- Écrite le 12/10/2026 après la réunion n° 19 et la réponse de Claudinette du 09/10 9 h 35.
-- Touche la base COMMUNE (finia_events, trigger sur orders) : elle ne part qu'avec le mot de Beau,
-- et Claudinette est prévenue avant (Finjaro Accounting lit ces événements).
--
-- Constat mesuré le 12/10 (lecture seule, base de production, comptes de test compris) : 28 commandes,
-- 20 en 'cod' (aucun fournisseur) et 8 essais Stripe en 'failed'. Aucune en 'paid', aucune en 'unpaid'.
-- Rien de payé en ligne à ce jour : la liaison actuelle (0127) est donc juste, et ce fichier ne sert
-- qu'au PREMIER agrégateur mobile money.
--
-- Les deux conditions de Claudinette :
--   1. le debt.pay reprend l'identifiant de dette de la vente  -> on le LIT dans l'événement
--      sale.record de la commande (payload->'ids'->>'debt'), il n'est jamais recalculé ;
--   2. debt.pay n'est pas idempotent                          -> id d'événement, de règlement et
--      d'écriture DÉRIVÉS de la commande, et « on conflict (id) do nothing ».
--
-- Valeurs permises par la contrainte orders_payment_status_check : 'cod', 'unpaid', 'paid', 'failed',
-- 'refunded'. Un paiement en ligne lancé et pas encore confirmé est donc 'unpaid' (il n'existe pas de
-- 'pending'). Le nom exact du fournisseur mobile money dans payment_provider reste à fixer avec le
-- code de l'agrégateur : ici, tout fournisseur autre que 'stripe' est traité comme mobile money.

-- (A) À la livraison : seul un paiement EN LIGNE lancé et non confirmé ('unpaid' avec un fournisseur)
--     reste à encaisser (paid = 0). Tout le reste se comporte exactement comme aujourd'hui
--     ('cod', 'paid', 'failed' : payé = total), pour ne rien changer à ce qui marche.
--     Dans finia_order_to_sale(), remplacer les lignes 'paid' et 'method' par :
--
--   'paid', case when new.payment_status = 'unpaid' and new.payment_provider is not null then 0 else v_total end,
--   'method', case
--               when new.payment_status = 'paid' and new.payment_provider = 'stripe' then 'CARD'
--               when new.payment_provider is not null and new.payment_provider <> 'stripe' then 'MOBILE'
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

-- ESSAYÉ le 12/10/2026 sur le projet de TEST (qiyvoaljqmbfldephobp), dans un bloc annulé (rien n'est resté) :
--   * la partie (B) seule, avec une vente déjà écrite à paid = 0 (commande livrée, paiement 'unpaid' puis 'paid') ;
--   * résultat : 0 règlement avant, 1 règlement après le passage à 'paid' (montant = total, méthode MOBILE,
--     même debtId que la vente), toujours 1 après un second passage 'unpaid' puis 'paid' (rejeu ignoré) ;
--     rien de nouveau dans finia_liaison_log ;
--   * le statut de paiement d'une commande ne change QUE depuis le serveur (garde lock_order_financials :
--     service_role ou réglage interne) : seul le rappel de l'agrégateur peut donc déclencher (B).
-- NON essayé : la partie (A) (remplacement des lignes 'paid' et 'method' dans finia_order_to_sale),
-- le rejeu par le reducer d'Accounting (demandé à Claudinette), et le nom réel du fournisseur mobile money.
