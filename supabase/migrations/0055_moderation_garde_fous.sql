-- Deux trous découverts en câblant les boutons de la console.
--
-- 1) LE BOUTON QUI NE FAISAIT RIEN
--
-- `products` et `shops` ont chacune une règle d'écriture pour
-- l'administration (`products_admin_write`, `shops_admin_update`). `reels`
-- n'en a pas: seule la propriétaire de la boutique peut écrire dessus.
-- Le bouton « Remettre en ligne » sur une vidéo aurait donc touché ZÉRO
-- ligne — et en PostgreSQL une écriture bloquée par RLS ne renvoie pas
-- d'erreur, elle renvoie simplement « rien modifié ». Le bouton aurait
-- affiché « c'est fait » sans que rien ne se passe.
drop policy if exists reels_admin_write on public.reels;
create policy reels_admin_write on public.reels
  for update using (public.is_admin()) with check (public.is_admin());

-- 2) LE BLOCAGE QU'ON POUVAIT ANNULER SOI-MÊME
--
-- `products_write` et `reels_write` sont des règles ALL sur `owns_shop`: la
-- propriétaire peut modifier n'importe quelle colonne de ses propres lignes,
-- y compris remettre `is_active` à vrai et effacer `moderation_hidden_at`.
-- Autrement dit, la personne dont l'article venait d'être retiré pour
-- contenu interdit pouvait le remettre en vente elle-même, en un clic, depuis
-- son espace vendeur. Le retrait n'aurait tenu que jusqu'à ce qu'elle
-- rouvre l'application.
--
-- On ne retire aucun droit existant (les migrations restent additives et la
-- base est partagée): on ajoute un garde-fou qui restaure les deux colonnes
-- de modération quand celle qui écrit n'est pas administratrice. Elle peut
-- toujours modifier son titre, son prix, ses photos — mais pas lever sa
-- propre sanction.
-- `security invoker` (le défaut) et non `definer`: le garde-fou ne doit
-- s'appliquer qu'aux personnes, pas à l'inspection automatique. Celle-ci
-- écrit avec la clé de service, dont le rôle est `service_role` — c'est elle
-- qui POSE les marques de modération, et un garde-fou qui les efface aussitôt
-- annulerait tout le dispositif. Un rôle `definer` masquerait `current_user`
-- derrière le propriétaire de la fonction et rendrait ce test impossible.
create or replace function public.garde_moderation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Sortie immédiate dans le cas de très loin le plus fréquent: une écriture
  -- qui ne touche pas à la modération sur une ligne qui n'est pas bloquée.
  -- Ce déclencheur se pose sur des tables mises à jour en permanence (le
  -- compteur de vues d'un article, les abonnés d'une boutique); appeler
  -- `is_admin()` à chaque fois ajouterait une lecture de `profiles` à chaque
  -- vue de produit.
  if old.moderation_hidden_at is null
     and new.moderation_hidden_at is null
     and new.moderation_reason is not distinct from old.moderation_reason then
    return new;
  end if;

  if coalesce(auth.role(), current_user::text) = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.moderation_hidden_at := old.moderation_hidden_at;
  new.moderation_reason := old.moderation_reason;
  -- Un article retiré par la modération reste hors ligne tant que
  -- l'administration ne l'a pas levé.
  if old.moderation_hidden_at is not null then
    if tg_table_name = 'products' then
      new.is_active := false;
    elsif tg_table_name = 'shops' then
      new.status := 'suspended';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_garde_moderation on public.products;
create trigger products_garde_moderation
  before update on public.products
  for each row execute function public.garde_moderation();

drop trigger if exists reels_garde_moderation on public.reels;
create trigger reels_garde_moderation
  before update on public.reels
  for each row execute function public.garde_moderation();

drop trigger if exists shops_garde_moderation on public.shops;
create trigger shops_garde_moderation
  before update on public.shops
  for each row execute function public.garde_moderation();

-- 3) LE REPÈRE DE L'INSPECTION
--
-- L'inspection ne relit que ce qui est nouveau, et se repérait sur son heure
-- de départ. Or elle lit au maximum 200 articles par passage: au premier
-- passage sur un catalogue de 359, elle en aurait relu 200 puis posé le
-- repère à aujourd'hui — les autres n'auraient jamais été inspectés, sans que
-- rien ne le signale. Le repère dit maintenant jusqu'où elle a VRAIMENT lu.
alter table public.moderation_runs
  add column if not exists watermark timestamptz;

comment on column public.moderation_runs.watermark is
  'Jusqu''où cette inspection a réellement lu. Le passage suivant reprend à ce point.';
