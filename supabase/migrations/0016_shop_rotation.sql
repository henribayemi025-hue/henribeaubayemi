-- Finjaro — arrivages tournants ("rotation") pour les boutiques qui le veulent.
--
-- BESOIN
-- Des vendeuses travaillent par arrivage: « cette semaine j'ai ça, la semaine
-- prochaine ça change ». Aujourd'hui elles doivent désactiver à la main chaque
-- article de la semaine passée, donc en pratique elles ne le font pas et le
-- catalogue affiche du stock qui n'existe plus.
--
-- CHOIX IMPORTANT: on N'EFFACE PAS.
-- « Ça s'efface » ne peut pas être un DELETE: `order_items` référence les
-- articles, supprimer une ligne casserait l'historique des commandes (et la
-- facture d'une cliente). La rotation repasse donc l'article en BROUILLON
-- (is_active = false): il sort du catalogue public immédiatement, la vendeuse
-- le retrouve dans « Mes articles » et peut le republier tel quel si l'arrivage
-- revient. Rien n'est perdu, rien n'est irréversible.
--
-- FENÊTRE GLISSANTE, PAS UN COUPERET GLOBAL
-- Chaque article vit `rotation_days` jours à partir de SA mise en ligne, puis
-- passe en brouillon. Une pièce ajoutée la veille du passage du robot n'est
-- donc jamais balayée avec l'arrivage précédent — c'était le vrai risque d'une
-- rotation "on vide tout tous les 7 jours".

-- pg_cron: nécessaire pour faire tourner le balayage quotidien côté base,
-- sans dépendre d'un service externe qui pourrait être en panne.
create extension if not exists pg_cron with schema extensions;

alter table public.shops
  add column if not exists rotation_enabled boolean not null default false,
  add column if not exists rotation_days integer not null default 7,
  add column if not exists rotation_last_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.shops'::regclass and conname = 'shops_rotation_days_ck'
  ) then
    alter table public.shops
      add constraint shops_rotation_days_ck check (rotation_days between 1 and 90);
  end if;
end $$;

-- Échappatoire indispensable: les pièces permanentes (best-seller, sur-mesure,
-- prestation mariage…) ne doivent pas disparaître avec l'arrivage.
alter table public.products
  add column if not exists is_permanent boolean not null default false;

create index if not exists products_rotation_idx
  on public.products (shop_id, created_at)
  where is_active and not is_permanent;

-- Balayage. SECURITY DEFINER parce qu'il doit écrire dans les articles de
-- TOUTES les boutiques concernées, ce qu'aucun utilisateur ne peut faire —
-- mais il n'accepte aucun paramètre, ne lit rien d'autre, et n'est appelable
-- que par le planificateur (droits révoqués plus bas).
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
       set is_active = false
     where shop_id = v_shop.id
       and is_active
       and not is_permanent
       and created_at < now() - make_interval(days => v_shop.rotation_days);
    get diagnostics v_archived = row_count;

    if v_archived > 0 then
      update public.shops set rotation_last_at = now() where id = v_shop.id;

      insert into public.notifications (user_id, type, title, body, data)
      values (
        v_shop.owner_id,
        'rotation',
        'Arrivage terminé',
        format(
          '%s article(s) sont repassés en brouillon dans %s. Mets ton nouvel arrivage en ligne !',
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

-- Tous les jours à 03:00 UTC (~04:00 Douala): la fenêtre étant glissante, un
-- passage quotidien suffit et lisse la charge.
do $$
begin
  perform cron.unschedule('finjaro-rotate-stock')
  where exists (select 1 from cron.job where jobname = 'finjaro-rotate-stock');

  perform cron.schedule(
    'finjaro-rotate-stock',
    '0 3 * * *',
    $cron$select public.rotate_shop_stock()$cron$
  );
end $$;
