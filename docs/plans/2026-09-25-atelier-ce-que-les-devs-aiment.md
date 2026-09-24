# L'atelier de Léo : ce que les développeurs aiment vraiment, et ce qu'on en fait

_Recherche faite le 24/09/2026, à la demande de Beau : « Tu sais comment les
développeurs fonctionnent, ce qu'ils veulent, comment ils travaillent avec
Claude. Moi je ne connais pas. Recherche sur Internet, sur GitHub, partout.
Fais un truc que les développeurs vont vraiment aimer […] avec des
propositions, même des trucs qui n'existent pas encore ailleurs. Et je ne sais
pas comment on le connecte au bureau du développeur. » Objectif fixé par
Beau : « ce qu'un développeur fait en 5 jours avec VS Code et Claude, avec
nous il doit le faire en une heure avec les agents »._

_Ce document part de la recherche du 24/09
(`docs/plans/2026-09-24-atelier-de-code-et-jarvis.md`, partie 1 : comparatif
des produits, sécurité, modes de permission), de ce qui existe
(`docs/ATELIER-V0.md`) et de mon premier jet
(`docs/plans/2026-09-25-atelier-v1-developpeurs.md`). Je ne refais pas ce
travail : je vais plus loin sur ce que vivent les développeurs, sur le
branchement au poste de travail, et sur ce que personne ne fait encore. Rien
n'est codé._

**Comment lire les marques :**
- **[vérifié]** : j'ai lu le texte de la page elle-même le 24/09/2026 (parfois
  par extraits longs).
- **[rapporté]** : la page résume d'autres sources (surtout des discussions
  Reddit), ou je n'en ai lu qu'un résumé. À revérifier avant de s'en servir en
  public.
- Les citations en anglais sont **traduites** par moi, au plus près.
- **Aucun chiffre n'est inventé.** Les chiffres de sondage donnent leur
  source. Les **efforts** de la feuille de route sont des **estimations** de
  ma part, pas des mesures.
- **Reddit** : je ne l'ai lu qu'à travers des copies et des synthèses publiées
  (marquées [rapporté]). Hacker News, GitHub, les blogs, les documentations et
  les sondages ont été lus directement.

---

## Les 10 décisions les plus importantes

1. **Le bac à sable remplace les clics** : dans le bac à sable (sans clé, réseau
   filtré), les agents travaillent sans demander la permission ; seul ce qui
   **sort** (GitHub, mise en ligne, dépense, nouveau domaine réseau) exige
   **Confirmer**.
2. **« C'est fini » exige une preuve que l'agent ne peut pas fabriquer** : c'est
   l'atelier, pas l'agent, qui lance les tests, surveille qu'aucun test n'a été
   affaibli, et joint au travail un **dossier de preuve** (sortie des tests,
   capture de l'aperçu, commandes lancées, ce qui n'a pas été vérifié).
3. **Plan d'abord, puis exécution d'une traite** : un plan court, modifiable,
   validé d'un geste, devient le contrat ; ensuite l'agent ne dérange plus.
4. **Petits lots faciles à relire** : une tâche = une branche = une petite
   demande de fusion, parce qu'en 2026 le goulot n'est plus d'écrire le code
   mais de le relire.
5. **Un second modèle, d'une autre famille, relit chaque lot**, avec une seule
   question d'abord (« a-t-on construit ce qui était demandé ? ») et très peu
   de bruit.
6. **Des agents en parallèle, mais 2 à 5, chacun dans son propre bac à
   sable**, sur un tableau de tâches qui dit clairement lesquels **attendent
   le développeur** et le prévient.
7. **Jamais d'enfermement** : le dépôt GitHub du développeur reste la vérité,
   ses fichiers `AGENTS.md` / `CLAUDE.md` et ses compétences sont lus et tenus
   à jour au format standard, et il peut reprendre le travail dans son éditeur
   à tout moment.
8. **Se brancher au poste avec des standards, pas avec un logiciel maison** :
   un serveur **MCP** (une adresse à coller, ou un lien « Installer dans VS
   Code »), **git** pour récupérer les branches, puis un petit outil en ligne
   de commande pour **ACP** (Zed, JetBrains) ; pas d'extension VS Code maison
   en V1.
9. **Le coût est un contrat** : une fourchette annoncée avant, un compteur en
   direct **dans la monnaie du développeur**, un plafond dur, et aucun
   changement de prix silencieux.
10. **Sessions courtes et mémoire écrite** : l'agent tient un carnet de projet
    lisible et une fiche de relève, et repart à neuf plutôt que de s'enliser
    dans une conversation trop longue.

---

## Une vérité à dire avant tout : « 5 jours en 1 heure »

C'est **possible pour certains travaux, pas pour tous**, et il faut le mesurer
plutôt que le promettre.

- L'étude contrôlée la plus sérieuse (METR, publiée le 10/07/2025) a mesuré
  que des développeurs expérimentés, sur **leurs propres gros projets**,
  allaient **19 % moins vite** avec l'IA du début 2025, alors qu'ils
  **croyaient** aller 20 % plus vite [vérifié]. En février 2026, METR a publié
  une suite : les développeurs sont « probablement » plus rapides qu'en 2025,
  mais la mesure est devenue difficile : l'étude manque probablement les plus
  gros utilisateurs d'IA (effets de sélection), et METR dit lui-même que ses
  nouvelles données ne sont qu'une « preuve très faible » de l'ampleur du
  gain [vérifié].
- METR note aussi que ses résultats sont **compatibles avec de fortes
  accélérations sur les petits projets neufs** ou sur du code inconnu
  [vérifié].
- Sondage JetBrains 2025 (24 534 développeurs) : près de 9 utilisateurs d'IA
  sur 10 gagnent au moins une heure par semaine, et 1 sur 5 gagne 8 heures ou
  plus [vérifié].

**Ce que j'en tire pour Beau :** le « 5 jours → 1 heure » est crédible pour
**une application ou une fonctionnalité neuve et bien délimitée** (un
« Finjaro Learn » de départ, un tableau de bord, une API simple), **si** la
vérification est automatique. Il ne l'est pas pour une refonte profonde d'un
gros code ancien. D'où la proposition « le chrono honnête » (plus bas) :
avant chaque tâche, le développeur dit combien de temps il aurait mis seul ;
l'atelier mesure le temps réel. C'est la méthode de METR, et c'est la seule
façon d'annoncer un jour un chiffre vrai.

---

## 1. Ce que les développeurs aiment

| Ce qu'ils aiment | Citation courte (traduite) | Source |
|---|---|---|
| **Laisser l'agent travailler seul** pendant qu'on fait autre chose | « Claude Code dans ce mode [sans demandes] donne vraiment l'impression d'être un tout autre produit. » … « La seule solution crédible est de faire tourner les agents dans un bac à sable. » | Simon Willison, 22/10/2025 [vérifié] |
| **Moins de demandes d'autorisation, sans perdre la sécurité** | « En interne, le bac à sable a réduit sans risque les demandes d'autorisation de 84 %. » Cliquer sans cesse mène à la « fatigue de l'approbation », où l'on ne lit plus ce qu'on approuve. | Anthropic, blog d'ingénierie, 20/10/2025 [vérifié] |
| **Plan, puis exécution** | « La plupart des sessions commencent en mode Plan […] ensuite je passe en acceptation automatique et Claude le fait souvent du premier coup. Un bon plan est vraiment important ! » | Boris Cherny (créateur de Claude Code), fil publié en janvier 2026, copie lue [vérifié] |
| **Que l'agent vérifie son propre travail** | « Le conseil le plus important : donnez à Claude un moyen de vérifier son travail. Avec cette boucle, la qualité du résultat final est multipliée par 2 ou 3. » | Même fil [vérifié] |
| **Une mémoire d'équipe dans le dépôt** | « Notre équipe partage un seul CLAUDE.md […] chaque fois que Claude fait une erreur, on l'ajoute, pour qu'il ne la refasse pas. » | Même fil [vérifié] |
| **Paralléliser quand les tâches sont séparées** | « J'ai 3 copies de travail ouvertes, chacune sur une zone différente : fonctionnalité A, fonctionnalité B, et une branche de nettoyage. » | Hacker News, fil « Ask HN: Is it actually possible to run multiple coding agents? » [vérifié] |
| **Piloter depuis le téléphone** | « Des idées en promenant les chiens : je sors Claude sur mon téléphone, je lui dis de tester si l'idée tient. Quand je rentre, j'ai quelque chose à lire. » | Hacker News, commentaire 47292234 [vérifié] ; voir aussi un développeur qui surveille ses tâches depuis son téléphone (Reddit) [rapporté] |
| **Le plaisir de construire** | « La programmation agentique rend la programmation amusante à nouveau ! Des problèmes « trop gros » se règlent en une journée. » | Roland Meertens, 02/03/2026 [vérifié] |
| **Des projets qu'on n'aurait jamais faits** | « L'IA m'a fait écrire du code en dehors du travail pour la première fois depuis des années. » | Hacker News, fil « AI made coding more enjoyable » [vérifié] |
| **Un agent qui lit le projet avant d'écrire** | « Il ne devine pas vos conventions : il lit le code existant et les suit. » | Témoignage dev.to, 12/09/2026 [vérifié] |
| **Brancher ses outils (MCP)** | Serveurs les plus utilisés en 2026 : documentation à jour (Context7), navigateur (Playwright), GitHub, base de données. Conseil récurrent : **2 à 4 serveurs** actifs par projet, pas plus. | Classements MCPVault (07/09/2026) et awesomeagents (26/03/2026) [rapporté] |
| **Déléguer depuis là où le travail arrive** | Linear : on confie un ticket, l'agent ouvre une session, écrit, propose la demande de fusion ; on peut aussi l'appeler depuis Slack. Même chose chez Cursor (Slack) et Codex (Linear). | Documentations Linear, Cursor, OpenAI [vérifié] |

