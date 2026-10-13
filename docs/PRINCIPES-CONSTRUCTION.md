# Principes de construction — comment on les applique

Source : Beau, 13/10 (carnet 17h30). Inscrits dans `CLAUDE.md` §12.
Chaque principe a un premier pas **mesurable**, rien n'est promis au public.

| Principe | Premier pas | Où | Qui |
| --- | --- | --- | --- |
| Pas d'assistant générique : un workflow vertical | Boutique : « fiches sans prix » (243 au 12/10) → l'agent prépare la relance ciblée vers les 23 boutiques concernées, la vendeuse saisit le prix | Place de marché | Moi + agent de Léo |
| Le produit fait le travail ingrat de bout en bout | Accounting : rapprochement ventes / paiements, écart expliqué avec les chiffres produits par du code (le modèle ne calcule pas) | Accounting | Claudinette (spéc. de Balance relue par moi) |
| La donnée propriétaire est le rempart | Une seule liste de **mesures nommées** (déjà : `docs/rapports/2026-10-12-definitions-des-chiffres.md`) que tous les agents appellent comme outil | Les trois | Moi |
| Fin du prompt manuel | L'accueil de Léo = des cartes « À valider » (une conclusion, un bouton), pas une zone de chat | Léo | Orchestre propose, je relis |
| Décision à valider, relecteur séparé | Un relecteur automatique trie les 583 livrables en attente : « bon », « à corriger », « à voir par Claude » ; seuls les cas douteux me reviennent | Léo | Agent relecteur + moi |

## Réponse à la question « quel processus mériterait d'être automatisé de bout en bout ? »

La **relecture des livrables d'agents** (583 en attente au 13/10, faite à la
main) : c'est le goulot réel de Léo. Les prix, eux, restent à la vendeuse :
on automatise la relance, pas la décision.

## Garde-fous

Pas d'automatisation sans validation humaine pour ce qui est irréversible,
externe, financier ou dangereux (`CLAUDE.md` §12). Un chiffre affiché cite
l'outil qui l'a produit.
