# 12 — « i-have-adhd » : des réponses qui commencent par l'action

- **Source** : https://github.com/ayghri/i-have-adhd
- **Type** : dépôt GitHub
- **Accès** : ouvert. Cloné le 24/09/2026 (dernier commit le 19/09/2026). Lus en entier : README, LICENSE, la fiche `skills/i-have-adhd/SKILL.md` (le cœur du dépôt), `AGENTS.md`, le crochet `hooks/always-on.sh` et `hooks.json`, `evals/rubric.md`, et le début de `evals/RESULTS.md` et de `evals/cases.jsonl`. Non relus : les traductions du README et de l'installation (10 langues), les adaptateurs par outil (Cursor, Gemini, Qwen, OpenCode…), les scripts de test Python/TypeScript. Ce sont des copies ou de la plomberie. Aucun script n'a été exécuté.
- **Licence / droits** : **MIT**, 2026, Ayoub Ghriss. Réutilisable en citant l'auteur.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Une fiche de style de réponse pour assistants de code, pensée pour un lecteur qui a peu de mémoire de travail disponible. Le sous-titre précise « aucun diagnostic nécessaire ». Dix règles : commencer par la prochaine action, numéroter les étapes, finir par UNE action concrète, écarter les digressions, rappeler où on en est à chaque message, donner des durées précises, montrer ce qui marche, annoncer les erreurs sans dramatiser, pas plus de 5 éléments visibles par liste, pas de préambule ni de formule de fin. Le dépôt contient aussi une vraie **grille d'évaluation** : critères pondérés, jugement à l'aveugle, règle de mise en production. L'auteur l'a appliquée et publie des résultats qui incluent un échec de sa propre règle de validation.

## Ce qui est vraiment utile pour Finjaro et Léo
- **Écrire pour Beau.** CLAUDE.md dit que Beau ne code pas, a un emploi à côté et dicte à la voix, et que lui annoncer une chose faite alors qu'elle ne l'est pas lui coûte du temps. Ces dix règles correspondent exactement à ce lecteur : l'action en première ligne, l'état rappelé (« étape 3 sur 5 »), une seule prochaine action qui prend moins de deux minutes. On les applique à Beau parce qu'il est pressé, **sans jamais lui attribuer de trouble**.
- **La vérification avant envoi** : supprimer la phrase d'annonce du début, le « autre chose ? » de la fin, les apartés « au fait », les adverbes d'hésitation vides et les expressions imagées. Garder une nuance quand elle porte une vraie incertitude, sinon on fabrique de la fausse assurance. Puis se demander : en lisant seulement la première et la dernière ligne, sait-on ce qui s'est passé et quoi faire ensuite ?
- **Quand ne PAS appliquer la concision** : une demande d'explication, une action destructrice (on confirme avant d'agir), trois échecs de suite (on arrête de bricoler et on questionne l'hypothèse), une vraie ambiguïté (une question courte vaut mieux qu'une devinette), une demande d'options (2 à 4 options classées).
- **La règle des 5 éléments porte sur l'affichage, pas sur l'analyse** : on ne jette rien de pertinent, on montre les 5 premiers et on garde le reste.
- **La grille d'évaluation** (`evals/rubric.md`) : exactitude 35 %, autonomie 25 %, facilité d'action 20 %, sécurité 10 %, concision 10 %. Jugement à l'aveugle (réponses A, B, C sans savoir laquelle vient de quelle version), constat « bloquant » pour une erreur grave. On ne publie une version que si elle n'a aucun bloquant et ne recule ni sur l'exactitude ni sur la sécurité. C'est un modèle clé en main pour Rigo et Mentor.
- **L'honnêteté des résultats** : l'auteur écrit que sa version gagne sur tous les critères mais échoue quand même à sa règle de validation, et il explique pourquoi la règle est peut-être trop stricte. C'est une bonne pratique à imiter dans nos propres rapports d'évaluation.

## Pour quels agents de Léo
- **Lien** (relation) : c'est lui qui parle le plus à Beau. Ses messages doivent commencer par l'action et finir par une seule prochaine étape.
- **Orchestre** : les comptes rendus d'avancement des tâches à plusieurs étapes doivent rappeler l'état à chaque message (« étape 3 sur 5 terminée, prochaine : … »).
- **Alpha, Claude, Ada Nkemba** : leurs messages à Beau sur le code doivent traduire le technique en action, avec des durées concrètes. La règle « trois échecs de suite, on remet en question l'hypothèse » est très utile en débogage.
- **Rigo** : la grille pondérée à l'aveugle et la règle de mise en production.
- **Mentor** : la grille pour évaluer les fiches, et la « vérification avant envoi » à intégrer dans toutes les fiches.
- **Claudinette** : les messages d'erreur factuels (« écart de 12 000 FCFA sur la commande X : cause, correction ») plutôt qu'alarmistes.
- **Tous les agents** qui rendent compte à Beau : la vérification avant envoi.

## Compétences à tirer (pour Mentor)

