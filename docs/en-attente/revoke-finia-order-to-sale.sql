-- Retrait du droit d'exécution sur la fonction de liaison commande -> vente.
-- NON APPLIQUÉ en production (touche la base commune : place de marché ET Accounting,
-- donc à l'accord de Beau). Essayé le 14/10 sur la base de test, puis annulé.
--
-- Pourquoi : finia_order_to_sale() est une fonction de déclencheur (SECURITY DEFINER)
-- que `anon` et `authenticated` peuvent exécuter. Elle n'est pas appelable par l'API
-- (une fonction de déclencheur ne s'appelle pas à la main), mais le droit n'a aucune
-- raison d'exister. Sa voisine finia_devise_espace() n'a déjà plus ce droit.
--
-- Essai (base de test qiyvoaljqmbfldephobp, tout annulé ensuite) :
--   avant : anon = oui, authenticated = oui
--   après le retrait : anon = non, authenticated = non
--   la vendeuse (rôle authenticated) passe une commande « expédiée » en « livrée » :
--   1 ligne mise à jour, aucune erreur de droit -> la livraison n'est pas bloquée.
--   Le déclencheur trg_finia_order_to_sale n'a pas besoin de ce droit pour tirer.
-- Retour arrière : grant execute on function public.finia_order_to_sale() to anon, authenticated;

revoke execute on function public.finia_order_to_sale() from public, anon, authenticated;
