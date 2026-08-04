# Finjaro — LA liste de tout ce qui reste à faire

_Fichier maître, tenu à jour à chaque cycle. Dernière mise à jour : 4 août
2026. Si un point est traité, il passe en ✅ avec la date — rien n'est
supprimé, pour garder l'historique des décisions de Beau._

> **REPRISE : lire d'abord `docs/SESSION-2026-08-04.md`** — état des lieux
> complet de la session du 04/08 (prix sur demande, CGU, fil infini + règle
> diaspora, Finia enfin corrigée, déconnexion 1 h, app Android prête, secrets
> GitHub en place) et l'ordre des prochains chantiers.

## Circuit de travail (rappel)

- Tout se code sur la branche **`staging`** → déployé automatiquement sur
  **https://staging-finjaro.finjaro.workers.dev** (URL de test, invisible du
  public — confirmé en marche le 31/07 après correction de la config
  Cloudflare, voir ci-dessous).
- **finjaro.net** ne change QUE quand Beau valide et qu'on fusionne `staging`
  dans `claude/finjaro-marketplace-build-xsripr` (branche de production
  surveillée par Cloudflare).
- Base de données : les deux frontends pointent sur le projet Supabase de
  production (`bokwivwizghdlaedczbw`) — toute migration doit donc rester
  additive. Projet de test : `qiyvoaljqmbfldephobp`.
- **Config Cloudflare (Settings > Build)**, pour référence si jamais elle se
  dérègle à nouveau :
  - Deploy command (branche de prod) : `npx wrangler deploy`
  - Non-production branch deploy command (branche staging) :
    `npx wrangler versions upload` — PAS `wrangler deploy --env staging`,
    qui promeut toujours en production quel que soit `--env` et a fait
    fuiter du contenu de test sur finjaro.net le 31/07 avant d'être corrigé.

---

## 1. Bugs signalés par Beau — validés, en attente du « go » point par point

| # | Problème | Diagnostic |
|---|---|---|
| B1 | Profil → « Sign in » affiche « you need to be signed in to do that » au lieu d'ouvrir l'écran de connexion | ✅ Corrigé le 01/08 : c'était B1=B2 (même bug, juste redit deux fois). Le bouton naviguait vers `requireLogin()` au lieu de `/auth` — corrigé dans `UserProfile.jsx`. |
| B2 | (doublon de B1, confirmé par Beau le 01/08) | ✅ Voir B1. |
| B3 | Catégorie Musique absente | ✅ Corrigé et confirmé visible sur staging le 31/07. |
| B4 | « Les pièces enregistrées partent où ? » | Pas un bug : bucket privé `ids` + table `vendor_applications`, lisible uniquement par l'admin via `kyc-ocr`. Confirmé par Beau le 01/08 que B4 n'était qu'une question posée en retour, pas un vrai bug signalé. |
| B5 | Bouton localisation boutique : « ça fait quoi ? » | ✅ Corrigé le 01/08 : le bouton marchait déjà (GPS → base) mais avalait toute raison d'échec dans un `null`, et le seul retour (un toast) disparaissait en 3s sans laisser de trace — d'où « le bouton est resté normal ». Ajout de `getPositionWithReason()` (distingue refusé/délai/indisponible/non supporté) + un message persistant sous le bouton (`VendorShop.jsx`) qui reste affiché tant qu'on ne retente pas. |
| B6 | Photos des nouvelles catégories | ✅ 16 photos reçues, curées et intégrées le 31/07 (voir `src/assets/categories/CREDITS-nouvelles-photos.md`). |

## 2. Renommer « Finou Chou » ✅ fait le 31/07

Renommé en **Finia** partout côté utilisatrice (bulle, messages, écrans
vendeur). Confirmé visible sur staging. Noms techniques internes
(`finou-chat`, `finou-vision`…) inchangés, c'est invisible pour tout le monde.

## 3. Décisions produit prises (ne plus reposer la question)

- **Ventes flash / 2nde main** : PAS de page dédiée — juste un badge sur les
  fiches concernées. (31/07)
