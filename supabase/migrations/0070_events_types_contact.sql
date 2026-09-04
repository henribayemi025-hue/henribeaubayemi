-- La table events avait une liste blanche stricte de 8 types (voir la
-- contrainte events_type_check). Tout type non listé — le tout premier
-- track('whatsapp_click',...) que j'ai ajouté — est silencieusement rejete
-- par Postgres (insertion refusee, aucune erreur remontee dans le client
-- puisque track() est fire-and-forget). Resultat: on croyait mesurer les
-- clics WhatsApp/tel/Instagram, on ne mesurait rien.
--
-- Ce trou explique le paradoxe releve par Beau ce matin: sur 21 commandes
-- historiques, aucune trace du canal qui les a produites. Le clic direct
-- vers le WhatsApp d'une vendeuse — le vrai chemin d'achat au Cameroun —
-- n'etait dans aucun compteur.
--
-- Modification purement additive: on elargit la liste, on ne retire rien.
-- Anciens rapports et anciennes lignes ne bougent pas.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (
  type = any(array[
    -- Historique — inchange.
    'product_view', 'shop_view', 'category_view', 'product_click',
    'follow', 'search', 'comment', 'visit',
    -- Contact hors messagerie interne. C'est le trou principal: la plupart
    -- des ventes probables passent par un clic direct vers WhatsApp,
    -- appel telephone, ou Instagram — jamais tracee jusqu'ici.
    'whatsapp_click', 'phone_click', 'instagram_click',
    -- Signal d'intention deja utilise (ajoute hier soir, silencieusement
    -- rejete jusqu'a ce correctif).
    'search_devenir_vendeur_click'
  ])
);
