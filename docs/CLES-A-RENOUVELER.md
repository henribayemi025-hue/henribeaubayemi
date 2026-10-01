# Renouveler les clés et les sortir de la base — marche à suivre (01/10)

> **VAPID : risque accepté par Beau le 01/10** (« vapid ça va ») — la clé n'est pas renouvelée.
>
> **État (01/10, décision de Beau)** : VAPID d'abord, après la mise en ligne
> du site qui réabonne les navigateurs. Resend, Firebase et Apple : **plus
> tard**. Le point reste critique et ouvert dans l'audit (C-6) tant que ces
> trois clés ne sont pas renouvelées et retirées de `app_config`.

Demande de Beau du 01/10 : régénérer la clé privée VAPID, la clé API Resend, la
clé privée FCM et la clé privée APNs ; les ranger dans les **secrets des
fonctions** Supabase ; ne garder dans `app_config` que de la configuration
non sensible.

Ce fichier ne contient **aucune clé**. Le dépôt est public.

## Pourquoi Beau doit faire une partie lui-même

- Claude n'a pas d'accès en écriture aux secrets des fonctions Supabase (son
  accès lit et modifie la base, pas ce réglage).
- Resend, Firebase (Google) et Apple ne délivrent une nouvelle clé que depuis
  le compte de Beau.
- La clé VAPID, elle, a été générée par Claude : Beau la reçoit dans un
  fichier envoyé dans l'appli Claude, à coller tel quel.

## Ce qui est déjà en place (Claude, 01/10)

- `send-push` (version 68) lit chaque clé **d'abord dans les secrets**, et ne
  retombe sur `app_config` que si le secret n'existe pas encore. Coller un
  secret suffit donc pour basculer, sans rien redéployer.
- `leo-contact`, `create-checkout`, `stripe-webhook`, et `accounting-rappels`
  côté Accounting, lisaient déjà les secrets en premier.
- Un diagnostic indique, pour chaque canal, d'où vient la clé (`secret` ou
  `app_config`) et si le fournisseur l'accepte. Il n'envoie rien à personne.
- Le site demande la clé publique VAPID au serveur. Il réabonne tout seul un
  navigateur abonné avec l'ancienne clé, sans redemander la permission. C'est
  sur staging pour l'instant ; il faut le mettre en ligne avant de basculer
  VAPID.

## Étapes pour Beau

Tous les secrets se collent au même endroit : **supabase.com → projet Finjaro →
Edge Functions → Secrets → Add new secret**. Le nom doit être recopié **à la
lettre**.

**Ne supprime aucune ancienne clé avant que Claude ait confirmé que les
nouvelles marchent.**

1. **VAPID (notifications web)**
   - Ouvre le fichier `A-COLLER-dans-Supabase-VAPID_KEYS.txt` envoyé par
     Claude.
   - Nom : `VAPID_KEYS`. Valeur : la longue ligne qui commence par `{`.
   - Supprime ensuite le fichier de ton téléphone et de ton ordinateur.
   - ⚠ À faire seulement après la mise en ligne du site qui réabonne les
     navigateurs (sinon les 3 navigateurs abonnés aujourd'hui ne reçoivent
     plus rien jusqu'à leur prochaine visite).

2. **Resend (e-mails)**
   - resend.com → API Keys → Create API Key.
   - Nom : « finjaro-2026-10 ». Permission : *Sending access*. Domaine :
     finjaro.net.
   - Copie la clé (elle ne s'affiche qu'une fois).
   - Secret Supabase, nom : `RESEND_API_KEY`.
   - Cette clé sert aussi à **Accounting** (rappels). Claudinette est
     prévenue : sa fonction lit le même secret.

3. **Firebase (notifications Android)**
   - console.firebase.google.com → projet Finjaro → roue dentée → Paramètres
     du projet → Comptes de service → « Générer une nouvelle clé privée ».
   - Un fichier `.json` se télécharge. Ouvre-le avec un éditeur de texte et
     copie **tout** son contenu.
   - Secret Supabase, nom : `FCM_SERVICE_ACCOUNT`.

4. **Apple (notifications iPhone)**
   - developer.apple.com → Certificates, Identifiers & Profiles → Keys → « + ».
   - Nom : « Finjaro APNs 2026-10 ». Coche *Apple Push Notifications service
     (APNs)* → Continue → Register.
   - **Download** : le fichier `.p8` ne se télécharge **qu'une seule fois**.
   - Note le *Key ID* (10 caractères), affiché sur la même page.
   - Deux secrets Supabase :
     - `APNS_PRIVATE_KEY` : tout le contenu du `.p8`, ouvert avec un éditeur
       de texte, lignes BEGIN et END comprises.
     - `APNS_KEY_ID` : le Key ID.
   - Apple limite à 2 clés APNs par compte. Si la création est refusée,
     dis-le à Claude avant de révoquer quoi que ce soit : révoquer la clé en
     service coupe les notifications iPhone.

5. **Stripe (paiements, mode test)** — pas demandé au renouvellement, mais à
   sortir de la base aussi.
   - dashboard.stripe.com (mode test) → Développeurs → Clés API → clé
     secrète.
   - Développeurs → Webhooks → le point de terminaison Finjaro → clé de
     signature.
   - Secrets Supabase : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`.

6. Écris à Claude « c'est collé ».

## Ce que Claude fait ensuite, et comment il le prouve

1. Diagnostic : chaque canal doit afficher `source: secret` et
   `valide: true`. Pour iOS, Apple doit répondre « BadDeviceToken » à un
   numéro d'appareil inventé : cela prouve que la nouvelle clé est acceptée,
   sans rien envoyer à personne.
2. Vrai envoi de test au seul compte de Beau (« Test Finjaro (2/2) ») :
   Android et e-mail comptés comme livrés, et Beau confirme qu'il l'a reçu.
   Pour le web, Beau active les notifications sur finjaro.net dans un
   navigateur, puis Claude renvoie un test.
3. Retrait des valeurs secrètes de `app_config`. Pour Resend, **seulement
   après le « clé OK » de Claudinette** : elle vérifie la nouvelle clé sur le
   vrai passage des rappels Accounting de 18 h UTC (pas d'envoi de test
   possible sans écrire à de vrais utilisateurs). Sinon, une clé mal collée
   ferait tomber ses rappels en erreur. Restent l'expéditeur des
   e-mails, les identifiants d'équipe et d'appli Apple, l'identifiant du
   projet Firebase et la clé publique VAPID. Diagnostic relancé : tout doit
   rester `secret` / `valide`.
4. Seulement alors, Beau supprime les anciennes clés :
   - Resend : l'ancienne clé ;
   - Google Cloud → IAM → Comptes de service → compte firebase-adminsdk →
     Clés : la clé créée avant le 01/10 ;
   - Apple : l'ancienne clé APNs.
5. Diagnostic final après la suppression : il prouve que plus rien ne dépend
   des anciennes clés.

## Mesures de départ (01/10, avant tout changement)

| Canal | Source | Fournisseur | Envoi réel au compte de Beau |
|---|---|---|---|
| Web (VAPID) | app_config | clé importée | pas d'appareil web pour Beau |
| Android (FCM) | app_config | Google délivre un jeton | 1 livré |
| iOS (APNs) | app_config | Apple : 400 BadDeviceToken (clé acceptée) | pas d'iPhone pour Beau |
| E-mail (Resend) | app_config | HTTP 200 | 1 accepté |
