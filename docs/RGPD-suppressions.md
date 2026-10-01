# Demandes de suppression de compte — procédure et registre

Ce dépôt est public : le registre ne contient **aucune donnée personnelle**
(ni adresse, ni nom, ni identifiant). Le détail est dans la base
(`profiles.deletion_processed_at`) et dans les exports privés de Beau.

## Procédure (en attendant l'outil du lot 3)

Le projet Supabase est commun à plusieurs applications (CLAUDE.md §4 et §8) :
**on ne supprime pas la ligne du `auth.users` commun**. Traiter une demande,
c'est :

1. **Faire un export** de la base avant toute écriture.
2. **Mesurer l'empreinte** du compte dans toutes les tables (tous schémas),
   en particulier Accounting (`finia_*`) et Léo (`legion_*`). Si le compte a
   des données dans une autre application, prévenir Beau et Claudinette
   avant d'aller plus loin.
3. **Profil** : nom, photo, téléphone, adresse, ville, raison, mémoire Finia
   effacés ; e-mails coupés ; compte suspendu ; `deletion_processed_at = now()`.
   L'écriture se fait en `service_role`, sinon le déclencheur
   `protect_profile_privileges` annule la suspension.
4. **Données place de marché** : boutique, articles, vidéos, messages,
   favoris, abonnements, notifications, relances, jetons de notification,
   pièce d'identité : effacés. Événements de statistiques : détachés du
   compte (`user_id` vidé). Commandes passées : conservées sans le nom
   (obligations comptables, voir `src/legal/deletion.js`).
5. **Connexion** : adresse e-mail remplacée par
   `supprime-<id>@finjaro.invalid`, téléphone et métadonnées vidés, mot de
   passe retiré, identités et sessions supprimées, bannissement de 100 ans.
   **Jamais `banned_until = 'infinity'`** : le service d'authentification ne
   sait pas lire cette valeur et répond « erreur 500 » (constaté le 01/10).
6. **Vérifier** : la connexion avec l'ancienne adresse est refusée (400),
   aucune session, aucune donnée restante, journal d'authentification sans
   erreur.

## Registre

| Demandée le | Traitée le | Compte | Empreinte | Vérification |
|---|---|---|---|---|
| 28/08/2026 | 01/10/2026 | Compte de **test** (marqué `is_test`), créé 45 s avant la demande, le jour de l'examen Apple ; reconnecté le 23/09 malgré la demande (défaut C-4 bis) | Profil, 2 notifications, 1 relance, 9 événements, 1 identité, 3 sessions. Rien dans Accounting, Léo, ni le stockage | Connexion refusée (400 « Invalid login credentials ») avec l'ancienne et la nouvelle adresse ; 0 session, 0 identité, 0 donnée restante ; plus aucune demande en attente |
