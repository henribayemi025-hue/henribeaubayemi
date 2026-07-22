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

## Backlog — remaining
1. **Real push notifications** — needs VAPID keys. NOTE: Supabase edge-function
   **secrets can't be set via MCP**, so either (a) Beau pastes `VAPID_KEYS` in
   Supabase → Edge Functions → Secrets, or (b) store the keypair in a private
   `app_config` table that `send-push` reads with the service role (assistant can
   do this fully). Also set `VITE_VAPID_PUBLIC_KEY` in Netlify. iOS requires the
   PWA be "Added to Home Screen" first. Verify `send-push` end to end on device.
2. **`@finou` inside buyer↔vendor chats** — optional: detect `@finou` in a chat
   and insert an AI reply (Finou Vision already covers photo search in the overlay).
3. **Search UX** — make results feel inline as you type (Amazon-style).

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
