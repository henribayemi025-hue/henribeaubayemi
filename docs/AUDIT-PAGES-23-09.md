# Audit page par page — 23/09

Beau : « le produit propre cette semaine et la prochaine », « le design ne
me plaît pas — un audit exhaustif page par page, bouton par bouton ». Voici
le premier passage, fait dans le navigateur (390 px, comme un téléphone),
sur **63 pages** et trois points de vue : sans compte, acheteuse connectée,
vendeuse connectée.

## Ce qui a été mesuré sur chaque page

- une erreur de code pendant l'affichage ;
- l'écran « Oups, un souci est survenu » ;
- une clé de traduction brute (« vendor.xxx ») visible ;
- un mot qui enferme Finjaro dans un pays ;
- un débordement horizontal (la page plus large que l'écran) ;
- « undefined », « NaN », « null » visibles ;
- et une capture de chaque page, relue à l'œil.

## Résultat

**Aucune page ne plante, aucune clé brute, aucun débordement, aucun
« undefined ».** Les trois « Oups » vus au premier passage venaient de mon
simulateur (il renvoyait un objet là où l'application attend une liste),
pas de l'application : rejoués avec le simulateur corrigé, ils disparaissent.

## Corrigé aujourd'hui

| Où | Défaut | Correction |
| --- | --- | --- |
| Panier, commande sans compte | l'exemple de numéro WhatsApp était « +237 6… » en dur | suit le pays de la personne ; pays inconnu : « +… » |
| Connexion par téléphone | l'aide disait « ex. +237 6XX XXX XXX » | « Avec l'indicatif du pays. Ex. » + l'exemple du pays de la personne |
| Page d'atterrissage (`/landing`) | « La marketplace beauté, mode, parfum & déco d'événement » — le catalogue a 30 rayons et des services | « La place de marché des boutiques indépendantes : mode, beauté, maison, high-tech, services. » |
| À propos | même accroche périmée | même correction |
| Profil, recherche, accueil, parrainage, présentation | « Ouvrir ma boutique gratuite », « c'est gratuit » sans date | « gratuit jusqu'en novembre » partout (règle de Beau du 18/09 : le mot porte toujours sa date) |
| Commandes de la vendeuse | l'onglet « En cours » plantait sur une commande sans compte (bouton WhatsApp, icône jamais importée) — **en production depuis le 22/09** | corrigé ce matin |

## À décider par Beau

1. **Les conditions d'utilisation** disent « régies par le droit
   camerounais » et citent la loi camerounaise sur la cybersécurité. C'est
   une clause juridique, pas un texte marketing : elle suit le siège de la
   société. Je ne l'ai pas touchée. À revoir quand la société sera créée
   (où ?).
2. **Le bouton flottant de Finia** (en bas à droite) recouvre parfois un
   « Voir tout » aligné à droite (accueil, page boutique). C'est le lot de
   tout bouton flottant ; on peut le décaler d'un cran vers le haut ou
   réserver une marge à droite sur ces lignes. Un détail de design : ton
   avis.
3. **`/inexistant`** (adresse fausse) montre l'accueil au lieu d'une page
   « introuvable ». Choix acceptable ; dis si tu préfères une vraie page.

## Ce que ce passage ne voit pas

Le simulateur remplace la base par des données de test : il vérifie que
chaque écran s'affiche et se lit, pas que chaque bouton aboutit en vrai.
Le deuxième passage — **bouton par bouton, sur la vraie base de test**,
dans l'ordre des parcours (acheter, vendre, Legion, Mon argent) — suit,
avec la liste des défauts d'Alpha quand elle arrive.
