-- FAILLE CRITIQUE, trouvée en audit et vérifiée en conditions réelles
-- (transaction simulée puis annulée, rien touché en prod) : n'importe
-- quelle acheteuse pouvait se déclarer « payée » sans payer.
--
-- orders_update avait un USING (buyer_id = auth.uid() OR owns_shop(shop_id))
-- mais AUCUN with_check. Sans with_check, Postgres retombe sur `using` pour
-- valider la ligne APRÈS modification — qui ne contrôle aucune colonne.
-- Depuis n'importe quel navigateur connecté :
--   supabase.from('orders').update({ payment_status:'paid', total_fcfa:1 })
--     .eq('id', maCommande)
-- réussissait. Vérifié: la commande de test passait de "cod"/2000 FCFA à
-- "paid"/1 FCFA sans toucher à Stripe. La vendeuse expédie une commande
-- jamais payée, ou pour centimes.
--
-- CORRECTIF: un trigger BEFORE UPDATE fige les colonnes financières et de
-- statut de paiement dès que l'appelant n'est pas service_role (donc pas
-- Stripe webhook, pas une fonction serveur). Un trigger plutôt qu'un
-- with_check RLS: il couvre aussi les colonnes que buyer ET vendeuse
-- partagent en écriture (owns_shop passe aussi par orders_update), sans
-- dupliquer la logique différemment pour chacun des deux `using`.
create or replace function public.lock_order_financials()
returns trigger language plpgsql as $$
begin
  -- service_role (webhook Stripe, fonctions serveur) contourne RLS de
  -- toute façon — ce trigger ne s'applique donc qu'aux écritures faites
  -- depuis un navigateur (acheteuse ou vendeuse), qui sont les seules à
  -- passer par du SQL soumis à ce trigger via l'API PostgREST.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status
    or new.payment_ref is distinct from old.payment_ref
    or new.paid_at is distinct from old.paid_at
    or new.subtotal_fcfa is distinct from old.subtotal_fcfa
    or new.total_fcfa is distinct from old.total_fcfa
    or new.delivery_fee_fcfa is distinct from old.delivery_fee_fcfa
    or new.platform_fee_fcfa is distinct from old.platform_fee_fcfa
  then
    raise exception 'Les montants et le statut de paiement d''une commande ne se modifient pas depuis l''app.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_lock_order_financials on public.orders;
create trigger trg_lock_order_financials
  before update on public.orders
  for each row execute function public.lock_order_financials();

comment on function public.lock_order_financials() is
  'Empêche buyer/vendeuse de modifier montants ou statut de paiement via un UPDATE navigateur — seul service_role (webhook Stripe, fonctions serveur) le peut. Trouvé en audit sécurité du 07/09.';
