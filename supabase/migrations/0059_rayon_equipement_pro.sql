-- Un rayon pour ce qui n'a jamais eu le sien: l'équipement professionnel.
--
-- Beau, en ouvrant « Mode Femme »: « je parle d'une femme, je vois les trucs
-- masque, anti-bruit, les trucs comme ça. Tout ce qui n'est pas vêtement ou
-- truc pour femme doit sortir de ces catégories. »
--
-- Vérifié en base: 49 articles de la boutique Lmp sarl étaient dans
-- « Mode Femme » — casques de chantier, gants anti-coupure, masques 3M,
-- cônes de balisage, bottes de sécurité, lunettes de soudeur. Une cliente qui
-- ouvrait le rayon femme tombait sur du matériel de chantier.
--
-- La vendeuse n'a pas mal rangé: il n'y avait AUCUN rayon où ranger ça. Les
-- 21 rayons produits couvraient la mode, la beauté, la maison, le high-tech,
-- l'alimentaire… rien pour l'équipement de travail. Face à un menu qui ne
-- propose pas son métier, on prend ce qui traîne — et ce qui traînait était
-- « Mode Femme », valeur pré-remplie de l'écran d'ajout en masse (corrigé
-- dans le même lot).
--
-- Additif, comme toujours: aucune ligne existante n'est supprimée ni
-- renommée. On AJOUTE une tête et quatre sous-rayons, puis on déplace les
-- fiches concernées.

insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('equipement_pro',    null,             'PRODUCT', 'Équipement pro & Sécurité', 'Professional & Safety Gear', 22),
  ('epi_protection',    'equipement_pro', 'PRODUCT', 'EPI & Protection',          'PPE & Protection',           1),
  ('pro_vetements',     'equipement_pro', 'PRODUCT', 'Vêtements de travail',      'Workwear',                   2),
  ('pro_signalisation', 'equipement_pro', 'PRODUCT', 'Signalisation & Balisage',  'Signage & Barriers',         3),
  ('pro_outillage',     'equipement_pro', 'PRODUCT', 'Outillage & Quincaillerie', 'Tools & Hardware',           4)
on conflict (id) do nothing;
