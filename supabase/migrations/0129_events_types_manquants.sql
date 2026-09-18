-- Les nouveaux repères de mesure étaient REJETÉS en silence.
--
-- Trouvé le 18/09 en pilotant l'application dans un vrai navigateur: chaque
-- envoi vers `events` répondait
--
--   400 · 23514 · new row for relation "events" violates check constraint
--        "events_type_check"
--
-- `track()` n'affiche rien quand l'écriture échoue — c'est voulu, une mesure
-- ne doit jamais gêner quelqu'un qui achète. Conséquence: tout ce qui a été
-- ajouté depuis le 16/09 ne mesurait RIEN, sans le moindre signe.
--
-- Ce qui a été perdu, vérifié en production (7 derniers jours):
--
--   contact_intent .......... 0 ligne — alors que le bouton WhatsApp est EN
--                             LIGNE depuis le 16/09. C'est exactement le
--                             chiffre qu'on attendait: combien de personnes
--                             ouvrent une fiche puis essaient de parler à la
--                             vendeuse.
--   intro_shown / intro_closed / cookie_answer / install_banner_closed
--                           .. 0 ligne — les trois écrans de première visite
--                             (en préproduction, commit 0fd43f3).
--
-- La leçon, pas la ligne de SQL: un `track()` ajouté sans ajouter son type ici
-- part en production et ne mesure rien. Le test de bout en bout ne peut pas
-- être « ça compile ».
--
-- Additive: la contrainte est ÉLARGIE, aucun type retiré, aucune donnée
-- touchée.

alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (type = any (array[
  'product_view', 'shop_view', 'category_view', 'product_click', 'follow',
  'search', 'comment', 'visit', 'whatsapp_click', 'phone_click',
  'instagram_click', 'search_devenir_vendeur_click', 'cart_add',
  'checkout_start', 'order_placed', 'share_shop', 'share_reel', 'reel_view',
  'perf_page_load',
  -- Ajoutés le 18/09
  'contact_intent',        -- ouvrir le chat ou WhatsApp depuis une fiche
  'intro_shown',           -- les écrans de première visite
  'intro_closed',
  'cookie_answer',         -- accepté / refusé
  'install_banner_closed'  -- bandeau « installer l'app » fermé
]::text[]));
