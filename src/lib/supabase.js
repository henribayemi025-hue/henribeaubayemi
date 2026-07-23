import { createClient } from '@supabase/supabase-js';

// The Supabase project URL and the *publishable* anon key are public by design
// (they ship in every client bundle and are protected by RLS). We hardcode them
// as defaults so the app works even when the host doesn't inject VITE_* vars at
// BUILD time — e.g. Cloudflare "Variables and secrets" are runtime-only, so a
// build with no env would otherwise point the client at localhost and every
// request would fail. An env var, when present at build time, still overrides.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://bokwivwizghdlaedczbw.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Public URL for a file stored in a Supabase Storage bucket. */
export function storageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
