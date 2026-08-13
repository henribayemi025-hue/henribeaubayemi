import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconMinus, IconPlus, IconShoppingCart } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/states';
import { storageUrl, storageThumbUrl} from '../../lib/supabase';

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, setQty, remove, subtotal, clearShop } = useCart();

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

  const shopCount = Object.keys(byShop).length;

  return (
    <div>
      <AppHeader title={t('cart.title')} back />
      <div className="space-y-4 p-4">
        {/* Dire POURQUOI il y a un bouton par boutique.
            Un testeur, capture à l'appui: « je ne vois pas de bouton pour
            passer les deux commandes, je dois les passer une par une ? » —
            c'était une question, pas un reproche: rien à l'écran n'expliquait
            que chaque boutique prépare et livre sa propre commande. Le panier
            était déjà groupé par boutique, mais muet. */}
        {shopCount > 1 && (
          <section className="rounded-card border border-hairline bg-teal-light/60 p-3">
            <p className="text-body font-semibold text-ink">
              {t('cart.multiShopTitle', { count: shopCount })}
            </p>
            <p className="mt-1 text-caption text-muted">{t('cart.multiShopHelp')}</p>
          </section>
        )}
        {Object.entries(byShop).map(([shopId, group]) => (
          <div key={shopId} className="card">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-caption font-semibold text-muted">{group.name}</p>
              {/* Vider d'un coup tout ce qui vient de cette boutique — sans
                  ça, il fallait supprimer article par article. */}
              <button onClick={() => clearShop(shopId)} className="text-caption font-semibold text-danger">
                {t('cart.removeAll')}
              </button>
            </div>
            <div className="space-y-3">
              {group.items.map((it) => (
                <div key={it.key} className="flex gap-3">
                  <SmartImage
                    src={it.image ? storageThumbUrl('products', it.image) : null} fallbackSrc={it.image ? storageUrl('products', it.image) : null}
                    alt={it.name}
                    className="h-16 w-16 rounded-input"
                  />
                  <div className="flex-1">
                    <p className="line-clamp-1 text-body text-ink">{it.name}</p>
                    {(it.size || it.color) && (
                      <p className="text-caption text-muted">
                        {[it.size, it.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <Price fcfa={it.price_fcfa} className="text-body font-semibold text-teal" />
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center rounded-input border border-hairline">
                        <button onClick={() => setQty(it.key, it.qty - 1)} className="p-1.5 text-ink" aria-label="-"><IconMinus size={16} /></button>
                        <span className="min-w-6 text-center text-body">{it.qty}</span>
                        <button onClick={() => setQty(it.key, it.qty + 1)} className="p-1.5 text-ink" aria-label="+"><IconPlus size={16} /></button>
                      </div>
                      <button onClick={() => remove(it.key)} className="text-muted" aria-label={t('cart.remove')}>
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
        {/* Marge à droite: le bouton flottant de Finia se pose exactement là et
            recouvrait le montant du sous-total — le seul chiffre que la
            personne cherche à cet instant. */}
        <div className="flex items-center justify-between pr-16">
          <span className="text-body text-muted">{t('cart.subtotal')}</span>
          <Price fcfa={subtotal} className="text-section font-semibold text-ink" />
        </div>
        <p className="mt-1 pr-16 text-caption text-muted">{t('cart.deliveryNote')}</p>
      </div>
    </div>
  );
}
