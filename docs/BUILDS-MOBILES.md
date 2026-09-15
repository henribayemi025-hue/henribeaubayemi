# Les applications Android et iPhone — tout ce qu'il faut savoir

Beau (15/09): « mets tout minutieusement en détail, comme ça si ça casse, un
dev vient et il sait exactement quoi faire ».

Ce fichier est fait pour être lu par quelqu'un qui arrive **sans rien
connaître du projet**. Chaque piège décrit ici nous a coûté du temps pour de
vrai — les dates sont là pour que personne ne croie que c'est théorique.

---

## 1. Ce que sont ces applications

Les applications Finjaro **ne contiennent pas le produit**. Ce sont des
fenêtres qui affichent `https://finjaro.net`, fabriquées avec **Capacitor**.

Conséquence capitale, et bonne nouvelle: **une mise en ligne du site atteint
les utilisateurs sans repasser par les magasins**. On ne refabrique une
application que lorsque la partie NATIVE change — l'icône, les permissions,
la configuration Capacitor, un plugin.

Conséquence moins agréable: tout ce qui suppose un vrai programme installé —
les notifications au premier chef — ne marche pas tout seul. Voir §6.

Identifiant de l'application, identique sur les deux magasins:

```
net.finjaro.app
```

---

## 2. Les quatre pièges de `capacitor.config.json`

Ce fichier paraît anodin. Chacune de ses lignes bizarres répare une panne
constatée.

### « Continuer avec Google » ouvrait Chrome au lieu de l'application

`server.allowNavigation` liste les domaines que l'application a le droit
d'afficher **dans sa propre fenêtre**. Tout domaine absent part dans le
navigateur du téléphone. `accounts.google.com` n'y était pas: la page Google
s'ouvrait dans Chrome, la session naissait dans Chrome, et l'application
restait déconnectée. Constaté par Beau sur la version de test interne du
**08/08**, alors que e-mail + mot de passe fonctionnait parfaitement — d'où la
difficulté à voir le problème.

Google et Apple doivent rester dans cette liste tant que la connexion passe
par eux.

### Google refusait la connexion même une fois la page affichée

Google interdit sa page de connexion aux navigateurs intégrés. Il les
reconnaît au marqueur `; wv)` dans la signature du navigateur et répond
`disallowed_useragent`. D'où `android.overrideUserAgent`, qui présente
l'application comme un Chrome Android ordinaire.

**Sans cette ligne, le correctif précédent ne suffit pas**: la page s'affiche
et refuse quand même.

Même chose sur iPhone (`ios.overrideUserAgent`): la signature par défaut d'une
fenêtre intégrée iOS n'a pas le jeton `Safari/…`, et Google s'en sert aussi
pour refuser.

### Le titre collé au trou de la caméra

Depuis **Android 15** (notre cible SDK 36), le système force les applications
à dessiner jusque **sous** la barre d'état et la barre de navigation. Constaté
par Beau le 08/08: titre d'écran sous la caméra, bandeau orange du profil
montant jusqu'en haut.

`android.adjustMarginsForEdgeToEdge: "force"` demande à Capacitor de réserver
lui-même la place des deux barres.

### Le numéro de version Android

```gradle
versionCode = (System.getenv("ANDROID_VERSION_CODE") ?: "1").toInteger()
```

**La forme AFFECTATION (avec le `=`) est obligatoire.** Écrit
`versionCode (…).toInteger()`, Groovy comprend « appeler la méthode
versionCode(…) puis .toInteger() sur son résultat » — et le build échoue de
façon incompréhensible.

Le numéro vient du numéro de run GitHub Actions: chaque fabrication produit
donc un numéro plus grand, ce que le Play Store exige.

---

## 3. Fabriquer le .aab Android

**Onglet Actions → « Android AAB » → Run workflow.** Le fichier à déposer sur
Play Console sort en artefact du run, sous le nom `finjaro-release-aab`.

Secrets nécessaires, une seule fois, dans *Settings → Secrets → Actions*:

| Secret | Ce que c'est |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | le keystore d'upload, encodé en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | son mot de passe |

Sans eux, un lancement manuel s'arrête avec un message clair — plutôt qu'un
`.aab` non signé que le Play Store rejetterait de toute façon. Un push
ordinaire, lui, ne devient pas une croix rouge.

Le workflow se déclenche aussi tout seul sur `staging` quand `android/**`,
`capacitor.config.json` ou le workflow lui-même changent.

**Ensuite, à la main:** Play Console → Production (ou test interne) → Créer
une version → déposer le `.aab`.

---

## 4. Fabriquer et envoyer l'app iPhone

**Onglet Actions → « iOS IPA » → Run workflow.** Contrairement à Android,
**il n'y a rien à télécharger**: l'envoi vers App Store Connect fait partie du
job. La raison est concrète — l'outil de dépôt d'Apple (Transporter) n'existe
pas sous Windows, et Beau est sous Windows.

Secrets nécessaires:

| Secret | Ce que c'est |
| --- | --- |
| `APPSTORE_API_KEY_ID` | l'identifiant de la clé, 10 caractères |
| `APPSTORE_API_ISSUER_ID` | l'Issuer ID du compte, en forme d'UUID |
| `APPSTORE_API_KEY_BASE64` | le fichier `AuthKey_XXXXXXXXXX.p8` en base64 |

La clé se crée sur *App Store Connect → Utilisateurs et accès → Intégrations
→ Clés API*, rôle Admin ou App Manager. **Le `.p8` ne se télécharge qu'UNE
fois** — comme la clé Sign in with Apple. Perdu, il faut en refaire une.

### La signature: ne pas refaire l'erreur

**N'active pas la signature « automatique » de Xcode.** Essayée en premier,
elle ne peut pas marcher ici: elle ne signe qu'en développement, et un profil
de développement exige au moins un iPhone enregistré dans le compte — ce
qu'une machine de CI n'a pas.

fastlane demande à Apple, à partir de la clé d'API, un certificat de
distribution et un profil App Store, les installe, puis archive en les
désignant. Aucun certificat à fabriquer ni à conserver à la main. La recette
est dans `fastlane/Fastfile`.

### Deux pièges qui font perdre une heure

**La fiche de l'app doit exister d'abord** dans App Store Connect (*Mes apps →
+ → Nouvelle app*, bundle `net.finjaro.app`). Sinon l'envoi échoue sur
`No suitable application records were found`.

**`fastlane/**` doit figurer dans les chemins déclencheurs du workflow.**
Oublié, on pousse un correctif de signature qui ne déclenche aucun run — perdu
au run 6.

Enfin, **les minutes macOS comptent 10× dans le quota GitHub**. Ce job ne
tourne que quand la partie native change, ce qui est rare. Ne pas le lancer
pour rien.

---

## 5. L'examen d'Apple, ce qu'on a appris

Refus du **14/08/2026**, guideline 2.1 « Information Needed », build 1.0.10.
Apple ne disait pas que l'app était cassée: elle demandait sept informations.
**Dans ce cas il n'y a pas de nouveau build à envoyer** — on répond dans
« Reply to App Review » et l'examen reprend.

Ce qu'il faut préparer, et qui vaut pour n'importe quelle app Finjaro:

- **Un compte de démonstration par E-MAIL, jamais par Google.** L'examinateur
  est aux États-Unis: ni numéro camerounais, ni compte Google d'essai. S'il ne
  peut pas se connecter, il refuse à nouveau.
  Le nôtre: `fin.finjaro+review@gmail.com`.
- **Le compte doit voir du contenu.** Une boutique de démonstration avec de
  vrais articles, sinon l'espace vendeur s'ouvre sur un écran vide et ça
  ressemble à une app inachevée. C'est la raison pour laquelle
  « Finjaro Demo Shop » et « Finjaro — boutique de démonstration » restent
  **volontairement visibles** alors que les autres comptes de test sont
  masqués (voir migrations 0125 et 0126).
- **Une vidéo en une seule prise**, sans coupure, montrant le parcours
  demandé depuis le lancement de l'application.

---

## 6. Les notifications: le piège qui a coûté le plus cher

**Les notifications « web » ne fonctionnent pas dans une fenêtre Capacitor**,
ni sur Android ni sur iPhone. Ça aurait dû être vérifié pendant la mise en
place des applications, la semaine du 04/08. Ça ne l'a pas été.

Constat en base le 10/08: **0 abonnement**, et **11 commandes sur 21** jamais
acceptées par la vendeuse faute d'être prévenue.

Il n'y a **aucun contournement**. Sur Android, une notification passe
obligatoirement par Firebase Cloud Messaging; sur iPhone, par APNs. Les
services qui prétendent l'éviter (OneSignal, Expo…) les utilisent en dessous.

Les deux dépendent du **compte développeur**, pas du projet:

- **Firebase** → créer un projet, ajouter une application Android avec le
  package exact `net.finjaro.app`, télécharger `google-services.json`.
- **Clé APNs** → `developer.apple.com/account/resources/authkeys/list`,
  bouton +, cocher *Apple Push Notifications service*, télécharger le `.p8` et
  **noter le Key ID** affiché à l'écran.

Depuis, ça marche: la table `native_push_tokens` contenait **14 téléphones**
au 15/09, et un envoi de test a bien abouti (`{"push":0,"native":1}`).

Détail à connaître: `push_notify()` en base appelle la fonction edge
`send-push`, qui distribue vers FCM, APNs et l'e-mail. Le compte-rendu d'un
envoi se lit dans `net._http_response` — **mais cette table ne garde que
~6 heures**, donc un incident de la veille n'y est plus.

---

## 7. Ce qui reste ouvert

- Déposer le `.aab` Android sur Play Console.
- Envoyer la version iOS 1.0.1 build 13 en vérification.
- **Les fiches des deux magasins contiennent encore le mot
  « camerounaise »**, ce qui contredit la règle du produit mondial (§1 du
  `CLAUDE.md`). À corriger avant la prochaine soumission.