**Ce qui revient partout :** les développeurs aiment **déléguer une tâche
claire et revenir à un résultat prouvé**. Ils n'aiment pas être des surveillants
de clics. Et ils aiment **garder la main** : leur dépôt, leurs règles, leurs
outils.

## 2. Ce qui les fait fuir

| Ce qui les fait fuir | Citation ou fait (traduit) | Source |
|---|---|---|
| **Le « presque juste »** | Frustration n° 1 citée par **66 %** des développeurs : « des solutions presque justes, mais pas tout à fait » ; n° 2 (45 %) : « déboguer le code de l'IA prend plus de temps ». | Sondage Stack Overflow 2025 (49 000 réponses, 177 pays) [vérifié] |
| **La confiance qui baisse** | 46 % se méfient de l'exactitude de l'IA, 33 % lui font confiance, 3 % « très confiance ». Les plus expérimentés sont les plus méfiants. | Même sondage [vérifié] |
| **L'agent qui ment sur les tests** | « Un agent m'a dit que tous les tests passaient. Il avait supprimé celui qui échouait. » | dev.to, 16/09/2026 [vérifié] ; Medium, 27/05/2026 [vérifié] |
| … et ce n'est pas un bruit de forum | Anthropic a écrit dans la fiche de Claude 3.7 Sonnet que le modèle « recourt parfois à des cas particuliers pour faire passer les tests […] ou modifie les tests eux-mêmes » ; le banc EvilGenie observe ce comportement chez Codex et Claude Code. | Cité par un article Medium du 23/07/2026 [rapporté] |
| **La fatigue des autorisations** | « Une tâche de débogage demande 30 à 50 approbations : une tâche de 10 minutes devient 2 à 4 heures de baby-sitting. » | Ticket GitHub anthropics/claude-code #32559 [vérifié] |
| **Les coûts surprises** | Cursor, juin 2025 : passage à une facturation à l'usage mal expliquée, excuses publiques et remboursements le 04/07/2025 : « Nous n'avons pas bien géré ce changement de prix, et nous en sommes désolés. » | Blog Cursor [vérifié] ; TechCrunch 07/07/2025 [vérifié] |
| … et les limites qui tombent | Claude Code : limites hebdomadaires ajoutées le 28/08/2025, après une baisse non annoncée en juillet. « Le meilleur outil que j'aie utilisé, pendant les 45 minutes par jour où je peux m'en servir. » | LeadDev, 27/08/2025 [vérifié] ; citation Reddit via Morph, 12/03/2026 [rapporté] |
| **La perte de contexte** (sessions trop longues) | Le « mauvais quart » de la conversation : au-delà d'un certain remplissage, le modèle oublie des consignes, et la compaction automatique fait perdre des règles. | nathanonn.com, 01/05/2026 [vérifié] ; synlabs, 21/01/2026 [vérifié] |
| **Ne plus comprendre son propre code** (« dette cognitive ») | « Je ne peux plus répondre à des questions sur plusieurs fonctionnalités, même après les avoir relues. » « Quand ça casse, votre seul recours est de demander à l'IA. » | Hacker News, fils « Cognitive Debt » et 48419256 [vérifié] |
| **La relecture qui explose** | Chez des équipes passées à l'IA intensive : demandes de fusion **51 % plus grosses**, temps médian de relecture **+441 %**, fusions sans aucune relecture **+31 %**. | Rapport Faros « Acceleration Whiplash », cité par TQdev, 17/08/2026 [rapporté] |
| … et la fatigue de décision | « Mes ingénieurs seniors se noient dans les relectures. » | CIO, 11/08/2026 [vérifié] ; Stack Overflow blog, 21/05/2026 [vérifié] |
| **Trop d'agents à surveiller** | « Deux sessions en parallèle, c'est déjà ma limite. Au-delà, mon cerveau lâche en quelques minutes. » | Hacker News, même fil « Ask HN » [vérifié] |
| **Les agents d'arrière-plan loin de l'éditeur** | « Un environnement inaccessible qui pousse des choses au hasard sur des branches que je dois récupérer à la main, ce n'est pas agréable. Donnez-moi un environnement isolé branché en un clic à VS Code. » | Hacker News, sur le lancement de Claude Code sur le web [vérifié] |
| **Le spec trop lourd** | Essai de Kiro sur un petit bogue : « 4 histoires d'utilisateur et 16 critères d'acceptation » ; Spec Kit : « beaucoup de fichiers Markdown à relire, répétitifs ». | Birgitta Böckeler (martinfowler.com), 15/10/2025 [vérifié] |
| **L'outil qui disparaît** | Vibe Kanban : l'entreprise Bloop a fermé le 10/04/2026 ; Crystal abandonné en février 2026. | Comparatifs Nimbalyst et tomrochette.com [rapporté] |
| **Payer en dollars quand on gagne dans une autre monnaie** | Dans plusieurs pays, les cartes bancaires locales sont refusées pour les abonnements en dollars ; « 20 $ par mois, c'est 2 à 3 jours de salaire pour beaucoup de développeurs ». | Guides EverTry (27/02 et 25/05/2026) et dev.to (07/04/2026) — sources commerciales, à lire avec prudence [rapporté] |
| **Les attaques qui visent les outils d'IA** | Le ver « Mini Shai-Hulud » (mai 2026) a écrit des « hooks » malveillants dans `~/.claude/settings.json` (Claude Code) et `.vscode/tasks.json` (VS Code) ; une variante injectait de faux serveurs MCP et volait les clés d'IA de 9 fournisseurs. | Cloud Security Alliance, 16/05/2026 et 25/04/2026 [vérifié] |

## 3. Les chiffres de sondage utiles (tous sourcés)

| Chiffre | Source |
|---|---|
| 84 % utilisent ou vont utiliser l'IA ; 51 % des professionnels chaque jour | Stack Overflow 2025 [vérifié] |
| Opinion favorable : de plus de 70 % (2023-2024) à 60 % (2025) | Stack Overflow 2025 [vérifié] |
| Agents : 52 % ne s'en servent pas ou se limitent à des outils simples ; 38 % n'en prévoient pas | Stack Overflow 2025 [vérifié] |
| Parmi ceux qui utilisent des agents : ~70 % disent qu'ils réduisent le temps de certaines tâches, **17 % seulement** qu'ils améliorent la collaboration d'équipe | Stack Overflow 2025 [vérifié] |
| 87 % s'inquiètent de l'exactitude des agents, 81 % de la sécurité des données | Stack Overflow 2025 [vérifié] |
| 85 % utilisent régulièrement l'IA ; 62 % au moins un assistant, agent ou éditeur IA | JetBrains 2025, 24 534 réponses [vérifié] |
| Craintes n° 1 à 5 : qualité inégale, compréhension limitée du code complexe, vie privée, **perte de ses propres compétences**, manque de contexte | JetBrains 2025 [vérifié] |
| `AGENTS.md` : plus de 60 000 projets libres l'utilisent ; confié à la Linux Foundation (Agentic AI Foundation) le 09/12/2025, avec MCP | agents.md et Linux Foundation [vérifié] |