- **Bandeau « Garanties »** : ABANDONNÉ — il n'y a pas de garanties réelles
  aujourd'hui, on n'affiche rien de mensonger. (Vérifié : rien à retirer, le
  bandeau n'avait jamais été implémenté.) (31/07)
- **Achat groupé / prix dégressif** : pas important, ce n'est pas Finjaro qui
  baisse les prix. ABANDONNÉ. (31/07)
- **Livraison** : les vendeurs livrent EUX-MÊMES pour l'instant. Agences /
  points relais Europe = plus tard. (31/07)
- **Paiements en ligne (CinetPay, Stripe, commission, séquestre)** : « vraiment
  pas pour maintenant ». (31/07)
- **Appels vidéo/audio, AR, 3D, simulateurs sensoriels** : on laisse tomber —
  infra inexistante. (31/07)

## 4. Backlog fonctionnel (hors IA) — à faire

- [x] **Prix barré / promo (%)** ✅ 01/08 : champ vendeur optionnel (refusé si
  ≤ prix demandé), badge "−X %" sur la carte produit ET la fiche article, prix
  barré affiché en `line-through`. `compare_at_price_fcfa` existait déjà en
  base, ajouté aux requêtes catalogue/recherche/boutique qui en avaient besoin.
- [x] **Badges Ventes flash / 2nde main** ✅ 01/08 : pas de page dédiée
  (décision §3) — la remise EST le repère "vente flash", + badge dédié sur les
  fiches du rayon Seconde main.
- [x] **Recherche dans le catalogue d'une boutique** ✅ 01/08 : champ de
  recherche (filtre local, sans aller-retour serveur) dans l'onglet Produits
  de la fiche boutique.
- [x] **Raccourci « Racheter »** ✅ 01/08 : bouton sur chaque commande dans Mes
  commandes — rajoute au panier au PRIX ET STOCK ACTUELS (jamais l'ancien prix
  payé), prévient si un article a disparu du catalogue depuis.
- [x] **Adresse de livraison enregistrée** ✅ 01/08 : `profiles.address` +
  `profiles.city` (migration 0029, additive), champs dans Modifier le profil,
  pré-remplissage du tunnel de commande (toujours modifiable là aussi).
- [x] **Notifications** ✅ Vérifié 01/08 via les logs Supabase : `send-push`
  répond 200 sur de vrais appels en production (commande reçue, message
  vendeur...), clé Resend et clés VAPID bien configurées en base. Table
  `push_subscriptions` à 0 ligne — normal, personne n'a encore ajouté le site
  à l'écran d'accueil sur iPhone (seule condition pour le push web Apple); le
  canal e-mail, lui, tourne déjà et complète.
- [ ] L'annuaire Prestataires reste vide tant que les boutiques n'ont pas coché
  un métier — TidalEx reclassée le 31/07, les autres vendeurs doivent le faire
  dans « Ma boutique ».

## 4bis. Cycle « marketplace propre » (screenshots Nevo Market, 01/08) ✅ fait

Beau a envoyé 5 captures de Nevo Market comme référence + une liste vocale
d'anomalies. Tout le lot ci-dessous est implémenté le 01/08 :

- ✅ **Tailles/couleurs produit** : éditeur côté vendeur (presets XS–4XL ou
  pointures 36–45 selon le rayon + saisie libre), taille OBLIGATOIRE à
  l'ajout panier quand la fiche en définit, panier par variante (la même robe
  en M et XL = deux lignes), variante transmise à la boutique dans la
  commande (« Robe (XL · Rouge) »).
- ✅ **Miroir IA et taille** (question de la collègue) : le miroir montre le
  STYLE porté, pas l'ajustement d'une taille précise — note honnête ajoutée
  dans la modale. Pas de simulation morphologique par taille (irréaliste avec
  Gemini aujourd'hui, on ne promet pas ce qu'on ne tient pas).
- ✅ **Cycle de commande complet** (le vrai flux supply-chain) :
  nouvelle → [Valider | Refuser (raison optionnelle, transmise)] → validée/en
  préparation → [En livraison / Prête (retrait)] → livrée. Chaque étape
  horodatée (0030) + notification acheteuse. AVANT: un seul bouton sautait de
  « nouvelle » à « envoyée » — le bug exact signalé par Beau.
