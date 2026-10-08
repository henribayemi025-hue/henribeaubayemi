# Passage 1 — Accounting (part de Claudinette, 07/10), relu par Claude

Rapport complet et captures dans le dépôt d'Accounting :
`docs/audit-200/ACCOUNTING.md` et `docs/audit-200/captures/`
(henribayemi025-hue/Automatisation-des-candidatures, commits 3de7a5a et 426d425).

## Ce qu'elle a fait
35 écrans mesurés à 390 et 1 440 px (mots, mots visibles, hauteurs, débordements,
erreurs) ; trois parcours déroulés au clic : commerçante débutante sans compte,
comptable, porteur de projet. Aucun vrai compte créé, rien envoyé à personne.
Finia et la lecture des photos non testées (Google à sec ; Groq attend l'essai de Beau).

## Relecture
- Méthode conforme (lien de causalité à chaque point, mesures, captures). Rien à
  corriger dans le rapport.
- Les 200 profils n'étaient pas encore poussés quand elle a commencé (14h40 UTC) :
  ses trois familles sont les siennes ; elles recoupent les nôtres (débutante,
  « vu à l'école », porteur de projet).
- Je partage son avis sur le point 1 (TVA) : fabriquer une dette de TVA à une
  petite boutique qui n'en doit sans doute pas est plus grave que de laisser
  une entreprise au réel la choisir d'un geste. Décision de Beau.
- Point 8 (texte) : elle juge acceptable. Au vu de la remarque de Beau sur Léo
  (« trop de texte »), je note le cadre « À quoi ça sert » (un quart du premier
  écran sur téléphone) comme candidat : le replier de lui-même après trois visites.

## Ses constats, classés
| N° | Gravité | Quoi | État |
| --- | --- | --- | --- |
| A1 | grave | Au Cameroun, le régime proposé par défaut est « le réel » avec TVA 19,25 % : chaque vente est coupée (ex. 24 400 → 20 461 + 3 939 de TVA) et une dette de TVA apparaît, que la plupart des petites boutiques ne doivent pas (IGS). Proposition : « Je ne sais pas encore — sans TVA » par défaut, « à confirmer avec votre comptable », le réel à un geste | **à trancher par Beau** |
| A2 | — | ~~La page de connexion des vendeuses promettait que les ventes livrées sur Finjaro arrivent dans la caisse ; aucun code ne le fait.~~ **Faux, annulé le 08/10** : la liaison existe côté place de marché (migration 0127, déclencheur `trg_finia_order_to_sale` sur `orders`, en production depuis le 17/09) ; Claudinette ne l'avait cherchée que dans son dépôt. Phrase d'origine remise (778c2ca) | annulé (778c2ca) |
| A3 | moyen | Carte Projets : les trois montants se chevauchaient sur téléphone et tablette | corrigé, mesuré à 390/768/1 440 |
| A4 | moyen | Tableaux TVA (98 px de débordement sur grand écran) et Ventes (33 px sur téléphone) | corrigé, 0 px |
| A5 | moyen | Listes sans fin : journal 615 écritures / 21 014 mots sur une page, ventes 276 lignes. Proposition : mois en cours par défaut + « Voir plus » | proposé |
| A6 | moyen | La démonstration s'ouvre en mode expert (numéros de compte partout) alors qu'une débutante aura le mode simple. Proposition : démo en mode simple | proposé |
| A7 | petit | Champs 45–47 px partout ; proposition 40 px sur ordinateur seulement | à trancher par Beau (style) |
| A8 | petit | Texte : 33 à 143 mots visibles ; cadre « À quoi ça sert » = un quart du premier écran | acceptable (Claudinette) ; candidat (Claude) |
| A9 | petit | « En cours » sur deux lignes (Projets) ; texte d'aide coupé (Vendre) | à faire |

## Ce qui marche (vérifié par elle)
Premier accueil sans compte en 4 étapes et 11 gestes jusqu'à Vendre ; 0 erreur
JavaScript sur 70 affichages ; aucune page ne défile sur le côté ; bilan et compte
de résultat équilibrés et contrôlés ; hors-ligne après une première ouverture ;
ponts : même compte, sélecteur d'applications, relais `/relais`, Finia présente Léo.
Le passage Léo → Accounting se teste côté Léo : passage 2, chez moi.
