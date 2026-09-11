-- Trois fiches rangées dans un rayon que leur propre texte contredit.
--
-- Contexte: Beau a demandé de corriger moi-même les fiches mal classées après
-- l'ajout des 48 métiers. En reprenant le catalogue fiche par fiche, il
-- s'avère que la très grande majorité est bien rangée: une boutique qui
-- déclare un métier vend aussi, très légitimement, des produits (Lmp sarl est
-- inscrite en BTP et sécurité mais vend 52 équipements de protection, rangés
-- correctement). Ne restent que trois lignes où la preuve est dans la donnée
-- elle-même — une autre fiche de la MÊME boutique, du MÊME type, est rangée
-- ailleurs. Rien n'est deviné, rien d'ambigu n'est touché.
--
-- Correction de données uniquement: aucune colonne ajoutée, modifiée ni
-- supprimée. Les fiches sont désignées par leur identifiant, et chaque mise à
-- jour vérifie le rayon de départ — rejouer ce fichier ne change donc rien.

-- 1) Didi_beauty56 (prothésiste ongulaire). « French Bordeaux » décrit une
--    pose d'ongles; ses deux autres poses sont déjà sous « ongles ».
update products set category = 'ongles'
where id = '9aa9e2cf-0027-4ac8-a3c1-73234c3e4455' and category = 'beaute';

-- 2) SHINY SKIN COSMÉTIQUE. Un savon noir n'est pas un parfum. Le savon noir
--    d'ECLAT D'ÉBÈNE est déjà sous « beaute ».
update products set category = 'beaute'
where id = '9f38e39a-2aa7-4a6e-a89d-c1b762e68e45' and category = 'parfums';

-- 3) Nnal Beauty. « Fixateur de maquillage » est un flacon à vendre, pas une
--    prestation: ses huit autres produits, dont deux autres fixateurs, sont
--    sous « beaute ». « beaute_maquillage » est un rayon de SERVICE, donc
--    absent des rayons parcourables de l'accueil — la fiche y était invisible.
update products set category = 'beaute'
where id = '6f9c2f63-8f4d-4252-809a-4c4047088b2c' and category = 'beaute_maquillage';
