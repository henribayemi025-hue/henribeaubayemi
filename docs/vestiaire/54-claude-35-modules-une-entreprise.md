# 54 — « Claude + 35 Add-Ons = A Whole Company » (35 modules pour faire de Claude dix postes)

- **Source** : page Notion publique « Claude + 35 Add-Ons = A Whole Company » (https://app.notion.com/p/Claude-35-Add-Ons-A-Whole-Company-3c6e396e06bb81ebae86c5ffccef698b ; traceurs retirés). L'auteur tient le dépôt « social-media-skills » (charlie947).
- **Type** : liste commentée de 35 outils (dépôts GitHub, connecteurs MCP, API, applications), rangés en dix postes d'une entreprise
- **Accès** : ouvert, lu en entier le 08/10/2026 (130 blocs, dont les 11 tableaux). Le dépôt `charlie947/social-media-skills` a aussi été lu (page GitHub).
- **Licence / droits** : la page n'en indique aucune. Chaque outil a sa propre licence, à vérifier avant toute reprise. `social-media-skills` est sous **MIT** (« Use these however you like »).
- **Reçu de Beau le** : 08/10/2026

## Ce que c'est
L'idée : Claude Code seul est un très bon généraliste. Avec des règles permanentes, du goût, de la mémoire et un accès au monde, il tient dix postes : ingénieur, designer, testeur, documentation, marketing, réseaux sociaux, motion design, recherche, opérations, « l'agence entière ». Sur les 35 outils, 26 sont des dépôts à installer dans Claude Code, 3 des connecteurs MCP, 2 des API et 4 des applications. Cinq sont payants : Codex, Apify, ManyChat, GPT Image 2 et Higgsfield. Le nombre d'étoiles affiché à côté de chaque dépôt est celui de l'auteur, non vérifié. Il conseille un ordre d'installation (karpathy-skills, superpowers, claude-mem, Notion et GitHub en MCP, taste-skill et ui-ux-pro-max, agency-agents) et dit honnêtement qu'il n'en utilise que sept au quotidien.

## Ce qu'on a déjà dans le vestiaire
Environ la moitié : karpathy-skills (fiche 04), anthropics/skills (02), agent-skills (29), ui-ux-pro-max et taste-skill (10, 21), impeccable et wshobson/agents (09), marketingskills et last30days (09, 10), humanizer (48), agency-agents (20), Higgsfield (24, 34, 35), GPT Image 2 (52). HyperFrames : c'est l'outil avec lequel on monte déjà nos vidéos.

## Ce qui est nouveau et vraiment utile pour Finjaro et Léo
- **social-media-skills (MIT)** : 17 compétences pour les réseaux sociaux, une par dossier avec son SKILL.md. Trois idées sont à reprendre pour l'équipe réseaux sociaux de Léo, construite aujourd'hui pour TOUTES les entreprises :
  - un fichier « **voix de la marque** » écrit une fois à partir d'un entretien et d'exemples, que toutes les autres compétences lisent ;
  - un **noteur de publications** qui relit un brouillon à la lumière des publications passées, et se contente d'une relecture éditoriale s'il n'a pas d'historique ;
  - une **matrice de contenus** (piliers × 8 formats, soit 24 à 40 idées), avec **six angles d'accroche** et cinq trames classiques (PAS, AIDA, BAB, STAR, SLAY).
  Comme chez nous, enregistrer un brouillon ne publie rien.
- **La mémoire entre les sessions** (claude-mem, mem0) : Léo a déjà une mémoire par agent. À comparer plus tard, sans urgence.
- **Notion en connecteur MCP** : Léo a GitHub, Supabase, Cloudflare et Vercel, mais pas Notion, alors que beaucoup d'entreprises y rangent leurs documents. Idée de connecteur à proposer.
- **La veille sur le web vivant** (Agent-Reach, last30days) : c'est le métier de Vigie. Nos agents cherchent déjà sur le web par Gemini quand il est disponible.
- **La vidéo libre** (OpenMontage, OpenCut) : des alternatives gratuites pour le montage, à regarder si un jour nos agents montent eux-mêmes.
- **superpowers** et **gstack** : des cadres « planifier avant de coder » pour Claude Code. Notre règle « dérouler les conséquences avant de livrer » (CLAUDE.md §11) va dans le même sens. Rien à installer à l'aveugle.

## Pour quels agents de Léo
- **Plume** et **Écho** : voix de la marque, noteur de publications, matrice de contenus, angles d'accroche, pour la mission « Semaine de publications ».
- **Vigie** : la veille datée des 7 derniers jours (niche-research), avec des sources.
- **Mentor** : la façon d'écrire une compétence (un dossier, un SKILL.md, ses déclencheurs, ses entrées).

## Compétences à tirer (pour Mentor)
**La voix de la marque, écrite une fois** — Plume, Écho — Avant la première publication, interroge l'entreprise : qui elle sert, comment elle parle, les mots qu'elle utilise et ceux qu'elle refuse, trois exemples de textes qu'elle aime. Écris-en une fiche « voix » courte. Ensuite, chaque publication relit cette fiche avant d'être écrite. Sans fiche, dis que la voix n'est pas encore connue plutôt que de l'imiter. Piège : copier le ton d'une autre marque.
**Noter un brouillon avant de le proposer** — Plume, Miroir — Relis le brouillon avec cinq questions. L'accroche se comprend-elle en 3 secondes ? Y a-t-il une seule idée ? Un chiffre non mesuré ? Un appel à l'action clair ? La voix de la marque est-elle respectée ? Compare avec ce qui a déjà marché si l'entreprise a un historique, sinon dis que tu n'en as pas. Piège : noter son propre texte avec indulgence.

## Limites, risques, prudence
- Cinq outils sont payants : rien ne s'achète sans Beau.
- Les nombres d'étoiles et la phrase « tout est gratuit » d'autres listes ne sont pas vérifiés. L'auteur le dit lui-même.
- Installer 35 modules dans une session, c'est surtout du bruit. On prend une idée à la fois, quand elle sert.
- ManyChat, « transformer un commentaire en message privé pendant qu'on dort », c'est envoyer des messages à de vraies personnes au nom de l'entreprise : jamais sans l'accord humain.

## Verdict
**Retenu** : social-media-skills (MIT) comme modèle pour l'équipe réseaux sociaux de Léo (voix de la marque, noteur, matrice, accroches), et l'idée d'un connecteur Notion. Le reste est déjà dans le vestiaire, ou gardé en réserve.
