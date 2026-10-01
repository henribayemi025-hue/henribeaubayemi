# Audit complet — Finjaro Accounting — 01/10

Demandé par Beau le 01/10 (« fais pour Accounting le même audit que pour la
place de marché »). Fait par Alpha **en lecture seule** : rien n'a été modifié
dans le dépôt d'Accounting ni dans ses tables. Les corrections reviennent à
Claudinette (session Accounting), lot par lot, après accord de Beau pour ce qui
touche la base commune.

Périmètre : dépôt `henribayemi025-hue/Automatisation-des-candidatures`
(337b7f8), site https://accounting.finjaro.net, Worker `/api/*`, fonctions edge
`accounting-rappels` et `accounting-inscription-tel`, tables `finia_*` de la
base commune `bokwivwizghdlaedczbw`.

## 1. Ce qui va bien (mesuré)

- **Les 36 écrans** du mode démonstration, au téléphone (390 px) et sur grand
  écran (1440 px) : aucune erreur de code, aucun débordement, aucun appel réseau
  en échec, aucun « undefined », aucun mot qui enferme l'application dans un
  pays. La démonstration ne fait aucun appel à la base (étanche).
- **Compilation** sans erreur ; aucun secret dans le code (recherche de clés
  Supabase, Google, Stripe, Resend : rien).
- **L'assistant** (`/api/assistant`) refuse les visiteurs sans compte (401
  vérifié) ; la clé Gemini reste côté serveur.
- **Tables `finia_*`** : RLS activée partout ; un visiteur sans compte ne lit
  rien ; `finia_fx_rates` et `finia_liaison_log` n'ont aucune règle (donc
  fermées à tout sauf au serveur) ; la garde contre la réactivation d'un
  membre retiré (M-6, appliquée le 01/10) est en place.
- **Inscription par téléphone** limitée à 5 par heure et par connexion.
- Pas de HTML injecté (`innerHTML`, `dangerouslySetInnerHTML`) ; aucun
  `console.log` oublié.

## 2. Inventaire des problèmes

Sévérité : **C** critique (à corriger maintenant), **M** majeur, **m** mineur.

