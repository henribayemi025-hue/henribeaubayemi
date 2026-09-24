# L'atelier de Léo : 300 propositions pour voir les agents travailler

_Écrit le 24/09/2026 au soir, après le premier essai de l'atelier par Beau.
Ce qu'il a demandé, avec ses mots : voir les agents écrire **au milieu**, dans
l'éditeur (ouvrir les fichiers, cliquer dedans, taper le code en direct, créer
des fichiers, importer des bibliothèques) ; voir la **photo de profil** des
agents dans la conversation ; **Jupyter et Python** « comme Google Colab » ;
« un vrai truc comme **VS Code**, mais encore plus amélioré, comme **Claude
Code** » (couleurs du code, erreurs soulignées…) ; puis voir les agents **se
parler et travailler en équipe** (managers, stagiaires) en direct. Et « 300
exemples / propositions » tirés d'Internet._

_Ce document s'ajoute aux trois plans existants, qu'il ne répète pas :
`2026-09-24-atelier-de-code-et-jarvis.md` (comparatif, sécurité, Jarvis),
`2026-09-25-atelier-v1-developpeurs.md` (étapes V1) et
`2026-09-25-atelier-ce-que-les-devs-aiment.md` (37 propositions). Les idées
déjà écrites là-bas (rembobiner, dossier de preuve, coût comme contrat, QR
code, visite guidée, `TODO(moi)`, Rigo le relecteur, réunion avec
procès-verbal, heures creuses, carte de compréhension, etc.) ne sont **pas**
recomptées ici. Rien n'est codé._

**Comment lire les marques**

- **[vérifié]** : j'ai lu la page elle-même le 24/09/2026 (ou le contenu du
  paquet logiciel lui-même, pour les versions et les licences).
- **[rapporté]** : je n'en ai lu qu'un résumé de moteur de recherche. À relire
  avant de s'en servir en public.
- **⭐** : je ne l'ai trouvée **nulle part** dans mes recherches du 24/09.
  « Pas trouvé » ne veut pas dire « n'existe nulle part ».
- **Aucun chiffre n'est inventé.** Les difficultés de la partie 3 sont des
  **estimations** de ma part, pas des mesures.
- **YouTube et Reddit** : je n'ai pas regardé les vidéos ni lu Reddit
  directement ; je cite ce qu'en disent des pages publiques, marqué
  [rapporté]. Hacker News, GitHub, les blogs et les documentations ont été
  consultés par recherche, et les plus importantes lues en entier.

---

## 0. Ce que notre code fait aujourd'hui (vérifié dans le dépôt)

Pour que les propositions partent du réel :

- **L'éditeur** (`src/screens/legion/atelier/Editeur.jsx`) est CodeMirror 6,
  avec les couleurs de Léo. Quand l'agent change un fichier, il **remplace
  tout le texte d'un coup** (`changes: { from: 0, to: …, insert }`) : rien ne
  « s'écrit ». Et il passe **entièrement en lecture seule** dès que l'agent
  travaille (`lectureSeule={travaille}` dans `Atelier.jsx`).
- **L'écran** (`Atelier.jsx`) redemande l'état au Worker **toutes les
  2 secondes**. Il n'y a pas de flux en direct. Donc « voir taper en direct »
  demande soit une **animation fidèle du vrai changement** (faisable tout de
  suite), soit un **flux** du Worker vers l'écran (plus long ; partie 3,
  n° 20).
- **Le Worker** (`atelier/src/boucle.js`) sait déjà, pour chaque action, quel
  outil a servi et sur quel fichier (`affichage` : `outil`, `resume` = le
  chemin). Pour une écriture en attente, la carte contient le **diff** calculé
  par `atelier/src/diff.js`, et l'**explication** de l'agent.
- **Les messages de l'agent n'ont pas de visage** : l'atelier parle d'un
  « Codeur » anonyme. Or Léo a déjà des agents avec photo (`legion_agents.avatar_url`)
  et le composant `src/screens/legion/parties/Visage.jsx`.
- **Le bac à sable** : `@cloudflare/sandbox` **0.12.10**. J'ai ouvert le paquet
  lui-même : il contient déjà `terminal()` (un vrai terminal par WebSocket),
  l'extension `@cloudflare/sandbox/xterm` pour xterm.js, `runCode()` et
  `createCodeContext()` (interpréteur Python/JavaScript avec résultats riches :
  images, HTML, tableaux), `watch()` (surveillance des fichiers), `execStream()`
  (sortie en direct), `createBackup()`/`restoreBackup()` et `exposePort()`.
  **[vérifié]** Aucune mise à jour du paquet n'est donc nécessaire pour les
  propositions de la partie 3.

---

## 1. Ce qui rend chaque outil « magique » à regarder (en 10 lignes)

