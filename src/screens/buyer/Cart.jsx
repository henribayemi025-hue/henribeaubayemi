import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconMinus, IconPlus, IconShoppingCart } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/states';
import { storageUrl } from '../../lib/supabase';

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, setQty, remove, subtotal } = useCart();

  // Group by shop so each order/checkout targets a single vendor.
  const byShop = items.reduce((acc, it) => {
    (acc[it.shop_id] = acc[it.shop_id] || { name: it.shop_name, items: [] }).items.push(it);
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div>
        <AppHeader title={t('cart.title')} back />
        <EmptyState
          icon={IconShoppingCart}
          title={t('cart.empty')}
          action={<Button onClick={() => navigate('/')}>{t('cart.continueShopping')}</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <AppHeader title={t('cart.title')} back />
      <div className="space-y-4 p-4">
        {Object.entries(byShop).map(([shopId, group]) => (
          <div key={shopId} className="card">
            <p className="mb-3 text-caption font-semibold text-muted">{group.name}</p>
            <div className="space-y-3">
              {group.items.map((it) => (
                <div key={it.id} className="flex gap-3">
                  <SmartImage
                    src={it.image ? storageUrl('products', it.image) : null}
                    alt={it.name}
                    className="h-16 w-16 rounded-input"
                  />
                  <div className="flex-1">
                    <p className="line-clamp-1 text-body text-ink">{it.name}</p>
                    <Price fcfa={it.price_fcfa} className="text-body font-semibold text-teal" />
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center rounded-input border border-hairline">
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="p-1.5 text-ink" aria-label="-"><IconMinus size={16} /></button>
                        <span className="min-w-6 text-center text-body">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="p-1.5 text-ink" aria-label="+"><IconPlus size={16} /></button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-muted" aria-label={t('cart.remove')}>
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-3" onClick={() => navigate(`/checkout/${shopId}`)}>
              {t('cart.checkout')}
            </Button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-body text-muted">{t('cart.subtotal')}</span>
          <Price fcfa={subtotal} className="text-section font-semibold text-ink" />
        </div>
        <p className="mt-1 text-caption text-muted">{t('cart.deliveryNote')}</p>
      </div>
    </div>
  );
}