**Deux choses à retenir :** la **confiance** est le vrai sujet, pas la vitesse.
Et presque personne ne trouve que les agents aident **l'équipe** (17 %) : c'est
une place libre pour Léo, qui a déjà des réunions, des rôles et une mémoire.

---

## 4. Les flux de travail qui marchent en 2026, expliqués simplement

**1. Chercher → planifier → exécuter, dans trois sessions séparées.** On fait
d'abord comprendre le code à l'agent (il résume ce qu'il a trouvé), puis il
écrit un plan court avec les fichiers à toucher et les tests à lancer, puis
une session **neuve** exécute le plan. Pourquoi : une conversation qui s'allonge
rend le modèle moins bon ; repartir à neuf avec un résumé écrit marche mieux
[vérifié : synlabs, buecking/incontext].

**2. Le plan comme contrat, puis « laisse-le cuisiner ».** Le développeur
discute le plan, le valide, puis passe en acceptation automatique. C'est le
flux décrit par le créateur de Claude Code [vérifié].

**3. La boucle de vérification.** Tests, linter, lancement de l'application,
navigateur piloté par l'agent (Playwright ou l'extension Chrome de Claude),
jusqu'à ce que tout soit vert. C'est le levier de qualité n° 1 cité par Boris
Cherny [vérifié].

**4. Deux cerveaux : un qui écrit, un qui relit.** Un développeur décrit son
flux : ticket détaillé → plan → exécution → « je lance une **nouvelle**
instance de Claude pour relire les changements » → corrections → demande de
fusion en brouillon → relecture humaine → l'agent traite les commentaires
[vérifié : Hacker News]. Chez Weaviate : « un agent (adversaire) relit, un
humain décide du périmètre, un agent applique » [vérifié : Pragmatic Engineer,
08/09/2026].

**5. Le relecteur par niveau de risque.** Des équipes ne relisent plus tout à
la main : ce qui touche l'authentification, l'API publique, le schéma de base
de données ou les compétences des agents exige un humain ; le reste peut
passer après les contrôles automatiques. Duckbill Group : fusions +94 % en
passant à ce système [vérifié : Pragmatic Engineer]. Chainguard : 840 fusions
sans humain, mais seulement sur une classe de changements bornée, et jamais
sur l'infrastructure ou l'authentification [rapporté : TQdev].

**6. Plusieurs agents, chacun isolé.** Une copie de travail (worktree) ou un
conteneur par tâche, pour que deux agents ne s'écrasent pas. Isoler aussi les
**ports** et la **base de test** [vérifié : buildthisnow, 08/06/2026].
Limite pratique rapportée : 2 à 3 agents concentrés sont plus fiables que 6 à 8
qui créent des conflits [vérifié : Hacker News].

**7. Les tests d'abord, écrits par quelqu'un d'autre.** Un agent écrit les
tests à partir de la demande **sans voir le code** ; un autre écrit le code ;
les fichiers de test sont **gelés** pendant l'implémentation (un « hook » bloque
leur modification). Des outils libres le font déjà (tdd-guard, correctless,
make-no-mistakes) [vérifié : dépôts GitHub].

**8. La mémoire de projet dans le dépôt.** `AGENTS.md` (standard ouvert) ou
`CLAUDE.md`, des commandes réutilisables (`/commit-push-pr`), des compétences
(`SKILL.md`), des autorisations partagées dans `.claude/settings.json`
[vérifié : fil de Boris Cherny]. Astuce courante : une fiche de relève
(`HANDOFF.md`) écrite avant de vider la conversation [vérifié : nathanonn.com].

**9. Déléguer depuis le ticket ou la discussion.** On assigne un ticket à
l'agent (Linear, GitHub), ou on l'appelle dans Slack ; il répond par une
demande de fusion. Linear lance même l'agent **automatiquement** sur les
tickets qui arrivent en tri [vérifié : documentation Linear].

**10. Le téléphone comme télécommande.** Lancer des tâches le matin depuis le
téléphone, être **prévenu** quand un agent attend une réponse, valider une
modification en marchant. Claude Code (Remote Control, notifications), et des
outils libres comme Happy, font exactement ça [vérifié : documentation Claude
Code, blog nathanwillson.com].

**11. Passer du nuage au poste et inversement.** Claude Code lance une tâche
dans le nuage depuis le terminal (`--cloud`) et en ramène une sur le poste
avec `--teleport`, branche et conversation comprises [vérifié : documentation
Claude Code].

**Ce qui marche moins bien qu'annoncé :** les spécifications très lourdes
(Kiro, Spec Kit) pour les petites tâches [vérifié : Böckeler] ; un fil Hacker
News d'août 2026 demande même « Qu'est-il arrivé au développement piloté par
les spécifications ? » [vérifié]. **Leçon : un plan court, oui ; un cahier des
charges de 16 critères pour un bogue, non.**

---

## 5. Se connecter au poste du développeur

### Ce qui existe (vérifié le 24/09/2026)

| Option | Ce que c'est | Pour le développeur | Pour nous à construire |
|---|---|---|---|
| **git + GitHub** | L'atelier pousse une branche `leo/…` sur **son** dépôt ; il la récupère | Rien à installer : `git fetch` puis `git switch leo/…` | Déjà prévu (application GitHub). Simple |
| **Serveur MCP distant** | Une adresse que son agent (Claude Code, Codex, Cursor, VS Code) appelle pour parler à l'atelier | Une commande ou un clic. VS Code accepte un lien `vscode:mcp/install?…` ; Cursor un lien `cursor://anysphere.cursor-deeplink/mcp/install?…` ; Claude Code : `claude mcp add --transport http …` | Léo a déjà `legion-mcp` (jeton personnel `lg_…`). Ajouter des outils « atelier ». Moyen |
| **ACP** (Agent Client Protocol, lancé par Zed) | Le « LSP des agents » : un agent qui le parle apparaît dans **Zed, les IDE JetBrains, Neovim, Emacs**, et des extensions VS Code | Il choisit « Atelier de Léo » dans la liste d'agents de son éditeur | Aujourd'hui l'agent tourne **en local** (processus lancé par l'éditeur) ; « le support complet des agents distants est en cours » [vérifié : agentclientprotocol.com]. Donc un petit pont local vers notre nuage. Un **registre ACP** existe depuis le 28/01/2026 (Zed + JetBrains) mais n'accepte que les agents avec authentification [vérifié]. Moyen |
| **Petit outil en ligne de commande** (`npx …`) | Un programme qui fait le lien : connexion, récupération des branches, pont ACP | Une commande, rien d'autre à installer que Node | Petit à moyen |
| **Tunnel VS Code** (`code tunnel`) | Ouvrir une machine distante dans VS Code (bureau ou navigateur) sans SSH | Se connecter avec GitHub ou Microsoft | Faisable dans le bac à sable, **mais** il faudrait une identité GitHub/Microsoft et un accès réseau sortant vers Azure dans le bac à sable : contraire à notre règle « aucune clé dans le bac ». Plus tard, avec précaution |
| **VS Code dans le navigateur** (code-server / openvscode-server) derrière notre adresse protégée | L'éditeur complet, dans un onglet, sur le bac à sable | Rien à installer | Moyen ; lourd sur téléphone (Monaco ne gère pas le mobile, déjà noté le 24/09) |
| **Fenêtre « Agents » de VS Code** | VS Code sait maintenant se connecter à une machine distante (SSH ou tunnel) pour y lancer des sessions d'agent (« Agent Host Protocol ») | — | À surveiller ; récent [vérifié : documentation VS Code] |
| **Extension VS Code / JetBrains maison** | Notre propre panneau dans l'éditeur | Installer depuis le magasin d'extensions | **Coûteux** (deux écosystèmes, validations, mises à jour) et redondant avec MCP + ACP |
| **Codespaces / Gitpod / conteneurs de développement** | Environnements de développement dans le nuage | Déjà connus | On ne les remplace pas ; on peut **lire** un `devcontainer.json` pour préparer le bac à sable (V2) |
| **Application de bureau** (comme Conductor, Claude Desktop) | Un programme sur l'ordinateur | Installer une application | Trop lourd pour nous maintenant |
| **Mode « chez moi »** (l'agent tourne sur le poste, l'écran Léo le pilote à distance) | Comme Remote Control de Claude Code : le code reste sur sa machine | Lancer une commande et laisser le terminal ouvert | Plus tard (V2) : il faut un relais chiffré et un petit programme local |

