import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconStarFilled } from '@tabler/icons-react';
import { ShopAvatar } from './ShopAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { estEnAvant } from '../lib/featured';

// Compact shop avatar card used in horizontal scrollers and Near You lists.
export function ShopCard({ shop, distanceKm }) {
  const { t } = useTranslation();
  const avatar = shop.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null;
  const avatarFallback = shop.avatar_url ? storageUrl('shops', shop.avatar_url) : null;
  return (
    <Link to={`/boutique/${shop.slug}`} className="flex w-24 shrink-0 flex-col items-center text-center transition-transform duration-150 active:scale-95">
      {/* Anneau laiton = boutique mise en avant, gagnée en amenant d'autres
          vendeuses. Pas de mention « sponsorisé »: personne n'a payé, et le
          mot ferait croire le contraire. La vraie récompense est la place
          dans la liste; l'anneau ne fait que la rendre visible. */}
      <ShopAvatar
        src={avatar}
        fallbackSrc={avatarFallback}
        name={shop.name}
        seed={shop.id}
        className={`h-16 w-16 ${estEnAvant(shop) ? 'ring-2 ring-brass ring-offset-2 ring-offset-base' : ''}`}
      />
      <span className="mt-2 flex items-center gap-1 text-caption font-semibold text-ink">
        <span className="line-clamp-1">{shop.name}</span>
        {shop.is_verified && <VerifiedBadge size={13} />}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-caption text-muted">
        {/* 25/11 (retour d'une testeuse : « les étoiles sont à zéro partout »).
            Sans note, on dit « Nouveau » au lieu d'afficher une étoile à 0.0. */}
        {Number(shop.rating || 0) > 0 ? (
          <>
            <IconStarFilled size={12} className="text-brass" />
            {Number(shop.rating).toFixed(1)}
          </>
        ) : (
          <span className="rounded-pill bg-teal-light px-1.5 py-px text-[10px] font-semibold text-teal">
            {t('provider.isNew')}
          </span>
        )}
        {distanceKm != null && <span>· {distanceKm} km</span>}
        {/* Réunion du 10/10 : sur le profil public, seules les étoiles. Le nombre
            d'abonnés reste connu de l'équipe, il ne s'affiche plus ici. */}
      </span>
    </Link>
  );
}
