# Mémoire d'Alpha — à lire pour reprendre le travail sans rien redemander

_Dernière mise à jour: 18/09/2026._

Ce fichier existe pour une raison précise: les conversations finissent par
être trop longues et sont coupées. Quand ça arrive, la session suivante
repart à zéro et Beau doit tout réexpliquer — ce qu'il n'a pas le temps de
faire. Ce document remplace cette réexplication.

**Si tu es une nouvelle session qui lit ceci: tu es « Alpha ».** Lis
`CLAUDE.md` d'abord (les règles), puis ce fichier (l'état réel). Après ça tu
peux reprendre sans poser de question.

> ⚠️ **Le dépôt est PUBLIC.** Aucun nom de personne, e-mail, téléphone ou
> adresse ne doit apparaître ici. La liste de prospection vit dans la table
> Supabase `prospects`, pas dans Git. Cette règle vaut aussi pour les tickets
> GitHub.

---

## 1. Qui est qui

| Nom | Ce que c'est | Où |
| --- | --- | --- |
| **Beau** | Le fondateur. Francophone, ne code pas, emploi à côté, dicte à la voix. | — |
| **Alpha** | Moi. La session qui travaille sur la place de marché. | dépôt `henribeaubayemi` |
| **Claudinette** | La session qui travaille sur Finjaro Accounting. | dépôt `Automatisation-des-candidatures` |
| **Les « PNJ »** | Des Claude dans Chrome, pilotés à la main par Beau, qui vont chercher des commerçants sur Google Maps / Facebook. | navigateur |

### Comment parler à Beau

- **Court.** Il l'a redemandé trois fois: « sois bref », « je n'ai rien
  compris ». Une réponse de dix lignes est déjà trop longue.
- **Lire l'intention, pas la lettre.** Ses messages arrivent déformés par la
  dictée vocale. « aloz pas besoind e me demander » = « allez-y, pas besoin
  de me demander ».
- **Ne jamais lui annoncer qu'une chose est faite si elle ne l'est pas.**
  C'est la faute qui lui coûte le plus cher.
- Quand il parle de design, il parle de **détails** (icône, couleur,
  libellé), presque jamais d'une refonte.

---

## 2. L'état réel du produit (chiffres mesurés le 18/09/2026)

Aucun de ces chiffres n'est inventé. Ils viennent de requêtes sur la base.

- **60 boutiques actives**, dont **41 ont au moins un article** → **19 sont
  vides**. C'est la plus grosse fuite du tunnel: une boutique vide
  n'apparaît dans aucune recherche, donc la vendeuse conclut que Finjaro ne
  sert à rien.
- Journée du 18/09: 25 visites, 7 fiches produit vues, 1 ajout au panier,
  **0 commande**, 2 inscriptions, 1 boutique créée, 10 articles publiés (tous
  par une seule boutique de Yaoundé, entre 09h30 et 11h40, tous avec un prix).
- `contact_intent` **total: 0**. Personne n'a jamais cliqué pour contacter
  une vendeuse.
- Stockage Supabase: **528 Mo sur 1 Go (51,6 %)**, dont ~262 Mo de fichiers
  orphelins. ⚠️ **Rien n'a été supprimé — Beau n'a pas donné son accord.**

**Ce qui marche vraiment aujourd'hui: les inscriptions.** C'est tout. C'est
exactement ce qu'il ne faut pas casser (voir le Site URL dans `CLAUDE.md`).

---

## 3. Ce qui a été construit récemment

### 3.1 Console — publier un article à la place d'une boutique

Le problème: une vendeuse envoie ses photos sur WhatsApp et attend. Personne
ne pouvait les mettre en ligne pour elle — `products` n'avait aucune règle
d'insertion pour l'équipe.

- `supabase/migrations/0131_publier_pour_une_boutique.sql` — fonction
  `admin_publier_article()` en `security definer`. Une fonction plutôt
  qu'une règle RLS: elle ne fait qu'une chose, vérifie qui appelle, refuse
  une boutique inexistante ou fermée, et refuse un article sans prix qui
  n'est pas marqué « prix sur demande ». **Appliquée sur le projet de test
  ET sur la production.**
- `src/screens/admin/AdminPublier.jsx` — l'écran. Les boutiques vides sont
  triées en premier avec un badge « Vide ». Les photos partent dans
  `${user.id}/${uuid}.${ext}` (+ `_thumb`), parce que la règle de stockage
  exige `foldername[1] = auth.uid()`. **Le prix se saisit dans la devise de
  la boutique** (`currencyForCountry(shop.country)`), pas dans celle de
  l'admin — voir le §2 de `CLAUDE.md`.
- `src/screens/AdminDashboard.jsx` — l'entrée « Publier », placée juste
  après « Boutiques »: c'est de là qu'on part quand on voit une boutique vide.
- Traductions `admin.publier.*` en fr et en.

### 3.2 Panier — articles « prix sur demande »

Ils étaient affichés à 0, donc gratuits. Le sous-total ne compte plus que ce
dont on connaît le prix (`src/hooks/useCart.jsx`).

### 3.3 Autres