### La recommandation

**Trois étages, du plus simple au plus riche, tous sur des standards :**

1. **V1 — git + MCP.** Le travail de l'atelier sort **toujours** par une branche
   `leo/…` sur le GitHub du développeur (après Confirmer). Et son agent local
   (Claude Code, Codex, Cursor, VS Code) se branche à l'atelier par **MCP**,
   avec le jeton personnel qui existe déjà dans Léo (`lg_…`, dans l'en-tête
   `Authorization`, jamais dans l'adresse). Aucun changement d'authentification
   Supabase : c'est important, parce que tout ce qui touche la connexion
   concerne aussi Finjaro Accounting (règle § 8 de `CLAUDE.md`).
2. **V1.5 — un petit outil `npx finjaro-atelier`** (nom à choisir) : `login`
   (le navigateur s'ouvre, on confirme), `pull <tâche>` (récupère la branche,
   même sans GitHub, via un paquet git), `acp` (le pont pour Zed et JetBrains).
3. **V2 — le nuage et le poste se passent la main** : « envoyer cette tâche à
   l'atelier » depuis Claude Code, et « continuer sur mon poste » depuis
   l'atelier ; puis le mode « chez moi » et VS Code dans le navigateur.

**Pourquoi pas une extension VS Code maison :** MCP est déjà compris par
Claude Code, Codex, Cursor et VS Code ; ACP par Zed, JetBrains, Neovim et
Emacs. Deux standards couvrent presque tous les éditeurs. Une extension maison
coûterait cher, et un développeur n'aime pas installer un logiciel de plus
pour un outil qu'il découvre.

### Le pas-à-pas côté développeur (ce qu'il verra)

**Une seule fois (2 minutes) :**
1. Dans Léo → **Atelier** → **Brancher mon éditeur**. L'écran affiche son
   jeton personnel (créé en un geste, révocable) et trois boutons.
2. Selon son outil :
   - **VS Code** : il clique **Installer dans VS Code** (lien `vscode:mcp/install`),
     VS Code demande « Faire confiance à ce serveur ? » → Oui.
   - **Cursor** : il clique **Installer dans Cursor** (lien Cursor), même question.
   - **Claude Code** : il copie une ligne et la colle dans son terminal :
     `claude mcp add --transport http atelier <adresse> --header "Authorization: Bearer lg_…"`
   - **Codex et les autres** : il copie la configuration affichée.
3. Il tape dans son agent : « liste mes tâches de l'atelier ». La réponse
   prouve que c'est branché.

**Chaque jour :**
- **Récupérer un travail fini dans l'atelier** : il reçoit une notification
  « Tâche 12 prête, preuves jointes ». Dans son terminal :
  `git fetch && git switch leo/tache-12`. Il ouvre les fichiers dans **son**
  éditeur, lance ses tests, corrige s'il veut.
- **Envoyer une tâche à l'atelier depuis son éditeur** : il dit à son agent
  local « envoie à l'atelier : ajoute la pagination à la liste des leçons,
  mode Chantier libre, plafond 0,50 $ ». L'atelier crée la tâche, il suit
  l'avancement sur son téléphone.
- **Voir sans rien installer** : le lien d'aperçu et le QR code, depuis
  n'importe quel navigateur.

**Plus tard (V1.5) avec l'outil en ligne de commande :**
```
npx finjaro-atelier login          # le navigateur s'ouvre, il confirme
npx finjaro-atelier pull 12        # récupère la tâche 12, même sans GitHub
npx finjaro-atelier acp            # à déclarer dans Zed ou JetBrains
```

---

## 6. Propositions

Classement : **Indispensable** (sans ça, les développeurs partent), **Fort**
(ça les fait rester), **Audacieux** (ça les fait parler de nous). Les idées
marquées ⭐ **n'existent pas encore ailleurs, à ma connaissance** : pour
chacune, je dis ce que j'ai cherché et ce qui s'en approche. « Pas trouvé » ne
veut pas dire « n'existe nulle part ».

### Indispensable

1. **Mode « Chantier libre »** : dans le bac à sable, tout passe sans clic
   (fichiers, commandes, installations depuis la liste autorisée). Confirmer
   seulement pour ce qui sort. Le garde (second modèle) regarde les
   **sorties**, pas chaque `ls`. _Base : Anthropic −84 % de demandes ;
   Willison._
2. **Le dossier de preuve** joint à chaque livraison : sortie des tests
   **lancés par l'atelier**, capture ou courte vidéo de l'aperçu, liste des
   commandes, fichiers de test modifiés, et une rubrique « **ce que je n'ai pas
   vérifié** ». Aucun « c'est fini » sans lui.
3. **Le fil anti-triche des tests** : l'atelier compare les tests avant/après
   (tests supprimés, `.skip`, assertions retirées, valeurs codées en dur) et
   bloque la livraison en expliquant pourquoi. _Base : fiche de Claude 3.7,
   témoignages de septembre 2026._
4. **Plan court, modifiable, validé d'un geste** : 5 à 10 lignes, fichiers
   touchés, tests prévus, coût estimé. Validé → exécution sans interruption.
5. **Rembobiner** : un point de retour git après chaque étape, et un curseur
   pour revenir en arrière.
6. **Petites demandes de fusion** : l'atelier découpe d'office une grosse
   tâche en lots relisibles ; il refuse les lots trop gros (seuil réglable).
7. **Le coût comme contrat** : fourchette avant, compteur en direct, plafond
   dur, alerte à 80 %, **dans la monnaie du développeur** (celle de ses
   réglages Léo, jamais une monnaie supposée d'après le pays). Aucun
   changement de tarif sans prévenir 30 jours avant.
8. **Ses règles d'abord** : `AGENTS.md`, `CLAUDE.md`, `.cursorrules`,
   linter, formatteur, lus d'office ; l'atelier **propose** d'y ajouter une
   règle quand il se fait corriger (jamais en silence).
9. **Aperçu en direct + QR code** pour le téléphone. _Note technique : chez
   Cloudflare, les adresses d'aperçu `exposePort` exigent un domaine à nous
   avec sous-domaines génériques ; sinon il faut les « tunnels » du SDK
   (`*.trycloudflare.com`), qui sont publics et devront être protégés par un
   jeton._
10. **Brancher son éditeur** (section 5) : MCP + git en V1.
11. **Notifications « j'ai besoin de toi »** : un agent qui attend une réponse
    prévient (téléphone, e-mail), avec la question et les boutons de réponse.
12. **Sécurité des fichiers de configuration** : un dépôt ne peut jamais changer
    le mode, les hooks, les serveurs MCP ni le réseau de l'atelier ; toute
    modification de `.claude/`, `.vscode/tasks.json`, `.mcp.json` dans une
    livraison est **signalée en rouge** au relecteur. _Base : Mini Shai-Hulud,
    mai 2026._

### Fort

13. **Le relecteur à faible bruit (Rigo)** : un modèle d'une autre famille, qui
    répond d'abord à « a-t-on construit ce qui était demandé ? », puis ne
    remonte que les problèmes graves ; on mesure le taux de remarques
    acceptées, et on coupe ce qui fait du bruit. _Base : Uber, WeTravel,
    Weaviate (Pragmatic Engineer)._
14. **Tests écrits à l'aveugle et gelés** : un agent Testeur écrit les tests
    depuis la demande sans voir le code, et une partie reste **cachée** au
    Codeur ; les tests visibles sont en lecture seule pendant l'écriture du
    code. _Existe dans des outils libres (correctless, make-no-mistakes) mais
    pas comme réglage par défaut d'un atelier hébergé._
15. **Le tableau des agents** : 2 à 5 tâches en parallèle, chacune dans son bac
    à sable, avec trois états clairs : « travaille », « **t'attend** »,
    « prête avec preuves ». Pas plus de 5 par défaut.
16. **La fiche de relève automatique** : avant qu'une conversation devienne
    trop longue, l'agent écrit une fiche (but, fichiers, décisions, échecs,
    prochaine étape) et repart dans une session neuve. Jauge de contexte
    visible.
17. **Tâches depuis un ticket ou un message** : assigner un ticket GitHub à
    l'atelier, ou écrire « @Léo corrige ça » dans une discussion Léo → une
    demande de fusion revient.
18. **Relecture par niveau de risque** : l'atelier classe chaque lot (vert :
    style, tests, docs ; orange : logique ; rouge : authentification,
    paiement, migration, configuration d'agent) et n'exige la relecture
    humaine que là où il faut.
19. **Le chrono honnête** : avant la tâche, le développeur dit « seul, j'aurais
    mis X » ; l'atelier mesure le temps réel jusqu'à la fusion. On publiera un
    chiffre **seulement** quand il sera mesuré (méthode METR, règle § 3 de
    `CLAUDE.md`).
20. **Modèles de départ testés** : Vite + React, API (Hono), site statique,
    Supabase ; « depuis mon dépôt » ; chaque modèle arrive avec ses tests et
    son `AGENTS.md`. (`atelier/src/departs.js` a déjà les premiers.)
21. **Sa clé, son abonnement** : clé Anthropic ou OpenAI rangée au coffre et
    ajoutée à la sortie ; ou son propre agent (Claude Code) branché par MCP.
22. **Compétences au format standard** (`SKILL.md`) : import (texte seul après
    analyse), export, catalogue vérifié ; jamais de script sans Confirmer.
23. **Le traducteur d'erreurs et la visite guidée** (déjà proposés le 24/09) :
    utiles aussi aux développeurs confirmés qui arrivent dans un code inconnu.
24. **Le téléphone comme télécommande** : lancer, suivre, répondre, valider un
    lot, dicter à la voix (reconnaissance vocale du navigateur ou transcription
    déjà branchée dans Léo).

### Audacieux — dont les idées nouvelles ⭐

25. ⭐ **La carte de compréhension** (contre la « dette cognitive »). L'atelier
    sait quelles parties du code ont été écrites par des agents et **jamais
    lues ni expliquées** à un humain. Il les montre en gris sur une carte du
    projet, et propose pour chaque zone une visite de 3 minutes avec 2
    questions ; la zone devient verte quand la personne a répondu. Avant une
    fusion rouge (paiement, authentification), il demande que la zone soit
    verte.
    _Cherché :_ « comprehension debt », « cognitive debt » tools, git-ai,
    Agent Trace. _Ce qui s'en approche :_ git-ai et Agent Trace (standard
    lancé par Cursor le 27/01/2026, soutenu par Cognition, Cloudflare,
    Vercel…) rattachent chaque ligne à la conversation qui l'a écrite ; le
    style « Apprentissage » de Claude Code laisse du code à écrire soi-même.
    _Pas trouvé :_ une mesure de ce que **l'humain a compris**, utilisée comme
    condition de fusion. Or la dette cognitive est l'une des plaintes fortes de
    2026 (Hacker News) et la crainte n° 4 du sondage JetBrains.
