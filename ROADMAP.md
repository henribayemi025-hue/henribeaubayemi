# Finjaro — Roadmap & continuity notes

> **Purpose:** durable memory. If a session's chat context is lost, read this +
> the code and continue seamlessly. Founder = **Beau** (henribayemi025@gmail.com),
> non-technical; answer him in **French**, keep things simple, never leave a dead
> button, respect the "Lagune & Encre" design system, and always i18n FR+EN.

## Live facts
- **Live app:** https://finjaro.net (custom domain, DNS + Cloudflare Custom
  Domain live as of 2026-07-28) — also reachable at
  https://finjaro.finjaro.workers.dev. The Cloudflare Worker itself is named
  `finjaro` (Beau renamed it via the CF dashboard's own Rename feature after
  it was created under the old repo name; `wrangler.toml` `name` synced to
  match). Do not rename via `wrangler.toml` alone — Workers Builds stays bound
  to whatever worker it was first connected to; dashboard rename is the only
  way that actually moves the live deploy.
- **Repo:** `henribayemi025-hue/henribeaubayemi` — work on branch
  `claude/finjaro-marketplace-build-xsripr`, then fast-forward `main` and push.
- **Deploy (Cloudflare Workers static assets):** the CF project `finjaro`
  is a **Workers Build** connected to the git repo (account
  `35889b325c205cf3966eabf6bca0f7f7`). On push it runs
  `npm run build` then `npx wrangler deploy`. `wrangler.toml` points `[assets]` at
  `./dist` with `not_found_handling="single-page-application"` (SPA fallback).
  Env vars (`VITE_SUPABASE_URL/ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_STRIPE_PK`)
  are set in the CF dashboard → Settings → Variables (NOT in git).
  `public/_headers` sets cache policy, including 1-week caching for
  `/demo-products/*` and `/demo-reels/*`. **Do NOT add `public/_redirects`** —
  CF rejects `/* /index.html 200` as an infinite loop (code 100324); the SPA
  fallback is `wrangler.toml`'s job now.
