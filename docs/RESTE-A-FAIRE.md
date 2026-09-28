# Tout ce qui reste à faire — rapport détaillé

État au **28/09/2026, 09 h 30 UTC**. Relevé depuis le carnet (`docs/A-FAIRE.md`),
la liste de travail, l'audit du jour et la base de production. Ce qui est fini
n'y figure pas.

**Comment lire :** 🔴 attend une décision de toi · 🟠 bloqué par autre chose ·
🔵 en cours · ⚪ pas commencé.

---

## A. Les 7 décisions qui t'attendent

| | Quoi | Ce qu'il faut de toi | Si tu ne le fais pas |
|---|---|---|---|
| A1 | **Recharger Google AI Studio, DeepSeek, OpenAI** — les trois à zéro | Recharger | Léo reste mort, l'assistant d'Accounting aussi. **Bloque 11 autres points.** |
| A2 | **Faille `push_notify`** — n'importe qui peut envoyer une notification qui paraît venir de Finjaro, à n'importe quel utilisateur | « go » | La porte reste ouverte au hameçonnage |
| A3 | **Mots de passe compromis** (HaveIBeenPwned) désactivé dans Supabase | « go » | Des comptes créés avec un mot de passe déjà volé ailleurs |
| A4 | **Boutiques de test au catalogue** : 65 articles sur 466 visibles (14 %) | « on cache » ou « on garde » | Les visiteuses voient des articles qu'elles ne peuvent pas acheter |
| A5 | **Raison de refus obligatoire** — fait, sur staging | « pousse » | Reste hors ligne |
| A6 | **Les 4 scripts de vidéo** | Les valider ou les corriger avec moi | Les vidéos ne repartent pas |
| A7 | **~11 à 13 $ chez ElevenLabs** (≈12 plans filmés) | Ton accord | Pas de plans filmés, seulement des captures |

Décisions plus anciennes, toujours ouvertes : compte MuAPI pour la vidéo ou
rester sur ElevenLabs · Cloudflare payante (5 $/mois, pour les bacs à sable de
l'atelier) · relever le plafond IA de Finjaro (4,48 € sur 5 €) · niveau de
finition du monde 3D · bâton et bagarres dans le monde 3D, oui ou non.

---

## B. La place de marché — finjaro.net

### B1. Le vrai problème : 222 articles sans prix 🔵

**222 articles réels sur 466 visibles** sont en « prix sur demande », dont la
plupart des fiches les plus regardées. Une personne qui ne voit pas de prix
s'en va. La carte « Articles sans prix » est en place dans l'espace vendeuse
depuis le 26/09 — jamais en notification, comme tu l'as demandé.
**Prochaine étape :** mesurer si elle fait bouger les vendeuses (compter les
articles qui passent de « sur demande » à un prix). Trop tôt aujourd'hui.

### B2. Messagerie Finjaro → un utilisateur ⚪ *(ta demande du 28/09)*

Aujourd'hui **ça n'existe pas**. La messagerie relie un acheteur à une
boutique ; écrire à une vendeuse depuis Finjaro obligerait à se faire passer
pour une cliente. Les notifications ne remplacent pas ça — la plupart des
boutiques ne les ont pas activées. Il reste WhatsApp à la main, sans aucune
trace dans Finjaro.
**Ce qu'il faut construire :** un canal officiel Finjaro → utilisateur, envoyé
depuis la Console, reçu dans l'application.
**Base déjà là, à étudier avant d'inventer :** les tables `notifications`,
`direct_conversations`, `direct_messages` et `support_tickets` existent.

### B3. Sécurité 🔴

- **`push_notify` ouverte à tous** (A2) — correctif écrit, une ligne, vérifié
  sans effet de bord dans les deux dépôts. Attend ton « go ».
- **Mots de passe compromis** (A3) — interrupteur gratuit, touche les deux
  applications.
- **Compteurs de vues gonflables** ⚪ : `increment_product_views`,
  `increment_reel_view` et `increment_reel_share` sont appelables sans limite
  par n'importe qui. Voulu (le navigateur les appelle), mais un chiffre de vues
  peut être gonflé. À encadrer avant de s'appuyer dessus pour décider.
- **13 fonctions au `search_path` modifiable** ⚪ : à durcir, aucune n'est
  exposée sans garde. Petite dette, pas urgent.

### B4. Léo et les moteurs 🟠

- **Message d'erreur trompeur** : la Direction dit « Google saturé » alors que
  **tous** les moteurs payants sont à court de crédit. Correction écrite,
  **pas appliquée**, j'attends ton go.
- **Kimi n'est jamais appelé** alors que sa clé est bien posée. Ma première
  explication était fausse. À reprendre dès que je peux relancer un appel,
  donc après la recharge.

### B5. Qualité, détails 🔵⚪

- Les outils vendeuse de Finia (créer un article, mes articles) parlent encore
  en **FCFA** au lieu de la monnaie de la boutique.
- **Journal des choix visible** : la raison d'une décision existe déjà dans le
  journal technique, pas dans celui qu'on lit.
- **Refus sans raison** : corrigé côté vendeuse (A5, sur staging). Côté
  acheteur, la raison reste volontairement facultative.

---

## C. Léo

### C1. Le monde 3D 🔵 — le plus gros chantier en cours

- **Étape 1, en cours** : la réception jouable (avatar, réceptionniste,
  ascenseur, salle de réunion, atelier), avec des outils gratuits.
- **Lot 3.2 à 3.9, en cours** : la vie des agents (marché, travail, sport,
  dormir), la grande carte, conducteur/passager/trottoir, la police, les sports
  et l'arcade, le rêve, le pays commun.
- **L'immeuble** ⚪ : raccourcis Réception / Salle de réunion / Atelier, et une
  icône réaliste à la place de l'emoji.
- **Tâches aux agents pour le monde virtuel** ⚪, dont une difficile, puis ma
  relecture — bloqué par les crédits.

### C2. « Léo, une entreprise vivante » ⚪ — ta vision du 24/09, pas commencée

Des managers, des subordonnés, des stagiaires, des alternants ; les agents qui
**se parlent entre eux** dans les salons ; une boîte d'intérim qui part auditer
d'autres entreprises ; des freelances.
**Aujourd'hui chaque agent rend son travail tout seul** — c'est l'écart le plus
grand entre ce que tu as décrit et ce qui existe. Le plan n'est pas écrit.

### C3. L'atelier de code 🔵⚪

- **Les agents qui codent pour de vrai** : la branche GitHub créée après
  « Confirmer ». En cours.
- **Lot 4** ⚪ : la langue (il répond en français sur un compte anglais), les
  tâches en arrière-plan, Ctrl+K, les tâches de code dans l'atelier.
- **GitHub par utilisateur** ⚪ (voir C4).

### C4. Connecteurs par utilisateur ⚪

Dans l'ordre : **GitHub** (installation, OAuth, dépôts, import, branche `leo/`
après Confirmer), puis **Supabase**, **Vercel**, puis sur mesure.
**Gmail** y entre aussi — ta question du 26/09 dans le salon : brancher ta
boîte mail à Léo. Ça n'existe pas encore.