26. ⭐ **Le carnet de fiabilité** (affirmation contre preuve). Chaque fois qu'un
    agent affirme (« les tests passent », « j'ai ajouté des tests », « c'est
    corrigé »), l'atelier compare avec la preuve indépendante. Il en tire, par
    modèle et par dépôt, un **taux d'affirmations démenties**, affiché
    honnêtement, et il s'en sert pour choisir quel modèle fait quoi (et avec
    quelle surveillance).
    _Cherché :_ « trust score coding agent », « claims vs evidence », outils de
    coût et de traçabilité. _Ce qui s'en approche :_ git-ai mesure le taux de
    lignes acceptées ou réécrites par l'humain ; Agent Blackbox et
    make-no-mistakes détectent une triche **ponctuelle**. _Pas trouvé :_ un
    registre durable des affirmations démenties, servant à router les tâches
    entre modèles. Léo a déjà le banc des moteurs (`legion-banc`) : c'est son
    prolongement naturel sur du vrai travail.
27. ⭐ **Le garde d'écosystème partagé.** Quand plusieurs applications partagent
    une base, une connexion ou des fonctions (c'est le cas de Finjaro : place
    de marché, Accounting, Console), l'atelier tient une **carte déclarée** de
    ce qui est commun (réglages d'authentification, tables, fonctions
    déployées ensemble). Avant une commande ou une livraison qui y touche
    (migration non additive, adresse de redirection, fonction partagée), il
    **nomme l'autre application touchée** et demande Confirmer à la bonne
    personne. C'est exactement la panne évitée de justesse le 15/09 (Site URL).
    _Cherché :_ « cross-repository impact », « shared database guard »,
    agents multi-dépôts (Kiro, Cursor). _Ce qui s'en approche :_ la recherche
    de code entre dépôts, les specs multi-dépôts de Kiro. _Pas trouvé :_ un
    registre de contrats partagés **vérifié avant l'action** par l'agent.
28. ⭐ **La fiche de décision pour le fondateur qui ne code pas.** Chaque lot
    orange ou rouge arrive avec une fiche d'une demi-page, en langue simple :
    ce qui change pour les utilisateurs, ce qui peut casser, qui est touché,
    combien ça a coûté, la preuve en vidéo. Beau répond **Oui / Non / Question**,
    à l'écrit ou à la voix ; pour les zones rouges, les agents ne peuvent pas
    fusionner sans ce oui.
    _Ce qui s'en approche :_ Linear laisse les chefs de produit déléguer à des
    agents ; Cursor joint des vidéos ; Weaviate fait trancher le périmètre par
    un humain. _Pas trouvé :_ une validation conçue pour un **propriétaire non
    développeur**, avec des classes de risque et un veto vocal.
29. ⭐ **La réunion d'agents avec procès-verbal.** Avant une grosse tâche,
    l'Architecte, le Testeur et Rigo (trois modèles différents) débattent
    quelques minutes et rendent un procès-verbal de 10 lignes : décisions,
    **désaccords laissés ouverts**, risques. L'humain tranche les désaccords ;
    le PV entre dans la mémoire du projet. Léo a déjà les réunions
    (`legion-reunion`).
    _Ce qui s'en approche :_ des « bureaux » d'agents à rôles (AgentsRoom,
    Munder Difflin), la clarification de Spec Kit. _Pas trouvé :_ un PV qui
    montre les désaccords entre modèles au lieu de les lisser. Et le sondage
    Stack Overflow dit que 17 % seulement voient un gain d'équipe : la place
    est libre.
30. ⭐ **Les heures creuses.** Certains fournisseurs facturent moins cher la
    nuit (DeepSeek affiche des tarifs heure pleine / heure creuse, vérifiés le
    24/09). L'atelier propose : « non urgent ? je le fais cette nuit pour
    environ la moitié du prix », range la tâche, et montre l'économie réelle
    le matin.
    _Ce qui s'en approche :_ un greffon (dsh-cost-guard) **affiche** les tarifs
    heure pleine / creuse de DeepSeek, mais dit ne pas toucher à l'exécution.
    _Pas trouvé :_ la **planification automatique** des tâches d'agent dans les
    heures creuses.
31. ⭐ **Payer comme on paie chez soi.** Recharge du crédit d'atelier dans la
    monnaie du développeur, y compris par **paiement mobile** là où c'est le
    moyen courant, avec des petits montants ; le compteur affiche la même
    monnaie.
    _Cherché :_ agents de code payables par mobile money, agents pilotés par
    WhatsApp. _Ce qui s'en approche :_ des serveurs MCP qui permettent à un
    agent de **faire** des paiements mobiles (MTN MoMo, M-Pesa, Orange Money) ;
    des cartes virtuelles en dollars pour payer les outils américains ; un
    greffon qui affiche les coûts en yuans. _Pas trouvé :_ un atelier de code
    hébergé qui se **recharge** ainsi. Le besoin est documenté (cartes
    refusées, dollars chers), même si les sources sont commerciales.
