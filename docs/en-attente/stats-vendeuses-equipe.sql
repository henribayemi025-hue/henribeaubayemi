-- PROPOSITION — NON APPLIQUÉE, À NE PAS APPLIQUER TELLE QUELLE. Écrite le 12/10/2026.
-- Réunion du 10/10 : « les statistiques détaillées des vendeuses ne sont révélées qu'à l'équipe ;
-- seules les étoiles figurent sur le profil public ». Reprend le commentaire n° 8.
--
-- FAIT (staging, 665229d) : l'AFFICHAGE. Le profil public et la carte de boutique ne montrent plus
-- abonnés, nombre d'articles ni « répond vite ».
-- RESTE (ce fichier) : la PROTECTION côté base. Aujourd'hui, quelqu'un qui interroge directement
-- l'API peut encore lire ces colonnes de `shops` : followers_count, seller_points, avg_response_minutes,
-- responds_fast, report_count. Masquer à l'écran n'est pas protéger.
--
-- POURQUOI ON NE PEUT PAS SIMPLEMENT RETIRER LE DROIT DE LECTURE
-- Retirer le droit de lecture de ces colonnes casserait, aujourd'hui, des écrans qui les lisent :
--   src/lib/homeCache.js          (accueil)
--   src/screens/buyer/Shops.jsx   (tri de l'annuaire par nombre d'abonnés)
--   src/screens/buyer/ShopProfile.jsx
--   src/screens/vendor/VendorDashboard.jsx  (ses points)       -> à passer par une fonction « mes chiffres »
--   src/screens/vendor/VendorStats.jsx      (ses abonnés)       -> idem
--   src/screens/vendor/VendorLeaderboard.jsx (points des 20 premières boutiques) -> décision de Beau
--   src/screens/admin/AdminShops.jsx, AdminUsers.jsx (console)  -> lecture par is_admin()
--   src/screens/legion/monde3d/affiches.js
-- ORDRE À SUIVRE (aucune étape ne casse la précédente) :
--   1. Code : chaque écran ci-dessus lit ses chiffres par une fonction (ci-dessous) au lieu de `shops.*`.
--   2. Décision de Beau sur le classement des vendeuses (le garder, le masquer, ou ne montrer à chacune que son rang).
--   3. Seulement alors : la migration de la section B.
--
-- A. Fonctions de lecture (additives, à créer d'abord)
create or replace function public.mes_chiffres_boutique(p_shop uuid)
returns table (followers_count integer, seller_points integer, avg_response_minutes numeric, responds_fast boolean)
language sql stable security definer set search_path to 'public'
as $$
  select s.followers_count, s.seller_points, s.avg_response_minutes, s.responds_fast
  from shops s where s.id = p_shop and (s.owner_id = auth.uid() or public.is_admin());
$$;
revoke all on function public.mes_chiffres_boutique(uuid) from public, anon;
grant execute on function public.mes_chiffres_boutique(uuid) to authenticated;

-- B. Retrait du droit de lecture direct — APRÈS les étapes 1 et 2, et après essai sur le projet de test.
-- (Les colonnes publiques — nom, avatar, étoiles `rating`, certification, ville… — restent lisibles.)
-- revoke select (followers_count, seller_points, avg_response_minutes, responds_fast, report_count)
--   on public.shops from anon, authenticated;
-- Attention : un `select *` sur shops échouerait alors pour ces rôles. Vérifier avec
--   grep -rn "from('shops')" src | grep "select('\*')"   avant d'appliquer.
