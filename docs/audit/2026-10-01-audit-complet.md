# Audit complet — Finjaro (place de marché, Léo, Mon argent, base commune)

**Date :** 01/10/2026. **Demandé par :** Beau, étape a) de son cadre de mission
(« audit complet, inventaire exhaustif, sans rien corriger »).
**Exception :** trois failles critiques ont été corrigées le jour même, avec
son accord explicite (voir section 0).

---

## Ce qui a été vérifié, et comment

| Zone | Méthode | Résultat |
|---|---|---|
| Taille | 173 écrans, 78 composants, 60 bibliothèques, 17 hooks, 42 fonctions serveur, 219 migrations, ≈ 93 000 lignes | — |
| Tests | `vitest run` | 45 fichiers, **320 tests qui passent** |
| Compilation | `vite build` | passe ; poids mesuré (section 2) |
| Dépendances | `npm audit` | 10 alertes : 2 élevées, 8 moyennes |
| Base de données | conseillers Supabase sécurité et performance, lus en entier ; droits par rôle (`has_table_privilege`, `has_function_privilege`) ; règles d'accès (`pg_policies`) ; stockage | voir sections 0 à 3 |
| Site en ligne | 37 adresses parcourues sur **finjaro.net**, au format téléphone (390 px) et grand écran (1440 px) : erreurs console, requêtes en échec, images cassées, débordement horizontal, boutons sans libellé, temps de chargement. Les statistiques étaient bloquées pendant le parcours, pour ne pas fausser tes chiffres de visites | voir sections 1 à 3 |
| En-têtes HTTP | `curl -I` sur finjaro.net et staging | aucun en-tête de sécurité |
| Secrets | recherche de motifs de clés dans les 1 054 fichiers suivis | aucun secret serveur ; clés Firebase publiques (normal, mais à restreindre) |
| Code | balayages : traductions, fichiers jamais importés, injections HTML (`innerHTML`, `dangerouslySetInnerHTML`, `eval`), journaux, liens externes | voir sections 1 à 3 |
| Fonctions serveur | lecture des contrôles d'appelant, CORS et limites des 42 fonctions | voir sections 2 et 3 |

### Ce qui n'a PAS pu être testé (donc pas déclaré bon)

- **Les écrans connectés** : espace vendeuse, intérieur de Léo, Console
  d'administration, tunnel de commande avec compte, Mon argent connecté. Je
  n'ouvre pas de session sur un compte réel. Les adresses protégées renvoient
  bien vers `/auth` (vérifié).
- **Les applications Android et iOS** : elles chargent finjaro.net, donc
  partagent tout ce qui suit, mais je ne les ai pas lancées.
- **Finjaro Accounting** : autre dépôt, celui de Claudinette. Seul ce qui
  touche la base commune est signalé ici.
- **Les sauvegardes** : je n'ai pas accès aux réglages du forfait Supabase
  (voir M-12).

---

## 0. Corrigé aujourd'hui, avec ton accord (migration 0224)

| # | Faille | Preuve avant | Preuve après |
|---|---|---|---|
| C-0a | La vue `profiles_public` était **modifiable par n'importe qui sans compte**. On pouvait renommer ou effacer le nom et la photo de TOUS les utilisateurs de tout l'environnement, Accounting compris. | Modification à vide en rôle visiteur, dans une transaction annulée : 1 ligne modifiable | Visiteur : `permission denied for view profiles_public` (HTTP 401) ; la lecture des noms marche toujours (HTTP 200, 117 noms) |
| C-0b | `push_notify` restait appelable par tout le monde : la correction du 28/09 l'avait retiré aux visiteurs et aux comptes, mais pas à PUBLIC. N'importe qui pouvait envoyer une notification « Finjaro » avec un lien piégé à n'importe quel utilisateur. | Droits : `=X/postgres` (PUBLIC) | `permission denied for function push_notify` (401) |
| C-0c | `alert_admins` (notifie tous les admins, titre et lien libres) et `report_unmet_demand` étaient appelables par tout le monde. | anon : exécution permise | anon : refusé ; les déclencheurs et la tâche planifiée marchent toujours (ils tournent avec les droits du propriétaire) |

Claudinette est prévenue, car la base est commune.

---

## 1. CRITIQUE — à traiter en premier

