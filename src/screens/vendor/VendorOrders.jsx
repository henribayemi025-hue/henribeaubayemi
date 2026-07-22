import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { pushNotify } from '../../lib/notify';

const TABS = [
  { key: 'new', statuses: ['new'], label: 'vendor.orderTabsNew' },
  { key: 'inProgress', statuses: ['confirmed', 'shipped'], label: 'vendor.orderTabsInProgress' },
  { key: 'delivered', statuses: ['delivered'], label: 'vendor.orderTabsDelivered' },
  { key: 'cancelled', statuses: ['cancelled'], label: 'vendor.orderTabsCancelled' },
];

export default function VendorOrders() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const [tab, setTab] = useState('new');

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: orders, error: err } = await supabase
      .from('orders')
      .select('*, order_items(name, qty, price_fcfa)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return orders || [];
  }, [shop.id]);

  async function markShipped(order) {
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', order.id);
    pushNotify({ user_id: order.buyer_id, title: t('notifications.orderShipped'), body: `#${order.order_no}`, url: '/profile/orders' });
    retry();
  }

  const current = TABS.find((x) => x.key === tab);
  const filtered = (data || []).filter((o) => current.statuses.includes(o.status));

  return (
    <div className="pb-6">
      <AppHeader title={t('nav.orders')} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-hairline px-4 pb-2 pt-1">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`chip shrink-0 ${tab === tb.key ? 'chip-active' : 'text-ink'}`}>
            {t(tb.label)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={IconShoppingBag} title={t('vendor.noOrdersHere')} />
      ) : (
        <ul className="space-y-3 p-4">
          {filtered.map((o) => (
            <li key={o.id} className="card">
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold text-muted">#{o.order_no}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-body text-ink">{o.buyer_name || t('vendor.buyerName')}{o.buyer_phone ? ` · ${o.buyer_phone}` : ''}</p>
              <div className="mt-1 text-caption text-muted">
                {o.order_items?.map((it, i) => <span key={i}>{it.name} × {it.qty}{i < o.order_items.length - 1 ? ', ' : ''}</span>)}
              </div>
              {o.delivery_method === 'delivery' && o.address && (
                <p className="mt-1 text-caption text-muted">{o.address}, {o.city}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-caption text-muted">{t('checkout.pickup') && (o.delivery_method === 'pickup' ? t('checkout.pickup') : t('checkout.delivery'))}</span>
                <Price fcfa={o.total_fcfa} className="text-body font-semibold text-teal" />
              </div>
              {['new', 'confirmed'].includes(o.status) && (
                <Button className="mt-3" onClick={() => markShipped(o)}>{t('vendor.markShipped')}</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