1. **Zed** : on clique sur une cible et l'on « suit » l'agent : l'éditeur saute dans chaque fichier qu'il lit ou modifie ; ses changements arrivent par le même canal que ceux des collègues humains. [Zed, doc Agent Panel](https://zed.dev/docs/ai/agent-panel) [vérifié]
2. **Cursor** : jusqu'à plusieurs agents en parallèle, chacun dans sa copie du projet ; un navigateur intégré ; le **Design Mode** où l'on clique, dessine ou parle sur l'application et l'agent change le code, rechargé aussitôt. [Cursor, Design Mode, 05/06/2026](https://cursor.com/blog/design-mode) [vérifié]
3. **Replit Agent** : il teste l'application dans un vrai navigateur (clics, formulaires) et rend une **vidéo rejouable** avec des chapitres. [Replit, App Testing](https://docs.replit.com/replitai/app-testing) [vérifié]
4. **Devin, OpenHands** : on voit **en même temps** le terminal qui défile, l'éditeur, le navigateur et le plan, et on peut prendre la main. [Devin](https://docs.devin.ai/work-with-devin/devin-session-tools), [OpenHands](https://docs.openhands.dev/openhands/usage/key-features) [rapporté]
5. **Bolt / StackBlitz** : tout tourne dans l'onglet (WebContainers) ; l'aperçu se met à jour **pendant** que le code s'écrit. [StackBlitz](https://blog.stackblitz.com/posts/introducing-webcontainers/) [rapporté]
6. **Lovable, v0** : on clique sur un élément de l'aperçu et on le change **sans passer par l'IA** (donc sans coût). [Lovable](https://lovable.dev/blog/introducing-visual-edits), [v0](https://community.vercel.com/t/introducing-design-mode-on-v0/13225) [rapporté]
7. **Claude Code, Codex, GitHub** : de vraies **équipes** (un chef, des coéquipiers qui se parlent, une liste de tâches partagée) et des journaux en direct qu'on peut réorienter en cours de route. [Claude Code, agent teams](https://code.claude.com/docs/en/agent-teams), [GitHub mission control](https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/) [vérifié]
8. **Colab (Gemini), Jupyter AI, marimo** : l'agent propose un plan, écrit et **exécute les cellules**, lit ses erreurs et corrige ; marimo relance tout seul ce qui dépend d'une cellule. [Colab](https://docs.cloud.google.com/colab/docs/use-data-science-agent), [marimo](https://marimo.io/) [rapporté]
9. **Warp, Aider, Cline, Roo, Kilo** : terminal en **blocs**, tests et lint relancés après chaque modification, point de retour après chaque outil, un chef d'orchestre qui découpe en sous-tâches. [Aider](https://aider.chat/docs/usage/lint-test.html), [Roo](https://docs.roocode.com/features/boomerang-tasks) [rapporté]
10. **Pixel Agents, AI Town, ChatDev** : les agents deviennent des **personnages** qui tapent, lisent, lèvent la main quand ils attendent, se réunissent ; on rejoue la journée de l'entreprise. [Pixel Agents (MIT)](https://github.com/pixel-agents-hq/pixel-agents) [vérifié], [ChatDev](https://github.com/openbmb/ChatDev) [rapporté]

---

## 2. Les 300 propositions

### A. L'agent visible dans l'éditeur (1 à 40)

1. **L'écriture animée** : quand l'agent modifie un fichier, le texte s'écrit sous nos yeux dans l'éditeur, à partir du vrai changement (pas d'une vidéo). _Inspiration : [Zed](https://zed.dev/docs/ai/agent-panel)_
2. **Le curseur de l'agent** : un curseur de sa couleur, avec sa photo et son prénom, qui se déplace là où il écrit, comme les curseurs des collègues. _Inspiration : [y-codemirror.next](https://github.com/yjs/y-codemirror.next), [Replit](https://docs.repl.it/replit-workspace/workspace-features/multiplayer)_
3. **Suivre l'agent** : un bouton « cible » ; l'éditeur ouvre tout seul chaque fichier que l'agent lit ou modifie. _Inspiration : [Zed](https://zed.dev/docs/ai/agent-panel)_
4. **Lâcher la main** : dès qu'on touche au clavier ou à la souris, le suivi s'arrête et un bouton « Reprendre le suivi » apparaît, avec un liseré de la couleur de l'agent tant qu'on le suit. _Inspiration : [Replit, mode observation](https://docs.repl.it/replit-workspace/workspace-features/multiplayer)_
5. **Les onglets de l'agent** : chaque fichier touché s'ouvre en onglet, marqué d'un œil (lu) ou d'un crayon (modifié).
6. **Le balayage de lecture** : les lignes que l'agent lit s'éclairent brièvement, pour voir ce qu'il regarde.
7. **La proposition en place** : en mode « Demander », le changement proposé s'affiche **dans le fichier** (vert ajouté, rouge retiré) avec Autoriser / Refuser juste au-dessus. _Inspiration : [VS Code](https://code.visualstudio.com/docs/agents/run/review-code-edits), [@codemirror/merge](https://github.com/codemirror/merge)_
8. **Accepter bloc par bloc** : garder un morceau du changement et refuser l'autre, dans le même fichier. _Inspiration : [Zed](https://zed.dev/docs/ai/agent-panel)_
9. **La vitesse de frappe réglable** : lente (pour apprendre), normale, instantanée.
10. **Le bouton « Passer »** : saute l'animation et montre le résultat final.
11. **Les traits dans la marge** : dans l'ascenseur à droite, des traits verts et rouges disent où l'agent a écrit dans un long fichier. _Inspiration : VS Code, [@replit/codemirror-minimap](https://www.npmjs.com/package/@replit/codemirror-minimap)_
12. **La pastille d'auteur** : dans la marge, le petit visage de l'agent sur chaque ligne qu'il a écrite. _Inspiration : `git blame`, Agent Trace (plan du 25/09)_
13. **Le survol qui raconte** : survoler une ligne affiche « écrite par Plume à 21 h 14, pour la demande : ajoute le panier ».
14. **La bulle de pensée** : au-dessus du curseur de l'agent, une phrase courte : « je cherche où est calculé le total ». _Inspiration : [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents)_
15. **La naissance d'un fichier** : le nouveau fichier apparaît dans l'arbre avec un petit éclat, s'ouvre vide, puis se remplit.
16. **La suppression visible** : le fichier supprimé se barre et s'estompe dans l'arbre ; « Annuler » pendant quelques secondes.
17. **Le renommage animé** : un fichier déplacé glisse d'un dossier à l'autre dans l'arbre.
18. **L'arbre vivant** : un point qui palpite à côté du fichier que l'agent touche en ce moment, et sur ses dossiers parents.
19. **La barre d'état de l'agent**, en bas de l'éditeur comme dans VS Code : « Plume · lit src/panier.js · 0,03 $ ».
20. **Le fil d'Ariane** : les derniers fichiers visités par l'agent, cliquables.
21. **L'import en deux temps** : quand l'agent ajoute une bibliothèque, on voit la ligne `import` s'écrire en haut du fichier **et**, à côté, la bibliothèque s'ajouter dans `package.json`.
22. **L'écran partagé automatique** : quand l'agent modifie deux fichiers liés (un composant et son test), l'éditeur se divise en deux.
23. **La recherche visible** : quand l'agent cherche un mot, le panneau de recherche s'ouvre avec les résultats surlignés, comme si on l'avait fait soi-même. _Inspiration : VS Code_
24. **La lecture seule ciblée** : seul le fichier que l'agent écrit est bloqué ; les autres restent modifiables (aujourd'hui, tout l'éditeur se bloque dès que l'agent travaille).
25. **Pas de vol de clavier** : si l'humain écrit dans un fichier, l'agent ne peut pas l'ouvrir de force ; ses changements attendent dans un onglet voisin.
26. **Le conflit montré** : si l'humain et l'agent changent la même ligne, les deux versions côte à côte, « garder la mienne / la sienne ».
27. **Le film de la session** : rejouer tout le travail de l'agent comme une vidéo (fichiers, frappe, commandes) avec une barre de temps. _Inspiration : [ChatDev, replay](https://github.com/openbmb/ChatDev), [Replit](https://docs.replit.com/replitai/app-testing)_
28. **Les chapitres du film** : chaque étape du plan est un chapitre cliquable. _Inspiration : [Replit](https://docs.replit.com/replitai/app-testing)_
29. **« Demande-moi avant ce fichier »** : clic droit sur un fichier → l'agent devra demander avant d'y toucher, même en mode libre. _Inspiration : [Cline](https://docs.cline.bot/features/auto-approve)_
30. **Sélectionner et demander** : surligner des lignes → « Demander à l'agent » ; la demande part avec l'emplacement exact.
31. **Les commentaires `// léo:`** : écrire un commentaire spécial dans le code ; l'agent le voit et agit. _Inspiration : [Aider, commentaires IA](https://aider.chat/HISTORY.html)_
32. **Montrer du doigt pendant qu'il travaille** : cliquer une ligne pendant que l'agent code ajoute « regarde ici » à sa file de messages. _Inspiration : [Cursor](https://cursor.com/blog/design-mode)_
33. **Écrire sans interrompre** : les messages envoyés pendant que l'agent travaille attendent son prochain pas. _Inspiration : [Zed, messages en file](https://zed.dev/docs/ai/agent-panel)_
34. **Les marque-pages « à vérifier »** : l'agent pose une icône dans la marge là où il n'est pas sûr de lui.
35. **L'explication au survol d'un bloc** : l'« explication » que l'agent écrit déjà pour chaque modification s'affiche en survolant le bloc vert.
36. **Avant / maintenant en un geste** : basculer le fichier entre son état au début de la session (la « photo » existe déjà dans le Worker) et maintenant.
37. **Le compteur par fichier** : `+12 −3` à côté de chaque fichier dans l'arbre, mis à jour en direct. _Inspiration : [Zed](https://zed.dev/docs/ai/agent-panel)_
38. ⭐ **Le bruit de frappe** : un son discret (désactivable) quand l'agent écrit, pour « l'entendre travailler » sans regarder.
39. **Le visage sur l'onglet** : une petite pastille avec la photo de l'agent sur l'onglet du fichier qu'il a ouvert.
40. **Plusieurs curseurs dans le même fichier** : quand deux agents y travaillent, chacun sa couleur. _Inspiration : [Zed, multijoueur](https://www.digitalapplied.com/blog/zed-ai-coding-deep-dive-multiplayer-agents-2026)_

### B. Un éditeur façon VS Code (41 à 75)

41. **Les couleurs pour plus de langages** : TypeScript, Markdown, SQL, YAML (paquets `@codemirror/lang-*`, MIT). Aujourd'hui : JS, Python, HTML, CSS, JSON.
42. **Les erreurs de syntaxe soulignées** en vaguelettes rouges, sans serveur (l'analyseur de CodeMirror les repère déjà), et les erreurs JSON. _Inspiration : [@codemirror/lint](https://codemirror.net/)_
43. **Python vérifié en direct** par Ruff compilé pour le navigateur. _Inspiration : [Ruff playground](https://github.com/astral-sh/ruff/blob/main/playground/README.md)_
44. **JavaScript vérifié** par ESLint dans le navigateur. _Inspiration : `eslint-linter-browserify`, fonction `esLint()` de `@codemirror/lang-javascript`_
45. **TypeScript : les erreurs de types** dans le navigateur. _Inspiration : [@valtown/codemirror-ts](https://www.npmjs.com/package/@valtown/codemirror-ts)_
46. **Les diagnostics du bac à sable** : après chaque écriture, le Worker lance `ruff check` ou `tsc` et renvoie les erreurs, soulignées au bon endroit.
47. **Le panneau « Problèmes »** : toutes les erreurs du projet en liste, cliquables. _Inspiration : VS Code_
48. **« Corriger » et « Expliquer » partout** : une ampoule sur chaque erreur (éditeur, cellule, terminal) ; « Expliquer » en français simple, « Corriger » demande à l'agent. _Inspiration : [Colab](https://docs.cloud.google.com/colab/docs/explain-errors)_
49. **Les liens dans les erreurs** : `panier.js:42` dans un message ouvre le fichier à la ligne 42. _Inspiration : VS Code_
50. **Le survol intelligent** (type, documentation) grâce à un serveur de langage qui tourne dans le bac à sable. _Inspiration : [@codemirror/lsp-client](https://github.com/codemirror/lsp-client)_
51. **Aller à la définition** (Ctrl + clic). _Même base._
52. **Renommer partout** (F2). _Même base._
53. **La suggestion en texte fantôme** : l'IA propose la suite en gris, Tab pour accepter. _Inspiration : [codemirror-copilot](https://github.com/asadm/codemirror-copilot)_
54. **La prochaine modification** : Tab saute au prochain endroit qu'il faudrait changer. _Inspiration : [Copilot NES](https://github.blog/changelog/2025-02-06-next-edit-suggestions-agent-mode-and-prompts-files-for-github-copilot-in-vs-code-january-release-v0-24/)_
55. **La palette de commandes** (Ctrl + Maj + P) : « Ouvrir », « Lancer les tests », « Demander à l'agent ». _Inspiration : VS Code_
56. **L'ouverture rapide** (Ctrl + P) avec recherche approximative du nom.
57. **Chercher et remplacer dans tout le projet** (le Worker sait déjà chercher).
58. **Plusieurs onglets et l'écran divisé** à la main.
59. **L'aperçu Markdown** à côté d'un fichier `.md`.
60. **Formater** le fichier (Prettier, Ruff) d'un clic ou à l'enregistrement.
61. **Le mode Vim** pour ceux qui y tiennent. _Inspiration : [@replit/codemirror-vim](https://www.npmjs.com/package/@replit/codemirror-vim)_
62. **Les guides d'indentation** (traits verticaux). _Inspiration : `@replit/codemirror-indentation-markers`_
63. **La mini-carte** du fichier. _Inspiration : `@replit/codemirror-minimap`_
64. **« Tout plier / tout déplier »** les fonctions.
65. **Le plan du fichier** : la liste des fonctions et classes, cliquable.
66. **Le thème crème pour le jour**, en plus du bleu nuit : même laiton, même terracotta (le style de Beau).
67. **La sauvegarde de brouillon** automatique dans le navigateur, et le point « non enregistré ».
68. **L'historique d'un fichier** : toutes ses versions, et qui les a écrites. _Inspiration : [VS Code, Timeline](https://code.visualstudio.com/docs/copilot/chat/chat-checkpoints)_
69. **Comparer deux versions** côte à côte. _Inspiration : `MergeView` de [@codemirror/merge](https://github.com/codemirror/merge)_
70. **Git dans l'éditeur** : branche, fichiers changés, diff (quand GitHub sera branché).
71. **Les raccourcis de VS Code** : Ctrl + D (plusieurs curseurs), Alt + ↑ (déplacer une ligne) ; CodeMirror les a presque tous.
72. **Les visionneuses** : images, PDF, CSV en tableau, au lieu de texte brut.
73. **Les parenthèses colorées par paires.** _Inspiration : VS Code_
74. **La question au projet** : « où est géré le paiement ? » → une liste de lignes cliquables. _Inspiration : [Tabby, Answer Engine](https://github.com/TabbyML/tabby)_
75. **Les réglages qui suivent le compte** : taille de police, retour à la ligne, thème, sur tous les appareils.

### C. Python, Jupyter et données (76 à 110)

76. **Ouvrir un `.ipynb` comme un carnet** (cellules de code, de texte, résultats), pas comme du JSON. _Inspiration : Jupyter, Colab_
77. **Exécuter une cellule** (Maj + Entrée) dans le bac à sable Python, avec des variables qui restent d'une cellule à l'autre. _Inspiration : [Cloudflare, interpréteur](https://developers.cloudflare.com/sandbox/api/interpreter/)_
78. **Les résultats riches** : tableaux pandas, graphiques en image, JSON dépliable. _Même base._
79. **L'agent au travail dans le carnet** : il écrit une cellule, l'exécute, lit l'erreur, corrige, sous nos yeux. _Inspiration : [Colab Data Science Agent](https://docs.cloud.google.com/colab/docs/use-data-science-agent)_
80. **Le plan d'analyse validé d'abord** (« 1. charger, 2. nettoyer, 3. graphique »), puis « Exécuter le plan ». _Même inspiration._
81. **Les cellules de texte** avec formules mathématiques et images, modifiables d'un double-clic. _Inspiration : Jupyter_
82. **L'explorateur de variables** : nom, type, taille de chaque variable vivante.
83. **La visionneuse de tableau** : trier, filtrer, paginer sans écrire de code.
84. **La réactivité** : quand une cellule change, celles qui en dépendent sont marquées « périmées » ou relancées. _Inspiration : [marimo](https://marimo.io/)_
85. **Des carnets en Python pur** (`.py`), pour que les différences restent lisibles. _Inspiration : [marimo](https://docs.marimo.io/)_
86. **Importer un carnet** Colab ou Jupyter depuis un fichier ou une adresse.
87. **Exporter** en `.ipynb`, en page HTML ou en script `.py`.
88. **Le carnet devient une petite application** (curseurs, boutons) qu'on partage. _Inspiration : [marimo](https://marimo.io/)_
89. **Les champs de formulaire** dans une cellule (`# @param`) pour changer une valeur sans toucher au code. _Inspiration : Colab_
90. **Des jeux de données d'entraînement** sous licence libre, prêts à charger.
91. **Glisser un CSV ou un Excel** dans le carnet ; l'agent propose une première analyse.
92. **`%pip install` depuis une cellule**, avec la carte d'autorisation (PyPI est déjà ouvert).
93. **Le numéro et la durée de chaque exécution** : `[3] 1,2 s`.
94. **« Tout relancer depuis zéro »** pour vérifier que le carnet se tient.
95. **L'alerte « exécuté dans le désordre »** quand une cellule utilise une variable d'une cellule lancée plus bas. _Inspiration : [marimo](https://docs.marimo.io/)_
96. **Les graphiques interactifs** (Plotly, Vega) dans un cadre isolé.
97. **Python sans bac à sable** pour les petits calculs, dans le navigateur, quand la machine dort. _Inspiration : [JupyterLite / Pyodide](https://github.com/jupyterlite/pyodide-kernel)_
98. **La cellule SQL** (DuckDB) sur les CSV du projet. _Inspiration : [marimo](https://github.com/marimo-team/marimo)_
99. **La cellule « agent »** : on y écrit une consigne ; elle produit du code et son résultat. _Inspiration : [Deepnote](https://deepnote.com/docs/deepnote-agent)_
100. **Le carnet à plusieurs**, humains et agents, avec curseurs. _Inspiration : [Jupyter, collaboration en temps réel](https://jupyterlab.readthedocs.io/en/stable/user/rtc.html), [Jupyter AI v3](https://github.com/jupyterlab/jupyter-ai)_
101. **Mentionner un agent dans une cellule** : « @Traque vérifie ces chiffres ». _Inspiration : [Jupyter AI, personas](https://jupyter-ai.readthedocs.io/)_
102. **Les sorties longues repliées**, avec « voir tout ».
103. **Les images produites rangées** dans un dossier `sorties/` du projet.
104. **Le rapport propre** : le carnet sans le code, en HTML ou PDF.
105. **Le délai maximal par cellule**, lié au plafond de coût machine.
106. **Interrompre une cellule** (bouton carré). _Inspiration : Colab_
107. **L'aide au survol** d'une fonction (sa documentation).
108. **Le journal de la cellule** : dans sa marge, qui l'a créée, modifiée, exécutée.
109. **« Le graphique d'abord »** : on décrit le graphique voulu ; l'agent le produit et montre le code dessous.
110. **Des carnets modèles tirés du quotidien d'un commerce** : ventes, stock, liste de clients, à partir des fichiers de l'utilisateur.

### D. Terminal et bibliothèques (111 à 132)

111. **Un vrai terminal** dans le navigateur, relié au bac à sable. _Inspiration : [Cloudflare, terminaux](https://developers.cloudflare.com/sandbox/api/terminal), xterm.js_
112. **Le terminal de l'agent en direct** : la sortie de ses commandes défile pendant qu'elles tournent. _Inspiration : [OpenHands](https://docs.openhands.dev/openhands/usage/key-features), [Devin](https://docs.devin.ai/work-with-devin/devin-session-tools)_
113. **Plusieurs terminaux** (un pour le serveur, un pour les tests). _Inspiration : [Cloudflare, sessions](https://developers.cloudflare.com/changelog/post/2026-02-09-pty-terminal-support/)_
114. **La reconnexion sans perte** : on ferme l'onglet, on revient, la sortie est rejouée. _Même base._
115. **Les couleurs du terminal** gardées dans le journal des commandes. _Inspiration : `ansi_up`_
116. **La commande cliquable** : dans la conversation, « relancer », « copier », « ouvrir dans le terminal ».
117. **Les blocs** : commande, sortie et résultat groupés et repliables. _Inspiration : [Warp](https://www.warp.dev/blog/reimagining-coding-agentic-development-environment)_
118. **Le terminal partagé** : humain et agent voient le même ; chaque frappe a la couleur de son auteur. _Inspiration : [Cloudflare, terminal collaboratif](https://cloudflare-sandbox-sdk.mintlify.app/examples/collaborative-terminal)_
119. **Le panneau « Bibliothèques »** : chaque dépendance avec sa version et sa licence.
120. **Ajouter une bibliothèque par recherche** (npm, PyPI) et un bouton « Installer » qui passe par la carte d'autorisation.
121. **La fiche de confiance avant installation** : licence, date de la dernière version, avertissements connus.
122. **L'alerte « nom trompeur »** : un paquet dont le nom imite un paquet connu est signalé en rouge.
123. **Garder les dépendances installées** entre deux mises en veille (sauvegarde et restauration du dossier). _Inspiration : `createBackup` du SDK Cloudflare_
124. **Les tâches du projet en boutons** : « dev », « test », « build », lues dans `package.json`.
125. **Le panneau de tests** : une pastille verte ou rouge par test, relancé à chaque changement. _Inspiration : [Aider](https://aider.chat/docs/usage/lint-test.html)_
126. **La couverture dans la marge** : les lignes jamais testées marquées.
127. **Les programmes qui tournent en fond** (serveur de développement) listés avec « Arrêter ». _Inspiration : [Cloudflare, processus](https://developers.cloudflare.com/sandbox/guides/streaming-output/)_
128. **Le fichier `.env.exemple`** tenu à jour sans jamais de vraie clé.
129. **La liste blanche lisible** : « ce que l'agent peut faire sans demander », en clair. _Inspiration : [Warp](https://docs.warp.dev/agent-platform/local-agents/overview)_
130. **L'historique des commandes** commun à l'humain et à l'agent, avec recherche.
131. **Le résumé des sorties trop longues** : « 3 avertissements, 1 erreur : … ».
132. **Les dépendances inutiles** repérées et proposées à la suppression.

### E. Aperçu et mise en ligne (133 à 154)

133. **L'aperçu en direct** à côté du code, rechargé à chaque enregistrement. _Inspiration : [Bolt](https://github.com/stackblitz/bolt.new)_
134. **Cliquer dans l'aperçu ouvre le code** : le fichier et la ligne qui affichent l'élément. _Inspiration : [Cursor](https://cursor.com/blog/design-mode), [Windsurf](https://www.datacamp.com/tutorial/windsurf-ai-agentic-code-editor)_
135. **Changer un texte ou une couleur directement dans l'aperçu**, sans IA, donc sans coût. _Inspiration : [Lovable](https://docs.lovable.dev/features/preview-toolbar)_
136. **Dessiner sur l'aperçu** (entourer une zone) pour expliquer ce qu'on veut. _Inspiration : [Cursor](https://cursor.com/blog/design-mode)_
137. **Les tailles d'écran** téléphone, tablette, ordinateur, côte à côte.
138. **La console de l'aperçu** : les erreurs de la page remontent à l'agent.
139. **L'agent teste comme un utilisateur** (clics, formulaires) et rend une vidéo. _Inspiration : [Replit](https://docs.replit.com/replitai/app-testing)_
140. **La glissière avant / après** sur une capture de l'aperçu.
141. **L'aperçu d'une ancienne version** pour comparer avec aujourd'hui.
142. **Le lien de partage qui expire.** _Inspiration : [Firebase Studio](https://firebase.google.com/docs/studio/get-started-ai)_
143. **L'aperçu instantané des pages simples** (HTML, CSS) directement dans le navigateur, sans réveiller le bac à sable. _Inspiration : [WebContainers](https://blog.stackblitz.com/posts/introducing-webcontainers/)_
144. **Le journal de mise en ligne lisible** : construire, envoyer, vérifier, chaque étape en phrase simple.
145. **La vérification après mise en ligne** : l'agent ouvre l'adresse publique et confirme qu'elle répond (une compilation réussie ne prouve pas qu'une version est en ligne, § 5 de `CLAUDE.md`).
146. **Revenir à la version précédente** en un geste.
147. **Test puis production**, avec un bouton « Promouvoir ».
148. **Le poids de la page** mesuré sur l'aperçu après chaque changement ; alerte si elle grossit.
149. **L'accessibilité vérifiée** (contrastes, textes des images). _Inspiration : `axe-core`_
150. **Les applications mobiles Expo** ouvertes sur le téléphone par leur propre QR code (Expo Go).
151. **Le nom de domaine** branché pas à pas.
152. **La page « État »** de l'application publiée : en ligne ou non, erreurs récentes.
153. ⭐ **L'aperçu « monde entier »** : basculer la langue, la devise et le fuseau de l'application construite pour vérifier qu'elle marche partout.
154. **Des données factices réalistes** pour l'aperçu, jamais de vraies données de clients.

### F. Plusieurs agents et l'équipe (155 à 199)

155. **La photo de chaque agent** à côté de ses messages et de ses actions dans la conversation de l'atelier (Léo a déjà les photos et le composant `Visage`).
156. **Choisir « qui code »** : un agent Léo existant, avec son nom, sa photo et son poste, prend le rôle du Codeur.
157. **L'organigramme vivant** du projet : manager, spécialistes, stagiaires ; chaque carte dit ce que l'agent fait **maintenant**. _Inspiration : [CrewAI, processus hiérarchique](https://docs.crewai.com/en/learn/hierarchical-process)_
158. **Le bureau des agents** : chacun à son bureau, il tape quand il écrit, lit quand il cherche, lève la main quand il attend. _Inspiration : [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents)_
159. **La salle de réunion** : quand deux agents se parlent, leurs avatars se rejoignent à une table et leurs bulles défilent. _Inspiration : [AI Town / Smallville](https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763), [ChatDev](https://github.com/openbmb/ChatDev)_
160. **Le fil « entre agents »**, séparé de la conversation avec l'humain ; on peut le lire sans y être obligé. _Inspiration : [Claude Code, boîtes aux lettres](https://code.claude.com/docs/en/agent-teams)_
161. **Parler directement à un membre de l'équipe**, sans passer par le manager. _Même inspiration._
162. **Le tableau de tâches partagé** : à faire, en cours, fait ; les agents prennent eux-mêmes la tâche suivante, dans l'ordre des dépendances. _Même inspiration, et [Vibe Kanban](https://vibekanban.com/)_
163. **Le stagiaire** : un agent sur un modèle économique fait les tâches simples ; un « senior » relit avant de fusionner. _Inspiration : choix du modèle par coéquipier dans [Claude Code](https://code.claude.com/docs/en/agent-teams)_
164. **Le stagiaire qui demande au senior** (et pas à l'humain) quand il doute ; on voit l'échange. _Inspiration : collègues simulés de [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany)_
165. ⭐ **La promotion** : un stagiaire dont les livraisons passent la relecture à répétition obtient des tâches plus grosses ; on voit sa progression.
166. **Le manager qui découpe** : il écrit le plan en tâches, les confie, et ne récupère que le résumé de chacune. _Inspiration : [Roo, Boomerang](https://docs.roocode.com/features/boomerang-tasks)_
167. **Le registre du manager** affiché en direct : ce qu'on sait, ce qu'on suppose, ce qui avance. _Inspiration : [Magentic-One](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/)_
168. **La chaîne de métier** : Produit → Architecte → Codeur → Testeur ; chaque passage laisse un document lisible. _Inspiration : [MetaGPT](https://arxiv.org/html/2308.00352v6)_
169. **Une branche par agent**, et le graphe des branches qui se rejoignent à la fin. _Inspiration : [Cursor](https://cursor.com/blog/2-0), [Codex](https://openai.com/index/introducing-the-codex-app/)_
170. **Le tournoi départagé par les tests** : plusieurs agents sur le même problème ; la proposition qui passe le plus de tests est mise en avant (la « contre-expertise » du plan du 25/09 compare à la main). _Inspiration : [Cursor 2.0](https://cursor.com/blog/2-0)_
171. **Le débat pour trouver un bogue** : chaque agent défend une hypothèse et tente de réfuter celle des autres. _Inspiration : [Claude Code](https://code.claude.com/docs/en/agent-teams)_
172. **La relecture à trois regards** en parallèle : sécurité, vitesse, tests. _Même inspiration._
173. **La porte qualité** : une tâche ne passe « faite » que si tests et lint passent ; sinon elle revient à l'agent. _Inspiration : crochets `TaskCompleted` de [Claude Code](https://code.claude.com/docs/en/agent-teams)_
174. **La taille d'équipe raisonnable par défaut** (3 à 5, comme le conseille la documentation de Claude Code), avec le coût affiché par membre.
175. **Chacun ses fichiers** : deux agents ne peuvent pas écrire le même fichier en même temps. _Inspiration : verrous de [Claude Code](https://code.claude.com/docs/en/agent-teams)_
176. **Le cadenas visible** dans l'arbre, avec la photo de l'agent qui tient le fichier.
177. **La relève** : un agent bloqué sur une erreur est remplacé par un autre qui reprend sa fiche. _Inspiration : [Claude Code](https://code.claude.com/docs/en/agent-teams)_
178. **Le point du matin** : chaque agent dit en deux lignes ce qu'il a fait, ce qu'il va faire, ce qui le bloque.
179. **Le bilan de fin de projet** : ce qui a coûté cher, les erreurs répétées, une règle proposée pour la prochaine fois.
180. **Le manager qui pose des questions** avant de lancer l'équipe quand la demande est trop vague.
181. **La leçon de Project Vend** : un manager IA ne suffit pas comme garde-fou (celui d'Anthropic approuvait bien plus qu'il ne refusait) ; les limites dures restent dans le Worker, jamais dans la personnalité du manager. _Source : [Anthropic, Project Vend 2](https://www.anthropic.com/research/project-vend-2)_
182. **Un agent ne peut pas autoriser à la place de l'humain** : un message entre agents est une donnée, pas un accord ; la règle est affichée. _Inspiration : [Claude Code](https://code.claude.com/docs/en/agent-teams)_
183. **La carte de passation** : quand un agent passe la main, on voit ce qu'il transmet (fichiers, décisions, questions ouvertes). _Inspiration : [Roo](https://docs.roocode.com/features/boomerang-tasks)_
184. **Le graphe animé de l'équipe** : qui parle à qui, les flèches s'allument. _Inspiration : [AutoGen Studio](https://microsoft.github.io/autogen/stable//user-guide/autogenstudio-user-guide/usage.html), [LangGraph Studio](https://mem0.ai/blog/visual-ai-agent-debugging-langgraph-studio)_
185. **Revenir à un moment de l'équipe et repartir autrement** (une bifurcation). _Inspiration : [LangGraph, voyage dans le temps](https://docs.langchain.com/oss/python/langchain/frontend/time-travel), [VS Code](https://code.visualstudio.com/docs/agents/run/sessions/manage-sessions)_
186. **La pause générale** : un bouton qui gèle toute l'équipe, puis la relance. _Inspiration : [GitHub mission control](https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/)_
187. **Réorienter un agent sans l'arrêter.** _Même inspiration._
188. **La fiche de poste de chaque agent** : rôle, outils permis, modèle, budget, modifiable. _Inspiration : [Claude Code, sous-agents](https://code.claude.com/docs/en/agent-teams)_
189. **La signature dans les commits** : « Co-écrit par Plume », avec sa couleur.
190. **Le tableau de présence** : qui travaille, qui attend, qui dort (bac à sable en veille), comme les pastilles d'une messagerie.
191. **L'humain dans l'organigramme** : les agents peuvent lui confier une tâche (« essaie sur ton téléphone ») qui arrive dans son carnet. _Inspiration : [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany)_
192. **La boîte des questions à l'humain** : toutes les questions des agents au même endroit, triées par urgence, avec le temps d'attente de chacun. _Inspiration : [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) (l'agent qui attend est signalé)_
193. **Le mentor** : le senior commente le code du stagiaire comme dans une vraie relecture, et l'humain peut lire.
194. **Le budget par agent et par équipe**, une barre sous chaque avatar. _Inspiration : [Roo, demande de coûts agrégés](https://github.com/RooCodeInc/Roo-Code/issues/5376)_
195. **Les équipes prêtes à l'emploi** : « site vitrine : 1 manager, 1 designer, 1 codeur, 1 testeur ». _Inspiration : [ChatDev](https://github.com/openbmb/ChatDev)_
196. **Le fil d'équipe en canaux** (#plan, #code, #tests), comme une messagerie d'entreprise. _Inspiration : RocketChat dans [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany)_
197. **Les invités observateurs** : quelqu'un regarde l'équipe travailler en direct, en lecture seule. _Inspiration : [Moltbook](https://arxiv.org/html/2602.10127v1) (« les humains peuvent observer »)_
198. **La limite de bavardage** : au-delà d'un certain nombre de messages entre agents sur une tâche, le manager tranche ou demande à l'humain (dans Project Vend, deux agents ont discuté toute une nuit). _Source : [Anthropic](https://www.anthropic.com/research/project-vend-2)_
199. ⭐ **Les rôles qui tournent** : sur une longue tâche, relecteur et codeur échangent leurs rôles à mi-chemin pour éviter l'aveuglement.

### G. Voix et Jarvis (200 à 215)

_Les idées vocales du plan du 24/09 (mot de réveil, voix par agent, mode voiture, « lance les tests »…) ne sont pas répétées._

200. **Maintenir pour parler** dans l'atelier ; la transcription reçoit les noms des fichiers du projet comme indices. _Inspiration : [Claude Code `/voice`](https://code.claude.com/docs/en/voice-dictation)_
201. **Montrer et parler** : cliquer une ligne ou un élément de l'aperçu en disant « ça, en plus grand ». _Inspiration : [Cursor](https://cursor.com/blog/design-mode)_
202. **Dicter pendant que l'agent travaille** : la demande vocale entre dans la file sans l'interrompre. _Même inspiration._
203. ⭐ **Le commentateur** : en option, l'agent dit à voix haute ce qu'il fait, une phrase par étape, pendant qu'il code.
204. **Le résumé audio des changements du jour.** _Inspiration : [Jules, audio changelog](https://jules.google/docs/changelog/)_
205. **Dicter du code précis** (noms de variables, symboles) avec un vocabulaire de développeur. _Inspiration : [Claude Code](https://code.claude.com/docs/en/voice-dictation)_
206. **Écouter un changement avant de le valider** : le diff lu en phrases simples (« il a ajouté une vérification du prix »).
207. **Interroger un agent précis à l'oral** : « Plume, pourquoi tu as changé le panier ? » ; il répond en montrant ses lignes.
208. **Réécouter une réunion d'agents** en accéléré, avec le texte à côté.
209. **Naviguer à la voix** : « va à la fonction total », « ouvre le test du panier ».
210. **Le mélange des langues** : une dictée en français avec des mots de code anglais, sans les déformer.
211. **Les sous-titres** de ce que dit l'agent vocal (lieux bruyants, accessibilité).
212. ⭐ **Le karaoké du code** : « explique-moi ce fichier » à l'oral, et le surlignage suit la voix ligne par ligne dans l'éditeur.
213. **La note vocale laissée à un agent** pour plus tard, rangée dans sa file.
214. **Autoriser à la voix seulement ce qui est sans risque** (lecture, tests) ; ce qui sort du bac à sable exige toujours un toucher d'écran.
215. **Le réglage bref / détaillé** de la voix.

### H. Confiance, sécurité et coût (216 à 237)

216. **Deux boutons de retour distincts** : « restaurer le code en gardant la conversation » et l'inverse. _Inspiration : [Claude Code, rewind](https://code.claude.com/docs/en/output-styles)_
217. **L'invité en lecture** : il voit tout, n'exécute rien.
218. **Le HTML des cellules toujours isolé** dans un cadre sans droits (un résultat de carnet ne peut pas agir sur Léo).
219. **Le bandeau « ceci vient d'un fichier, pas de toi »** quand l'agent cite ce qu'il a lu (le Worker marque déjà ces textes comme DONNÉES).
220. ⭐ **Les consignes cachées surlignées** : un texte dans un fichier importé qui demande d'« ignorer les règles » est souligné en rouge dans l'éditeur.
221. ⭐ **Le réseau visible** : chaque sortie du bac à sable (npm, PyPI, GitHub) listée en direct.
222. **Le coût par fichier** : ce qu'a coûté l'écriture de chaque fichier. _Inspiration : git-ai (plan du 25/09)_
223. **Le coût prévu d'une équipe avant de la lancer** : une équipe coûte bien plus qu'un agent seul (la documentation de Claude Code le dit), donc on l'affiche avant. _Source : [Claude Code](https://code.claude.com/docs/en/agent-teams)_
224. ⭐ **Le détecteur de ping-pong** : deux agents qui se renvoient la même question sont arrêtés, et l'humain est prévenu.
225. ⭐ **Le journal scellé** : chaque action reçoit une empreinte chaînée à la précédente, pour prouver après coup ce qui s'est passé.
226. **Les dossiers sensibles** (`paiement/`, `auth/`) toujours en « Demander », même en mode libre. _Inspiration : [Cline](https://docs.cline.bot/features/auto-approve)_
227. **Les fichiers interdits de lecture** (`.env`, clés) cachés même à l'agent.
228. **Le diff des dépendances** à chaque livraison : nouvelles bibliothèques et leurs licences mises en avant.
229. **L'alerte de licence** : une bibliothèque sous licence incompatible avec celle du projet est signalée.
230. **Le mode « aucun réseau »** pour les projets sensibles.
231. **La transparence des modèles** : quel fournisseur a reçu quoi.
232. **Le plafond par tâche**, en plus du plafond par session.
233. **Le mode économie** : lire et chercher avec un modèle bon marché, écrire avec un modèle fort ; la répartition est affichée. _Inspiration : mode architecte d'[Aider](https://www.deployhq.com/guides/aider)_
234. **Relancer une tâche échouée sans repayer** les étapes réussies.
235. **Le badge de santé** sur la carte du projet : tests, lint, dépendances à jour.
236. **La sauvegarde avant toute commande risquée** (suppression, migration). _Inspiration : `createBackup` du SDK Cloudflare_
237. ⭐ **Les fausses clés au bon format** générées pour les tests, pour que le code tourne sans jamais voir de vraie clé.

### I. Apprendre en regardant (238 à 259)

238. **Mettre le film en pause et modifier** le code de l'agent à cet instant, puis relancer à partir de là. _Inspiration : [Scrimba](https://scrimbaguide.tech/docs/how-it-works/how-scrims-work/)_
239. **Les notes « pourquoi »** en marge de chaque bloc écrit par l'agent, repliables. _Inspiration : style « Explicatif » de [Claude Code](https://code.claude.com/docs/en/output-styles)_
240. **La transformation animée** : avant → après, les mots glissent à leur nouvelle place, pour comprendre une réorganisation du code. _Inspiration : [Shiki Magic Move](https://github.com/shikijs/shiki-magic-move)_
241. **L'explication qui défile** : le code à droite change quand on fait défiler le texte à gauche. _Inspiration : [Code Hike](https://codehike.org/docs/layouts/scrollycoding), [vidéo YouTube](https://www.youtube.com/watch?v=7O2b7vfk-mo)_
242. **La visite enregistrée** : l'agent laisse une visite du code (fichier, ligne, commentaire) que quelqu'un d'autre rejoue. _Inspiration : [CodeTour](https://github.com/microsoft/codetour)_
243. ⭐ **« Devine la suite »** : pendant l'animation, l'agent s'arrête avant une ligne clé et demande à l'apprenant ce qu'il écrirait.
244. **Le niveau de l'apprenant** (débutant, intermédiaire, confirmé) règle la longueur des explications.
245. **Le glossaire au survol** : chaque mot technique souligné en pointillé, avec une définition simple.
246. **Le carnet d'apprentissage** : les notions rencontrées pendant la session (boucle, API, test), chacune avec une explication.
247. **L'exécution pas à pas** d'un petit programme Python : on voit les variables changer ligne après ligne. _Inspiration : Python Tutor (non relu le 24/09)_
248. **Comparer ma solution à celle de l'agent.**
249. **Enregistrer ses propres sessions** et les partager comme un cours. _Inspiration : [Scrimba](https://survivejs.com/blog/scrimba-interview/)_
250. ⭐ **« Explique comme à une vendeuse »** : des images tirées du commerce (panier, stock, facture) pour expliquer le code.
251. **La fiche « piège »** : chaque erreur rencontrée devient une fiche réutilisable.
252. ⭐ **Le mode lent** : l'agent n'avance qu'après que l'apprenant a touché « j'ai compris ».
253. **Le schéma du projet en direct** : boîtes et flèches mises à jour quand l'agent ajoute un fichier.
254. **La frise « comment ce projet est né »** : les étapes avec les demandes d'origine.
255. **L'explication d'une commande** au survol (« que fait `npm install` ? »).
256. ⭐ **Les commentaires traduits** dans la langue de l'apprenant, sans toucher au code.
257. ⭐ **Les sous-titres de l'animation** : une ligne en bas dit ce qui est en train de s'écrire.
258. **Le relevé de compétences** fondé sur ce qu'on a vraiment fait, jamais sur des chiffres inventés.
259. **Exporter le film** d'une session en courte vidéo (le terminal aussi). _Inspiration : `asciinema-player`_

### J. Le téléphone (260 à 275)

_Déjà proposés : téléphone télécommande, notifications, mode « données chères », QR code._

260. **La vue « fil »** : une ligne par action avec la photo de l'agent, sans l'éditeur.
261. **La barre de touches de code** au-dessus du clavier : Tab, `{ } ( ) ;`, flèches.
262. ⭐ **Glisser pour accepter ou refuser** un bloc de changement.
263. **Le carnet sur une colonne**, sorties redimensionnées.
264. **Le diff par mots** plutôt que par lignes sur un petit écran. _Inspiration : `allowInlineDiffs` de [@codemirror/merge](https://github.com/codemirror/merge)_
265. **L'aperçu plein écran** avec une bulle flottante pour parler à l'agent.
266. **L'équipe dans une notification permanente** (Android) ou une « activité en direct » (iPhone).
267. **Envoyer une capture d'écran** à l'atelier : « ça ne va pas » + capture = une tâche.
268. **Le mode paysage** : éditeur et conversation côte à côte.
269. **Une légère vibration** quand un agent attend une réponse.
270. **Le widget d'écran d'accueil** : coût du jour, agents actifs.
271. **La reprise exacte** entre ordinateur et téléphone (même fichier, même endroit). _Inspiration : [Claude Code Remote Control](https://code.claude.com/docs/en/remote-control)_
272. **Relire hors ligne** le code et le journal déjà chargés.
273. **La photo d'un croquis sur papier** → l'agent en fait une page. _Inspiration : [Firebase Studio](https://firebase.google.com/docs/studio/get-started-ai) (demande avec image)_
274. **La police réglable au pincement.**
275. **Le bouton Stop sous le pouce**, en bas de l'écran (il est en haut aujourd'hui).

### K. Des idées qui n'existent nulle part (276 à 300)

_Toutes ⭐. Pour chacune, ce qui s'en approche le plus._

276. ⭐ **Le ralenti honnête** : chaque animation porte un badge « rejoué depuis le vrai changement » ou « en direct » ; jamais de fausse frappe présentée comme réelle. _Proche : aucune ; c'est la règle de vérité de Finjaro appliquée à l'écran._
277. ⭐ **Le CV vérifié d'un agent** : ses livraisons relues et acceptées forment un portfolio ; une autre entreprise Léo peut « l'embaucher ». _Proche : marché de compétences du plan du 25/09 (qui vend des compétences, pas des agents avec historique)._
278. ⭐ **L'entretien d'embauche** : avant de rejoindre une équipe, un agent passe un petit test réel sur le projet, et l'on voit sa copie. _Proche : `legion-banc`, les bancs d'essai publics._
279. ⭐ **L'avis des agents sur les consignes** : chaque semaine, l'équipe note la clarté des tâches données (par le manager et par l'humain), avec des exemples. _Proche : rien trouvé._
280. ⭐ **La visite de chantier** : l'humain « entre » dans le bureau ; un clic sur un avatar montre l'écran de cet agent en direct. _Proche : [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) (personnages) + observation de [Replit](https://docs.repl.it/replit-workspace/workspace-features/multiplayer), jamais réunis._
281. ⭐ **La biographie d'un fichier** : qui l'a créé, pourquoi, ce qu'il a coûté, combien de fois il a cassé. _Proche : `git log`, git-ai._
282. ⭐ **La météo du projet** : un seul pictogramme (soleil, nuage, orage) calculé depuis tests, erreurs, coût et questions en attente. _Proche : badges d'intégration continue._
283. ⭐ **L'avocat des règles de Finjaro** : un agent relit les décisions de l'équipe avec `CLAUDE.md` (ambition mondiale, pas de chiffre inventé, pas de photo prise sur le web) et bloque ce qui les viole. _Proche : relecteurs de sécurité génériques._
284. ⭐ **Le testeur « monde entier »** : un agent ouvre l'application construite avec plusieurs profils (langues, devises, fuseaux) et signale tout texte qui l'enferme dans un pays ou suppose une devise. _Proche : outils de traduction, pas de test de ce genre par un agent._
285. ⭐ **La table de montage** : la piste de l'humain et celle des agents alignées dans le temps, comme dans un logiciel de montage vidéo. _Proche : journaux de session, jamais en pistes._
286. ⭐ **L'écriture par intentions** : l'animation pose d'abord le squelette (les fonctions vides, nommées), puis remplit chaque corps, dans l'ordre du raisonnement et non dans l'ordre des lignes. _Proche : Shiki Magic Move (anime un avant → après, sans ordre de raisonnement)._
287. ⭐ **Le fantôme du passé** : pendant que l'agent réécrit une ligne, l'ancienne version reste visible en transparence au-dessus. _Proche : diffs classiques._
288. ⭐ **Le prêt d'agent entre projets** de la même entreprise, avec le coût refacturé d'un projet à l'autre. _Proche : rien trouvé._
289. ⭐ **Le carnet de Beau automatique** : chaque demande faite à l'atelier (écrite ou dictée) est notée d'office dans le carnet du jour (§ 9 de `CLAUDE.md`). _Proche : historiques de conversation, sans carnet de décisions._
290. ⭐ **Le « pourquoi pas »** : pour chaque choix technique, l'agent garde l'option écartée et sa raison ; un clic l'essaie dans une branche. _Proche : documents de décision d'architecture._
291. ⭐ **La démo pour la boutique** : à la fin, l'équipe produit une courte vidéo de l'application (aperçu cliqué) prête à publier sur la boutique Finjaro du développeur. _Proche : vidéos de test de Replit (pour vérifier, pas pour vendre)._
292. ⭐ **Le couloir** : les agents de plusieurs projets d'une même entreprise se croisent dans un espace commun et s'échangent des astuces, jamais du code sans accord. _Proche : AI Town (des agents qui se croisent, mais sans travail réel)._
293. ⭐ **Le temps de parole en réunion** : un compteur par agent ; celui qui monopolise est coupé. _Proche : rien trouvé._
294. ⭐ **Noter en regardant** : pendant le film, l'humain donne 👍 ou 👎 à chaque intervention ; cela règle la verbosité de cet agent. _Proche : votes sur les réponses de chatbots, pas sur des actions rejouées._
295. ⭐ **Le graphique validé qui se défend** : si l'agent modifie une cellule dont dépend un graphique validé par l'humain, l'ancien graphique reste affiché à côté pour comparer. _Proche : marimo (marque les cellules périmées)._
296. ⭐ **Les stagiaires humains dans l'équipe d'agents** : un étudiant prend des tâches du même tableau et est relu par le même senior IA. _Proche : TheAgentCompany (agents parmi des collègues simulés, l'inverse)._
297. ⭐ **Les mots nouveaux colorés** : pendant que l'agent écrit, les mots-clés que l'apprenant n'a jamais rencontrés (d'après son carnet d'apprentissage) ressortent. _Proche : rien trouvé._
298. ⭐ **L'ordre de mission signé** : avant le départ d'une équipe, une page (but, budget, interdits, date de fin) que l'humain valide d'un geste ; les agents la citent quand ils refusent quelque chose. _Proche : `AGENTS.md`, les plans validés (sans signature ni budget)._
299. ⭐ **La relecture croisée à l'aveugle** : l'humain et Rigo relisent le même lot sans voir l'avis de l'autre, puis comparent ; on apprend où l'IA voit ce que l'humain rate, et l'inverse. _Proche : relecteurs IA classiques._
300. ⭐ **La chorégraphie de fusion** : quand les branches des agents se rejoignent, on voit dans le fichier final les morceaux de chaque agent venir s'emboîter, chacun de sa couleur. _Proche : graphes de branches git (sans animation dans le fichier)._

---

## 3. Les 20 à construire en premier, dans NOTRE code

Difficulté : **facile** (environ 1 jour de travail d'agent), **moyen** (2 à
4 jours), **difficile** (5 jours et plus). Ce sont des **estimations**.
Chemins relatifs à la racine du dépôt.

| # | Quoi (n° de proposition) | Fichiers touchés | Difficulté |
|---|---|---|---|
| 1 | Photo de l'agent et « qui code » (155, 156) | `Atelier.jsx`, `atelier/src/atelier.js`, `atelier/src/boucle.js`, réutilise `parties/Visage.jsx` | facile |
| 2 | Suivre l'agent (3, 4, 5) | `Atelier.jsx`, `atelier/src/boucle.js` | facile |
| 3 | Proposition en place, Autoriser dans l'éditeur (7) | `Editeur.jsx`, `Atelier.jsx`, `atelier/src/boucle.js` | moyen |
| 4 | Écriture animée + curseur à visage (1, 2, 9, 10, 276) | `Editeur.jsx`, nouveau `atelier/animation.js` (front) | moyen |
| 5 | Arbre vivant (15, 16, 18, 37) | `Parties.jsx` (`Arbre`), `Atelier.jsx` | facile |
| 6 | Erreurs de syntaxe et JSON soulignées (42) | `Editeur.jsx` | facile |
| 7 | Python vérifié par Ruff (43) | nouveau `atelier/lint/ruff.worker.js` (front), `Editeur.jsx` | moyen |
| 8 | Diagnostics du bac à sable (46) | `atelier/src/boucle.js`, `atelier/src/atelier.js`, `Editeur.jsx` | moyen |
| 9 | Panneau Problèmes + Corriger / Expliquer (47, 48) | `Parties.jsx`, `Atelier.jsx` | facile (après 6 à 8) |
| 10 | Vrai terminal xterm.js (111, 114) | `atelier/src/index.js`, `atelier/src/atelier.js`, nouveau `Terminal.jsx` | difficile |
| 11 | Sortie des commandes en direct (112, 115) | `atelier/src/bac.js`, `atelier/src/atelier.js`, `Atelier.jsx` | moyen |
| 12 | Lire un `.ipynb` (76, 81, 102) | nouveau `Carnet.jsx`, `arbre.js`, `Atelier.jsx` | moyen |
| 13 | Exécuter une cellule (77, 78, 93, 106) | `atelier/src/bac.js`, `atelier/src/atelier.js`, `Carnet.jsx` | difficile |
| 14 | L'agent écrit et exécute les cellules (79, 80) | `atelier/src/boucle.js`, `atelier/src/politique.js`, `Carnet.jsx` | moyen (après 12 et 13) |
| 15 | Écrire sans interrompre, montrer une ligne (30, 32, 33) | `Atelier.jsx`, `atelier/src/atelier.js`, `atelier/src/boucle.js` | moyen |
| 16 | Film de la session (27, 28) | nouveau `Film.jsx`, `atelier/src/atelier.js` (journal) | moyen (après 4) |
| 17 | Bureau des agents (158, 192) | nouveau `Bureau.jsx` | moyen |
| 18 | Tableau de tâches d'équipe (162, 166, 175) | `atelier/src/boucle.js`, `atelier/src/atelier.js`, nouveau `Equipe.jsx` | difficile |
| 19 | Cliquer dans l'aperçu ouvre le code (134) | `atelier/src/atelier.js`, `Atelier.jsx` | difficile (après l'aperçu de la V1) |
| 20 | Le vrai direct : l'écriture diffusée pendant que le modèle l'écrit | `atelier/src/moteur.js`, `atelier/src/atelier.js`, `Atelier.jsx` | difficile |

_(Les fichiers front sans chemin sont dans `src/screens/legion/atelier/`.)_

### Comment les faire, techniquement

**1. Photo de l'agent et « qui code ».** Dans la barre de l'atelier, un choix
parmi les agents de l'entreprise (`supabase.from('legion_agents').select('id, nom, poste, avatar_url, couleur, emoji')`,
les mêmes champs que `Entreprise.jsx` utilise déjà). Le Worker garde une
**copie** `{ id, nom, avatar_url, couleur, emoji }` dans le projet (stockage du
Durable Object : **aucune migration Supabase**). `vue()` la renvoie ; dans
`colonneConversation`, `<Visage a={agent} taille={28} point={false} />` devant
chaque bulle `qui === 'agent'` et chaque ligne d'action. La consigne système de
`boucle.js` dit « Tu t'appelles {nom} ». Pour une équipe plus tard, chaque
entrée d'`affichage` porte `agent_id`.

**2. Suivre l'agent.** Dans `boucle.js`, là où l'action est ajoutée à
`affichage` (fonction `traiter`), ajouter un champ `chemin` explicite pour les
outils de fichier (aujourd'hui il faut le déduire de `resume`). Dans
`Atelier.jsx`, un `useEffect` sur `vue.affichage` : si « Suivre » est allumé,
que le brouillon n'est pas modifié (`sale` faux) et que la dernière action est
`lire_fichier`, `ecrire_fichier` ou `supprimer_fichier`, appeler `ouvrir(chemin)`.
Même chose quand une carte `demande` arrive avec un `chemin`. Un `keydown` ou
un clic dans l'éditeur éteint le suivi. Sur téléphone, n'ouvrir l'onglet
Éditeur que si l'on est en mode « regarder ».

**3. Proposition en place.** Aujourd'hui la carte ne contient que le diff par
blocs. Dans `boucle.js` (création de la `demande` pour `ecrire_fichier`),
ajouter le contenu proposé `apres` (plafonné, comme `MAX_LECTURE`). Dans
`Editeur.jsx`, un nouveau `Compartment` : quand une proposition est là, on met
le texte proposé dans l'éditeur et l'on active
`unifiedMergeView({ original: contenuActuel, mergeControls: false })` de
`@codemirror/merge` (MIT ; `unifiedMergeView`, `acceptChunk`, `rejectChunk`
existent dans le paquet, vérifié). Une barre au-dessus reprend les boutons de
la carte (`decider`). L'acceptation **bloc par bloc** (n° 8) demandera un
nouveau choix côté Worker, « autorisé avec modifications », qui écrit le texte
final choisi par l'humain : à faire après, avec son test.

**4. Écriture animée.** Quand `Atelier.jsx` recharge un fichier **parce que
l'agent l'a changé**, il passe `origine="agent"` à l'éditeur. L'éditeur
calcule les changements avec la fonction `diff(ancien, nouveau)` exportée par
`@codemirror/merge` (vérifié), puis, bloc par bloc : il surligne en rouge ce
qui part, le retire, puis insère le nouveau texte **par petits morceaux** à
chaque image (`requestAnimationFrame`), avec `userEvent: 'input.agent'` et sans
entrer dans l'historique d'annulation. Un `StateField` garde la position du
curseur de l'agent, dessiné par un `Decoration.widget` (sa couleur, sa photo,
son prénom) ; `EditorView.scrollIntoView` le suit. La durée totale est
plafonnée (vitesse adaptée à la taille), « Passer » pose le texte final d'un
coup, et `prefers-reduced-motion` coupe l'animation. Le badge « rejoué depuis
le vrai changement » (n° 276) est affiché, parce que c'est vrai : avec la
relève toutes les 2 secondes, l'animation arrive **après** l'écriture. Le vrai
direct, c'est le n° 20.

**5. Arbre vivant.** Dans `Atelier.jsx`, construire depuis `affichage` une
table `chemin → { lu, modifie, maintenant, ajouts, retraits }` et la passer à
`Arbre` (`Parties.jsx`) : point qui palpite, compteur `+12 −3`, éclat à la
création, fichier barré à la suppression.

**6. Erreurs de syntaxe et JSON.** `@codemirror/lint` est déjà installé
(dépendance de `codemirror`). Dans `Editeur.jsx` : `lintGutter()` et un
`linter()` qui parcourt `syntaxTree(state)` et signale chaque nœud
`type.isError` ; pour les `.json`, `linter(jsonParseLinter())` de
`@codemirror/lang-json`. Messages en français via `t()`. Aucun serveur, aucun
coût.

**7. Ruff pour Python.** Charger `@astral-sh/ruff-wasm-web` (MIT, version
0.16.9, API marquée **expérimentale** par Astral : épingler la version) dans un
Web Worker, **seulement** quand un `.py` s'ouvre (le poids ne doit pas pénaliser
les autres écrans, ni les connexions chères). `Workspace.check(code)` rend des
diagnostics avec lignes et colonnes ; on les convertit en positions CodeMirror,
avec un délai de 400 ms après la dernière frappe.

**8. Diagnostics du bac à sable.** Après une écriture de l'agent ou sur
demande, `boucle.js` lance **si l'outil est présent** `ruff check --output-format json`
ou `npx tsc --noEmit --pretty false` (via l'exécutant de `bac.js`) ; le résultat,
analysé, est rangé dans `e.diagnostics[chemin]` et renvoyé par `vue()`. Le front
le pose avec `setDiagnostics`. Bonus façon Aider : le résultat est aussi donné
à l'agent, qui corrige avant de rendre la main. Coût : du temps machine, donc
pas à chaque frappe.

**9. Panneau Problèmes.** Liste des diagnostics de 6 à 8 ; clic = ouvrir à la
ligne ; « Corriger » envoie à l'agent un message prérempli
(`chemin:ligne — message`) ; « Expliquer » demande une explication simple, en
mode « Réfléchir d'abord » (lecture seule, déjà existant).

**10. Vrai terminal.** Côté écran : `@xterm/xterm` 6.0.0 (MIT),
`@xterm/addon-fit` et `SandboxAddon` importé de `@cloudflare/sandbox/xterm`
(présent dans notre version 0.12.10, vérifié). Côté Worker, trois pièges :
(a) un navigateur **ne peut pas** mettre d'en-tête `Authorization` sur un
WebSocket, or `index.js` authentifie par cet en-tête : il faut une route
`POST /api/projets/:id/terminal/ticket` qui rend un **ticket à usage unique**
(60 s, gardé dans le Durable Object), puis `wss://…/terminal?ticket=…` ;
(b) avant d'ouvrir, `assurer()` repose les fichiers dans le bac, puis
`return sandbox.terminal(request, { cols, rows })` ; (c) ce que l'humain change
au terminal doit revenir dans la copie qui fait foi (le Durable Object) :
lancer `synchroniser()` à la fermeture et, mieux, écouter
`sandbox.watch('/workspace/…', { exclude: ['node_modules', '.git'] })` (API
vérifiée dans le paquet). Le terminal est l'humain qui agit : pas de carte,
mais une ligne au journal à l'ouverture et à la fermeture. Le réseau reste
filtré comme aujourd'hui. Sur téléphone, ajouter la barre de touches (n° 261).

**11. Sortie en direct.** Dans `bac.js`, remplacer `sandbox.exec` par
`sandbox.execStream` + `parseSSEStream` (même SDK) et garder les dernières
lignes dans l'état du projet (écrit au plus toutes les demi-secondes, pas à
chaque morceau). L'écran les lit à chaque relève et les colore avec `ansi_up`
(MIT).

**12. Lire un `.ipynb`.** `langageDe` (`arbre.js`) renvoie `carnet` pour
`.ipynb`. `Carnet.jsx` lit le JSON du format nbformat 4 : `cells[]` avec
`cell_type` (`code`, `markdown`), `source` (texte ou liste de lignes),
`outputs[]` (`stream`, `execute_result` / `display_data` avec `text/plain`,
`text/html`, `image/png` en base64, `error` avec la trace colorée). Chaque
cellule de code = un petit CodeMirror Python. Markdown rendu par `marked`
(MIT) et nettoyé par `DOMPurify` ; **tout HTML de sortie dans un
`<iframe sandbox srcdoc>`** (n° 218). À l'enregistrement, on réécrit le JSON en
gardant les métadonnées. Limite actuelle : `bac.js` ne rapatrie pas les fichiers
de plus de 300 000 octets, et un carnet avec images peut les dépasser : à dire
à l'écran.

**13. Exécuter une cellule.** Nouvelle route `POST /api/projets/:id/cellule`.
Dans `bac.js` : `assurer()`, puis un contexte Python créé une fois
(`createCodeContext({ language: 'python', cwd })`, identifiant gardé dans
l'état) et `runCode(code, { context, timeout })`. Le résultat contient
`logs.stdout`, `logs.stderr`, `results[]` (texte, HTML, PNG, SVG, JSON,
graphique) et `error` : on le convertit en sorties nbformat, on incrémente
`execution_count`, on réécrit le `.ipynb` par `fichiers.ecrire`. Le contexte
disparaît quand le bac s'endort (10 minutes) : l'écran dit « le noyau a
redémarré, relance tout ». Le temps machine est compté comme aujourd'hui.
**À vérifier d'abord** : la documentation de Cloudflare montre pandas et
matplotlib dans ses exemples, mais je n'ai pas vérifié qu'ils sont installés
dans l'image `-python` : lancer une fois `python -c "import pandas, matplotlib"`
dans le bac.

**14. L'agent dans le carnet.** Deux outils dans `OUTILS` (`boucle.js`) :
`ecrire_cellule` (chemin, index, source, explication) et `executer_cellule`
(chemin, index). `politique.js` les traite comme une écriture et comme une
commande (carte d'autorisation en mode « Demander »). L'écran réutilise
l'animation du n° 4 dans la cellule, puis montre la sortie.

**15. Écrire sans interrompre.** Autoriser l'envoi pendant que l'agent
travaille : `POST /api/projets/:id/file` range le message dans `e.file`.
`boucle.js` vide la file entre deux appels au modèle et l'ajoute comme message
humain. « Montrer une ligne » envoie la même chose avec `chemin:ligne`.

**16. Film de la session.** Le journal (`j:` dans le Durable Object) a déjà
chaque action ; il manque le contenu : garder, pour chaque écriture autorisée,
le diff (déjà calculé pour la carte). `Film.jsx` rejoue les entrées avec
l'animation du n° 4, une barre de temps et des chapitres (un par demande de
l'humain).

**17. Bureau des agents.** Rien à changer au Worker : `affichage` suffit.
Correspondance outil → posture : `lire_fichier`, `chercher`, `lister` = lit ;
`ecrire_fichier` = tape ; `commande` = au terminal ; `demande` en attente =
main levée ; session arrêtée = dort. Photo de l'agent sur le personnage.
Pixel Agents est sous licence MIT, mais **le style est une décision de Beau**
(pixel art ou son style vintage crème, terracotta, laiton) : lui montrer deux
maquettes avant de coder.

**18. Tableau de tâches d'équipe.** C'est la V1.5 du plan du 25/09 : plusieurs
boucles, une par agent, chacune avec ses fichiers réservés (verrou dans l'état),
une liste de tâches avec dépendances, et les messages entre agents marqués
comme **données** (jamais comme accord de l'humain, n° 182). Plafond de coût
par équipe avant de lancer (n° 223).

**19. Cliquer dans l'aperçu ouvre le code.** Dépend de l'aperçu de la V1 (le
plan du 25/09 rappelle qu'`exposePort` exige un domaine à nous avec
sous-domaines génériques). Pour les projets React : injecter en développement
un petit script qui, au clic, lit l'emplacement source de l'élément et le
renvoie à l'atelier par `postMessage` ; l'atelier appelle `ouvrir(chemin)` à la
bonne ligne.

**20. Le vrai direct.** Dans `moteur.js`, demander la réponse du modèle **en
flux** et accumuler les morceaux d'arguments de l'appel `ecrire_fichier` ; un
petit analyseur de JSON incomplet extrait `contenu` au fur et à mesure. Le
Durable Object pousse ces morceaux à l'écran par un flux (lu avec `fetch` et un
`ReadableStream`, car `EventSource` ne permet pas non plus d'en-tête
`Authorization`). L'écran les montre en **texte fantôme** : rien n'est écrit
dans le projet avant l'autorisation, la politique ne change pas. Cela remplace
aussi la relève toutes les 2 secondes.

---

## 4. Les licences des bibliothèques proposées

Versions et licences lues **dans le registre npm ou PyPI le 24/09/2026**
[vérifié]. MIT, ISC, BSD et Apache-2.0 permettent l'usage commercial en gardant
l'avis de licence. MPL-2.0 aussi, mais si l'on **modifie** un de ses fichiers,
ce fichier modifié doit rester public.

| Bibliothèque | Version | Licence | Sert à |
|---|---|---|---|
| `@codemirror/lint`, `merge`, `lsp-client`, `collab`, `lang-markdown`, `lang-sql`, `lang-yaml` | 6.9.7 / 6.12.2 / 6.3.0 / 6.1.1 / 6.5.2 / 6.10.0 / 6.1.3 | MIT | erreurs, diff en place, serveur de langage, collaboration, langages |
| `@replit/codemirror-vim`, `-minimap`, `-indentation-markers` | 6.4.0 / 0.5.2 / 6.5.3 | MIT | Vim, mini-carte, guides |
| `y-codemirror.next`, `yjs`, `y-websocket` | 0.3.6 / 13.6.33 / 3.1.0 | MIT | curseurs et édition à plusieurs |
| `y-partykit` | 0.0.33 | ISC | Yjs sur Cloudflare |
| `codemirror-copilot` | 0.0.7 | MIT | texte fantôme |
| `@valtown/codemirror-ts` | 2.3.1 | ISC | types TypeScript |
| `@marimo-team/codemirror-languageserver` | 2.0.0 | BSD-3-Clause | autre client de serveur de langage |
| `@astral-sh/ruff-wasm-web` | 0.16.9 | MIT | Ruff dans le navigateur (API expérimentale) |
| `eslint-linter-browserify` | 10.11.0 | MIT | ESLint dans le navigateur |
| `@typescript/vfs` | 1.6.5 | MIT | TypeScript dans le navigateur |
| `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links` | 6.0.0 / 0.11.0 / 0.12.0 | MIT | terminal |
| `@cloudflare/sandbox` (déjà utilisé) | 0.12.10 | Apache-2.0 | bac à sable, terminal, interpréteur |
| `agents` (Cloudflare), `partykit` | 0.24.0 / 0.0.115 | MIT | flux temps réel |
| `ansi_up` | 6.0.6 | MIT | couleurs du terminal en HTML |
| `marked` | 18.0.14 | MIT | Markdown des carnets |
| `dompurify` | 3.4.16 | MPL-2.0 ou Apache-2.0 (au choix) | nettoyer le HTML |
| `@jupyterlab/nbformat` | 4.5.11 | BSD-3-Clause | types du format `.ipynb` |
| `pyodide` | 314.0.7 | MPL-2.0 | Python dans le navigateur |
| `diff2html` | 3.4.56 | MIT | diff en HTML |
| `shiki-magic-move` | 1.4.0 | MIT | transformation de code animée |
| `codehike` | 1.1.0 | MIT | explications qui défilent |
| `asciinema-player` | 3.17.0 | Apache-2.0 | rejouer un terminal |
| `vega-embed` | 7.3.0 | BSD-3-Clause | graphiques |
| `plotly.js-dist-min` | 4.1.1 | MIT | graphiques |
| `axe-core` | 4.13.0 | MPL-2.0 | accessibilité |
| `lottie-web`, `@rive-app/react-canvas` | 5.13.0 / 4.35.0 | MIT | animations du bureau (les dessins ont leur propre licence) |
| `qrcode` | 1.5.4 | MIT | QR codes |
| `@mlc-ai/web-llm` | 0.2.85 | Apache-2.0 | petit modèle dans le navigateur |
| PyPI : `marimo` | 0.25.0 | Apache-2.0 | carnets réactifs |
| PyPI : `ruff` | 0.16.9 | MIT | lint Python dans le bac |
| PyPI : `jupyter-ai`, `nbformat`, `nbclient` | 3.2.0 / 5.11.1 / 0.11.0 | BSD-3-Clause | écosystème Jupyter |
| PyPI : `duckdb` | 1.5.5 | MIT | cellules SQL |
| Pixel Agents (GitHub) | — | MIT (lu sur la page du dépôt) [vérifié] | idée du bureau ; les graphismes seraient à revérifier |

Déjà dans le projet : `codemirror` et les `@codemirror/lang-*` (MIT).

---

## 5. Sources (toutes consultées le 24/09/2026)

**Lues en entier [vérifié]**

- Cloudflare, Terminal API — https://developers.cloudflare.com/sandbox/api/terminal
- Cloudflare, changelog « Interactive browser terminals in Sandboxes », 09/02/2026 — https://developers.cloudflare.com/changelog/post/2026-02-09-pty-terminal-support/
- Cloudflare, Code Interpreter API — https://developers.cloudflare.com/sandbox/api/interpreter/
- Paquet `@cloudflare/sandbox` 0.12.10 (publié le 23/09/2026 d'après le registre), fichiers de types ouverts : `terminal`, `runCode`, `createCodeContext`, `watch`, `execStream`, `exposePort`, `createBackup`, export `./xterm` — https://registry.npmjs.org/@cloudflare/sandbox
- Paquets `@codemirror/merge`, `@codemirror/lint`, `@codemirror/lang-json`, `@codemirror/lang-javascript` : présence de `diff`, `unifiedMergeView`, `acceptChunk`, `rejectChunk`, `linter`, `lintGutter`, `setDiagnostics`, `jsonParseLinter`, `esLint` — registre npm
- Registre npm et PyPI pour toutes les versions et licences de la partie 4
- Zed, Agent Panel — https://zed.dev/docs/ai/agent-panel
- Pixel Agents (GitHub, licence MIT) — https://github.com/pixel-agents-hq/pixel-agents
- Claude Code, Agent teams — https://code.claude.com/docs/en/agent-teams
- Replit, App Testing — https://docs.replit.com/replitai/app-testing
- GitHub Blog, « How to orchestrate agents using mission control », 01/12/2025 — https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/
- Cursor, « Direct agents with visual prompts in Design Mode », 05/06/2026 — https://cursor.com/blog/design-mode

**Résumés de recherche seulement [rapporté]**

_Éditeurs et agents de code_
- Cursor 2.0, octobre 2025 — https://cursor.com/blog/2-0 ; Cursor 3, fenêtre Agents — https://cursor.com/changelog/3-0 ; éditeur visuel du navigateur, décembre 2025 — https://cursor.com/blog/browser-visual-editor
- Zed, multijoueur et agents parallèles — https://www.digitalapplied.com/blog/zed-ai-coding-deep-dive-multiplayer-agents-2026
- VS Code : relire et annuler les changements d'agent — https://code.visualstudio.com/docs/agents/run/review-code-edits ; points de retour — https://code.visualstudio.com/docs/copilot/chat/chat-checkpoints ; sessions — https://code.visualstudio.com/docs/agents/run/sessions/manage-sessions
- GitHub Copilot, Next Edit Suggestions, 06/02/2025 — https://github.blog/changelog/2025-02-06-next-edit-suggestions-agent-mode-and-prompts-files-for-github-copilot-in-vs-code-january-release-v0-24/ ; Agent HQ — https://github.blog/news-insights/company-news/welcome-home-agents/
- Claude Code : styles de sortie (Explicatif, Apprentissage, `TODO(human)`) — https://code.claude.com/docs/en/output-styles ; rembobiner — https://www.buildthisnow.com/blog/guide/mechanics/claude-code-checkpoints-rewind ; dictée vocale, mars 2026 — https://code.claude.com/docs/en/voice-dictation ; Remote Control, février 2026 — https://code.claude.com/docs/en/remote-control et https://simonwillison.net/2026/Feb/25/claude-code-remote-control/
- OpenAI Codex (application, arbres de travail, automatisations) — https://openai.com/index/introducing-the-codex-app/
- Google Jules (plan, critique, journal audio) — https://jules.google/docs/changelog/ ; critique de plan, 26/01/2026 — https://jules.google/docs/changelog/2026-01-26-1/
- Windsurf (Cascade, aperçus, points de retour) — https://www.datacamp.com/tutorial/windsurf-ai-agentic-code-editor
- Warp 2.0 — https://www.warp.dev/blog/reimagining-coding-agentic-development-environment ; agents — https://docs.warp.dev/agent-platform/local-agents/overview
- Aider : lint et tests — https://aider.chat/docs/usage/lint-test.html ; carte du dépôt — https://aider.chat/docs/repomap.html ; historique (commentaires IA, voix) — https://aider.chat/HISTORY.html ; guide — https://www.deployhq.com/guides/aider
- Cline, auto-approbation — https://docs.cline.bot/features/auto-approve
- Roo Code, Boomerang — https://docs.roocode.com/features/boomerang-tasks ; coûts des sous-tâches — https://github.com/RooCodeInc/Roo-Code/issues/5376 ; vidéo YouTube — https://www.youtube.com/watch?v=RX862U09fnE (non regardée)
- Kilo Code — https://kilo.ai/code ; Continue — https://docs.continue.dev/ ; Tabby — https://github.com/TabbyML/tabby
- Devin, outils de session — https://docs.devin.ai/work-with-devin/devin-session-tools
- OpenHands, fonctions clés — https://docs.openhands.dev/openhands/usage/key-features
- Replit Agent 3 — https://replit.com/blog/introducing-agent-3-our-most-autonomous-agent-yet ; points de retour — https://docs.replit.com/core-concepts/agent/checkpoints-and-rollbacks ; multijoueur et observation — https://docs.repl.it/replit-workspace/workspace-features/multiplayer
- Bolt / WebContainers — https://blog.stackblitz.com/posts/introducing-webcontainers/ et https://github.com/stackblitz/bolt.new
- Lovable, Visual Edits — https://lovable.dev/blog/introducing-visual-edits et https://docs.lovable.dev/features/preview-toolbar ; vidéo — https://www.youtube.com/watch?v=2dMYc7NVz0s (non regardée)
- v0, Design Mode — https://community.vercel.com/t/introducing-design-mode-on-v0/13225
- Firebase Studio — https://firebase.google.com/docs/studio/get-started-ai
- Ona (ex-Gitpod) — https://ona.com/stories/gitpod-is-now-ona ; CodeSandbox SDK — https://codesandbox.io/sdk
- Vibe Kanban (arrêt de l'entreprise annoncé le 10/04/2026, projet continué en libre) et autres orchestrateurs — https://www.augmentcode.com/tools/open-source-agent-orchestrators
- Hacker News, synthèses 2026 — https://www.developersdigest.tech/blog/what-hacker-news-gets-right-about-ai-coding-agents-2026

_Python, carnets, données_
- Colab, Data Science Agent — https://docs.cloud.google.com/colab/docs/use-data-science-agent ; expliquer et corriger les erreurs — https://docs.cloud.google.com/colab/docs/explain-errors
- marimo — https://marimo.io/ et https://docs.marimo.io/
- Jupyter AI v3 — https://github.com/jupyterlab/jupyter-ai et https://tfir.io/jupyter-ai-3-agentic-notebooks-lahari-chowtorri-amazon/
- Collaboration en temps réel JupyterLab — https://jupyterlab.readthedocs.io/en/stable/user/rtc.html
- JupyterLite / Pyodide — https://github.com/jupyterlite/pyodide-kernel
- Deepnote Agent — https://deepnote.com/docs/deepnote-agent ; Hex Notebook Agent — https://hex.tech/blog/introducing-notebook-agent/
- Ruff playground et paquet WebAssembly — https://github.com/astral-sh/ruff/blob/main/playground/README.md

_Éditeur (bibliothèques)_
- `@codemirror/lsp-client` — https://github.com/codemirror/lsp-client
- `y-codemirror.next` — https://github.com/yjs/y-codemirror.next
- `@codemirror/merge` — https://github.com/codemirror/merge
- `codemirror-copilot` — https://github.com/asadm/codemirror-copilot
- Cloudflare, sortie en direct — https://developers.cloudflare.com/sandbox/guides/streaming-output/ ; terminal collaboratif — https://cloudflare-sandbox-sdk.mintlify.app/examples/collaborative-terminal

_Équipes d'agents et simulations_
- Generative Agents / Smallville (UIST 2023) — https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763
- ChatDev — https://github.com/openbmb/ChatDev
- MetaGPT — https://arxiv.org/html/2308.00352v6
- Magentic-One — https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/
- TheAgentCompany — https://github.com/TheAgentCompany/TheAgentCompany
- CrewAI, processus hiérarchique — https://docs.crewai.com/en/learn/hierarchical-process
- AutoGen Studio — https://microsoft.github.io/autogen/stable//user-guide/autogenstudio-user-guide/usage.html
- LangGraph Studio — https://mem0.ai/blog/visual-ai-agent-debugging-langgraph-studio ; voyage dans le temps — https://docs.langchain.com/oss/python/langchain/frontend/time-travel
- Anthropic, Project Vend phase 2 — https://www.anthropic.com/research/project-vend-2
- Moltbook, lancé le 28/01/2026 — https://arxiv.org/html/2602.10127v1
- Pixel Agents, article de presse citant le message Reddit de son auteur — https://www.inc.com/fast-company-2/this-pixel-art-game-solves-1-of-ai-codings-most-annoying-problems/91311290

_Apprendre_
- Scrimba — https://scrimbaguide.tech/docs/how-it-works/how-scrims-work/ et https://survivejs.com/blog/scrimba-interview/
- CodeTour — https://github.com/microsoft/codetour
- Code Hike — https://codehike.org/docs/layouts/scrollycoding ; vidéo — https://www.youtube.com/watch?v=7O2b7vfk-mo (non regardée) ; Hacker News — https://news.ycombinator.com/item?id=26466474
- Shiki Magic Move — https://github.com/shikijs/shiki-magic-move
- Python Tutor : cité de mémoire, **non relu** le 24/09

---

## 6. Rapport court

**Les 10 idées les plus fortes**

1. **L'écriture animée avec le curseur à visage** (1, 2) : c'est exactement ce que Beau a demandé, et nos données le permettent déjà.
2. **Suivre l'agent** (3) : l'éditeur ouvre tout seul ce que l'agent lit ; un jour de travail.
3. **La photo de l'agent dans la conversation** (155, 156) : les photos existent déjà dans Léo.
4. **La proposition en place, Autoriser dans l'éditeur** (7) : on valide là où l'on regarde.
5. **Les erreurs soulignées + « Corriger / Expliquer »** (42, 43, 48) : l'effet VS Code et Colab, presque gratuit.
6. **Le carnet `.ipynb` exécuté dans le bac à sable** (76 à 79) : notre version du SDK a déjà l'interpréteur.
7. **Le vrai terminal** (111, 118) : notre version du SDK a déjà le terminal et son extension xterm.js.
8. **Le bureau des agents et l'organigramme vivant** (157, 158) : « voir l'équipe travailler », en respectant le style de Beau.
9. **Le tableau de tâches d'équipe avec manager et stagiaires** (162 à 166), avec les leçons de Project Vend (181, 198).
10. **Le ralenti honnête** (276) : on montre l'agent écrire sans jamais faire passer une animation pour du direct.

**Les 5 à faire cette semaine** (dans l'ordre, tout sur `staging`)

1. **Photo de l'agent et « qui code »** (partie 3, n° 1) — facile.
2. **Suivre l'agent** (n° 2), avec le champ `chemin` ajouté aux actions — facile.
3. **Écriture animée + curseur à visage + badge « rejoué »** (n° 4) — moyen.
4. **Erreurs de syntaxe et JSON soulignées, puis Ruff pour Python** (n° 6 et 7) — facile puis moyen.
5. **Lecteur de `.ipynb`** (n° 12), en lecture d'abord ; l'exécution des cellules (n° 13) suit dès que l'on a vérifié que pandas et matplotlib sont dans l'image Python.

**Ce qu'il faudra de Beau** : choisir le style du bureau des agents (pixel art
ou vintage crème, terracotta, laiton) sur deux maquettes, et essayer
l'animation sur un écran large **et** sur son téléphone (une capture à 390 px
ne suffit pas, § 6 de `CLAUDE.md`).