| # | Où | Constat | Proposition |
|---|---|---|---|
| C-1 | `src/components/NearYouMap.jsx:82-88` (aussi 110, 124) | **Injection de code (XSS stockée).** L'adresse de la photo d'une boutique (`avatar_url`) est insérée telle quelle dans du HTML brut (`el.innerHTML`). Une vendeuse peut modifier sa propre boutique (règle `shops_update`, `owner_id = auth.uid()`). Elle peut donc y mettre `http://x" onerror="…`, et ce code s'exécute chez chaque visiteur de la carte « Autour de moi ». Lu dans le code, pas exploité. | Construire les marqueurs avec `createElement` et `setAttribute` (comme `moteur.js:203-205` le fait pour le texte), et refuser en base un `avatar_url` qui n'est pas un chemin de stockage ou une adresse https propre. |
| C-1 suivi | `src/components/NearYouMap.jsx` | **Corrigé le 01/10 sur staging.** L'épingle de boutique est construite pièce par pièce (createElement, textContent, img.src, écouteur d'erreur) : plus aucun HTML brut avec des données de vendeuse ; photo acceptée seulement en https ou en chemin du site. Les deux autres innerHTML (lignes 110 et 124 d'origine) ne contiennent que du texte fixe. Preuves : 4 tests (adresse piégée → aucun attribut onerror, aucun code exécuté ; nom piégé → texte ; http/javascript: → jamais du code ; photo normale affichée, image cassée retirée), 339 tests au total ; carte ouverte à 390 et 1440 px : 18 épingles, 12 photos, 0 erreur. En base : les 47 photos de boutique sont des chemins de stockage, aucune suspecte. | Mise en ligne au mot de Beau. Contrainte en base sur `avatar_url` non ajoutée (table partagée ; le site suffit à neutraliser). |
| C-2 | Stockage, dossier `legion` (public) | Les **documents déposés par les entreprises dans Léo** (PDF, Excel, CSV : 86 fichiers) sont dans un dossier **public**. Les règles d'accès ne s'appliquent qu'à la liste et au dépôt : toute personne qui obtient le lien lit le fichier, sans compte et pour toujours. | Passer le dossier en privé et servir les fichiers par liens signés à durée courte. Vaut pour **toutes** les entreprises de Léo. |
| C-3 | Stockage, dossier `chat` (public) | Les **photos et vocaux des conversations privées** sont lisibles par quiconque a le lien. Même mécanisme que C-2. | Même correction : dossier privé et liens signés. |
| C-2 suivi | Dossier `legion` | **Fermé le 01/10 et prouvé.** Dossier privé `legion-prive` (migration 0227) ; site et fonctions branchés dessus (ae78d5c), en ligne sur finjaro.net au oui de Beau (84db969, vérifié dans le code servi). Les 14 fichiers des entreprises copiés à l'identique (tailles comparées), 23 messages + 1 document réécrits vers l'adresse privée, originaux publics supprimés : il ne reste dans `legion` que les 72 portraits d'agents (publics par choix, toujours affichés : 200). Preuves sans compte : liste vide, lien signé refusé, ancienne adresse publique 400, nouvelle adresse 400, dépôt refusé, relais finjaro.net/img 404. Test en base (annulé) : membre voit ses 9 fichiers et peut déposer, extérieur voit 0 et son dépôt est refusé. Page Léo chargée sans erreur à 390 et 1440 px. **Non testé** : l'ouverture d'un fichier par un membre connecté dans l'écran (pas de compte de test) — la règle d'accès qui la permet est prouvée en base. | Revérifier avec le compte de test quand Beau l'aura créé. |
| C-3 suivi | Dossier `chat` | **Fermé le 01/10 (migration 0226) et prouvé** : sans compte, liste du dossier vide, lien signé refusé, photo jamais vue refusée (400), relais finjaro.net/img refusé (404 ; il gardait les images 30 jours, corrigé en liste blanche). **Reste** : les 2 fichiers que Claude a lui-même ouverts pour sa mesure de 9 h 57 sont encore servis par le cache de Supabase. Ni la réécriture ni la suppression ne le purgent sur notre formule (fonction `chat-purger-cache`, essayée deux fois, fichiers intacts). Seule une personne connaissant l'adresse exacte peut les lire. | Attendre l'expiration du cache (revérifié plus tard) ; à l'avenir, mesurer un accès sans compte sur un fichier jetable, jamais sur le fichier d'une vraie personne. |
| C-4 | `profiles.deletion_requested_at` | **Une demande de suppression de compte attend depuis le 28/08** (plus de 30 jours). Le RGPD impose une réponse sous un mois. Personne n'est prévenu quand une demande arrive. | Décision de Beau sur le traitement (CLAUDE.md interdit de supprimer un compte du `auth.users` commun : anonymiser le profil et les données place de marché ?). Ensuite une alerte admin à chaque demande et un délai suivi dans la Console. |
| C-4 bis | `Settings.jsx:49`, `deletion.js` « Délais » | **Suivi du 01/10** : la demande du 28/08 venait d'un compte marqué test, créé 45 s avant la demande (jour de l'examen Apple). **Traitée le 01/10** (voir `docs/RGPD-suppressions.md`). Elle révèle un défaut : après « Supprimer mon compte », le compte restait **utilisable** (reconnexion le 23/09, 3 sessions encore ouvertes), alors que la page publique promet « votre compte n'est plus utilisable ». | Au moment de la demande, bloquer la connexion côté serveur (fonction qui bannit et ferme les sessions), puis traitement complet sous 30 jours avec `deletion_processed_at` (migration 0225). |
| C-5 | Base, 64 fonctions `SECURITY DEFINER` restantes exécutables par tout le monde | Le même piège que C-0b est probablement ailleurs : à la création, chaque fonction est exécutable par PUBLIC. J'ai vérifié les plus dangereuses (sections 0 et 2). Les autres reposent sur leur propre garde, `auth.uid()` ou `is_admin()`, ce qui est correct mais fragile. | Une migration qui retire EXECUTE à PUBLIC partout, puis le redonne explicitement à anon ou authenticated seulement aux fonctions appelées par l'application (liste à établir depuis `supabase.rpc(` dans les deux dépôts). Avec Claudinette, car ses `finia_*` sont concernées. |
| C-6 | Table `app_config` (`vapid_keys`, `resend`, `fcm_service_account`, `apns_key`, `stripe`) | **Les clés privées de l'envoi (web, Android, iPhone), la clé Resend et les clés Stripe sont en clair dans une table.** La table est fermée aux visiteurs et aux comptes connectés (vérifié le 01/10), mais toute copie de la base (export, sauvegarde) emporte de quoi écrire au nom de Finjaro. **Erreur de Claude le 01/10 :** l'export v1 n'en masquait qu'une seule (Stripe) ; corrigé dans la v2 (masquage de tout champ de clé, contrôle automatique : 0 restante), et la v1 est à supprimer. Relevé par Beau. | Lot 1 (ajouté par Beau le 01/10) : renouveler les 4 clés ; les mettre dans les secrets des fonctions (`send-push` v68 les lit en premier) ; vider ces champs de `app_config`. Marche à suivre : `docs/CLES-A-RENOUVELER.md`. **État au 01/10 : OUVERT, en attente.** Beau renouvellera Resend, Firebase et Apple plus tard ; VAPID après la mise en ligne. |

