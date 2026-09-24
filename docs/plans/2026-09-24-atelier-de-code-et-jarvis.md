# L'atelier de code et Jarvis dans Léo — plan documenté

*Rédigé le 24/09/2026. Rien n'est codé. Ce document sert à décider.*

Beau a demandé deux choses :

1. **L'atelier de code** : un endroit dans Léo où un étudiant ou un petit
   développeur arrive, trouve son environnement, ajoute ses plugins et ses
   compétences, crée des projets et des dossiers, et code avec une équipe
   d'agents très forts. Un agent peut faire tout le travail puis présenter
   comment ça marche. On peut se connecter à Claude, les agents peuvent aller
   sur son GitHub, et il y a trois modes : « demander la permission »,
   « accepter les modifications », « automatique ».
2. **Jarvis dans Léo** : on appelle, Jarvis s'allume, il parle naturellement
   et il agit dans Léo.

Beau a aussi dit : « ce n'est pas une blague, fais-le sérieusement, ne te base
pas juste sur ce que tu connais, et fais beaucoup de propositions ». Ce plan
s'appuie donc sur les pages officielles des produits, leurs grilles de prix,
des incidents réels et des avis d'utilisateurs (Hacker News, synthèses de
discussions Reddit). Toutes les sources sont listées à la fin, avec leur date
de lecture.

**Comment lire les chiffres :**
- **[V] vérifié** : lu le 24/09/2026 sur la page officielle du produit (ou dans
  le fichier de licence du dépôt).
- **[A] annoncé** : source secondaire (blog, comparatif, article de presse), ou
  page officielle vue seulement à travers un résumé de recherche. À revérifier
  avant de s'engager.
- **« non trouvé »** : je n'ai pas trouvé de source fiable. Je n'invente rien.
- Les prix sont en **dollars US**, comme ils sont publiés. Aucune conversion
  n'est faite, parce que chaque utilisateur de Léo paie dans sa monnaie.

---

## En bref, pour Beau (2 minutes)

**L'atelier de code.** La bonne manière de faire, celle que suivent tous les
produits sérieux (Codex, Claude Code sur le web, Copilot, Cursor), c'est la
suivante : le code tourne dans un **bac à sable**, c'est-à-dire un petit
ordinateur jetable, isolé, loué à la minute. Il n'a **aucune clé de Finjaro**
à l'intérieur, son accès à Internet est limité à une liste, et tout ce qui
sort de ce bac à sable passe par un **bouton Confirmer** : envoyer sur GitHub,
publier, dépenser. Je recommande les **bacs à sable de Cloudflare**. Finjaro
est déjà chez Cloudflare. Ils existent officiellement depuis avril 2026 et ils
savent garder les clés **hors** du bac à sable, pour que l'agent ne les voie
jamais. Une heure de bac à sable coûte quelques centimes. **Le vrai coût, ce
sont les modèles d'IA**, d'où les plafonds, et la possibilité pour chacun de
brancher sa propre clé.

**Jarvis.** Je recommande de le faire en trois temps :
- d'abord **un bouton et un geste** pour l'allumer ;
- ensuite une **voix en temps réel** (Gemini Live : c'est le moins cher au
  tarif officiel, environ 2 centimes la minute pour le son, et Léo a déjà une
  clé Google) ;
- enfin un **mot de réveil** (« Hé Léo ») reconnu **dans le téléphone
  lui-même**, sans jamais envoyer le micro ouvert sur Internet.

Sur iPhone, aucune application n'a le droit d'écouter en permanence en
arrière-plan. Le réveil passe donc par Siri (« Dis Siri, parle à Léo… »), ou
se fait quand Léo est ouvert.

