# L'atelier : ce qu'on reprend des 5 prototypes de Beau

_25/09/2026. Beau a fait générer par Google AI Studio 5 maquettes d'« éditeur
de code avec des agents ». On a lu tout leur code, on les a construites et
photographiées, et on les compare à NOTRE atelier (écran
`src/screens/legion/atelier/`, Worker `atelier/src/`), dans l'état du commit
`246798b` (modes et terminaux du 25/09, 04 h 30)._

## En deux mots

- **Ce sont des maquettes.** Quatre sur cinq appellent vraiment Gemini, mais
  seulement si on leur donne une clé ET qu'on lance leur petit serveur. Sans
  clé, elles répondent avec des textes écrits d'avance. Tout le reste
  (terminal, Git, GitHub, base de données, déploiements, chiffres) est joué
  dans le navigateur : rien ne tourne pour de vrai.
- **La cinquième (« Finjaro Visual Studio Code ») n'appelle aucune IA**, alors
  que sa fiche le dit. C'est un éditeur, pas un agent.
- **Aucune ne parle d'organigramme**, et aucune ne permet d'ouvrir et fermer
  des terminaux (une seule a 3 onglets fixes).
- **Notre atelier est plus vrai qu'elles sur l'essentiel** : vrai bac à sable,
  vrais modèles, coût mesuré, cartes d'autorisation, 4 modes (dont « Tout
  autoriser »), terminaux qu'on ajoute et ferme. Ce qui nous manque, c'est
  surtout **l'habit VS Code** (onglets, barre d'activité, barre d'état,
  palette, recherche) et **l'équipe** (plusieurs agents qui se parlent,
  recrutement).
- **Au téléphone (390 px), aucune des cinq ne tient** : colonnes coupées, texte
  écrasé (captures `-tel`). Notre atelier, lui, passe déjà en onglets en bas.
- **On reprend les idées, pas le code** : il est en TypeScript avec un autre
  style, et plusieurs fichiers portent une licence Apache-2.0.
- **À ne jamais reprendre** : leurs chiffres inventés (« 1 420 étoiles »,
  « 12 ms à Francfort », « moral 88 % », « complexité réduite de 79 % »), et
  les visages de DevEcosystem, qui sont des photos prises sur Unsplash.

### Comment on les a construites

Les 5 se construisent, mais **pas tel quel** : `npm install` échoue (conflit
entre `esbuild ^0.25` et `vite 8.3.1`, qui veut `esbuild` 0.27 ou 0.28). Avec
`npm install --legacy-peer-deps`, puis `vite build`, les 5 passent. On les a
servies avec `vite preview` : ce mode sert seulement la page, pas leur serveur,
donc leurs appels `/api/...` échouent. **Les captures montrent donc l'état de
départ des maquettes**, avant toute réponse d'un agent. Aucune clé n'a été
mise.

Captures (1440×900 « ordi » et 390×844 « tel ») :
`/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad/ides/captures/`
(32 images ; le dossier de travail est temporaire, à recopier si on veut les
garder).

---

## 1. Finjaro Visual Studio Code

Captures : `1-finjaro-vscode-ordi.png`, `-ordi-palette`, `-ordi-git`,
`-ordi-recherche`, `-ordi-extensions`, `-ordi-debug`, `-ordi-apercu`, `-tel`.

**Ce que l'écran propose**
- Barre de titre avec menus (File, Edit, View, Run, Terminal, Help), une barre
  de recherche au centre (Ctrl+P) et un bouton Run.
- Barre d'activité à gauche : Explorateur, Recherche, Git (avec un compteur),
  Exécuter/Déboguer, Extensions, puis thèmes, réglages, profil.
- Explorateur : créer, renommer, supprimer fichiers et dossiers, exporter en .zip.
- Onglets de fichiers avec un point quand c'est modifié, fil d'Ariane
  (`projet › src › index.html`), numéros de ligne, minimap, points d'arrêt.
- Panneau du bas à 4 onglets : Terminal, Sortie, Problèmes, Console de débogage.
- Aperçu web côte à côte, avec la console de la page recopiée dans le terminal.
- Barre d'état : branche, erreurs et avertissements, port, Prettier, ligne et
  colonne, espaces, encodage, langage.
- Palette de commandes : lancer, aperçu, terminal, formater, nouveau fichier,
  export, 7 thèmes.