---

## 2. MAJEUR

### Sécurité

| # | Où | Constat | Proposition |
|---|---|---|---|
| M-1 | finjaro.net (aucun en-tête) ; point d'entrée `src/worker.js:71` | Aucun en-tête de sécurité : ni HSTS, ni `X-Frame-Options` ou `frame-ancestors` (le site peut être encadré par un autre, ce qui permet le détournement de clic), ni `X-Content-Type-Options`, ni `Referrer-Policy`, ni `Content-Security-Policy`. | Les ajouter dans `src/worker.js` (toutes les réponses) ou dans `public/_headers`. Commencer par la CSP en mode rapport seul. |
| M-1 suivi | `public/_headers`, `src/worker.js` | **Corrigé le 01/10 sur staging.** Sur toutes les réponses : HSTS (180 jours, sans sous-domaines pour ne rien imposer à Accounting), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors` limité à nos sites (*.finjaro.net, *.finjaro.workers.dev). Dans `_headers` pour les fichiers servis directement, et dans le Worker pour les fiches, le plan du site et le repli. Preuves : serveur Cloudflare local (wrangler dev) — les 4 en-têtes sur /, /services, un fichier /assets, le manifeste et /sitemap.xml, cache des fichiers inchangé ; navigateur : un site tiers qui encadre finjaro.net est bloqué, le même sans l'en-tête s'affiche (témoin) ; accueil chargé sans erreur à 390 et 1440 px ; 2 tests. | Mise en ligne au mot de Beau. Reste : CSP complète (scripts, images, connexions) — d'abord en mode rapport après inventaire des domaines tiers. |
| M-2 | `package.json` | `vite` (élevée : lecture de fichiers par le serveur de développement), `react-router-dom` (redirection ouverte via `\` dans un lien), `vitest`, `@capacitor/cli`, `brace-expansion`. | Monter react-router-dom en 7.18.4 (touche la production), puis vite, vitest et capacitor (outils de développement). Relancer les 320 tests et faire un parcours réel. |
| M-3 | Supabase Auth | Protection contre les mots de passe compromis (HaveIBeenPwned) **désactivée**. Déjà signalée, toujours en attente. | Un interrupteur gratuit, à activer par Beau dans le tableau de bord. Concerne aussi Accounting. |
| M-4 | Stockage `chat`, `listings`, `photos`, `products`, `reels`, `shops` | Pas de taille maximale de fichier (`file_size_limit` vide). Le dossier `photos` accepte des vidéos de tout compte connecté. Avec 57 % du quota gratuit utilisé, un seul compte peut le remplir. | Plafond par dossier : images 5 Mo, vidéos 30 Mo. Et un plafond de dépôts par compte et par jour. |
| M-5 | `public.events` (insertion ouverte aux visiteurs), `increment_product_views`, `increment_reel_view`, `increment_reel_share` (appelables par tous) | N'importe qui peut fabriquer des visites, des vues ou des partages. Les tableaux de bord, les agents de Léo et les rapports du matin lisent ces chiffres. | Limitation par identifiant de visiteur et par heure côté base, et écart des rafales dans les rapports. Ça complète la méthode « personnes, pas lignes » du 30/09. |
| M-6 | `finia_members`, règle `finia_members_self_accept` (UPDATE si l'e-mail correspond) | La règle laisse modifier toute la ligne de son invitation, **y compris le rôle**, sauf si le déclencheur `finia_members_guard` l'empêche (non vérifié de mon côté). | À vérifier par Claudinette (sa table). |
| M-7 | Fonctions `chat-autoreply`, `chat-moderation-sweep`, `legion-mcp`, `moderation-sweep` | CORS `*`. Elles exigent un jeton, donc le risque est faible, mais rien ne justifie `*` pour des appels serveur à serveur. | Restreindre aux origines Finjaro, ou retirer le CORS de celles qui ne sont jamais appelées par un navigateur. |
| M-8 | `android/app/google-services.json:18`, `ios/App/App/GoogleService-Info.plist:6` | Clés Firebase publiques, normales dans une application mobile, mais à **restreindre** à l'empreinte de l'application dans Google Cloud. Sinon un tiers peut consommer le quota. | Réglage à faire par Beau dans la console Google (je peux préparer la marche à suivre). |

### Fonctionnel et UX (vu sur le site en ligne)

| # | Où | Constat | Proposition |
|---|---|---|---|
| M-9 | `src/components/InstallAppBanner.jsx:66` (z-50) contre `src/components/TabBar.jsx:39` (z-40) | Sur téléphone, la bannière « Installer » **recouvre la barre d'onglets** (Accueil, Fin, Services, Messages, Profil) pour tout nouveau visiteur, jusqu'à ce qu'il la ferme. Vu sur toutes les captures en 390 px. | Placer la bannière au-dessus de la barre d'onglets, ou ne l'afficher qu'après une 2e visite ou un premier geste. |
| M-10 | `src/App.jsx:351` (`<Route path="*" element={<Home />} />`) | Une adresse inconnue affiche l'accueil **hors de sa mise en page** : pas de barre d'onglets, et un **débordement horizontal de 1 187 px** au téléphone (425 px au grand écran). C'est aussi une fausse page 404 pour Google. | Une vraie page « Page introuvable » dans la mise en page acheteuse, avec recherche et liens. Pas de redirection silencieuse. |
| M-11 | `ProductDetail`, `ShopProfile` (article ou boutique inexistants) | « Produit introuvable » et « Boutique introuvable » : un mot et un bouton Retour, sans en-tête ni suggestion. Une cliente qui suit un vieux lien repart. | Proposer des articles proches, la recherche et la boutique si elle existe encore. |
| M-12 | Supabase, forfait gratuit | **Sauvegardes** : le forfait gratuit ne donne pas de sauvegarde téléchargeable ni de retour en arrière dans le temps. Une erreur ou une attaque comme C-0a n'aurait pas pu être réparée. | Au minimum, un export quotidien automatique (tables + stockage) vers un endroit séparé. Sinon le forfait Pro (≈ 25 $/mois, sauvegardes quotidiennes). Décision de Beau. |

### Performance

| # | Où | Constat | Proposition |
|---|---|---|---|
| M-13 | Paquets chargés au premier affichage | Avant toute page, le téléphone télécharge `index` 498 ko + `supabase` 211 ko + `react` 162 ko + `icones` 112 ko + `i18n` 58 ko. Soit **≈ 1 Mo brut, ≈ 350 ko compressé**, lourd sur les réseaux mobiles de nos marchés. | Sortir les traductions de la langue non utilisée, découper les icônes, charger Supabase en différé pour les pages publiques. Objectif : moins de 150 ko compressés au premier affichage. |
| M-14 | `NearYouMap` 1 022 ko (279 ko compressé), `Editeur` 603 ko, `moteur` (3D) 561 ko, `Entreprise` 430 ko | Chargés seulement à la demande, ce qui est bien, mais très lourds. | Carte : un fond de carte plus léger ou des tuiles statiques. Éditeur et 3D : acceptable dans Léo, à surveiller. |
| M-15 | Mesuré sur finjaro.net en 390 px | `/product/<article sur devis>` en **32 s** avant le repos réseau, `/fin` en 22 s, `/search?q=robe` en 15 s. Les autres pages en 4 à 8 s. | Rechercher ce qui reste chargé (vidéos de Fin préchargées, images pleine taille). Mesure à refaire avec un réseau mobile simulé. |
| M-16 | Base : 83 règles qui recalculent `auth.uid()` à chaque ligne, 176 doublons de règles permissives, 110 clés étrangères sans index | Ralentira tout quand le volume montera. | Une migration additive : réécrire `auth.uid()` en `(select auth.uid())`, ajouter les index manquants sur les tables lues souvent (commandes, messages, Léo). |

### Données et cohérence

| # | Où | Constat | Proposition |
|---|---|---|---|
| M-17 | Événements `product_view` avant le 01/10 | La présentation du premier lancement couvrait les fiches : 452 visiteurs l'ont eue, 15 l'ont fermée. Les « vues de fiche » d'avant le 01/10 surestiment l'intérêt. Corrigé ce matin pour l'avenir. | L'écrire dans la Console et dans les rapports des agents : comparer avant et après le 01/10 avec prudence. |
| M-18 | `docs/A-FAIRE-PARTAGE.md` (« Le bilan hebdo ne filtre pas les comptes de test ») | Déjà connu, toujours ouvert : le bilan hebdo aux vendeuses comptait les conversations des comptes de Beau. Il est désactivé, mais le défaut reste dans le code. | Filtrer avec `compte_reel()` avant toute réactivation. |
| M-20 | `AdminUsers.jsx:137` + déclencheur `protect_profile_privileges` | Les boutons admin « Suspendre » et « Donner/Retirer l'accès admin » affichent « fait », mais le déclencheur remet `is_suspended` et `is_admin` à leur ancienne valeur pour tout rôle autre que `service_role` : **la suspension ne marche pas**, en silence (lu dans le code de la fonction le 01/10, à confirmer avec le compte admin de test). | Passer par une fonction serveur réservée aux admins (`is_admin()`), qui écrit en tant que service, et afficher l'état relu après l'écriture. |
| M-21 | `send-push` → Resend, envois groupés | **Des e-mails perdus lors d'un envoi en rafale** : 68 refus « 429 Too many requests » le 30/09 à 9 h 34 (journal des fonctions). Resend limite à 10 requêtes par seconde, et `sendEmails` ne réessaie pas. | Espacer les lots et réessayer sur un 429 (en respectant l'en-tête `retry-after`), et compter les échecs dans la réponse. |
| M-19 | Tickets Finia `contacter_finjaro` | Déjà connu : ils arrivent en pastille dans l'admin, sans e-mail ni notification à Beau. | Brancher sur `leo-contact` ou `alert_admins` (côté serveur). |

---

## 3. MINEUR

| # | Où | Constat | Proposition |
|---|---|---|---|
| m-1 | `src/screens/vendor/VendorWork.jsx` (354 lignes) | Jamais importé : code mort. | Le supprimer ou le brancher. |
| m-2 | Écrans téléphone, boutons ou liens sans texte ni `aria-label` | Entre 4 et 10 par page (icônes seules : panier, grille d'applications, retour, etc.). Illisibles pour un lecteur d'écran. | Un `aria-label` sur chaque bouton icône. Un test automatique peut le garder. |
| m-3 | Vignettes `_thumb` absentes | Requêtes en erreur 400 sur l'accueil, Boutiques et Services (photos envoyées avant la création des vignettes). Le repli marche, mais chaque photo coûte une requête perdue. | Générer les vignettes manquantes une fois, ou mémoriser l'absence. |
| m-4 | `/fin` | Une vidéo de réel échoue au chargement (`/img/reels/eb83…mp4`). | Vérifier ce fichier et masquer un réel dont la vidéo est absente. |
| m-5 | `src/worker.js:238` (`?refresh` sur `/img`) | N'importe qui peut forcer le contournement du cache des images. Ça coûte de la bande passante Supabase, et le quota sortant gratuit est de 5 Go par mois. | Réserver `refresh` aux admins, ou le retirer. |
| m-6 | `legion_jeton_travail_valide(p_jeton)` appelable par tous | Permet de tester des devinettes du jeton secret. Il fait 32 caractères au moins, donc c'est irréaliste, mais c'est un oracle inutile. | Retirer EXECUTE aux visiteurs. |
| m-7 | `public.pg_net`, `pg_trgm` dans le schéma public | Avertissement Supabase. | Les déplacer dans le schéma `extensions`, sans urgence. |
| m-8 | 27 index jamais utilisés | Poids et écritures inutiles. | Ne les supprimer qu'après un mois d'observation (règle additive : on peut les garder). |
| m-9 | `src/locales/*` : `categories.alimentaire_epicerie` = « Épicerie & Produits du pays » | « Du pays » : lequel ? Pour une place de marché mondiale. | « Épicerie & produits du terroir ». |
| m-10 | 21 textes anglais identiques au français | Surtout des pluriels de compteurs et deux catégories. | Les relire, la plupart sont des mots identiques dans les deux langues. |
| m-11 | Journaux des fonctions (`finou-chat:1900`, `miroir-ia:336,356`) | Le corps des erreurs Gemini est écrit dans les journaux, jusqu'à 1 000 caractères, et peut contenir un bout de la conversation d'un utilisateur. | Ne journaliser que le code et le type d'erreur. |
| m-12 | Fichiers très longs : `finou-chat/index.ts` 2 114 lignes, `monde3d/moteur.js` 1 797, `Conversation.jsx` 1 268, `VendorChat.jsx` 1 100, `MonArgent.jsx` 1 060, `Entreprise.jsx` 1 047 | Difficiles à relire et à tester. | Découper au fil des corrections, pas en grand chantier. |
| m-13 | `traduire-fiche` | Appelable avec la clé publique, sans compte. Le coût est borné par le cache (2 traductions au plus par article). | Acceptable. Ajouter une limite par visiteur si le catalogue grossit. |
| m-17 | `src/worker.js` (/img), vignettes `_thumb` absentes | Une photo sans vignette renvoie **400** au lieu de 404 : erreur rouge dans la console de chaque visiteur (vu sur l'accueil, staging et production, le 01/10). L'affichage est correct (SmartImage retombe sur la grande photo). | Renvoyer 404 pour un objet absent, ou ne demander la vignette que si elle existe. |
| m-16 | Table `app_secrets` (16 jetons internes) | Les jetons qui permettent à la base d'appeler les fonctions (déclencheurs, tâches planifiées) sont en clair dans une table sans règle d'accès. Ils doivent rester lisibles depuis SQL, donc ils ne peuvent pas aller dans les secrets des fonctions. | Les passer dans Supabase Vault (chiffré), lu par une fonction réservée au service. Faisable par Claude seul. |
| m-15 | Table `app_config`, ligne `stripe` | Une clé Stripe de **test** est stockée en clair dans une table (fermée aux visiteurs et aux comptes connectés : vérifié le 01/10). | La déplacer dans les secrets des fonctions, la retirer de la table. |
| m-14 | Dossier `photos` | Règle « Upload photos si connecté » sans propriétaire ni type de fichier vérifié dans la règle. | À aligner sur les autres dossiers (propriétaire = auteur). |

---

## 4. Propositions d'amélioration, classées par impact

*(au-delà des corrections : ce qui aurait de la valeur, à trier par toi)*

### Impact fort (ventes, confiance, sécurité)

1. Dossiers `legion` et `chat` privés avec liens signés (C-2, C-3).
2. Un seul passage « retirer EXECUTE à PUBLIC » sur toute la base, puis des
   droits explicites (C-5).
3. Un test automatique de sécurité qui tourne à chaque migration : aucune vue
   modifiable par anon, aucune fonction SECURITY DEFINER exécutable par PUBLIC
   hors liste blanche. Il aurait attrapé C-0a et C-0b.
4. En-têtes de sécurité, CSP comprise (M-1).
5. Sauvegarde quotidienne hors Supabase (M-12).
6. Traitement des demandes de suppression avec alerte et délai (C-4).
7. Bannière d'installation qui ne cache plus la barre d'onglets (M-9).
8. Vraie page 404 et vraies pages « introuvable » qui proposent la suite
   (M-10, M-11).
9. Premier affichage sous 150 ko compressés (M-13).
10. Plafonds de taille par dossier de stockage et quota par compte (M-4).
11. Statistiques résistantes aux faux événements (M-5).
12. Montée de version de react-router (M-2).
13. Restriction des clés Firebase (M-8).
14. HaveIBeenPwned activé (M-3).
15. Notification à Beau des tickets Finia (M-19).

### Impact moyen (qualité, fluidité)

16. Index et règles réécrits pour la performance de la base (M-16).
17. Vignettes manquantes générées une fois (m-3).
18. Réels sans vidéo masqués automatiquement (m-4).
19. `aria-label` sur tous les boutons icônes, avec un test qui le garde (m-2).
20. Mesure de vitesse réelle en 3G simulée, page par page, dans la CI.
21. Journal d'erreurs côté navigateur (erreurs JavaScript des vrais
    visiteurs) pour voir ce que je ne peux pas reproduire.
22. Tests de bout en bout des parcours clés (achat sans compte, commande avec
    compte, vendeuse qui accepte, « Ma commande ») qui tournent sur staging à
    chaque poussée.
23. Code mort retiré (m-1).
24. `?refresh` des images réservé aux admins (m-5).
25. Journaux sans données personnelles (m-11).
26. Extensions déplacées hors du schéma public (m-7).

### À décider avec toi

27. Forfait Supabase Pro ou export maison (sauvegardes, quota de stockage).
28. Comment traiter une suppression de compte dans un `auth.users` partagé.
29. Les écrans connectés : me donner un compte de test dédié (marqué
    `is_test`) pour que je puisse les parcourir comme j'ai parcouru les pages
    publiques. Sans ça, une bonne moitié de l'application reste non vérifiée.

> Cette liste compte 29 points et non 100. Je n'ai pas voulu gonfler la liste
> avec des idées sans lien avec ce que l'audit a trouvé. Les 200 propositions
> pour Léo et les 20 pour la place de marché du 25/09 sont dans `docs/plans/`.

---

## 5. Plan proposé, par lots (à valider : étape b)

| Lot | Contenu | Touche la base commune ? | Effort |
|---|---|---|---|
| 1 — Sécurité urgente | C-1 (carte), C-2 et C-3 (dossiers privés), C-5 (EXECUTE PUBLIC) + test automatique (n° 3), M-1 (en-têtes) | oui pour C-2, C-3 et C-5 : je le dis à Claudinette avant | 1 à 2 jours |
| 2 — Ce que voient les visiteurs | M-9 (bannière), M-10 et M-11 (404 et introuvables), m-3, m-4, m-2 | non | 1 jour |
| 3 — Conformité et données | C-4 (suppressions), M-4 (plafonds de stockage), M-5 (faux événements), M-12 (sauvegarde), M-18, M-19 | oui | 2 jours, plus tes décisions |
| 4 — Vitesse | M-13, M-14, M-15, M-16 | M-16 oui (index : additif) | 2 à 3 jours |
| 5 — Dépendances et finitions | M-2, M-7, m-1, m-5 à m-14 | marginalement | 1 jour |

Chaque lot se termine par la même preuve : tests qui passent, compilation,
parcours réel des pages touchées (téléphone et grand écran), captures, et pour
la base un essai en rôle visiteur.
