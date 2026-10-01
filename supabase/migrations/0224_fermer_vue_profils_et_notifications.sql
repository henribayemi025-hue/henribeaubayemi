-- Trois failles trouvées par l'audit du 01/10, fermées le jour même avec
-- l'accord de Beau (« oui, corrige maintenant »).
--
-- 1. `profiles_public` est une vue SECURITY DEFINER (propriétaire postgres,
--    qui ne subit pas la RLS de `profiles`), simple donc modifiable, et
--    `anon` / `authenticated` avaient INSERT, UPDATE, DELETE, TRUNCATE dessus.
--    N'importe qui, sans compte, pouvait donc renommer ou effacer le profil
--    de tout utilisateur. Vérifié par une modification à vide en rôle anon,
--    dans une transaction annulée. Le seul usage est une LECTURE
--    (ReelCommentsSheet : nom de l'auteur d'un commentaire) : on ne garde que
--    SELECT.
--
-- 2. `push_notify` : le 28/09 (0212-0213) on a retiré EXECUTE à anon et
--    authenticated, mais pas à PUBLIC, qui l'avait par défaut — la fonction
--    restait appelable par tout le monde : une notification « Finjaro » avec
--    le lien de son choix, vers n'importe quel utilisateur.
--
-- 3. `alert_admins` (aucune garde : notification + push à tous les admins,
--    titre, texte et lien libres) et `report_unmet_demand` (rapport envoyé à
--    l'admin) étaient appelables par tout le monde via /rest/v1/rpc.
--
-- Qui les appelle encore : uniquement des déclencheurs et des fonctions
-- SECURITY DEFINER (exécutés avec les droits du propriétaire) et la tâche
-- planifiée finjaro-unmet-demand (postgres), plus service_role pour les
-- fonctions edge. Aucun code client de la place de marché ni de Finjaro
-- Accounting (vérifié dans les deux dépôts). Rien d'autre ne change : aucune
-- donnée, aucune colonne.

revoke insert, update, delete, truncate, references, trigger on public.profiles_public from anon, authenticated, public;
grant select on public.profiles_public to anon, authenticated;

revoke execute on function public.push_notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.alert_admins(text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.report_unmet_demand() from public, anon, authenticated;

grant execute on function public.push_notify(uuid, text, text, text, text) to service_role;
grant execute on function public.alert_admins(text, text, text, text, text, jsonb) to service_role;
grant execute on function public.report_unmet_demand() to service_role;
