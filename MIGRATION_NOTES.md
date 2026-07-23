# Finjaro — Migration & deploy traps (learned the hard way)

> **Why this file exists** (Beau's idea): every deploy/migration trap we hit is
> written here so the next migration — or the "real" production rebuild — starts
> already knowing the pitfalls instead of rediscovering them live. Add to it
> whenever a new trap bites.

---

## 1. Netlify → Cloudflare (2026-07-23)

**Context:** Netlify free build credits ran out (~94% then blocked). Migrated the
static Vite SPA to Cloudflare. The site is served as a **Cloudflare Worker with
static assets** (the repo was connected via "Workers Builds", not "Pages").

### Trap A — `public/_redirects` breaks the Cloudflare deploy
- Netlify SPA fallback was `public/_redirects` = `/*  /index.html  200`.
- Cloudflare **rejects** it: `Invalid _redirects configuration … Infinite loop
  detected in this rule … [code: 100324]`. The build succeeds, all assets
  upload, then the **deploy** step fails at the very end.
- **Fix:** delete `public/_redirects`. On Cloudflare the SPA fallback is done by
  `wrangler.toml` → `[assets] not_found_handling = "single-page-application"`.

### Trap B — `npx wrangler deploy` needs an assets config
- The project's deploy command is `npx wrangler deploy`. With no config it errors
  asking for a `main` entrypoint or an `[assets]` directory.
- **Fix:** commit `wrangler.toml`:
  ```toml
  name = "henribeaubayemi"
  compatibility_date = "2026-07-23"
  [assets]
  directory = "./dist"
  not_found_handling = "single-page-application"
  ```

### Trap C ⚠️ (the big one) — Cloudflare "Variables and secrets" are RUNTIME, not BUILD-time
- Vite inlines `VITE_*` env vars into the JS **at build time** (`npm run build`).
- The vars added in the Cloudflare dashboard under **Settings → Variables and
  secrets** are **Worker runtime** vars. For a static SPA they never reach the
  built JS. So the build ran with **empty** `VITE_SUPABASE_URL/ANON_KEY`.
- Symptom: the app shell loads (bundled assets, local category images show) but
  **every Supabase call fails** — "Impossible de charger les produits" —
  consistently, on every device/network. `src/lib/supabase.js` had a
  `createClient(url || 'http://localhost', …)` fallback, so requests silently
  went to `http://localhost`.
- **Fix (robust):** the Supabase project URL + **publishable** anon key are
  public by design (they ship in every client bundle, protected by RLS), so we
  **hardcode them as defaults** in `src/lib/supabase.js` (env still overrides).
  Same for `VITE_VAPID_PUBLIC_KEY` (`lib/push.js`) and `VITE_STRIPE_PK`
  (`CheckoutCOD.jsx`). Now the app works regardless of host env config.
  - Alternative (if you prefer env-only): set them as **build variables** in the
    Cloudflare build settings, not runtime secrets.
  - **Never** hardcode secret keys this way (service_role, `sk_…`, VAPID private,
    webhook secrets) — those stay server-side only (Supabase `app_config` / edge
    secrets).

### Trap D — two URLs, testing the wrong one
- After migrating, `finjaro.netlify.app` **still resolves** but is frozen on an
  old build (Netlify deploys are dead). New work is only on
  `henribeaubayemi.henribayemi025.workers.dev`. Beau tested the old URL for a
  while and saw "nothing changed."
- **Fix / habit:** always confirm the live URL. Verify a deploy by the build
  stamp in **Réglages** (`__BUILD_ID__`, UTC timestamp) rather than by feel.
  A PWA added to the home screen is pinned to the origin it was installed from —
  a new origin needs a fresh "Add to Home Screen".

---

## 2. Supabase notes / traps

- **Shared database.** The project `bokwivwizghdlaedczbw` also contains a *second
  app's* tables (`budget_entries`, `business_debts`, `demandes_service`,
  `directory_listings`, …). Only ever touch Finjaro's tables. For a clean
  production launch, consider a **dedicated Supabase project** for Finjaro.
- **Edge-function secrets are project-wide.** A new function (e.g.
  `vendor-copilot`) inherits `GEMINI_API_KEY` set for `finou-chat` — no need to
  re-set it. But secrets **can't be set via MCP**; set them in the dashboard or
  store non-secret config in the private `app_config` table.
- **RLS `initplan` performance.** 67 policies call `auth.uid()` per-row. At scale
  wrap as `(select auth.uid())` so it's evaluated once. (Not yet done — big,
  security-sensitive change; do it deliberately before heavy traffic.)
- **Indexes for scale.** Hot buyer queries (`products` by `is_active/views/
  category/shop_id/name`, `shops` by `status/followers_count/country/name`) got
  covering + trigram indexes in migration `0012`. Add indexes for any new hot
  query BEFORE the table grows large.
- **Apply migrations two ways:** commit the numbered SQL in
  `supabase/migrations/000X_*.sql` **and** apply it to the live project (via MCP
  `apply_migration`). Beau doesn't run SQL by hand.

---

## 3. Vite / PWA build gotchas

- **Env vars must exist at build time**, not runtime (see Trap C). Anything the
  browser needs must be a `VITE_*` build var or a hardcoded public default.
- **Service worker cache.** `public/sw.js` is network-first for navigations +
  `skipWaiting`/`clients.claim`; `main.jsx` reloads once on a new controller. If
  a user is "stuck" on an old build, a reload (or reopening the PWA) fixes it —
  no reinstall needed. Bump `SHELL_CACHE` to force an immediate refresh.
- **react-leaflet version pin.** v5 needs React 19; we're on React 18 → use
  `react-leaflet@4`. Leaflet default marker icons break under Vite → use a
  `divIcon` (we ship a branded teal SVG pin).

---

## 4. Checklist for the NEXT migration / prod rebuild
1. Confirm where `VITE_*` env is injected — **build**, not runtime. Test by
   grepping the built bundle for the Supabase URL.
2. SPA fallback: use the host's native mechanism (`not_found_handling`,
   framework preset) — don't carry `_redirects`/`netlify.toml` across hosts.
3. Keep public keys as safe code defaults; keep secret keys server-side only.
4. Point users at ONE canonical URL; verify deploys by build stamp.
5. Give Finjaro its own Supabase project; port migrations `0001…` in order.
6. Add indexes + fix RLS `initplan` before real traffic.
