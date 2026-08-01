import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag, IconCheck, IconX, IconTruckDelivery, IconBuildingStore,
  IconPackage, IconPhone, IconMapPin,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Modal } from '../../components/Modal';
import { TextArea } from '../../components/Field';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { pushNotify } from '../../lib/notify';

// Le VRAI flux marketplace (avant, un seul bouton sautait de « nouvelle » à
// « envoyée » sans validation ni refus — le constat exact de Beau):
//
//   new ──[Valider]──▶ confirmed ──[En livraison / Prête]──▶ shipped ──[Livrée]──▶ delivered
//    └──[Refuser (raison optionnelle)]──▶ cancelled
//
// Chaque transition est horodatée (timeline côté acheteuse) et notifiée
// (push + e-mail). Un rappel Finia automatique (pg_cron, toutes les 6 h)
// relance les boutiques qui laissent des commandes « new » sans réponse.
const TABS = [
  { key: 'new', statuses: ['new'], label: 'vendor.orderTabsNew' },
  { key: 'inProgress', statuses: ['confirmed', 'shipped'], label: 'vendor.orderTabsInProgress' },
  { key: 'delivered', statuses: ['delivered'], label: 'vendor.orderTabsDelivered' },
  { key: 'cancelled', statuses: ['cancelled'], label: 'vendor.orderTabsCancelled' },
];

export default function VendorOrders() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState('new');
  const [busyId, setBusyId] = useState(null);
  const [declining, setDeclining] = useState(null); // commande en cours de refus (modal)
  const [declineReason, setDeclineReason] = useState('');

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: orders, error: err } = await supabase
      .from('orders')
      .select('*, order_items(name, qty, price_fcfa)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return orders || [];
  }, [shop.id]);

  // Toutes les transitions passent ici: patch + horodatage + notification
  // acheteuse. La commande ne peut avancer QUE dans l'ordre du flux.
  async function transition(order, patch, notifKey) {
    setBusyId(order.id);
    try {
      const { error: err } = await supabase.from('orders').update(patch).eq('id', order.id);
      if (err) throw err;
      pushNotify({
        user_id: order.buyer_id,
        title: t(notifKey),
        body: `#${order.order_no}${patch.cancel_reason ? ` — ${patch.cancel_reason}` : ''}`,
        url: '/profile/orders',
      });
      retry();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setBusyId(null);
    }
  }

  const accept = (o) =>
    transition(o, { status: 'confirmed', confirmed_at: new Date().toISOString() }, 'notifications.orderValidated');
  const ship = (o) =>
    transition(
      o,
      { status: 'shipped', shipped_at: new Date().toISOString() },
      o.delivery_method === 'pickup' ? 'notifications.orderReady' : 'notifications.orderShipped'
    );
  const deliver = (o) =>
    transition(o, { status: 'delivered', delivered_at: new Date().toISOString() }, 'notifications.orderDelivered');

  async function decline() {
    const o = declining;
    setDeclining(null);
    await transition(
      o,
      { status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: declineReason.trim() || null },
      'notifications.orderDeclined'
    );
    setDeclineReason('');
  }

  const current = TABS.find((x) => x.key === tab);
  const filtered = (data || []).filter((o) => current.statuses.includes(o.status));
  const counts = Object.fromEntries(
    TABS.map((tb) => [tb.key, (data || []).filter((o) => tb.statuses.includes(o.status)).length])
  );

  return (
    <div className="pb-6">
      <AppHeader title={t('nav.orders')} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-hairline px-4 pb-2 pt-1">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`chip shrink-0 ${tab === tb.key ? 'chip-active' : 'text-ink'}`}>
            {t(tb.label)}
            {counts[tb.key] > 0 && <span className="ml-1 font-semibold">({counts[tb.key]})</span>}
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
                <OrderStatusBadge status={o.status} method={o.delivery_method} />
              </div>

              <p className="mt-1 text-body font-semibold text-ink">{o.buyer_name || t('vendor.buyerName')}</p>
              {o.buyer_phone && (
                <a href={`tel:${o.buyer_phone.replace(/[^+\d]/g, '')}`} className="mt-0.5 flex items-center gap-1 text-caption font-semibold text-teal">
                  <IconPhone size={14} /> {o.buyer_phone}
                </a>
              )}

              {/* Les articles avec leur variante (« Robe (XL · Rouge) ») —
                  c'est la liste de préparation de la boutique. */}
              <ul className="mt-2 space-y-0.5 border-t border-hairline pt-2">
                {o.order_items?.map((it, i) => (
                  <li key={i} className="flex justify-between gap-2 text-caption text-ink">
                    <span className="flex items-start gap-1"><IconPackage size={14} className="mt-0.5 shrink-0 text-muted" /> {it.name} × {it.qty}</span>
                    <Price fcfa={it.price_fcfa * it.qty} className="shrink-0 text-muted" />
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2">
                <span className="flex items-center gap-1 text-caption text-muted">
                  {o.delivery_method === 'pickup' ? <IconBuildingStore size={15} /> : <IconTruckDelivery size={15} />}
                  {o.delivery_method === 'pickup' ? t('checkout.pickup') : t('checkout.delivery')}
                </span>
                <Price fcfa={o.total_fcfa} className="text-body font-semibold text-teal" />
              </div>
              {o.delivery_method === 'delivery' && o.address && (
                <p className="mt-1 flex items-start gap-1 text-caption text-muted">
                  <IconMapPin size={14} className="mt-0.5 shrink-0" /> {o.address}{o.city ? `, ${o.city}` : ''}
                </p>
              )}
              {o.status === 'cancelled' && o.cancel_reason && (
                <p className="mt-2 rounded-card bg-danger-bg p-2 text-caption text-danger">{t('orderStatus.declineReasonShown', { reason: o.cancel_reason })}</p>
              )}

              {/* Actions selon l'étape — jamais de saut d'étape possible. */}
              {o.status === 'new' && (
                <div className="mt-3 flex gap-2">
                  <Button loading={busyId === o.id} onClick={() => accept(o)} className="flex-1">
                    <IconCheck size={18} /> {t('vendor.acceptOrder')}
                  </Button>
                  <Button variant="secondary" disabled={busyId === o.id} onClick={() => setDeclining(o)} className="flex-1">
                    <IconX size={18} /> {t('vendor.declineOrder')}
                  </Button>
                </div>
              )}
              {o.status === 'confirmed' && (
                <Button className="mt-3" loading={busyId === o.id} onClick={() => ship(o)}>
                  {o.delivery_method === 'pickup' ? <IconBuildingStore size={18} /> : <IconTruckDelivery size={18} />}
                  {o.delivery_method === 'pickup' ? t('vendor.markReady') : t('vendor.markShipping')}
                </Button>
              )}
              {o.status === 'shipped' && (
                <Button className="mt-3" variant="secondary" loading={busyId === o.id} onClick={() => deliver(o)}>
                  <IconCheck size={18} /> {t('vendor.markDelivered')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Refus: la raison est OPTIONNELLE mais toujours proposée — une
          acheteuse refusée sans explication ne revient pas. */}
      <Modal open={!!declining} onClose={() => setDeclining(null)} title={t('vendor.declineTitle')}>
        <p className="mb-2 text-caption text-muted">{t('vendor.declineHint')}</p>
        <TextArea
          id="decline-reason"
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder={t('vendor.declinePlaceholder')}
        />
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => setDeclining(null)} className="flex-1">{t('common.cancel')}</Button>
          <Button onClick={decline} className="flex-1">
            <IconX size={18} /> {t('vendor.declineConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
