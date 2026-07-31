# Finjaro — LA liste de tout ce qui reste à faire

_Fichier maître, tenu à jour à chaque cycle. Dernière mise à jour : 31 juillet
2026 (session staging). Si un point est traité, il passe en ✅ avec la date —
rien n'est supprimé, pour garder l'historique des décisions de Beau._

## Circuit de travail (rappel)

- Tout se code sur la branche **`staging`** → déployé automatiquement sur le
  Worker **finjaro-staging** (URL de test, invisible du public).
- **finjaro.net** ne change QUE quand Beau valide et qu'on fusionne `staging`
  dans `claude/finjaro-marketplace-build-xsripr` (branche de production
  surveillée par Cloudflare).
- Base de données : les deux frontends pointent sur le projet Supabase de
  production (`bokwivwizghdlaedczbw`) — toute migration doit donc rester
  additive. Projet de test : `qiyvoaljqmbfldephobp`.

---

## 1. Bugs signalés par Beau — validés, en attente du « go » point par point

| # | Problème | Diagnostic |
|---|---|---|
| B1 | Profil → « Sign in » affiche « you need to be signed in to do that » au lieu d'ouvrir l'écran de connexion | TROUVÉ : le bouton appelle `requireLogin()` (la popup de garde) au lieu de naviguer vers `/auth`. Une ligne à corriger dans `UserProfile.jsx`. |
| B2 | « you need to sign in to continue » ailleurs | À préciser par Beau : quel écran exactement ? |
| B3 | Catégorie Musique absente | Corrigé le 31/07 (bug d'ordre dans region.js) — Beau doit reconfirmer sur finjaro.net. |
| B4 | « Les pièces enregistrées partent où ? » | Pas un bug : bucket privé `ids` + table `vendor_applications`. Manque peut-être une CONFIRMATION visible après envoi — à montrer à Beau. |
| B5 | Bouton localisation boutique : « ça fait quoi ? » | Le code marche (GPS → base → toast). Le retour visuel est peut-être trop discret. À revoir avec Beau. |
| B6 | Photos des nouvelles catégories | EN ATTENTE DES PHOTOS DE BEAU (Musique, Sport, Électroménager, Livres, Santé, Animaux, Jardin + les têtes sans photo héritée). |

## 2. Renommer « Finou Chou »

Beau veut un nom plus sérieux (retour d'un ami : « fait trop comme quelqu'un
qui veut faire rire mais n'y arrive pas »). Proposés : **Fino, Jaro, Finia,
Nio**. Réponse de Beau « fin ai ca me vas bien » → probablement **Finia**, à
confirmer explicitement avant le renommage global (UI + i18n + docs ; les noms
de fonctions edge `finou-*` peuvent rester, c'est interne).

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

- [ ] **B1** — corriger le bouton Sign in du profil (voir §1).
- [ ] **Prix barré / promo (%)** sur les fiches produit — la colonne existe
  déjà en base, reste le champ vendeur + l'affichage. (tâche #14, in progress)
- [ ] **Badges Ventes flash / 2nde main** sur les cartes produit (décision §3).
- [ ] **Recherche dans le catalogue d'une boutique** (tâche #16).
- [ ] **Raccourci « Racheter »** sur les articles déjà commandés (tâche #19).
- [ ] **Adresse de livraison enregistrée** sur le profil (tâche #13).
- [ ] **Notifications** : vérifier qu'elles marchent vraiment sur finjaro.net
  (tâche #11).
- [ ] **Photos de catégories** dès réception (B6).
- [ ] L'annuaire Prestataires reste vide tant que les boutiques n'ont pas coché
  un métier — TidalEx reclassée le 31/07, les autres vendeurs doivent le faire
  dans « Ma boutique ».

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

**Déploiements de fonctions restants** (le code est dans le dépôt, prêt) :
- [ ] `finou-chat` (prompt diagnostic BTP + CORS workers.dev)
- [ ] `finou-vision`, `miroir-ia`, `send-push`, `create-checkout` (CORS
  workers.dev uniquement — sans ça, ces IA ne répondent pas depuis l'URL de
  test finjaro-staging.workers.dev; déjà OK pour vendor-copilot/kyc-ocr/
  troc-eval, déployés le 31/07).

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
