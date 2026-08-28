-- Les robots ne se déclenchent plus depuis l'API publique.
--
-- Relevé par l'analyseur de sécurité Supabase (28/08): les fonctions des
-- robots — relances de photos orphelines, rappel des boutiques vides,
-- inspection des contenus, revue de plateforme, relance des commandes,
-- récompense de parrainage — étaient exécutables par N'IMPORTE QUI via
-- /rest/v1/rpc/..., connecté ou non. Personne ne l'a fait, mais quelqu'un
-- aurait pu déclencher les relances en boucle et noyer les vendeuses de
-- notifications.
--
-- Ces fonctions n'ont qu'un seul appelant légitime: pg_cron, qui les exécute
-- en tant que propriétaire et n'est pas concerné par ces droits.
--
-- On ne touche à RIEN d'autre: les aides de RLS (is_admin, owns_shop,
-- is_member, in_conversation…) doivent rester exécutables par les personnes
-- connectées, place_order et claim_referral sont appelées par l'application,
-- et join_njangi / join_space / join_project appartiennent aux applications
-- tierces qui partagent cette base.

revoke execute on function public.chase_stale_orders() from anon, authenticated;
revoke execute on function public.lancer_inspection_contenus() from anon, authenticated;
revoke execute on function public.relancer_photos_orphelines() from anon, authenticated;
revoke execute on function public.remind_empty_shops() from anon, authenticated;
revoke execute on function public.revue_plateforme() from anon, authenticated;
revoke execute on function public.report_unmet_demand() from anon, authenticated;
