# Audit de sécurité Finjaro — 28 juillet 2026

Audit de la base Supabase `finjaro` (`bokwivwizghdlaedczbw`) et des edge
functions. Chaque faille listée comme corrigée a été **rejouée en attaque après
correction** pour vérifier qu'elle ne passe plus.

---

## CORRIGÉ — critique

### 1. Élévation de privilège : n'importe qui pouvait devenir administrateur
`profiles` portait la policy `own profile` en `FOR ALL USING (auth.uid() = id)`.
Or `profiles.is_admin` est une colonne ordinaire de cette même ligne, et
`is_admin()` la lit pour décider des droits. Un utilisateur connecté n'avait donc
qu'à écrire sur sa propre ligne :

```sql
update profiles set is_admin = true where id = auth.uid();
```

Il obtenait alors l'accès admin complet : lecture de **toutes** les commandes de
la plateforme (`orders_read` fait confiance à `is_admin()`), la console
`/admin`, et les coûts IA. Les mêmes droits permettaient de se dé-suspendre
(`is_suspended`) et de remettre son `report_count` à zéro pour effacer les
signalements reçus.

**Correctif** — trigger `protect_profile_privileges` (migration 0010) qui
restaure de force `is_admin`, `is_suspended`, `report_count`, `referral_code`,
`referred_by` et `id` à leur ancienne valeur. Seule la `service_role` (back-office)
peut encore les modifier. **Vérifié** : l'UPDATE d'attaque s'exécute sans erreur
mais `is_admin` reste `false`.

### 2. Abonnements push de tous les utilisateurs exposés
`push_subscriptions` avait trois bonnes policies par utilisateur… plus une
quatrième, `Gérer ses propres abonnements push`, en `FOR ALL USING (true) WITH
CHECK (true)`. Les policies permissives s'additionnent en OR : cette dernière
annulait les trois autres. N'importe qui pouvait lire les endpoints push de tout
le monde (et donc leur envoyer des notifications) ou les supprimer.

**Correctif** — policy fourre-tout supprimée (0010). Les trois policies
par-utilisateur suffisent.

---

## CORRIGÉ — élevé

### 3. Déni de service ciblé sur le Miroir IA
`events` acceptait `WITH CHECK (true)` : on pouvait insérer des lignes avec le
`user_id` de quelqu'un d'autre. Le quota quotidien du Miroir IA se compte
précisément en lisant cette table — cinq insertions bien choisies et la victime
était privée d'essayage virtuel pour la journée.

**Correctif** — `WITH CHECK (user_id is null or user_id = auth.uid())` (0010).
Le `null` reste autorisé pour le suivi des visiteurs non connectés.
**Vérifié** : l'insertion au nom d'un tiers n'écrit plus rien.

### 4. Tables héritées ouvertes aux anonymes
`messages`, `follows`, `commentaires`, `demandes_service`, `offres_service`
viennent d'un ancien prototype et ne sont plus utilisées par l'application
(qui emploie `chat_messages`, `shop_follows`, `reel_comments`). Elles restaient
en écriture libre pour `anon` : insertion illimitée (gonflement de la base),
suppression du contenu d'autrui, et lecture publique de `messages`.

**Correctif** — policies réécrites en propriétaire-seulement / connecté-seulement
(0010). Les tables sont conservées, mais inertes pour un attaquant.

### 5. Budget Gemini exposé sans limite
`finou-chat` ne vérifiait ni l'identité ni aucun quota. Un script pouvait la
marteler et consommer le budget IA mensuel de Finjaro (plafond 20 €) en quelques
minutes, mettant Finou **et** le Miroir IA en pause pour tout le mois.

