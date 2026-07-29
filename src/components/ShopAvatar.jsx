import { SmartImage } from './SmartImage';

// Avatar rond d'une boutique. Repli dans le même esprit que ShopBanner:
// dégradé teal/laiton + initiale, jamais le cadre gris "image cassée" de
// SmartImage quand la boutique n'a pas encore mis de logo.
export function ShopAvatar({ src, fallbackSrc, name, className = '' }) {
  if (src) return <SmartImage src={src} fallbackSrc={fallbackSrc} alt={name} className={className} rounded="rounded-full" />;

  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal to-teal-hover font-bold text-white ${className}`}
      aria-label={name}
      role="img"
    >
      <span className="text-lg">{initial}</span>
    </div>
  );
}
