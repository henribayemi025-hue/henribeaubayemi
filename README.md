# Finjaro — _Au-delà des rêves_

Mobile-first marketplace for **beauty, fashion, fragrance, and event decoration**,
targeting African markets and the diaspora. Single codebase, two switchable spaces
(**Buyer** + **Vendor**) plus a marketing landing page.

Built mobile-first for mid/low-end Android on 3G: every route is lazy-loaded,
images are lazy + placeholder-guarded, and every data screen implements the four
states (loading / populated / error / empty). Fully bilingual **FR/EN** and
multi-currency (**FCFA / EUR / USD / GBP**).

## Stack

- **Vite + React + Tailwind CSS** (design system: _Lagune & Encre_)
- **Supabase** — PostgreSQL, Auth, Row-Level Security, Storage, Edge Functions
- **react-i18next** — every string routes through i18n (`src/locales/{fr,en}`)
- **@tabler/icons-react** — line icons
- **Gemini 2.5 Flash** — the _Finou Chou_ assistant, via the `finou-chat` Edge Function
- Deployed on **Netlify** (build `npm run build`, publish `dist`)

## Project structure

```
src/
  components/   reusable UI (buttons, cards, nav, states, modals…)
  screens/
    buyer/      Home, ProductDetail, ShopProfile, Cart, CheckoutCOD,
                NearYou, Fin, Inbox, VendorChat, UserProfile, …
    vendor/     Dashboard, Products, Orders, Messages, Reels, Shop,
                Stats, BecomeVendor
  hooks/        useAuth, useCart, useSettings, useVendorStatus, useAsync, …
  lib/          supabase client, i18n, currency, countries, categories
  locales/      fr/ en/ translation JSON
  assets/       static category banners (bundled branding, not user content)
landing/        marketing site (same design system)
supabase/
  migrations/   numbered SQL (core schema, RLS, triggers, storage)
  functions/    finou-chat, send-push, finou-vision (stub)
```

## Environment variables (set in Netlify)

| Key | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase publishable key |
| `VITE_VAPID_PUBLIC_KEY` | client | Web Push public key (optional until push is enabled) |

Server-side secrets live in Supabase (Edge Function secrets), never in the client:
`GEMINI_API_KEY`, and for Web Push `VAPID_KEYS` / `VAPID_SUBJECT`.

## Local development

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Database

Migrations in `supabase/migrations` are applied to the `finjaro` Supabase project:

1. `0001_marketplace_core` — tables (shops, products, orders, conversations,
   chat_messages, reels, reviews, reports, vendor_applications, shop_follows,
   near_you_listings, notifications) + `profiles` extensions.
2. `0002_rls_policies` — Row-Level Security for every table.
3. `0003_triggers` — verified-badge logic, 3-report auto-suspension, vendor
   approval → shop creation, and the 7 Phase-1 notification events.
4. `0004_storage` — Storage buckets + policies.

The **Admin** app is out of scope for this build; `vendor_applications`,
`reports`, and suspension states are structured so a future Admin can query and
update them (approvals are done via the Supabase dashboard for now).

## Parking lot (not in this build)

Miroir IA (virtual try-on) · GPS delivery tracking · buyer-to-buyer chat ·
online/card payment · multi-shop-per-vendor · Admin app · functional CSV export.