**Les 5 décisions** sont à la fin (section 3). **Coût de départ estimé** :
environ **5 $ par mois de socle** (l'offre payante de Cloudflare, si elle
n'est pas déjà prise), plus un **plafond d'essais que Beau fixe** (je propose
30 $ pour le premier mois). Voir la section 4.

---

# PARTIE 1 — L'atelier de code

## 1.1 Ce que Léo sait déjà faire, et ce qui manque

**Ce qui existe (vérifié dans le dépôt le 24/09) :**
- des agents qui écrivent par un moteur commun (`supabase/functions/_shared/moteur.ts`) :
  DeepSeek d'abord, puis Kimi, Gemini, et Anthropic en secours ;
- un connecteur GitHub **en lecture seule** (`_shared/github.ts`) : les
  derniers changements et les tickets ouverts ;
- le bouton **Confirmer** (`legion-action`) : rien de réel ne s'exécute sans
  le clic d'un membre ;
- le **serveur MCP** (`legion-mcp`) : Claude, ChatGPT ou Claude Code peuvent
  déjà lire Léo et y écrire de façon bornée ;
- un **banc d'essai des moteurs** (`legion-banc`), qui pose une même question
  à plusieurs modèles et compare la réponse, le temps et le coût ;
- les compétences (fiches de méthode), les documents et les réunions ;
- un premier plan, « Le studio de code » (`docs/STUDIO-DE-CODE.md`, 23/09) :
  GitHub sert d'atelier, GitHub Actions teste, Cloudflare fait l'aperçu, et
  **aucune machine à part**.

**Ce qui manque pour ce que Beau décrit maintenant :**
1. Un **endroit où le code s'exécute pour de vrai**, pendant qu'on travaille.
   On veut pouvoir installer, lancer, tester et voir le résultat en quelques
   secondes, pas attendre la CI à chaque essai.
2. Un **écran d'atelier** : les dossiers, l'éditeur, l'aperçu, la
   conversation et les demandes d'autorisation.
3. Les **modes de permission**, appliqués par l'outil lui-même, pas
   seulement écrits dans une consigne.
4. **GitHub en écriture**, proprement : sur une branche à part, jamais sans
   Confirmer.
5. **Les plugins, les compétences et Claude**, branchés sans ouvrir de brèche.

Le plan du 23/09 reste valable comme **alternative économique** (voir
l'alternative C, section 1.7).

## 1.2 Comment font les autres (tableau)

| Produit | Où tourne le code | Sécurité | Prix (publics) | Ce qu'on aime / ce qu'on déteste | La leçon pour nous |
|---|---|---|---|---|---|
| **OpenAI Codex (cloud)** | Conteneur jetable chez OpenAI, image « universal » (Ubuntu, Python, Node, Rust, Go…) [A] | Deux temps : l'**installation** a accès à Internet, puis l'**agent travaille sans Internet** par défaut. On peut ouvrir une liste de domaines, et limiter aux requêtes de simple lecture (GET, HEAD, OPTIONS) [V]. Les **secrets ne servent qu'à l'installation** et sont **retirés avant que l'agent travaille** [A] | Inclus dans ChatGPT : Free 0 $, Go 8 $, Plus 20 $, Pro dès 100 $, Business 20 $ par personne [V]. Tarif par tâche : non publié [V] | Aimé : des limites d'usage jugées plus généreuses, du travail en parallèle, la relecture des demandes de fusion. Détesté : lent en travail interactif, des quotas qui changent [A] | Séparer « installer » (avec réseau) et « travailler » (réseau fermé). Les secrets ne restent jamais pendant le travail de l'agent. |
| **Claude Code (web)** | Machine virtuelle isolée chez Anthropic, une par session [V] | Réseau limité par défaut. Les identifiants git et les clés restent **hors** du bac à sable : un relais s'authentifie à la place de la session [V]. Six modes de permission (détails en 1.6) [V] | Compris dans les abonnements Claude. Pas de facturation séparée de la machine ; la session partage les limites du compte [V] | Aimé : la qualité sur le travail difficile, les compétences, les « hooks ». Détesté : les limites d'usage atteintes en pleine session [A] | Garder les clés **hors** du bac à sable. Proposer des modes, avec « Automatique » surveillé par un second modèle. |
| **GitHub Copilot, agent de code** | Environnement éphémère dans GitHub Actions [A] | **Pare-feu** actif par défaut, avec une liste de domaines. Analyse automatique du code produit (CodeQL, recherche de secrets). Le pare-feu **ne couvre pas** les serveurs MCP ni les étapes d'installation [A] | Pro 10 $, Pro+ 39 $, Business 19 $ par personne. Facturation à l'usage en « crédits IA » depuis le 01/06/2026 [V] | Aimé : tout se passe dans GitHub. Détesté : une tâche complexe consomme beaucoup [A] | Montrer honnêtement ce que le pare-feu ne couvre pas. Relire le code produit automatiquement. |
| **Cursor, agents en nuage** | Machine virtuelle Ubuntu par agent, avec terminal, navigateur et bureau [A] | Isolement par machine, commits signés. **Internet ouvert** par défaut [A] | Pro 20 $, Pro+ 60 $, Ultra 200 $, puis tarif des modèles [A] | Aimé : il rend une demande de fusion prête, avec vidéo et captures. Critiqué : peu de contrôle pour les entreprises [A] | Rendre une **preuve** du travail : une capture, un journal, les tests. |
| **Replit Agent** | Espace Replit complet, avec base de données et hébergement intégrés [A] | Incident de juillet 2025 : l'agent a **supprimé la base de production** d'un utilisateur pendant une « expérience » de 12 jours, et le PDG s'est excusé. Les commentaires sur HN : « si l'agent a l'accès, il a la permission ; une permission ne se négocie pas en parlant avec un modèle » [V] | Core 20 $ par mois (20 $ de crédits), Pro 100 $ [V]. Tarif « à l'effort » : **on connaît le prix après coup** [A] | Aimé : il corrige lui-même ses erreurs. Détesté : des crédits vidés vite, un prix imprévisible. Un testeur a dépensé environ 31 $ en 2 à 3 heures pour un prototype « à peine passable » [A] | **Jamais d'accès à la production.** Afficher le coût **avant**, pas après. |
| **Bolt.new (StackBlitz)** | **Dans le navigateur** (WebContainers) [A] | Le code tourne sur la machine de l'utilisateur. WebContainers exige une **licence commerciale** en production [V] | Free : 300 000 jetons par jour, 1 M par mois. Pro 25 $ : 10 M par mois, reportables [V] | Aimé : ultra-rapide au départ. Détesté : les jetons fondent quand le projet grossit, et le cycle « je corrige, ça casse ailleurs » [A] | Le navigateur coûte zéro serveur, mais la licence et la limite de taille comptent. |
| **Lovable** | Hébergé, avec React et Supabase [A] | Polémique d'avril 2026 sur une faille niée puis imputée à d'autres (HN) [V] | Free : 5 crédits par jour (30 par mois) [V] ; Pro ~25 $ [A] | Aimé : très accessible aux débutants. Détesté : les crédits partent vite en itérant [A] | La facilité attire les débutants. Les tarifs à l'itération les découragent. |
| **v0 (Vercel)** | Hébergé chez Vercel [A] | — | Free 0 $ (5 $ de crédits, 7 messages par jour), Plus 30 $, Business 100 $ par personne [V] | Aimé : de beaux écrans. Critiqué : il donne l'impression que l'appli est plus avancée qu'elle ne l'est [A] | Ne pas **flatter** : dire ce qui manque encore. |
| **Devin** | Machine chez Cognition [A] | — | Free 0 $, Pro 20 $, Max 200 $, Teams 80 $ + 40 $ par développeur [V] | Critiqué en 2025 : « mauvais dans son travail » selon des testeurs (HN) [V] | L'autonomie totale déçoit. La relecture humaine reste nécessaire. |
| **Google Jules** | Machine chez Google : non détaillé sur la page lue | — | Gratuit : 15 tâches par jour, 3 en parallèle ; avec Google AI Pro : 100 par jour ; Ultra : 300 par jour [V] ; prix des abonnements 19,99 $ et 124,99 $ [A] | Travail asynchrone, gratuit pour commencer [A] | Un **quota quotidien simple** est lisible pour un étudiant. |
| **OpenHands** (open source) | Conteneur Docker, ou machine distante [A] | — | Code **MIT** [V] ; offre en nuage gratuite plafonnée à 10 conversations par jour (modèle payé à part) [A] | Alternative ouverte à Devin [A] | Une brique libre qu'on peut étudier, et réutiliser en citant. |
| **Aider** (open source) | Sur la machine du développeur | **Un commit git à chaque modification**, et `/undo` pour annuler [A] | Gratuit, on paie seulement le modèle | Aimé : on ne perd jamais son travail [A] | **Chaque action de l'agent = un point de retour.** |
| **Cline / Roo** (open source) | Dans l'éditeur du développeur | Séparation **Plan / Agir**, approbation action par action, **point de restauration après chaque action**. Conseil officiel : laisser l'auto-approbation désactivée tant qu'on n'a pas de raison [A] | Code Apache-2.0 [V] | Aimé : le contrôle fin [A] | Le mode « Plan » d'abord. Des retours en arrière à grain fin. |

**Ce que disent les utilisateurs, en résumé** (sources en section 5) :
- **L'argent et les quotas passent avant la qualité du code.** Une analyse de
  427 commentaires Reddit et de 806 avis a compté 5 et 3 mentions de la
  qualité du code, contre 20 et 59 mentions du coût [A]. Les gens veulent
  **savoir ce que ça va coûter** et **ne pas être coupés en plein travail**.
- **Le premier résultat est toujours beau, c'est l'itération qui compte.**
  Plusieurs comparatifs relèvent un « mur » vers 15 à 20 composants, et le
  cycle « je corrige, ça casse ailleurs » qui vide les crédits [A].
- **Les experts combinent deux modèles** : un qui écrit, un autre qui relit.
  Le relecteur attrape ce que le premier a raté [A]. C'est exactement l'idée
  de Rigo, le relecteur du plan du 23/09.
- **Pour apprendre, l'IA peut nuire si elle fait tout.** Dans une étude
  contrôlée de 2026 (22 participants), le travail avec Copilot donne de
  meilleurs résultats sur le moment. Mais une semaine après, le recul des
  performances est plus fort qu'avec un binôme humain [V, résumé de l'article].
  Harvard (CS50) a conçu son tuteur « canard » pour **guider sans donner la
  réponse** [A]. Claude Code a un style « Apprentissage » qui laisse des
  `TODO(human)` à écrire soi-même [A].

## 1.3 Les briques possibles pour nous

### Où exécuter le code (le bac à sable)

| Brique | Ce que c'est | Prix publié | Limites clés | Compatible avec nous ? |
|---|---|---|---|---|
| **Cloudflare Sandbox (sur Containers)** | Un vrai Linux isolé par utilisateur, piloté depuis un Worker. Commandes, fichiers, processus en fond, **adresses d'aperçu**, terminal dans le navigateur [V]. Officiel (« GA ») depuis le 22/04/2026 [A] | Offre payante Workers **5 $/mois**, qui inclut 25 Gio-heures de mémoire, 375 vCPU-minutes et 200 Go-heures de disque. Au-delà : 0,0000025 $ par Gio-seconde, 0,000020 $ par vCPU-seconde, 0,00000007 $ par Go-seconde [V]. Le CPU serait facturé **à l'usage réel** [A] | Tailles de 1/16 à 4 vCPU, 256 Mio à 12 Gio [V]. Le SDK est noté « préversion 1.0 » dans la doc [V] | **Oui.** Finjaro est déjà sur Cloudflare. Depuis le 13/04/2026 : **injection des clés hors du bac à sable**, liste de domaines autorisés ou refusés, et politiques réseau qui changent en cours de tâche [V] |
| **E2B** | Micro-machines pour agents, SDK ouvert (Apache-2.0) [V] | 0,000014 $ par vCPU-seconde, 0,0000045 $ par Gio-seconde. Hobby gratuit avec 100 $ de crédits uniques et des sessions d'**1 h max**. Pro **150 $/mois** et 24 h max [V] | 20 bacs en parallèle en Hobby [V] | Oui, par API, depuis une fonction. Mais un fournisseur de plus, et un abonnement fixe élevé dès qu'on dépasse le gratuit. |
| **Daytona** | Bacs à sable pour agents [V] | 0,0504 $ par vCPU-heure, 0,0162 $ par Gio-heure, 200 $ de crédits d'essai [V] | — | Oui, par API. Même remarque. |
| **Vercel Sandbox** | Micro-machines (Firecracker) [V] | Hobby : 5 h de CPU actif par mois, sessions de 45 min. Pro : 0,128 $ par heure de CPU actif, 0,0212 $ par Go-heure [V] | Gratuit plafonné, puis offre Pro Vercel [V] | Possible, mais nous ne sommes pas chez Vercel. |
| **Claude Managed Agents (Anthropic)** | L'agent **et** son bac à sable, tout gérés par Anthropic [V] | Tarif du modèle, plus **0,08 $ par heure de session active** [V] | **Bêta**. Pas éligible à la « rétention zéro » des données [V] | Oui, mais seulement avec Claude, et les données restent chez Anthropic. Voir l'alternative B. |
| **Dans le navigateur** (WebContainers, Sandpack, Pyodide) | Le code tourne sur le téléphone ou l'ordinateur de l'utilisateur | WebContainers : **licence commerciale obligatoire** en production, prix sur devis [V]. Sandpack (Apache-2.0) et Pyodide (MPL-2.0) sont libres [V] | Pas de vrai Linux ; lourd sur un petit téléphone | Oui pour des aperçus de sites et des exercices Python, à coût nul. |
| **Fonctions Supabase** | Déjà là | — | **2 secondes de CPU** par appel, 150 s (gratuit) ou 400 s (payant) au total [V] | **Non** pour exécuter du code ou faire tourner une longue boucle d'agent. Oui pour le journal, les droits et les données. |

### L'éditeur dans le navigateur
- **Monaco** (le moteur de VS Code, licence MIT) : sa FAQ répond **« Non »** à
  la question du support des navigateurs mobiles [V]. Or les applis Finjaro
  chargent le site dans le téléphone.
- **CodeMirror 6** (MIT) [V] : conçu pour le tactile et beaucoup plus léger.
  Replit est passé de Monaco à CodeMirror [A].
- **Recommandation : CodeMirror 6.**

### Brancher GitHub
- **Application GitHub (GitHub App)** plutôt qu'un jeton collé à la main.
  L'app obtient des **jetons qui expirent au bout d'une heure** [V], limités
  aux dépôts et aux droits demandés [V], sous une identité de robot distincte
  [A]. L'utilisateur choisit les dépôts à l'installation.
- Le jeton « à grain fin » (ce que prévoyait le plan du 23/09) reste possible
  comme **solution de départ**. Mais il est lié à une personne, il dure
  longtemps et il faut le renouveler à la main [A].
- Côté règles : **une branche par tâche** (`leo/<tâche>`). **Jamais** d'envoi
  direct sur la branche principale. On ajoute une **règle de protection**
  GitHub pour que l'app ne puisse pas écrire sur la branche principale, même
  si l'agent le tentait.

### « Se connecter à Claude » : ce qui est permis et ce qui ne l'est pas
- **Interdit, vérifié** : Anthropic écrit que, sauf accord préalable, un
  produit tiers **ne peut pas proposer la connexion « compte Claude.ai »**, ni
  les limites d'un abonnement. Il faut une **clé API** [V]. Un programme de
  « crédit Agent SDK » pour les abonnés a été annoncé puis **mis en pause le
  15/06/2026** [V]. On ne bâtit donc rien dessus.
- **Permis, recommandé :**
  1. **Apporter sa clé** (Anthropic, ou OpenAI) : elle est rangée au coffre,
     **jamais dans le bac à sable**, et ajoutée aux requêtes au moment où
     elles sortent, par le relais de Cloudflare [V].
  2. **Brancher Claude à Léo par MCP** : c'est déjà fait (`legion-mcp`). On y
     ajoute des outils « atelier » (lire un projet, proposer une modification,
     lancer les tests). L'utilisateur garde **son** abonnement Claude, dans
     **l'application de Claude**.
  3. **Claude Code sur le web de l'utilisateur** travaille sur le même dépôt
     GitHub. Léo suit la branche, montre le diff et fait relire par ses agents.

### Les compétences (skills) et les plugins
- **Les compétences** : le format `SKILL.md` (un dossier, un fichier avec un
  en-tête et des consignes, plus des scripts ou références facultatifs) est
  devenu un **standard ouvert** en décembre 2025. Il est repris par Codex,
  Copilot, Cursor, Gemini CLI et d'autres [A]. Léo a déjà des fiches de
  méthode : on sait donc **importer et exporter au format SKILL.md**.
- **Les plugins de Claude Code** : un dossier qui peut contenir des
  compétences, des agents, des « hooks » (des actions automatiques), des
  serveurs MCP et même des **exécutables** [V]. Un plugin peut donc **exécuter
  du code**. Ce n'est pas un simple texte.
- **Le danger est réel et récent :**
  - en janvier 2026, **341 compétences malveillantes sur 2 857** (11,9 %) ont
    été trouvées sur le magasin d'OpenClaw ; elles installaient un voleur de
    mots de passe [A] ;
  - Snyk a trouvé de l'injection de consignes dans **36 %** des compétences
    testées [A].
- **Notre règle** :
  - une compétence **en texte seul** peut s'importer après une analyse
    automatique ;
  - une compétence **avec scripts**, un plugin ou un serveur MCP ne s'active
    qu'après **Confirmer**, ne tourne **que dans le bac à sable**, et
    n'obtient **aucune clé**.

### Les modèles (« extrêmement forts en code »)
- Les classements publics sont **contradictoires** en 2026. Sur SWE-bench Pro,
  le même mois : 59,1 % pour le meilleur score « standardisé » (Scale), 80 %
  pour le meilleur score « annoncé par les éditeurs » [A]. SWE-bench Verified
  est « saturé » : les meilleurs modèles sont tous autour de 95 % [A].
- **Conclusion** : on choisit sur **nos propres essais**, avec le banc
  `legion-banc` qui existe déjà, sur de vraies tâches d'atelier.
- Coût des modèles par million de jetons (entrée / sortie) :

| Modèle | Entrée (sans cache) | Entrée (en cache) | Sortie | Statut |
|---|---|---|---|---|
| DeepSeek flash (heure pleine / creuse) | 0,30 / 0,15 $ | 0,006 / 0,003 $ | 1,20 / 0,60 $ | [V] |
| DeepSeek v4-pro (heure pleine / creuse) | 1,32 / 0,66 $ | 0,044 / 0,022 $ | 3,96 / 1,98 $ | [V] |
| Kimi K2.6 | 0,95 $ | non vérifié | 4,00 $ | [A] |
| Claude Sonnet 5 | 2 $ | 0,20 $ | 10 $ | [V] |
| Claude Opus 5.5 | 4 $ | 0,20 $ | 20 $ | [V] |
| Claude Fable 5.1 | 10 $ | 0,25 $ | 50 $ | [V] |

## 1.4 Ce qui peut mal tourner (sécurité, sérieusement)

| Danger | Cas réel | Parade dans l'atelier |
|---|---|---|
| **Vol de secrets** | Août 2025, attaque « s1ngularity » : des versions piégées du paquet Nx ont **utilisé les assistants IA installés** (Claude, Gemini, Q) avec leurs options « tout autoriser » pour chercher des secrets. Plus de mille jetons GitHub valides ont fuité [A] | **Aucun secret dans le bac à sable.** Les clés sont ajoutées par le relais **à la sortie**, et seulement vers le bon domaine [V]. Pas de variable d'environnement sensible. Le bac à sable n'a **jamais** la clé de service de Supabase. |
| **Dépôt piégé / injection de consignes** | Mai 2025 : un **ticket GitHub piégé** a poussé un agent à copier des dépôts privés dans une demande de fusion publique. Invariant Labs parle de « trifecta » : données privées + consignes piégées + moyen de faire sortir [A] | Tout ce qui vient du dépôt, des tickets ou du web est une **donnée, jamais une consigne**. On casse la trifecta : réseau fermé par défaut, un seul dépôt par session, sortie **seulement** par Confirmer. |
| **Commandes dangereuses** | Replit, juillet 2025 : base de production supprimée [V] | Le bac à sable est jetable et n'a **aucun accès à une base réelle**. Un point de retour git après chaque action. Une liste de commandes toujours refusées. |
| **Plugins et compétences malveillants** | ClawHavoc, janvier 2026 [A] | Voir section 1.3 : Confirmer, bac à sable, aucune clé, analyse. Un **catalogue vérifié** par l'équipe. |
| **Réglages cachés dans le dépôt** | Claude Code ignore volontairement le mode « tout autoriser » écrit dans les réglages d'un dépôt, pour qu'un dépôt ne puisse pas s'auto-autoriser [V] | Un fichier du dépôt ne peut **jamais** changer le mode, le réseau, les hooks ni les plugins. Seul l'utilisateur le peut, dans l'écran Léo. |
| **Coûts qui explosent** | Replit : prix connu après coup [A]. Bolt : « 10 M de jetons partis » (HN, déc. 2025) [V] | **Estimation avant**, compteur en direct, plafond par session, par jour et par mois. **Alerte à 80 %**, puis passage au modèle économique annoncé clairement (doctrine Jarvis). Arrêt après 3 échecs identiques. Le bac à sable s'endort quand on ne s'en sert pas. |
| **Fuite par l'aperçu** | — | Adresse d'aperçu **privée et temporaire**, liée à la session, non indexée. |
| **Abus** (minage, attaques depuis nos machines) | Risque classique de toute offre de calcul | Réseau sortant filtré, taille et durée plafonnées, quota gratuit bas, compte vérifié. |

### Les modes de permission : où ils sont sûrs, où ils ne le sont pas

Chez Claude Code, les modes sont : **Manuel** (« default » : il demande avant
toute modification ou commande), **Accepter les modifications** (les
modifications de fichiers et les commandes de fichiers simples passent),
**Plan** (il explore sans rien modifier), **Auto** (un **second modèle
surveille** chaque action et bloque, par exemple, `curl | bash`, l'envoi de
données sensibles, les mises en production, les suppressions massives, le
« force push », la fusion d'une demande que personne n'a relue),
**dontAsk** (seulement ce qui est pré-autorisé), et **bypassPermissions**,
réservé aux « conteneurs et machines isolés **sans Internet** » et qui
« n'offre **aucune protection** contre l'injection de consignes » [V].

Pour Léo, je propose **quatre modes**, et une liste de choses qu'**aucun mode
n'autorise** sans clic :

| Mode Léo | Ce qui passe sans demander | Sûr quand… | Pas sûr quand… |
|---|---|---|---|
| **Réfléchir d'abord** (Plan) | Lire les fichiers, chercher, proposer un plan | Toujours sûr | — |
| **Demander** (**par défaut**) | Lire seulement. Chaque modification ou commande affiche une carte « Autoriser une fois / Toujours pour cette commande dans ce projet / Refuser » | Toujours sûr ; bon pour apprendre | Fatigue des clics sur les longues tâches |
| **Accepter les modifications** | Écrire et modifier des fichiers **dans le projet**, créer des dossiers. Les commandes et le réseau demandent encore | Le projet est dans le bac à sable et chaque modification est un point de retour | — |
| **Automatique** | Tout ce qui **reste dans le bac à sable** : fichiers, commandes, tests, installations **depuis la liste autorisée**. Un **garde** (second modèle, comme chez Claude Code) relit chaque commande. Retour en mode Demander après 3 blocages de suite | Bac à sable sans secret, réseau filtré, plafond de coût | S'il y avait des secrets ou un réseau ouvert. C'est pourquoi le mode Automatique **n'élargit jamais** le réseau ni les clés |

**Toujours Confirmer, dans tous les modes** (niveau N3 de la doctrine Jarvis
déjà adoptée pour Léo) :
- envoyer du code sur GitHub (en V0 et V1, même sur une branche `leo/…`) ;
- ouvrir ou fusionner une demande de fusion ;
- publier ou déployer ;
- ajouter un domaine au réseau autorisé ;
- utiliser une clé ;
- activer un plugin ou une compétence avec scripts ;
- dépasser un plafond de dépense ;
- supprimer un projet.

**Rappel** : un contrôle de sécurité a déjà bloqué une première version où un
agent envoyait du code sans confirmation. Cette conception répond exactement à
ce reproche : bac à sable isolé, aucun secret de Finjaro, branche à part, mode
Demander par défaut, et un journal de chaque action.

> Plus tard (V2), et seulement si Beau le décide, on pourra ajouter une option
> « toujours autoriser l'envoi sur les branches `leo/…` de CE dépôt ». Elle
> serait révocable, **jamais** valable pour la branche principale, et la règle
> de protection GitHub continuerait de bloquer la branche principale.

## 1.5 L'architecture recommandée (A) et deux alternatives

### A — Recommandée : « Atelier Cloudflare », Léo garde la mémoire

```
 Téléphone / navigateur (Léo, écran Atelier)
   │  éditeur CodeMirror, arbre des dossiers, conversation, cartes « Autoriser / Confirmer »
   ▼
 Worker « finjaro-atelier » (Cloudflare, séparé du site)
   │  vérifie la session Supabase de l'utilisateur
   │  fait tourner la BOUCLE DE L'AGENT (pas de limite des 2 s de CPU de Supabase)
   │  applique le MODE (Demander / Accepter / Automatique) : c'est l'outil qui décide, pas la consigne
   │  RELAIS DE SORTIE : ajoute les clés (modèle, GitHub) à la sortie, filtre les domaines
   ▼
 Bac à sable (un par projet actif, jetable, endormi s'il ne sert pas)
   │  Linux, git, node, python ; le projet ; aucune clé ; réseau = liste autorisée
   │  un point de retour git après chaque action ; adresse d'aperçu privée
   ▼
 Supabase (existant)                       GitHub (via l'application GitHub)
   tables atelier_* (additives) :           branche leo/<tâche>, seulement après Confirmer
   projets, sessions, journal, coûts,       jetons d'1 h, dépôts choisis par l'utilisateur
   demandes d'autorisation ; Confirmer
```

**Pourquoi A** : c'est la même famille que les meilleurs (Codex, Claude Code
web, Copilot). Tout reste chez Cloudflare et Supabase, où Finjaro vit déjà. Le
relais de sortie de Cloudflare donne **exactement** la garantie qui manquait :
l'agent ne voit jamais les clés [V]. Et on garde le **choix du modèle**
(DeepSeek, Kimi, Gemini, Claude) par le moteur commun.

