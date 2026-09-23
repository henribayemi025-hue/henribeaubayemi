# Check-up de toutes les pages — 23/09 au soir

Demandé par Beau : « fais le check-up de toutes les pages, et regarde bien si
dans la liste que tu m'as envoyée tu as vraiment tout terminé ».

## Comment

- La version exacte en ligne (commit 8ae4993), sur les VRAIES données, avec le
  compte de test (comptes de test exclus des chiffres). Le premier audit
  tournait sur des données inventées : il n'avait pas vu les 323 articles sans
  description qui faisaient planter leur page.
- Téléphone (390 px) ET grand écran (1 366 px) : CLAUDE.md §6, un recadrage
  qui passe sur téléphone peut couper un visage en grand.
- 233 pages : public, acheteuse, vendeuse, Mon argent, Legion (deux
  entreprises, tous les salons) ; puis 71 vues de Legion onglet par onglet
  (accueil jusqu'en bas, salons, équipe, tâches, fiche d'un agent) ; puis un
  passage visuel avec les vraies photos.
- Relevé : écran « Oups », erreurs, clés de traduction brutes, mots qui
  enferment Finjaro dans un pays, débordement, « undefined »/« NaN »,
  « 0 FCFA », images cassées, pages vides ou introuvables.
- Rien n'est modifié : on navigue seulement (les fonctions IA sont coupées
  pendant le passage dans Legion).

## Résultat

Aucun écran « Oups », aucune erreur, aucun débordement, aucune clé brute.

Trouvé et corrigé :

| Quoi | Depuis | Correction |
| --- | --- | --- |
| Fiche article : le bouton WhatsApp « Poser une question à la vendeuse » était invisible (blanc sur blanc) | 17/09 | `bg-cream` et `bg-terracotta` n'existent pas dans le thème → `bg-base`, `bg-teal` ; barre posée juste au-dessus de « Demander le prix » |
| Autres couleurs absentes du thème : `bg-brass/8`, `bg-teal/8` (fonds clairs de l'accueil, du parrainage, du tableau de bord vendeuse…), `bg-card`, `border/text-terracotta` | — | `/10`, `bg-white`, `teal` ; un contrôle compare désormais chaque classe de couleur à la feuille de style produite |
| Legion : deux phrases collées dans des messages d'agents (« beau.Pour », « devise.Le ») | — | l'espace est remis à l'affichage (messages, plans, aperçus des salons) |
| Legion, dépense : quelques millièmes d'euro affichés « 0,00 € » | — | « moins de 0,01 € » |
| Page de modification d'un article sans description : plantage (323 articles sur 507) | 09/09 | corrigé plus tôt ce soir, en ligne |

Vérifié, et ce n'est PAS un défaut :

- « camerounaise » sur Services / Près de chez toi : la description qu'une vendeuse a écrite de sa propre marque.
- « camerounais » dans les Conditions générales : le droit applicable (choix juridique).
- « Boutique introuvable » pour deux boutiques : elles appartiennent à des comptes de test, cachés au public par la règle `shops_read`.
- « marché camerounais », « partout au pays », « diaspora » dans la Legion de Finjaro : ce sont les règles de la maison qui INTERDISENT ces mots aux agents.
- « 0 € » dans Mon argent et le tableau de bord de la boutique de test : des soldes réellement à zéro.
- Photos absentes dans les captures locales : elles passent par le relais `/img/` de finjaro.net, vérifié en ligne (200, image/jpeg).

Pas contrôlé : la Console Finjaro (il faut un compte administrateur).

## La liste des rapports du 23/09, point par point

| Annoncé | Vérifié |
| --- | --- |
| Legion lit la comptabilité (Accounting) | ✅ essai réel : résultat et créances de septembre exacts ; faux espace refusé ; personne sortie de l'espace → plus rien ; l'écran affiche « Mon entreprise est branchée » |
| Les 200 idées | ✅ `docs/LEGION-200-PROPOSITIONS.md`, 200 lignes |
| Les 20 fonctions de place de marché | ✅ même fichier, 9 faites, 11 en partie |
| Espèces : montant à tendre dans la monnaie de la boutique | ✅ en ligne depuis le 22/09 |
| Mise en ligne du premier lot | ✅ finjaro.net sert la version 4f08ad5 puis 8ae4993 |
| « 166 monnaies » | ⚠️ exact : 165 au choix (166 dans la source, dont XAF et XOF réunis en « FCFA ») |
| Taux mis à jour chaque nuit | ⏳ tâche programmée (01 h 10 UTC) ; premier passage automatique cette nuit, contrôle programmé à 01 h 40 UTC |
| Chacun voit sa monnaie | ✅ Toronto → $CA, Douala → FCFA, Londres → £, Lagos → NGN, Nairobi → KES |
| Changer dans les Réglages | ✅ boutons + liste de 165 monnaies, date et source des taux |
| Prix tapé par la vendeuse gardé | ✅ 29,90 € tapé, 29,9 relu ; en livres, recalage sans fausse alerte de baisse (essai en base) |
| FCFA à parité fixe | ✅ 655,957 |
| L'Afrique ne tombe plus en FCFA | ✅ Nairobi → shilling kényan |
| Un choix fait à la main reste | ✅ Toronto avec l'euro choisi → euros |
| Plantage des 323 articles | ✅ la page s'ouvre, contrôlée sur les 10 articles de la boutique de test |
| « Prix sur demande » au lieu de « 0 » dans le carrousel | ✅ trois diapositives le montrent |
| … et dans les vidéos | ⚠️ correction préventive : aucune vidéo n'est liée aujourd'hui à un article sur demande |
| Claudinette prévenue | ✅ messages envoyés (connecteur, 0177–0180, 0181) |
| Déploiement des fonctions : seulement celles touchées | ✅ manuel réussi deux fois ; chemin automatique rejoué en local (2 fonctions pour un fichier commun, 27 pour la configuration) ; sera vu sur un vrai envoi à la prochaine modification de fonction |
