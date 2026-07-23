import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { ReviewModal } from '../../components/ReviewModal';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';

export default function MyOrders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [reviewOrder, setReviewOrder] = useState(null);
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
      .select('*, shops(name), order_items(name, qty, price_fcfa), reviews(id)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return orders || [];
  }, [user]);

  async function markReceived(order) {
    await supabase.from('orders').update({ buyer_received: true }).eq('id', order.id);
    retry();
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
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-body font-semibold text-ink">{o.shops?.name}</p>
                <div className="mt-1 text-caption text-muted">
                  {o.order_items?.map((it, i) => <span key={i}>{it.name} × {it.qty}{i < o.order_items.length - 1 ? ', ' : ''}</span>)}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Price fcfa={o.total_fcfa} className="text-body font-semibold text-teal" />
                </div>
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
