# Finjaro — deployment status & final step

## Done ✅

### GitHub
- Repo: `henribayemi025-hue/henribeaubayemi`
- Branch: `claude/finjaro-marketplace-build-xsripr` (all code pushed)

### Supabase — project `finjaro` (`bokwivwizghdlaedczbw`)
- Schema, RLS, triggers, storage buckets applied (migrations `0001`–`0005`)
- Edge Functions deployed & ACTIVE: `finou-chat` (Gemini 2.5 Flash), `send-push`
- URL: `https://bokwivwizghdlaedczbw.supabase.co`

### Netlify — team `IFnou`
- Site created: **`finjaro`** → `https://finjaro.netlify.app`
- Build env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `netlify.toml` in repo (build `npm run build`, publish `dist`, SPA redirects)

## Final step — connect the repo so Netlify builds it (1 minute)

The automated code upload could not run from the build environment (its egress
policy blocks `api.netlify.com`). Trigger the first build one of these ways:

**Option A — connect GitHub (recommended, enables auto-deploy):**
1. Netlify → project **finjaro** → *Project configuration → Build & deploy →
   Link repository* → GitHub → `henribayemi025-hue/henribeaubayemi`.
2. Production branch: `claude/finjaro-marketplace-build-xsripr` (or merge it to
   `main` and use `main`).
3. Build command `npm run build`, publish directory `dist` (already in
   `netlify.toml`). Deploy.

**Option B — one-off CLI deploy from any normal machine:**
```bash
git clone <repo> && cd henribeaubayemi
npm install
npm run build
npx netlify deploy --prod --dir=dist --site=7239e5ca-25b6-4b75-88c4-2adcf02a2d94
```

## Optional secrets (features degrade gracefully without them)

- **Finou Chou (AI):** `finou-chat` reads `GEMINI_API_KEY` from Supabase Edge
  Function secrets. If unset, the assistant shows its "temporarily unavailable"
  state. Set it in Supabase → Edge Functions → Secrets.
- **Web Push:** set `VAPID_KEYS` (+ `VAPID_SUBJECT`) in Supabase secrets and
  `VITE_VAPID_PUBLIC_KEY` in Netlify. In-app notifications (DB + realtime) work
  without these; only browser push needs them.

## Approving vendors (no Admin UI this cycle)

Vendor applications land in `vendor_applications` (status `pending`). Approve /
reject via the Supabase SQL editor — triggers auto-create the shop, flip the
profile to vendor, and send the notification:

```sql
-- Approve
update public.vendor_applications set status = 'approved' where id = '<uuid>';
-- Reject
update public.vendor_applications
  set status = 'rejected', rejection_reason = 'Motif…' where id = '<uuid>';
```

Reinstating a suspended shop/user (after the 3-report auto-suspension):

```sql
update public.shops set status = 'active', report_count = 0 where id = '<uuid>';
update public.profiles set is_suspended = false, report_count = 0 where id = '<uuid>';
```
