# Le studio de code de Legion — plan et coût, avant de coder

Beau, 23/09 : « je me lève et un agent me dit : Henri, tel concurrent a
lancé ça, on ne l'a pas encore ; je peux le construire et le mettre sur le
panneau de test, tu testes et tu vois ». Et, dans le plan complet, chantier
6 : « plusieurs agents codent chacun leur morceau, un relecteur, des tests,
on assemble, on pousse sur GitHub, on déploie ».

Ce fichier dit comment on le fait **sans machines à part**, ce que ça coûte,
et ce qu'il faut de Beau. Rien n'est codé tant qu'il n'a pas dit oui.

## L'idée simple : GitHub est l'atelier, Cloudflare est le panneau de test

On n'a pas besoin d'acheter des serveurs pour exécuter du code. Tout existe
déjà autour du dépôt :

1. **L'agent écrit le code sur une branche à part** du dépôt de
   l'entreprise (par l'API GitHub, avec le jeton branché dans Legion — droit
   d'écriture, sur ce seul dépôt).
2. **GitHub Actions exécute les tests** sur cette branche (c'est déjà ce que
   fait la CI de Finjaro). Rouge : l'agent lit l'erreur et corrige, trois
   tours au plus.
3. **Cloudflare construit un aperçu de la branche** et donne une adresse
   d'essai : c'est **le panneau de test**. Beau ouvre l'adresse, essaie,
   voit.
4. Beau touche **« Valider »** : la branche est fusionnée, et Cloudflare met
   en ligne. Il touche **« Renvoyer »** avec une remarque : l'agent reprend.

Rien ne part en ligne sans son clic. Une branche jamais validée ne touche
jamais finjaro.net.

## Plusieurs codeurs en même temps, sans conflit (Beau, 23/09 : la vidéo « Claude Squad »)

Le principe de Claude Squad, repris tel quel : **un agent = une branche = un
dossier de travail**. L'agent « serveur » travaille sur `studio/<tâche>-serveur`,
l'agent « écran » sur `studio/<tâche>-ecran`, l'agent « connexion » sur
`studio/<tâche>-connexion`. Aucun n'écrit dans la branche d'un autre : ils
avancent en même temps sans jamais se marcher dessus. L'assembleur fusionne
les branches une par une dans une branche d'assemblage, les tests tournent
à chaque fusion ; un conflit s'arrête là et revient à l'agent concerné.

## Qui fait quoi (les agents)

| Rôle | Agent | Ce qu'il fait |
| --- | --- | --- |
| L'architecte | Alpha (ou l'agent « produit » de l'entreprise) | découpe la demande en petites tâches indépendantes, une par agent |
| Les codeurs | 1 à 3 agents « ingénierie » | chacun écrit son morceau sur sa branche, avec les tests |
| Le relecteur | Rigo (qualité) | relit chaque morceau : clarté, sécurité, règles de la maison (pas de pays imposé, pas de chiffre inventé, pas de donnée personnelle) |
| L'assembleur | l'architecte | fusionne les morceaux, lance les tests, ouvre l'aperçu, écrit à Beau |

Un agent codeur travaille comme un développeur : il lit les fichiers
concernés (API GitHub), écrit la modification, l'envoie (un « commit »),
regarde le résultat de la CI. Il ne voit que le dépôt branché.

## Ce que ça coûte

| Poste | Coût | Remarque |
| --- | --- | --- |
| Gemini Pro (écrire et corriger le code) | **environ 0,20 à 1 € par petite fonctionnalité**, selon la taille | estimation d'après le prix public des jetons ; compté dans le plafond de l'entreprise |
| GitHub Actions (les tests) | gratuit jusqu'à 2 000 minutes par mois sur un dépôt privé ; illimité sur un dépôt public | Finjaro est public |
| Cloudflare (l'aperçu de branche) | compris dans l'offre actuelle | déjà en place pour Finjaro |
| Machines à part | **0 €** | on n'en prend pas |

Une grosse fonctionnalité (plusieurs écrans, une migration) peut coûter
quelques euros de Gemini et demander plusieurs tours. Le plafond du mois
arrête tout au-delà.

## Ce qu'il faut de Beau

1. **Un jeton GitHub avec droit d'écriture** sur le dépôt de Finjaro
   (Fine-grained : Contents et Pull requests en écriture, ce seul dépôt),
   collé dans « Mon dépôt GitHub » de Legion — le même écran que pour la
   lecture. Chaque entreprise cliente fera pareil avec le sien.
2. **Son oui** pour commencer. Ordre proposé : d'abord des changements
   simples et vérifiables (un texte, une couleur, un libellé), puis un
   écran, puis une fonctionnalité avec sa migration.

## Ce qui n'est PAS dans ce plan

- Aucun accès direct à la base de production depuis un agent : une
  migration écrite par un agent passe par le même chemin que les miennes
  (relue, testée, puis posée avec le mot de Beau).
- Pas de secrets dans le code : un agent qui a besoin d'une clé la demande,
  elle se range au coffre.
- Pas d'ordinateur piloté à distance ni de navigation libre : le studio
  travaille dans le dépôt, avec les tests, et c'est tout.

## Délai

Quand Beau dit oui : environ une semaine pour le premier cycle complet
(branche → tests → aperçu → « Valider ») sur un changement simple, en
respectant « produit propre d'abord ».
