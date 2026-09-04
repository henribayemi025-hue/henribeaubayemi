-- Elargissement additif de la liste blanche events.type pour capter les
-- signaux d'engagement qui manquaient : ajout panier, ouverture checkout,
-- commande passee, partages, vue de reel.
--
-- Beau ce matin : « meme le nombre de clic sur un article recherche ou
-- ajout meme au panier tout dois etre traque on dois avoir le max de
-- donnees ». Sans ca on ne peut pas separer un article populaire d'un
-- article vraiment achete, et on ne sait pas quelle video ramene du
-- monde.
--
-- Additive : rien retire de la liste precedente.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (
  type = any(array[
    'product_view', 'shop_view', 'category_view', 'product_click',
    'follow', 'search', 'comment', 'visit',
    'whatsapp_click', 'phone_click', 'instagram_click',
    'search_devenir_vendeur_click',
    'cart_add', 'checkout_start', 'order_placed',
    'share_shop', 'share_reel', 'reel_view'
  ])
);
