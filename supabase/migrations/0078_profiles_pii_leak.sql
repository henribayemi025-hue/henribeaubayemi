-- FUITE IMPORTANTE, trouvée en audit sécurité du 07/09 : profiles_read
-- était `using (true)` — n'importe quel compte connecté pouvait faire
--   select phone, address, city, is_suspended, report_count, deletion_reason
--   from profiles
-- et exfiltrer le carnet d'adresses ET le dossier de modération de TOUT LE
-- MONDE (vendeuses comme acheteuses). Rien côté client ne s'en servait
-- ainsi — la policy était juste trop large pour ce qu'il fallait vraiment.
--
-- CE QU'IL FALLAIT VRAIMENT (grep exhaustif de src/ avant d'y toucher) :
--   1. Chacun lit sa PROPRE ligne en entier (déjà couvert par "own profile").
--   2. Un admin lit tout (écrans AdminUsers/AdminShops/AdminSupport/
--      AdminModeration/AdminDemandes/AdminDashboard) — is_admin() suffit.
--   3. Une acheteuse voit la liste de ceux qu'ELLE a parrainés
--      (InviteFriend.jsx: `.eq('referred_by', profile.id)`) — juste
--      id/name/created_at/is_vendor, mais la ligne entière n'est jamais
--      lisible par un tiers de toute façon une fois ce correctif posé.
--   4. DEUX écrans PUBLICS ont besoin du NOM (rien d'autre) d'un inconnu :
--      NearYou.jsx (l'auteur d'une annonce "Je propose") et
--      ReelCommentsSheet.jsx (l'auteur d'un commentaire). Une simple
--      policy `using (true)` ne peut pas distinguer "le nom, oui" de
--      "le téléphone, non" — Postgres RLS filtre des LIGNES, pas des
--      colonnes. D'où la vue ci-dessous, qui ne recopie que ce qui est
--      déjà public par construction (le nom affiché sur une annonce).
--
-- profiles_read se resserre donc aux trois premiers cas ; le quatrième
-- passe par une vue dédiée, et les deux écrans concernés changent leur
-- requête (même commit) pour l'utiliser au lieu du embed PostgREST direct
-- sur la table de base.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (
    (select auth.uid()) = id
    or public.is_admin()
    or referred_by = (select auth.uid())
  );

-- security_invoker DÉLIBÉRÉMENT PAS activé (donc "security definer" par
-- défaut pour une vue: elle s'exécute avec les droits de son PROPRIÉTAIRE,
-- pas de l'appelant). C'est tout le principe ici: la policy profiles_read
-- ci-dessus refuse de montrer la ligne d'un inconnu, donc une vue en
-- security_invoker se heurterait à la même restriction et ne renverrait
-- plus aucun nom à personne — exactement l'inverse de ce qu'on veut. Seules
-- les colonnes explicitement listées (jamais phone/address/is_suspended...)
-- sortent de ce contournement volontaire et mesuré.
create or replace view public.profiles_public as
  select id, name, avatar_url, is_vendor from public.profiles;

comment on view public.profiles_public is
  'Colonnes strictement publiques d''un profil (nom affiché sur une annonce ou un commentaire) — jamais le téléphone, l''adresse ni les indicateurs de modération. Vue security-definer par construction: voir le commentaire au-dessus avant d''y ajouter une colonne.';

grant select on public.profiles_public to anon, authenticated;
