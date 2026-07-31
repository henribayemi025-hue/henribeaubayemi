# Finjaro — déploiement

**Hébergeur : Cloudflare Workers** (mode static assets). Domaine de production :
**https://finjaro.net**

Netlify a été abandonné le 2026-07-23 (crédits de build épuisés) et retiré du
dépôt le 2026-07-31 — voir `MIGRATION_NOTES.md` pour l'historique. Il ne reste
plus aucune configuration Netlify ici : `netlify.toml` est supprimé, et le
domaine `finjaro.netlify.app` a été retiré des origines CORS autorisées des
fonctions edge. **Ne rien y remettre.**

## Frontend

Configuration : `wrangler.toml`

```toml
name = "finjaro"
[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

`not_found_handling` renvoie `index.html` sur les routes inconnues : c'est ce
qui fait marcher les liens profonds (`/boutique/<slug>`, `/category/<id>`) au
lieu d'une page blanche.

En-têtes de cache : `public/_headers` (repris à l'identique de l'ancienne
config Netlify). `index.html`, `sw.js` et `manifest.webmanifest` sont
revalidés à chaque lancement — sans ça, un iPhone en « Sur l'écran d'accueil »
reste collé à un vieux `index.html` et ne voit jamais les mises à jour.
`/assets/*` est en cache immuable (les noms de fichiers sont hachés).

### Déployer

```bash
npm run build
npx wrangler deploy
```

Le dépôt ne contient **aucun workflow de déploiement** : `.github/workflows/ci.yml`
ne fait que compiler pour vérifier qu'une branche n'est pas cassée. La mise en
ligne est donc pilotée côté Cloudflare (connexion GitHub configurée dans le
tableau de bord Cloudflare, hors dépôt).

> **Attention — la branche surveillée par Cloudflare part directement en
> production.** Il n'y a pas d'étape de préproduction : ce qui est poussé sur
> cette branche est visible par les vraies utilisatrices. Pour tester avant, il
> faut créer une seconde branche et la déclarer comme branche de préversion
> dans le tableau de bord Cloudflare (Workers & Pages → finjaro → Settings →
> Build).

## Variables d'environnement

Côté client (visibles dans le bundle, c'est normal — ce sont des valeurs
publiables) :

| Clé | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | clé publiable Supabase |
| `VITE_VAPID_PUBLIC_KEY` | clé publique Web Push (facultatif tant que le push n'est pas activé) |

Les secrets serveur ne sont **jamais** dans le client : ils vivent dans les
secrets des fonctions edge Supabase (`GEMINI_API_KEY`, `VAPID_KEYS`,
`VAPID_SUBJECT`, `RESEND_API_KEY`).

## Base de données — Supabase

- **Production : `bokwivwizghdlaedczbw`** (https://bokwivwizghdlaedczbw.supabase.co)
- **Test : `qiyvoaljqmbfldephobp`** — même schéma, sert à valider une migration
  avant la production.

Les migrations sont dans `supabase/migrations/`, numérotées et **additives
uniquement** : jamais de suppression ni de renommage d'identifiant, pour qu'une
fiche existante ou un lien profond déjà partagé ne casse jamais.

Appliquer une migration : la passer d'abord sur le projet de test, vérifier,
puis sur la production. Les deux projets doivent rester au même niveau.

## Fonctions edge

Déployées sur Supabase : `finou-chat`, `finou-vision`, `miroir-ia`,
`send-push`, `vendor-copilot`, `create-checkout`, `send-email`.

Origines CORS autorisées (identiques dans toutes) : `finjaro.net` et ses
sous-domaines, `*.pages.dev` (préversions Cloudflare), `localhost`. C'est un
test sur le **hôte**, pas une liste d'URL figée — une liste en dur avait déjà
bloqué une fonction en production une fois.
