# Finjaro — état du projet, méthode de travail et risques

_Document écrit le 30 juillet 2026. Il décrit l'état réel du projet, pas l'état
souhaité. Les faiblesses sont listées aussi franchement que les points solides —
c'est le seul intérêt d'un document pareil._

---

## 1. Ce que fait Finjaro

Une place de marché mobile-first pour la **mode, la beauté, les parfums et la
décoration d'événement**, visant l'Afrique et sa diaspora. Slogan: _Au-delà des
rêves_. Le site tourne sur **finjaro.net**.

Une seule application, deux espaces entre lesquels on bascule:

**Côté acheteuse**
- Catalogue par catégories (15), recherche, fiches produit, panier
- Commande avec **paiement à la livraison (COD)** — voir §6, c'est aujourd'hui
  le seul mode de paiement
- Messagerie directe avec chaque boutique
- **Fin** — un fil de vidéos courtes (reels) façon TikTok, avec commentaires
- **Près de vous** — boutiques et petites annonces géolocalisées, avec carte
- Avis après réception d'une commande, favoris, abonnements aux boutiques

**Côté vendeuse**
- Ouverture de boutique immédiate (pas de validation manuelle)
- Gestion des articles: photos, prix, stock, publication/retrait
- **Arrivages tournants** — option où les articles quittent le catalogue
  automatiquement après N jours, pour les vendeuses qui travaillent par arrivage
- Commandes, statistiques de vente, reels, classement des vendeuses

**Les deux fonctions d'IA**
- **Finou Chou** — une assistante qui interroge réellement la base (elle ne
  devine pas): chercher un article, lire les commandes, sortir le chiffre
  d'affaires, écrire à une boutique, ajouter au panier, créer une fiche article,
  régler les arrivages tournants. Entrée texte, photo ou dictée vocale.
- **Miroir IA** — essayage virtuel: l'acheteuse envoie une photo d'elle et voit
  le produit porté.

Tout est **bilingue FR/EN** et **multi-devises** (FCFA, EUR, USD, GBP).

---

## 2. Comment c'est construit

| Couche | Technologie |
|---|---|
| Interface | React 18 + Vite + Tailwind CSS |
| Traductions | react-i18next (`src/locales/{fr,en}`) |
| Base de données, authentification, fichiers | Supabase (PostgreSQL) |
| Logique serveur | Supabase Edge Functions (Deno/TypeScript) |
| IA | Google Gemini (`gemini-2.5-flash`) |
| E-mails | Resend, domaine `finjaro.net` vérifié |
| Hébergement | Cloudflare Workers, déploiement automatique depuis `main` |

**7 fonctions serveur**: `finou-chat`, `miroir-ia`, `finou-vision`,
`vendor-copilot`, `send-push` (push + e-mail), `create-checkout`,
`stripe-webhook`.

**Pensé pour un téléphone Android d'entrée de gamme en 3G**: chaque écran est
chargé à la demande, les images sont en WebP avec vignettes réduites, et chaque
écran de données gère les quatre états (chargement / contenu / erreur / vide).

---

## 3. Base de données et sécurité

**Chiffres réels au 30 juillet 2026** (relevés, pas estimés):
- 47 tables — **47 ont la sécurité par ligne (RLS) activée, 0 sans**
- 105 règles d'accès
- 21 fichiers de migration versionnés dans le dépôt

**Le principe de fond**: la sécurité est appliquée par la base de données, pas
par l'interface. Même quelqu'un qui contournerait complètement le site et
parlerait directement à l'API ne verrait que ce à quoi il a droit. Concrètement,
une acheteuse ne peut lire que ses propres commandes, une vendeuse que sa propre
boutique — c'est PostgreSQL qui refuse, pas un `if` en JavaScript.

**Ce qui a été durci depuis le début du projet** (migrations 0010 à 0019):
- Faille d'élévation de privilèges corrigée (un compte pouvait se donner des
  droits qu'il n'avait pas)
