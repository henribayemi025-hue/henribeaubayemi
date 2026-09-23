# Une seule connexion pour toutes les applications Finjaro — le plan

Beau, 23/09 : « une seule connexion pour toutes les applications Finjaro,
oui ». Ce fichier est la proposition, à relire avec Claudinette (Accounting)
avant de coder : les deux applications sont touchées.

## Ce qui est déjà vrai

- Un seul projet Supabase, un seul `auth.users` : **le même e-mail et le
  même mot de passe ouvrent finjaro.net, accounting.finjaro.net et la
  console**. Personne n'a deux comptes.
- Ce qui manque : la **session**. Chaque adresse garde la sienne dans son
  propre navigateur (le stockage est par domaine, c'est le navigateur qui le
  veut). Passer de finjaro.net à Accounting demande donc de se reconnecter,
  même si c'est le même compte.

## La proposition : un passage de relais, une seule fois, sans mot de passe

1. Dans l'application de départ (par exemple le sélecteur d'applications de
   finjaro.net), au moment de toucher « Accounting », on demande au serveur
   **un code à usage unique** (fonction edge `sso-relais`, appelée avec la
   session courante). Le serveur range le code dans une table
   `sso_relais` (code aléatoire, `user_id`, `expire_le` = maintenant + 60 s,
   `utilise_le` vide) et le renvoie.
2. On ouvre `https://accounting.finjaro.net/#/relais?code=…`.
3. À l'arrivée, Accounting appelle la même fonction avec le code. Le
   serveur vérifie : code connu, pas expiré, jamais utilisé ; il le marque
   utilisé et **fabrique une session pour cet utilisateur** (lien magique
   généré côté serveur avec `auth.admin.generateLink`, puis `verifyOtp` —
   aucun e-mail n'est envoyé) et renvoie les jetons. Accounting fait
   `supabase.auth.setSession(...)` : la personne est connectée, sur la page
   qu'elle voulait.
4. Dans l'autre sens, pareil : Accounting → finjaro.net.

## Pourquoi comme ça

- **Rien de secret ne passe dans l'adresse** : le code ne vaut qu'une fois,
  60 secondes, et ne donne rien à qui n'a pas la fonction côté serveur.
- **Le Site URL de Supabase ne bouge pas** (règle du CLAUDE.md), les
  Redirect URLs non plus : on n'utilise pas les redirections d'auth.
- **Aucune migration risquée** : une table nouvelle, additive ; rien dans
  `auth.users`.
- Si le relais échoue (code expiré, réseau), l'application d'arrivée montre
  simplement son écran de connexion habituel : rien de pire qu'aujourd'hui.

## Ce que chaque côté fait

| Côté | Travail |
| --- | --- |
| Place de marché (moi) | migration `sso_relais` ; fonction edge `sso-relais` (les deux sens) ; le sélecteur d'applications demande un code avant d'ouvrir Accounting ; la page d'arrivée `/relais` sur finjaro.net |
| Accounting (Claudinette) | la page d'arrivée `#/relais` qui échange le code et pose la session ; le lien vers finjaro.net qui demande un code |

La fonction edge est commune (un seul projet Supabase) : je l'écris, elle
la relit avant que je la déploie, parce qu'un déploiement touche ses
utilisateurs aussi.

## Ce qui n'est PAS dans ce plan

- Pas de cookie partagé sur `*.finjaro.net` : la console et la préproduction
  sont sur `workers.dev`, et ça ne couvrirait pas les applications tierces.
- Pas de « déconnexion partout » dans un premier temps : se déconnecter
  d'une application ne ferme pas les autres (comme Google).

## Ordre

1. Claudinette relit ce fichier et dit ce qui la gêne.
2. Table + fonction (moi), relues par elle.
3. Sélecteur → Accounting d'abord (le chemin que Beau fait le plus), puis
   le retour.
