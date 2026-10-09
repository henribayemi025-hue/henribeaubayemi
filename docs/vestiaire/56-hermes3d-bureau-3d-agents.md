# 56 — Hermes3D (un bureau 3D pour son équipe d'agents IA)

- **Source** : https://github.com/iamlukethedev/hermes3d (vu dans une vidéo du compte Instagram « github_dev »)
- **Type** : dépôt GitHub, application web (Next.js, React, TypeScript, Three.js avec React Three Fiber et Drei, Phaser pour la version 2D)
- **Accès** : ouvert. Lus le 09/10/2026 : la page du dépôt (README), le fichier LICENSE, la liste des commits, le dossier `assets`. Le code n'a pas été lu en détail.
- **Licence / droits** : **MIT** (« Copyright (c) 2026 Luke The Dev », LICENSE lu). On peut reprendre le code en gardant cette mention. Les **modèles 3D** n'ont aucune mention de licence ou d'origine dans ce qui est visible : à vérifier avant toute reprise d'un modèle.
- **Reçu de Beau le** : 09/10/2026 (capture d'écran, sans message)

## Ce que c'est
Un bureau en 3D, style rétro, qu'on installe sur sa propre machine. Les agents IA y sont des petits personnages qui se déplacent entre les bureaux, avec leur nom au-dessus de la tête. On les regarde travailler au lieu de lire des journaux : discussions, réunions du matin (« standups »), relecture de code, pull requests. Il y a aussi une salle de sport pour entraîner les agents, un « concierge » qui remet les sessions à zéro, une version 2D en pixels pour les machines faibles, et un éditeur pour dessiner son propre bureau (`/office/builder`). Les agents viennent d'Hermes Agent (fiche 26), d'un serveur à soi, ou d'une démo sans vrais agents.

Projet jeune : 27 commits, tous entre le 17 et le 29 août 2026, rien depuis. 470 étoiles.

## Ce qui est vraiment utile pour Finjaro et Léo
Léo a déjà l'essentiel de ce bureau : le monde 3D avec les agents, leur étiquette au-dessus de la tête, le mime du travail, la salle de réunion, l'Académie. C'était repris d'Agent Office (fiche 49), un projet du même genre, plus actif (206 commits au 08/10). Ce que Hermes3D ajoute :
- **L'éditeur de bureau** : chaque utilisateur place lui-même les bureaux, les salles, les meubles. Pour Léo : chaque entreprise aménagerait son étage, au lieu d'un plan identique pour toutes. C'est l'idée la plus neuve ici.
- **La version 2D légère** pour les machines faibles : Agent Office l'a aussi (`/lite`). Deux projets sur deux en ont besoin, ce qui confirme la priorité pour Léo, où le monde 3D reste lourd sur un téléphone d'entrée de gamme.
- **La réunion du matin des agents**, branchée sur GitHub et Jira : Léo a les réunions et le rapport du soir, pas encore une réunion courte et automatique chaque matin dans la salle de réunion 3D.
- **Le « concierge »** qui vide les longues conversations : c'est le résumé à mi-parcours de la fiche 26, pas encore fait dans Léo.
- **N'importe quel agent peut entrer** par une adresse standard (santé, état, liste des agents, discussion). Léo a son serveur MCP pour les outils extérieurs : même idée, déjà en place.

## Pour quels agents de Léo
- **Alpha** : décider si l'éditeur de bureau entre dans la feuille de route du monde 3D.
- **Forge** : la technique de la version 2D légère (Phaser) et du bureau en 3D.
- **Orchestre** : la réunion du matin automatique et le concierge des conversations longues.
- **Mentor** : la salle de sport des agents, qui rejoint l'Académie et l'examen de Rigo.

## Compétences à tirer (pour Mentor)
**Tenir une réunion du matin en cinq minutes** — Orchestre, Alpha, tous les chefs de service
Chaque matin, chaque agent dit en trois lignes : ce qu'il a fini hier (avec le lien du livrable), ce qu'il fait aujourd'hui, ce qui le bloque et qui peut le débloquer. Pas de récit, pas de chiffre sans source. Le meneur relève les blocages et les confie à quelqu'un avec une échéance. Piège : laisser la réunion devenir un rapport détaillé. Si un point demande plus de deux échanges, on le sort de la réunion.

## Limites, risques, prudence
- **Pas de reprise de code direct** : Léo est en JavaScript avec Three.js pur et Vite, Hermes3D en TypeScript avec Next.js et React Three Fiber. Il faudrait tout réécrire.
- **Modèles 3D d'origine inconnue** : on ne reprend aucun modèle sans licence claire (règle : aucune image ou visuel pris sur le web).
- **Projet arrêté depuis le 29/08** : peut-être abandonné, à ne pas suivre comme référence technique.
- Comme Agent Office, c'est un outil qu'on installe sur sa propre machine, pour une équipe. Léo reste un site pour toutes les entreprises.

## Verdict
**À garder en réserve.** Léo a déjà ce que montre la capture. Deux idées à proposer à Beau pour la suite du monde 3D : l'éditeur de bureau (chaque entreprise aménage son étage) et la version 2D légère pour les téléphones. Aucun code ni modèle repris.
