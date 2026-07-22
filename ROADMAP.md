# Finjaro — Roadmap & continuity notes

> **Purpose:** durable memory. If a session's chat context is lost, read this +
> the code and continue seamlessly. Founder = **Beau** (henribayemi025@gmail.com),
> non-technical; answer him in **French**, keep things simple, never leave a dead
> button, respect the "Lagune & Encre" design system, and always i18n FR+EN.

## Live facts
- **Live app:** https://finjaro.netlify.app
- **Repo:** `henribayemi025-hue/henribeaubayemi` — work on branch
  `claude/finjaro-marketplace-build-xsripr`, then fast-forward `main` and push.
- **Deploy:** GitHub Actions `.github/workflows/deploy.yml` builds + deploys to
  Netlify on push to `main` (secret `NETLIFY_AUTH_TOKEN` is set). A PR merged via
  the API does NOT trigger it — push to `main` from git does.
- **Netlify site id:** `7239e5ca-25b6-4b75-88c4-2adcf02a2d94` (team `IFnou`).
- **Supabase project:** `finjaro` = `bokwivwizghdlaedczbw` (URL
  https://bokwivwizghdlaedczbw.supabase.co). Migrations in `supabase/migrations`
  are **applied directly by the assistant via tooling** (Beau doesn't run SQL).
- **Edge functions:** `finou-chat` (Gemini 2.5 Flash, text), `send-push`
  (Web Push), `finou-vision` (stub — for the vision feature below).
- Stack: Vite + React + Tailwind, react-i18next, @tabler/icons-react.

## Done — Cycles 1→4
- **Cycle 1:** app-shell, 14 WebP category banners, global Search, Near You
  listings FK, floating-button anchoring, Messages nav tab, Help screen,
  self-service vendor activation, invisible `events` tracking. (migration 0007)
- **Cycle 2:** iOS keyboard handling v1, real reel comments (migration 0008),
  Finou/nav hidden in chat, removed emoji on Profile rows, 16px inputs.
- **Cycle 3 hotfix:** robust keyboard — `html/body/#root` locked (overflow
  hidden), every screen scrolls in its own container; Finou overlay + Modal +
  Auth + Landing keyboard-aware via `--app-height` (see `hooks/useViewportHeight`).
  Currency now follows the selected country.
- **Cycle 4 (lot 1):** vendors price in their **shop's own currency** (stored
  canonically in FCFA, converted via `toFcfa`/`convertFromFcfa` in
  `lib/currency.js`); can't message your own shop; realtime inbox; reel action
  buttons raised above the shop banner (z-order fix).

## Decisions locked with Beau
- **Vendor currency:** each vendor prices in their country's currency; buyers see
  it converted to theirs. (done)
- **Near You:** rebuild as a **GPS "around me"** search (locate vendors /
  prestataires + annonces by distance). (todo — Lot 2)
- **Delivery:** options **by country** — Cameroun = shop pickup + a short
  warning; Europe = delivery/shipping (Leboncoin-style). (todo — Lot 2)
- **Notifications:** make push **real** — generate VAPID keys, set `VAPID_KEYS`
  (Supabase secret) + `VITE_VAPID_PUBLIC_KEY` (Netlify). On iPhone the user must
  "Add to Home Screen" first (Apple limitation). (todo — Lot 2)

## Done — Cycle 5
- **Finou Vision** — `finou-chat` (v2) accepts an image (data URL) → Gemini 2.5
  Flash multimodal; returns a suggested category (trailing `CAT: <id>`). Finou
  overlay: attach a downscaled photo, image bubble, "See <category>" shortcut.
- **GPS Near You** — migration 0009 (`lat`/`lng` on shops + listings); `lib/geo.js`
  (`getPosition`, haversine `distanceKm`); "Autour de moi" sorts by real distance;
  location captured on shop/listing creation + settable from Ma Boutique.
- **Delivery by country** — checkout shows a pickup-first warning in FCFA zones
  (Cameroun etc.); delivery still gated by the vendor's `offers_delivery`.

## Done — Cycle 6 (keyboard/chat hardening + push LIVE + gamification)
- **Push notifications are REAL now.** VAPID P-256 keypair generated; the full
  keypair is stored in the private `public.app_config` table (key `vapid_keys`,
  RLS on + no policies = service-role only) — NOT in git. `send-push` (v7) reads
  the env secret `VAPID_KEYS` if present else falls back to `app_config`. The
  **public** app-server key is committed as `VITE_VAPID_PUBLIC_KEY` in
  `deploy.yml` (public by design). To rotate keys: regenerate, update the
  `app_config` row via SQL AND the workflow env var. iOS still requires
  "Add to Home Screen" before the browser will grant push permission.
- **Chat keyboard gap fixed for real** — the app-shell (Buyer+VendorLayout) is
  now `position: fixed; top:0; inset-x:0` (was in-flow) so iOS Safari can't
  scroll the document to "reveal" a focused input; combined with `--app-height`
  the shell = the space above the keyboard, input pinned right on top of it.
- **Chat bubbles align WhatsApp-style** by `sender_id === user.id` (was the
  fragile `sender_role === role`, which inverted on the vendor side). Scroll to
  newest via an invisible end-anchor + `scrollIntoView`.
- **Product save can't hang** — `VendorProductEdit.save()` wrapped in
  try/catch/finally with a 25s AbortController; Save is disabled while any image
  is still uploading (`ImageUpload` now reports busy via `onBusyChange`).
- **Country no longer forced to Cameroun** — `detectCountry()` uses the device
  time zone first (Europe/Paris → FR) then locale region, returns null instead
  of a hard CM default.
- **Recommendations RPC** `similar_products(product_id, limit)` via `pg_trgm`
  (same-category + trigram name similarity). pgvector/Gemini embeddings can
  replace the body later without changing callers. (migration 0010)
- **Vendor gamification** — `shops.seller_points` + `AFTER UPDATE OF status ON
  orders` trigger (`award_seller_points`, SECURITY DEFINER) grants +10 points
  when an order flips to `delivered`. Not yet surfaced in the UI. (migration 0010)

## Done — Cycle 6b (surfacing + first "wow" touches)
- **Points vendeur** shown on the vendor dashboard (brass card, `seller_points`).
- **"Vous aimerez aussi"** on ProductDetail via `similar_products` RPC (verified
  returning results against live data).
- **Like "pop"** bounce on the reel heart (keyed remount + `finjaro-like-pop`,
  reduced-motion safe) and `active:scale-90` press feedback.

## Backlog — remaining
1. **Gamification leaderboard + reward** — a vendor ranking screen; decide the
   reward (Beau floated a paid tier ~200€ for top client-drivers). Points column
   + trigger already live.
2. **Elite design pass (Beau's 8-chantier brief)** — glassmorphism nav/headers,
   iOS-style bottom sheets replacing modals, like-button bounce, pinned FAB on
   product detail, skeletons matching card geometry, swipeable galleries,
   optimistic UI everywhere, Error Boundaries. Do this WITHOUT destabilising the
   locked "Lagune & Encre" tokens — it's a big, careful cycle on its own.
3. **`@finou` inside buyer↔vendor chats** — detect `@finou` and insert an AI reply.
4. **Search UX** — inline results as you type (Amazon-style).
5. **Real IP geolocation edge function** (cf-ipcountry / x-forwarded-for) to
   replace the timezone/locale heuristic in `detectCountry`.

## Open items to reproduce / re-test with Beau
- Search UX: make it filter inline as you type (Amazon-style) + confirm the
  "white screen" is gone after the keyboard fix.
- Confirm on-device: keyboard stays fixed everywhere; realtime message delivery;
  vendor price shows in shop currency; reel buttons tappable.
- Rename "Mes favoris" → maybe "Abonnements" (shops you follow) — pending Beau.

## How to work here
- Small surgical changes; build (`npm run build`) + a headless Chromium smoke
  test (zero page errors) before deploying; then push branch → ff `main` → push.
- Apply DB changes as new numbered `supabase/migrations/000X_*.sql` **and** apply
  them to the project via tooling (don't ask Beau to run SQL).
