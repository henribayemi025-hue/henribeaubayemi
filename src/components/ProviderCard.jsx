import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconStarFilled, IconMapPin, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { ShopAvatar } from './ShopAvatar';
import { ShopBanner } from './ShopBanner';
import { Price } from './Price';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { isServiceCategory } from '../lib/categories';

// Carte prestataire riche: couverture + métier + portfolio + note + prix
// d'appel. Remplace la ligne de liste plate (avatar + nom + note), qui ne
// donnait aucune raison de cliquer et faisait paraître l'annuaire vide même
// quand il ne l'était pas.
//
// RÈGLE: tout ce qui s'affiche vient de la base. Pas de note ni de "142 avis"
// décoratifs — une fiche sans avis affiche « Nouveau », une fiche sans
// catalogue n'affiche simplement pas de prix d'appel. Rien d'inventé.
export function ProviderCard({ shop, portfolio = [], reviewCount = 0, fromPriceFcfa = null, km = null, onBook }) {
  const { t, i18n } = useTranslation();
  const trade = (shop.categories ?? []).find(isServiceCategory);
  const banner = shop.banner_url ? storageUrl('shops', shop.banner_url) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-hairline bg-white shadow-sm transition-transform duration-150 active:scale-[0.995]">
      {/* Couverture + métier + avatar débordant, façon fiche pro. */}
      <Link to={`/boutique/${shop.slug}`} className="relative block">
        <ShopBanner src={banner} name={shop.name} seed={shop.id} className="h-32 w-full sm:h-36" />
        {trade && (
          <span className="absolute left-3 top-3 rounded-pill bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            {t(`categories.${trade}`)}
          </span>
        )}
        {km != null && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-pill bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink shadow-sm">
            <IconMapPin size={12} className="text-teal" /> {km} km
          </span>
        )}
        <div className="absolute -bottom-6 left-3">
          <ShopAvatar
            src={shop.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null}
            fallbackSrc={shop.avatar_url ? storageUrl('shops', shop.avatar_url) : null}
            name={shop.name}
            seed={shop.id}
            className="h-14 w-14 border-[3px] border-white shadow-md"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-8">
        <Link to={`/boutique/${shop.slug}`} className="flex items-start gap-1">
          <h3 className="line-clamp-1 text-body font-semibold text-ink">{shop.name}</h3>
          {shop.is_verified && (
            <IconRosetteDiscountCheckFilled size={16} className="mt-0.5 shrink-0 text-teal" aria-label={t('common.verified')} />
          )}
        </Link>
        {(shop.city || shop.neighborhood) && (
          <p className="mt-0.5 flex items-center gap-1 text-caption text-muted">
            <IconMapPin size={12} /> {[shop.neighborhood, shop.city].filter(Boolean).join(', ')}
          </p>
        )}
        {shop.bio && <p className="mt-1.5 line-clamp-2 text-caption text-muted">{shop.bio}</p>}

        {/* Portfolio: les vraies photos du catalogue de la boutique — ce qui
            transforme une fiche administrative en vitrine. */}
        {portfolio.length > 0 && (
          <div className="mt-2.5 flex gap-1.5">
            {portfolio.slice(0, 3).map((path) => (
              <SmartImage
                key={path}
                src={storageThumbUrl('products', path)}
                fallbackSrc={storageUrl('products', path)}
                alt=""
                className="h-14 w-14 shrink-0 rounded-input"
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-hairline pt-2.5">
          <div className="min-w-0">
            {reviewCount > 0 ? (
              <p className="flex items-center gap-1 text-caption font-semibold text-ink">
                <IconStarFilled size={13} className="text-brass" />
                {Number(shop.rating || 0).toFixed(2)}
                <span className="font-normal text-muted">
                  ({t('provider.reviewCount', { count: reviewCount })})
                </span>
              </p>
            ) : (
              <span className="rounded-pill bg-teal-light px-2 py-0.5 text-[11px] font-semibold text-teal">
                {t('provider.isNew')}
              </span>
            )}
            {fromPriceFcfa != null && (
              <p className="mt-0.5 truncate text-caption font-semibold text-teal">
                {t('provider.fromPrice')} <Price fcfa={fromPriceFcfa} />
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Link
              to={`/boutique/${shop.slug}`}
              className="rounded-input border border-hairline px-3 py-1.5 text-caption font-semibold text-ink"
            >
              {t('provider.details')}
            </Link>
            <button
              type="button"
              onClick={() => onBook?.(shop)}
              className="rounded-input bg-teal px-3 py-1.5 text-caption font-semibold text-white transition active:scale-95"
            >
              {t('provider.book')}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