- ✅ **Suivi acheteuse** : timeline 4 étapes avec dates sur Mes commandes,
  raison de refus affichée, « J'ai bien reçu » clôt vraiment la commande.
- ✅ **Rappel Finia automatique** : pg_cron toutes les 6 h → push+e-mail aux
  boutiques qui laissent des commandes « new » > 6 h (arrêt après 14 j).
  Bannière « X commandes à valider » en haut du tableau de bord vendeur.
- ✅ **Fiche boutique façon Nevo** (aux couleurs Finjaro) : onglets Accueil /
  Produits / Promos (seulement si promos) / Avis / À propos · bouton « Nos
  Reels » près de l'avatar (→ flux filtré sur la boutique) · stats Note/
  Abonnés/Produits/Certifiée · **Garanties de confiance RÉELLES uniquement**
  (certifiée = is_verified, livraison = si proposée, contact direct = si
  WhatsApp/tél renseigné — jamais la même liste automatique partout) ·
  horaires avec badge Ouvert/Fermé en direct · zones de livraison.
- ✅ **Horaires + zones côté vendeur** (Ma boutique) : ouverture/fermeture +
  jours fermés ; zones {nom, frais, délai} affichées sur la fiche ET
  utilisées au checkout (frais par zone, 0 = gratuit).
- ✅ **Checkout nettoyé** : message « dans ce pays, la livraison… » supprimé ;
  paiement par carte MASQUÉ (code conservé, drapeau `CARD_PAYMENTS_ENABLED`
  dans CheckoutCOD.jsx) ; sélecteur de zone quand la boutique en a.
- ✅ **Panier** : « Tout retirer » par boutique + variantes affichées.
- ✅ **Bug catégories « Ma boutique »** : les boutiques portaient des ids
  HÉRITÉS (beaute, mode, bijoux…) invisibles dans les chips — affichés
  maintenant dans un bloc « Anciennes catégories » (tap pour retirer), et les
  catégories s'enregistrent À CHAQUE TAP (plus besoin du bouton Enregistrer).

**Retours de test du 01/08 (2e passe) — tous corrigés :**
- ✅ **Annulation d'une commande EN COURS** (validée ou en livraison), pas
  seulement refus d'une commande « nouvelle » — bouton dédié (icône, à côté
  du bouton principal) sur les étapes Validée et En livraison.
- ✅ **Raison de refus/annulation clairement « (optionnel) »** — le mot est
  maintenant dans le LABEL du champ, plus seulement noyé dans une phrase
  d'aide.
- ✅ **Numéros de commande peu distinguables** (ex. `3F8A2C1B` vs `3F9A2C1D`,
  hex ambigu) → nouveau format `FJ-XXXXXX` sur un alphabet SANS caractères
  ambigus (pas de 0/O, 1/I/L) — lisible sans confusion à l'oral pour le
  suivi/vérification de paiement (migration 0031, appliquée aux deux
  projets).
- ✅ **Présentation des cartes commande** (vendeur ET acheteuse) refaite :
  accent de couleur par statut, pastille d'initiale acheteuse, articles dans
  un encart, bouton « Marquer livrée » en primaire (plus de lien texte
  "grossier" flottant sous le bouton).
- Confirmé déjà en place : l'écran de confirmation après commande dit bien
  « Ta commande a bien été transmise à la boutique » (gros ✓ + numéro) — à
  revérifier sur le lien de test, le test de Beau a pu tomber sur le build
  d'avant le déploiement du cycle de commande.

## 4ter. Redesign global écran par écran (01/08) ✅ validé par Beau