- RLS posée sur les deux tables de liaison qui n'en avaient pas.
- Mesure: les repères qui étaient rejetés en silence sont maintenant visibles.
- `docs/PROMPTS-TROUVER-DES-VENDEURS.md` — les prompts à coller dans le
  Claude de Chrome.

---

## 4. La prospection — tout ce qu'on a appris, y compris mes erreurs

### 4.1 Ce qui NE marche pas (vérifié, pas supposé)

- **WhatsApp Business API: inutilisable pour du démarchage à froid.** Je
  l'avais d'abord annoncé à Beau comme la solution — **c'était faux**, et je
  me suis corrigé avant qu'il perde une semaine en vérification Meta. La
  politique de Meta impose un consentement préalable (opt-in). On ne peut
  donc écrire qu'à quelqu'un qui a déjà écrit.
- **Facebook Marketplace: aucune API.** C'est un bon canal pour la qualité
  des contacts, mais à la main uniquement.
- **5000 e-mails par jour: non.** Beau l'a demandé. Envoyer ça depuis
  `finjaro.net` brûlerait la réputation du domaine et les e-mails de
  confirmation d'inscription partiraient en spam — c'est-à-dire qu'on
  casserait la seule chose qui fonctionne. La montée doit se faire sur ~6
  semaines (30 → 80 → 200 → 400/jour), depuis un **domaine séparé**.

### 4.2 Ce qui marche

L'e-mail est le seul canal automatisable. Circuit en place:

1. Un PNJ Claude dans Chrome cherche sur Google Maps et rend un tableau.
2. Beau me colle le tableau.
3. Je range dans la table `prospects` (Supabase, privée).
4. J'envoie par e-mail, dans la langue du pays.

**Ciblage:** des prestataires de services (coiffure, plomberie, couture,
traiteur…) en Europe. Le ciblage se fait sur **ce que le commerce dit de
lui-même** (« salon afro », « tresses ») — jamais sur une origine supposée.
C'est plus juste et ça évite la catégorie de données sensibles du RGPD.
**Le mot « diaspora » n'apparaît jamais dans un texte visible** (`CLAUDE.md` §1).

**Densité — le point qu'on oublie:** Finjaro est en paiement à la livraison.
Acheteur et vendeur doivent être dans la même ville. Recruter des vendeurs
là où il n'y a aucun acheteur ne fait que fabriquer des boutiques vides.

### 4.3 La table `prospects`

Créée directement en production (migration `prospects_vendeurs`), pas en
fichier dans le dépôt, parce qu'elle contient des données personnelles.

```sql
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  nom text not null, metier text, ville text, pays text,
  email text, telephone text, site text, langue text,
  source text default 'google_maps',
  contacte_at timestamptz, reponse text,
  cree_at timestamptz not null default now()
);
-- + index unique sur lower(email), index ville, index « à contacter »
-- + row level security activée
```

État au 18/09: **30 lignes**, 15 avec e-mail, 11 marquées contactées, 2
marquées « adresse morte (rebond) » → **9 réellement délivrés**. 15 n'ont
qu'un téléphone. 4 envois restent bloqués côté outil et attendent que Beau
les envoie à la main.

### 4.4 Le message

Beau a rejeté la première version (« je m'appelle Henri Beau, je construis
Finjaro… Finjaro est jeune ») — ça faisait amateur. Version retenue:

- **Voix d'équipe**, pas de nom personnel: « nous faisons partie de Finjaro ».
- On dit qu'on a vu ses articles et qu'on les a aimés.
- On mentionne **Finjaro Accounting** (gestion des stocks) en plus de la
  place de marché.
- **Ne plus jamais promettre « on publie vos premiers articles à votre
  place ».** Beau l'a retiré explicitement, et les PNJ ont été prévenus.
- Jamais « marketplace camerounaise ». J'ai trouvé cette formule dans une
  de mes propres routines et je l'ai corrigée.

### 4.5 Le prompt Google Maps (celui que Beau redemande souvent)

Il est dans `docs/PROMPTS-TROUVER-DES-VENDEURS.md`. C'est là qu'il faut
aller le chercher plutôt que de le réinventer.

---

## 5. Le canal Alpha ↔ Claudinette ↔ PNJ

Beau voulait « le genre de notif que quand l'un reçoit, l'autre répond ».

### 5.1 Comment on s'écrit, concrètement

Session de Claudinette: `session_01Gjs9i62dyinT13eeFbd7Xh`.
Ma session (Alpha) au moment d'écrire: `session_015PBwRnLtCjPX8zj12rkDdQ`.

Pour lui envoyer un message: `create_trigger` avec
`persistent_session_id = <sa session>`, **sans cron**, `initiation:
human_request`, puis `fire_trigger`. Le message arrive chez elle comme un
tour utilisateur.

### 5.2 Le défaut trouvé, et sa correction

Les notifications partent quand l'autre **écrit**. Elles ne partent pas
quand l'autre **travaille en silence** — c'est pour ça que Beau a eu
l'impression qu'on ne se parlait plus alors que Claudinette poussait du code.

Correction: une routine toutes les 2 heures
(`trig_011H8QSLiZfoB4m1uWT46S4G`, `40 */2 * * *`) qui va voir ce que l'autre
a fait et répond, même sans message.

