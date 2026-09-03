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

// En production, les objets publics passent par /img/{bucket}/{chemin} — un
// Worker Cloudflare (src/worker.js) les récupère chez Supabase la 1ʳᵉ fois puis
// les sert depuis le POP le plus proche du visiteur. Avant ce détour, un LCP
// mesuré à 13 s au Cameroun; les octets voyageaient de Frankfurt à chaque
// affichage. En dev Vite (localhost:5173), pas de Worker, donc on retombe sur
// l'URL Supabase directe.
const USE_CDN_PROXY = import.meta.env.PROD;

/** Public URL for a file stored in a Supabase Storage bucket. */
export function storageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Chemin absolu du site (ex: /demo-products/robe-01.jpg): fichier servi par
  // l'hébergeur, pas par Supabase Storage. À laisser tel quel — le passer à
  // getPublicUrl() fabriquerait une URL Supabase vers un objet inexistant.
  // Les articles de démonstration référençaient l'ancien domaine Cloudflare en
  // absolu; ils sont désormais en relatif pour suivre le site où qu'il soit.
  if (path.startsWith('/')) return path;
  if (USE_CDN_PROXY) return `/img/${bucket}/${path}`;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// Vignette légère d'une image produit/boutique — voir compressForUploadWithThumb
// (lib/image.js). Uploadée à côté de l'originale sous le même nom + `_thumb`,
// donc dérivable sans toucher au schéma: `<uuid>.webp` -> `<uuid>_thumb.webp`.
// Une photo envoyée AVANT ce changement n'a pas de vignette — l'URL retournée
// pointera vers un fichier absent (404), et c'est volontaire: SmartImage
// bascule automatiquement sur l'image pleine taille dans ce cas (voir
// SmartImage.jsx), donc aucune photo existante ne disparaît.
export function storageThumbUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path; // URL externe: pas de vignette dérivable
  if (path.startsWith('/')) return path;    // fichier de l'hébergeur: idem
  const dot = path.lastIndexOf('.');
  const thumbPath = dot === -1 ? `${path}_thumb` : `${path.slice(0, dot)}_thumb${path.slice(dot)}`;
  if (USE_CDN_PROXY) return `/img/${bucket}/${thumbPath}`;
  return supabase.storage.from(bucket).getPublicUrl(thumbPath).data.publicUrl;
}
