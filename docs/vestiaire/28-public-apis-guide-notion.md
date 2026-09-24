# 28 — « Public APIs — Guide complet » (page Notion) et le dépôt public-apis

- **Source** : https://dust-lyric-f80.notion.site/Public-APIs-Guide-Complet-3ba0c5d43df6804ca5adfb2d664e5582 (guide), sur le dépôt https://github.com/public-apis/public-apis
- **Type** : page Notion (court guide), à propos d'un dépôt GitHub
- **Accès** : **guide lu en entier.** La page est construite en JavaScript ; je l'ai lue par l'interface publique de Notion (`loadPageChunk`) : 42 blocs, rien de manquant. Elle ne donne ni auteur ni date ; ses métadonnées indiquent une création le 12/08/2026. **Dépôt vérifié à la source** : cloné le 24/09/2026 (dernier commit le même jour) ; lus : LICENSE, CONTRIBUTING, le début du README (publicités, section des serveurs MCP) et la section « taux de change » en entier ; le reste de la liste a été compté, pas lu ligne à ligne. J'ai aussi ouvert le site `publicapis.dev` (page d'accueil) et le README de l'« API de la liste » (`davemachado/public-api`). Le nombre d'étoiles n'a pas pu être vérifié (l'accès à l'API de GitHub est bloqué depuis notre environnement).
- **Licence / droits** : le dépôt public-apis est sous **MIT** (« Copyright (c) 2022 public-apis », fichier LICENSE lu). Chaque API de la liste a **ses propres conditions**, fixées par son fournisseur. Le guide Notion n'a pas de licence (tous droits réservés) : on reprend les idées, pas le texte.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un guide court qui présente public-apis, une très grande liste communautaire d'API gratuites ou avec une offre gratuite, rangées par thèmes (animaux, finance, météo, taux de change, géolocalisation, commerce…). Il explique comment lire une ligne de la liste (type d'authentification, HTTPS, CORS), comment récupérer la liste (clone, site, API), et pourquoi « une agence IA » y gagne : moins d'abonnements payants dans le coût de revient de chaque agent livré. La fin de la page est une publicité pour une formation (« lance ton agence IA à 5 000 € par mois en 120 jours ») et une incitation à commenter une vidéo pour recevoir le lien « en privé ».

## Ce qui est vraiment utile pour Finjaro et Léo
- **La grille de lecture d'une API**, qui vient du dépôt lui-même (CONTRIBUTING) : pour chaque API, l'authentification (aucune, clé, OAuth), le HTTPS, et le CORS (sans CORS, l'API ne peut être appelée que depuis un serveur, pas depuis le navigateur). C'est une bonne première question avant de brancher quoi que ce soit.
- **Le dépôt comme annuaire de départ**, pour Claude et Ada quand un besoin précis apparaît (par exemple valider une adresse, un numéro de TVA, une géolocalisation). On y cherche des pistes, puis on vérifie chez le fournisseur.
- **Les taux de change : déjà réglé chez nous.** Finjaro prend déjà ses taux du jour à une API gratuite (`open.er-api.com`, migration 0181), avec des taux de secours datés dans le code si elle ne répond pas. La liste propose d'autres sources de taux (dont des banques centrales), utiles seulement comme **deuxième source** si la première tombe.
- **Une section « serveurs MCP »** vient d'apparaître dans la liste (outils à brancher directement à un agent). À surveiller pour Léo, avec la plus grande prudence (voir Limites).
- **Ce que la liste n'apporte pas** : paiement, vérification d'identité (KYC), détection de fraude. Ce sont des sujets à données personnelles et à obligations légales ; on ne les choisit pas dans un annuaire gratuit.

## Pour quels agents de Léo
- **Claude** et **Ada Nkemba** : ce sont eux qui branchent une API externe dans Léo ou dans Finjaro ; la compétence ci-dessous est pour eux.
- **Alpha** : il valide toute nouvelle dépendance externe, surtout si elle reçoit des données de vendeuses ou d'acheteurs.
- **Forge** : pour les services IA de la liste (agrégateurs de modèles, extraction de données), à contrôler avec la compétence existante « Contrôler un outil IA avant de le recommander ».
- **Vigie** : pour garder un œil sur la section MCP, sans rien installer.

## Compétences à tirer (pour Mentor)

**Brancher une API externe sans se mettre en danger** — Claude, Ada Nkemba, Alpha, Forge
Une liste d'API n'est qu'un annuaire. Avant de brancher, ouvre la documentation et les conditions du fournisseur lui-même : usage commercial permis ? quota gratuit ? que se passe-t-il au-delà ? Une clé reste côté serveur, dans les secrets, jamais dans le navigateur ni dans une adresse. N'envoie que le strict nécessaire : aucune donnée personnelle de vendeuse ou d'acheteur sans l'accord de Beau. Prévois la panne : une valeur de secours datée, ou rien. Garde en mémoire ce qui change peu (un taux par jour suffit). Date ta vérification. Pièges : une ligne « gratuite » en haut de liste peut être une publicité ; une valeur de secours ne devient jamais une monnaie ou un pays par défaut ; une fonction edge touche staging et production d'un coup.
*Source : grille de lecture du dépôt public-apis (MIT) ; guide Notion sans licence, aucune phrase reprise.*

Déjà couvert ailleurs, donc pas de doublon : le nom exact et la licence d'un dépôt ou d'un paquet (« Recommander un dépôt ou un paquet : le nom exact, l'adresse actuelle, la date »), le coût à l'usage d'un service (« Calculer le prix de revient d'un service IA avant d'annoncer un prix »).

## Limites, risques, prudence
- **Chiffres du guide non vérifiés ou dépassés.** « Plus de 454 000 étoiles » et « le dépôt le plus étoilé de la catégorie » : non vérifiable depuis chez nous, on ne le cite pas. « 1 400+ API en 50+ catégories » : j'ai compté **environ 1 900 lignes réparties en 51 catégories** dans la liste au 24/09/2026. Le chiffre du guide est donc ancien, pas exagéré.
- **La liste est aussi une vitrine publicitaire.** Le haut du README est une publicité pour APILayer (dix produits, liens avec suivi publicitaire), et le README dit que la liste est tenue « par la communauté et par des employés d'APILayer ». Dans la section des taux de change, les produits APILayer passent en tête. Le fichier CONTRIBUTING, lui, refuse les ajouts « marketing ». Conséquence : l'ordre de la liste ne dit rien de la qualité.
- **Le site `publicapis.dev`** conseillé par le guide n'est **pas cité par le dépôt** et affiche des sponsors : on ne sait pas qui le tient. Mieux vaut lire la liste sur GitHub.
- **L'« API de la liste »** (`api.publicapis.org`, décrite par `davemachado/public-api`) n'a pas répondu depuis notre environnement le 24/09/2026 ; je n'en conclus rien de plus, mais on ne bâtit rien dessus.
- **« Sans authentification = utilisable immédiatement »** : vrai techniquement, mais « aucune clé » ne veut dire ni « aucune limite », ni « usage commercial permis », ni « fiable ». Plus de la moitié des lignes (environ 1 000 sur 1 900, compté le 24/09/2026) indiquent un CORS « inconnu ».
- **Serveurs MCP** : un serveur MCP donne à un agent des outils qui agissent (lire et écrire des fichiers, des dépôts, des comptes). Installer un tel serveur, c'est ouvrir des accès larges : rien ne s'installe sans l'accord de Beau (compétence existante « Classer ses actions en trois niveaux de risque »).
- **Données personnelles** : les catégories « validation d'e-mail », « vérification de téléphone », « KYC » citées par le guide reçoivent par nature des données personnelles. Chez Finjaro, elles ne partent pas vers un service choisi dans une liste gratuite.
- **La publicité de fin de page** promet des gains (« +8 200 € en 3 mois », « agence à 5 000 € par mois ») sans aucune preuve, et demande de commenter une vidéo pour recevoir le lien en privé. Promesses chiffrées non vérifiées : rien à en tirer.

## Verdict
**Retenu comme annuaire de référence**, avec une compétence (« Brancher une API externe sans se mettre en danger », pour Claude, Ada Nkemba, Alpha et Forge). Le dépôt est sous MIT et utile pour trouver des pistes ; chaque API se vérifie ensuite chez son fournisseur. **Mis de côté** : les chiffres du guide, le site `publicapis.dev` et la publicité de formation, pour les raisons ci-dessus. Pour les taux de change, **rien à changer** : Finjaro a déjà sa source quotidienne et ses taux de secours datés.
