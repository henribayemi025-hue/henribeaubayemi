# Legion : la conversation de Beau avec Gemini, point par point (23/09)

Beau a envoyé le 23/09 au soir sa conversation avec Gemini sur Legion. Sa
consigne : « regarde vraiment en détail la conversation ». Et plus tôt :
« lis tout, point par point, sans rien sauter, parce qu'avant tu fuyais ».

Ce fichier reprend **chaque** point : ce que Beau a dit, puis ce que Gemini
a proposé et qu'il a validé (« c'est ce que je veux », « c'est un peu ce que
tu vois »). Pour chaque point, l'état a été **vérifié dans la base ou dans le
code le 23/09**, pas supposé.

✅ existe et vérifié · 🔧 à construire maintenant (dans l'ordre ci-dessous) ·
⏸ ensemble (il faut un geste de Beau, raison écrite)

Règle du dépôt public : l'exemple que Beau a donné sur son propre travail
n'est pas recopié ici. On garde seulement ce qu'il illustre : une équipe
d'analystes qui produit un rapport mensuel, des classements et des tableaux
de bord.

## A. L'idée

| # | Ce que Beau veut | État vérifié |
| --- | --- | --- |
| A1 | Être encore en avance dans deux ans, pas une mode | Réponse écrite plus bas (section F) |
| A2 | Choisir de 2 à 10 000 agents, spécialisés dans son métier (ex. cabinet d'avocats) | ✅ « Fonder » : l'effectif est un nombre libre, jusqu'à 10 000 ; modèle « Cabinet d'avocats et juridique » |
| A3 | Des agents qui sont de **vrais salariés**, pas un accès aux données : chacun connaît sa mission, ils se parlent, chacun tient sa partie (rapport mensuel, classements, nouvelles collections, tableaux de bord) | ✅ mandat par poste, plan chaque matin par département, tâches, relais d'un agent à l'autre ; 🔧 ils ne **discutent** pas encore entre eux sur un sujet (voir B3, réunions) |
| A4 | Une entreprise d'agents pour **chaque secteur** ; quelqu'un qui veut faire une application de marketplace active des agents déjà spécialisés | ✅ 57 modèles, dont « Place de marché en ligne », « Studio produit et technique », « Créateur solo de logiciel », « Agence web et mobile » ; 🔧 un modèle « Construire une application de A à Z » avec les 200 rôles (D10) |
| A5 | Ils connaissent les outils (Tableau, Notion, Excel, Power BI) et s'en servent | ✅ GitHub, boutique Finjaro, recherche sur Internet ; 🔧 fichiers Excel / CSV / PDF déposés dans un salon et lus par les agents (B2) ; ⏸ Google Sheets / Drive (projet Google de Beau) ; Notion, Tableau, Power BI : par l'assistant branché (MCP, fait) ou plus tard |
| A6 | Ils travaillent **vraiment**, avec de la valeur ajoutée | ✅ livrables chaque matin, vérifiés (un agent qui prétend un travail non fait est repris) |
| A7 | Ils **innovent** : « la dernière fois on a fait comme ça, faisons plutôt ceci » | ✅ Vigie (concurrence), Miroir (critique des pages), genre « proposition » ; 🔧 dans les réunions, un tour « et si on faisait autrement ? » |
| A8 | Ils font des **réunions** | 🔧 B3 |

## B. Comment ils travaillent

| # | Ce que Beau veut | État vérifié |
| --- | --- | --- |
| B1 | Ils communiquent entre eux | ✅ salons par département, relais de tâches, mémoire du salon |
| B2 | Connectés à **Excel** | 🔧 déposer un fichier Excel, CSV ou PDF dans un salon : les agents le lisent et répondent dessus ; et un tableau d'un agent se télécharge en Excel |
| B3 | Des **réunions** qu'on regarde en direct : « on va voir comment ils sont en train de le faire » | 🔧 « Réunion » dans un salon : un sujet, les agents concernés prennent la parole à tour de rôle (chacun lit les autres), puis le responsable conclut : décisions + tâches créées. Tout s'affiche en direct |
| B4 | Autonomes : **s'ils ont une question, ils la posent** | 🔧 aujourd'hui les agents n'écrivent jamais une vraie « question » (vérifié : aucun agent n'écrit ce genre). À faire : quand un agent bloque, il pose sa question à Beau ; la notification part déjà pour ce genre de message |
| B5 | S'ils ne comprennent pas, **ils m'appellent** ; on parle, puis il continue | 🔧 « Appeler » un agent : on parle, il répond à voix haute, la conversation reste écrite dans le salon. Constat au passage : un **message vocal** envoyé à un agent n'est pas entendu aujourd'hui (il reçoit « 🎤 ») — à corriger d'abord |
| B6 | Plusieurs **humains** travaillent avec les agents ; un humain pilote | ✅ invitations, membres, propriétaire |
| B7 | **Sécurité** : certains accès seulement, selon le rôle | ✅ par entreprise (connecteurs, rien de personnel pour les agents) ; 🔧 par agent (E3) |
| B8 | « C'est une vraie entreprise que je crée » | la somme de tout ce fichier |

## C. L'architecture (proposée par Gemini, validée par Beau)

| # | Élément | État vérifié |
| --- | --- | --- |
| C1 | Un orchestrateur reçoit l'objectif, le découpe, distribue | ✅ le directeur + les plans de chaque matin + Orchestre ; ✅ « Confirmer » pour les actions |
| C2 | Des spécialistes avec leur consigne, leurs données, leurs outils | ✅ mandat + personnalité + compétences + connecteurs |
| C3 | Une mémoire partagée (contexte, décisions) | ✅ mémoire de l'entreprise, résumé de chaque salon, feuille de route |
| C4 | Accès sécurisés aux données + gouvernance (valider / rejeter) | ✅ « Valider » / « Renvoyer » au tableau, « Confirmer » ; 🔧 le connecteur Accounting (les 4 fonctions de Claudinette sont prêtes) |
| C5 | Points de validation humaine, alertes quand un agent a besoin de clarifier | ✅ validation ; 🔧 alertes = B4 |
| C6 | Une étape finie déclenche la suivante (enchaînement) | ✅ relais : un livrable peut confier la suite à un autre agent |

## D. Le catalogue

| # | Ce que Beau veut | État vérifié |
| --- | --- | --- |
| D1 | Par secteur : les types d'entreprise et leurs postes | ✅ 57 modèles, 430 départements |
| D2 | Un exemple concret : le patron d'un cabinet comptable, son entreprise en agents jusqu'aux RH | ✅ modèle « Cabinet d'expertise comptable » (56 postes, RH comprises) ; exemple écrit en section G |
| D3 | Une consigne pour chaque agent | ✅ 3 535 postes, **tous** avec leur mandat ; 🔧 voir la consigne complète d'un agent dans sa fiche (E4) |
| D4 | Au moins 30 types d'entreprise | ✅ 57, et « ton secteur n'est pas là ? » : Legion écrit le modèle |
| D5 | Chacun avec sa personnalité | ✅ donnée à la création, modifiable |
| D6 | Modifiable par l'utilisateur | ✅ « Modifier » dans la fiche d'un agent, « + Agent » |
| D7 | Une nouvelle entreprise trouve déjà quelque chose de très spécialisé | ✅ ; 🔧 « + Agent » cherche dans les 3 535 postes du catalogue au lieu d'une page blanche |
| D8 | « 1 000 postes exhaustifs » | ✅ 3 535 postes, 2 694 intitulés différents |
| D9 | Les 100 postes de Gemini (10 départements × 10) | ✅ 98 déjà là (vérifié par programme) ; 🔧 les 2 manquants : responsable de l'innovation, asset manager immobilier |
| D10 | Les 200 rôles pour construire une application de A à Z (idée, design, front, back, base, paiement, croissance, juridique, support, déploiement) | 🔧 un modèle « Construire une application de A à Z » : 10 départements, 200 postes, les plus essentiels dès la petite taille |
| D11 | **200 propositions pour l'application** : tout ce que l'application peut avoir | 🔧 `LEGION-200-PROPOSITIONS.md`, chacune avec son état |
| D12 | Les 20 fonctionnalités de place de marché que Gemini a listées : Finjaro les a-t-il ? | 🔧 section H |

## E. La personnalisation

| # | Ce que Beau veut | État vérifié |
| --- | --- | --- |
| E1 | À l'arrivée : le profil de l'entreprise (taille, secteur, **outils utilisés** : Excel, Notion…) | ✅ taille, secteur, « qui es-tu », « ce que tu veux obtenir » ; 🔧 « Tes outils » |
| E2 | Les agents s'adaptent à ce profil | ✅ le projet est lu par chaque agent ; 🔧 les outils aussi |
| E3 | Modifier par agent : personnalité, **consignes de sécurité**, **restrictions d'accès aux données** | ✅ personnalité ; 🔧 « Ce qu'il ne fait jamais » et « Ce qu'il peut lire » (boutique, dépôt, comptabilité, Internet), par agent |
| E4 | (transparence) Voir exactement la consigne qu'un agent reçoit | 🔧 dans sa fiche |

## F. Tenir dans deux ans (A1) — la réponse franche

Avoir « plein d'agents », tout le monde l'aura dans deux ans : les grands
modèles en fourniront par défaut. Ce qui ne se copie pas en deux ans, c'est :

1. **Le travail réel sur les vraies données de l'entreprise** : sa boutique,
   sa comptabilité, son dépôt de code, ses fichiers. Un agent qui ne lit rien
   de réel ne vaut rien ; c'est pourquoi les connecteurs passent avant les
   nouveaux agents.
2. **La mémoire de l'entreprise** : ce qu'elle a décidé, refusé, appris. Au
   bout de six mois, on ne quitte pas une équipe qui sait tout ça.
3. **L'humain au bon endroit** : validation, questions, appels, réunions
   qu'on regarde. Les gens ne confient pas une entreprise à une boîte noire.
4. **La profondeur par métier** : 57 modèles, 3 535 postes. Un outil
   généraliste ne sait pas ce que fait un gestionnaire de paie ou un chef de
   mission comptable.
5. **Notre propre IA**, entraînée sur les exemples validés (ia_traces), pour
   ne dépendre de personne et offrir la formule gratuite.
6. **L'environnement Finjaro** : place de marché + Accounting + Mon argent +
   Legion, un seul compte. Personne d'autre n'a les quatre ensemble.

## G. L'exemple (D2) : le patron d'un cabinet comptable qui n'utilise pas Accounting

Il fonde son entreprise dans Legion avec le modèle « Cabinet d'expertise
comptable », effectif 12. L'organigramme se déploie : un directeur (le
chef de mission), la production comptable (collaborateurs, révision), la
paie et le social, le juridique, la relation client, les RH (recrutement,
intégration), la veille fiscale. Chaque agent a son mandat et sa
personnalité ; il peut les changer.

Le matin, chaque département écrit son plan ; les tâches arrivent au
tableau. Il dépose l'export Excel de sa balance (B2) : le réviseur
l'analyse et signale les écarts ; s'il bloque, il pose sa question (B4) ou
l'appelle (B5). Une réunion « clôture du mois » (B3) réunit révision, paie et
relation client ; le chef de mission conclut, les tâches tombent. Le patron
valide ou renvoie. Rien ne part vers un client sans lui.

## H. Les 20 fonctionnalités de place de marché listées par Gemini (D12)

Voir le tableau en bas de `LEGION-200-PROPOSITIONS.md` : chacune vérifiée
dans le code de Finjaro.

## Ordre de construction

B5 (vocal entendu) → B3 (réunions) → B4 (questions) → B5 (appeler) → B2
(fichiers) → D7 (+ Agent depuis le catalogue) → D9 + D10 (catalogue) → E1-E2
(outils) → E3 (droits par agent) → E4 (consigne visible) → C4 (connecteur
Accounting) → D11 / D12 (les 200 propositions et le tableau de Finjaro).