32. ⭐ **Le mode « données chères ».** Tout le travail lourd reste dans le nuage ;
    le téléphone ne reçoit que des résumés, des diffs compacts et des captures
    compressées ; un compteur « Mo consommés aujourd'hui » ; et, en option, le
    rapport du jour par e-mail léger. Pensé pour les connexions mobiles
    chères, partout dans le monde.
    _Cherché :_ agents de code « low bandwidth », pilotage par SMS ou WhatsApp.
    _Pas trouvé_ d'atelier de code qui mesure et limite les données consommées
    par l'écran du développeur.
33. ⭐ **Le marché des compétences sur Finjaro.** Les développeurs vendent des
    compétences, modèles de projets et agents **vérifiés** (analysés dans le
    bac à sable, sans script caché) sur la place de marché Finjaro, payés dans
    la monnaie de l'acheteur. L'atelier installe en un geste.
    _Ce qui s'en approche :_ registres gratuits (MCP, ACP, magasins de
    compétences, dont celui d'OpenClaw où 341 compétences malveillantes ont été
    trouvées en janvier 2026). _Pas trouvé :_ un marché **payant, vérifié,
    multi-monnaies** intégré à une place de marché générale.
34. ⭐ **La facture du freelance.** Pour un développeur qui travaille pour des
    clients : le coût des agents et le temps, rattachés à chaque
    fonctionnalité, deviennent en un geste un **devis ou une facture** (et, si
    Beau le décide, des écritures dans Finjaro Accounting).
    _Ce qui s'en approche :_ git-ai rattache le coût en jetons à chaque demande
    de fusion. _Pas trouvé :_ la transformation en facture client. _Attention :_
    les tables d'Accounting ne se mélangent pas avec celles de Léo sans la
    décision de Beau (`CLAUDE.md` § 8).
35. **La contre-expertise** : rejouer le même plan avec un autre modèle et
    comparer les deux résultats côte à côte (existe en partie : Codex et des
    développeurs le font à la main).
36. **Parler à l'atelier** (Jarvis) : « lance les tests », « explique ce
    fichier », « où en est la tâche 12 ? ».
37. **Les standards de mémoire d'agent** : écrire les traces au format **Agent
    Trace** (ouvert, 2026) pour que le travail fait chez nous soit lisible par
    les autres outils. Encore une façon de ne pas enfermer.

---

## 7. La feuille de route recommandée

Elle **remplace** l'ordre de mon premier jet. Les efforts sont en **jours de
travail d'agent**, estimés par moi (pas mesurés), pour un agent qui connaît
déjà le code de l'atelier.

### Ce que je corrige dans le premier jet

- **Le levier n'est pas le parallélisme, c'est la vérification.** Le premier
  jet mettait « plusieurs agents en parallèle » au cœur du « 5 jours → 1
  heure ». La recherche dit plutôt : un seul agent **bien vérifié** vaut mieux
  que cinq agents à relire (limite humaine de 2-3 sessions, relecture qui
  explose). Le parallélisme passe en V1.5, limité à 5.
- **Ajout central : le dossier de preuve et le fil anti-triche**, absents du
  premier jet.
- **Le mode Auto** : le second modèle surveille surtout les **sorties** ; dans
  le bac à sable sans clé, on ne double pas chaque commande d'un appel au
  modèle (lenteur, coût).
- **L'aperçu** : prévoir le domaine générique ou les tunnels du SDK (contrainte
  vérifiée dans la documentation Cloudflare).
- **Le branchement à l'éditeur** : MCP + git dès la V1 (pas en fin de liste),
  car c'est ce qui rassure le développeur (« je ne suis pas enfermé »).
- **La mise en ligne en un geste** passe en V2 : elle touche des adresses
  réelles et doit attendre que la preuve et la relecture soient solides.
- **Le coût** : dans la monnaie du développeur, pas en dollars seulement.

### V1 courte — « Le chantier qui prouve » (≈ 15 jours d'agent)

| Étape | Ce que ça apporte au développeur | Effort | Risques |
|---|---|---|---|
| Mode **Chantier libre** + Confirmer pour les sorties | Fin de la fatigue des clics | 2 j | Une commande dangereuse passe : le bac est jetable, sans clé, réseau filtré ; liste toujours refusée (déjà écrite le 24/09) |
| **Plan court modifiable** → exécution d'une traite | Il garde la direction sans surveiller | 1 j | Plans trop longs : limite à 10 lignes |
| **Rembobiner** (point git par étape) | Il ose | 1 j | Taille du dépôt ; nettoyage des points à la fin |
| **Vérificateur indépendant + fil anti-triche + dossier de preuve** | Il croit le « c'est fini » | 3 j | Faux positifs (un test renommé n'est pas une triche) : l'agent doit dire « renommé / remplacé / supprimé » |
| **Aperçu en direct + QR** | Il voit tout de suite | 1,5 j | Adresse publique : jeton dans l'adresse, durée courte ; domaine à choisir par Beau |
| **GitHub** : import, branche `leo/…`, demande de fusion avec le dossier de preuve, après Confirmer | Le travail sort proprement | 3 j | Beau doit créer l'application GitHub ; règle de protection de la branche principale |
| **Ses règles** (`AGENTS.md`, `CLAUDE.md`) lues ; modèles de départ complétés (Vite + React, Hono) | Il se sent chez lui dès la 1re minute | 1 j | Règles contradictoires : on les montre |
| **Coût** : fourchette avant, compteur dans sa monnaie, plafond | Pas de surprise | 1 j | Estimation fausse au début : dire « fourchette », mesurer, corriger |
| **Brancher son éditeur, étage 1** : outils atelier par MCP (lister, lancer, état, diff, commande `git` pour récupérer) + boutons VS Code / Cursor / Claude Code | Il garde ses outils | 2 j | Si ces outils vont dans `legion-mcp`, c'est une fonction edge **commune à staging et production** : prévenir Beau avant de la déployer |

**Ce que la V1 permet :** « fais-moi le départ de Finjaro Learn » avec **un**
agent, un plan validé, un aperçu sur le téléphone, une branche GitHub prouvée.
On chronomètre les premiers vrais essais avant d'annoncer quoi que ce soit.

### V1.5 — « L'équipe » (≈ 15 à 18 jours d'agent)

| Étape | Apport | Effort | Risques |
|---|---|---|---|
| **Tableau des agents** (2 à 5, un bac à sable chacun, états clairs) + **notifications** | Plusieurs choses avancent pendant qu'il vit | 4 j | Coût × 5 : plafond par jour ; conflits : petites tâches séparées |
| **Rigo, relecteur à faible bruit**, d'une autre famille de modèle | Moins de relecture humaine inutile | 2 j | Bruit : mesurer les remarques acceptées, couper le reste |
| **Tests à l'aveugle et gelés** | Des tests qui testent vraiment | 2 j | Tests faux eux-mêmes : on les montre dans la preuve |
| **Fiche de relève + jauge de contexte** | L'agent ne s'enlise plus | 1 j | — |
| **Tâches depuis un ticket GitHub ou « @Léo » dans une discussion** | Il délègue là où le travail arrive | 2 j | Injection par un ticket piégé : le ticket est une **donnée**, jamais une consigne ; un seul dépôt par session |
| **Téléphone-télécommande + dictée** | Il avance en marchant | 2 j | Rien d'irréversible depuis le téléphone sans Confirmer |
| **Outil `npx finjaro-atelier`** (`login`, `pull`, `acp`) | Zed, JetBrains, et récupération sans GitHub | 3 j | Maintenance d'un paquet npm ; signature et publication propres (vu Shai-Hulud) |
| ⭐ **Carnet de fiabilité, v0** (on enregistre seulement) | Les données pour choisir les modèles sur faits | 1 j | — |
| ⭐ **Heures creuses** | Moins cher pour ce qui peut attendre | 1 j | Tarifs qui changent : relire la page officielle chaque semaine |

### V2 — « Chez soi partout » (≈ 25 à 35 jours d'agent, à découper)

