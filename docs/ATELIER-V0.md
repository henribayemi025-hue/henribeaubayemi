# L'Atelier de code — V0 : ce qui est fait, et ce que Beau doit régler

_24/09/2026. Plan : `docs/plans/2026-09-24-atelier-de-code-et-jarvis.md`,
partie 1, étape V0 (§1.8)._

## Ce que fait la V0

- Un écran **Atelier** dans Léo (icône `</>` dans le rail, seulement dans
  l'entreprise Finjaro et pour son propriétaire) : l'arbre des fichiers,
  l'éditeur, la conversation avec le Codeur, les cartes d'autorisation, les
  modifications en vert et rouge, le journal, le coût de la session et un gros
  bouton **Stop**. Sur téléphone : trois onglets.
- **Un seul mode d'action : Demander.** L'agent lit librement ; chaque
  modification de fichier et chaque commande affiche une carte « Autoriser
  une fois / Toujours pour cette commande (ou ce fichier) dans ce projet /
  Refuser ». Plus **Réfléchir d'abord** (lecture seule, un plan) et
  **Présente-moi comment ça marche** (lecture seule, une visite guidée).
  C'est le serveur de l'atelier qui applique ces règles, pas la consigne
  donnée au modèle.
- **Aucun envoi sur GitHub, aucun déploiement** : le projet sort seulement
  par **Exporter en .zip**.
- Un **plafond dur par session** (1 $ au départ, réglable) et la **mesure
  réelle** du coût : jetons des modèles et temps du bac à sable, aux prix
  publiés.

## Ce que Beau doit faire chez Cloudflare (une seule fois)

Tout se fait sur <https://dash.cloudflare.com>, dans le compte où vit déjà
finjaro.net.

1. **L'offre payante Workers (5 $ par mois).** Menu **Workers & Pages** →
   **Plans** (ou « Mettre à niveau »). Si l'offre « Workers Paid » est déjà
   active, il n'y a rien à faire. Sans elle, le bac à sable ne peut pas
   démarrer (les conteneurs n'existent que sur l'offre payante).
2. **Créer le Worker de l'atelier, branché sur le dépôt.** **Workers & Pages**
   → **Create application** → à côté de **Import a repository**, **Get
   started** → compte GitHub `henribayemi025-hue` → dépôt
   `henribeaubayemi`. Puis, sur l'écran de configuration :
   - **Project name** : `finjaro-atelier` (exactement : c'est le nom écrit
     dans `atelier/wrangler.jsonc`, sinon la construction échoue) ;
   - **Root directory** (ou **Path**, dans les réglages avancés) : `atelier` ;
   - **Build command** : `npm ci` ;
   - **Deploy command** : `npx wrangler deploy` ;
   - **Production branch** : `staging` (la V0 vit sur staging ; le site
     finjaro.net n'est pas touché).
   → **Save and Deploy**. La première fois, Cloudflare construit l'image du
   bac à sable : compter quelques minutes, puis encore 2 à 3 minutes avant
   que le bac à sable réponde.
3. **Deux réglages dans ce nouveau Worker**, onglet **Settings** → **Builds** :
   - **Build watch paths** : inclure `atelier/*` (le Worker ne se
     reconstruit que si son dossier change) ;
   - **Non-production branch builds** : **désactivés** (pour un Worker avec
     conteneur, ces constructions n'envoient pas l'image : inutile et
     trompeur).
4. **Les clés des modèles — FACULTATIF depuis le 24/09 au soir.** L'atelier
   passe par la fonction Supabase `atelier-modele`, qui a déjà les clés de
   Léo (voir « Le relais des modèles » plus bas). Une clé posée ici reste
   prioritaire (appel direct, sans passer par Supabase). Pour en poser une
   quand même : onglet **Settings** → **Variables and Secrets**
   → **Add** → type **Secret** (jamais « Text ») :
   - `DEEPSEEK_API_KEY` : la même clé DeepSeek que Léo (le premier modèle
     essayé ; conseillé) ;
   - `KIMI_API_KEY` : facultatif, la relève ;
   - `GEMINI_API_KEY` : facultatif, en dernier ; tant que le plafond de
     dépense Google est atteint, l'atelier s'en passe tout seul.
   Aucune autre clé. **Jamais** la clé de service Supabase : l'atelier n'en
   a pas besoin (il agit avec la session de la personne connectée).
   Ne pas ajouter de variable « Text » ici : les réglages non secrets sont
   dans `atelier/wrangler.jsonc` et seraient écrasés à chaque déploiement.
5. **Le domaine** : rien à faire. L'atelier répond sur
   `https://finjaro-atelier.finjaro.workers.dev` (c'est l'adresse que Léo
   appelle). Pour vérifier : ouvrir cette adresse dans le navigateur doit
   afficher « Atelier de Léo : en service. »
6. **Supabase** : rien à changer côté connexion (ni Site URL, ni Redirect
   URLs : l'atelier réutilise la session de Léo). Seule la migration
   ci-dessous est à appliquer, quand Beau le décide.

## Le relais des modèles : la fonction Supabase `atelier-modele` (24/09 au soir)

Beau : tous les modèles au choix dans l'atelier, sans recopier chaque clé
dans Cloudflare. Les clés sont déjà dans les secrets des fonctions Supabase
(`DEEPSEEK_API_KEY`, `KIMI_API_KEY`, `GEMINI_API_KEY`, la clé OpenAI rangée
sous « Leo », `ANTHROPIC_API_KEY` si elle existe un jour).

- Pour tout modèle dont la clé n'est pas dans le Worker, le Worker appelle
  `https://bokwivwizghdlaedczbw.supabase.co/functions/v1/atelier-modele` avec
  le jeton Supabase de la personne. La fonction vérifie la même règle que le
  Worker (propriétaire de l'entreprise Finjaro dans Léo), transmet la requête
  au bon fournisseur et rend sa réponse telle quelle. Aucune clé ne sort de
  Supabase, aucune n'entre dans le bac à sable.
- Claude Sonnet 5 n'est proposé que par ce relais, et seulement si
  `ANTHROPIC_API_KEY` existe (la fonction traduit son format).
- Limites : 2 Mo par requête, 120 s par appel, 16 384 jetons de sortie au
  plus, et un **plafond de 10 $ par personne et par jour** (somme de
  `atelier_couts` depuis minuit UTC), réglable par le secret Supabase
  `ATELIER_PLAFOND_JOUR_USD`. Le plafond dur de chaque session reste en place.
- Le jeton d'une session Léo vit une heure : s'il expire pendant un long
  travail, l'agent s'arrête et dit « recharge la page (ou reconnecte-toi) » ;
  rien n'est perdu.
- **À déployer** (quand Beau dit oui) : comme toute fonction edge, elle est
  **commune à staging et à la production**. Une poussée sur `staging` qui la
  contient la déploie d'elle-même (`.github/workflows/edge-functions.yml`).
  Elle n'est appelée que par l'atelier : Finjaro Accounting et le site n'en
  dépendent pas. Aucune migration, rien dans `ai_usage` (le coût reste
  compté par l'atelier dans `atelier_couts`).

## La migration à appliquer (quand Beau dit oui)

`supabase/migrations/0200_atelier_de_code.sql` — **additive** : six tables
nouvelles (`atelier_projets`, `atelier_sessions`, `atelier_journal`,
`atelier_demandes`, `atelier_autorisations`, `atelier_couts`) et une
fonction, règles d'accès actives (chacun ne voit que ses projets), journal
impossible à modifier ou effacer. Aucune table existante n'est touchée. Elle
concerne le projet Supabase commun (`bokwivwizghdlaedczbw`), donc aussi
Finjaro Accounting par principe, mais Accounting ne lit ni n'écrit ces
tables. Sans elle, l'atelier marche quand même ; il ne garde alors sa trace
que dans son propre stockage Cloudflare.

## Réglages possibles (dans `atelier/wrangler.jsonc`, par un commit)

- `ATELIER_PLAFOND_SESSION_USD` : le plafond dur d'une session (1 $).
- `ATELIER_UTILISATEURS` : des identifiants de comptes en plus de Beau.
- `ATELIER_TAILLE` et `instance_type` : la taille du bac à sable
  (`standard-1` : ½ vCPU, 4 Gio).
- `ATELIER_VEILLE` : la mise en veille du bac à sable sans travail (10 min).
