# Léo, une entreprise vivante

_25/09/2026, 1 h. Vision de Beau (24/09, 23 h 20) : « je veux une VRAIE
entreprise : des managers, des subordonnés, des stagiaires, des alternants ;
je veux les voir se parler dans les salons ; une boîte d'intérim qui part
auditer d'autres entreprises ; des freelances. Ne limite pas ton
imagination. » Et : tout ce qui est construit vaut pour TOUS les
utilisateurs de Léo, pas seulement pour Beau._

## Ce qui existe déjà (à ne pas refaire)

- Des départements, un directeur par département (`est_directeur`), des
  salons, un tableau des tâches, les plans du matin, les livrables du jour.
- Les réunions d'agents en direct, contester un livrable, l'intérim
  d'agents et les experts à la mission (chantier G9), le bureau et
  l'organigramme (chantier F).
- Depuis le 25/09 : `chef_id` et `grade` sur chaque agent (migration 0203).

Ce qui manque, et que Beau a vu : **on ne voit presque aucun échange entre
les agents.** Chacun rend son travail seul.

## Les étapes

| # | Quoi | Ce qu'on voit | Qui |
|---|---|---|---|
| 1 | **L'organigramme de Finjaro** : chef et grade de chaque agent | Orchestre le propose (tâche du 24/09), je relis, Beau valide d'un geste, puis on écrit `chef_id` et `grade` | Orchestre, puis moi |
| 2 | **Le point du matin dans chaque salon** : le manager dit la priorité du jour et donne une tâche à chacun de son équipe, par son nom | Un vrai message du manager, puis un « c'est noté » de chacun, avec sa question s'il en a une | moi (legion-travail) |
| 3 | **Les questions entre collègues** : un agent bloqué demande d'abord à son chef ou à un collègue qui sait, AVANT de se dire bloqué | « @Caisse, tu as le nombre de paiements d'hier ? » puis la réponse de Caisse | moi |
| 4 | **La relecture par le manager** : chaque livrable d'un junior ou d'un stagiaire est relu par son chef, qui dit « validé » ou « à reprendre : … » | Le fil de relecture sous le livrable | moi |
| 5 | **Stagiaires et alternants** : ils observent un confirmé, font de petites tâches relues, et passent junior sur des critères mesurables | Le programme de Mentor (tâche du 24/09), puis les grades qui évoluent | Mentor, puis moi |
| 6 | **Le compte rendu du soir** du manager à la Direction | Un message court par département | moi |
| 7 | **« Écrit… » en direct** : on voit qui est en train d'écrire dans un salon | « Plume écrit… » | moi |
| 8 | **La boîte d'intérim et d'audit** : une équipe d'agents part en mission dans une AUTRE entreprise de Léo (avec l'accord des deux propriétaires), fait un audit, rend un rapport, puis revient | La mission dans les deux entreprises, et le rapport | à concevoir |
| 9 | **Les freelances** : des agents indépendants, avec leurs compétences et leurs avis, que toute entreprise de Léo peut engager | Une place de marché d'agents | à concevoir |

## Garde-fous

- **Le coût** : chaque échange coûte un appel de modèle. Point du matin et
  compte rendu du soir limités à un message par agent ; les questions entre
  collègues comptent dans le budget de l'agent. Le plafond du mois reste la
  règle.
- **Aucun chiffre inventé** dans les échanges : une question sur un chiffre
  passe par les outils de vérification, sinon « je ne sais pas ».
- Les agents ne se répondent pas à l'infini : une question, une réponse, et
  au besoin le chef tranche.
- Tout reste visible et écrit dans les salons.

## Ordre proposé

D'abord 1, 2, 3 et 7 : c'est ce qui fait qu'on VOIT une entreprise vivante,
tout de suite. Ensuite 4, 5 et 6. Puis 8 et 9, qui demandent l'accord de deux
propriétaires et des règles de facturation entre entreprises.