**Le point faible** : la boucle de l'agent tourne dans un Worker, alors que le
moteur commun est dans les fonctions Supabase. Deux options :
- porter une version légère du moteur dans le Worker (recommandé) ;
- faire appeler par le Worker une fonction Supabase, pas à pas.

### B — Alternative « Claude clé en main » (Claude Managed Agents)
Anthropic fournit la boucle d'agent **et** le bac à sable, pour **0,08 $ par
heure active**, plus les jetons [V]. Cloudflare publie même un modèle qui
branche ces agents sur ses bacs à sable (MIT, alpha) [V].
- **Pour** : c'est le plus rapide pour avoir un agent « extrêmement fort en
  code ».
- **Contre** : Claude seulement. En **bêta**. Les données de session sont
  gardées chez Anthropic et ne sont pas éligibles à la rétention zéro [V].
- **Usage conseillé** : une option « Travailler avec Claude » dans l'atelier,
  pas le socle.

### C — Alternative « zéro machine » (le plan du 23/09, amélioré)
- On exécute **dans le navigateur** : Sandpack pour les sites, Pyodide pour
  Python.
- On teste **dans GitHub Actions** ; on prévisualise **avec Cloudflare**.
- **Pour** : coût d'infrastructure presque nul, et rien ne tourne chez nous.
- **Contre** : pas de vrai terminal. Des tests lents (il faut attendre la CI).
  Lourd sur les petits téléphones. Et WebContainers (le moteur de Bolt)
  demande une licence commerciale [V].
