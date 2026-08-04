import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSparkles, IconRefresh } from '@tabler/icons-react';
import { SmartImage } from './SmartImage';
import { ProductVideo } from './ProductVideo';
import { PriceBlock, PromoBadge, discountPercent } from './Price';
import { isPriceOnRequest, MIRROR_CATEGORIES, categoryHeadFor } from '../lib/categories';
import { storageUrl, storageThumbUrl } from '../lib/supabase';
import { track } from '../lib/track';

// 2-column grid product card. Memoized to avoid re-renders on parent state churn.
function ProductCardBase({ product }) {
  const { t } = useTranslation();
  const quote = isPriceOnRequest(product);
  const img = product.images?.[0] ? storageThumbUrl('products', product.images[0]) : null;
  const imgFallback = product.images?.[0] ? storageUrl('products', product.images[0]) : null;
  // Repère discret pour l'essayage virtuel — avant, il fallait déjà être entré
  // dans la fiche produit pour découvrir que Miroir IA existe. Un badge minuscule
  // (icône seule, coin de la photo) suffit à le signaler dès la grille, sans
  // alourdir visuellement la carte.
  const canMirror = !quote && MIRROR_CATEGORIES.includes(product.category);
  const outOfStock = product.stock === 0 && !quote;
  // Décision produit du 31/07: pas de page dédiée "Ventes flash / 2nde main",
  // juste un repère sur les fiches concernées. La remise EST le repère de
  // vente flash; la seconde main se lit sur la catégorie du rayon.
  const pct = quote ? null : discountPercent(product.price_fcfa, product.compare_at_price_fcfa);
  const secondHand = categoryHeadFor(product.category) === 'seconde_main';
  return (
    <Link
      to={`/product/${product.id}`}
      onClick={() => track('product_click', product.id)}
      className="block overflow-hidden rounded-card border border-hairline bg-white transition-transform duration-150 active:scale-[0.99]"
    >
      <div className="relative">
        {/* La vidéo remplace la photo de couverture quand il y en a une —
            c'est elle qui fait vivre le fil. La photo reste le repli pour
            tout le catalogue existant. */}
        {product.video_url ? (
          <ProductVideo videoUrl={product.video_url} poster={img} alt={product.name} className="aspect-square w-full" />
        ) : (
          <SmartImage src={img} fallbackSrc={imgFallback} alt={product.name} className="aspect-square w-full" />
        )}
        {/* Un article épuisé n'est pas une bonne affaire: la rupture prime sur
            la promo, jamais les deux pastilles au même endroit. */}
        {outOfStock ? (
          <span className="absolute left-2 top-2 rounded-pill bg-danger-bg px-2 py-0.5 text-caption font-semibold text-danger">
            {t('product.outOfStock')}
          </span>
        ) : pct ? (
          <PromoBadge percent={pct} className="absolute left-2 top-2" />
        ) : null}
        {canMirror && (
          <span
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-brass shadow-sm"
            aria-label={t('mirror.tryOnButton')}
            title={t('mirror.tryOnButton')}
          >
            <IconSparkles size={13} />
          </span>
        )}
        {secondHand && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-pill bg-white/90 px-2 py-0.5 text-caption font-semibold text-brass shadow-sm">
            <IconRefresh size={12} /> {t('product.secondHandBadge')}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-body text-ink">{product.name}</p>
        {quote ? (
          <p className="mt-1 text-caption font-semibold text-brass">{t('product.priceOnRequest')}</p>
        ) : (
          <PriceBlock
            fcfa={product.price_fcfa}
            compareAtFcfa={product.compare_at_price_fcfa}
            className="mt-1 block text-body font-semibold text-teal"
          />
        )}
        {product.shop_name && <p className="mt-0.5 line-clamp-1 text-caption text-muted">{product.shop_name}</p>}
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardBase);
