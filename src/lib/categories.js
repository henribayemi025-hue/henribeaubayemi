// The 14 Finjaro categories. `id` is the stable key used in DB + i18n.
// Banner images are static bundled assets (see /src/assets/categories).
import mode from '../assets/categories/mode.svg';
import chaussures from '../assets/categories/chaussures.svg';
import sacs from '../assets/categories/sacs.svg';
import bijoux from '../assets/categories/bijoux.svg';
import montres from '../assets/categories/montres.svg';
import parfums from '../assets/categories/parfums.svg';
import beaute from '../assets/categories/beaute.svg';
import cheveux from '../assets/categories/cheveux.svg';
import deco from '../assets/categories/deco.svg';
import mariages from '../assets/categories/mariages.svg';
import evenement from '../assets/categories/evenement.svg';
import mannequinerie from '../assets/categories/mannequinerie.svg';
import art from '../assets/categories/art.svg';
import accessoires from '../assets/categories/accessoires.svg';

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