**Correctif** — table `rate_limits` + fonction `check_rate_limit` (0010),
branchées dans les deux fonctions : 20 messages / 5 min par compte, 6 / 5 min par
IP anonyme, 3 générations Miroir / 5 min. Les visiteurs gardent l'accès à Finou
(c'est un levier de conversion), simplement avec un quota plus serré.

### 6. CORS ouvert à tous les domaines
`miroir-ia` et `finou-chat` renvoyaient `Access-Control-Allow-Origin: *`.
N'importe quel site tiers pouvait appeler ces fonctions depuis le navigateur d'un
utilisateur Finjaro connecté.

**Correctif** — liste blanche (production + localhost) et en-tête `Vary: Origin`.

### 7. Fonctions internes appelables via l'API REST
`award_seller_points`, `rls_auto_enable`, `notify_new_message`, `on_reel_comment`
et les `add_*_owner` étaient exécutables par `anon` via `/rest/v1/rpc/…`.
**Correctif** — `EXECUTE` révoqué (0010). `search_path` figé sur
`notify_new_message` et `similar_products`.

### 8. Énumération du bucket Storage `photos`
Une policy `SELECT` large sur `storage.objects` permettait de lister tous les
fichiers du bucket public `photos` (hérité, inutilisé par Finjaro).
**Correctif** — policy retirée (0011). Les URLs publiques continuent de servir
les images ; seule l'énumération est coupée.

---

## RESTE À FAIRE

| Point | Gravité | Action |
|---|---|---|
| Protection des mots de passe compromis désactivée | Moyen | À activer dans le dashboard Supabase → Auth → Password security (vérification HaveIBeenPwned). Non modifiable par migration. |
| `profiles.phone` lisible par tout compte connecté | Moyen | La policy `profiles_read` est `USING (true)` pour `authenticated`, parce que l'app affiche le nom des auteurs de commentaires. La colonne `phone` n'est aujourd'hui ni écrite ni lue par l'application, donc la fuite est théorique — mais avant de collecter des téléphones il faudra une vue `public_profiles` (id, name, avatar_url) et restreindre la table de base au propriétaire. |
| Pas de 2FA | Moyen | Supabase MFA (TOTP) disponible, à câbler côté écran de connexion. |
| Pas de journal d'audit | Faible | Tracer les connexions et les événements de paiement. |
| `is_admin()`, `owns_shop()`, `in_conversation()` appelables par `anon` | Info | Volontaire : ce sont les fonctions d'aide des policies RLS, elles ne renvoient que des informations sur l'appelant lui-même. |
| `pg_net`, `pg_trgm` dans le schéma `public` | Info | Cosmétique. |

---

## Bug corrigé au passage : Miroir IA (502 en boucle)

Cause racine, confirmée par l'appel réel à l'API : l'API REST Gemini v1beta
**accepte** le `snake_case` en entrée mais **répond** en `camelCase`. Le code
cherchait l'image dans `part.inline_data`, alors qu'elle arrive dans
`part.inlineData`.

L'image était donc générée **à chaque appel** — et facturée par Google — puis
jetée par notre propre code, qui répondait « Aucune image générée » en 502.

Preuve obtenue sur un essayage réel à deux images :

```
tryOn_finishReason : "STOP"          (aucun refus de sécurité)
tryOn_HAS_IMAGE    : true            (877 Ko de JPEG)
oldCodeWouldFind   : false           (ce que l'ancien code trouvait)
```

Corrections apportées à `miroir-ia` :
- lecture des deux formes, `inlineData` et `inline_data` ;
- chaîne de repli `gemini-3.1-flash-image` → `gemini-2.5-flash-image`, avec une
  nouvelle tentative sur le même modèle en cas de 5xx (un 503 « high demand » a
  été observé en direct pendant les tests) ;
- délais bornés (40 s par appel Gemini, 8 s pour la photo produit) : les workers
  mouraient auparavant vers 150 s en statut 546 ;
- conversion base64 par blocs — la boucle caractère par caractère était en O(n²)
  et faisait exploser le temps CPU sur une photo produit un peu lourde ;
- taille des images plafonnée en entrée ;
- la vraie raison du refus (texte de Gemini, `finishReason`, `blockReason`) est
  désormais remontée au lieu d'un message générique.

## Finou Chou v2 — outils

Finou dispose maintenant d'outils (function calling) et interroge réellement la
base au lieu de deviner : `search_products`, `get_trending_products`,
`get_my_orders`, `get_my_shop_stats`, `find_shops`.

Point de sécurité important : **les outils s'exécutent avec le JWT de
l'utilisateur**, jamais avec la `service_role`. Les RLS s'appliquent donc telles
quelles — même si le modèle demandait les commandes d'un autre compte, Postgres
ne les renverrait pas. Les outils personnels sont refusés d'emblée aux invités.

Vérifié en conditions réelles :
- « Vous avez quoi comme parfums ? » → 4 produits cités, **4 prix exacts**
  correspondant à la base, aucune invention ;
- même question posée par un visiteur non connecté sur ses commandes → refus poli
  et bouton de connexion (`ACTION: login`), aucune donnée personnelle.

Un défaut a été trouvé et corrigé pendant les tests : le modèle était choisi à
chaque tour de boucle, or les `thoughtSignature` d'un modèle sont rejetées par un
autre. Quand `gemini-3.5-flash` renvoyait 503, le second tour échouait et Finou
répondait « je regarde ça pour vous » sans jamais exploiter le résultat de
l'outil. Le modèle est désormais fixé pour toute la conversation.
