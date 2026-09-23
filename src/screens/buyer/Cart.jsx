import { useNavigate } from 'react-router-dom';
import { prixLigne } from '../../lib/prixLigne';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconMinus, IconPlus, IconShoppingCart } from '@tabler/icons-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState } from '../../components/states';
import { storageUrl, storageThumbUrl} from '../../lib/supabase';

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, setQty, remove, subtotal, pendingCount, clearShop, ouvrirDemande } = useCart();
  const { user } = useAuth();
  // Sans compte, « Passer commande » n'envoie plus vers la page de
  // connexion (c'est là qu'on perdait tout le monde): un prénom, un numéro
  // WhatsApp, et la demande part chez la vendeuse (DemandeInvite).
  const commander = (shopId, group) => (user
    ? navigate(`/checkout/${shopId}`)
    : ouvrirDemande({ shop_id: shopId, shop_name: group.name, items: group.items.map((it) => ({ id: it.id, qty: it.qty, size: it.size, color: it.color })) }));

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
                    {/* Un prix qu'on ne connaît pas ne s'écrit pas en chiffres.
                        « 0 FCFA » ferait croire que c'est gratuit. */}
                    {it.price_on_request ? (
                      <p className="text-body font-semibold text-brass">{t('cart.priceToConfirm')}</p>
                    ) : (
                      <Price fcfa={prixLigne(it)} className="text-body font-semibold text-teal" />
                    )}
                    {/* Achat groupé (0172): le prix de lot, atteint ou à portée. */}
                    {!it.price_on_request && it.lot_qty && it.lot_price_fcfa && (
                      <p className={`text-caption ${it.qty >= it.lot_qty ? 'font-semibold text-success' : 'text-muted'}`}>
                        {it.qty >= it.lot_qty ? t('cart.lotApplied', { count: it.lot_qty }) : <>{t('product.lotFrom', { count: it.lot_qty })} <Price fcfa={it.lot_price_fcfa} /> {t('product.lotEach')}</>}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center rounded-input border border-hairline">
                        <button onClick={() => setQty(it.key, it.qty - 1)} disabled={it.qty <= 1} className="p-1.5 text-ink disabled:opacity-30" aria-label="-"><IconMinus size={16} /></button>
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
            <Button className="mt-3" onClick={() => commander(shopId, group)}>
              {t('cart.checkout')}
            </Button>
          </div>
        ))}
      </div>

      {/* La barre de navigation flotte au-dessus du bas de l'écran: sans
          cette réserve, elle recouvre le bouton et le vol au pouce. */}
      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        {/* Marge à droite: le bouton flottant de Finia se pose exactement là et
            recouvrait le montant du sous-total — le seul chiffre que la
            personne cherche à cet instant. */}
        <div className="flex items-center justify-between pr-16">
          <span className="text-body text-muted">{t('cart.subtotal')}</span>
          {/* Quand RIEN dans le panier n'a de prix, « 0 » est trompeur: ce
              n'est pas gratuit, c'est inconnu. Vérifié au navigateur, le
              panier affichait « Sous-total 0,00 ». */}
          {pendingCount === items.length ? (
            <span className="text-section font-semibold text-brass">{t('checkout.quoteTotalPending')}</span>
          ) : (
            <Price fcfa={subtotal} className="text-section font-semibold text-ink" />
          )}
        </div>
        {/* Le sous-total ne compte que les articles dont le prix est connu.
            Le dire, sinon le chiffre a l'air faux. */}
        {pendingCount > 0 && (
          <p className="mt-1 pr-16 text-caption font-semibold text-brass">
            {t('cart.pendingNote', { count: pendingCount })}
          </p>
        )}
        <p className="mt-1 pr-16 text-caption text-muted">{t('cart.deliveryNote')}</p>
        {/* Le bouton que le testeur cherchait: un seul passage pour toutes les
            boutiques. Il n'apparaît que s'il y en a plusieurs — avec une seule
            boutique, « Passer commande » au-dessus fait déjà exactement ça, et
            un second bouton identique ne ferait qu'hésiter. */}
        {shopCount > 1 && (
          <Button className="mt-3" onClick={() => navigate('/checkout/tout')}>
            {t('cart.checkoutAll')}
          </Button>
        )}
      </div>
    </div>
  );
}
