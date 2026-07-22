import { Link } from 'react-router-dom';
import { IconStarFilled } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { VerifiedBadge } from './VerifiedBadge';
import { storageUrl } from '../lib/supabase';

// Compact shop avatar card used in horizontal scrollers and Near You lists.
export function ShopCard({ shop, distanceKm }) {
  const avatar = shop.avatar_url ? storageUrl('shops', shop.avatar_url) : null;
  return (
    <Link to={`/boutique/${shop.slug}`} className="flex w-24 shrink-0 flex-col items-center text-center">
      <SmartImage src={avatar} alt={shop.name} className="h-16 w-16" rounded="rounded-full" />
      <span className="mt-2 flex items-center gap-1 text-caption font-semibold text-ink">
        <span className="line-clamp-1">{shop.name}</span>
        {shop.is_verified && <VerifiedBadge size={13} />}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-caption text-muted">
        <IconStarFilled size={12} className="text-brass" />
        {Number(shop.rating || 0).toFixed(1)}
        {distanceKm != null && <span>· {distanceKm} km</span>}
      </span>
    </Link>
  );
}
