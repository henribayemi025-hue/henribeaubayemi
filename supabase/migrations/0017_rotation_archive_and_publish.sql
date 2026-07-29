-- Finjaro — suite de 0016. Deux manques rendus visibles par la question
-- « est-ce que ça ne va pas polluer son espace ? » — la réponse était oui.
--
-- MANQUE 1: rien ne distinguait un article RETIRÉ PAR LA ROTATION d'un
-- brouillon que la vendeuse a créé elle-même. Au bout de quelques mois « Mes
-- articles » aurait mélangé ses vrais brouillons en cours avec des dizaines
-- d'arrivages passés. -> `rotated_at` marque les articles sortis par la
-- rotation, pour les ranger à part au lieu de les empiler.
--
-- MANQUE 2 (plus grave, préexistant): aucun écran ne permettait de publier ou
-- dépublier un article. Les fiches créées par Finou (volontairement en
-- brouillon, le temps d'ajouter des photos) étaient donc DÉFINITIVEMENT
-- invisibles, et la rotation aurait enfermé les articles sans retour possible.
-- Le bouton arrive côté interface; ici on ajoute ce qui lui manquait en base.
--
-- MANQUE 3: la rotation se basait sur `created_at`. Un article republié aurait
-- donc été ré-archivé la nuit suivante, puisque sa date de création reste
-- ancienne. -> `published_at`, remis à jour à chaque publication, sert
-- désormais de point de départ du compte à rebours.

alter table public.products
  add column if not exists rotated_at timestamptz,
  add column if not exists published_at timestamptz default now();

-- L'existant n'a jamais été « publié » explicitement: on prend sa date de
-- création, ce qui reproduit exactement le comportement d'avant.
update public.products set published_at = created_at where published_at is null;

drop index if exists products_rotation_idx;
create index if not exists products_rotation_idx
  on public.products (shop_id, published_at)
  where is_active and not is_permanent;

create or replace function public.rotate_shop_stock()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shop record;
  v_archived integer;
  v_total integer := 0;
begin
  for v_shop in
    select id, owner_id, name, rotation_days
    from public.shops
    where rotation_enabled and status = 'active'
  loop
    update public.products
       set is_active = false,
           rotated_at = now()
     where shop_id = v_shop.id
       and is_active
       and not is_permanent
       -- coalesce: un article d'avant cette migration n'a que created_at.
       and coalesce(published_at, created_at) < now() - make_interval(days => v_shop.rotation_days);
    get diagnostics v_archived = row_count;

    if v_archived > 0 then
      update public.shops set rotation_last_at = now() where id = v_shop.id;

      insert into public.notifications (user_id, type, title, body, data)
      values (
        v_shop.owner_id,
        'rotation',
        'Arrivage terminé',
        format(
          '%s article(s) sont sortis du catalogue dans %s. Mets ton nouvel arrivage en ligne !',
          v_archived, v_shop.name
        ),
        jsonb_build_object('shop_id', v_shop.id, 'archived', v_archived)
      );
    end if;

    v_total := v_total + v_archived;
  end loop;
  return v_total;
end $$;

revoke all on function public.rotate_shop_stock() from public, anon, authenticated;
