import { SmartImage } from './SmartImage';
import { shopGradient } from '../lib/shopColor';

// Avatar rond d'une boutique. Repli dans le même esprit que ShopBanner:
// dégradé propre à la boutique (voir lib/shopColor) + initiale, jamais le
// cadre gris "image cassée" de SmartImage quand il n'y a pas encore de logo.
export function ShopAvatar({ src, fallbackSrc, name, seed, className = '' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const g = shopGradient(seed || name);

  const lettre = (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
      aria-label={name}
      role="img"
    >
      <span className="text-[1.1em] leading-none">{initial}</span>
    </div>
  );

  // Beau (12/09), capture de la liste des messages: trois boutiques avec un
  // rond gris vide à la place de leur logo. La lettre ne servait de repli
  // que si la boutique n'avait AUCUN logo — pas si le logo refusait de
  // charger. Elle sert maintenant dans les deux cas: mieux vaut l'initiale
  // colorée qu'un disque muet.
  if (src) {
    return <SmartImage src={src} fallbackSrc={fallbackSrc} alt={name} className={className} rounded="rounded-full" fallback={lettre} />;
  }
  return lettre;
}
