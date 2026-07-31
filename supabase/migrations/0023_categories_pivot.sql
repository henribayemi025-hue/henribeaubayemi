-- Finjaro — PIVOT: arborescence de catégories définitive (marketplace
-- généraliste produits + services), fournie par Beau. S'appuie sur la table
-- `categories` créée en 0022. Idempotent, NON destructif:
--
--   - Les 25 catégories existantes GARDENT leur id (les produits, boutiques
--     et annonces qui les référencent ne bougent pas d'un octet, et tous les
--     liens profonds /categorie/<id> existants continuent de fonctionner).
--   - Elles sont RE-PARENTÉES sous les nouvelles catégories de premier
--     niveau: un produit "beaute" existant apparaît désormais dans
--     "Beauté & Cosmétiques" (la page catégorie inclut les enfants côté
--     client), sans qu'aucune ligne produit ne soit modifiée.
--
-- CHOIX À VALIDER (faits avec bon sens, signalés dans le rapport):
--   1. mode/chaussures/sacs/maroquinerie/accessoires → sous "Mode Femme".
--      Le catalogue historique est très majoritairement féminin; les
--      nouvelles fiches choisiront explicitement Femme/Homme.
--   2. cours / evenementiel_service / autre_service ne rentrent dans aucune
--      des 9 catégories services de la nouvelle liste → conservées au premier
--      niveau (les supprimer orphelinerait des annonces existantes).
--   3. "Véhicules" reçoit ses trois enfants (voiture/moto/pièces) — seule
--      arborescence enfant explicitement donnée dans la liste.

-- ---------------------------------------------------------------------------
-- 1. Nouvelles catégories PRODUCT de premier niveau.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('mode_femme',            null, 'PRODUCT', 'Mode Femme',                  'Women''s Fashion',        1),
  ('mode_homme',            null, 'PRODUCT', 'Mode Homme',                  'Men''s Fashion',          2),
  ('enfants_bebe',          null, 'PRODUCT', 'Enfants & Bébé',              'Kids & Baby',             3),
  ('hightech',              null, 'PRODUCT', 'High-Tech & Téléphones',      'Tech & Phones',           4),
  ('beaute_cosmetiques',    null, 'PRODUCT', 'Beauté & Cosmétiques',        'Beauty & Cosmetics',      5),
  ('bijoux_montres',        null, 'PRODUCT', 'Bijoux & Montres',            'Jewelry & Watches',       6),
  ('maison_deco',           null, 'PRODUCT', 'Maison & Déco',               'Home & Decor',            7),
  ('evenementiel_mariages', null, 'PRODUCT', 'Événementiel & Mariages',     'Events & Weddings',       8),
  ('alimentaire',           null, 'PRODUCT', 'Alimentaire & Pâtisserie',    'Food & Pastry',           9),
  ('jus_naturels',          null, 'PRODUCT', 'Jus Naturels',                'Natural Juices',         10),
  ('seconde_main',          null, 'PRODUCT', 'Seconde main & Ventes flash', 'Second-hand & Flash',    11),
  ('vehicules',             null, 'PRODUCT', 'Véhicules',                   'Vehicles',               12),
  ('immobilier_vente',      null, 'PRODUCT', 'Immobilier (vente)',          'Real estate (sale)',     13)
on conflict (id) do nothing;

-- Enfants explicites de Véhicules.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('vehicules_voiture', 'vehicules', 'PRODUCT', 'Voitures',          'Cars',        1),
  ('vehicules_moto',    'vehicules', 'PRODUCT', 'Motos',             'Motorbikes',  2),
  ('vehicules_pieces',  'vehicules', 'PRODUCT', 'Pièces détachées',  'Spare parts', 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Nouvelles catégories SERVICE de premier niveau. beaute_domicile et
--    menage existent déjà (0022) — seuls leurs libellés/ordre sont ajustés.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('btp_bricolage',         null, 'SERVICE', 'BTP, Architecture & Bricolage', 'Construction & Handywork', 22),
  ('informatique_digital',  null, 'SERVICE', 'Informatique & Digital',        'IT & Digital',             23),
  ('electricite_plomberie', null, 'SERVICE', 'Électricité & Plomberie',       'Electrical & Plumbing',    24),
  ('livraison_demenagement',null, 'SERVICE', 'Livraison & Déménagement',      'Delivery & Moving',        25),
  ('traiteur_chef',         null, 'SERVICE', 'Traiteur & Chef à domicile',    'Catering & Private Chef',  26),
  ('location_immobiliere',  null, 'SERVICE', 'Location immobilière',          'Property rental',          27),
  ('location_vehicules',    null, 'SERVICE', 'Location de véhicules',         'Vehicle rental',           28)
on conflict (id) do nothing;

update public.categories set label_fr = 'Beauté & Coiffure à domicile', label_en = 'At-home Beauty & Hair', sort_order = 20
  where id = 'beaute_domicile';
update public.categories set sort_order = 21 where id = 'menage';

-- ---------------------------------------------------------------------------
-- 3. Re-parentage des catégories héritées (id inchangés → rien ne casse).
-- ---------------------------------------------------------------------------
update public.categories set parent_id = 'mode_femme',            sort_order = 100 + sort_order
  where id in ('mode','chaussures','sacs','maroquinerie','accessoires') and parent_id is null;
update public.categories set parent_id = 'bijoux_montres',        sort_order = 100 + sort_order
  where id in ('bijoux','montres') and parent_id is null;
update public.categories set parent_id = 'beaute_cosmetiques',    sort_order = 100 + sort_order
  where id in ('parfums','beaute','cheveux') and parent_id is null;
update public.categories set parent_id = 'maison_deco',           sort_order = 100 + sort_order
  where id in ('deco','art') and parent_id is null;
update public.categories set parent_id = 'evenementiel_mariages', sort_order = 100 + sort_order
  where id in ('mariages','evenement','mannequinerie') and parent_id is null;
update public.categories set parent_id = 'btp_bricolage',         sort_order = 100 + sort_order
  where id in ('reparation','jardinage') and parent_id is null;
update public.categories set parent_id = 'livraison_demenagement', sort_order = 100 + sort_order
  where id in ('demenagement','coursier') and parent_id is null;
update public.categories set parent_id = 'beaute_domicile',       sort_order = 100 + sort_order
  where id = 'ongles' and parent_id is null;
-- cours / evenementiel_service / autre_service: volontairement laissées au
-- premier niveau (voir en-tête, choix n°2).

-- ---------------------------------------------------------------------------
-- 4. Colonnes du pivot (regroupées ici plutôt qu'en 0024 pour rester atomique
--    avec l'arborescence qu'elles servent):
--    - shops.phone / shops.instagram: la fiche prestataire gagne les actions
--      Appeler / Instagram (en plus de WhatsApp et du chat interne déjà là).
--      Affichées côté client UNIQUEMENT si la donnée existe.
--    - products.attributes: champs spécifiques par catégorie (surface pour
--      l'immobilier, marque/année/kilométrage pour un véhicule…) sans
--      polluer la table de colonnes nulles pour 95 % du catalogue. jsonb
--      libre, validé côté client par la config ATTRIBUTE_FIELDS
--      (src/lib/categories.js) — une contrainte SQL par catégorie serait
--      prématurée tant que l'arborescence bouge encore.
-- ---------------------------------------------------------------------------
alter table public.shops add column if not exists phone text;
alter table public.shops add column if not exists instagram text;
alter table public.products add column if not exists attributes jsonb not null default '{}';