| N° | Où | Problème | Proposition |
|---|---|---|---|
| A-M1 | `finia_is_member`, `finia_role_of`, règles `finia_members_select` / `self_accept` | **L'accès à une entreprise se donne par simple correspondance d'adresse e-mail**, et l'invitation est **active tout de suite**. Or **22 comptes** du projet commun ont une adresse **jamais confirmée** et se sont déjà connectés (créés avant l'obligation de confirmation du 29/09). Si une propriétaire invite une adresse qu'un autre a réservée sans la prouver, cet autre entre dans sa comptabilité. Peu probable, mais l'enjeu est la comptabilité entière. | Ne reconnaître l'adresse que si elle est **confirmée** (`auth.users.email_confirmed_at` lu dans la fonction, déjà SECURITY DEFINER), et rattacher `user_id` à la première connexion. Migration additive, base commune → accord de Beau. |
| A-M2 | `accounting-inscription-tel` | **Un numéro de téléphone devient un compte confirmé sans aucune preuve** (pas de code SMS). N'importe qui peut réserver le numéro d'une autre personne avant elle. Aujourd'hui l'écran d'invitation n'accepte qu'un e-mail, donc pas d'accès à une entreprise par ce biais ; le jour où l'on inviterait par numéro, ce serait critique. CORS : toute adresse `*.workers.dev` est acceptée. | Code SMS à l'inscription (Supabase Phone Auth ou un fournisseur : **coût → décision de Beau**) ; en attendant, ne jamais inviter par numéro et le dire dans le code ; CORS limité aux adresses Finjaro. |
| A-M3 | `src/worker.js` (`rateLimited`, `handleAssistant`) | **Limite de l'assistant gardée en mémoire** (« par isolat ») : chaque copie du Worker a la sienne, donc pratiquement pas de limite. Le **contexte envoyé** et les **6 photos** par message n'ont pas de taille maximale : un compte peut faire gonfler la facture Gemini. | Compteur en base (`check_rate_limit`, déjà utilisé par l'inscription) ; taille maximale du contexte (ex. 20 000 caractères) et des photos (ex. 4 Mo chacune). |
| A-M4 | accounting.finjaro.net (aucun `public/_headers`) | **Aucun en-tête de sécurité** : ni HSTS, ni `X-Content-Type-Options`, ni `Referrer-Policy`, ni protection contre l'encadrement (`frame-ancestors`). Une application de comptabilité peut être affichée dans le cadre d'un autre site (détournement de clic). | `public/_headers` comme la place de marché (M-1, en ligne depuis le 01/10) : mêmes 4 en-têtes. |
| A-M5 | `package.json` : `xlsx` 0.18.5 | **Faille élevée** (pollution de prototype, déni de service) à la lecture d'un fichier Excel piégé ; **aucune correction sur npm**. L'import de fichiers par les utilisatrices passe par là. | Passer à la version officielle de SheetJS (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), qui corrige les deux. |
| A-M6 | `react-router-dom` 6.26 | Redirection ouverte (même faille que la place de marché, corrigée là le 01/10). | `react-router-dom` 7.18.4, puis parcours des 36 écrans. |
| A-M7 | Application entière | **Aucun moyen de demander la suppression de son compte, aucun lien vers la politique de confidentialité** (RGPD ; exigé aussi par les magasins d'applications si Accounting y va). Le compte est commun avec finjaro.net. | Dans Paramètres : liens vers https://finjaro.net/suppression-compte et https://finjaro.net/legal/confidentialite (déjà publics), ou pages propres à Accounting. |
| A-m1 | `/api/health` | Adresse **publique** qui donne le **nom** des variables du Worker (pas leurs valeurs) : aujourd'hui `GEMINI_API_KEY`. | Ne renvoyer que `ok` et `ai: true/false`. |
| A-m2 | `src/worker.js` (`callGemini`) | La clé Gemini part **dans l'adresse** (`?key=`), qui peut finir dans des journaux. | En-tête `x-goog-api-key`, comme les fonctions de la place de marché. |
| A-m3 | `src/worker.js` (`geminiKey`, `deepseekKey`) | Si `GEMINI_API_KEY` manque, le Worker prend **n'importe quelle variable** dont le nom contient « ia », « ai », « api_key »… et l'envoie à Google comme clé : une autre clé secrète pourrait partir chez Google. | Ne lire que `GEMINI_API_KEY` et `DEEPSEEK_API_KEY`. |
| A-m4 | `TabBar` (téléphone) | Les 3 à 4 onglets inactifs n'ont **aucun nom** pour un lecteur d'écran (même défaut que la place de marché, corrigé là par `aria-label`). | `aria-label` sur chaque onglet. |
| A-m5 | Route `*` | Une adresse inconnue renvoie à l'accueil sans rien dire. | Un court message « Page introuvable » avec un lien vers l'accueil. |
| A-m6 | `lancer_accounting_rappels`, `lancer_finia_apprentissage` | Lisent encore les jetons en clair dans `app_secrets` (la place de marché est passée au coffre le 01/10). | `jeton := public.app_secret('…');` (message déjà envoyé à Claudinette). |

## 3. Lots proposés

| Lot | Contenu | Base commune ? | Qui |
|---|---|---|---|
| A1 — Sécurité | A-M1 (adresse confirmée), A-M3 (limites de l'assistant), A-M4 (en-têtes), A-m1, A-m2, A-m3 | A-M1 oui → accord de Beau | Claudinette (code) ; Alpha relit et applique la migration |
| A2 — Dépendances | A-M5 (xlsx officiel), A-M6 (react-router 7.18.4) | non | Claudinette |
| A3 — Conformité et numéro | A-M7 (suppression, confidentialité), A-M2 (code SMS : coût) | A-M2 : décision de Beau | Claudinette, après Beau |
| A4 — Finitions | A-m4, A-m5, A-m6 | A-m6 oui (fonctions SQL) | Claudinette |

Chaque lot se termine par la même preuve que pour la place de marché :
compilation, parcours des 36 écrans à 390 et 1440 px, et pour la base un essai
en rôle visiteur et en rôle membre.
