# Finjaro — Roadmap & continuity notes

> **Purpose:** durable memory. If a session's chat context is lost, read this +
> the code and continue seamlessly. Founder = **Beau** (henribayemi025@gmail.com),
> non-technical; answer him in **French**, keep things simple, never leave a dead
> button, respect the "Lagune & Encre" design system, and always i18n FR+EN.

## Live facts
- **Live app (Cloudflare):** https://henribeaubayemi.henribayemi025.workers.dev
  (migrated off Netlify 2026-07-23 — Netlify free credits were exhausted).
- **Repo:** `henribayemi025-hue/henribeaubayemi` — work on branch
  `claude/finjaro-marketplace-build-xsripr`, then fast-forward `main` and push.
- **Deploy (Cloudflare Workers static assets):** the CF project `henribeaubayemi`
  is a **Workers Build** connected to the git repo (account
  `35889b325c205cf3966eabf6bca0f7f7`, subdomain `henribayemi025`). On push it runs
  `npm run build` then `npx wrangler deploy`. `wrangler.toml` points `[assets]` at
  `./dist` with `not_found_handling="single-page-application"` (SPA fallback).
  Env vars (`VITE_SUPABASE_URL/ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_STRIPE_PK`)
  are set in the CF dashboard → Settings → Variables (NOT in git).
  `public/_headers` sets cache policy. **Do NOT add `public/_redirects`** — CF
  rejects `/* /index.html 200` as an infinite loop (code 100324); the SPA fallback
  is `wrangler.toml`'s job now. The old Netlify + GitHub-Actions workflows were
  removed. `netlify.toml` is dormant (ignored by CF).
- **Supabase project:** `finjaro` = `bokwivwizghdlaedczbw` (URL
  https://bokwivwizghdlaedczbw.supabase.co). Migrations in `supabase/migrations`
  are **applied directly by the assistant via tooling** (Beau doesn't run SQL).
- **Edge functions:** `finou-chat` (Gemini 2.5 Flash, text), `send-push`
  (Web Push), `finou-vision` (stub — for the vision feature below).
- **Auto-update:** `public/sw.js` is network-first for navigations + skipWaiting/
  claim; `main.jsx` calls `reg.update()` on focus and reloads once when a new
  worker takes control. Users never need to delete/reinstall to get a new build.
  Bump `SHELL_CACHE` in sw.js when you need to force an immediate SW refresh.
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
- **Chat keyboard — final approach: still shell + keyboard padding.** Chasing
  `visualViewport.offsetTop` fought iOS's own scroll-into-view (Beau saw it jump
  up then snap back). Now the shell is `fixed inset-0` (full height, never moves)
  and `useViewportHeight` publishes `--kb` = keyboard height
  (`innerHeight - visualViewport.height - offsetTop`); the shell adds
  `padding-bottom:var(--kb)` which lifts the input above the keyboard. Because
  the input is already visible, iOS has no reason to scroll → no fight. Same
  padding applied to Finou + Modal bottom sheets. Verified headless: `--kb:300px`
  lifts the bottom bar exactly 300px.
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

## Payments (Cycle 7 — Stripe first, scaffolding LIVE, dormant until keys)
- **DB:** migration 0011 adds `orders.payment_status` ('cod'|'unpaid'|'paid'|
  'failed'|'refunded', default 'cod'), `payment_provider`, `payment_ref`,
  `platform_fee_fcfa`, `paid_at`.
- **Edge functions deployed:** `create-checkout` (verify_jwt=true — buyer creates
  a Stripe Checkout Session for an order, returns hosted URL; charges EUR from
  the FCFA total) and `stripe-webhook` (verify_jwt=false — verifies Stripe
  signature, marks the order paid). Both read Stripe keys from the private
  `app_config` row key `stripe` = `{ secret, publishable, webhook_secret }`.
- **Frontend:** CheckoutCOD shows a "Payer par carte" button ONLY when
  `VITE_STRIPE_PK` is set at build time (else hidden — COD unchanged, no dead
  button). Card flow: create order (payment_status 'unpaid') → invoke
  create-checkout → redirect to Stripe → webhook confirms → order 'paid'.
- **TEST MODE IS LIVE (done).** Stripe account `acct_1TwH38PWe7shhIOr` ("Finjaro").
  `app_config.stripe` holds { publishable, secret (sk_test), webhook_secret,
  webhook_id }. Test webhook `we_1TwHE1PWe7shhIOrPUtFfahI` →
  `…/functions/v1/stripe-webhook`. `VITE_STRIPE_PK` (pk_test) is in deploy.yml so
  the "Payer par carte" button is enabled. Validated: key works, Checkout session
  creates, function boots. Test card 4242 4242 4242 4242, any future date/CVC.
- **Also connected:** Stripe MCP (Beau authorized "Claude" on his account) — used
  for inspection; the app itself uses the stored keys, not the MCP.
- **TO GO LIVE later (needs Beau):** register auto-entrepreneur; then swap
  `VITE_STRIPE_PK`→`pk_live_…` in deploy.yml and `app_config.stripe.secret`→
  `sk_live_…`, and create a LIVE webhook (repeat the POST with the live key) →
  store its `whsec_…`. Enabled the `http` (pg) extension for server-side calls.
- **Later:** Stripe Connect for automatic vendor payouts + the fixed platform
  fee (application_fee); mobile-money aggregator (Fapshi/Notch Pay) for
  Orange Money / MoMo in Cameroun.

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
