-- Retire le droit d'exécution de la fonction de déclencheur finia_order_to_sale().
-- Essayé sur la base de test (14/10) : la livraison par la vendeuse passe toujours.
-- Appliqué en production le 14/10 (ordre de Beau : « mets en ligne sans me demander »).
-- Retour arrière : grant execute on function public.finia_order_to_sale() to anon, authenticated;
revoke execute on function public.finia_order_to_sale() from public, anon, authenticated;
