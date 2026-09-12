-- La console d'administration ne doit pas être lisible par le public.
--
-- Beau (11/09): « à part les gens de l'équipe, personne ne doit voir
-- Console Finjaro ».
--
-- Elle était déjà masquée dans l'interface (lib/apps.js, visibleApps), mais
-- la règle de lecture laissait passer TOUTES les lignes actives: n'importe
-- quel visiteur recevait la ligne « admin » dans la réponse de l'API, son
-- adresse comprise, et elle finissait dans le stockage local de son
-- navigateur. Masquer à l'écran n'est pas cacher.
--
-- La règle filtre donc maintenant à la source: une ligne destinée à l'équipe
-- n'est renvoyée qu'à l'équipe. Additive — on remplace une règle de lecture,
-- aucune colonne ni donnée n'est touchée.
drop policy if exists finjaro_apps_read on public.finjaro_apps;

create policy finjaro_apps_read on public.finjaro_apps
  for select
  using (
    is_admin()
    or (is_active = true and coalesce(audience, 'tous') <> 'admin')
  );
