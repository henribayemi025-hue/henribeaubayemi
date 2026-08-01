# Finjaro — LA liste de tout ce qui reste à faire

_Fichier maître, tenu à jour à chaque cycle. Dernière mise à jour : 31 juillet
2026 (session staging). Si un point est traité, il passe en ✅ avec la date —
rien n'est supprimé, pour garder l'historique des décisions de Beau._

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
