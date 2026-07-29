-- Finjaro — la rotation SUPPRIME vraiment les articles (comportement demandé).
--
-- CORRECTION D'UNE PRUDENCE INJUSTIFIÉE (0016)
-- 0016 refusait de supprimer, au motif que l'historique des commandes serait
-- cassé. C'était faux, sur deux points vérifiables:
--   1. `order_items` stocke `name` et `price_fcfa` en dur (NOT NULL) au moment
--      de la commande — c'est une COPIE, pas une jointure. La facture d'une
--      cliente reste donc lisible même sans l'article.
--   2. `order_items.product_id` est en ON DELETE SET NULL: supprimer l'article
--      met ce champ à NULL, la ligne de commande reste intacte.
-- L'application supprimait d'ailleurs déjà pour de bon (VendorProductEdit et
-- FinouDeleteProduct font `.delete()`). La rotation s'aligne enfin dessus.
--
-- Une vendeuse qui travaille par arrivage ne veut pas d'un cimetière de
-- brouillons: l'arrivage passé disparaît, point. C'est le mode par défaut.
-- `rotation_delete = false` reste possible pour celles qui préfèrent retrouver
-- leurs fiches et les republier.
--
-- Effets de bord assumés, tous cohérents avec la suppression manuelle qui
-- existait déjà: les avis liés à l'article partent avec lui (ON DELETE
-- CASCADE), et les reels/conversations qui le référençaient gardent leur
-- contenu avec product_id à NULL.

alter table public.shops
  add column if not exists rotation_delete boolean not null default true;

create or replace function public.rotate_shop_stock()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop record;
  v_done integer;
  v_total integer := 0;
begin
  for v_shop in
    select id, owner_id, name, rotation_days, rotation_delete
    from public.shops
    where rotation_enabled and status = 'active'
  loop
    if v_shop.rotation_delete then
      delete from public.products
       where shop_id = v_shop.id
         and is_active
         and not is_permanent
         and coalesce(published_at, created_at) < now() - make_interval(days => v_shop.rotation_days);
      get diagnostics v_done = row_count;
    else
      update public.products
         set is_active = false,
             rotated_at = now()
       where shop_id = v_shop.id
         and is_active
         and not is_permanent
         and coalesce(published_at, created_at) < now() - make_interval(days => v_shop.rotation_days);
      get diagnostics v_done = row_count;
    end if;

    if v_done > 0 then
      update public.shops set rotation_last_at = now() where id = v_shop.id;

      insert into public.notifications (user_id, type, title, body, data)
      values (
        v_shop.owner_id,
        'rotation',
        'Arrivage terminé',
        format(
          case when v_shop.rotation_delete
            then '%s article(s) de l''arrivage précédent ont été supprimés dans %s. Mets ton nouvel arrivage en ligne !'
            else '%s article(s) sont sortis du catalogue dans %s. Mets ton nouvel arrivage en ligne !'
          end,
          v_done, v_shop.name
        ),
        jsonb_build_object('shop_id', v_shop.id, 'count', v_done, 'deleted', v_shop.rotation_delete)
      );
    end if;

    v_total := v_total + v_done;
  end loop;
  return v_total;
end $$;

revoke all on function public.rotate_shop_stock() from public, anon, authenticated;
