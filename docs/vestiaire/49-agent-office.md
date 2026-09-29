# 49 — Agent Office (un bureau 3D où l'on travaille avec ses agents de code)

- **Source** : https://github.com/AgentSystemLabs/agent-office
- **Type** : dépôt GitHub, application Node + navigateur (three.js)
- **Accès** : ouvert. Cloné le 29/09/2026 (dernier commit du même jour, « blender model pipeline, the office dog in five breeds, and a loading screen »). Lus : README, `docs/how-it-works.md`, `docs/features.md`, la liste des fichiers `src/client/world`, `src/server`, `src/shared`, `package.json`.
- **Licence / droits** : **MIT**. On peut reprendre le code, y compris dans un produit payant, à condition de garder la mention de copyright « AgentSystemLabs » et le texte de la licence à côté du code repris.
- **Reçu de Beau le** : 29/09/2026 (message de Kenji, qui présente aussi une « partie 2 » à venir)

## Ce que c'est
Un bureau en 3D dans le navigateur, où une équipe s'installe à côté de ses agents de code (Claude Code, Codex, OpenCode). Chaque dépôt GitHub devient un étage de l'immeuble. Chaque agent est assis à un bureau, et son terminal s'affiche sur son ordinateur portable. Les tickets et les pull requests sont punaisés au mur. Quand un agent a besoin d'une réponse, il saute et sonne. Il y a aussi, pour l'ambiance : une réunion d'agents, un chien, un toit-terrasse avec un DJ, du golf, une borne d'arcade, la météo réelle.

**Important** : le logiciel tourne sur UNE machine (un ordinateur ou un serveur loué) qui exécute pour de vrai les agents en ligne de commande. Toute personne connectée peut donc lancer des commandes sur cette machine. Ce n'est pas un site qu'on ouvre pour des milliers d'entreprises : c'est un outil pour une équipe, sur sa propre machine.

## Ce qui est vraiment utile pour Finjaro et Léo
Léo utilise le même moteur 3D (three.js), donc les idées et les morceaux de code se transposent bien.
- **L'agent qui a besoin de toi se voit de loin** : il saute, une lumière change de couleur, une touche (N) emmène directement à celui qui attend depuis le plus longtemps, et le titre de l'onglet compte les agents en attente. C'est exactement ce qu'il manque aux « questions des agents à l'humain » dans le monde 3D de Léo.
- **L'agent mime ce qu'il fait** : il feuillette des papiers quand il lit, tape vite quand il écrit. On comprend son travail sans lire de texte.
- **La carte au-dessus de la tête** : le titre de la tâche et, en une ligne, ce que l'agent fait en ce moment.
- **Les tickets et pull requests GitHub au mur**, avec « confier ce ticket à un agent », et le gong quand une pull request est fusionnée. Tout cela rejoint le chantier « agents qui codent » et « GitHub par utilisateur ».
- **Une branche par agent**, puis la pull request ouverte d'une touche. C'est la même idée que la « branche leo/ après Confirmer » prévue.
- **Le chien, synchronisé sans flux continu** : le serveur envoie seulement l'itinéraire (chemin calculé sur une grille, algorithme A*), et chaque navigateur recalcule la position. Tout le monde voit le chien au même endroit sans que ça coûte de la bande passante. C'est la bonne technique pour le « pays commun » (plusieurs personnes dans le même monde).
- **La musique et le golf, pareils pour tous** : tout se déduit de l'heure du serveur, rien n'est diffusé en continu.
- **L'immeuble qui grandit avec les projets** : un étage par projet. Pour Léo : un étage par service de l'entreprise.
- **Le coût affiché par agent**, et un budget qui met les agents en pause.
- **Le circuit de modèles 3D sous Blender** (`blender/`), pour produire des personnages et des objets propres.

## Pour quels agents de Léo
- **Alpha** : l'architecture (un étage par projet, une branche par agent, une pull request d'une touche) et la synchronisation par itinéraires.
- **Forge** : les techniques three.js (mime des agents, lumière de statut, chien sur grille A*, ciel).
- **Orchestre** : « l'agent qui attend depuis le plus longtemps d'abord » comme règle de file d'attente.

## Limites, risques, prudence
- **À ne pas installer tel quel pour nos utilisateurs.** Il faut un serveur par équipe (4 processeurs et 16 Go de mémoire recommandés), et l'accès donne la main sur la machine. Léo reste un site pour toutes les entreprises : on reprend des idées et des morceaux de code, pas le logiciel entier.
- Le code est écrit en TypeScript, le monde 3D de Léo en JavaScript : il faudra adapter chaque morceau repris.
- Le README prévient que tout change vite et que rien n'est garanti d'une version à l'autre.
- Si on reprend du code : garder la mention MIT d'AgentSystemLabs dans le fichier concerné.

## Verdict
**Très utile comme modèle pour le monde 3D de Léo.** En premier, à reprendre (idée et code MIT) : l'agent qui saute et sonne quand il a besoin de toi, la touche « aller au suivant », la carte au-dessus de la tête et le mime du travail. Ensuite, les tickets GitHub au mur, en même temps que le connecteur GitHub par utilisateur. Rien n'est intégré avant l'accord de Beau.
