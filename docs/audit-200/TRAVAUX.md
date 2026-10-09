# Plan de travaux de l'audit — classé, mis à jour chaque soir

Du plus grave au moins grave. Une ligne = un chantier. « Fait » ne s'écrit
qu'après vérification sur staging.

| N° | Appli | Quoi | Gravité | D'où | État |
| --- | --- | --- | --- | --- | --- |
| 1 | Learn | Accueil à 0 leçon : une seule porte « Commencer », parcours repliés et triés Débutant d'abord, « Reprendre » seulement après une réussite | grave | ecrans L1 | en partie (07/10 soir : « Commencer » à 0 leçon, débutants d'abord, carrousel limité ; reste : replier les parcours) |
| 2 | Learn | « Ma progression » à 0 : message + bouton au lieu de l'arbre vide ; points ≥ 44 px, une rangée par parcours dépliable | grave | ecrans L2 | à faire |
| 3 | Learn | Fenêtre de connexion : la page d'abord, le compte quand il sert, une croix | gênant | ecrans L4 | à faire |
| 4 | Learn | Libellés 10,56 px → 12 px ; badges 10 px → 11 px | gênant | ecrans L3 | fait (07/10 soir, vérifié) |
| 5 | Place de marché | Une seule bulle flottante sur l'accueil, qui s'efface au défilement | gênant | ecrans M1 | ✅ 09/10 (d02bf9d) : la bulle s'efface au défilement et ne revient plus |
| 6 | Place de marché | Services : puce pays non tronquée, boutons Détails / Contacter / Réserver à 44 px (les descriptions étaient déjà coupées : erreur du rapport, corrigée) | gênant | ecrans M2 | fait (07/10 soir, vérifié : 24 boutons à 44 px, puce entière) |
| 7 | Léo | Porte des liens profonds : « Connecte-toi pour continuer vers … » | détail | ecrans Λ1 | fait (08/10 nuit, vérifié à 390 et 1 440 px) |
| 8 | Learn | Carrousel : une seule « Leçon 1 », celle du niveau | détail | ecrans L5 | fait (07/10 soir : 3 diapositives à 0 leçon) |
| 9 | Place de marché | Pas de mise en avant sans photo (règle + carte « Articles sans photo ») | détail | ecrans M3 | confié à Alpha le 08/10 (tâche difficile : règle, endroit du code, texte de la carte, chiffre mesuré) |
| 10 | Place de marché | « EN » 20 px, « Passer » 28 px, noms du carrousel 14 px → 44 px | détail | ecrans M4 | fait (08/10 nuit, mesuré : 44 / 44 / 44×24) |
| 11 | Accounting | Régime fiscal par défaut au Cameroun : « sans TVA, à confirmer avec votre comptable » au lieu du réel + TVA 19,25 % | grave | ACCOUNTING A1 | à trancher par Beau |
| 12 | Accounting | Journal / Ventes / Stock : mois en cours par défaut + « Voir plus » (615 écritures sur une page) | moyen | ACCOUNTING A5 | proposé (Claudinette) |
| 13 | Accounting | Démonstration en mode simple, bouton vers l'expert | moyen | ACCOUNTING A6 | proposé (Claudinette) |
| 14 | Accounting | Champs 40 px sur ordinateur seulement | petit | ACCOUNTING A7 | à trancher par Beau (style) |
| 15 | Accounting | Cadre « À quoi ça sert » replié de lui-même après trois visites | petit | ACCOUNTING A8 | fait (Claudinette, 536f885, en ligne le 07/10) |
| 16 | Accounting | « En cours » sur deux lignes ; aide de recherche coupée sur Vendre | détail | ACCOUNTING A9 | à faire (Claudinette) |

## À venir (passage 2, avec comptes de test)
- Léo connecté : la page d'accueil et le texte (Beau : « on ne comprend
  rien »), accueil guidé (livrable de Miroir), parcours porteur de projet
  (livrable d'Ada).
- Learn connecté : les profs face aux 40 questions de Mentor, le bouton
  « J'y vais », la boîte de code dans la réponse du prof (demande de Beau).
- Place de marché connectée : acheter, vendre, messagerie (livrable de Lien).
- Accounting : rapport de Claudinette reçu le 07/10 (ACCOUNTING.md) ; reste le pont Léo → Accounting, côté Léo.
- Les ponts : même compte, Learn ↔ Léo, Léo ↔ Accounting.