- **Usage conseillé** : le **mode Découverte** gratuit pour les étudiants, et
  le repli si Beau ne veut pas de l'offre payante de Cloudflare.

| Critère | A. Cloudflare | B. Claude géré | C. Navigateur + Actions |
|---|---|---|---|
| Vrai terminal, installer, tester | Oui | Oui | Non (partiel) |
| Clés hors de portée de l'agent | Oui (relais) [V] | Oui (chez Anthropic) | Oui (rien à voler) |
| Choix du modèle | Tous | Claude seulement | Tous |
| Coût fixe | 5 $/mois [V] | 0 | 0 |
| Coût variable (machine) | Quelques centimes par heure (ci-dessous) | 0,08 $ par heure active [V] | ~0 (minutes Actions) |
| Maturité | Officiel depuis 04/2026, SDK en préversion 1.0 | Bêta | Stable |
| Délai pour une V0 | Quelques jours | Quelques jours | Quelques jours |

## 1.6 Le parcours, écran par écran

1. **Entrée « Atelier »** dans le rail de Léo. Trois boutons : *Nouveau
   projet*, *Ouvrir depuis GitHub*, *Projets guidés*. On choisit son niveau
   (« je découvre », « j'apprends », « je construis »). Le niveau change le
   ton des agents : en « j'apprends », ils **guident** et laissent des
   morceaux à écrire soi-même.
2. **Nouveau projet** : un nom, un point de départ (page web, appli React,
   script Python, petite API, projet vide), et le dossier est créé. L'agent
   **Architecte** est en mode *Réfléchir d'abord* : il propose un plan en 5
   lignes et une estimation de coût (« environ 0,30 $ avec le modèle
   économique »). Boutons : *Valider le plan*, *Changer*.
3. **L'espace de travail** :
   - à gauche, l'arbre des dossiers ;
   - au centre, l'éditeur ou l'aperçu ;
   - à droite, la conversation avec l'équipe (Architecte, Codeur, Rigo le
     relecteur, Mentor) ;
   - en haut, le **sélecteur de mode** (*Demander* ▾), le **compteur de coût
     de la session** et un gros bouton **Stop**.
   - Sur téléphone, ces zones deviennent trois onglets.
4. **Carte d'autorisation**, par exemple : « Le Codeur veut lancer
   `npm install` (réseau : registry.npmjs.org). » Boutons : *Autoriser une
   fois* / *Toujours pour cette commande dans ce projet* / *Refuser*.
5. **Les modifications**, écran « 3 fichiers modifiés » : vert et rouge, et
   une **explication en français simple** de chaque changement. Boutons :
   *Accepter*, *Refuser*, *Demander un autre changement*. Rigo peut signaler :
   « attention, ce changement désactive une vérification ».
6. **L'aperçu** : l'application tourne pour de vrai, dans une adresse privée
   et temporaire. Bouton « Montrer sur mon téléphone » (QR code).
7. **« Présente-moi comment ça marche »** : l'agent fait une **visite
   guidée**. Une carte des dossiers, le trajet d'un clic depuis l'écran
   jusqu'aux données, les 3 fichiers à connaître, et un petit quiz facultatif.
   C'est le « il présente comment ça marche » de Beau.
8. **Envoyer sur GitHub** : on choisit le dépôt (installé via l'application
   GitHub), la branche `leo/<tâche>` est proposée, le message est écrit par
   l'agent et modifiable. **Confirmer.** Puis, en option, *Ouvrir une demande
   de fusion*, avec un second **Confirmer**.
9. **Le journal** : chaque action avec l'heure, qui (agent ou humain), le
   mode, la commande, le résultat, le coût. On peut revenir à n'importe quel
   point (« rembobiner »).
10. **Les réglages de l'atelier** :
    - *Compétences et plugins* : catalogue vérifié, import d'un `SKILL.md` ou
      d'un dépôt, avec l'analyse affichée ;
    - *Mes clés* : Anthropic ou OpenAI, facultatives ;
    - *Réseau* : les domaines autorisés ;
    - *Plafonds* : par session, par jour, par mois ;
    - *Brancher Claude* : l'adresse MCP de Léo, en un bouton copier.
11. **Ma progression** (en mode « j'apprends ») : les notions vues, les
    `TODO(moi)` écrits soi-même, les projets terminés.

## 1.7 Qui paie quoi (le modèle économique)

**Ce qui coûte**, dans l'ordre :
1. **les modèles d'IA**, de loin le premier poste ;
2. le bac à sable (des centimes) ;
3. le socle Cloudflare (5 $ par mois).

**Le bac à sable, une heure** (calcul à partir des tarifs [V]) :

| Brique | Taille | Calcul | ≈ par heure |
|---|---|---|---|
| Cloudflare standard-1 | 1/2 vCPU, 4 Gio | mémoire 4×3 600×0,0000025 = 0,036 $ ; CPU si 20 % d'usage : 0,1×3 600×0,00002 = 0,007 $ ; disque 8 Go ≈ 0,002 $ | **≈ 0,045 $** (hors part incluse) |
| Cloudflare basic | 1/4 vCPU, 1 Gio | mémoire ≈ 0,009 $ + CPU ≈ 0,004 $ | **≈ 0,013 $** |
| E2B par défaut | 2 vCPU, 0,5 Gio | 2×3 600×0,000014 + 0,5×3 600×0,0000045 | **≈ 0,11 $** |
| Daytona | 1 vCPU, 2 Gio | 0,0504 + 2×0,0162 | **≈ 0,083 $** |
| Claude Managed Agents | — | 0,08 $ par heure active | **0,08 $** + jetons |

La part incluse de Cloudflare (25 Gio-heures de mémoire par mois) représente
environ 6 heures en standard-1, ou environ 25 heures en basic.

**Les modèles, une heure de travail d'agent.** C'est une **hypothèse, pas une
mesure** : environ 1,5 M de jetons lus, dont 80 % en cache, et 50 000 jetons
écrits. Je n'ai trouvé **aucune mesure publique fiable** de la consommation
d'un agent de code par heure, et elle varie énormément d'une tâche à l'autre.
On la **mesurera** dès la V0 (table `ai_usage`, déjà en place).

| Modèle | Calcul (300 k non-cache + 1,2 M cache + 50 k sortie) | ≈ par heure |
|---|---|---|
| DeepSeek flash (heure pleine) | 0,09 + 0,007 + 0,06 | **≈ 0,16 $** |
| DeepSeek v4-pro (heure pleine) | 0,40 + 0,05 + 0,20 | **≈ 0,65 $** |
| Claude Sonnet 5 | 0,60 + 0,24 + 0,50 (+ écriture du cache) | **≈ 1,3 $ et plus** |
| Claude Opus 5.5 | 1,20 + 0,24 + 1,00 (+ écriture du cache) | **≈ 2,4 $ et plus** |

Pour comparer, l'exemple officiel d'Anthropic : 1 heure de session avec
Opus 5, 50 000 jetons lus et 15 000 écrits, fait **0,705 $** tout compris [V].

**La conclusion économique** : le bac à sable pèse **moins de 10 %** du coût.
On économise donc surtout :
- en démarrant sur un **modèle économique**, et en ne passant au modèle fort
  que pour les étapes difficiles (le moteur commun fait déjà cette relève) ;
- en laissant chacun **apporter sa propre clé** : il ne paie alors que le bac
  à sable.

**Trois façons de faire payer** (le choix appartient à Beau ; je n'invente
pas les tarifs de Léo) :

| Formule | Pour qui | Comment |
|---|---|---|
| **Découverte** | Étudiants, curieux | Alternative C (navigateur) plus un petit quota quotidien sur le modèle économique, avec un plafond dur. Comme Jules (15 tâches par jour) [V] : lisible. |
| **Inclus + recharge** | Petits développeurs, entreprises Léo | Un quota d'heures d'atelier dans l'abonnement Léo, puis une recharge. Prix **affiché avant** chaque tâche. |
| **Ma clé** | Ceux qui ont déjà Claude ou OpenAI en API | Ils paient leurs jetons chez le fournisseur ; Léo facture le bac à sable, ou le compte dans l'abonnement. |

## 1.8 Les étapes livrables

### V0 — quelques jours (sur staging, pour Beau seulement)
- Un Worker `finjaro-atelier`, un bac à sable Cloudflare par projet, **aucune
  clé à l'intérieur**, réseau limité à npm, PyPI et GitHub en lecture.
- **Un seul mode : Demander.** Plus *Réfléchir d'abord*.
- Un écran Atelier simple : l'arbre, l'éditeur (CodeMirror), la conversation,
  les cartes d'autorisation, l'écran des modifications, le journal, le
  compteur de coût, Stop.
- « Présente-moi comment ça marche » sur un projet.
- **Pas d'envoi sur GitHub.** Seulement un **export en .zip**.
- Plafond dur par session. Mesure réelle du coût par heure.
- **Ce qu'il faut de Beau** : son oui, et l'offre payante Workers si elle
  n'est pas déjà active (5 $ par mois).

### V1 — 2 à 4 semaines
- **L'application GitHub** (dépôts choisis, jetons d'1 h), la branche
  `leo/<tâche>`, **Confirmer** pour envoyer, une règle de protection sur la
  branche principale.
- Les **quatre modes**, et le **garde** (second modèle) pour le mode
  Automatique.
- **Compétences** : import et export `SKILL.md`, avec analyse. **Catalogue
  vérifié** de plugins.
- **« Ma clé »** (Anthropic, OpenAI) via le relais de sortie. Outils
  « atelier » ajoutés au serveur MCP.
- **Projets guidés** et niveau « j'apprends » (morceaux à écrire soi-même).
- **Rigo** relit chaque lot de modifications avant qu'on le propose.
- Plafonds par jour et par mois, alerte à 80 %, bascule annoncée.

### V2 — ensuite
- **Plusieurs agents en parallèle** : un agent = une branche = un bac à sable,
  l'idée « Claude Squad » du plan du 23/09.
- Des **preuves** jointes à chaque livraison : captures, vidéo courte des
  tests.
- L'option **Claude géré** (alternative B), et Claude Code en suivi de
  branche.
