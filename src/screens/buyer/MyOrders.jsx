import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag, IconRotateClockwise2, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { ReviewModal } from '../../components/ReviewModal';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';

export default function MyOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rebuyingId, setRebuyingId] = useState(null);
  const [params, setParams] = useSearchParams();

  // Coming back from Stripe checkout: confirm success once and clean the URL.
  useEffect(() => {
    if (params.get('paid')) {
      toast.success(t('checkout.paymentSuccess'));
      params.delete('paid');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: orders, error: err } = await supabase
      .from('orders')
      .select('*, shops(name), order_items(product_id, name, qty, price_fcfa), reviews(id)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return orders || [];
  }, [user]);

  async function markReceived(order) {
    // « J'ai bien reçu » clôt VRAIMENT la commande: statut livré + horodatage,
    // pas juste un drapeau interne — la timeline se remplit des deux côtés.
    await supabase
      .from('orders')
      .update({ buyer_received: true, status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', order.id);
    retry();
  }

  // Racheter: repart des mêmes articles, mais avec le PRIX ET LE STOCK
  // ACTUELS — jamais l'ancien prix payé, qui peut avoir changé depuis. Un
  // article retiré du catalogue depuis (product_id perdu ou plus actif) est
  // silencieusement sauté; on prévient seulement s'il n'en reste aucun.
  async function rebuy(order) {
    const ids = (order.order_items || []).map((it) => it.product_id).filter(Boolean);
    if (ids.length === 0) {
      toast.error(t('orderStatus.rebuyNoneAvailable'));
      return;
    }
    setRebuyingId(order.id);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price_fcfa, images, shop_id, stock, is_active')
        .in('id', ids);
      if (error) throw error;
      const available = (products || []).filter((p) => p.is_active && p.stock > 0);
      if (available.length === 0) {
        toast.error(t('orderStatus.rebuyNoneAvailable'));
        return;
      }
      available.forEach((p) => add({ ...p, shop_name: order.shops?.name }));
      if (available.length < ids.length) toast.info(t('orderStatus.rebuyPartial'));
      else toast.success(t('orderStatus.rebuyAdded'));
      navigate('/cart');
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setRebuyingId(null);
    }
  }

  if (loading) return <div className="space-y-3 p-4"><AppHeader title={t('profile.myOrders')} back />{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div>
      <AppHeader title={t('profile.myOrders')} back />
      {data.length === 0 ? (
        <EmptyState icon={IconShoppingBag} title={t('profile.noOrders')} />
      ) : (
        <ul className="space-y-3 p-4">
          {data.map((o) => {
            const reviewed = o.reviews?.length > 0;
            return (
              <li key={o.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold text-muted">#{o.order_no}</p>
                  <OrderStatusBadge status={o.status} method={o.delivery_method} />
                </div>
                <p className="mt-1 text-body font-semibold text-ink">{o.shops?.name}</p>
                <div className="mt-1 text-caption text-muted">
                  {o.order_items?.map((it, i) => <span key={i}>{it.name} × {it.qty}{i < o.order_items.length - 1 ? ', ' : ''}</span>)}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Price fcfa={o.total_fcfa} className="text-body font-semibold text-teal" />
                </div>

                {/* Suivi visuel: on voit OÙ en est la commande, avec l'heure de
                    chaque étape — fini le mystère entre « commandé » et
                    « reçu ». Une commande refusée montre la raison. */}
                {o.status === 'cancelled' ? (
                  <p className="mt-3 rounded-card bg-danger-bg p-3 text-caption text-danger">
                    {o.cancel_reason
                      ? t('orderStatus.declineReasonShown', { reason: o.cancel_reason })
                      : t('orderStatus.cancelledNoReason')}
                  </p>
                ) : (
                  <OrderTimeline order={o} />
                )}

                <div className="mt-3 space-y-2">
                  {o.status === 'shipped' && !o.buyer_received && (
                    <Button variant="secondary" onClick={() => markReceived(o)}>{t('orderStatus.markReceived')}</Button>
                  )}
                  {o.buyer_received && !reviewed && (
                    <Button onClick={() => setReviewOrder(o)}>{t('orderStatus.leaveReview')}</Button>
                  )}
                  {['new', 'confirmed'].includes(o.status) && (
                    <p className="text-caption text-muted">{t('orderStatus.reviewLocked')}</p>
                  )}
                  {/* Disponible dès qu'une commande est passée — pas besoin
                      d'attendre la livraison pour vouloir recommander la
                      même chose. */}
                  <Button
                    variant="secondary"
                    loading={rebuyingId === o.id}
                    disabled={rebuyingId != null && rebuyingId !== o.id}
                    onClick={() => rebuy(o)}
                  >
                    <IconRotateClockwise2 size={18} /> {t('orderStatus.rebuy')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ReviewModal open={!!reviewOrder} onClose={() => setReviewOrder(null)} order={reviewOrder || {}} onDone={retry} />
    </div>
  );
}

// Timeline horizontale à 4 étapes: Commandée → Validée → En livraison (ou
// Prête en boutique) → Livrée. Chaque étape franchie est pleine + horodatée;
// l'étape en cours pulse doucement pour dire « c'est ici que ça se passe ».
function OrderTimeline({ order }) {
  const { t, i18n } = useTranslation();
  const pickup = order.delivery_method === 'pickup';
  const steps = [
    { key: 'placed', label: t('orderTrack.placed'), at: order.created_at },
    { key: 'validated', label: t('orderTrack.validated'), at: order.confirmed_at },
    { key: 'shipping', label: pickup ? t('orderTrack.ready') : t('orderTrack.shipping'), at: order.shipped_at },
    { key: 'delivered', label: t('orderTrack.delivered'), at: order.delivered_at },
  ];
  // L'étape courante = la première non atteinte.
  const currentIdx = steps.findIndex((s) => !s.at);
  const fmt = (iso) =>
    new Date(iso).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="mt-3 rounded-card border border-hairline p-3">
      <div className="flex items-start">
        {steps.map((s, i) => {
          const done = !!s.at;
          const active = i === currentIdx;
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : done || active ? 'bg-teal' : 'bg-hairline'}`} />
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    done ? 'bg-teal text-white' : active ? 'animate-pulse border-2 border-teal bg-white' : 'border-2 border-hairline bg-white'
                  }`}
                >
                  {done && <IconCheck size={12} />}
                </div>
                <div className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'bg-transparent' : done ? 'bg-teal' : 'bg-hairline'}`} />
              </div>
              <span className={`mt-1 text-center text-[11px] leading-tight ${done || active ? 'font-semibold text-ink' : 'text-muted'}`}>
                {s.label}
              </span>
              {s.at && <span className="text-[10px] text-muted">{fmt(s.at)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
