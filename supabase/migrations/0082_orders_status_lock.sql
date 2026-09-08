-- Trouvé en audit du 08/09 : la policy orders_update n'a qu'un USING, pas de
-- WITH CHECK — Postgres retombe alors sur USING pour valider la ligne
-- modifiée, qui ne restreint aucune COLONNE (RLS filtre des lignes, pas des
-- colonnes). Le verrou financier (migration 0077) protège déjà les montants
-- et payment_status, mais pas `status` ni `buyer_received` : un appel API
-- direct (hors app) permettait à une acheteuse de faire passer sa propre
-- commande à n'importe quel statut — "livrée" y compris, débloquant un avis
-- sans jamais avoir reçu l'article, ou "expédiée" en imitant la vendeuse.
--
-- Même technique que lock_order_financials : un trigger, pas un WITH CHECK
-- au niveau policy (qui ne peut pas restreindre une colonne précise). Les
-- transitions autorisées sont recopiées EXACTEMENT de VendorOrders.jsx et de
-- update_order_status (finou-chat) — les deux seuls endroits qui écrivent
-- `status` aujourd'hui :
--   vendeuse (owns_shop) : new->confirmed, confirmed->shipped,
--                          shipped->delivered, {new,confirmed,shipped}->cancelled
--   acheteuse (buyer_id) : shipped->delivered (avec buyer_received=true)
create or replace function public.lock_order_status()
returns trigger language plpgsql as $$
declare
  est_vendeuse boolean;
  est_acheteuse boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  est_acheteuse := (auth.uid() = old.buyer_id);
  est_vendeuse := public.owns_shop(old.shop_id);

  if new.status is distinct from old.status then
    if not (
      (est_vendeuse and old.status = 'new' and new.status = 'confirmed')
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
$$;

drop trigger if exists trg_lock_order_status on public.orders;
create trigger trg_lock_order_status
  before update on public.orders
  for each row execute function public.lock_order_status();

comment on function public.lock_order_status() is
  'Empêche une acheteuse/vendeuse de sauter une étape ou de faire avancer une commande hors de son rôle via un appel API direct — seul service_role (webhooks, fonctions serveur) y échappe. Trouvé en audit du 08/09.';