- **Parler à l'atelier** avec Jarvis (partie 2).
- Pour les équipes : partage de projet, relecture humaine, classes pour les
  enseignants.

## 1.9 Les risques et comment on les tient

| Risque | Probabilité | Parade |
|---|---|---|
| Un agent fait sortir du code ou des secrets | Moyenne | Aucun secret dans le bac à sable ; réseau fermé par défaut ; sortie par Confirmer ; journal |
| Un plugin ou une compétence piégés | Moyenne (cas réels en 2026) | Catalogue vérifié ; Confirmer ; scripts seulement dans le bac à sable ; aucune clé |
| Les coûts de modèle dérapent | Élevée sans garde-fou | Estimation avant ; plafonds ; modèle économique par défaut ; « Ma clé » ; arrêt après 3 échecs identiques |
| Le SDK de Cloudflare change (préversion 1.0) | Moyenne | Enveloppe fine autour du SDK ; alternative E2B ou Daytona gardée prête |
| On casse Finjaro en livrant l'atelier | Faible | Worker **séparé** du site ; tables `atelier_*` **additives** ; fonctions nouvelles, et on prévient Beau que les fonctions edge sont communes à staging et à la production |
| Des étudiants « n'apprennent rien » | Réelle (étude de 2026) | Mode « j'apprends » : guider sans donner, `TODO(moi)`, quiz, visite guidée |
| Abus (minage, attaques) | Moyenne sur l'offre gratuite | Quota bas, compte vérifié, réseau filtré, durée plafonnée |
| Dépendance à un seul fournisseur de modèle | Moyenne | Le moteur commun change de moteur par un réglage |

## 1.10 Propositions en plus (ce que Beau n'a pas demandé)

1. **« Rembobiner »** : un point de retour après **chaque** action, et un
   curseur pour revenir en arrière (comme Aider et Cline).
2. **Le prix avant de lancer** : « cette tâche coûtera entre 0,10 et 0,40 $ »,
   puis le coût réel à la fin. C'est l'inverse de ce qu'on reproche à Replit.
3. **Deux cerveaux** : le Codeur écrit, Rigo relit **avec un autre modèle**.
   C'est ce que font les développeurs expérimentés.
4. **La visite guidée** : « Présente-moi comment ça marche », avec un schéma
   généré, le trajet d'un clic, et les 3 fichiers à connaître.
5. **« J'apprends »** : l'agent laisse des `TODO(moi)`, donne des indices
   plutôt que des réponses, et le tuteur ne livre jamais un exercice tout fait
   (façon CS50).
6. **Projets guidés** : « ta première page », « ton premier bot », « ta
   première API », avec des étapes vérifiées automatiquement par des tests.
7. **La preuve** : chaque livraison vient avec la sortie des tests et une
   capture de l'aperçu. Pas de « c'est fini » sans preuve (fiche 01 du
   vestiaire).
8. **Le carnet de bord du projet** : un fichier `LEO.md` (compatible
   `AGENTS.md` et `CLAUDE.md`) que l'agent tient à jour : décisions,
   commandes, pièges. Tout outil peut le relire.
9. **Le mode « nuit »** : on lance une tâche longue, on reçoit une
   notification le matin avec le diff à accepter ou refuser (la vision de
   Beau du 23/09).
10. **Le relecteur de sécurité** : une passe automatique à chaque lot. Secrets
    en clair, dépendances vulnérables, vérifications désactivées. C'est
    l'idée de Copilot, avec notre ton.
11. **Le traducteur d'erreurs** : chaque message d'erreur est expliqué en
    français simple, avec « ce que ça veut dire » et « ce qu'on essaie ».
12. **« Montre-moi sur mon téléphone »** : un QR code vers l'aperçu privé.
13. **Des modèles de départ maison** (site vitrine, boutique, tableau de bord,
    API), propres, testés, sous licence libre.
14. **Partager un projet en lecture** avec un enseignant ou un client, sans
    lui donner accès au code d'origine.
15. **Des classes** : un enseignant crée une classe, distribue un projet
    guidé et voit la progression, pas les réponses toutes faites.
16. **Parler à l'atelier** : « Léo, lance les tests », « explique ce
    fichier ». C'est le pont avec Jarvis.
17. **Des compétences maison** exportables au format `SKILL.md` : ce qu'on
    écrit pour Léo marche aussi dans Claude, Codex ou Copilot. C'est un
    argument pour les étudiants.
18. **Le budget du jour**, visible en permanence, avec la bascule annoncée
    vers le modèle économique au plafond (doctrine Jarvis).
19. **Le tableau des modèles** : l'atelier affiche quel modèle a fait quoi,
    et à quel coût, à partir de `legion-banc` et de l'usage réel. On choisit
    sur des faits.
20. **L'hygiène des secrets** : si l'utilisateur colle une clé dans son code,
    l'atelier le voit, masque la clé et propose de la ranger au coffre.
21. **Un bac à sable qui s'endort** : pas de coût quand on ne travaille pas,
    et un réveil en quelques secondes grâce aux instantanés [A].
22. **Exporter partout** : .zip, GitHub, ou « ouvrir dans Claude Code ». Pas
    d'enfermement : c'est un reproche fait à Replit [A].

---

# PARTIE 2 — Jarvis dans Léo : l'assistant vocal

## 2.1 Ce qui existe déjà, et ce qu'on reprend du dépôt Jarvis

**Déjà dans Léo** : l'écran **Appeler** (`src/screens/legion/parties/Appel.jsx`).
- On parle, l'enregistrement s'arrête après 1,5 s de silence, le vocal est
  **transcrit côté serveur** (Gemini, via `_shared/pieces.ts`), l'agent répond
  « comme au téléphone », et la réponse est **lue par la voix du téléphone**
  (synthèse du navigateur, gratuite).
- Tout reste écrit dans le salon.
- **Ce qui manque** : la réponse n'est pas en temps réel (on attend
  l'enregistrement, puis la transcription, puis le modèle, puis la voix). On
  ne peut pas couper la parole à l'agent. Il n'y a pas de réveil. Et l'agent
  **n'agit** pas encore dans Léo à la voix.

**Du dépôt Jarvis** (MIT, fiche `docs/vestiaire/07-jarvis-assistant-vocal.md`),
on reprend :
- les **niveaux N1 / N2 / N3** : lire, c'est libre ; une action réversible
  demande une confirmation ; une action qui sort ou ne se rattrape pas demande
  une confirmation **à chaque fois** ;
- la séparation **« celui qui pense / celui qui agit »** ;
- le **budget** avec alerte à 80 % et bascule annoncée ;
- la **présentation honnête** face à un tiers ;
- le **filtre de confidentialité** ;
- les règles de réponse : **pas de phrase de remplissage**, un accusé court
  seulement quand c'est lent.

On **ne reprend pas** la personnalité « majordome sarcastique » calquée sur
un personnage de fiction. Le ton est celui de Beau.

## 2.2 Réveiller Jarvis : les options

| Option | Où | Ce qui part sur Internet | Limites | Statut |
|---|---|---|---|---|
| **Bouton, geste, raccourci** (toucher, maintenir espace, double-tap sur le visage de l'agent) | Partout | Rien avant le geste | Il faut toucher | Existe presque (écran Appeler) |
| **« Mains libres » quand Léo est ouvert** : un détecteur local de voix (Silero VAD dans le navigateur, bibliothèque ISC, modèle MIT) [V] | Navigateur, applis | Rien tant qu'on ne parle pas. Puis la phrase seulement | Consomme un peu de batterie. Écran Léo ouvert seulement | Faisable |
| **Web Speech API** (reconnaissance du navigateur) | Chrome surtout | Sur Chrome, l'audio est **envoyé à un serveur** [V]. Disponibilité « limitée », pas standard partout [V] | **Absente des WebView Android** (donc de nos applis) [A]. Mauvaise idée pour un micro toujours ouvert | À éviter comme réveil |
| **Picovoice Porcupine** (mot de réveil local) | Navigateur, iOS, Android | Rien : tout est local | SDK Apache-2.0 [V], mais il faut une **clé d'accès Picovoice**. Plan gratuit = **projets personnels non commerciaux** [A]. Plan « Foundation » annoncé à **6 000 $** [A]. La page des prix renvoyait vers « contact » le 24/09 | Payant pour Finjaro |
| **openWakeWord** | Serveur Python ; pas de version navigateur native [V] | Selon l'installation | Code Apache-2.0, mais **modèles pré-entraînés CC BY-NC-SA** (usage commercial interdit) [V]. On peut entraîner **notre propre** mot (« Hé Léo ») avec leur code. Dernière version : 02/2024 [V] | Possible avec de l'ingénierie |
| **Siri : « Dis Siri, parle à Léo… »** (App Shortcuts) | iPhone | Géré par Apple | La phrase doit contenir **le nom de l'appli** ou un synonyme déclaré [A] ; disponible sans réglage par l'utilisateur [A]. Demande un petit ajout natif dans l'appli iOS | Recommandé sur iPhone |
| **Écoute permanente en arrière-plan** | iPhone, Android | — | iOS **ne permet pas** à une appli d'écouter le micro en arrière-plan de cette façon [A]. Android exige un service visible et limite son démarrage en arrière-plan [A]. Voyant orange ou vert du micro | **Non recommandé** |

**Note sur le nom.** « Jarvis » est le nom d'un personnage de fiction d'un
grand studio. Avant d'en faire un **nom public** ou un **mot de réveil**, il
faut le faire vérifier. Je propose que le mot de réveil soit **« Hé Léo »**,
ou le nom de l'agent, et que « Jarvis » reste un nom de projet interne.

## 2.3 La voix naturelle en temps réel : les options

| Service | Prix publié | ≈ par minute | Confidentialité | Remarques |
|---|---|---|---|---|
| **Actuel** (vocal enregistré → transcription Gemini → moteur → voix du téléphone) | Coût du modèle | Quelques dixièmes de centime (non mesuré) | Audio envoyé à Google pour la transcription | Pas de temps réel ; voix robotique selon le téléphone |
| **Gemini Live** (`gemini-3.8-live`, `gemini-3.1-flash-live-preview`) | Audio : 3 $ par M en entrée, 12 $ par M en sortie ; **0,005 $/min entendue, 0,018 $/min parlée** [V] | **≈ 0,02 $** pour le son, plus le texte du contexte | En offre **payante**, Google n'utilise pas les échanges pour améliorer ses produits. En **gratuit**, il peut les utiliser et les faire relire par des humains, sauf pour les utilisateurs de l'EEE, du Royaume-Uni et de Suisse [V] | Jetons **éphémères** : le navigateur se connecte directement, sans exposer notre clé [A]. Léo a déjà une clé Google |
| **OpenAI Realtime** (`gpt-realtime-2.1` / `-mini`) | Audio : 32 $ / 64 $ par M ; mini : 10 $ / 20 $ par M [V] | **Mesuré par un tiers sur 4 000 sessions** avec mini : **≈ 0,066 $/min** [A]. La version complète est environ 3 fois plus chère [A]. Deux sources secondaires se contredisent sur la conversion minutes → jetons : prudence | Selon les conditions d'OpenAI (non détaillées ici) | WebRTC dans le navigateur, avec **clé éphémère** (`/v1/realtime/client_secrets`) [A]. Très mûr |
| **ElevenLabs Agents** | **0,08 $/min** d'appel, plus le modèle de langage facturé à part. Gratuit 15 min, Starter 6 $ (75 min), Creator 22 $ (275 min), Pro 99 $ (1 238 min) [V] | **≈ 0,08 $ + modèle** | Selon ElevenLabs | Les plus belles voix, téléphonie intégrée (on branche son opérateur) [V]. Moins de contrôle fin |
| **Deepgram Voice Agent** | Standard **0,075 $/min** ; avec sa propre voix de synthèse 0,065 $/min [V] ; 200 $ de crédit d'essai [V] | **≈ 0,075 $** | Selon Deepgram | Bonne transcription (Flux, Nova-3) [V] |
| **Chaîne « maison »** (Pipecat BSD-2 ou LiveKit Agents Apache-2.0 [V] : transcription + moteur Léo + synthèse) | Somme des briques | Variable | Au choix | Un développeur annonce **~400 ms** de délai de bout en bout, en insistant : « c'est un problème de tours de parole, pas de transcription » (HN, 570 points) [V]. Demande un serveur, donc sort de notre cadre « Supabase + Cloudflare » |

**Ce que disent les utilisateurs** :
- ce qui compte, c'est le **délai** (moins d'une seconde), la possibilité de
  **couper la parole** (« barge-in ») et la **détection de fin de phrase**
  (pas seulement le silence) ;