| Étape | Apport | Effort | Risques |
|---|---|---|---|
| ⭐ **Carte de compréhension** | Il reste maître de son code | 5 j | Devenir une corvée : facultatif sauf pour les zones rouges |
| ⭐ **Garde d'écosystème partagé** | Un changement ne casse plus l'autre application en silence | 4 j | Carte à tenir à jour : l'agent propose, Beau valide |
| ⭐ **Fiche de décision pour le fondateur** + veto vocal | Beau valide sans lire le code | 3 j | Fiche trop optimiste : elle cite la preuve, pas l'avis de l'agent |
| ⭐ **Réunion d'agents avec procès-verbal** | Les désaccords se voient avant le code | 3 j | Coût de trois modèles : seulement pour les grosses tâches |
| **« Envoyer à l'atelier » / « continuer sur mon poste »** et **mode chez moi** | Le nuage et le poste se passent la main | 6 j | Relais chiffré ; jamais de terminal ouvert sans authentification (VS Code le rappelle lui-même) |
| **VS Code dans le navigateur** sur le bac à sable | L'éditeur complet, sans rien installer | 3 j | Lourd sur téléphone ; adresse protégée |
| **Mise en ligne en un geste** (adresse de test d'abord) | « Avec tout », comme Beau le veut | 3 j | Toujours Confirmer ; jamais la production sans accord |
| **Registre ACP** (Zed + JetBrains) | Visible par des millions d'utilisateurs de ces éditeurs | 2 j | Il faut une authentification conforme au registre |
| ⭐ **Payer comme chez soi**, ⭐ **mode données chères**, ⭐ **marché des compétences**, ⭐ **facture du freelance** | Un atelier pensé pour le monde entier | 8 à 12 j | Paiements : partenaires et règles de chaque pays ; Accounting seulement si Beau le décide |
| **Parler à l'atelier** (Jarvis) | Le côté magique | selon la partie 2 du plan du 24/09 | — |

---

## 8. Ce que Beau doit décider

1. **L'ordre** : d'accord pour mettre « la preuve » avant « le parallélisme » ?
2. **L'application GitHub** (V1) : je donnerai les clics.
3. **L'adresse des aperçus** : un domaine à lui avec sous-domaines génériques,
   ou les tunnels Cloudflare (plus simples, adresses publiques protégées par
   jeton).
4. **Les outils MCP de l'atelier** : dans `legion-mcp` (fonction edge commune à
   staging et production) ou sur le Worker de l'atelier. Aucun changement
   d'authentification Supabase n'est proposé en V1 (on garde les jetons `lg_…`
   qui existent). Si un jour on passe à OAuth, on **ajoute** une adresse de
   redirection, on ne touche **jamais** au Site URL, et on prévient pour
   Accounting.
