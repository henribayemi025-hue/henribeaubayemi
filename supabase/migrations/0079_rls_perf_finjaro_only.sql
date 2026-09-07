-- Optimisation RLS — UNIQUEMENT les tables Finjaro.
--
-- L'audit performance du 07/09 pointait 38 "auth_rls_initplan" et 121
-- "multiple_permissive_policies" sur le projet. En vérifiant policy par
-- policy (pas seulement le décompte de l'avertisseur), la quasi-totalité
-- appartient aux DEUX OU TROIS AUTRES APPLICATIONS qui partagent ce
-- projet Supabase (njangis, budget_entries, business_*, projects,
-- shared_spaces, boutiques/produits en français — un schéma e-commerce
-- distinct du nôtre) : voir CLAUDE.md, « le projet est partagé ». On n'y
-- touche pas — on n'a aucune visibilité sur leur logique applicative, et
-- une policy cassée là-bas serait un incident sur un produit qui n'est
-- pas le nôtre.
--
-- Une fois ce tri fait, SEULES deux tables Finjaro avaient un vrai
-- `auth.uid()` nu (ré-évalué à chaque ligne au lieu d'une fois par
-- requête) : announcements et vendor_applications. Le reste de nos
-- propres tables utilise déjà `(select auth.uid())` — hérité des
-- migrations récentes (0072 et suivantes).
drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_admin_all on public.announcements
  for all using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- vendor_applications avait EN PLUS deux policies PERMISSIVE qui se
-- recouvrent sur SELECT (vendor_apps_read + vendor_apps_admin_read) et sur
-- UPDATE (vendor_apps_update + vendor_apps_admin_update) : Postgres les
-- évalue TOUTES LES DEUX à chaque requête (elles sont OR-ées de toute
-- façon), pour un résultat identique à une seule policy fusionnée.
drop policy if exists vendor_apps_admin_read on public.vendor_applications;
drop policy if exists vendor_apps_read on public.vendor_applications;
create policy vendor_apps_read on public.vendor_applications
  for select using (
    user_id = (select auth.uid())
    or public.is_admin()
  );

drop policy if exists vendor_apps_admin_update on public.vendor_applications;
drop policy if exists vendor_apps_update on public.vendor_applications;
create policy vendor_apps_update on public.vendor_applications
  for update using (
    user_id = (select auth.uid())
    or public.is_admin()
  ) with check (
    user_id = (select auth.uid())
    or public.is_admin()
  );
