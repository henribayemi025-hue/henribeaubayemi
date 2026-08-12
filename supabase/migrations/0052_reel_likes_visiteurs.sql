-- Aimer un reel sans avoir de compte.
--
-- Beau: « pour moi quelqu'un qui n'a pas de compte peut liker les vidéos, les
-- reels ». C'est le geste le plus léger de l'application: demander une
-- inscription pour un cœur, c'est perdre la personne avant qu'elle ait vu
-- quoi que ce soit. TikTok et Instagram laissent regarder et aimer avant de
-- demander quoi que ce soit.
--
-- Une visiteuse est identifiée par un jeton tiré au hasard et gardé dans son
-- navigateur (`visitor_id`). Ce n'est pas une identité: on ne sait pas qui
-- elle est, on sait seulement que c'est le même appareil — juste assez pour
-- qu'un même téléphone ne compte pas deux fois, et pour que le cœur reste
-- rempli quand elle revient.
--
-- Additif: aucune colonne supprimée, aucune renommée. Les likes existants,
-- tous rattachés à un compte, ne bougent pas.

alter table public.reel_likes
  add column if not exists visitor_id text;

-- `user_id` devient facultatif — c'est lui OU le jeton de visiteuse.
alter table public.reel_likes
  alter column user_id drop not null;

-- Exactement l'un des deux, jamais les deux ni aucun: sans cette règle, une
-- ligne vide de tout propriétaire deviendrait impossible à retirer.
alter table public.reel_likes
  drop constraint if exists reel_likes_owner_ck;
alter table public.reel_likes
  add constraint reel_likes_owner_ck
  check ((user_id is not null) <> (visitor_id is not null));

-- Un appareil = un like par reel. La contrainte `unique (reel_id, user_id)`
-- d'origine reste en place pour les comptes.
create unique index if not exists reel_likes_visitor_uq
  on public.reel_likes (reel_id, visitor_id)
  where visitor_id is not null;

-- Sécurité au niveau des lignes.
--
-- Les règles d'origine exigeaient `user_id = auth.uid()`, ce qui refusait
-- toute écriture à une visiteuse non connectée. On les remplace par des
-- règles qui acceptent LES DEUX cas, sans ouvrir la porte au reste:
--   * une personne connectée n'agit que sur SES likes;
--   * une visiteuse n'agit que sur des lignes anonymes, jamais sur celles
--     d'un compte.
drop policy if exists reel_likes_insert on public.reel_likes;
create policy reel_likes_insert on public.reel_likes for insert
  with check (
    (user_id is not null and user_id = (select auth.uid()))
    or (user_id is null and visitor_id is not null)
  );

drop policy if exists reel_likes_delete on public.reel_likes;
create policy reel_likes_delete on public.reel_likes for delete
  using (
    (user_id is not null and user_id = (select auth.uid()))
    or (user_id is null and visitor_id is not null)
  );

-- LIMITE ASSUMÉE, à connaître avant de lire les compteurs comme une vérité
-- absolue: la base ne peut pas vérifier qu'un jeton de visiteuse appartient
-- vraiment à celle qui l'envoie. Quelqu'un de mal intentionné pourrait donc
-- fabriquer des jetons pour aimer plusieurs fois, ou retirer des likes
-- anonymes. Le compteur reste toujours reconstructible (il se recalcule en
-- comptant les lignes), et les likes des comptes, eux, restent protégés.
-- C'est le prix du « sans compte », et c'est le choix de Beau.
