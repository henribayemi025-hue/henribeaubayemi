import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag, IconTruckDelivery, IconBuildingStore, IconPhone } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { Price } from '../../components/Price';
import { OrderStatusBadge, orderAccentColor } from '../../components/OrderStatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const TABS = [
  { key: 'all', statuses: null },
  { key: 'new', statuses: ['new'] },
  { key: 'inProgress', statuses: ['confirmed', 'shipped'] },
  { key: 'delivered', statuses: ['delivered'] },
  { key: 'cancelled', statuses: ['cancelled'] },
];

// Toutes les commandes de la plateforme, toutes boutiques confondues. En
// lecture seule volontairement: faire avancer une commande reste le geste de
// la boutique qui la prépare — l'administration observe et arbitre, elle ne
// se substitue pas à la vendeuse.
export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('all');

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('orders')
      .select('id, order_no, status, total_fcfa, created_at, buyer_name, buyer_phone, delivery_method, city, cancel_reason, shops(name), order_items(name, qty)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) throw err;
    return rows || [];
  }, []);

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const countFor = (tb) => (tb.statuses ? (data || []).filter((o) => tb.statuses.includes(o.status)).length : (data || []).length);
  const current = TABS.find((x) => x.key === tab);
  const list = current.statuses ? (data || []).filter((o) => current.statuses.includes(o.status)) : data || [];
  const total = list.reduce((n, o) => n + (o.total_fcfa || 0), 0);

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`chip shrink-0 ${tab === tb.key ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.orderTabs.${tb.key}`)}
            <span className="ml-1 font-semibold">({countFor(tb)})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-card bg-base px-3 py-2.5">
        <span className="text-caption text-muted">{t('admin.selectionTotal', { count: list.length })}</span>
        <Price fcfa={total} className="text-section font-semibold text-teal" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={IconShoppingBag} title={t('admin.noOrders')} />
      ) : (
        <ul className="space-y-2">
          {list.map((o) => (
            <li key={o.id} className={`card !rounded-l-none border-l-4 ${orderAccentColor(o.status, o.delivery_method)}`}>
              {/* `flex-wrap`: quand le libellé de statut est long ("En attente
                  de validation"), il passe à la ligne entier au lieu de se
                  couper en deux et d'écraser le nom de la boutique. */}
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-ink">#{o.order_no} · {o.shops?.name || '—'}</p>
                  <p className="text-caption text-muted">{timeAgo(o.created_at, i18n.language)}</p>
                </div>
                <OrderStatusBadge status={o.status} method={o.delivery_method} />
              </div>

              <p className="mt-2 truncate text-caption text-muted">
                {(o.order_items || []).map((it) => `${it.name} ×${it.qty}`).join(', ') || '—'}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-caption text-muted">
                  {o.delivery_method === 'pickup' ? <IconBuildingStore size={14} className="shrink-0" /> : <IconTruckDelivery size={14} className="shrink-0" />}
                  <span className="truncate">{o.buyer_name || '—'}{o.city ? ` · ${o.city}` : ''}</span>
                </span>
                <Price fcfa={o.total_fcfa} className="shrink-0 text-body font-semibold text-teal" />
              </div>

              {o.buyer_phone && (
                <a href={`tel:${o.buyer_phone.replace(/[^+\d]/g, '')}`} className="mt-1 flex items-center gap-1 text-caption font-semibold text-teal">
                  <IconPhone size={13} /> {o.buyer_phone}
                </a>
              )}
              {o.status === 'cancelled' && o.cancel_reason && (
                <p className="mt-2 rounded-input bg-danger-bg p-2 text-caption text-danger">{o.cancel_reason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