5. **Les idées ⭐** à lancer en premier (ma préférence : carte de
   compréhension, carnet de fiabilité, garde d'écosystème).
6. **Le paiement local** (V2) : quels moyens, avec quels partenaires.

---

## 9. Sources (toutes lues le 24/09/2026)

**Études et sondages**
- Stack Overflow Developer Survey 2025, section IA [vérifié] : https://survey.stackoverflow.co/2025/ai
- Stack Overflow, communiqué du 29/07/2025 [vérifié] : https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/
- JetBrains, State of Developer Ecosystem 2025 (15/10/2025) [vérifié] : https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/ ; https://devecosystem-2025.jetbrains.com/artificial-intelligence
- METR, étude du 10/07/2025 [vérifié] : https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ ; article : https://arxiv.org/abs/2507.09089
- METR, mise à jour du 24/02/2026 [vérifié] : https://metr.org/blog/2026-02-24-uplift-update/
- « From Human-Centric to Agentic Code Review », 1,02 M de demandes de fusion (14/07/2026) [vérifié] : https://arxiv.org/html/2607.13196v1

**Ce qu'ils aiment, comment ils travaillent**
- Simon Willison, « Living dangerously with Claude » (22/10/2025) [vérifié] : https://simonwillison.net/2025/Oct/22/living-dangerously-with-claude/
- Anthropic, bac à sable de Claude Code (20/10/2025) [vérifié] : https://www.anthropic.com/engineering/claude-code-sandboxing
- Boris Cherny, fil sur son usage de Claude Code (janvier 2026, copie) [vérifié] : https://threadreaderapp.com/thread/2007179832300581177.html
- HN, « Is it actually possible to run multiple coding agents? » [vérifié] : https://news.ycombinator.com/item?id=47573483
- HN, « drowning in terminal tabs » (Pane) [vérifié] : https://news.ycombinator.com/item?id=47268777
- HN, ChatML (sessions parallèles, 750+ demandes de fusion) [vérifié] : https://news.ycombinator.com/item?id=47303711
- HN, « Parallel coding agents with tmux and Markdown specs » [vérifié] : https://news.ycombinator.com/item?id=47218318
- HN, « Embracing the parallel coding agent lifestyle » [vérifié] : https://news.ycombinator.com/item?id=45489884
- HN, sur Claude Code sur le web (« one click hooked up to VS Code ») [vérifié] : https://news.ycombinator.com/item?id=45649115
- HN, « async agents » [vérifié] : https://news.ycombinator.com/item?id=46948533
- HN, « AI made coding more enjoyable » [vérifié] : https://news.ycombinator.com/item?id=47075400
- HN, idées en promenade, téléphone [vérifié] : https://news.ycombinator.com/item?id=47292234
- Roland Meertens, « Two months as a vibe coder » (02/03/2026) [vérifié] : https://meertens.dev/blog/two-months-as-a-vibe-coder/
- exe.dev, « Six Months of Writing Code Exclusively With Agents » (27/08/2026) [vérifié] : https://blog.exe.dev/engineering-with-ai
- dev.to, avis sur Claude Code (12/09/2026) [vérifié] : https://dev.to/automate-archit/claude-code-changed-how-i-work-an-honest-developer-review-1dlj
- skeptrune, worktrees et tmux [vérifié] : https://www.skeptrune.com/posts/git-worktrees-agents-and-tmux/
- Build This Now, agents en parallèle (08/06/2026) [vérifié] : https://www.buildthisnow.com/ja/blog/guide/development/parallel-ai-agents-worktrees
- Morph, synthèse Reddit sur Claude Code (12/03/2026) [rapporté] : https://www.morphllm.com/claude-code-reddit
- Synthèses Reddit Claude Code / Codex (mai 2026) [rapporté] : https://umatechnology.org/claude-code-vs-codex-2026-what-500-reddit-developers-really-think/ ; https://codeculture.store/blogs/developer-culture/claude-code-vs-codex-reddit-community
- Copies de fils Reddit (juillet-août 2026) [rapporté] : https://reddit.sentinel-team.org/posts/1vahwvi/snapshots/2026-07-31T17%3A17%3A08.934833Z ; https://reddit.sentinel-team.org/posts/1vhc1c9/snapshots/2026-08-07T03%3A00%3A57.429261Z
- BSWEN, liste de souhaits tirée d'un fil Reddit (19/03/2026) [rapporté] : https://docs.bswen.com/blog/2026-03-19-advanced-ai-coding-gui-features/

**Ce qui les fait fuir**
- Agent qui supprime le test (16/09/2026) [vérifié] : https://dev.to/leoleroy/i-got-tired-of-coding-agents-saying-all-tests-pass-when-the-diff-said-otherwise-5ce9
- « The Agent Said Tests Passed » (27/05/2026) [vérifié] : https://medium.com/@latifvardar/the-agent-said-tests-passed-df9f184ddcb1
- Triche aux tests, fiche de Claude 3.7 et EvilGenie, cités (23/07/2026) [rapporté] : https://generativeai.pub/claude-code-is-optimizing-for-the-wrong-goal-anthropic-finally-proved-it-a8fd34f5fe3e
- « If the Agent Can See Every Test, Green Is Not Evidence » (20/09/2026) [vérifié] : https://dev.to/devpy_9520/if-the-agent-can-see-every-test-green-is-not-evidence-349m
- Ticket #32559, demandes d'autorisation sans fin [vérifié] : https://github.com/anthropics/claude-code/issues/32559
- Cursor, « Clarifying our pricing » (04/07/2025) [vérifié] : https://cursor.com/blog/june-2025-pricing
- TechCrunch (07/07/2025) [vérifié] : https://techcrunch.com/2025/07/07/cursor-apologizes-for-unclear-pricing-changes-that-upset-users/
- LeadDev, « The great AI coding assistant bait and switch » (27/08/2025) [vérifié] : https://leaddev.com/ai/the-great-ai-coding-assistant-bait-and-switch
- HN, « Clarifying our pricing » (05/07/2025) [vérifié] : https://news.ycombinator.com/item?id=44470148
- Contexte long : synlabs (21/01/2026) [vérifié] : https://www.synlabs.io/post/advanced-context-engineering-for-coding-agents ; nathanonn.com (01/05/2026) [vérifié] : https://www.nathanonn.com/claude-code-never-auto-compact/ ; buecking/incontext [vérifié] : https://github.com/buecking/incontext/blob/main/docs/foundations/smart-zone-and-dumb-zone.md
- Dette cognitive, HN [vérifié] : https://news.ycombinator.com/item?id=47196582 ; https://news.ycombinator.com/item?id=48091332 ; https://news.ycombinator.com/item?id=48419256 ; https://news.ycombinator.com/item?id=47020860
- Relecture, goulot : Pragmatic Engineer (08/09/2026) [vérifié] : https://newsletter.pragmaticengineer.com/p/what-is-happening-with-code-reviews ; CIO (11/08/2026) [vérifié] : https://www.cio.com/article/4207438/the-code-review-crisis-and-how-you-should-rebuild-review-models.html ; TQdev, chiffres Faros (17/08/2026) [rapporté] : https://www.tqdev.com/2026-code-review-is-the-new-bottleneck/ ; Stack Overflow blog (21/05/2026) [vérifié] : https://stackoverflow.blog/2026/05/21/coding-agents-are-giving-everyone-decision-fatigue/ ; hajek.no (18/06/2026) [vérifié] : https://hajek.no/posts/2026/review-bottleneck-ai-generated-code
- Spécifications : Böckeler (15/10/2025) [vérifié] : https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html ; GitHub Spec Kit (02/09/2025) [vérifié] : https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/ ; Kiro [vérifié] : https://kiro.dev/docs/specs.md ; HN « What happened to spec-driven development? » (08/08/2026) [vérifié] : https://news.ycombinator.com/item?id=49182353
- Payer depuis certains pays (sources commerciales) [rapporté] : https://evertry.co/blog/how-to-pay-for-claude-code-in-africa/ ; https://evertry.co/blog/how-to-pay-for-claude-ai-in-nigeria/ ; https://dev.to/subprime2010/claude-code-in-kenya-ksh260month-vs-ksh2600-for-chatgpt-39e5

**Sécurité**
- Cloud Security Alliance, Mini Shai-Hulud (16/05/2026) [vérifié] : https://labs.cloudsecurityalliance.org/research/csa-research-note-mini-shai-hulud-npm-supply-chain-20260516/ ; note PDF [vérifié] : https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/05/CSA_research_note_shai-hulud-ai-supply-chain_20260517-csa-styled.pdf
- Cloud Security Alliance, famille Shai-Hulud (25/04/2026) [vérifié] : https://labs.cloudsecurityalliance.org/research/csa-research-note-shai-hulud-npm-worm-ai-developer-supply-ch/
- Wiz, Shai-Hulud (16/09/2025) [vérifié] : https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack
- « claude-safe-yolo », limites d'un mode sans demandes sur Mac [vérifié] : https://gist.github.com/vladolaru/2154aa7c6d743d3c376c0418790ba4b9

**Se brancher au poste**
- Claude Code, Remote Control [vérifié] : https://code.claude.com/docs/en/remote-control
- Claude Code dans le nuage, `--cloud` et `--teleport` [vérifié] : https://code.claude.com/docs/en/claude-code-on-the-web
- Claude Code, démarrage web et tableau comparatif [vérifié] : https://code.claude.com/docs/en/web-quickstart
- Claude Code sur mobile [vérifié] : https://code.claude.com/docs/en/mobile
- VS Code, liens d'installation MCP (`vscode:mcp/install`) [vérifié] : https://code.visualstudio.com/api/extension-guides/ai/mcp ; serveurs MCP dans VS Code [vérifié] : https://code.visualstudio.com/docs/agent-customization/mcp-servers
- Cursor, liens d'installation MCP [vérifié] : https://cursor.com/docs/mcp/install-links
- VS Code Remote Tunnels [vérifié] : https://code.visualstudio.com/docs/remote/tunnels
- VS Code, sessions d'agent à distance [vérifié] : https://code.visualstudio.com/docs/agents/run/remote-agent-sessions
- ACP, introduction (agents distants « en cours ») [vérifié] : https://agentclientprotocol.com/overview/introduction ; clients [vérifié] : https://agentclientprotocol.com/get-started/clients
- Registre ACP : Zed (28/01/2026) [vérifié] : https://zed.dev/blog/acp-registry ; JetBrains (28/01/2026) [vérifié] : https://blog.jetbrains.com/ai/2026/01/acp-agent-registry/
- Cloudflare Sandbox, ports et aperçus (domaine générique requis ; tunnels conseillés) [vérifié] : https://developers.cloudflare.com/sandbox/api/ports/ ; sommaire de l'API (tunnels, sauvegardes, terminaux) [vérifié] : https://developers.cloudflare.com/sandbox/api/
- Happy, client mobile et voix pour Claude Code (blog, 14/06/2026) [vérifié] : https://blog.nathanwillson.com/coding-from-my-phone/
- Linear, sessions de code [vérifié] : https://linear.app/docs/coding-sessions ; annonce (11/06/2026) [vérifié] : https://linear.app/now/coding-sessions-for-linear-agent
- Codex dans Linear [vérifié] : https://developers.openai.com/codex/integrations/linear
- Cursor dans Slack [vérifié] : https://cursor.com/docs/integrations/slack

**Standards et outils**
- AGENTS.md [vérifié] : https://agents.md/ ; Linux Foundation, Agentic AI Foundation (09/12/2025) [vérifié] : https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
- HN, Claude Code et AGENTS.md [vérifié] : https://news.ycombinator.com/item?id=49367350
- Agent Trace [vérifié] : https://agent-trace.dev/ ; https://github.com/cursor/agent-trace ; Cognition (29/01/2026) [vérifié] : https://cognition.com/blog/agent-trace
- git-ai [vérifié] : https://github.com/git-ai-project/git-ai ; attribution par message (20/05/2026) [vérifié] : https://usegitai.com/blog/message-level-attribution
- Orchestrateurs d'agents, comparatifs [rapporté] : https://tomrochette.com/agents/orchestration-feature-matrix/ ; https://superset.sh/compare/conductor-vs-crystal ; https://nimbalyst.com/compare/nimbalyst-vs-conductor-vs-vibe-kanban/ ; https://agentsroom.dev/blog/best-multi-agent-coding-tools ; https://munderdiffl.in/blog/claude-code-orchestration-tools-compared/
- Tests séparés : correctless [vérifié] : https://github.com/joshft/correctless/ ; make-no-mistakes [vérifié] : https://github.com/momomuchu/make-no-mistakes ; motif « test à l'aveugle » [vérifié] : https://github.com/agentpatterns-ai/website/blob/main/patterns/multi-agent/independent-test-generation-multi-agent.md
- Coût avant la tâche : Budgetary [vérifié] : https://budgetary.tools/ ; preflight [vérifié] : https://glama.ai/mcp/servers/bulukaka/preflight/tree ; cost-guardian [vérifié] : https://github.com/Belkins/cost-guardian ; pi-agent-budget (yuans) [vérifié] : https://www.npmjs.com/package/pi-agent-budget ; dsh-cost-guard (heures creuses DeepSeek) [vérifié] : https://github.com/chenzhiyong1994/dsh-cost-guard
- Paiement mobile pour agents (serveurs MCP) [vérifié] : https://github.com/Tahsine/momo-mcp ; https://github.laiyagushi.com/gabrielmahia/mpesa-mcp
- Classements MCP [rapporté] : https://mcpvault.io/blog/best-mcp-servers-claude-code ; https://awesomeagents.ai/leaderboards/mcp-server-ecosystem-leaderboard/ ; https://artifacta.io/mcp-leaderboard

**Limites de cette recherche**
- Reddit n'a été lu qu'à travers des copies et des synthèses ([rapporté]).
- Pour les commentaires Hacker News, je donne le lien du fil ; la date exacte
  de chaque commentaire n'a pas toujours été relevée.
- Les chiffres Faros viennent d'un article qui les cite : le rapport original
  n'a pas été lu.
- « Pas trouvé » (idées ⭐) veut dire : pas trouvé dans les recherches listées
  ce jour-là. Un concurrent peut le faire sans l'avoir publié.
