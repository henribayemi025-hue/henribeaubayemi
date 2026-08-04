-- Vidéo d'article. Décision de Beau (04/08): une vidéo vend beaucoup mieux
-- qu'une photo (on voit le tombé d'une robe, la vraie couleur, le mouvement),
-- et le fil d'accueil doit être vivant — pas seulement l'onglet Fin.
--
-- UNE seule vidéo par article, volontairement: c'est ce qui garde la fiche
-- lisible, et surtout ce qui garde la facture de trafic sous contrôle (une
-- vidéo pèse 20 à 100 fois une photo, et c'est le VISIONNAGE qui coûte, pas
-- le stockage).
--
-- L'image de couverture n'a pas sa propre colonne: elle est déduite du chemin
-- de la vidéo (`<chemin sans extension>_poster.jpg`), exactement comme les
-- vignettes d'images le sont déjà via `_thumb` — pas de deuxième colonne à
-- tenir synchronisée.
--
-- Additif: `null` partout signifie « article sans vidéo », le comportement
-- actuel reste identique pour les 100+ articles existants.
alter table public.products
  add column if not exists video_url text;
