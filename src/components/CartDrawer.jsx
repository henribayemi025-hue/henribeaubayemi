import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconCircleCheckFilled, IconX } from '@tabler/icons-react';
import { useCart } from '../hooks/useCart';
import { SmartImage } from './SmartImage';
import { Price } from './Price';
import { storageUrl } from '../lib/supabase';

// Confirmation mini-drawer shown after "Add to cart" — lets the buyer jump to
// the cart or keep shopping without a full-page navigation. Auto-dismisses.
export default function CartDrawer() {
  const { t } = useTranslation();
  const { justAdded, dismissJustAdded, count, subtotal } = useCart();

  useEffect(() => {
    if (!justAdded) return undefined;
    const id = setTimeout(dismissJustAdded, 4500);
    return () => clearTimeout(id);
  }, [justAdded, dismissJustAdded]);

  if (!justAdded) return null;
  const { item } = justAdded;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto max-w-app px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="animate-slide-up pointer-events-auto overflow-hidden rounded-card border border-hairline bg-base shadow-xl"
      >
        <div className="flex items-center gap-3 p-3">
          <IconCircleCheckFilled size={22} className="shrink-0 text-success" />
          <SmartImage
            src={item.image ? storageUrl('products', item.image) : null}
            alt={item.name}
            className="h-11 w-11 shrink-0"
            rounded="rounded-input"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-ink">{item.name}</p>
            <p className="text-caption text-muted">{t('cart.addedToCart')}</p>
          </div>
          <button onClick={dismissJustAdded} aria-label={t('common.close')} className="shrink-0 rounded-full p-1 text-muted hover:bg-hairline">
            <IconX size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 border-t border-hairline p-3">
          <div className="flex-1 text-caption text-muted">
            {t('cart.itemsCount', { count })} · <Price fcfa={subtotal} className="font-semibold text-teal" />
          </div>
          <button onClick={dismissJustAdded} className="rounded-input px-3 py-2 text-caption font-semibold text-teal">
            {t('cart.continueShopping')}
          </button>
          <Link
            to="/cart"
            onClick={dismissJustAdded}
            className="rounded-input bg-teal px-4 py-2 text-caption font-semibold text-white transition active:scale-95"
          >
            {t('cart.viewCart')}
          </Link>
        </div>
      </div>
    </div>
  );
}
