// The 14 Finjaro categories. `id` is the stable key used in DB + i18n.
// Banner images are static bundled assets (see /src/assets/categories) —
// optimized WebP photos, square, ~4KB each.
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

export const CATEGORIES = [
  { id: 'mode', banner: mode },
  { id: 'chaussures', banner: chaussures },
  { id: 'sacs', banner: sacs },
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

export function isQuoteOnly(categoryId) {
  return QUOTE_ONLY_CATEGORIES.includes(categoryId);
}

export function categoryLabel(t, id) {
  return t(`categories.${id}`);
}
