-- `revoke ... from anon, authenticated` ne révoquait rien.
--
-- Trouvé le 21/09 en posant 0132. Postgres accorde EXECUTE à `public` par
-- défaut sur toute fonction: retirer le droit à deux rôles ne retire pas
-- celui hérité de `public`. Mesuré sur le projet de test, juste après le
-- revoke censé fermer la fonction:
--
--   select has_function_privilege('authenticated', 'public.…()', 'execute');
--   -- true
--
-- La formule est recopiée depuis 0091 dans les deux dépôts de l'environnement
-- Finjaro. Claudinette a fait l'inventaire de son côté: elle n'avait écrit
-- aucun revoke du tout, et a trouvé une fonction qui contournait sa RLS.
--
-- Ici, quatorze fonctions `security definer` sont exécutables par n'importe
-- quel compte connecté alors qu'elles ne sont appelées que par pg_cron ou par
-- une fonction edge en service_role.
--
-- Vérifié avant de fermer, pas après:
--   * aucune n'apparaît dans un appel `.rpc()` du dépôt (l'application et la
--     console d'équipe appellent 26 fonctions, aucune de celles-ci);
--   * aucune n'est appelée depuis le corps d'une autre fonction (donc aucun
--     trigger `security invoker` ne s'en sert);
--   * douze sont dans une tâche `cron.job`, qui s'exécute avec le rôle qui
--     l'a programmée et garde donc son droit;
--   * `conversations_a_relancer_ia` n'est appelée que par la fonction edge
--     `chat-autoreply`, qui utilise SUPABASE_SERVICE_ROLE_KEY;
--   * `product_alerts_fire` n'est appelée de nulle part aujourd'hui.
--
-- Ce que ça ferme concrètement. Le plus net est
-- `conversations_a_relancer_ia`: `security definer`, sans aucun contrôle
-- d'appelant, elle renvoie l'identifiant de l'acheteuse, celui de la boutique
-- et celui de la vendeuse pour chaque conversation en attente. N'importe quel
-- compte connecté pouvait donc lire QUI parle à QUI — pas le contenu des
-- messages, mais la relation, ce qui suffit. Les treize autres permettaient
-- de déclencher à volonté des envois de notifications et de push à des
-- vendeuses, autant de fois que voulu.
--
-- Additif: aucune fonction supprimée, aucune renommée, aucun corps modifié.
-- Seul le droit d'appel change.

do $$
declare
  f text;
  cibles text[] := array[
    'chase_stale_orders()',
    'digest_hebdo_vendeuses()',
    'escalader_commandes_ignorees()',
    'lancer_chat_autoreply()',
    'lancer_chat_moderation()',
    'lancer_inspection_contenus()',
    'nettoyer_stories_expirees()',
    'recompute_shop_response_times()',
    'relancer_boutiques_debordees()',
    'relancer_photos_orphelines()',
    'remind_empty_shops()',
    'revue_plateforme()',
    'product_alerts_fire()',
    'conversations_a_relancer_ia(integer, integer)'
  ];
begin
  foreach f in array cibles loop
    -- `public` D'ABORD: c'est tout le sujet de cette migration.
    execute format('revoke execute on function public.%s from public', f);
    execute format('revoke execute on function public.%s from anon, authenticated', f);
  end loop;
end $$;

-- Ce qui N'EST PAS fermé ici, volontairement, pour qu'on ne croie pas le
-- travail fini:
--
--   * `notify`, `push_notify`, `alert_admins` — appelées depuis des triggers.
--     Un trigger `security invoker` s'exécute avec les droits de la personne
--     qui écrit la ligne: leur retirer le droit ferait échouer des insertions
--     ordinaires. Chacune demande d'être vérifiée trigger par trigger.
--   * `alert_admins` en particulier N'A AUCUN contrôle d'appelant — le
--     `is_admin` qu'on y lit est une colonne de `profiles`, pas une
--     vérification. N'importe qui peut donc envoyer une notification à tous
--     les administrateurs. À traiter, mais pas à l'aveugle.
--   * les fonctions de trigger (`on_*`, `restock_on_cancel`,
--     `lock_order_status`…): Postgres refuse déjà un appel direct d'une
--     fonction qui retourne `trigger`. Le droit ouvert ne sert à rien et ne
--     permet rien.
--   * les fonctions que l'application appelle vraiment (`place_order`,
--     `send_direct_message`, `admin_veille`…). Les cinq `admin_*` ont été
--     relues: toutes commencent par `if not is_admin() then raise exception`.
