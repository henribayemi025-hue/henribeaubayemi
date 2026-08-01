import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag, IconCheck, IconX, IconTruckDelivery, IconBuildingStore,
  IconPackage, IconPhone, IconMapPin, IconBan,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Price } from '../../components/Price';
import { Modal } from '../../components/Modal';
import { Field, TextArea } from '../../components/Field';
import { OrderStatusBadge, orderAccentColor } from '../../components/OrderStatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { pushNotify } from '../../lib/notify';
import { timeAgo } from '../../lib/format';

// Le VRAI flux marketplace (avant, un seul bouton sautait de « nouvelle » à
// « envoyée » sans validation ni refus — le constat exact de Beau):
//
//   new ──[Valider]──▶ confirmed ──[En livraison / Prête]──▶ shipped ──[Livrée]──▶ delivered
//    └──[Refuser]──▶ cancelled            └──[Annuler]──▶ cancelled     └──[Annuler]──▶ cancelled
//
// Une commande VALIDÉE ou EN LIVRAISON peut encore être annulée (stock
// manquant, cliente injoignable, incident livreur…) — ce n'est pas parce que
// la vendeuse a dit oui que plus rien ne peut arrêter la commande. C'était le
// trou signalé par Beau: « une commande peut être en cours, ensuite annulée,
// tu n'as pas pris ça en compte ».
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
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState('new');
  const [busyId, setBusyId] = useState(null);
  const [cancelling, setCancelling] = useState(null); // commande en cours de refus/annulation (modal)
  const [cancelReason, setCancelReason] = useState('');

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

  // Refus (commande jamais acceptée) ET annulation (commande déjà validée ou
  // en livraison) partagent le même geste — seul le libellé change, parce
  // que dire « refusée » d'une commande déjà validée serait faux.
  const wasAccepted = cancelling?.status !== 'new';
  async function confirmCancel() {
    const o = cancelling;
    setCancelling(null);
    await transition(
      o,
      { status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: cancelReason.trim() || null },
      wasAccepted ? 'notifications.orderCancelledAfterConfirm' : 'notifications.orderDeclined'
    );
    setCancelReason('');
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
          {filtered.map((o) => {
            const itemCount = (o.order_items || []).reduce((n, it) => n + it.qty, 0);
            return (
              <li key={o.id} className={`card overflow-hidden !rounded-l-none border-l-4 ${orderAccentColor(o.status, o.delivery_method)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-body font-semibold text-ink">#{o.order_no}</p>
                    <p className="text-caption text-muted">{timeAgo(o.created_at, i18n.language)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} method={o.delivery_method} />
                </div>

                {/* Acheteuse — pastille d'initiale + nom/téléphone, plus
                    lisible qu'une simple ligne de texte perdue dans la carte. */}
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-light text-body font-semibold text-teal">
                    {(o.buyer_name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-ink">{o.buyer_name || t('vendor.buyerName')}</p>
                    {o.buyer_phone && (
                      <a href={`tel:${o.buyer_phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-1 text-caption font-semibold text-teal">
                        <IconPhone size={12} /> {o.buyer_phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Les articles avec leur variante (« Robe (XL · Rouge) ») —
                    c'est la liste de préparation de la boutique. */}
                <div className="mt-3 space-y-1 rounded-input bg-base p-2.5">
                  {o.order_items?.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-caption text-ink">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <IconPackage size={13} className="shrink-0 text-muted" />
                        <span className="truncate">{it.name}</span>
                        <span className="shrink-0 rounded-pill bg-white px-1.5 text-[11px] font-semibold text-muted">×{it.qty}</span>
                      </span>
                      <Price fcfa={it.price_fcfa * it.qty} className="shrink-0 font-medium text-muted" />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-caption font-medium text-muted">
                    {o.delivery_method === 'pickup' ? <IconBuildingStore size={15} /> : <IconTruckDelivery size={15} />}
                    {o.delivery_method === 'pickup' ? t('checkout.pickup') : t('checkout.delivery')}
                    <span className="text-hairline">·</span>
                    {t('vendor.itemCount', { count: itemCount })}
                  </span>
                  <Price fcfa={o.total_fcfa} className="text-section font-semibold text-teal" />
                </div>
                {o.delivery_method === 'delivery' && o.address && (
                  <p className="mt-1.5 flex items-start gap-1 text-caption text-muted">
                    <IconMapPin size={14} className="mt-0.5 shrink-0" /> {o.address}{o.city ? `, ${o.city}` : ''}
                  </p>
                )}
                {o.status === 'cancelled' && o.cancel_reason && (
                  <p className="mt-2 rounded-card bg-danger-bg p-2 text-caption text-danger">
                    {t(o.confirmed_at ? 'orderStatus.cancelReasonShown' : 'orderStatus.declineReasonShown', { reason: o.cancel_reason })}
                  </p>
                )}

                {/* Actions selon l'étape — jamais de saut d'étape possible,
                    mais annulation toujours possible tant que ce n'est pas livré. */}
                {o.status === 'new' && (
                  <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                    <Button loading={busyId === o.id} onClick={() => accept(o)} className="flex-1">
                      <IconCheck size={18} /> {t('vendor.acceptOrder')}
                    </Button>
                    <Button variant="secondary" disabled={busyId === o.id} onClick={() => setCancelling(o)} className="flex-1">
                      <IconX size={18} /> {t('vendor.declineOrder')}
                    </Button>
                  </div>
                )}
                {o.status === 'confirmed' && (
                  <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                    <Button loading={busyId === o.id} onClick={() => ship(o)} className="flex-1">
                      {o.delivery_method === 'pickup' ? <IconBuildingStore size={18} /> : <IconTruckDelivery size={18} />}
                      {o.delivery_method === 'pickup' ? t('vendor.markReady') : t('vendor.markShipping')}
                    </Button>
                    <button
                      type="button"
                      aria-label={t('vendor.cancelOrder')}
                      title={t('vendor.cancelOrder')}
                      disabled={busyId === o.id}
                      onClick={() => setCancelling(o)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-danger/40 text-danger transition-colors duration-150 hover:bg-danger-bg disabled:pointer-events-none disabled:opacity-50"
                    >
                      <IconBan size={19} />
                    </button>
                  </div>
                )}
                {o.status === 'shipped' && (
                  <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                    <Button loading={busyId === o.id} onClick={() => deliver(o)} className="flex-1">
                      <IconCheck size={18} /> {t('vendor.markDelivered')}
                    </Button>
                    <button
                      type="button"
                      aria-label={t('vendor.cancelOrder')}
                      title={t('vendor.cancelOrder')}
                      disabled={busyId === o.id}
                      onClick={() => setCancelling(o)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-danger/40 text-danger transition-colors duration-150 hover:bg-danger-bg disabled:pointer-events-none disabled:opacity-50"
                    >
                      <IconBan size={19} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Refus/annulation: le label du champ dit "(optionnel)" en toutes
          lettres — Beau: "il y a une raison optionnelle mais ça ne précise
          pas optionnel", ça ne pouvait rester dans une phrase d'aide à part. */}
      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title={t(wasAccepted ? 'vendor.cancelTitle' : 'vendor.declineTitle')}>
        <p className="mb-3 text-caption text-muted">{t(wasAccepted ? 'vendor.cancelHint' : 'vendor.declineHint')}</p>
        <Field label={`${t('vendor.declineReasonLabel')} ${t('common.optional')}`}>
          {(id) => (
            <TextArea
              id={id}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('vendor.declinePlaceholder')}
            />
          )}
        </Field>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => setCancelling(null)} className="flex-1">{t('common.cancel')}</Button>
          <Button onClick={confirmCancel} className="flex-1">
            <IconX size={18} /> {t(wasAccepted ? 'vendor.cancelConfirm' : 'vendor.declineConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
