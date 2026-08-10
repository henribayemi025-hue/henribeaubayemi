# Notifications dans les applis Android et iPhone

## Pourquoi ce document existe

Les applis Finjaro sont des fenêtres qui affichent finjaro.net. Les
notifications « web » ne fonctionnent pas dans ce type de fenêtre — ni sur
Android, ni sur iPhone. Aujourd'hui, **aucune des deux applis ne peut recevoir
de notification**. Les vendeuses ne sont prévenues que par e-mail, et trois
d'entre elles n'ont même pas d'adresse e-mail.

Conséquence mesurée en base le 10/08/2026 : **0 abonnement aux notifications**,
et **11 commandes sur 21** jamais acceptées par la vendeuse.

Ça aurait dû être vérifié pendant la mise en place des applis, la semaine du
04/08. Ça ne l'a pas été.

## Ce qui ne peut PAS être contourné

Sur Android, une notification passe **obligatoirement** par les serveurs de
Google (Firebase Cloud Messaging). Sur iPhone, **obligatoirement** par ceux
d'Apple (APNs). Toutes les applications du monde font ainsi. Il n'existe aucun
service tiers qui évite ce passage — ceux qui le prétendent (OneSignal,
Expo…) l'utilisent en dessous.

Ces deux passages sont liés au **compte développeur de Beau**, pas au projet.
D'où les deux manipulations ci-dessous, qui ne peuvent être faites que par lui.

---

## Manipulation 1 — Firebase (pour Android) · ~5 minutes

1. Aller sur **console.firebase.google.com**, se connecter avec le compte
   Google qui possède déjà la console Play.
2. **Créer un projet** → nom : `Finjaro`. Refuser Google Analytics (inutile
   ici, et ça ajoute des écrans de consentement).
3. Une fois le projet créé, cliquer sur l'icône **Android** (« Ajouter une
   application »).
4. **Nom du package** — le recopier exactement, sans faute :
   ```
   net.finjaro.app
   ```
   Laisser les autres champs vides.
5. Cliquer sur **Télécharger google-services.json**.
6. M'envoyer ce fichier. C'est tout — ignorer les étapes 3, 4 et 5 que
   Firebase affiche ensuite (« ajouter le SDK »), c'est mon travail.

Gratuit, sans carte bancaire. Le fichier ne contient aucun secret dangereux :
il identifie l'application, il ne donne pas accès au compte.

## Manipulation 2 — Clé APNs (pour iPhone) · ~2 minutes

C'est **exactement la même manipulation** que la clé `AuthKey_YTXF8Y6SAQ.p8`
créée pour la connexion Apple. Même écran, une case différente.

1. Aller sur **developer.apple.com/account/resources/authkeys/list**
2. Bouton **+** (Créer une clé)
3. Nom : `Finjaro Push`
4. Cocher **Apple Push Notifications service (APNs)**
5. Continuer → Enregistrer → **Télécharger** le fichier `.p8`
6. Noter aussi le **Key ID** affiché à l'écran (10 caractères).

⚠️ Le fichier `.p8` ne peut être téléchargé **qu'une seule fois**. S'il est
perdu, il faut recréer une clé.

M'envoyer le `.p8` et le Key ID.

---

## Ce que je fais ensuite, sans rien demander de plus

- Installer `@capacitor/push-notifications` dans les deux projets.
- Déclarer la permission `POST_NOTIFICATIONS` dans le manifeste Android
  (obligatoire depuis Android 13) et l'activation « Push Notifications » sur
  l'App ID Apple.
- Enregistrer le jeton de chaque téléphone dans une nouvelle table
  `device_tokens`, à côté des abonnements web existants.
- Étendre la fonction `send-push` : elle enverra vers les trois canaux — web,
  Android, iPhone — au lieu du seul web aujourd'hui.
- Demander la permission **au bon moment** (après la première commande reçue),
  comme c'est déjà fait sur le site.
- Produire les deux nouveaux builds et les téléverser.

Compter une demi-journée de mon côté après réception des deux fichiers.

## Effet sur les publications en cours

- **Play Store** : il faut téléverser une nouvelle version sur le test fermé.
  Le compteur des 14 jours porte sur les **testeurs inscrits**, pas sur la
  version — il ne devrait donc pas repartir de zéro. À surveiller quand même
  sur le tableau de bord après l'envoi.
- **App Store** : la version en cours d'examen n'a pas les notifications.
  Elles arriveront dans la version suivante. **Ne pas retirer la soumission en
  cours** : les notifications ne sont pas exigées par Apple, et retirer une
  soumission fait perdre sa place dans la file pour rien.

## En attendant — ce qui marche déjà

L'e-mail fonctionne (38 comptes sur 43 en ont un) et part de
`notifications@finjaro.net`. Les relances de commandes en attente passent donc
par ce canal, sans dépendre de Firebase ni d'Apple.

Les trois vendeuses sans e-mail restent injoignables tant que les
notifications mobiles ne sont pas en place — ou tant qu'elles n'ont pas
renseigné un e-mail.