### C5. Les agents au quotidien 🟠⚪

- **Le salut humain** : quand tu dis bonjour, plusieurs agents répondent, et
  vite. Aujourd'hui seul Alpha répond, au bout de dix minutes. Bloqué par les
  crédits.
- **Audit n° 6** 🔵 : déléguer aux agents et voir leur compte rendu.
- **Vestiaire d'entraînement** 🔵 : tes 15 ressources à étudier, ranger, et
  transformer en compétences.
- **Jarvis au geste** ⚪ et **l'appel qui sonne** pour de vrai ⚪.
- **Trier les idées des 5 IA** ⚪ (ChatGPT, Gemini, Perplexity…) : déjà dans
  Léo / à faire / à refuser.

---

## D. Les 4 vidéos 🔴

Bloquées au même endroit depuis vendredi : **les scripts, à écrire avec toi**
(A6). Tout le reste est décidé : voix de **Manon**, musique **dansante et
joyeuse**, fin sur **« Au-delà des rêves »**, mélange de plans générés et de
vraies captures, **Accounting = gérer tout son business** (la comptabilité et
l'audit en plus, automatiques). Motion est abandonné.
Après les scripts : ton accord sur les ~11 à 13 $ (A7), puis le montage.

**Textes de publication** (LinkedIn, Facebook, Instagram) : la tâche est
confiée à Plume, bloquée par les crédits.

---

## E. Finjaro Accounting (Claudinette)

Rien ne t'attend de spécifique. Son assistant IA est coupé pour la même raison
que les agents (A1). Elle attend aussi **un clic de ta part** : essayer le
relais sortant depuis un vrai compte.

---

## F. Ce que je fais sans rien te demander

Dès que les crédits reviennent (A1) : relancer les agents, relire leurs
livrables, reprendre le monde 3D et l'immeuble.
En attendant, je peux avancer sur ce qui ne dépend ni des agents ni de toi :
les connecteurs (C4), la langue de l'atelier (C3), le journal des choix (B5),
les outils vendeuse de Finia (B5), et l'étude de la messagerie Finjaro (B2).

---

## G. L'ordre que je propose

1. **A1, la recharge** — elle débloque à elle seule 11 points.
2. **A2 + A3**, deux « go » : la faille et les mots de passe. Deux minutes.
3. **A4**, les boutiques de test : une phrase suffit.
4. **A5**, pousser la raison de refus en ligne.
5. **A6 + A7**, les vidéos : vingt minutes avec toi sur les scripts.
6. Puis je reprends C1 (monde 3D) et C2 (l'entreprise vivante), qui sont les
   deux plus gros morceaux restants.
