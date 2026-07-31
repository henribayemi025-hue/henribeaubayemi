-- Finjaro — vraies sous-catégories genrées (façon Amazon), sur demande
-- explicite de Beau après refus du mapping "tout sous Mode Femme" de 0023.
--
-- PROBLÈME AVEC 0023 : les anciennes catégories mode/chaussures/sacs/
-- maroquinerie/accessoires ont été rangées sous Mode Femme par défaut — mais
-- ces produits n'ont JAMAIS été taggés par genre en base, donc ce mapping
-- affirmait un genre qu'on ne connaît pas réellement. Corrigé ici.
--
-- CE QUE FAIT CETTE MIGRATION :
--   1. Crée de VRAIES sous-catégories sous Mode Femme / Mode Homme /
--      Enfants & Bébé (Robes, Chemises, Vêtements bébé…) — c'est là que les
--      NOUVELLES fiches iront.
--   2. Sort mode/chaussures/sacs/maroquinerie/accessoires de sous Mode Femme
--      et les regroupe sous une nouvelle tête "Mode (à trier)" — visible et
--      cherchable (pas cachée), honnête sur le fait qu'on ne sait pas leur
--      genre réel. Rien n'est supprimé, aucun produit existant ne change de
--      valeur de `category` — seule la table `categories` (parenté) bouge.
--   3. N'invente PAS de gender-detection automatique: reclasser les fiches
--      existantes vers Femme/Homme/Enfant restera un choix vendeur (ou un
--      futur outil manuel), pas une supposition serveur.

-- ---------------------------------------------------------------------------
-- 1. Sous-catégories Mode Femme.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('femme_robes',           'mode_femme', 'PRODUCT', 'Robes',                'Dresses',            1),
  ('femme_hauts',           'mode_femme', 'PRODUCT', 'Hauts & T-shirts',     'Tops & T-shirts',    2),
  ('femme_pantalons',       'mode_femme', 'PRODUCT', 'Pantalons & Jeans',    'Pants & Jeans',      3),
  ('femme_jupes',           'mode_femme', 'PRODUCT', 'Jupes',                'Skirts',             4),
  ('femme_vestes_manteaux', 'mode_femme', 'PRODUCT', 'Vestes & Manteaux',    'Jackets & Coats',    5),
  ('femme_lingerie',        'mode_femme', 'PRODUCT', 'Lingerie & Nuisettes', 'Lingerie & Sleepwear', 6),
  ('femme_chaussures',      'mode_femme', 'PRODUCT', 'Chaussures femme',    'Women''s shoes',     7),
  ('femme_sacs',            'mode_femme', 'PRODUCT', 'Sacs',                 'Bags',               8),
  ('femme_maroquinerie',    'mode_femme', 'PRODUCT', 'Maroquinerie',         'Leather goods',      9),
  ('femme_accessoires',     'mode_femme', 'PRODUCT', 'Accessoires',          'Accessories',       10)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Sous-catégories Mode Homme.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('homme_chemises',         'mode_homme', 'PRODUCT', 'Chemises',            'Shirts',           1),
  ('homme_tshirts_polos',    'mode_homme', 'PRODUCT', 'T-shirts & Polos',    'T-shirts & Polos', 2),
  ('homme_pantalons',        'mode_homme', 'PRODUCT', 'Pantalons & Jeans',   'Pants & Jeans',    3),
  ('homme_vestes_costumes',  'mode_homme', 'PRODUCT', 'Vestes & Costumes',   'Jackets & Suits',  4),
  ('homme_chaussures',       'mode_homme', 'PRODUCT', 'Chaussures homme',    'Men''s shoes',     5),
  ('homme_accessoires',      'mode_homme', 'PRODUCT', 'Accessoires',         'Accessories',      6)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Sous-catégories Enfants & Bébé.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('enfant_bebe',          'enfants_bebe', 'PRODUCT', 'Vêtements bébé (0-2 ans)', 'Baby clothes (0-2y)', 1),
  ('enfant_fille',         'enfants_bebe', 'PRODUCT', 'Vêtements fille',          'Girls'' clothes',     2),
  ('enfant_garcon',        'enfants_bebe', 'PRODUCT', 'Vêtements garçon',         'Boys'' clothes',      3),
  ('enfant_chaussures',    'enfants_bebe', 'PRODUCT', 'Chaussures enfant',        'Kids'' shoes',        4),
  ('enfant_jouets',        'enfants_bebe', 'PRODUCT', 'Jouets',                   'Toys',                5),
  ('enfant_puericulture',  'enfants_bebe', 'PRODUCT', 'Puériculture',             'Baby gear',           6)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Nouvelle tête neutre pour les anciennes catégories non genrées, sortie
--    de sous Mode Femme (0023). Visible, pas cachée — c'est un vrai rayon,
--    pas une corbeille.
-- ---------------------------------------------------------------------------
insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('mode_a_trier', null, 'PRODUCT', 'Mode (à trier)', 'Fashion (unsorted)', 14)
on conflict (id) do nothing;

update public.categories
  set parent_id = 'mode_a_trier'
  where id in ('mode', 'chaussures', 'sacs', 'maroquinerie', 'accessoires')
    and parent_id = 'mode_femme';