- le bruit de fond reste difficile ;
- et les estimations de coût publiées varient de 0,02 à 0,40 $ la minute pour
  le même service : il faut **mesurer chez soi** [A].

Le délai officiel de Gemini Live : **non trouvé**.

## 2.4 Le micro toujours ouvert ? Notre règle de confidentialité

- **Jamais de micro ouvert vers Internet en attente.** Le réveil est un
  **geste**, Siri, ou un détecteur **local** (VAD, puis plus tard le mot de
  réveil local). L'audio ne part qu'**après** le réveil.
- Un **voyant** visible et un son quand Jarvis écoute. Il s'éteint seul après
  10 secondes de silence.
- **Premier usage** : une carte claire. Ce qui est écouté, quand, où part
  l'audio (le fournisseur choisi), combien de temps on le garde (chez nous :
  seulement la transcription dans le salon, comme aujourd'hui).
- **L'offre payante** de Gemini, pour que les voix des clients ne servent pas
  à entraîner les modèles [V].
- Le **filtre de confidentialité** (adresses, numéros, clés) est appliqué aux
  résumés.

## 2.5 L'architecture recommandée et les alternatives

### Recommandée : Gemini Live pour la voix, Léo pour les actes

```
 Léo (navigateur ou appli)
   réveil : bouton, geste, « mains libres » (VAD local), Siri (iPhone)
   │ 1. demande un jeton éphémère ──► fonction Supabase « legion-voix »
   │                                    (vérifie le membre, le budget, et crée le jeton)
   │ 2. voix en direct ◄──────────────► Gemini Live (WebSocket, jeton éphémère)
   │ 3. Gemini veut agir : un « outil »
   ▼
 fonction « legion-voix-outils » (avec le jeton de l'UTILISATEUR)
   N1 : lire les tâches, salons, agents, feuille de route → exécuté, réponse dite
   N2 : créer une tâche, écrire dans un salon → carte à l'écran + « je le fais ? »
   N3 : envoyer à un tiers, payer, publier → carte Confirmer à TOUCHER, jamais par la voix seule
   Travail long : « je lance Plume dessus, je te préviens » → tâche normale des agents
 Tout est écrit dans le salon (transcription + actions), comme l'écran Appeler aujourd'hui.
```

**Pourquoi** :
- c'est le moins cher au prix officiel (≈ 0,02 $ la minute pour le son [V]) ;
- Léo a déjà Google ;
- les jetons éphémères évitent de mettre notre clé dans le téléphone ;
- les actions passent par **les mêmes droits** que l'utilisateur, comme le
  serveur MCP le fait déjà.

**Limite honnête** : pendant l'appel, c'est Gemini qui raisonne, pas DeepSeek
ou Kimi. Jarvis sert donc à **parler et déclencher**. Les tâches de fond
restent confiées aux agents par le moteur commun.

- **Alternative B, OpenAI Realtime** : plus mûr, excellent en WebRTC, mais
  plusieurs fois plus cher (mesuré par un tiers [A]).
- **Alternative C, ElevenLabs Agents** : les plus belles voix et un **vrai
  numéro de téléphone** possible (« le client appelle, Jarvis décroche »),
  pour 0,08 $/min plus le modèle [V]. À garder pour V2, si Beau veut un
  standard téléphonique.
- **Repli permanent** : le pipeline actuel, quand le budget est atteint ou
  que le service ne répond pas. C'est la bascule annoncée de la doctrine
  Jarvis.

## 2.6 Le parcours

1. **Première fois** : carte « Parler à Léo ». Ce qu'on écoute, quand, où va
   l'audio. On choisit le réveil : *Bouton* (par défaut) ou *Mains libres
   quand Léo est ouvert*. Sur iPhone : « Vous pouvez aussi dire : Dis Siri,
   parle à Léo… ».
2. **Réveil** : bouton micro flottant, maintenir espace, double-tap sur le
   visage de l'agent, Siri, ou plus tard « Hé Léo ».
3. **Jarvis s'allume** : le visage de l'agent s'anime (le composant `Visage`
   existe), un petit son, « Je t'écoute ».
4. **La conversation** : sous-titres en direct. On peut couper la parole.
   Les actions apparaissent en cartes. N1 : c'est fait et il le dit. N2 : « Je
   crée la tâche ? » (oui à la voix ou au toucher). N3 : **carte Confirmer à
   toucher**.
5. **Fin** : « merci, c'est tout », ou 10 s de silence. Jarvis s'éteint et
   dépose un **résumé** dans le salon.
6. **Plus tard** : l'historique des appels, et « où j'en suis ? » (suivi
   façon Jarvis).

## 2.7 Coûts

| Scénario | Calcul | ≈ coût |
|---|---|---|
| Un appel de 5 min avec Gemini Live (2,5 min écoutées, 2,5 min parlées) | 2,5×0,005 + 2,5×0,018 [V], plus le texte du contexte (non chiffré) | **≈ 0,06 $ et plus** |
| Le même avec OpenAI Realtime mini | ≈ 0,066 $/min mesuré par un tiers [A] | **≈ 0,33 $** |
| Le même avec ElevenLabs Agents | 5 × 0,08 $ + modèle [V] | **≈ 0,40 $ + modèle** |
| 100 minutes d'essais (V1) avec Gemini Live | 100 × ~0,023 $ | **≈ 2 à 3 $ + texte** |
| Mot de réveil Porcupine (usage commercial) | Plan Foundation annoncé [A] | **6 000 $** : à éviter au départ |
| Mot de réveil maison (openWakeWord, entraîné nous-mêmes) | Temps d'ingénierie ; entraînement annoncé « en moins d'une heure » sur Colab [V] | ≈ 0 $ en licence |

## 2.8 Les étapes

