# Passage 1 — écran par écran, sans compte (07/10)

Ce qu'un visiteur voit avant de se connecter, sur la préproduction
(même code que finjaro.net), à 390 px et 1 440 px. 25 pages × 2 largeurs =
50 écrans, mesurés par `scripts/audit-ecrans.cjs` (mesures brutes :
`ecrans/mesures-07-10.json`), puis regardés un à un.

Ce qui vaut pour les 50 écrans : **aucune erreur JavaScript, aucune
requête en échec, aucun débordement horizontal, aucun écran « Oups »**.
Les pages se chargent. Le sujet, c'est ce qu'on y comprend.

Gravité : **bloquant** (on ne peut pas continuer) · **grave** (on continue
mais on se perd ou on abandonne) · **gênant** (ça marche, mais c'est long,
petit ou flou) · **détail**.

## Learn

### L1 · grave — L'accueil ne dit pas par où commencer
`ecrans/tel-learn-accueil-vrai.png`, `ecrans/grand-learn-accueil-vrai.png`

Mesuré : 922 mots, 155 boutons, 22 parcours, 9 diapositives, 4 « projets
clés », la Lettre de l'IA, « Progression globale 0/237 ». Sur téléphone la
page fait 1 871 px de haut, sur grand écran 4 517 px.

Lien de causalité : P001 (commerçante, 68 ans, « je ne sais pas ce qu'est le
code ») arrive. Elle a 0/237. La première chose qu'on lui dit est
« REPRENDRE LA LEÇON » — elle n'a rien commencé. Puis 22 parcours, de
« Projets guidés » à « Informatique quantique », au même niveau. Donc elle ne
sait pas où cliquer, donc elle clique au hasard ou elle part. Il lui faut
UNE porte : « Tu débutes ? Commence ici » → première leçon, avec son prof.

Proposition : quand la progression est à 0, l'accueil montre une seule carte
« Commencer » (première leçon de Programmation, Maya) et replie les 22
parcours derrière « Voir tous les parcours ». Le verbe « Reprendre » n'apparaît
qu'après une première leçon réussie. Les 22 parcours gardent leurs badges
Débutant / Intermédiaire / Avancé, mais triés : Débutant d'abord.

### L2 · grave — « Ma progression » : un mur de points vides, injouable au pouce
`ecrans/tel-learn-progression-vrai.png`

Mesuré : 5 117 px de haut sur téléphone, 252 boutons, dont les points de
l'arbre de compétences à **20 px** de haut (le minimum pour un doigt est
44 px). Pour un nouveau : cinq « 0 », puis des centaines de points gris.

Causalité : « Clique pour l'ouvrir » dit la page, mais à 20 px le pouce en
touche deux à la fois, donc on ouvre la mauvaise leçon, donc on se croit
perdu. Et tant qu'il n'y a rien de réussi, l'arbre n'informe de rien.

Proposition : à 0 leçon, remplacer l'arbre par « Ta première leçon
réussie allumera ton premier point » + bouton. Dès qu'il y a du contenu,
des points de 44 px au moins, et une rangée par parcours que l'on déplie.

### L3 · gênant — Textes à 10 px
Mesuré : libellés du menu du bas 10,56 px (« Leçons, Atelier, Lettre IA,
Progression, Plus »), badges « DÉBUTANT / INTERMÉDIAIRE / AVANCÉ / PROJET
CLÉ / CHAQUE MATIN » 10 px. Les profils « très âgé » et « mal-voyant » ne les
lisent pas ; les autres plissent les yeux. Minimum : 12 px pour un libellé,
11 px pour un badge en capitales.

### L4 · gênant — La fenêtre de connexion tombe avant qu'on ait rien vu
`tel-learn-accueil.png` (passage brut)

Sur chaque page, à la première visite (accueil, progression, leçon), une
fenêtre « Bienvenue sur Finjaro Learn » couvre tout. Il y a bien « Continuer
sans compte », mais en 5e position, après Google, Apple, e-mail et mot de
passe. Causalité : P001 ne sait pas encore ce qu'est Learn, donc elle ne
veut pas créer de compte, donc elle cherche la croix, qu'il n'y a pas, donc
elle ferme l'onglet.

Proposition : laisser voir la page ; demander le compte au moment où il
sert (garder sa progression, parler au prof), avec la phrase qui dit
pourquoi. Et une croix.