- Listing de fichiers du stockage restreint
- Limitation de débit sur les fonctions IA — sans elle, n'importe qui pouvait
  marteler l'API et brûler le budget Gemini
- Plafond de dépense IA mensuel, avec alerte automatique
- Performance des règles RLS: `auth.uid()` était réévalué **à chaque ligne**
  examinée; il est maintenant calculé une seule fois par requête. Invisible sur
  114 articles, mais c'était le principal coût CPU en cas de vrai trafic.

**Les clés secrètes ne sont jamais dans Git.** Elles vivent dans une table
`app_config` protégée par RLS **sans aucune règle d'accès** — c'est-à-dire
totalement inaccessible depuis un navigateur, seul le serveur y accède. Un
secret commité une fois reste dans l'historique Git pour toujours, même après
suppression: d'où cette précaution.

---

## 4. Comment je travaille, concrètement

Pour chaque changement:

1. **Lire le code existant avant d'écrire** — plusieurs "bugs" se sont révélés
   être des fonctionnalités déjà présentes, et plusieurs vrais bugs ont été
   trouvés en lisant plutôt qu'en supposant.
2. **`npm run build`** — refuse de continuer si ça ne compile pas.
3. **Vérification au navigateur réel** (Chromium sans interface) contre la
   version compilée, avec des données simulées et parfois une vraie session:
   je regarde ce qui s'affiche vraiment, je ne me fie pas au code.
