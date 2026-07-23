# Finjaro — AUDIT_REPORT (Phase 0)

_Date: 2026-07-23 · Branch: `claude/finjaro-marketplace-build-xsripr` · Auditor: autonomous tech-lead pass._

This is a **real** scan of the current tree (`src/`, `public/`, `sw.js`,
`package.json`, Supabase/Stripe config), not a generic checklist. The headline:
**the app is in much better shape than a blank-slate brief assumes.** Many items
in the mission brief are already implemented correctly; several others would
*regress* the app if executed literally. Both are documented below so we spend
effort only where it moves the product.

Severity legend: **BLOQUANT** (breaks a flow) · **GÊNANT** (works but sub-par) ·
**COSMÉTIQUE** (polish).

---

## A. Dead code / residue scan — result: essentially clean

| File:line | Finding | Severity | Verdict |
|---|---|---|---|
| `src/screens/buyer/NearYou.jsx:79` | `console.error` on failed query | — | **Keep** — legitimate error log, guarded |
| `src/lib/notify.js:11` | `console.debug` push-skip | — | **Keep** — intentional, guarded |
| `src/lib/supabase.js:9` | `console.warn` missing-env | — | **Keep** — deploy safety net |

No `TODO`/`FIXME`, no empty `onClick={() => {}}`, no `onClick={}`, no dead
`href="#"`, no hard-coded fake/lorem data found in `src/`. **Nothing to remove.**

## B. Brief items that are ALREADY DONE (do not redo)

| Brief item | Reality | Evidence |
|---|---|---|
| Chat bubble alignment (`sender_id === currentUser.id` → right) | Already implemented exactly this way | `VendorChat.jsx:160-162` (`const mine = m.sender_id === user.id` → `justify-end/start`) |
| Single icon system, no dual libs | Already `@tabler/icons-react` only; no `lucide` anywhere | `grep lucide` → none; `package.json` |
| SW `skipWaiting` + `clients.claim` + old-cache purge + network-first nav + don't intercept API | All present | `public/sw.js:12-43` (fetch handler `return`s early for non-`navigate`, so Supabase/Stripe pass through) |
| Auto-update without reinstall | Present: `controllerchange` reload + `reg.update()` on focus + 60s poll | `main.jsx:11-32` |
| Live search: debounce + in-place update + skeleton + 16px input + empty states | Present (300ms debounce) | `Search.jsx:54-62, 82, 90-97` |
| iOS keyboard: `--app-height`/`--kb`, fixed shell + keyboard padding, 16px inputs | Present | `hooks/useViewportHeight.js`, `BuyerLayout/VendorLayout`, `global.css` |
| Finou Vision (image → Gemini) + Reel comments + similar-products RPC + seller points | Present | edge `finou-chat` v2, `ReelCommentsSheet.jsx`, migrations 0008/0010 |
| Stripe checkout scaffolding (create-checkout + signed webhook, keys in `app_config`) | Present, TEST mode live | `supabase/functions/create-checkout`, `stripe-webhook`, migration 0011 |

## C. Brief items that would REGRESS the app — deliberately NOT done

| Brief instruction | Why it's wrong here | Decision |
|---|---|---|
| "Supprimer les assets médiocres dans `src/assets/categories/`" | The 14 `.webp` are the **live category banners** consumed by `src/lib/categories.js` and rendered on Home/CategoryStrip. Deleting them = broken images across the app. | **Keep.** They are intentional brand assets, not clutter. |
| "Remplacer les icônes par `lucide-react`" | App already standardises on `@tabler/icons-react`. Adding lucide = two libraries (the exact thing the brief forbids) + a large no-value diff. | **Keep tabler.** Requirement ("un seul système") already satisfied. |
| "Corriger l'alignement du chat" | Already correct via `sender_id`. | No change. |

## D. GENUINE gaps found (worth doing)

| # | Gap | File | Severity | Plan |
|---|---|---|---|---|
| D1 | No `_headers` for Cloudflare. Netlify's cache headers left with `netlify.toml`; Cloudflare needs its own so `sw.js`/`index.html` are never stale and `/assets/*` are immutable-cached. | `public/_headers` (missing) | GÊNANT | Add `_headers`. |
| D2 | SW has no `message` listener; can't trigger `SKIP_WAITING` from the client on demand (currently relies on install-time skipWaiting only). | `public/sw.js` | COSMÉTIQUE | Add `message` handler. |
| D3 | Live search doesn't cancel in-flight requests; a slow response can overwrite a newer one (result "jump"). | `Search.jsx` | GÊNANT | Add `AbortController` + ignore stale. |
| D4 | `netlify.toml` + `public/_redirects` are Netlify-specific leftovers now that we're on Cloudflare (SPA fallback is handled by `wrangler.toml` `not_found_handling`). | root | COSMÉTIQUE | Leave `_redirects` (harmless, ignored by CF Workers); note `netlify.toml` is dormant. |
| D5 | `@finou` mention inside buyer↔vendor DMs not yet wired (Finou only exists as the standalone overlay). | `VendorChat.jsx` | Feature | Backlog — needs the edge fn call in-thread; medium effort. |

## E. Large product-brief phases — status & what they need from Beau

These are real features, each a cycle on its own. None are blockers; they need a
working deploy first (in progress) and, for some, a product/API decision.

- **Near You map view (Leaflet)** — currently list-only with GPS distance sort.
  Map toggle = new dep (`react-leaflet`) + tiles. _Decision needed:_ OK to add
  Leaflet (free OSM tiles) vs. keep list-only? _(recommend: add Leaflet.)_
- **Profil refonte (cover + avatar overlay + stats grid + empty states)** —
  cosmetic/structural, no new API. Safe to do after deploy is green.
- **Mirror AI (virtual try-on)** — needs a provider + API key (Replicate/HF/Gradio)
  and a Supabase Storage retention policy. **BLOQUANT: clé API + budget à décider.**
- **Visual Search in Finou chat** — Finou already does vision; extend to query
  Supabase by extracted attributes. Feasible, no new key (reuses Gemini).
- **Copilot Vendeur (AI description+tags)** — new edge fn call from product form;
  reuses Gemini. Feasible.
- **Cart mini-drawer + optimistic add** — `useCart` exists; UI polish. Safe.

## F. Priority order (recommended)

1. **Unblock deploy** (wrangler.toml assets config) — _done, pushed._
2. **Phase 1 fondations:** D1 `_headers`, D2 SW message — _this pass._
3. **D3 search AbortController** — _this pass._
4. Profil refonte + Cart drawer (no API, no risk) — next.
5. Near You map — after Beau OKs Leaflet.
6. Copilot Vendeur + Visual Search (reuse Gemini) — after.
7. Mirror AI — once Beau picks a provider + budget.

## Points bloquants pour Beau
- **Mirror AI:** choisir un provider (Replicate/HuggingFace/Gradio) + valider le
  coût/quota. Sans ça, on ne peut pas l'implémenter proprement.
- **Near You carte:** OK pour ajouter Leaflet (tuiles OSM gratuites) ? (reco: oui)
- Tout le reste s'exécute sans décision de ta part.
