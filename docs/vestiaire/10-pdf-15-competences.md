# 10 — PDF « 15 compétences qui travaillent pour toi »

- **Source** : https://drive.google.com/file/d/19ZhvAH_3oAPVfZWb-ePaRuk4tjR2df2j/view
- **Type** : fichier Drive (PDF de 6 pages, guide pratique d'un créateur francophone)
- **Accès** :
  - **PDF** : téléchargé par le lien direct et **lu en entier**. Le pied de page numérote « 1/7 … 6/7 » mais le fichier ne contient que 6 pages, donc une septième page annoncée manque.
  - **Compétences citées** : j'ai ouvert leurs dépôts pour vérifier ce qu'elles contiennent vraiment, sans rien installer ni exécuter. Lues en entier : `grilling` / `grill-me`, `caveman`, `web-design-guidelines`, `find-skills` (début), `anti-ui-slop` (compétence + règles d'audit). Lues en partie : `ai-seo`, `content-strategy`, `seo-audit`, `pricing`, `minimalist-ui`, `video-lens` (en-tête).
  - Non ouvertes : `ui-ux-pro-max`, `agent-browser`, `video-use` (licences vérifiées seulement), et `canvas-design` (déjà traitée dans la fiche 02).
- **Licence / droits** :
  - **le PDF** : aucune licence (tous droits réservés), on n'en reprend pas le texte ;
  - **MIT** : mattpocock/skills, coreyhaines31/marketingskills, leonxlnx/taste-skill, kar2phi/video-lens, nextlevelbuilder/ui-ux-pro-max-skill, browser-use/video-use, vercel-labs/skills ; vercel-labs/agent-skills est aussi sous MIT, mais seul son README le dit (pas de fichier de licence) ;
  - **Apache-2.0** : vercel-labs/agent-browser ;
  - **caveman** : MIT, sauf certains dossiers « moteur » sous BSL-1.1 (pas une licence libre) ;
  - **anti-ui-slop (UIZZE)** : fichier de licence Apache-2.0, alors que l'en-tête de la compétence dit « MIT ». Les deux permettent de s'inspirer ;
  - **canvas-design** : Apache-2.0 (voir 02).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un guide illustré qui liste 15 « skills » à installer dans Claude Code, avec pour chacune une ligne d'explication, la commande `npx skills add …` et un nombre d'« installations ». Il est rangé en quatre blocs :
- avant de publier : interrogatoire de plan, stratégie de contenu, réponses courtes, anti-look de gabarit, épure, notes de vidéo YouTube ;
- site et interface : design, règles de Vercel, navigateur piloté par l'IA, audit SEO, référencement par les IA ;
- produire et vendre : visuel, montage vidéo, prix ;
- le dernier : un moteur de recherche de skills.

Page 2 : un avertissement juste. Une skill tourne avec tous les droits de l'agent, donc on n'installe que depuis une source connue.

## Ce qui est vraiment utile pour Finjaro et Léo
Le PDF lui-même est un catalogue. La valeur est dans quatre des compétences qu'il pointe, une fois lues :
- **`grilling` (derrière `grill-me`)** : une méthode d'interrogatoire.
  - Les décisions d'un plan forment un arbre.
  - À chaque tour, on pose toutes les questions dont les préalables sont réglés, numérotées, chacune avec la réponse qu'on recommande.
  - On cherche soi-même les faits, et on ne laisse à l'humain que les décisions.
  - On ne commence rien avant que toutes les branches soient visitées.

  Idéal pour Beau, qui dicte vite et dont le texte arrive parfois déformé (CLAUDE.md §7).
- **`anti-ui-slop` (UIZZE)** : deux idées très saines.
  - Le produit existant, ses composants et son style passent AVANT la compétence. C'est compatible avec le style vintage de Beau, contrairement à `minimalist-ui`.
  - Un audit ne relève que ce qu'on voit réellement : au plus trois problèmes, classés par gêne pour l'utilisateur, chacun avec sa preuve et la plus petite correction possible, sans transformer un goût personnel en défaut.
- **`ai-seo` et `seo-audit` (marketingskills)** :
  - la différence entre être classé (SEO) et être cité par une IA ;
  - des blocs de réponse courts et autonomes, des tableaux de comparaison, une FAQ ;
  - vérifier que `robots.txt` n'interdit pas les robots des IA ;
  - le rappel de Google : pas de contenu écrit « pour les IA », mais un contenu clair écrit pour les gens ;
  - dans `seo-audit`, une liste de défauts propres aux boutiques en ligne (pages de catégorie trop maigres, descriptions dupliquées, produits épuisés mal gérés) et aux sites multilingues (hreflang), qui s'applique directement à Finjaro.
- **`content-strategy`** :
  - séparer le contenu « qu'on cherche » (répond à une demande existante) du contenu « qu'on partage » (crée la demande) ;
  - noter chaque idée sur quatre critères pondérés : impact client 40 %, lien avec le produit 30 %, potentiel de recherche 20 %, effort 10 % ;
  - répartir le calendrier en 60 % cherché, 30 % partagé, 10 % essais.
- **`caveman`** : réponses très compressées. Deux bonnes règles pour nos comptes rendus : on n'enlève jamais « ne… pas / jamais / seulement », et on sort du mode court pour un avertissement de sécurité ou une action irréversible. Le mode lui-même ne convient pas à Beau (voir Limites).
- **`web-design-guidelines`** : ce n'est qu'un renvoi vers une liste de règles en ligne de Vercel. Utile à Ada et Claude, qui peuvent aller la chercher.

## Pour quels agents de Léo
- **Lien (relation) et Orchestre** : l'interrogatoire en arbre, pour transformer une demande floue de Beau en décisions claires avant de lancer un chantier.
- **Alpha** : le même interrogatoire avant un choix technique.
- **Miroir (critique des pages)** : la règle d'audit d'anti-ui-slop : trois constats au plus, avec preuve, sans goût personnel. Surtout : le style existant de Finjaro fait foi.
- **Écho (marketing) et Plume (contenu)** : la grille de priorité des idées de contenu, le partage cherché / partagé, la façon d'écrire pour être cité par les IA.
- **Semeur (acquisition acheteurs)** : le référencement classique et par les IA, pour que Finjaro soit trouvé.
- **Ada Nkemba** : la liste de défauts SEO propres aux boutiques et aux sites multilingues, à corriger dans le code (données produit structurées, hreflang, pages épuisées).
- **Vigie (veille)** : `find-skills` et l'annuaire skills.sh comme source de veille, avec l'avertissement du PDF sur l'origine.
- **Mentor** : le PDF est un bon exemple du format « compétence = description qui dit quand s'en servir + consignes ».

## Compétences à tirer (pour Mentor)

**Interroger Beau jusqu'à ce que le plan soit clair** — Lien, Orchestre, Alpha
Quand Beau demande un chantier qui comporte plusieurs décisions, ne commence pas tout de suite. Dresse la liste des décisions à prendre. Pose en un seul message toutes celles qui peuvent déjà être tranchées, numérotées, chacune avec ta recommandation (« Q1 — Devise de la page vendeur : … → je recommande … »). Ce que tu peux vérifier toi-même (un réglage, un chiffre, un fichier), va le chercher : ne le demande pas. Après ses réponses, pose les questions qui en découlent. Arrête-toi quand il ne reste plus de décision implicite, puis résume et attends son accord. Piège : poser des questions dont la réponse dépend d'une autre question pas encore tranchée. Autre piège : noyer Beau sous des questions qu'on aurait pu régler seul.
*Source : inspiré de `grilling` (mattpocock/skills, MIT).*

**Critiquer une page sans imposer son goût** — Miroir, Rigo
Juge seulement ce qu'on voit sur la page réelle, à plusieurs largeurs d'écran, pas seulement 390 px (CLAUDE.md §6). Regarde dans cet ordre :
1. l'action principale est-elle claire ?
2. la page est-elle cohérente avec le reste de Finjaro (crème, terracotta, laiton, grands titres) ?
3. y a-t-il des débordements, des images coupées ou déformées ?
4. les états existent-ils : chargement, vide, erreur, succès ?
5. libellés, contraste, taille des boutons.

Rends au plus trois constats, du plus gênant au moins gênant, avec pour chacun ce que tu as vu et la plus petite correction. Si rien d'important ne cloche, dis-le en une ligne. Piège : proposer une refonte « plus sobre ». Le style vintage est un choix de Beau, pas un défaut.
*Source : inspiré de `anti-ui-slop` (UIZZE, Apache-2.0 / MIT), partie audit.*

**Choisir quoi publier en premier** — Écho, Plume
Pour chaque idée de contenu, donne une note de 1 à 10 sur quatre critères, puis fais la moyenne pondérée :
- à quel point ça touche un vrai problème de nos vendeurs ou acheteurs (40 %) ;
- à quel point ça mène naturellement à Finjaro (30 %) ;
- est-ce que des gens le cherchent déjà (20 %) ;
- est-ce faisable avec ce qu'on a, nos photos et nos chiffres réels (10 %).

Publie d'abord les mieux notées. Sur un mois, vise à peu près 60 % de contenu qui répond à une recherche (« comment vendre en ligne sans site »), 30 % de contenu qui se partage (une histoire de vendeuse, avec son accord) et 10 % d'essais. Piège : un chiffre non mesuré ne s'écrit pas (CLAUDE.md §3), même s'il rendrait le contenu plus « partageable ».
*Source : inspiré de `content-strategy` (coreyhaines31/marketingskills, MIT).*

**Être trouvé par Google et cité par les IA** — Semeur, Plume, Ada Nkemba
Commence chaque page d'aide ou de catégorie par une réponse directe de 40 à 60 mots, compréhensible sans le reste de la page. Utilise des titres formulés comme les gens posent la question, un tableau quand on compare, une FAQ en questions naturelles. Chaque chiffre est sourcé ou absent. Côté technique (Ada) :
- `robots.txt` n'interdit pas les robots des moteurs d'IA (sauf décision de Beau) ;
- les fiches produit ont leurs données structurées ;
- les pages d'articles épuisés restent utiles au lieu de disparaître ;
- chaque langue a sa balise hreflang et une page par défaut.

Piège : écrire des pages « pour les IA » en double. Google le traite comme du contenu abusif. On écrit pour les gens, on organise clairement.
*Source : inspiré de `ai-seo` et `seo-audit` (coreyhaines31/marketingskills, MIT).*

**Faire court sans changer le sens** — tous les agents, pour les comptes rendus
Un compte rendu à Beau va droit au fait : ce qui est fait, ce qui ne l'est pas, ce qu'il doit décider. Supprime les formules de politesse, les annonces (« je vais maintenant… ») et les répétitions. Ne supprime jamais un « ne… pas », un « jamais », un « seulement » ni un chiffre. Reviens à des phrases complètes pour un avertissement, une action irréversible ou une suite d'étapes dont l'ordre compte. Piège : le style télégraphique rend le texte difficile à lire à voix haute ou pour un non-développeur. Beau ne code pas : phrases courtes, oui ; phrases cassées, non.
*Source : inspiré de `caveman` (juliusbrussee/caveman, partie MIT), adapté.*

## Limites, risques, prudence
- **Les nombres d'« installations » du PDF ne sont pas vérifiés.** Ils viennent sans doute de l'annuaire skills.sh et ne disent rien de la qualité. Le « −65 % de tokens » de `caveman` est une mesure de son auteur, comme le PDF le dit lui-même.
- **Aucun de nos agents sans terminal ne peut installer ces skills.** Les commandes `npx skills add` exécutent du code tiers avec les droits de l'agent. On ne les passe à Claude ou Ada qu'après accord de Beau et lecture de la compétence.
- **Conflits de style** : `minimalist-ui` impose une palette monochrome, pas de couleurs vives en fond, et interdit certaines polices et icônes. `ui-ux-pro-max` propose un design complet. Les deux risquent de « raboter » le style vintage de Beau (CLAUDE.md §6). À ne pas donner à Miroir ni à Ada comme référence de goût.
- **`caveman` (mode ultra, variantes en chinois classique)** : illisible pour Beau. Certains dossiers du dépôt sont sous licence BSL, pas libre.
- **`video-lens` et `video-use`** demandent Python, yt-dlp, parfois un Mac Apple Silicon : réservés au poste de Claude. Aucune valeur pour les autres agents.
- **`agent-browser`** : piloter un navigateur est utile pour tester finjaro.net, mais c'est un outil de Claude ou Ada, pas une consigne.
- **`anti-ui-slop`** renvoie à un service payant de l'éditeur (« 800 000 écrans ») : chiffre commercial non vérifié, et option payante non nécessaire.
- `grill-me`, dans le dépôt actuel, n'est plus qu'un renvoi vers `grilling`. Le nom du PDF est donc déjà daté.
- Le PDF annonce 7 pages ; le fichier en contient 6.

## Verdict
**Retenu pour quatre méthodes** : l'interrogatoire en arbre (Lien, Orchestre, Alpha), l'audit sobre qui respecte le style existant (Miroir), la priorité des contenus (Écho, Plume) et l'écriture pour être trouvé et cité (Semeur, Plume, Ada). S'y ajoute une règle de compte rendu court tirée de `caveman`. Le reste (skills de design minimaliste, vidéo, navigateur) est **gardé en réserve** pour Claude côté code, ou **mis de côté** parce qu'il entre en conflit avec le style de Beau. Le PDF lui-même n'est qu'un index : sa valeur est dans les dépôts qu'il cite.
