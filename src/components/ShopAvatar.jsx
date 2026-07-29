import { SmartImage } from './SmartImage';
import { shopGradient } from '../lib/shopColor';

// Avatar rond d'une boutique. Repli dans le même esprit que ShopBanner:
// dégradé propre à la boutique (voir lib/shopColor) + initiale, jamais le
// cadre gris "image cassée" de SmartImage quand il n'y a pas encore de logo.
export function ShopAvatar({ src, fallbackSrc, name, seed, className = '' }) {
  if (src) return <SmartImage src={src} fallbackSrc={fallbackSrc} alt={name} className={className} rounded="rounded-full" />;

  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const g = shopGradient(seed || name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
      aria-label={name}
      role="img"
    >
      <span className="text-[1.1em] leading-none">{initial}</span>
    </div>
  );
}