- **Supabase project:** `finjaro` = `bokwivwizghdlaedczbw` (URL
  https://bokwivwizghdlaedczbw.supabase.co). Migrations in `supabase/migrations`
  are **applied directly by the assistant via tooling** (Beau doesn't run SQL).
- **Sandbox network limitation (still true):** this session's outbound network
  proxy blocks direct HTTPS to `*.supabase.co`, so Storage uploads from
  Bash/curl are impossible. Workaround used throughout: binary assets (demo
  product photos, reel videos) are committed as static files under
  `public/demo-products/` and `public/demo-reels/`, referenced by full
  `https://finjaro.net/...` URL in DB columns — `storageUrl()`'s existing
  `if (path.startsWith('http')) return path;` passthrough handles it.
- **Edge functions:** `finou-chat` (v9 — Gemini 2.5 Flash, text+vision, now
  with a monthly AI-budget guard, see below), `send-push` (Web Push),
  `finou-vision` (stub), `vendor-copilot` (Gemini → marketing product
  description), `create-checkout` + `stripe-webhook` (Stripe, TEST mode
  live), `miroir-ia` (v13 — Mirror AI / virtual try-on, **ACTIVE**, model is
  now `gemini-3.1-flash-image` not 2.5 — see Cycle 9 for the full saga of why
  it kept silently failing and what fixed it).
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
  (Supabase secret) + `VITE_VAPID_PUBLIC_KEY` (Cloudflare). On iPhone the user must
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

## Done — Cycle 8 (Cloudflare migration + Finou intelligence + Mirror AI + perf)
- **Migrated Netlify → Cloudflare** (Workers static assets + wrangler.toml SPA
  fallback). See `MIGRATION_NOTES.md` for every deploy trap hit (do not add
  `public/_redirects` back; env vars must be baked as code defaults since CF
  dashboard vars are runtime-only, not build-time).
- **Finou is a real generalist assistant now** (system prompt rewrite, v3) —
  answers any question, no longer deflects to a canned intro. `ACTION: login|
  sell` tags drive one-tap buttons (`FinouAction`) routed from real account
  state client-side, never the LLM.
- **Finou visual search** — image upload → real product carousel (not just a
  category link).
- **`@finouchou` in buyer↔vendor chat** — done, with live `@` autocomplete.
  (Superseded backlog item 3 above.)
- **ErrorBoundary** + **stale-chunk auto-reload** (`lazyWithReload` in
  App.jsx) — a render error or an old deploy's dead chunk no longer
  white-screens the app.
- **Real Search crash fixed** (not a stale-tab issue) — `data` was null during
  the ~300ms pre-debounce window; render fell through to `data.cats` on null.
  Reproduced + verified via a headless Playwright script (see git history for
  the exact repro).
- **Perf**: uploaded photos are compressed client-side before Storage
  (`lib/image.js`, max 1600px JPEG q0.82 — also fixes HEIC display); Home
  prefetches its data the instant the app boots (`lib/homeCache.js`) instead
  of waiting for its lazy chunk to mount; `useAuth` dedupes profile refetches;
  migration 0012 added DB indexes for the hot buyer queries.
- **Mirror AI — built, wired to UI this cycle.** A "✨ Essayer" button lives
  in Finou's product carousel and on the product detail page for wearable
  categories. At the time, Google's free tier had a hard `limit: 0` for this
  image model — Beau chose not to enable billing yet. **Superseded — see
  Cycle 9: billing is now on, and several more real bugs were found and
  fixed after that.**

## Done — Cycle 9 (domain, referrals, admin dashboard, Finou actions,
   leaderboard, AI budget cutoff, Mirror AI real fix, content cleanup)
- **Custom domain live:** `finjaro.net` bought via Cloudflare Registrar,
  connected as a Custom Domain on the `finjaro` worker. DNS propagation took
  a couple hours; nothing else needed.
- **Referral program (real money, tracked manually):** migration adds
  `profiles.referral_code` (unique, auto-generated) + `referred_by`.
  `handle_new_user()` resolves `raw_user_meta_data->>'ref'` into
  `referred_by` on signup. `Auth.jsx` reads `?ref=` from the URL and passes it
  through `signUp()`. `InviteFriend.jsx` shows real milestone progress:
  5€/10 friends invited, 50€/50 referred vendors who made a real sale.
  **No payment automation** — Beau tracks manually and pays himself; this is
  intentional, don't build a payout pipeline unless he asks.
- **Admin dashboard** (`/admin`, `AdminDashboard.jsx`) — gated by
  `profiles.is_admin` (a new `is_admin()` SECURITY DEFINER helper backs
  `orders_read`/`events_read` RLS policies so admin queries aren't scoped to
  Beau's own rows only). Shows visits (real, see below), users, active
  vendors, orders, revenue, top products by views, event-type breakdown,
  recent **identified** visitors, and the AI spend estimate (see budget
  cutoff below). Reachable from the buyer profile menu when `is_admin` is
  true.
- **Real visit tracking:** `main.jsx` fires `track('visit')` once per session
  (`sessionStorage` guard) right after `prefetchHome()`. `events.user_id` now
  **defaults to `auth.uid()` at the DB column level** (not passed by the
  client) — so a visit is automatically attributed to whoever is logged in,
  with zero client code per call site, and can never be spoofed. Anonymous
  visits stay `user_id = null` by design (no way to identify a browser that
  hasn't signed in — true of any site).
- **Forgot password:** `useAuth` gained `resetPassword(email)` /
  `updatePassword(password)`. `Auth.jsx` has a `mode:'forgot'` step (email
  only, sends the reset link). New `ResetPassword.jsx` screen at
  `/auth/reset` handles the return trip (Supabase's redirect already carries
  a recovery session, so `updateUser({password})` just works).
- **Finou Chou real actions:** `share_shop` (real `navigator.share`/clipboard
  with the vendor's actual `shop.slug`) and `delete_product` (opens
  `FinouDeleteProduct` — a real picker + destructive confirm; the LLM is
  explicitly instructed to never choose the product itself, only ever emit
  the `ACTION: delete_product` tag and let the client-driven UI take over).
- **Vendor leaderboard** (`VendorLeaderboard.jsx`, `/vendor/leaderboard`) —
  top-20 by `seller_points`, medal icons top 3, own-row highlight. Points-only,
  no paid reward tier (Beau's explicit call: ship the free version first,
  see if it drives engagement before investing further).
- **Vendor desktop sidebar** — `VendorSidebarNav.jsx` mirrors the buyer
  sidebar pattern; `VendorLayout.jsx` restructured `lg:flex` like
  `BuyerLayout.jsx`.
- **AI budget hard cutoff (20€/month, Beau's number).** `finou-chat` and
  `miroir-ia` share one Gemini API key/project — a spike on either affects
  both. New `public.ai_usage` table (`fn`, `cost_eur`, `created_at`, admin-
  read RLS) logs a conservative cost ESTIMATE after every real Gemini call
  (~€0.0008/text turn, ~€0.02/image gen). Before calling Gemini, both
  functions sum this month's total; at ≥20€ they stop calling Gemini
  entirely and reply gracefully in-character instead of erroring (Finou:
  "je fais une pause…"; Miroir: a clean `budget_paused` error the UI
  recognizes). A one-time push notification per calendar month fires to
  Beau's `ADMIN_USER_ID` (`bffb724f-6652-4240-a6f7-6904369a1fd4`, hardcoded
  in both functions) when it trips, tracked via `app_config` key
  `ai_budget_alert_sent` so it doesn't spam. The admin dashboard shows the
  running total live. **Beau separately bought Gemini API credits directly
  in Google AI Studio (prepaid, ~20-25€, auto-recharge OFF)** — so in
  practice there are now two independent ceilings (our own DB-tracked one +
  Google's real prepaid balance), which is fine, redundant safety is good.
- **Mirror AI — the real root causes, found the hard way:**
  1. Free-tier Gemini rate limits were the first wall (fixed by Beau buying
     credits → Tier 1, confirmed via Google AI Studio's own rate-limit
     dashboard, screenshot showed ~3/1000 RPM usage, nowhere near the limit).
  2. **`gemini-2.5-flash-image` kept returning `finishReason: STOP` with NO
     image and no safety block** — just silently text-only, non-
     deterministically, even on a well-framed, appropriate photo. One
     automatic silent retry was added (helps sometimes, not always).
     Switched the model to **`gemini-3.1-flash-image`**, built specifically
     for character/face resemblance across edits — this is the current
     `MODEL` constant in `miroir-ia/index.ts`. Do not silently revert this.
  3. **The real bug, found via Beau reading Gemini's own text reply**: the
     function only ever sent the user's SELFIE to Gemini, plus the product
     NAME as plain text — never the product's own photo. Gemini said so
     outright: *"Je ne parviens pas à visualiser la 'Tenue tendance saison
     n°3'."* Fixed: the client now sends `productImageUrl` too;
     `miroir-ia` fetches it server-side, base64-encodes it, and includes it
     as a second `inline_data` part so Gemini can actually see what it's
     supposed to render. This was the single biggest fix in this whole saga.
  4. **Category-aware body-part hints** — a ring needs a hand in frame, a
     watch needs a wrist; a face selfie can't show most products "worn".
     `MIRROR_CATEGORIES` products now show a hint (`mirror.photoHints.*` in
     both locale files) telling the user which photo to take, AND the
     Gemini prompt itself names the expected body part server-side
     (`BODY_PART_HINTS` map in `miroir-ia/index.ts`).
  5. **Photo picker had only one input with `capture="user"`**, which forces
     the OS camera and hides the photo-library option on some browsers.
     Split into two separate inputs/buttons: "Prendre une photo" (camera)
     and "Choisir une photo" (library, no `capture` attr).
  6. **Login gate was missing** — the try-on button opened the whole flow
     (pick photo, hit Generate) even logged out, only failing at the very
     end with a raw `unauthorized`. Both trigger sites (`ProductDetail.jsx`,
     `FinouChou.jsx`) now check `user` first and call `requireLogin()`.
  7. **Error surfacing bug**: the server started returning Gemini's real
     refusal text/`finishReason` in a `detail` field, but the client only
     ever displayed `data.error` (the generic wrapper message) — the actual
     useful detail was silently dropped. Fixed in `MirrorModal.jsx`.
- **Face-cropping fixed everywhere with one reusable pattern**: instead of
  `object-cover` (which cuts off whichever part of a face/photo doesn't fit
  the container, no matter which edge you anchor it to), the home hero
  carousel, category banner, and product detail gallery all now render a
  **blurred, scaled-up copy of the same photo as a backdrop**, with the
  real photo on top at `object-contain` — nothing is ever cropped, on any
  photo, regardless of its native aspect ratio. Category banner is `h-36
  lg:h-96`, full width (not a small centered box — tried that, Beau wanted
  full width, just taller).
- **Content/trust cleanup — real brand logos found and removed**: "Sacs" and
  "Parfums" category banners (used both on the Home category strip AND the
  category page — same `CATEGORIES[].banner` asset) turned out to be an
  actual Chanel bag and a Chanel Nº5 bottle with legible logos. Replaced
  with unbranded photos. Checked all 14 category banners individually —
  these were the only two.
- **Product naming pass — 35 products renamed.** Found via `name similar to
  '%n°[0-9]%'` — most were harmless numbered duplicates ("Costume homme
  raffiné n°2"), but several were the **wrong photo for the name entirely**
  (a red off-shoulder dress named "Costume homme raffiné n°2", stiletto
  heels named "Baskets urbaines n°2", a decorative vase named "Coussins et
  textiles déco n°2", a table-setting photo named "Tenue traditionnelle
  mariage n°3"). Renamed every one to actually match its photo. Also bumped
  `ProductCard`'s name from `line-clamp-1` to `line-clamp-2` since several
  legitimately-similar names were indistinguishable when truncated to one
  line.
- **Two watermarked demo photos cropped clean**: `kc-02.jpg` had a "Black
  History Month" promo ribbon + decorative border; `ad-04.jpg` had a
  "Redecor — African Chic" text overlay. Both cropped down to the clean part
  of the same photo (no swap needed). **`wd-08.jpg` (a wedding-arch decor
  photo) still has a faint diagonal stock-photo watermark spread across the
  whole frame** — couldn't crop it out (too widespread) and there's no
  unused clean replacement in `public/demo-products/`; flagged to Beau,
  not yet resolved, low visual severity.
- **Payments Phase 2 — started earlier than planned.** Beau changed his mind
  mid-session and wants Orange Money + MTN MoMo wired in TEST mode now,
  before Phase 1 launch, not after (see "Beau's stated plan" below — this
  supersedes the old "bundle all three at the end" note). He's choosing
  between a mobile-money aggregator (single API for both Orange Money AND
  MTN MoMo instead of integrating each telco separately) — **CinetPay**
  (2-3.5% commission, confirmed via their own site) vs **Fapshi** (Cameroon-
  specific, no public pricing found — needs a account/direct contact to get
  a number) vs Flutterwave (ruled out, too generalist for a Cameroon-only
  need right now). Decision **not yet made** as of end of this cycle — next
  step is Beau picking one and creating a sandbox/developer account, same
  pattern as Google/Cloudflare/Stripe (he drives the account creation +
  screenshots, the assistant builds the integration once real test
  credentials exist).
- Small design polish: tap press feedback (`active:scale-*`) added to
  `CategoryStrip`, `ShopCard`, `BuyerNav`/`VendorNav` tabs — matches the
  pattern already on `ProductCard`/buttons.

## Beau's stated plan — status as of end of Cycle 9 (supersedes the old list)
1. ~~Test Mirror AI + Finou live~~ — done, and thoroughly debugged (see
   Cycle 9 — this took many rounds to get actually right).
2. ~~Vendor leaderboard~~ — done, points-only, no paid tier (Beau's call).
3. **Elite design pass** — still open, only partially done (press feedback
   on nav/cards this cycle; earlier cycles did modal slide-up/fade-in). No
   further specific brief from Beau yet — ask him what's still bugging him
   before doing a big speculative pass.
4. ~~Admin dashboard~~ — done (not originally on this list, Beau asked for
   it directly — visits/users/orders/revenue/top products).
5. **Orange Money / MTN MoMo (mobile-money aggregator) — IN PROGRESS,
   moved up ahead of schedule.** Beau explicitly decided not to wait for
   Phase 1 launch on this one. Choosing between CinetPay and Fapshi (see
   Cycle 9 payments note) — waiting on Beau to pick one and create a
   sandbox account.
6. **Stripe → LIVE mode** — still needs Beau's auto-entrepreneur
   registration; test mode has been live and working since Cycle 7.
7. **Brainstorm/review session — Beau wants a full walkthrough, test every
   single feature, before flipping Stripe/Orange Money to real/live mode.**
   His words: get Orange Money to test mode + know the real fees → do a
   detailed review testing ALL features → if that's clean, THEN configure
   Stripe and Orange Money for real. Do not go live on either payment rail
   before this review happens.
8. **Launch Phase 1** — after 7.
9. **Recruit real vendors** — Beau said he's already bringing real vendors
   onto the platform in parallel with all of the above (his own outreach,
   not something to build).
- Sacs category still has zero safe (non-counterfeit) product photos —
  blocked on Beau sending new ones.
- Recurring "Oops" crash on PC — needs a browser console screenshot next
  time it happens to actually diagnose (a plain screenshot of the error
  page isn't enough).
- Video content for Fin (reels) — Beau wants more, specifically asked about
  unboxing videos; ruled out scraping existing internet videos (copyright);
  options left on the table are Beau sending his own footage, real vendors
  contributing their own videos once onboarded, or AI video generation
  (expensive, would need the same kind of budget cap as Finou/Miroir — not
  started).
- Real IP geolocation edge function (cf-ipcountry / x-forwarded-for) to
  replace the timezone/locale heuristic in `detectCountry` — low priority.

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
