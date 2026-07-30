// The 15 Finjaro categories. `id` is the stable key used in DB + i18n.
// Banner images are static bundled assets (see /src/assets/categories) — square
// WebP photos, 480x480, ~10-60KB each. Serves two very different display sizes
// with the same file: the 80px CategoryStrip icon on Home, and the larger
// (~150-200px effective, object-contain) banner on the category detail page —
// 480px covers both crisply at 2x pixel density without shipping oversized
// pixels to the small icon. Source photos originally arrived at 640x640,
// 20-150KB each; resized down here (2026-07-28).
import mode from '../assets/categories/mode.webp';
import chaussures from '../assets/categories/chaussures.webp';
import sacs from '../assets/categories/sacs.webp';
import bijoux from '../assets/categories/bijoux.webp';
import montres from '../assets/categories/montres.webp';
import parfums from '../assets/categories/parfums.webp';
import beaute from '../assets/categories/beaute.webp';
import cheveux from '../assets/categories/cheveux.webp';
import deco from '../assets/categories/deco.webp';
import mariages from '../assets/categories/mariages.webp';
import evenement from '../assets/categories/evenement.webp';
import mannequinerie from '../assets/categories/mannequinerie.webp';
import art from '../assets/categories/art.webp';
import accessoires from '../assets/categories/accessoires.webp';
import maroquinerie from '../assets/categories/maroquinerie.webp';

export const CATEGORIES = [
  { id: 'mode', banner: mode },
  { id: 'chaussures', banner: chaussures },
  { id: 'sacs', banner: sacs },
  { id: 'maroquinerie', banner: maroquinerie },
  { id: 'bijoux', banner: bijoux },
  { id: 'montres', banner: montres },
  { id: 'parfums', banner: parfums },
  { id: 'beaute', banner: beaute },
  { id: 'cheveux', banner: cheveux },
  { id: 'deco', banner: deco },
  { id: 'mariages', banner: mariages },
  { id: 'evenement', banner: evenement },
  { id: 'mannequinerie', banner: mannequinerie },
  { id: 'art', banner: art },
  { id: 'accessoires', banner: accessoires },
];

// Contact/Devis-only categories: no price, no add-to-cart — "Demander un devis".
export const QUOTE_ONLY_CATEGORIES = ['mariages', 'evenement', 'mannequinerie'];

// Categories where "seeing yourself wearing it" (Mirror AI) actually makes sense.
export const MIRROR_CATEGORIES = ['mode', 'chaussures', 'sacs', 'maroquinerie', 'bijoux', 'montres', 'accessoires', 'cheveux'];

// Service requests/offers live in the SAME near_you_listings table as
// classified "annonces" (type 'cherche'/'propose' + free-text category, no
// DB constraint on the value) — no new table needed, just a second category
// list a listing's category can come from. No icon/banner (services aren't
// shown as Home category tiles), only used in Near You's publish form + list.
export const SERVICE_CATEGORIES = [
  { id: 'reparation' },
  { id: 'menage' },
  { id: 'cours' },
  { id: 'jardinage' },
  { id: 'demenagement' },
  { id: 'beaute_domicile' },
  { id: 'ongles' },
  { id: 'coursier' },
  { id: 'evenementiel_service' },
  { id: 'autre_service' },
];

export function isServiceCategory(categoryId) {
  return SERVICE_CATEGORIES.some((c) => c.id === categoryId);
}

export function isQuoteOnly(categoryId) {
  return QUOTE_ONLY_CATEGORIES.includes(categoryId);
}

export function categoryLabel(t, id) {
  return t(`categories.${id}`);
}
