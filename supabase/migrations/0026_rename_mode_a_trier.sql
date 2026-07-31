-- Finjaro — "Mode (à trier)" était un nom de TRAVAIL interne (migration 0024)
-- qui s'affichait tel quel aux acheteuses. Beau l'a relevé: "Mode à trier là
-- c'est quoi comme ça ?". Il a raison, ça n'a aucun sens côté client.
--
-- Cette tête porte 48 des 114 produits du catalogue (les anciennes fiches
-- mode/chaussures/sacs/maroquinerie/accessoires, jamais taggées par genre en
-- base). La cacher aurait donc amputé le catalogue de moitié: on la RENOMME.
--
-- L'id reste `mode_a_trier` — aucun produit, aucune boutique, aucun lien
-- profond /category/mode_a_trier ne bouge. Seul le libellé change.
update public.categories
   set label_fr = 'Mode',
       label_en = 'Fashion',
       sort_order = 3
 where id = 'mode_a_trier';

-- Décale Enfants & Bébé d'un cran pour laisser la place ci-dessus, l'ordre
-- restant Mode Femme (1) / Mode Homme (2) / Mode (3) / Enfants & Bébé (4).
update public.categories set sort_order = 4 where id = 'enfants_bebe';