4. **Tests base de données dans des transactions annulées** — je simule le cas
   réel (ex: une cliente commande, puis la rotation supprime l'article) et je
   vérifie le résultat, puis tout est annulé. La base de production n'est pas
   polluée; je le vérifie après coup.
5. **Commit descriptif**, expliquant le _pourquoi_ et ce qui a été vérifié.
6. **Fusion vers `main`** → Cloudflare déploie automatiquement.

**Ce qui est vraiment testé avant chaque mise en ligne**: la compilation, le
rendu réel de l'écran modifié, et la logique de base de données concernée. Rien
d'autre.

---

## 5. Environnements — la principale faiblesse

**Il n'y a pas d'environnement de test. C'est le point faible numéro un du
projet.**

Il existe **un seul** projet Supabase et **un seul** site. Toute migration part
directement en production. Tout déploiement est immédiatement visible par les
utilisatrices. Il n'y a pas de "bac à sable" où casser les choses sans
conséquence.

**Ce qui limite les dégâts aujourd'hui:**
- Les tests de base de données tournent dans des transactions annulées
- La compilation et le rendu sont vérifiés avant chaque mise en ligne
- Les migrations sont écrites de façon idempotente (`if not exists`), donc
  rejouables sans casse
- Git permet de revenir en arrière sur le code

**Ce qui n'est pas couvert:**
- Une migration destructrice serait appliquée directement sur les vraies données
- Revenir en arrière sur le **code** est simple; revenir en arrière sur une
  **migration** ne l'est pas
- Aucune répétition générale possible avant une grosse fonctionnalité

**Il n'y a aucun test automatisé.** Pas de suite de tests, pas de garde-fou
contre les régressions. L'intégration continue (`.github/workflows/ci.yml`) ne
fait qu'une chose: vérifier que le projet compile. Concrètement, si une
modification casse quelque chose testé il y a trois semaines, **rien ne le
détectera** — sauf une utilisatrice.

**Les mises en ligne vont directement sur `main`**, sans relecture par un tiers
ni pull request. C'est rapide, mais il n'y a pas de second regard.

**La base est partagée avec une autre application** (tables `njangis`,
`projects`, `shared_spaces`, `budget_entries`…). Elles ne sont pas à Finjaro et
ne doivent jamais être touchées — la frontière est documentée dans
`MIGRATION_NOTES.md` §2 et respectée dans chaque migration. Le risque reste
réel: une migration mal ciblée pourrait les atteindre.

---

## 6. Risques de sécurité connus

Relevé effectué avec l'outil d'audit officiel de Supabase, le 30 juillet 2026.
Classé par importance réelle, pas par gravité théorique.

### À corriger, facile (2 minutes, côté tableau de bord Supabase)

**Protection contre les mots de passe déjà piratés — désactivée.**
Supabase peut refuser les mots de passe connus des fuites publiques
(HaveIBeenPwned). C'est décoché aujourd'hui. À activer dans
_Authentication → Policies_. Gain immédiat, aucun effet de bord.

### À examiner, sans urgence

**Fonctions internes appelables depuis l'extérieur.**
Les fonctions `is_admin()`, `owns_shop()`, `in_conversation()` servent aux règles
RLS mais sont aussi appelables directement par l'API.

Le risque réel est **faible**: elles ne renseignent que sur l'appelant lui-même
(«suis-je admin ?», «est-ce ma boutique ?») — informations qu'il connaît déjà.
Aucune donnée d'autrui ne fuit.

**Attention avant de "corriger"**: ces fonctions sont appelées à l'intérieur des
règles RLS, exécutées sous l'identité de l'utilisateur connecté. Leur retirer le
droit d'exécution risque de **casser les règles de sécurité elles-mêmes**. À ne
faire qu'avec un test préalable — c'est typiquement le genre de correction
"évidente" qui casse une application en production.

**Extensions `pg_net` et `pg_trgm` dans le schéma public.** Signalé par l'outil,
sans conséquence pratique ici. Les déplacer demanderait de vérifier tout ce qui
en dépend.

### Signalé mais volontaire et correct

`app_config` et `rate_limits` ont la RLS activée **sans aucune règle**. L'outil
le signale, mais c'est exactement l'effet recherché: ces tables contiennent les
clés secrètes et les compteurs anti-abus, et doivent être **totalement**
inaccessibles depuis un navigateur. Seul le serveur y accède.

### Risques non techniques

**La clé API Resend a transité en clair dans une conversation.** Elle n'est pas
dans Git (vérifié), mais elle a existé en clair ailleurs. La régénérer prendrait
30 secondes. Beau a choisi de la garder pour l'instant — décision consciente,
notée ici pour mémoire.

**Aucun paiement en ligne aujourd'hui.** C'est une faiblesse commerciale, mais
paradoxalement une protection: aucun flux d'argent ne transite par la
plateforme, donc aucun risque financier direct. Cela changera en phase 2.

---

## 7. Ce qui reste à faire

**Prêt à construire** — prix barré/promotion (en cours), adresse de livraison
enregistrée, recherche dans une boutique, raccourci «Racheter», vérification que
les notifications push arrivent réellement.

**Décisions en attente** — refonte du système de livraison (zones, agences
partenaires, points relais en Europe), ventes flash et seconde main, bandeau de
garanties, achat groupé.

**Phase 2, paiement** — CinetPay (Orange Money, MTN Money), Stripe (cartes,
diaspora), commission Finjaro, séquestre, WhatsApp Business. **Bloqué pour une
raison administrative, pas technique**: le titre de séjour étudiant n'autorise
pas de créer une auto-entreprise en France sans autorisation préalable de la
préfecture, et sans structure légale il n'y a ni compte Stripe ni compte
marchand CinetPay.

**Recommandations, par ordre d'utilité réelle:**

1. **Activer la protection contre les mots de passe piratés** — 2 minutes.
2. **Créer un projet Supabase de test** avant la phase paiement. Manipuler de
   l'argent réel sans environnement de répétition est le vrai danger à venir,
   bien plus que n'importe quel avertissement de l'audit ci-dessus.
3. **Ajouter quelques tests automatisés** sur les parcours critiques (commande,
   panier, connexion) avant que le code ne grossisse davantage.
4. **Vérifier la politique de sauvegarde** du projet Supabase — je ne l'ai pas
   contrôlée et ne peux rien affirmer dessus.
