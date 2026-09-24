# 25 — Claw Code : un « Claude Code » réécrit par d'autres

- **Source** : https://github.com/instructkr/claw-code (Beau a envoyé une capture des commentaires d'une vidéo de marco.dev25 où ce lien est donné). Le dépôt de référence est désormais https://github.com/ultraworkers/claw-code.
- **Type** : dépôt GitHub (outil d'agent qui code, en ligne de commande), plus une vidéo
- **Accès** : README et LICENSE lus. La vidéo n'a **pas été regardée** : seule la capture des commentaires a été vue. Le code n'a pas été lu en détail.
- **Licence / droits** : le dépôt se déclare sous licence MIT (« UltraWorkers and Claw Code contributors »). Mais son origine est contestée : il est né juste après la fuite du code de Claude Code, et un commentaire de la vidéo le résume ainsi : « Claude traduit le code Claude en python ». Une licence MIT posée sur un travail dérivé d'un code qui n'était pas libre ne le rend pas libre.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est
Un outil en ligne de commande, `claw`, qui fait ce que fait Claude Code : un agent qui lit un projet, modifie les fichiers, lance des commandes, garde ses sessions. Le code principal est en Rust. Une partie Python sert de référence. Le README lui-même le présente comme une « pièce de musée » plus qu'un produit sérieux, et renvoie vers deux autres outils (LazyCodex, Gajae-Code) pour travailler pour de vrai. Il sait parler à des modèles compatibles OpenAI, y compris en local.

## Ce qui est vraiment utile pour Finjaro et Léo
1. **Pour l'atelier de code (plan du 24/09)** : ça confirme qu'on n'a pas besoin de réécrire un Claude Code. Les pièces sont connues : lire les fichiers, proposer une modification, demander l'accord, lancer les tests, garder l'historique. Notre plan garde des outils à licence claire et à origine propre, et les trois modes Demander / Accepter les modifications / Auto, avec Confirmer obligatoire.
2. **L'idée « diagnostic d'abord »** (`claw doctor` : vérifier l'installation avant de travailler) est bonne pour l'atelier. Avant qu'un agent code, il vérifie que le projet compile et que les tests passent. Sinon, il le dit au lieu de s'y lancer.
3. **Le branchement de modèles compatibles OpenAI** correspond à ce que fait déjà notre moteur (DeepSeek, Kimi).

## Pour quels agents de Léo
- **Claude et Ada Nkemba (développeurs)** : la compétence « diagnostic avant de coder ».
- **Alpha (direction technique)** : juger d'où vient un outil avant de l'adopter.
- **Mentor** : ne pas enseigner à partir de ce code.

## Compétences à tirer (pour Mentor)
**Diagnostic avant de coder** — Claude, Ada Nkemba, Alpha
Avant de toucher au code d'un projet, fais un état des lieux en cinq points et écris-le : le projet se construit-il (commande de build) ? les tests passent-ils ? sur quelle branche es-tu ? y a-t-il des modifications non enregistrées ? les clés et réglages nécessaires sont-ils là, sans jamais les afficher ? Si un point est rouge, ne commence pas la tâche : signale-le avec la sortie exacte de la commande. Piège : corriger un problème ancien en même temps que la tâche demandée. Sépare les deux et demande.

**Vérifier d'où vient un outil avant de l'adopter** — Alpha, Vigie, Claude
Avant de proposer un dépôt ou une bibliothèque, vérifie trois choses et écris-les : la licence (fichier LICENSE lu, pas seulement le badge) ; l'origine (qui l'a écrit, et l'a-t-il écrit lui-même ou recopié d'un produit fermé ?) ; l'état (maintenu, testé, ou vitrine abandonnée ?). Un outil né d'une fuite de code, ou dont l'auteur dit qu'il n'est pas sérieux, ne va pas dans Finjaro, même s'il est populaire. Piège : confondre « beaucoup d'étoiles sur GitHub » et « sûr à utiliser ».

## Limites, risques, prudence
- **Origine liée à une fuite de code** : on ne reprend ni code ni structure de ce dépôt dans Finjaro ou dans l'atelier.
- Le README se décrit lui-même comme une vitrine maintenue par des agents, pas comme un outil de production.
- Les outils vers lesquels il renvoie (LazyCodex, Gajae-Code) ne sont pas étudiés ici. Pour y aller, il faut une fiche à part, avec la même vérification d'origine.
- La vidéo n'a pas été regardée : ce qui y est dit n'est pas couvert.

## Verdict
**Mis de côté comme source de code**, à cause de son origine contestée. On retient deux compétences de méthode (le diagnostic avant de coder, la vérification d'origine), écrites avec nos mots. Pour l'atelier de code, on reste sur le plan du 24/09.
