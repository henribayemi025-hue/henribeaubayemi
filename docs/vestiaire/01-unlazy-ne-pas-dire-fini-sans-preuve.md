# 01 — Unlazy : « la compétence qui empêche l'agent de dire que c'est fini alors que ce n'est pas vrai »

- **Source** : https://agentic-academy.fr/discover/watch/dff1861b-13a9-43e9-aa57-a4d7558aee3c (page gratuite du site Agentic Academy) ; outil présenté : https://github.com/Leonxlnx/unlazy
- **Type** : page « ressource gratuite » d'un site de formation (annoncée comme vidéo, c'est en fait un texte) + dépôt GitHub qu'elle fait installer
- **Accès** : page lue en entier, sans connexion. Le site est une application JavaScript : la page elle-même ne montre rien sans navigateur. J'ai donc lu la même donnée publique que le navigateur charge (titre, description, texte complet). **Il n'y a pas de vidéo sur cette page** : la fiche est de type « texte », aucun identifiant vidéo, et le lecteur renvoie une adresse vide. Le texte commence par « Tu as vu le principe dans la vidéo » : la vidéo en question a sans doute été publiée ailleurs (réseau social) et n'a pas été fournie. **Vidéo non regardée.** Le dépôt Unlazy a été cloné et lu : `SKILL.md`, `LICENSE`, gabarit `templates/gates-leaf.md`. Les scripts n'ont été ni installés ni exécutés.
- **Licence / droits** : la page d'Agentic Academy n'a aucune licence (tous droits réservés), on n'en reprend pas le texte. Le dépôt Unlazy est sous **MIT** : on peut s'en inspirer en citant la source.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un site de formation payant sur Claude Code (47 €/mois ou 147 € à vie) propose une fiche gratuite. Elle présente « Unlazy », une compétence pour Claude Code. Le problème visé : l'agent annonce « terminé » alors qu'il a sauté des étapes (l'auteur appelle ça « partial compliance »). La méthode : avant de travailler, on écrit une liste de « portes » (gates). Chaque porte est un résultat observable, avec la vérification qui le prouve. L'agent n'a pas le droit de dire « fini » tant que chaque porte n'est pas prouvée. La fiche ajoute deux conseils : autoriser Claude à lancer des sous-agents en parallèle pour les gros projets, et choisir la profondeur du découpage.

## Ce qui est vraiment utile pour Finjaro et Léo
- **Le cœur de la méthode répond exactement à la règle n°7 du CLAUDE.md** : « annoncer qu'une chose est faite alors qu'elle ne l'est pas coûte à Beau du temps qu'il n'a pas ». Unlazy en fait une discipline :
  - écrire les critères de « fini » AVANT de commencer ;
  - un critère = un résultat qu'on peut constater ;
  - une preuve par critère ;
  - un compte rendu qui donne les chiffres mesurés (tenus, non tenus, abandonnés).
- **L'abandon honnête** : si une porte devient impossible, on ne l'efface pas en silence. On écrit « abandonnée, parce que… » et le compte rendu ne peut plus dire « terminé ». Il devient une « passation » : quelqu'un d'autre doit décider.
- **Les pièges des vérifications qui ne peuvent pas échouer**. Le dépôt insiste sur trois points :
  - une vérification qui passe toujours ne prouve rien ;
  - on teste d'abord la vérification sur un cas où elle DOIT échouer ;
  - on ne recopie jamais un chiffre fourni comme preuve de lui-même.
- **Les quatre passes avant de rendre** :
  1. faire en entier ;
  2. relire en expert et remplacer ce qui a été bâclé ;
  3. chasser les erreurs ;
  4. polir. On recommence jusqu'à ce qu'une passe complète ne trouve plus rien.
- **La relecture de la demande juste avant le compte rendu** : relire la demande d'origine et ses ajouts, puis vérifier que chaque partie demandée est traitée ou explicitement renvoyée.
- **Le parallélisme** (donner le droit de lancer plusieurs sous-agents) : utile seulement à Orchestre et à Claude côté code ; nos autres agents ne lancent pas de sous-agents.

## Pour quels agents de Léo
- **Rigo (qualité)** : c'est sa méthode de travail naturelle. Il peut exiger les portes avant un chantier, puis les revérifier lui-même à la fin, sans se fier au compte rendu de l'agent.
- **Claude et Ada Nkemba (code)** : ils ont un terminal. Ils peuvent écrire des vérifications exécutables (une commande qui affiche un mot précis seulement si tout est bon). Pour Finjaro, une porte type : « en ligne sur staging », vérifiée sur l'adresse elle-même, et pas « CI verte » (CLAUDE.md §5).
- **Orchestre** : il découpe les gros chantiers entre agents. Le principe « chaque sous-tâche a son propre contrat et ses propres portes, le parent revérifie » est fait pour lui.
- **Alpha (direction technique)** : il valide les plans. Il doit refuser un plan sans critères de « fini » vérifiables.
- **Mentor** : c'est une compétence transversale à donner à tous les agents qui rendent compte à Beau.
- **Tous les agents qui rendent compte** (Plume, Écho, Traque, Claudinette…) : la version sans terminal (liste de portes vérifiées à la main) s'applique à eux aussi.

## Compétences à tirer (pour Mentor)

**Écrire ce que « fini » veut dire avant de commencer** — tous les agents, en priorité Rigo, Alpha, Orchestre
Avant une tâche qui a plusieurs parties, écris une courte liste de portes. Chaque porte décrit un résultat que quelqu'un d'autre peut constater, par exemple « la page vendeur affiche le prix en devise de la boutique sur staging ». « J'ai travaillé sur les prix » n'est pas une porte. À côté de chaque porte, écris comment tu la prouveras : lien, capture, chiffre relu dans la base, message envoyé. Relis la demande de Beau mot à mot : chaque chose qu'il a demandée doit avoir sa porte, ou être notée « non traitée » avec la raison. Piège : écrire les portes après coup, à partir de ce qu'on a fait, et non de ce qui était demandé.
*Source : inspiré d'Unlazy (MIT).*

**Ne jamais dire « terminé » sans preuve** — tous les agents qui rendent compte à Beau
Juste avant ton compte rendu, reprends chaque porte et vérifie-la de nouveau, maintenant : pas de mémoire, pas de « ça marchait tout à l'heure ». Donne ensuite le décompte réel, par exemple « 5 portes : 4 prouvées, 1 non tenue ». S'il reste une porte non tenue, n'écris pas « c'est fait ». Écris ce qui est fait, ce qui ne l'est pas, et ce qu'il faut pour finir. Sur Finjaro, « poussé » ou « vert en CI » ne veut pas dire « en ligne » : on ne l'écrit qu'après avoir vu la page sur son adresse. Piège : un chiffre repris tel quel du message de départ n'est pas une preuve, il faut le mesurer soi-même.
*Source : inspiré d'Unlazy (MIT) ; rejoint CLAUDE.md §5 et §7.*

**Abandonner proprement une partie impossible** — tous les agents
Si une partie de la tâche ne peut pas être faite (accès refusé, information manquante, décision qui revient à Beau), ne la fais pas disparaître de la liste. Écris-la « abandonnée », avec la raison en une phrase et ce qu'il faudrait pour la reprendre. Le compte rendu s'appelle alors « passation », pas « terminé », et l'abandon apparaît en haut, pas dans une note de bas de page. Piège : remplacer discrètement ce qui était demandé par quelque chose de plus facile, puis présenter le remplaçant comme la chose demandée.
*Source : inspiré d'Unlazy (MIT).*

**Tester qu'une vérification sait échouer** — Claude, Ada Nkemba, Rigo
Une vérification qui passe dans tous les cas ne prouve rien. Avant de t'y fier, fais-la tourner une fois sur un cas où elle DOIT dire non : une page sans le texte attendu, un compte de test, une ancienne version. Si elle dit oui quand même, elle est cassée. Préfère un signal de réussite précis (un mot affiché seulement quand tout est bon) à « pas d'erreur visible ». Piège : une recherche « rien trouvé » paraît rassurante, alors que la recherche peut aussi viser le mauvais endroit.
*Source : inspiré d'Unlazy (MIT).*

**Les quatre passes avant de rendre un travail** — Plume, Ada Nkemba, Claude, Miroir
1. Fais le travail en entier, sans « à compléter ».
2. Relis-le comme le ferait un expert du domaine, et remplace les parties faites à la va-vite.
3. Cherche activement les erreurs : chiffres, liens, cohérence avec le reste, cas limites (devise, langue, pays).
4. Corrige les petits défauts de forme.

Recommence tant qu'une relecture complète trouve encore quelque chose. Piège : s'arrêter à la première passe parce que « ça a l'air bon ».
*Source : inspiré d'Unlazy (MIT).*

## Limites, risques, prudence
- **Promesse marketing** : « empêche Claude de te mentir » est exagéré. Le dépôt lui-même le reconnaît : l'outil prouve seulement que la commande déclarée a réussi. Il ne prouve pas que la phrase de la porte dit vrai. La qualité dépend donc des portes qu'on écrit.
- **L'outil en lui-même ne sert pas à nos agents sans terminal** : il repose sur des scripts Node, un fichier `GATES.md` et, en option, un « crochet » Claude Code. Seuls Claude et Ada pourraient l'installer. Le dépôt dit lui-même : ne jamais installer ce crochet sans l'accord de l'utilisateur, et lire son `SECURITY.md` avant d'exécuter des vérifications venues d'un dépôt qu'on ne connaît pas. Toute installation passe par Beau.
- **La fiche fait installer un paquet par `npx`** (code tiers exécuté avec les droits de l'agent) : on ne l'a pas fait. On reprend la méthode, pas l'outil.
- **Pas de ligne de commande à copier** dans les fiches de nos agents : leurs versions sont réécrites en « liste de portes + preuves ».
- La page sert aussi de vitrine à une formation payante. Ses témoignages et ses chiffres (« 67+ vidéos », etc.) n'ont pas été vérifiés et ne nous concernent pas.

## Verdict
**Retenu** pour la méthode : écrire les critères de « fini » avant de commencer, n'annoncer « fait » qu'avec preuve, abandonner explicitement. C'est la réponse la plus directe au reproche n°7 de Beau, à distribuer à tous les agents, en priorité Rigo, Alpha et Orchestre. L'outil Unlazy lui-même est **gardé en réserve** pour Claude (côté code), à installer seulement si Beau l'accepte. La vidéo n'a pas été regardée : elle n'est pas sur la page fournie.
