-- Beau: « le site prend trop de temps pour charger ». Sans mesure réelle,
-- on ne peut que deviner (cache d'images vidé au déploiement ? réseau ?
-- autre chose ?). Le client enregistre désormais le VRAI temps de premier
-- affichage (LCP) et le temps des images, une fois par onglet — voir
-- src/lib/perf.js. Additive: on élargit juste la liste des types déjà
-- acceptés par la table events.

alter table public.events drop constraint events_type_check;
alter table public.events add constraint events_type_check check (
  type = any (array[
    'product_view','shop_view','category_view','product_click','follow','search','comment',
    'visit','whatsapp_click','phone_click','instagram_click','search_devenir_vendeur_click',
    'cart_add','checkout_start','order_placed','share_shop','share_reel','reel_view',
    'perf_page_load'
  ])
);