**Écrire un message à Beau : l'action d'abord** — Lien, Orchestre, Alpha, et tout agent qui s'adresse à Beau
La première ligne est ce que Beau doit faire ou décider, ou le résultat obtenu. Pas de contexte avant. Si le travail a plusieurs étapes, numérote-les, avec une seule action par étape. À chaque message d'une tâche longue, rappelle où on en est (« Étape 2 sur 4 faite : les prix vendeurs s'affichent dans la devise de la boutique. Prochaine : vérifier sur staging »). Donne des durées concrètes (« 15 minutes », « une soirée »), jamais « un peu de travail ». Termine par UNE prochaine action qui prend moins de deux minutes. Montre ce qui marche de façon vérifiable (« ouvre telle page, tu verras… »), et n'écris « c'est en ligne » que si tu l'as constaté. Ne mentionne jamais de trouble de l'attention. Ce style sert simplement quelqu'un de pressé qui lit sur son téléphone.
*Source : inspiré de i-have-adhd (règles 1, 2, 3, 5, 6, 7), MIT, Ayoub Ghriss.*

**Vérifier un message avant de l'envoyer** — tous les agents
Avant d'envoyer, supprime :
1. la première phrase si elle annonce ce que tu vas faire (« Je vais… », « Excellente question ») ;
2. la dernière si elle demande « autre chose ? » ou résume ce qui vient d'être dit ;
3. tout aparté « au fait » : propose-le à part, après ;
4. les adverbes d'hésitation qui n'apportent rien. Garde une nuance quand l'incertitude est réelle, sinon tu fabriques de la fausse assurance ;
5. les expressions imagées : remplace-les par l'action littérale.

Puis relis seulement la première et la dernière ligne : le lecteur sait-il ce qui s'est passé et quoi faire ? Si oui, envoie.
*Source : inspiré de i-have-adhd (pre-send check), MIT, Ayoub Ghriss.*

**Savoir quand ne pas faire court** — tous les agents
La concision cède la place dans cinq cas :
1. On te demande d'expliquer : explique complètement, avec des intertitres, mais toujours sans préambule.
2. Une action irréversible arrive (supprimer, publier, envoyer, migrer la base) : confirme avant, la sécurité passe avant la brièveté.
3. Trois tentatives de suite ont échoué : arrête, nomme l'hypothèse qui est peut-être fausse et pose UNE question de diagnostic.
4. La demande est vraiment ambiguë (fréquent avec un message dicté à la voix) : une question courte vaut mieux que deviner puis refaire.
5. On te demande des options : donne-en 2 à 4, classées, ta recommandation d'abord, chacune avec son compromis en une ligne.

Réduire une liste à 5 éléments visibles ne veut jamais dire oublier le reste.
*Source : inspiré de i-have-adhd (« When to break the rules »), MIT.*

**Évaluer une fiche avec une grille pondérée et à l'aveugle** — Rigo, Mentor
Pour savoir si une nouvelle version d'une fiche est meilleure, fais produire les réponses par l'ancienne et la nouvelle version, sur les mêmes demandes et plusieurs fois chacune. Le correcteur les reçoit étiquetées A et B, sans savoir laquelle est laquelle. Il note de 1 à 5 : exactitude (35 %), autonomie, c'est-à-dire faire soi-même ce qui revient à l'agent (25 %), facilité d'action (20 %), sécurité (10 %), concision (10 %). Il signale tout « bloquant » : erreur grave, consigne dangereuse, format imposé non respecté. On adopte la nouvelle version seulement si elle n'a pas de bloquant, ne recule ni sur l'exactitude ni sur la sécurité, et a une meilleure note pondérée. Publie les résultats tels quels, échecs compris.
*Transposition : il faut plusieurs appels séparés et un agent correcteur, organisés par Orchestre. Source : inspiré de `evals/rubric.md`, MIT, Ayoub Ghriss. Pondérations reprises telles quelles, à ajuster par Beau si besoin.*

## Limites, risques, prudence
- **Ne jamais présenter ce style comme « mode TDAH » à Beau ni à quiconque.** Parler de santé d'une personne sans raison n'a pas sa place ici. Pour Finjaro, c'est un style d'écriture pour lecteur pressé, rien de plus.
- **Des résultats mesurés par l'auteur lui-même** : la génération et le jugement utilisent le même modèle, sur 14 cas et 3 essais. C'est honnête et reproductible, mais ce n'est pas une preuve indépendante. On ne cite pas ces chiffres comme un fait établi.
- **Conçu pour des assistants de code** : les exemples sont techniques (tests, fichiers). L'adaptation aux agents non codeurs est faite ci-dessus, mais reste à tester.
- **`AGENTS.md` contient des instructions destinées aux agents** qui travaillent sur ce dépôt : où commenter sur GitHub, dans un fil « AI Agora » dédié. Elles ne s'adressaient pas à moi et je ne les ai pas suivies. Rien de malveillant : c'est un règlement de contribution.
- **Le crochet « toujours actif »** injecte la fiche à chaque démarrage de session. Il n'a pas été installé ni exécuté. Chez nous, l'équivalent consiste à mettre la fiche dans la consigne de l'agent, décidé par Mentor.
- Le README cite un livre sur le TDAH chez l'adulte comme inspiration lointaine. Aucun contenu de ce livre n'est repris.

## Verdict
**Retenu** pour la façon dont tous les agents de Léo écrivent à Beau (l'action d'abord, l'état rappelé, une seule prochaine étape, vérification avant envoi), ce qui répond directement à CLAUDE.md §7. **Retenu** pour Rigo et Mentor, pour la grille d'évaluation pondérée à l'aveugle et sa règle de mise en production. Le nom et le cadrage « TDAH » sont **mis de côté**, parce qu'ils n'ont pas à apparaître dans Léo : seules les règles d'écriture sont gardées.
