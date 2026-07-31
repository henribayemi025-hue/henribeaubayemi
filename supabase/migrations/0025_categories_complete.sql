-- Finjaro — taxonomie complète et rangée, sur demande de Beau ("il y a tout
-- type de service et tout, faut que ça soit rangé"), qui a relevé au passage
-- qu'il manquait par exemple les instruments de musique.
--
-- Principe inchangé depuis 0022: additif uniquement. Aucune catégorie n'est
-- supprimée ni renommée en id, donc aucun produit/annonce/boutique existant
-- ne casse et tous les liens profonds restent valides.

-- ---------------------------------------------------------------------------
-- 1. Nouvelles têtes PRODUIT (les 13 existantes gardent leur sort_order).
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('musique',          null, 'PRODUCT', 'Musique & Instruments',       'Music & Instruments',   15),
  ('sport_loisirs',    null, 'PRODUCT', 'Sport & Loisirs',             'Sports & Leisure',      16),
  ('electromenager',   null, 'PRODUCT', 'Électroménager',              'Home appliances',       17),
  ('livres_papeterie', null, 'PRODUCT', 'Livres & Papeterie',          'Books & Stationery',    18),
  ('sante_bienetre',   null, 'PRODUCT', 'Santé & Bien-être',           'Health & Wellness',     19),
  ('animaux',          null, 'PRODUCT', 'Animaux',                     'Pets',                  20),
  ('jardin_exterieur', null, 'PRODUCT', 'Jardin & Extérieur',          'Garden & Outdoor',      21)
on conflict (id) do nothing;

-- Sous-catégories des nouvelles têtes produit.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('musique_instruments', 'musique', 'PRODUCT', 'Instruments',              'Instruments',        1),
  ('musique_sono',        'musique', 'PRODUCT', 'Sono & DJ',                'Sound & DJ gear',    2),
  ('musique_accessoires', 'musique', 'PRODUCT', 'Accessoires musique',      'Music accessories',  3),

  ('sport_fitness',    'sport_loisirs', 'PRODUCT', 'Fitness & Musculation', 'Fitness & Gym',      1),
  ('sport_vetements',  'sport_loisirs', 'PRODUCT', 'Vêtements de sport',    'Sportswear',         2),
  ('sport_plein_air',  'sport_loisirs', 'PRODUCT', 'Plein air & Camping',   'Outdoor & Camping',  3),
  ('sport_velos',      'sport_loisirs', 'PRODUCT', 'Vélos & Trottinettes',  'Bikes & Scooters',   4),

  ('electro_cuisine',  'electromenager', 'PRODUCT', 'Petit électroménager', 'Small appliances',   1),
  ('electro_gros',     'electromenager', 'PRODUCT', 'Gros électroménager',  'Large appliances',   2),
  ('electro_froid',    'electromenager', 'PRODUCT', 'Froid & Climatisation','Cooling & AC',       3),

  ('animaux_nourriture', 'animaux', 'PRODUCT', 'Alimentation animale',      'Pet food',           1),
  ('animaux_accessoires','animaux', 'PRODUCT', 'Accessoires animaux',       'Pet accessories',    2)
on conflict (id) do nothing;

-- Sous-catégories manquantes sur des têtes déjà en place.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('hightech_telephones',  'hightech', 'PRODUCT', 'Téléphones',            'Phones',            1),
  ('hightech_ordinateurs', 'hightech', 'PRODUCT', 'Ordinateurs & Tablettes','Computers & Tablets',2),
  ('hightech_audio',       'hightech', 'PRODUCT', 'Audio & Casques',       'Audio & Headphones', 3),
  ('hightech_accessoires', 'hightech', 'PRODUCT', 'Accessoires high-tech', 'Tech accessories',   4),

  ('alimentaire_patisserie', 'alimentaire', 'PRODUCT', 'Pâtisserie & Gâteaux', 'Pastry & Cakes',  1),
  ('alimentaire_epicerie',   'alimentaire', 'PRODUCT', 'Épicerie & Produits du pays', 'Grocery & Local food', 2),
  ('alimentaire_boissons',   'alimentaire', 'PRODUCT', 'Boissons',             'Drinks',          3),

  ('immo_maison',      'immobilier_vente', 'PRODUCT', 'Maisons',           'Houses',             1),
  ('immo_appartement', 'immobilier_vente', 'PRODUCT', 'Appartements',      'Apartments',         2),
  ('immo_terrain',     'immobilier_vente', 'PRODUCT', 'Terrains',          'Land',               3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Nouvelles têtes SERVICE — l'annuaire couvre enfin "tout type de service".
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('photo_video',        null, 'SERVICE', 'Photo & Vidéo',                  'Photo & Video',            29),
  ('couture_retouches',  null, 'SERVICE', 'Couture & Retouches',            'Sewing & Alterations',     30),
  ('mecanique_auto',     null, 'SERVICE', 'Mécanique & Entretien auto',     'Auto repair & servicing',  31),
  ('sante_domicile',     null, 'SERVICE', 'Santé & Soins à domicile',       'Health care at home',      32),
  ('garde_enfants',      null, 'SERVICE', 'Garde d''enfants & Aide à la personne', 'Childcare & Home help', 33),
  ('transport_chauffeur',null, 'SERVICE', 'Transport & Chauffeur',          'Transport & Driver',       34),
  ('securite',           null, 'SERVICE', 'Sécurité & Gardiennage',         'Security & Guarding',      35),
  ('marketing_com',      null, 'SERVICE', 'Marketing & Communication',      'Marketing & Communication',36),
  ('admin_juridique',    null, 'SERVICE', 'Démarches & Juridique',          'Admin & Legal',            37)
on conflict (id) do nothing;

-- Sous-catégories services, pour que l'annuaire soit vraiment rangé.
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('photo_evenement',  'photo_video', 'SERVICE', 'Photographe événement', 'Event photographer', 1),
  ('photo_studio',     'photo_video', 'SERVICE', 'Studio & Portrait',     'Studio & Portrait',  2),
  ('video_montage',    'photo_video', 'SERVICE', 'Vidéo & Montage',       'Video & Editing',    3),

  ('info_depannage',   'informatique_digital', 'SERVICE', 'Dépannage informatique', 'IT support',      1),
  ('info_site_web',    'informatique_digital', 'SERVICE', 'Sites web & Apps',       'Websites & Apps', 2),
  ('info_reseaux',     'informatique_digital', 'SERVICE', 'Réseaux & Installation', 'Networks & Setup',3),

  ('btp_maconnerie',   'btp_bricolage', 'SERVICE', 'Maçonnerie',            'Masonry',           3),
  ('btp_peinture',     'btp_bricolage', 'SERVICE', 'Peinture & Finitions',  'Painting',          4),
  ('btp_menuiserie',   'btp_bricolage', 'SERVICE', 'Menuiserie',            'Carpentry',         5),
  ('btp_architecture', 'btp_bricolage', 'SERVICE', 'Architecture & Plans',  'Architecture',      6),

  ('beaute_coiffure',  'beaute_domicile', 'SERVICE', 'Coiffure',            'Hairdressing',      2),
  ('beaute_maquillage','beaute_domicile', 'SERVICE', 'Maquillage',          'Make-up',           3),
  ('beaute_esthetique','beaute_domicile', 'SERVICE', 'Soins & Esthétique',  'Beauty treatments', 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Rangement: "Cours & Tutorat" et "Prestataire événementiel" étaient restés
--    au premier niveau sans ordre défini depuis 0022. On leur donne une place
--    explicite plutôt que de les laisser flotter en fin de liste.
-- ---------------------------------------------------------------------------
update public.categories set sort_order = 38 where id = 'cours';
update public.categories set sort_order = 39 where id = 'evenementiel_service';
update public.categories set sort_order = 99 where id = 'autre_service';