- Recherche et remplacement dans tout le projet ; vue Git (modifiés, indexer,
  commit, historique) ; 7 extensions ; réglages (police, tabulation, minimap…).
- Raccourcis : Ctrl+P, Ctrl+`, Ctrl+B, Ctrl+S, F5.

**Réel / simulé**
- Réel (dans le navigateur) : exécution du JavaScript avec sa console,
  aperçu HTML, recherche et remplacement, export .zip, thèmes.
- **Aucun appel à Gemini.**
- Simulé : le terminal est un petit interprète maison d'une quinzaine de
  commandes, pas un vrai shell ; Python renvoie un résultat écrit d'avance
  (des montants fixes) ; Git vit en mémoire avec des identifiants tirés au
  hasard ; « Prettier » ne fait que réindenter ; « ESLint / TypeScript »
  compte les accolades et les `console.log` ; les extensions sont des cases à
  cocher sans effet ; le débogueur ne s'arrête sur rien ; « Port 3000 » est
  écrit en dur.

**5 idées à reprendre**
1. La mise en page VS Code complète : barre d'activité à gauche, barre d'état en bas.
2. Les onglets de fichiers avec le point « modifié » et le fil d'Ariane.
3. Une palette qui mélange fichiers ET actions (lancer, formater, thème…).
4. La recherche / remplacement dans tout le projet.
5. Le panneau « Problèmes » cliquable qui mène à la ligne, avec le compteur
   d'erreurs dans la barre d'état.

---

## 2. Léo — refactorisation pour VS Code

Captures : `2-leo-refactoring-ordi.png`, `-ordi-palette`, `-ordi-quickfix`, `-tel`.

**Ce que l'écran propose**
- Un VS Code avec une icône « Léo » dans la barre d'activité, et un panneau à
  3 onglets : **Refactor**, **Rename**, **Ask Leo** (conversation).
- Refactor : 6 intentions en un clic (aplatir les `if` en « clauses de garde »,
  découper une fonction géante, moderniser, performance, types stricts,
  générer des tests), une consigne libre, « fichier entier » ou « sélection ».
- Au-dessus du code, des liens cliquables (« CodeLens ») : « Aplatir les
  conditions (complexité 19 → 3) », « Extraire », « Renommer (F2) », « Générer
  les tests » ; les noms mal choisis (`tmp`, `d`, `fn`) sont surlignés.
- Vue **avant / après côte à côte** avec « Accepter » et « Rejeter ».
- Menu « Correction rapide » (Ctrl+.) et fenêtre de renommage (F2) qui propose
  plusieurs noms.
- Panneau du bas : Problèmes, Console Léo, Tests unitaires, Terminal.
- « Export .VSIX » : montre et télécharge le code source d'une extension VS
  Code (package.json, extension.ts, refactorProvider.ts, renameProvider.ts,
  README).

**Réel / simulé**
- Réel : 3 appels à Gemini côté serveur (`/api/refactor`, `/api/rename`,
  `/api/chat`), avec clé seulement. Le calcul du diff et l'export .zip sont réels.
- Simulé : sans clé, les suggestions sont toutes faites et le code « refait »
  est **identique à l'original** ; « Lancer les tests » affiche après 0,8 s un
  texte écrit d'avance (3 tests verts) — **aucun test n'est lancé** ; les
  chiffres de complexité sont écrits en dur ou donnés par le modèle, jamais
  mesurés ; la console Léo est un texte fixe ; Recherche, Git et Réglages sont
  des écrans vides. Le code de l'extension n'a pas été vérifié (on ne sait pas
  s'il compile).

**5 idées à reprendre**
1. Les intentions en un clic (« Aplatir les if », « Ajouter des types »,
   « Écrire les tests ») au lieu d'une page blanche.
2. Les liens au-dessus des fonctions (CodeLens) qui lancent l'agent sur CETTE fonction.
3. L'avant / après côte à côte, Accepter / Rejeter, fichier par fichier.
4. La correction rapide Ctrl+. sur un mot ou une erreur.
5. Le renommage qui propose plusieurs noms, avec la raison de chacun.

---

## 3. CodeWhatsApp Studio

Captures : `3-codewhatsapp-ordi.png`, `-ordi-terminal`, `-ordi-palette`, `-tel`.

**Ce que l'écran propose**
- VS Code à gauche, **un panneau WhatsApp à droite** : un groupe
  (#core-dev-squad) et 4 agents en privé (Devin codeur, Archie architecte, Tux
  Linux, Ada contrôle qualité et sécurité).
- Bulles avec autocollants (« Works on my machine »), réactions emoji,
  « … écrit », note vocale, boutons rapides (refaire le fichier ouvert, revue
  d'architecture, contrôle qualité).
- **Une carte de modification DANS la bulle** : « Appliquer au code » et
  « Voir le diff » ; un bandeau apparaît dans l'éditeur quand une proposition
  attend pour le fichier ouvert.
- L'agent propose une commande Linux dans sa bulle, avec un bouton « Lancer ».
- « Demander à l'agent » depuis un fichier de l'explorateur ou une sélection de code.
- Terminal Linux en bas avec 3 onglets fixes (bash, python, htop) et des
  commandes rapides ; vue Git ; palette Ctrl+K.

**Réel / simulé**
- Réel : `/api/agents/chat` vers Gemini (avec clé), qui renvoie un message, un
  autocollant, une modification (le fichier entier) et une commande. Appliquer
  la modification dans l'éditeur marche (en mémoire).
- Simulé : sans clé, réponses choisies par mots-clés (un commentaire
  « Optimized by Devin » et un cache ajoutés au fichier) ; **le terminal est
  entièrement joué** (neofetch, ps, top, git, python : textes écrits d'avance ;
  « Kernel 6.8.0 », « AMD EPYC 9654 », « Uptime 4 days » inventés) ; la note
  vocale n'enregistre rien (une minuterie, puis une réponse écrite d'avance) ;
  « 4 agents actifs » est écrit en dur ; **un seul agent répond à la fois, les
  agents ne se parlent jamais entre eux**.

**5 idées à reprendre**
1. La conversation d'équipe façon WhatsApp à côté du code : un groupe + des privés.
2. La carte de modification dans la bulle (chez nous : c'est déjà la carte
   d'autorisation, il suffit de la mettre dans le fil de l'agent qui parle).
3. Le bandeau dans l'éditeur quand une proposition attend pour ce fichier.
4. « Demander à l'agent » sur une sélection de code ou un fichier (clic droit).
5. Les réactions rapides et le « … écrit » qui rendent l'équipe vivante.

---

## 4. DevHive Enterprise Studio

Captures : `4-devhive-ordi.png`, `-ordi-agent-hive`, `-ordi-github`,
`-ordi-supabase`, `-ordi-vercel`, `-ordi-vscode`, `-ordi-embauche`,
`-ordi-taches`, `-tel`.

**Ce que l'écran propose**
- Une barre du haut avec 6 vues : **Split Studio** (le code à gauche, un
  panneau à onglets à droite : chat, aperçu Vercel, GitHub, Supabase), VS Code,
  GitHub, Supabase, Vercel, Agent Hive ; un interrupteur « Simulating », « Hire
  Talent », « Task Agents ».
- Chat façon Slack : canaux #engineering, #watercooler (pause café),
  #hiring-interviews, #deployments ; 6 agents avec métier et pastille (Ada
  architecte, Dex full-stack, Maya design, Boris DevOps, Kiran base de données,
  Penny recruteuse) ; extraits de code dans les messages ; phrases rapides.
- GitHub : une demande de fusion (PR) avec description, fichiers changés,
  **revues des agents** (« Approved ») et bouton Fusionner ; onglets Code et Issues.
- Supabase : tables, éditeur SQL, schéma, auth. Vercel : aperçu, déploiements,
  journal de construction, « Redeploy ».
- **Portail d'embauche** : 3 candidats (note, compétences), « Entretien dans
  WhatsApp » ou « Embaucher directement ». L'entretien se passe dans
  #hiring-interviews : Penny accueille, Ada / Dex / Boris posent les questions.
  Embauché, l'agent rejoint la liste, on fête ça dans #engineering.
- **Task Agents** : on donne une consigne → Ada répartit → Dex modifie
  `App.tsx` → une PR s'ouvre → un déploiement part.

**Réel / simulé**
- Réel : 3 appels à Gemini (conversation, génération de code, entretien), avec clé.
- Simulé : GitHub, Supabase et Vercel sont des données en mémoire ; le SQL est
  un mini-interprète JavaScript, pas Postgres ; le déploiement est une
  minuterie ; le terminal répond avec des textes écrits d'avance ; la
  discussion « autonome » pioche toutes les 25 s une phrase dans une liste de
  4 ; **la réponse du candidat envoyée à Gemini est toujours la même phrase
  écrite en dur** ; l'agent qui répond est tiré au hasard ; « permissions
  GitHub, Supabase et Vercel accordées » à l'embauche est faux ; chiffres
  inventés (1 420 étoiles, 248 forks, 14 209 appels, contraste 7,8:1…).

**5 idées à reprendre**
1. Des canaux par sujet (travail, mises en ligne, recrutement, pause café) et
   la liste des agents avec leur état.
2. « Task Agents » : une consigne → un plan → du code → une PR → une mise en
   ligne, chaque étape racontée dans le canal par l'agent qui la fait.
3. La carte candidat : métier, compétences, « Entretien » ou « Embaucher ».
4. L'entretien en direct dans un canal, avec plusieurs agents qui interrogent.
5. La vue partagée : le code à gauche, un panneau à onglets à droite (chat,
   aperçu, GitHub, base de données).

---

## 5. DevEcosystem

Captures : `5-devecosystem-ordi.png`, `-ordi-vscode`, `-ordi-github`,
`-ordi-supabase`, `-ordi-vercel`, `-ordi-embauche`, `-tel`.

**Ce que l'écran propose**
- Une colonne d'outils à gauche (VS Code, GitHub, Supabase, Vercel, Agent
  Office) avec des pastilles ; en haut : équipe, « moral », « stress »,
  « Autonomous: Active », « Simulate Tick » (avancer d'un pas), « Hire Talent /
  Intern ».
- **Agent Office** : une fiche par agent (tâche en cours, jauges moral et
  stress, lignes écrites, revues, tâches) ; canaux #general, #pull-requests,
  #hiring-board, #standup ; bouton « Prompt Banter » ; **un bandeau « pic de
  charge : 3 tâches sans personne, les agents conseillent un stagiaire »** ;
  une colonne de candidats avec « Entretien » et « Embaucher ».
- Fenêtre d'embauche : un réservoir de 4 candidats, ou **« Créer un poste sur
  mesure / stagiaire »** (stagiaire front et tests, spécialiste des
  environnements de dev, DevOps, stagiaire contrôle qualité, SRE).
- VS Code : l'agent code une tâche, puis « ouvrir une PR ». GitHub : « demander
  une revue à l'IA », fusion → mise en ligne automatique. Supabase : tables,
  SQL, migrations, bascule RLS. Vercel : déploiements, journaux.

**Réel / simulé**
- Réel : 4 appels à Gemini (bavardage, entretien, code, revue de PR), avec clé.
- Simulé : le mode « autonome » est une minuterie de 14 s qui tire au hasard
  un agent et une action (dont des « lignes écrites » ajoutées au hasard) ;
  moral et stress sont inventés ; la fusion produit un déploiement « prêt en
  1,1 s » écrit d'avance (« 320 nœuds », « 48 modules ») ; les migrations ne
  s'exécutent pas ; RLS est une case à cocher ; un candidat « sur mesure » a
  toujours la note 90 ; **les visages sont des photos Unsplash** (ici, elles ne
  se chargent même pas : on voit des images cassées).

**5 idées à reprendre**
1. Le signal « trop de travail → recruter » déclenché par la charge RÉELLE
   (tâches sans personne), pas par un minuteur.
2. Le poste sur mesure : type de contrat + compétences + ce qu'il prendra en charge.
3. La fiche d'agent vivante : ce qu'il fait maintenant, et ses vrais chiffres
   (tâches finies, coût), jamais un « moral » inventé.
4. « Demander une revue » à un autre agent avant de fusionner.
5. Le bouton « un pas » (avancer d'une étape) à côté de l'interrupteur du mode auto.

---

## Ce que Beau veut voir, ce qu'on a, ce qui manque

| Ce que Beau veut voir | Montré par | Ce que notre atelier a déjà | Ce qui manque |
|---|---|---|---|
| **Barre d'activité** (icônes à gauche) | 1, 2, 3 | Trois colonnes fixes (fichiers / éditeur / conversation) ; au téléphone, 4 onglets en bas | La barre elle-même : Fichiers, Recherche, Modifications, Équipe, Réglages, qui changent la colonne de gauche |
| **Onglets de fichiers** | 1 à 5 | Un seul fichier ouvert à la fois ; point « • » quand il est modifié ; l'éditeur suit l'agent | Plusieurs onglets, fermer, point « modifié », l'onglet où écrit l'agent marqué de son visage |
| **Barre d'état** | 1, 2, 3 | Rien en bas ; le coût, le mode et le modèle sont dans la barre du haut | Ligne / colonne, langage, erreurs, mode actif, modèle, coût, nombre de modifications en attente |
| **Palette de commandes** | 1, 2, 3 | Non (proposition 16 du plan des 50) | Ctrl+K : fichiers + actions existantes (Présente-moi, Exporter, Nouveau terminal, Mode, Modèle, Stop) |
| **Recherche** | 1, 3 | Dans le fichier ouvert : Ctrl+F (fourni par CodeMirror). Dans tout le projet : l'agent sait chercher (outil `chercher` du Worker), l'humain non | Un panneau Recherche (+ remplacer), résultats cliquables |
| **Git** | 1, 3 (local) ; 4, 5 (GitHub joué) | « Modifications » (vert / rouge par fichier depuis le début de la séance), Journal, export .zip ; l'application GitHub est prête (plan des 50, n° 42) | Vue « Source » : points de retour et « revenir ici » (n° 32) ; puis branche `leo/…` et PR après Confirmer (n° 43) |
| **Extensions** | 1, 2 | Rien dans l'atelier ; Léo a Compétences et Connecteurs ailleurs | Un panneau qui montre ce que l'agent sait faire ici (compétences, connecteurs) — pas un faux magasin |
| **Terminaux multiples qu'on ouvre et ferme** | 3 (3 onglets fixes) ; aucun n'en ajoute | ✅ depuis le 25/09 04 h 30 : onglet « Agent » + terminaux qu'on ajoute (+), ferme (×), agrandit ; l'humain tape dans le vrai bac à sable (liste « toujours refusé » et plafond maintenus) | La liste des terminaux se perd au rechargement ; chaque commande repart du dossier du projet (un `cd` ne tient pas d'une commande à l'autre) ; pas d'historique (flèche haut) ni d'arrêt d'une commande longue ; pas encore le panneau « Tâches en arrière-plan » demandé par Beau |
| **Recrutement, portail d'embauche** | 4, 5 | Dans Léo (pas dans l'atelier) : Renfort (renforcer un service, expert pour une mission, intérimaires avec date de fin), agents avec visage. Dans l'atelier : un seul Codeur | « Demander du renfort » depuis l'atelier (n° 35), l'entretien = un vrai petit exercice noté (n° 39) |
| **Équipe qui se parle façon WhatsApp** | 3, 4, 5 | Léo a les salons façon WhatsApp Web, le tableau des tâches et `legion-travail`. L'atelier : une conversation humain ↔ un agent | Plusieurs agents dans la conversation de l'atelier, chacun avec son visage, « … écrit », passage de relais écrit (n° 38) |
| **Vue GitHub** | 4, 5 | Application GitHub vérifiée ; connecteur GitHub (tickets) dans Léo | Importer un dépôt, travailler sur une branche, PR après Confirmer, liste des PR et revues |
| **Vue Supabase** | 4, 5 | Rien | Connecter SON projet (n° 44) : tables en lecture, migrations proposées sur carte. Jamais le projet Finjaro partagé |
| **Vue Vercel** | 4, 5 | Aperçu dans un cadre isolé, page ouverte à part, largeur téléphone | Mettre en ligne sur SON Vercel / Cloudflare après Confirmer (n° 44), avec les vrais journaux |
| **Organigramme** | aucun (4 et 5 n'ont qu'une liste d'agents) | Léo a déjà l'organigramme et le bureau vivants (`parties/Vues.jsx`, export SVG) — hors de l'atelier | L'ouvrir depuis l'atelier, limité aux agents du projet et à leur tâche réelle (n° 37, « les locaux ») |
| **Mode auto** | 4 (« Simulating »), 5 (« Autonomous » + « Simulate Tick ») : minuteries au hasard | ✅ 4 vrais modes : Demander, Accepter les modifs, Tout autoriser, Réfléchir ; « Tout autoriser » aussi sur la carte ; liste « toujours refusé » et réseau fermé maintenus | Le mode actif visible en permanence (barre d'état), un bouton « un pas », et le travail qui continue écran fermé (tâches en arrière-plan) |

---

## Les 15 éléments à construire en premier (dans NOTRE code)

Ordre : d'abord l'habit VS Code (ce que Beau demande depuis le 25/09, 03 h),
puis l'équipe. Difficulté : **facile** (moins d'une demi-journée), **moyen**
(une journée), **difficile** (plusieurs jours, touche le Worker et la boucle).
`Atelier.jsx` fait déjà 689 lignes : chaque nouveau morceau va dans son propre
fichier. La colonne « Qui » suit la règle du partage avec les agents de Léo
(CLAUDE.md §10) ; tout livrable d'agent est relu avant d'être annoncé.

| # | Quoi | Inspiré de | Fichiers touchés | Difficulté | Qui |
|---|---|---|---|---|---|
| 1 | **Onglets de fichiers** : plusieurs fichiers ouverts, point « modifié », fermer, l'onglet de l'agent avec son visage | 1, 2, 3 | `Atelier.jsx` (une liste `ouverts` au lieu d'un seul `fichier`), nouveau `atelier/Onglets.jsx`, `Editeur.jsx` (garder l'historique d'annulation par onglet) | Moyen | Moi |
| 2 | **Barre d'état** : ligne / colonne, langage, mode, modèle, coût, erreurs, modifications en attente | 1, 2 | nouveau `atelier/BarreEtat.jsx`, `Editeur.jsx` (remonter la position du curseur), `Atelier.jsx`, `src/locales/fr` et `en` | Facile | Agent de Léo |
| 3 | **Palette Ctrl+K** : fichiers (recherche floue) + actions déjà là (Présente-moi, Exporter, Nouveau terminal, Mode, Modèle, Stop) | 1, 2, 3 | nouveau `atelier/Palette.jsx`, `Atelier.jsx` (raccourcis clavier), locales | Facile | Agent de Léo |
| 4 | **Barre d'activité** à gauche (Fichiers, Recherche, Modifications, Équipe, Réglages) ; au téléphone, on garde les onglets du bas | 1, 2, 3 | nouveau `atelier/BarreActivite.jsx`, `Atelier.jsx` (grille), `Parties.jsx` (Modifications en panneau latéral, plus en feuille) | Moyen | Moi |
| 5 | **Recherche dans tout le projet** (+ remplacer, qui passe par l'enregistrement normal) | 1, 3 | `atelier/src/atelier.js` (route `GET /projets/:id/recherche`, en réutilisant l'outil `chercher` de `boucle.js`), nouveau `atelier/Recherche.jsx`, `atelier/test/` | Moyen | Agent de Léo (difficile, pour l'entraîner) |
| 6 | **Erreurs soulignées + onglet « Problèmes »** (JSON, JS, CSS, Python par l'arbre de syntaxe de CodeMirror), avec « Corriger » et « Expliquer » qui écrivent au Codeur (n° 12 et 13) | 1, 2 | `Editeur.jsx` (`@codemirror/lint`, déjà installé avec `codemirror` : à déclarer dans `package.json`), panneau du bas dans `Atelier.jsx`, `BarreEtat.jsx`, locales | Moyen | Moi |
| 7 | **Avant / après côte à côte** avec Accepter / Refuser, depuis la carte d'autorisation (n° 17) | 2, 3 | nouveau `atelier/Comparer.jsx` (`@codemirror/merge`, licence MIT : nouvelle dépendance dans `package.json`), `Parties.jsx` (bouton sur la `Carte`) | Moyen | Moi |
| 8 | **« Demander à l'agent » sur une sélection** : Expliquer, Corriger, Ajouter des types, Écrire les tests, Simplifier les `if` — le message part avec le chemin et les lignes | 2, 3 | `Editeur.jsx` (sélection → rappel), `Atelier.jsx` (`envoyer`), locales | Facile | Agent de Léo |
| 9 | **Terminaux, suite** : garder la liste par projet, un dossier courant par terminal (le `cd` tient), historique flèche haut, arrêter une commande longue | 3 | `Atelier.jsx` (ou nouveau `atelier/PanneauBas.jsx`), `atelier/src/atelier.js` (route `commande` : `terminal`, `dossier`), `atelier/src/bac.js` (dossier de départ), tests | Moyen | Moi |
| 10 | **Panneau « Tâches en arrière-plan »** (carnet du 25/09) : ce qui tourne (agent, commandes), depuis quand, coût, lien vers le détail, les terminées | Claude Code (capture de Beau) | `atelier/src/atelier.js` (la vue renvoie les tâches en cours), `PanneauBas.jsx`, locales | Moyen | Moi |
| 11 | **Plusieurs agents dans la conversation**, façon WhatsApp : chaque bulle avec le visage et le nom de SON agent, « … écrit », passage de relais écrit (ce qui est fait, ce qui reste) | 3, 4, 5 | `atelier/src/boucle.js` (un `agent` par message, le relais), `atelier/src/atelier.js` (l'équipe du projet), `Atelier.jsx` (visage par auteur), `Entreprise.jsx` (passer l'équipe au lieu d'un seul `codeur`) | Difficile | Moi |
| 12 | **« Demander du renfort »** depuis l'atelier (n° 35) : carte « Faire venir un stagiaire pour les tests » → Mentor (RH) comme dans Renfort, la recrue arrive avec son visage. Toujours sur carte, même en « Tout autoriser » | 4, 5 | `atelier/src/boucle.js` (outil `demander_renfort`), `atelier/src/politique.js` (toujours une carte), `atelier/src/atelier.js`, `Parties.jsx` (carte de renfort), logique reprise de `parties/Renfort.jsx` ; migration **additive** si une table manque | Difficile | Moi (dire à Beau avant si migration : projet Supabase partagé) |
| 13 | **Le vrai entretien d'embauche** (n° 39) : un petit exercice avec tests cachés, lancé dans le bac ; on MESURE (tests passés, temps, coût) — l'inverse de DevHive et sa réponse écrite en dur | 4, 5 | nouveau `atelier/src/entretien.js` + `atelier/test/entretien.test.js`, `atelier/src/atelier.js` (route), `Parties.jsx` (bulletin) | Difficile | Agent de Léo (tâche difficile), relu par moi |
| 14 | **Vue « Source »** façon Git : les modifications de la séance (existe), « poser un point de retour » et « revenir ici » (n° 32) — avant de parler de GitHub | 1, 3 | `atelier/src/atelier.js` (routes points : copie des fichiers dans le Durable Object), `Parties.jsx` (`Modifications` devient ce panneau), `Atelier.jsx`, tests | Moyen | Agent de Léo |
| 15 | **L'équipe du projet et son organigramme** dans l'atelier (n° 37) : ouvrir le bureau / l'organigramme de Léo limité aux agents du projet, avec leur vraie tâche en cours | 4, 5 | `Atelier.jsx` (bouton Équipe de la barre d'activité), `parties/Vues.jsx` (un filtre par agents), `Entreprise.jsx` | Facile | Agent de Léo |

### Juste après les 15

- **GitHub, Supabase, Vercel / Cloudflare branchés pour de vrai** (n° 43 et 44).
  Pas en premier parce que ça touche l'authentification et les adresses de
  retour : **à dire à Beau avant**, en nommant Finjaro Accounting (CLAUDE.md
  §8). On AJOUTE des adresses aux Redirect URLs ; le Site URL ne bouge jamais.
- **Les thèmes** (n° 19) : le bleu nuit de Léo et le crème vintage de Beau.
- **Les CodeLens** au-dessus des fonctions (idée du prototype 2), une fois
  les onglets et la sélection en place.

## Ce qu'on ne reprend pas

- Les chiffres inventés (moral, stress, étoiles, latences, « complexité −79 % »).
- Les tests « verts » affichés sans rien lancer : chez nous, un test vert vient du bac.
- Le terminal joué (neofetch inventé) : le nôtre est un vrai bac à sable.
- Les minuteries qui font « parler » les agents au hasard : chez nous, un
  message d'agent est un vrai appel à un modèle, avec son coût.
- Les visages pris sur le web.
- La mise en page ordinateur seule : tout ce qu'on ajoute doit tenir à 390 px
  (onglets du bas) ET se vérifier sur grand écran.