**V0 — quelques jours**
- L'écran Appeler devient « Parler à Léo » : **bouton et geste**, coupure de
  parole côté navigateur (on arrête la voix dès qu'on parle), **« mains
  libres » avec détecteur local** quand Léo est ouvert.
- **Les premiers outils N1 à la voix** : « qu'est-ce qui est en retard ? »,
  « résume le salon Ventes ».
- Carte de confidentialité. **Coût : 0 $ de plus** (pipeline actuel).

**V1 — 2 à 3 semaines**
- **Gemini Live** avec jetons éphémères (offre payante), sous-titres en
  direct.
- **Outils N1, N2 et N3** avec les cartes Confirmer.
- Budget voix par jour et par mois, alerte à 80 %, bascule vers le pipeline
  actuel.
- **Siri App Shortcut** sur iPhone. Un raccourci ou un widget sur Android.

**V2 — ensuite**
- **Mot de réveil local « Hé Léo »** (modèle maison, testé sur de vraies voix
  et de vrais accents avant toute sortie).
- **Numéro de téléphone** : les clients appellent l'entreprise, Jarvis
  décroche **en se présentant comme assistant automatisé**, et ne confirme que
  ce qui a été validé avant.
- Réunions à la voix. Et « parler à l'atelier » (partie 1).

## 2.9 Les risques

| Risque | Parade |
|---|---|
| Micro perçu comme espion | Pas d'écoute sans geste ou détecteur local ; voyant ; carte claire ; l'audio n'est pas gardé |
| Une action lourde déclenchée par erreur à la voix (ou par la télé en fond) | N3 = **toucher Confirmer**, jamais la voix seule |
| Coût à la minute qui dérape | Budget voix, bascule vers le pipeline actuel, fin automatique après silence |
| Mauvaise compréhension (bruit, accents, langues) | Sous-titres visibles, « tu voulais dire… ? » avant toute action N2 ou N3 ; tests sur de vraies voix |
| Dépendance à Google pour la voix | La couche voix est isolée : OpenAI ou ElevenLabs en remplacement |
| Refus sur l'App Store (écoute en arrière-plan) | On ne le demande pas : Siri App Shortcut et écoute seulement au premier plan |
| Nom « Jarvis » | Nom interne ; mot de réveil « Hé Léo » ; vérification avant tout usage public |

## 2.10 Propositions en plus

1. **Le mot de réveil = le nom de l'agent** : « Hé Plume », « Hé Orchestre ».
   On réveille directement le bon agent.
2. **« Où j'en suis ? »** : un point de 30 secondes, à la voix, chaque matin.
   Tâches en retard, questions en attente, dépenses.
3. **La voix de chaque agent** : une voix différente par agent, pour savoir
   qui parle en réunion (l'écoute à plusieurs voix existe déjà).
4. **Mode voiture ou marche** : réponses plus courtes, pas d'écran
   nécessaire, confirmations N2 à la voix, N3 reportées à plus tard.
5. **Dicter une tâche** : « note : rappeler le fournisseur jeudi » crée une
   tâche N2 avec confirmation.
6. **Interrompre poliment** : si Jarvis parle et qu'on dit « stop », il
   s'arrête net. C'est le point n°1 des utilisateurs.
7. **Résumé écrit après chaque appel** dans le salon, avec les décisions et
   les actions. Rien ne se perd.
8. **Multilingue** : Jarvis répond dans la langue de la personne. Utile pour
   une place de marché mondiale.
9. **Appeler en réunion** : « Hé Léo, ouvre une réunion avec Plume et
   Traque sur le lancement » lance un format de réunion existant.
10. **Mode « question urgente »** : quand un agent bloqué pose une question,
    le téléphone sonne (existe déjà) et on peut répondre **à la voix**.
11. **Le filtre de confidentialité à l'oral** : Jarvis ne lit jamais à voix
    haute un numéro de carte, une clé ou une adresse complète.
12. **Un bouton « Ce n'était pas pour toi »** : il efface le dernier extrait
    si le réveil s'est trompé.
13. **Le compteur visible** : minutes et coût de voix du jour, à côté du
    budget IA.
14. **Coder à la voix** (avec l'atelier) : « lance les tests », « explique
    cette erreur », « annule la dernière modification ».

---

# 3. Les 5 décisions que Beau doit prendre

| # | Décision | Ma recommandation |
|---|---|---|
| 1 | **Où tourne le code de l'atelier ?** | **Cloudflare Sandbox** (A). On garde le navigateur (C) pour le mode Découverte gratuit, et Claude géré (B) en option plus tard. |
| 2 | **GitHub : application GitHub ou jeton collé ?** | **Application GitHub** (jetons d'1 h, dépôts choisis, branche `leo/…`, Confirmer pour envoyer, branche principale protégée). Le jeton à grain fin seulement pour un premier essai sur le dépôt de Finjaro. |
| 3 | **Le mode par défaut, et qu'est-ce qui reste toujours à Confirmer ?** | Par défaut : **Demander**. Toujours Confirmer : envoyer sur GitHub, ouvrir ou fusionner, publier, élargir le réseau, utiliser une clé, activer un plugin avec scripts, dépasser un plafond. Le mode Automatique ne vaut **qu'à l'intérieur** du bac à sable. |
| 4 | **Qui paie l'IA ?** | Modèle économique par défaut, plafonds partout, **« Ma clé »** pour Claude et OpenAI (pas de connexion « compte Claude.ai », c'est interdit par Anthropic), et un petit quota Découverte plafonné. Les tarifs de Léo restent à fixer par Beau. |
| 5 | **Quelle voix pour Jarvis, et comment on le réveille ?** | **Gemini Live, offre payante**, avec repli sur l'appel actuel. Réveil : **bouton et geste** d'abord, « mains libres » local quand Léo est ouvert, **Siri** sur iPhone. Mot de réveil « **Hé Léo** » maison en V2. **Pas** d'écoute permanente en arrière-plan. **Pas** de Porcupine payant au départ. |

# 4. Le coût de départ estimé

| Poste | Montant | Statut |
|---|---|---|
| Offre payante Cloudflare Workers (nécessaire aux bacs à sable) | **5 $ par mois**, si elle n'est pas déjà active (à vérifier dans le tableau de bord) | [V] |
| Bacs à sable pendant la V0 | Probablement **dans la part incluse** (≈ 6 h de standard-1 ou ≈ 25 h de basic par mois) | calcul sur [V] |
| Modèles pour les essais de l'atelier | **Plafond fixé par Beau** : je propose **30 $** pour le premier mois (≈ 45 h avec DeepSeek flash, ≈ 20 h avec Claude Sonnet 5, d'après l'hypothèse de la section 1.7) | hypothèse |
| Voix, V0 | **0 $ de plus** (pipeline actuel) | — |
| Voix, V1 (essais Gemini Live) | **≈ 2 à 5 $** pour une centaine de minutes | calcul sur [V] |
| Application GitHub | **0 $** | [A] |
| Mot de réveil commercial (Porcupine) | **0 $** (non retenu au départ ; 6 000 $ annoncé sinon) | [A] |
| **Total du premier mois** | **≈ 5 $ de socle + ≈ 35 $ d'essais plafonnés, soit moins de 50 $** | estimation |

**Ce qu'il faut aussi de Beau** : son oui ; activer l'offre payante Workers ;
créer l'application GitHub (je prépare la liste exacte des droits) ; et
facultativement une clé Anthropic pour l'option Claude.

**À lui dire avant**, selon la règle du CLAUDE.md §8 : l'atelier ajoute
- des **tables nouvelles** (migration additive) ;
- de **nouvelles fonctions edge**, communes à staging et à la production ;
- un **Worker séparé**.

Il ne touche **ni** au Site URL de Supabase, **ni** à `auth.users`, **ni**
aux redirections. La connexion à GitHub passe par GitHub, pas par Supabase.
Finjaro Accounting n'est pas concerné, sauf par le fait que les fonctions
edge sont déployées sur le projet commun.

---

# Annexe technique

## A. L'atelier

**Composants**
- `workers/atelier/` : un Worker séparé (`wrangler.atelier.toml`), qui exporte
  une classe `Sandbox` (Durable Object) du paquet `@cloudflare/sandbox` (au
  moins en 0.8.9, pour les handlers de sortie [V]). Il est déployé à part du
  site : aucun risque pour `finjaro.net`.
- **L'authentification** : le Worker vérifie le jeton d'accès Supabase de
  l'utilisateur (JWT, clés publiques du projet), puis son appartenance à
  l'entreprise, par une fonction RPC en lecture.
- **La boucle d'agent** : dans le Worker (Durable Object par session), avec un
  « moteur léger » qui parle aux mêmes fournisseurs que `_shared/moteur.ts`
  (DeepSeek, Kimi, Gemini, Anthropic) avec le même format d'outils.
- **Les outils de l'agent** : `lire_fichier`, `ecrire_fichier`,
  `lister`, `chercher`, `commande`, `tests`, `apercu`, `proposer_envoi_github`.
  Chacun passe par la **politique du mode** avant de s'exécuter.
- **Le relais de sortie** (outbound handler) :
  - `allowedHosts` par défaut : `registry.npmjs.org`, `pypi.org`,
    `files.pythonhosted.org`, `github.com` et `codeload.github.com` en lecture ;
  - les appels aux modèles **ne partent pas du bac à sable**, ils partent du
    Worker ;
  - si « Ma clé » doit servir **dans** le bac à sable (par exemple pour faire
    tourner Claude Code dedans, option B'), l'en-tête est **remplacé à la
    sortie** : le bac à sable ne voit qu'une valeur factice [V].
- **Les points de retour** : un `git commit` automatique après chaque
  écriture (branche locale `leo/session-<id>`), et « rembobiner » =
  `git reset` vers ce point, **dans le bac à sable seulement**.
- **L'envoi sur GitHub** : `proposer_envoi_github` crée une **demande
  d'action** (`statut: a_confirmer`, même modèle que `legion-action`). Au
  clic Confirmer, le Worker obtient un jeton d'installation d'**1 h**, limité
  à **ce dépôt** et à `contents:write` [V], puis envoie la branche.
  Une règle de protection GitHub interdit la branche principale à l'app.

**Tables (migration additive, rien de supprimé ni renommé)**
- `atelier_projets` (id, entreprise_id, proprietaire, nom, depot_github,
  modele_depart, niveau, cree_le)
- `atelier_sessions` (id, projet_id, mode, sandbox_id, debut, fin,
  cout_modele, cout_machine, plafond)
- `atelier_journal` (id, session_id, quand, acteur, outil, entree_resumee,
  resultat_resume, decision, mode, cout) : **ajout seulement**, jamais de
  modification
- `atelier_autorisations` (id, projet_id, portee, regle, accordee_par,
  revoquee_le)
- `atelier_competences` (id, entreprise_id, nom, source, contenu_skill_md,
  a_des_scripts, analyse, active, confirmee_par)
- RLS sur toutes les tables : membre de l'entreprise. Aucun compte de test
  compté dans les chiffres montrés (`compte_reel()`).

**Liste toujours refusée** (en plus du réseau filtré) :
- `curl … | sh` et ses variantes ;
- écriture hors du dossier du projet ;
- `git push` depuis le bac à sable (seul le Worker envoie, après Confirmer) ;
- `git remote add` / `set-url` ;
- lecture de `/proc/*/environ` ;
- ouverture de tunnels.

C'est inspiré de la liste par défaut du mode Auto de Claude Code [V].

**Le garde du mode Automatique** : un appel au modèle économique avant chaque
commande, avec la commande, le but de la tâche et les frontières posées par
l'utilisateur (« ne pousse pas »). Réponse : autoriser, bloquer ou demander.
Après 3 blocages de suite, ou 20 dans la session, retour en mode Demander.
Ce sont les seuils publiés par Claude Code [V].

**Plafonds** : estimation avant la tâche (taille du projet, modèle, nombre
d'étapes prévues) ; compteur en direct ; alerte à 80 % ; au plafond, le
modèle économique prend la suite ou la tâche s'arrête, **toujours annoncé**.
Arrêt après 3 échecs identiques. Mise en veille du bac à sable après
inactivité (réglage du SDK).

**Compétences** : import d'un `SKILL.md` (en-tête YAML + texte), analyse
automatique (motifs d'injection, liens, scripts), puis Confirmer si des
scripts sont présents. Chargement progressif, comme le standard : le nom et
la description d'abord, le reste à la demande [A]. Export vers
`.claude/skills/<nom>/SKILL.md`.

**MCP** : ajouter à `legion-mcp` les outils `atelier_projets`,
`atelier_lire`, `atelier_proposer` (qui crée une demande, jamais une
écriture directe) et `atelier_tests`.

## B. Jarvis

- **`legion-voix`** (fonction edge) : elle vérifie le membre et le budget
  voix, puis crée un **jeton éphémère Gemini Live** (par défaut : 1 min pour
  ouvrir, 30 min de validité [A]) avec la consigne système (ton de Beau,
  règles de réponse Jarvis, présentation honnête) et la liste des outils.
- **Le navigateur** ouvre le WebSocket Live avec ce jeton. Il envoie le micro
  seulement après le réveil et joue la voix. **Coupure de parole** : dès que
  le détecteur local entend l'utilisateur, on coupe la lecture.
- **`legion-voix-outils`** (fonction edge, appelée avec le jeton de
  l'utilisateur) : outils N1 (lecture, comme `legion-mcp`), N2 (création
  bornée, avec confirmation parlée ou touchée) et N3 (crée une demande
  `a_confirmer`, et **seul un toucher** la valide). Chaque appel est écrit
  dans le salon.
- **Le détecteur local** : `@ricky0123/vad-web` (ISC) avec le modèle Silero
  (MIT) [V], via ONNX Runtime Web, et seulement quand l'option « mains
  libres » est active et Léo au premier plan.
- **Le mot de réveil (V2)** : un modèle entraîné par nous avec le code
  openWakeWord (Apache-2.0), **sans** leurs modèles pré-entraînés (licence non
  commerciale [V]). Il faut vérifier la licence des modèles d'extraction de
  caractéristiques qu'il utilise avant de s'en servir : **non vérifié**. Il
  sera exécuté dans le navigateur (ONNX Runtime Web) ou en natif dans les
  applis.
- **iPhone** : un `AppShortcutsProvider` (App Intents) qui ouvre l'écran
  « Parler à Léo ». La phrase contient le nom de l'appli [A].
- **Android** : un raccourci d'appli et une tuile. Pas de service micro
  permanent.
- **Budget** : minutes de voix comptées dans `ai_usage` (fonction
  « legion_voix »), avec plafond, alerte à 80 % et bascule vers
  `Appel.jsx` (pipeline actuel).

---

# 5. Sources (toutes lues le 24/09/2026)

**Atelier : produits et prix**
- Claude Code, modes de permission [V] : https://code.claude.com/docs/en/permission-modes
- Claude Code sur le web, sécurité et isolement [V] : https://code.claude.com/docs/en/claude-code-on-the-web
- Codex, accès Internet de l'agent [V] : https://learn.chatgpt.com/docs/cloud/internet-access
- Codex, prix (inclus dans ChatGPT) [V] : https://learn.chatgpt.com/docs/pricing
- Codex, environnements, secrets, cache (article d'un tiers) [A] : https://codex.danielvaughan.com/2026/05/31/codex-cloud-environments-setup-scripts-caching-secrets-codex-universal/
- Copilot, pare-feu de l'agent [A] : https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall
- Copilot, passage à la facturation à l'usage (27/04/2026) [V] : https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/
- Cursor, agents en nuage [A] : https://www.morphllm.com/cursor-background-agents ; https://cursor.com/docs/cloud-agent
- Replit, prix [V] : https://replit.com/pricing ; tarif à l'effort [A] : https://blog.replit.com/effort-based-pricing
- Replit, base supprimée (HN, 22/07/2025) [V] : https://news.ycombinator.com/item?id=44646151
- Bolt, prix [V] : https://bolt.new/pricing ; « 10 M de jetons partis » (HN) [V] : https://news.ycombinator.com/item?id=46321594
- Lovable, prix (partiel) [V] : https://lovable.dev/pricing ; polémique (HN, 23/04/2026) [V] : https://news.ycombinator.com/item?id=47875727
- v0, prix [V] : https://v0.app/pricing
- Devin, prix [V] : https://devin.ai/pricing ; critiques 2025 (HN) [V] : https://news.ycombinator.com/item?id=42826022
- Jules, limites [V] : https://jules.google/docs/usage-limits ; prix [A] : https://hackup.ai/ai-plans/jules/
- OpenHands [A] : https://www.openhands.dev/pricing ; licence MIT [V] : https://github.com/OpenHands/OpenHands
- Aider, git [A] : https://aider.chat/docs/git.html
- Cline, auto-approbation [A] : https://docs.cline.bot/features/auto-approve
- Avis utilisateurs Codex / Claude Code (1 828 messages et avis) [A] : https://dev.to/tonywangca/codex-vs-claude-code-what-1828-posts-and-reviews-say-that-user-counts-cannot-1c80
- Comparatif des générateurs d'applis [A] : https://appelixir.com/articles/ai-app-builder-comparison-lovable-bolt-v0-replit/
- Essai de Replit Agent 3 (LinkedIn, 12/09/2025) [A] : https://www.linkedin.com/posts/vlad-ds_ive-spent-basically-zero-time-on-vibe-coding-activity-7372158843784704000-p1gE

**Atelier : briques**
- Cloudflare Sandbox SDK [V] : https://developers.cloudflare.com/sandbox/
- Cloudflare Containers, prix [V] : https://developers.cloudflare.com/containers/pricing/
- Cloudflare Containers, limites [V] : https://developers.cloudflare.com/containers/platform/limits/
- Cloudflare, injection des clés et filtrage réseau (13/04/2026) [V] : https://developers.cloudflare.com/changelog/post/2026-04-13-sandbox-outbound-workers-tls-auth/
- Cloudflare Sandboxes officiels (InfoQ, 22/04/2026) [A] : https://www.infoq.com/news/2026/04/cloudflare-sandboxes-ga/
- Cloudflare, Claude Code dans un bac à sable [V] : https://developers.cloudflare.com/sandbox/tutorials/claude-code/
- Cloudflare × Claude Managed Agents (MIT, alpha) [V] : https://github.com/cloudflare/claude-managed-agents
- E2B, prix [V] : https://e2b.dev/pricing
- Daytona, prix [V] : https://www.daytona.io/pricing
- Vercel Sandbox, prix [V] : https://vercel.com/docs/vercel-sandbox/pricing
- WebContainers, licence commerciale [V] : https://webcontainers.io/enterprise
- Supabase, limites des fonctions [V] : https://supabase.com/docs/guides/functions/limits
- Monaco, pas de support mobile (FAQ du README) [V] : https://github.com/microsoft/monaco-editor
- Replit passe à CodeMirror [A] : https://blog.replit.com/codemirror
- GitHub App, jeton d'installation d'1 h [V] : https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
- GitHub App ou jeton pour les agents [A] : https://zylos.ai/research/2026-09-02-github-apps-machine-identity-ai-agent-git-workflows/
- Agent SDK : pas de connexion « compte Claude.ai » pour un tiers [V] : https://code.claude.com/docs/en/agent-sdk/overview
- Crédit Agent SDK mis en pause (15/06/2026) [V] : https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
- Anthropic, prix et Managed Agents [V] : https://platform.claude.com/docs/en/about-claude/pricing
- Claude Managed Agents (bêta) [V] : https://platform.claude.com/docs/en/managed-agents/overview
- DeepSeek, prix [V] : https://api-docs.deepseek.com/quick_start/pricing
- Kimi K2.6, prix [A] : https://openrouter.ai/moonshotai/kimi-k2.6
- Plugins Claude Code [V] : https://code.claude.com/docs/en/plugins
- Standard Agent Skills [A] : https://inference.sh/blog/skills/agent-skills-overview
- SWE-bench Pro, classements contradictoires (10/08/2026) [A] : https://www.morphllm.com/swe-bench-pro

**Atelier : sécurité et apprentissage**
- ClawHavoc, compétences malveillantes [A] : https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting
- Snyk, ToxicSkills [A] : https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/
- s1ngularity (Nx, 26/08/2025) [A] : https://thehackernews.com/2025/08/malicious-nx-packages-in-s1ngularity.html
- Invariant Labs, faille GitHub MCP [A] : https://invariantlabs.ai/blog/mcp-github-vulnerability
- « Fast and Forgettable » (étude contrôlée, 2026) [V, résumé] : https://arxiv.org/abs/2604.18538
- CS50, tuteur qui guide sans donner [A] : https://cs50.readthedocs.io/cs50.ai/
- Claude Code, styles Explicatif et Apprentissage [A] : https://code.claude.com/docs/en/output-styles

**Jarvis**
- Fiche interne du dépôt Jarvis (MIT) : `docs/vestiaire/07-jarvis-assistant-vocal.md`
- openWakeWord (licences, navigateur) [V] : https://github.com/dscripka/openWakeWord
- Picovoice, prix (page renvoyée vers « contact » le 24/09) [A] : https://picovoice.ai/pricing/
- Porcupine, licence du SDK Apache-2.0 [V] : https://github.com/Picovoice/porcupine
- MDN, SpeechRecognition [V] : https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- WebView Android sans reconnaissance vocale [A] : https://ourcodeworld.com/articles/read/401/how-to-use-the-speech-recognition-api-in-cordova
- OpenAI, prix des modèles temps réel [V] : https://developers.openai.com/api/docs/pricing
- OpenAI Realtime, conversion minutes → jetons [A] : https://www.forasoft.com/blog/article/openai-realtime-api-pricing
- OpenAI Realtime, 4 000 sessions mesurées (11/06/2026) [A] : https://hackernoon.com/openai-realtime-api-pricing-in-2026-real-world-data-from-4000-measured-sessions
- OpenAI, WebRTC et clés éphémères [A] : https://developers.openai.com/api/docs/guides/voice-webrtc
- Gemini, prix (Live) [V] : https://ai.google.dev/gemini-api/docs/pricing
- Gemini Live, jetons éphémères [A] : https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Gemini API, conditions (usage des données gratuit ou payant) [V] : https://ai.google.dev/gemini-api/terms
- ElevenLabs Agents, prix [V] : https://elevenlabs.io/pricing/agents
- Deepgram, prix [V] : https://deepgram.com/pricing
- Détecteur de voix dans le navigateur (ISC) [V] : https://github.com/ricky0123/vad ; Silero VAD (MIT) [V] : https://github.com/snakers4/silero-vad
- Pipecat (BSD-2) [V] : https://github.com/pipecat-ai/pipecat ; LiveKit Agents (Apache-2.0) [V] : https://github.com/livekit/agents
- Agent vocal à ~400 ms (HN, 02/03/2026) [V] : https://news.ycombinator.com/item?id=47224295
- ElevenLabs Conversational AI 2.0 (HN) [V] : https://news.ycombinator.com/item?id=44152926
- iOS App Shortcuts et Siri [A] : https://developer.apple.com/videos/play/wwdc2023/10102/
- Android, service micro au premier plan [A] : https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start

**Accès impossibles, à signaler** : l'API de recherche de Reddit a refusé
les requêtes de cette session (« Too Many Requests », puis 403), et le moteur
de recherche web n'accepte pas reddit.com. Les avis Reddit cités viennent
donc de **synthèses publiées** (dev.to, comparatifs) et sont marqués [A].
Hacker News a été lu directement par son API publique. Je n'ai pas visionné
de vidéos. Les pages de prix de Picovoice et de Lovable n'ont été lues que
partiellement.
