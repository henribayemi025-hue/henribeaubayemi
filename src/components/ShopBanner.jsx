import { IconBuildingStore } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';

// Bandeau d'une boutique. Beaucoup de vendeuses ouvrent leur boutique sans
// mettre de bannière tout de suite — laisser le cadre gris vide de SmartImage
// donnait une page qui a l'air cassée plutôt qu'une page simplement sobre.
//
// Repli: dégradé aux couleurs de la marque (teal -> teal-hover, touche de
// laiton) avec l'initiale de la boutique en filigrane. Discret, jamais un
// placeholder "image manquante", et différent d'une boutique à l'autre sans
// être criard.
export function ShopBanner({ src, name, className = '' }) {
  if (src) return <SmartImage src={src} alt="" className={className} />;

  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-teal to-teal-hover ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brass/30" />
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