Beau a envoyé des maquettes de référence (style Nevo/prototype) et demandé
un vrai travail visuel, onglet par onglet. Tout est validé (« c'est bon ») :

- ✅ **Accueil** : barre de recherche pleine largeur tappable (au lieu d'une
  icône loupe dans un coin), carrousel héros avec ombre, tuiles catégories
  en relief, bande « Services » en accent doré pour se distinguer du reste,
  icônes devant les titres de section.
- ✅ **Fin (reels)** : sélecteur « Pour toi / Abonnements » en capsule
  translucide — au passage, **vrai bug corrigé** : le texte blanc devenait
  invisible sur une vidéo claire, sur l'écran de chargement ET sur l'écran
  vide. Barre de progression en haut de la vidéo, avatar boutique + bouton
  suivre rapide (+/✓), dégradés de lisibilité haut/bas.
- ✅ **Services** : nouveau `ProviderCard` (couverture, badge métier, avatar
  débordant, portfolio de 3 photos, note + nb d'avis, prix d'appel, boutons
  Détails/Réserver), bandeau « Annuaire & Carte », curseur de rayon en km
  (affiché seulement si une position réelle est connue), grille 1/2/3
  colonnes. **Données toutes réelles** : « Nouveau » si aucun avis, prix
  d'appel = le plus bas du vrai catalogue, portfolio = vraies photos
  produit. Rien d'inventé contrairement aux chiffres de la maquette.
- ✅ **Messages** : deux panneaux sur ordinateur (liste + fil), en-tête de
  conversation avec accès direct WhatsApp/téléphone (affichés seulement si
  le numéro existe), bulles terracotta pleines pour ses propres messages,
  aperçu en gras tant que non lu, conversation active surlignée.
  → Pas d'indicateur « en ligne » : l'app ne suit aucune présence temps
  réel, un point vert serait décoratif et mensonger. Faisable pour de vrai
  (Supabase Realtime Presence) si Beau le demande — chantier à part.
- ✅ **Bandeau d'annonce** (la bande orange du prototype) : table dédiée
  `announcements` (migration 0032) + éditeur dans l'espace admin avec
  aperçu. Le texte est une DONNÉE, jamais codé en dur — une promo figée
  dans le build continuerait de promettre une opération terminée.
  Table à part exprès, surtout pas `app_config` qui contient les clés
  Stripe/VAPID.
- ✅ **BUG LANGUE corrigé** (signalé par Beau : « j'ai choisi français,
  j'ai des champs en anglais ») — deux causes réelles :
  1. `i18n.language` pouvait valoir `fr-FR`, et les **9 endroits** qui
     testent `locale === 'fr'` (dates, heures, noms de pays, format des
     prix) basculaient alors silencieusement en anglais. Réglé par
     `load: 'languageOnly'`.
  2. L'app suivait la langue du TÉLÉPHONE : un appareil en anglais
     affichait tout en anglais sans que personne l'ait demandé. Le
     français est désormais la langue par défaut du produit ; l'anglais
     reste dans Profil > Paramètres et le choix est mémorisé.

**Reste du redesign :** l'onglet **Profil** n'a pas encore été repris.

## 4quater. Espace vendeur, audit global, connexions, admin (01/08)

- [x] **Espace vendeur refondu** : tableau de bord « cockpit » + espace
  **Finances** (comptabilité simple : encaissé, à venir, par mois).
- [x] **Connexion par téléphone (SMS)** ✅ : Twilio branché sur Supabase
  (Account SID + Auth Token + Messaging Service). Testé par Beau, ça marche.
  L'inscription/connexion par SMS ne demande ni e-mail ni mot de passe.
- [x] **Connexion Google** ✅ : client OAuth créé sur Google Cloud (appli
  « Finjaro », publiée « En production » donc ouverte à tous), identifiants
  posés dans Supabase. Bouton « Continuer avec Google » sur l'écran de
  connexion. **Apple non fait** : Apple exige 99 $/an de compte développeur.
- [x] **Audit complet de l'app** ✅ : parcours acheteuse ET vendeuse rejoués
  écran par écran, bouton par bouton (Playwright + captures). Résultat : aucun
  lien mort, zéro erreur console, cycle de commande cohérent des deux côtés
  (valider → en livraison → livrée, avec annulation possible à chaque étape et
  la timeline acheteuse qui suit). Corrigés au passage : le choix
  taille/couleur était enterré sous la description (il conditionne pourtant
  l'ajout au panier) — remonté et la page défile jusqu'à lui si on l'oublie ;
  2 libellés de traduction manquants ; le graphique « ventes par jour » des
  stats vendeur était plat.
- [x] **CNI masquée de l'inscription vendeur** ✅ (demande de Beau, 01/08) :
  exiger — ou même montrer — une pièce d'identité freine les inscriptions.
  Masquée derrière `SHOW_ID_UPLOAD` dans `BecomeVendor.jsx` ; le code, le
  bucket `ids` et la lecture OCR côté admin restent intacts, un seul drapeau à
  rebasculer. **Point légal** : la CNI reste facultative et non collectée —
  c'est le choix le plus sûr au regard du RGPD (on ne collecte pas ce dont on
  n'a pas besoin). Le jour des paiements en ligne, ce sont CinetPay/Stripe qui
  exigeront et stockeront l'identité, pas nous.
- [x] **Console d'administration complète** ✅ : six sections — Résumé (KPI +
  bandeaux d'alerte), Boutiques (annuaire cherchable, chiffres réels par
  boutique, certifier / suspendre), Comptes (suspendre, donner les droits
  admin), Commandes (toute la plateforme, en lecture seule), Modération (file
  des signalements), Contenu (bandeau d'annonce + candidatures vendeur avec
  OCR). Migration `0034_admin_full_rights.sql`.
  **Deux bugs sérieux corrigés au passage** : les signalements n'étaient
  lisibles que par leur auteur (la modération était donc impossible), et les
  statistiques ne comptaient que la navigation de l'admin lui-même — les
  chiffres affichés étaient faux.
  **Volontairement non ouvert** : les conversations privées entre clientes et
  boutiques. Lire les messages privés n'est pas un pouvoir d'administration
  ordinaire ; à décider explicitement si le besoin se présente.
- [x] **Admin séparé de la boutique** ✅ (demande de Beau, 01/08) : la console
  n'est plus une page de l'app. Deux constructions, deux Workers Cloudflare,
  deux domaines — `npm run build` → `finjaro` → finjaro.net ; `npm run
  build:admin` → `finjaro-admin` → admin.finjaro.net. La boutique ne contient
  plus une ligne d'admin et ne laisse plus deviner qu'une console existe (le
  raccourci du menu Profil est retiré).
  **Même dépôt, volontairement** : composants, traductions, charte et base
  Supabase restent partagés — un correctif appliqué une fois vaut des deux
  côtés. Deux dépôts auraient garanti la divergence.

## 4quinquies. Suite du 02/08 — bugs terrain, notifications, géo/devise

**Contexte pour la reprise** : Beau a testé la console admin et l'app en
conditions réelles ce jour-là (finjaro.net en prod, admin sur staging) et a
remonté plusieurs bugs concrets, réglés dans l'ordre ci-dessous. Tout ce qui
suit est sur **staging**, poussé au fil de l'eau ; **rien n'a encore été
fusionné dans la branche de production depuis le déploiement du 01/08 tard**
(commit `9728094` sur `staging`, pas encore mergé). C'est la toute première
chose à faire en reprenant : vérifier avec Beau s'il a fini ses tests, puis
fusionner `staging` → `claude/finjaro-marketplace-build-xsripr` comme les fois
précédentes (`git fetch` les deux branches, `checkout -B` la branche de prod,
`git merge origin/staging`, push).

- [x] **Lien `localhost:3000` sur Google/e-mail** ✅ — Supabase **Site URL**
  était resté sur `http://localhost:3000` (jamais configuré) et **Redirect
  URLs** était vide. Toute connexion Google (et tout lien envoyé par e-mail)
  renvoyait donc vers une adresse qui n'existe que sur un poste de développeur.
  Corrigé **par Beau lui-même** dans le tableau de bord Supabase (Authentication
  → URL Configuration) : Site URL = `https://finjaro.net`, 4 Redirect URLs
  ajoutées (finjaro.net, www., staging-finjaro.workers.dev,
  finjaro-admin.workers.dev). Rien à faire côté code.
- [x] **CNI absente du prix Cameroun→France** — sans rapport avec les prix, mais
  découvert le même jour : `BecomeVendor.jsx` masquait déjà la pièce d'identité
  (`SHOW_ID_UPLOAD = false`, fait le 01/08) — confirmé toujours en place, rien
  à refaire.
- [x] **Console admin séparée : réglage Cloudflare en attente côté Beau** — le
  Worker `finjaro-admin` a été créé (Build command `npm run build:admin`,
  Deploy command `npx wrangler deploy --config wrangler.admin.toml`, Version
  command idem `--config wrangler.admin.toml`). **Sa Production branch est
  restée sur `claude/finjaro-marketplace-build-xsripr` au lieu de `staging`** —
  tant que Beau ne l'a pas changée dans Settings → Build → Branch control, les
  correctifs de l'admin ci-dessous ne s'affichent PAS sur
  `finjaro-admin.finjaro.workers.dev`. **Ce réglage n'est toujours pas confirmé
  fait à la fin de cette session** — c'est la 2e chose à vérifier en reprenant.
  Le domaine `admin.finjaro.net` n'est lui non plus pas encore ajouté (le
  Worker répond pour l'instant seulement sur son adresse `.workers.dev`).
- [x] **Admin : ne défilait pas, Boutiques/Modération en erreur, bandeaux
  morts** ✅ — trois bugs distincts trouvés en testant avec Beau en direct :
  1. Le document ne défile jamais dans cette app (`overflow:hidden` sur
     html/body pour empêcher le clavier iOS de pousser tout l'écran) — chaque
     écran défile dans son propre cadre, et la console livrée le 01/08 n'en
     avait pas. Ajouté dans `AdminApp.jsx`.
  2. `shops.owner_id` et `reports.reporter_id` pointaient vers `auth.users`
     (illisible côté client) et pas vers `profiles` — impossible d'afficher
     "propriétaire" ou "signalé par". Migration `0035` : seconde clé étrangère
     vers `profiles` (même patron que `near_you_listings` déjà en place),
     jointures nommées côté client (`profiles!shops_owner_profile_fk` etc.).
  3. Les bandeaux "signalements/candidatures en attente" du Résumé pointaient
     vers `/admin?s=...`, une adresse qui n'existe plus depuis la séparation —
     devenus de vrais boutons qui changent d'onglet.
- [x] **Icônes d'app réelles (PWA + prérequis Play Store)** ✅ — il n'existait
  qu'un favicon SVG ; iOS l'ignore pour l'écran d'accueil (capture de la page
  au lieu du logo) et Play Store exige du PNG 192/512. `scripts/make-icons.mjs`
  rend le logo via Chromium (aucune lib d'image à installer) en
  192/512/maskable-512/apple-touch-icon. Le logo est redessiné en formes (plus
  de `<text>`, qui dépendait des polices de l'appareil et rendait un F
  mal centré). Manifeste + `index.html` mis à jour. **Piste Play Store** :
  https://www.pwabuilder.com → `finjaro.net` → Package → Android → `.aab`
  déjà signé, 25 $ une fois, pas de Mac requis. **Mis en pause par Beau** —
  il veut d'abord finir de tester le reste. Ne pas relancer sans qu'il le
  redemande.
- [x] **Vendeur en France voyait ses prix en FCFA, non modifiable** ✅ — deux
  causes : (1) le pays de la boutique était figé sur `'CM'` à l'inscription
  (`BecomeVendor.jsx`), (2) **et n'était pas modifiable après coup** — un
  vendeur hors Cameroun restait bloqué en FCFA pour toujours. Corrigé : le
  pays part désormais du pays détecté (`useSettings().country`), et
  `VendorShop.jsx` porte maintenant un champ pays modifiable avec la devise
  résultante affichée en clair.
- [x] **Clochette de notifications in-app** ✅ — Beau a demandé ce que voient
  les comptes créés par téléphone, côté web, sans installation. Réponse
  trouvée en lisant le code : **rien**. Un compte SMS n'a pas d'e-mail
  (`emails_for_users()` exclut `email is null`), le push navigateur exige une
  permission qui, sur iPhone, ne marche même pas sans ajout à l'écran
  d'accueil (restriction Apple) — et surtout, la table `public.notifications`
  était déjà entièrement alimentée par des triggers SQL (nouveau message,
  commande, statut, boutique validée…) et même branchée sur Supabase Realtime,
  **mais aucun écran ne l'affichait**. Construit : `useNotifications()` +
  `NotificationBell` (badge rouge, panneau, marque lu au clic, navigue vers le
  bon endroit), posée sur l'accueil acheteuse et le tableau de bord vendeur.
  Migration `0036` : ajoute `for_role` aux notifications de message pour que
  le clic route vers `/chat/:id` ou `/vendor/messages/:id` sans requête
  supplémentaire.
  **Découverte utile pour plus tard** : `on_vendor_app_status()` (trigger SQL
  existant) implémente déjà tout le mécanisme "candidature en attente → shop
  créé seulement si `status='approved'` → notification à la décision" — mais
  `BecomeVendor.jsx` côté client **contourne ce mécanisme** et crée la
  boutique directement à l'inscription, sans jamais passer par
  `vendor_applications.status`. Si Beau active un jour la vraie validation
  vendeur (mentionné plusieurs fois, jamais tranché), la moitié du travail
  serveur est déjà faite.
- [x] **Prix par défaut en FCFA pour tout le monde, catalogue non régionalisé**
  ✅ — Beau, physiquement en France, ouvrait finjaro.net (déconnecté) et
  voyait des prix FCFA + un catalogue sans lien avec sa région. Deux causes
  vérifiées en base :
  1. `profiles.currency` avait `'FCFA'` en valeur par défaut SQL → tout
     compte naissait estampillé FCFA (24 profils sur 27). Le client adoptait
     ensuite cette valeur à la connexion, écrasant la détection du pays.
     Migration `0037` : le défaut est retiré, les profils qui n'avaient
     jamais rien choisi (aucun pays + FCFA intact) sont remis à `null`.
  2. La détection pays/devise était asynchrone → l'app peignait du FCFA le
     temps de répondre, puis la valeur fautive se figeait en `localStorage`
     et ne se corrigeait plus. `detectCountrySync()` (nouveau, dans
     `countries.js`) est maintenant synchrone — fuseau horaire + langue se
     lisent instantanément, donc le tout premier rendu est déjà juste. Table
     de fuseaux élargie (reste Europe/Amérique du Nord/Afrique).
  3. **Aucun filtrage régional n'existait dans le catalogue** — `homeCache.js`
     réécrit : priorise le pays du visiteur pour produits ET boutiques, puis
     complète avec le reste (jamais un filtre strict — avec 4 boutiques FR et
     6 CM aujourd'hui, ça afficherait une place de marché vide au premier
     visiteur d'un pays non couvert). Vérifié dans 3 fuseaux réels : Paris →
     EUR + boutiques FR en tête ; Douala → FCFA + boutiques CM en tête ;
     Chicago → USD.
- [ ] **Articles « sur commande » — discuté, PAS codé, à reprendre en premier.**
  Beau veut remplir ses 3 boutiques (Beauty Hairs, Camerounian Chanel,
  Décoration) avec « des milliers d'articles » sourcés à la demande auprès de
  vrais fournisseurs — pas de faux stock, pas de fausses boutiques (point
  discuté et validé : une seule boutique réelle, marge prise sur le
  fournisseur, panier/commande normal inchangé — les deux boutons "message" et
  "commander" restent tous les deux, comme aujourd'hui).
  **Ce qui existe déjà en base, prêt à l'emploi** : migration `0038` (fichier
  ajouté le 02/08 pour consigner un `apply_migration` fait plus tôt dans la
  journée) — `products.is_sourced boolean`, `products.sourcing_days
  smallint` (1-60), `order_items.is_sourced boolean` (copie figée au moment
  de l'achat). **Rien côté écran** : le formulaire vendeur, la fiche produit,
  la carte produit, le panier et le suivi de commande n'affichent encore
  aucun badge "sur commande" — une première tentative d'ajouter la case à
  cocher dans `VendorProductEdit.jsx` a été commencée puis abandonnée avant
  d'être commitée (Beau a demandé de rediscuter d'abord) ; le fichier est
  revenu à son état d'avant, RIEN à en récupérer, repartir de zéro sur l'UI.
  **Bloqué en attente de Beau** : il doit envoyer les photos + infos
  (nom, boutique, prix) des articles **ce soir** (message du 02/08) — tâche
  #45 dans le suivi de tâches. Une fois reçues : (1) finir le badge "sur
  commande" + délai sur les 4 écrans listés, (2) créer les fiches produit en
  masse à partir de ce que Beau envoie (pas de recherche web pour trouver des
  photos/produits à sa place — refusé explicitement, voir échange du 02/08 :
  utiliser une photo/fiche dont on ne sait pas si Beau peut réellement la
  livrer recrée exactement le problème des fausses boutiques).

## 5. Finia/Finou 2.0 — état des 23 points (47 capacités), texte d'origine retrouvé

### En cours dans CE cycle (« fait en partie » + « faisable maintenant ») — GO de Beau le 31/07

- [x] **12 (texte) Auto-Listing** ✅ 31/07 : bouton « Remplir la fiche depuis la
  photo » (fiche article vendeur) → titre + description + catégorie (enum des
  vraies catégories) + repère de prix = médiane du catalogue, jamais un chiffre
  inventé. Le détourage/fond studio = coût image à part, plus tard.
- [x] **13 KYC OCR assisté** ✅ 31/07 : section « Candidatures vendeur » dans
  l'admin + bouton « Analyser la pièce » (recto/verso). Compare le nom lu au
  nom déclaré. AIDE seulement — l'IA n'approuve ni ne rejette jamais.
- [x] **10 Évaluateur de troc** ✅ 31/07 : bouton « ⚖️ Évaluer un troc » dans
  l'onglet Annonces → 2 photos → états, valeurs, soulte. Disclaimer affiché.
- [x] **15 (texte) Scripts Reels** ✅ 31/07 : « Générer un script vidéo » sur la
  fiche article (hook, 3-4 plans, CTA, hashtags, bouton copier). Les contrats
  PDF attendent des modèles validés (juridique).
- [x] **17 (V1 photo) Diagnostic BTP/mécanique** ✅ 31/07 : prompt finou-chat —
  panne probable, matériaux, FOURCHETTE annoncée comme approximative, renvoi
  search_services. (Déploiement de finou-chat encore à faire, voir ci-dessous.)
- [x] **20 (V1) Questions sur photo immobilière** : couvert par le chat photo.

**Déploiements de fonctions** : les 6 fonctions (finou-chat, finou-vision,
miroir-ia, send-push, create-checkout, + vendor-copilot/kyc-ocr/troc-eval du
31/07) sont toutes redéployées sur Supabase avec le CORS `*.workers.dev` —
✅ terminé le 01/08.

### Fait (cycles précédents)
1 Caméléon langue/registre ✅ · 2 Voix (navigateur) ✅ partiel · 3 Urgence
texte/photo ✅ partiel · 6 Recherche croisée ✅ (sans PostGIS) · 7 Snap&Buy ✅ ·
8 Planificateur événement ✅ base · 19 Miroir IA ✅ partiel.

### Décision de Beau nécessaire avant de coder (laissés de côté, à sa demande)
- **8 (suite)** Devis groupés AUTONOMES — engage des vendeurs sans accord.
- **11** CO2 → « Graines Finjaro » — le calcul est prêt à faire, mais le
  système de points (valeur, échange) est une décision produit.
- **14** Négociateur auto + arbitre SAV — répondre/rembourser au nom du
  vendeur = risqué, à cadrer.
- **15 (suite)** Contrats PDF — besoin de modèles juridiques validés.
- **23** Matching colocataires (facile) / anti-contrefaçon (déconseillé en
  l'état : pas fiable par photo, risque juridique).

### Abandonné (infra inexistante — décision Beau 31/07)
4-5 (traduction/interprète live), 16 (logistique livreurs), 18 (AR), 20-3D,
21 (acousticien), 22 (simulateur sensoriel), 2 (voix Gemini serveur), 3
(stress vocal audio).

## 6. Phase 2 (plus tard, ordre à décider)
Paiements (CinetPay/Stripe/commission/séquestre) · WhatsApp Business ·
livraison Europe/agences · refonte notifications multi-canal.