Autres routines vivantes:
- `trig_01H2EhMEzGNcHJ27ZJg6UwoJ` — veille, 5×/jour (c'est celle où j'ai
  trouvé et corrigé « marketplace camerounaise »).

### 5.3 La salle commune

**Ticket GitHub #16**, « Salle commune — Alpha, Claudinette et les Claude de
Chrome ». Protocole d'en-tête: `[QUI] / [POUR] / [QUOI]`. C'est là qu'on
annonce ce qui change pour les autres (par exemple: le retrait de la
promesse de publication).

⚠️ Le ticket est public comme le dépôt: pas de coordonnées dedans.

### 5.4 Ce que Claudinette a fait le 18/09

Quatre commits côté Accounting: quatre manques par métier (un plat qui ne
consomme pas ses ingrédients, un salon sans rendez-vous, une pharmacie sans
lots ni péremption, un ordre de réparation garage à vérifier), et le chiffre
d'affaires d'un abonnement payé d'avance qui suit désormais les mois servis.

---

## 6. Les refus — ce que j'ai refusé de faire, et pourquoi

C'est important pour une nouvelle session: ces refus sont des décisions, pas
des blocages à contourner.

- **Envoyer du démarchage depuis l'adresse Gmail personnelle de Beau.** Le
  connecteur pointait dessus. Refusé. Les envois se font depuis l'adresse de
  Finjaro.
- **Mettre 30 noms et e-mails dans le dépôt.** Le dépôt est public. Redirigé
  vers Supabase.
- **M'écrire moi-même mes propres permissions** (`.claude/settings.local.json`).
  Bloqué par l'outil, et c'était juste: un assistant ne s'accorde pas ses
  propres droits.
- **Contourner les 4 envois d'e-mails bloqués.** Je n'ai pas cherché de
  détour; j'ai donné les textes à Beau pour qu'il les envoie.
- **Supprimer les 262 Mo de fichiers orphelins.** Attend son accord explicite.

---

## 7. Comment on met en ligne

- On travaille sur **`staging`** → https://staging-finjaro.finjaro.workers.dev
- Production: **`claude/finjaro-marketplace-build-xsripr`** → https://finjaro.net
- **Cloudflare déploie tout seul** à chaque poussée. Une CI GitHub verte ne
  prouve **pas** qu'une version est en ligne — il faut aller vérifier.
- Les applis Android et iOS chargent `https://finjaro.net`: une mise en
  ligne atteint les utilisateurs sans repasser par les magasins.

Passage en production (le motif exact utilisé):

```
git checkout -B prod-tmp origin/claude/finjaro-marketplace-build-xsripr
git merge staging --no-edit
npx vitest run && npm run build
git push origin prod-tmp:claude/finjaro-marketplace-build-xsripr
git checkout staging && git branch -D prod-tmp
```

**Jamais de pull request sans que Beau l'ait demandée.**

---

## 8. Ce qui reste à faire

Par ordre d'importance réelle, pas par numéro de ticket:

1. **Les 19 boutiques vides.** L'écran de publication existe maintenant —
   il faut l'utiliser, boutique par boutique.
2. **Comprendre pourquoi les acheteurs s'inscrivent et ne regardent rien.**
   7 fiches vues pour 25 visites, 0 commande, 0 intention de contact.
3. Vérifier que Cloudflare a bien mis l'écran de publication en ligne sur
   finjaro.net.
4. Les 4 e-mails bloqués — Beau les envoie à la main.
5. Nettoyage du stockage (262 Mo) — **après accord**.
6. Pourquoi 4 boutiques publient sans prix.
7. Guider les vendeuses sur la qualité des photos.
8. Retirer « camerounaise » d'App Store Connect.
9. Reconstruire l'Android pour le Play Store.
10. Mobile Money (MTN + Orange).
11. Vidéo de transformation d'une vendeuse.

---

## 9. Les contraintes qui ne se discutent pas

Elles sont dans `CLAUDE.md` en détail. Le rappel court:

- Finjaro est **mondiale**. Aucun texte visible ne l'enferme dans un pays.
  Aucune devise par défaut qui suppose un pays. Pas de « diaspora » en public.
- **Acheteur = sa monnaie à lui. Vendeur = la monnaie de sa boutique.**
- **Aucun chiffre inventé** nulle part de visible.
- **Migrations additives** uniquement. Le projet Supabase est partagé avec
  Accounting et deux ou trois applications tierces sur le même `auth.users`.
- **Les fonctions edge sont communes** à staging et production.
- **Le Site URL Supabase reste `https://finjaro.net`.** Jamais changé.
- Les essais se font sur le projet de test `qiyvoaljqmbfldephobp`.
- **Ne jamais dire à une vendeuse que personne ne regarde ses articles.**
- **Demander avant d'envoyer** quoi que ce soit à une vendeuse ou un
  utilisateur (sauf accord explicite déjà donné, comme pour la prospection).

---

_À la prochaine session: mets ce fichier à jour avant que la conversation
soit coupée, pas après. Après, il est trop tard._