### L5 · détail — Neuf « Leçon 1 »
Le carrousel montre « Leçon 1 : Afficher un message », « Leçon 1 :
Calculatrice… », « Leçon 1 : NumPy… », « Leçon 1 : Le neurone… » : neuf
premières leçons de neuf parcours. Pour un nouveau, neuf « leçon 1 » se
contredisent. Une seule, celle de son niveau.

### Ce qui est bien
La page d'une leçon (149 mots, Explication → Exemple → À toi de jouer,
la classe avec le prof en haut) est claire et courte. `tel-learn-lecon-py-vrai.png`.

## Léo

### Ce qui est bien
`ecrans/tel-leo-accueil.png`, `ecrans/grand-leo-accueil.png`

La page publique de Léo est sobre : 121 mots, une phrase, quatre cartes,
« Entrer ». Rien à couper ici. La remarque de Beau (« trop de texte, même
la page d'accueil, on ne comprend rien, pas d'onboarding ») vise l'intérieur
de Léo, après connexion — c'est le passage 2 (compte de test), et la tâche
confiée à Miroir (comptage mot à mot, accueil guidé en 4 ou 5 écrans).

### Λ1 · détail — Les liens profonds ne disent pas où l'on allait
`/legion/fonder` et `/legion/atelier` sans compte montrent la même porte que
`/legion`, sans une ligne « Connecte-toi pour continuer vers l'Atelier ». La
destination est bien gardée (on y revient après connexion) ; il manque la
phrase qui rassure.

## Place de marché

### Ce qui est bien
Accueil guidé en 3 écrans (« Le marché, dans ta poche », « Passer » toujours
visible), aucune mention de pays. Panier vide (8 mots) et « Mes demandes »
vides (7 mots) : courts, un bouton. Page « introuvable » qui propose la
recherche, trois raccourcis et les articles du moment. Les adresses
`/products`, `/reels`, `/leaderboard` sont celles du tableau de bord vendeur
(`/vendor/…`) : leur « introuvable » en public est juste. « Devenir vendeur »
sans compte renvoie à la connexion ET ramène ensuite à « Devenir vendeur »
(`RequireAuth` → `state.from` → `Auth`).

### M1 · gênant — Deux éléments flottants cachent les prix
`ecrans/tel-place-accueil-vrai.png`

Sur 390 px, la bulle « Une idée cadeau ? » et le bouton Finia se posent sur
la rangée « Prêts à commander » et masquent le prix du deuxième article.
Causalité : l'acheteuse lit les prix en balayant, donc un prix caché est un
article qu'elle n'achète pas. Proposition : une seule bulle, qui disparaît
dès qu'on défile ou qu'on la ferme une fois.

### M2 · gênant — Services : filtre tronqué, bannière qui couvre, boutons de 34 px
`ecrans/tel-place-services.png`

« Cameroun » devient « Camero » dans la puce du pays ; la bannière « Finjaro
est plus rapide… Installer » recouvre le bouton Contacter de la deuxième
carte (elle se ferme d'une croix : gênant, pas bloquant) ; Contacter /
Réserver font 34 px de haut (44 px attendus).

Correction du 07/10 au soir : j'avais écrit que deux descriptions de 56 et
92 mots s'affichaient en entier. C'est faux : la carte les coupe déjà à
deux lignes (`line-clamp-2`) ; ma mesure comptait le texte caché. Retiré.

### M3 · détail — Un « TOP ARTICLE » sans photo
Première diapositive de l'accueil : « Chaussure — 7 500 FCFA » sur un gris
sans image. Ce n'est pas un défaut du code, c'est une fiche sans photo mise
en avant. Règle à poser : pas de mise en avant sans photo (à voir avec
Alpha ; la carte « Articles sans prix » de la vendeuse pourrait avoir une
sœur « Articles sans photo »).

### M4 · détail — Petits boutons
« EN » sur /landing : 20 px. « Passer » sur l'accueil guidé : 28 px. Les
noms d'articles du carrousel sont des boutons de 14 px.

## Limites de ce passage
- Sans compte : tout l'intérieur de Léo, l'espace vendeuse, la messagerie,
  le paiement, l'Atelier de Learn connecté et les profs ne sont pas encore
  passés. C'est le passage 2.
- Les comptes de mots incluent ce qui est dans la page même sous une
  fenêtre (l'accueil mesuré à 846 mots derrière l'accueil guidé en montre 20) :
  les chiffres cités ci-dessus sont ceux relevés après « Passer » ou
  « Continuer sans compte ».
- Les textes des vendeuses (descriptions de boutique) ne sont pas les nôtres ;
  on juge leur affichage, pas leur contenu.
