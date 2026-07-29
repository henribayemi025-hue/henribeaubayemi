import { IconBuildingStore } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { shopGradient } from '../lib/shopColor';

// Bandeau d'une boutique. Beaucoup de vendeuses ouvrent leur boutique sans
// mettre de bannière tout de suite — laisser le cadre gris vide de SmartImage
// donnait une page qui a l'air cassée plutôt qu'une page simplement sobre.
//
// Repli: dégradé propre à la boutique (voir lib/shopColor) avec l'initiale en
// filigrane. Jamais un placeholder "image manquante", et une teinte différente
// d'une boutique à l'autre sans sortir de la charte.
export function ShopBanner({ src, name, seed, className = '' }) {
  if (src) return <SmartImage src={src} alt="" className={className} />;

  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const g = shopGradient(seed || name);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
      aria-hidden="true"
    >
      {/* Initiale en très gros, volontairement peu contrastée: donne une
          identité visuelle à la boutique sans attirer l'œil plus que le nom
          affiché juste en dessous. */}
      <span className="absolute -right-2 bottom-[-18%] select-none text-[7rem] font-bold leading-none text-white/10 lg:text-[9rem]">
        {initial}
      </span>
      <IconBuildingStore
        size={30}
        stroke={1.5}
        className="absolute left-4 top-4 text-white/40"
      />
    </div>
  );
}
