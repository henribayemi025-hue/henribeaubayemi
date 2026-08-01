import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconSearch, IconBuildingStore, IconBan, IconCheck, IconRosetteDiscountCheck,
  IconExternalLink, IconPackage, IconShoppingBag, IconClock,
} from '@tabler/icons-react';
import { supabase, storageThumbUrl, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { ShopAvatar } from '../../components/ShopAvatar';
import { Price } from '../../components/Price';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { timeAgo } from '../../lib/format';

// Recherche tolérante aux accents et à la casse: taper "douala" doit trouver
// "Douala", et "beaute" doit trouver "Beauté".
function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Répertoire des boutiques avec leurs chiffres réels. Les agrégats viennent
// de `admin_shop_stats()` (migration 0034) — une ligne par boutique calculée
// par Postgres, plutôt que de rapatrier toutes les commandes de la
// plateforme dans le navigateur pour les additionner ici.
export default function AdminShops() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null); // boutique ouverte dans la fiche

  const { data, loading, error, retry } = useAsync(async () => {
    const [shopsRes, statsRes] = await Promise.all([
      supabase
        .from('shops')
        .select('id, slug, name, avatar_url, city, country, status, is_verified, followers_count, rating, reviews_count, created_at, owner_id, categories, phone, whatsapp, profiles:owner_id(name, phone, is_suspended)')
        .order('created_at', { ascending: false }),
      supabase.rpc('admin_shop_stats'),
    ]);
    if (shopsRes.error) throw shopsRes.error;
    const stats = Object.fromEntries((statsRes.data || []).map((s) => [s.shop_id, s]));
    return (shopsRes.data || []).map((s) => ({ ...s, stats: stats[s.id] || null }));
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    if (!needle) return data || [];
    return (data || []).filter((s) =>
      normalize(`${s.name} ${s.city || ''} ${s.profiles?.name || ''}`).includes(needle)
    );
  }, [data, q]);

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div className="space-y-3 p-4">
      <div className="relative">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('admin.searchShops')}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IconBuildingStore} title={t('admin.noShops')} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setOpen(s)}
                className="flex w-full items-center gap-3 rounded-card border border-hairline p-3 text-left transition active:scale-[0.99]"
              >
                <ShopAvatar
                  src={s.avatar_url ? storageThumbUrl('shops', s.avatar_url) : null}
                  fallbackSrc={s.avatar_url ? storageUrl('shops', s.avatar_url) : null}
                  name={s.name}
                  seed={s.id}
                  className="h-11 w-11 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-body font-semibold text-ink">
                    <span className="truncate">{s.name}</span>
                    {s.is_verified && <IconRosetteDiscountCheck size={15} className="shrink-0 text-teal" />}
                    {s.status === 'suspended' && (
                      <span className="shrink-0 rounded-pill bg-danger-bg px-1.5 text-[10px] font-bold text-danger">
                        {t('admin.suspended')}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-caption text-muted">
                    {[s.city, s.profiles?.name].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-body font-semibold text-teal">{s.stats?.orders_total ?? 0}</p>
                  <p className="text-[11px] text-muted">{t('admin.ordersShort')}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ShopSheet shop={open} onClose={() => setOpen(null)} onChanged={retry} lang={i18n.language} />
    </div>
  );
}

// Fiche complète d'une boutique: ses chiffres, son propriétaire, ses
// dernières commandes, et les deux leviers d'administration (certifier,
// suspendre). Les commandes ne sont chargées qu'à l'ouverture de la fiche.
function ShopSheet({ shop, onClose, onChanged, lang }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const { data: orders } = useAsync(async () => {
    if (!shop) return [];
    const { data } = await supabase
      .from('orders')
      .select('id, order_no, status, total_fcfa, created_at, buyer_name, delivery_method')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(8);
    return data || [];
  }, [shop?.id]);

  if (!shop) return null;
  const st = shop.stats;
  const suspended = shop.status === 'suspended';

  async function patch(fields, successKey) {
    setBusy(true);
    const { error } = await supabase.from('shops').update(fields).eq('id', shop.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t(successKey));
    onChanged();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={shop.name}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={IconShoppingBag} label={t('admin.ordersShort')} value={st?.orders_total ?? 0} />
        <Metric icon={IconClock} label={t('admin.pendingShort')} value={st?.orders_pending ?? 0} />
        <Metric icon={IconCheck} label={t('admin.deliveredShort')} value={st?.orders_delivered ?? 0} />
        <Metric icon={IconPackage} label={t('admin.productsShort')} value={st?.products_total ?? 0} />
      </div>

      <div className="mt-2 rounded-card bg-base p-3">
        <p className="text-caption text-muted">{t('admin.shopRevenue')}</p>
        <Price fcfa={st?.revenue_fcfa ?? 0} className="text-title font-semibold text-teal" />
        <p className="mt-0.5 text-[11px] text-muted">{t('admin.shopRevenueHint')}</p>
      </div>

      <dl className="mt-3 space-y-1 text-body">
        <Row label={t('admin.owner')} value={shop.profiles?.name} />
        <Row label={t('becomeVendor.phone')} value={shop.phone || shop.whatsapp || shop.profiles?.phone} />
        <Row label={t('becomeVendor.city')} value={[shop.city, shop.country].filter(Boolean).join(', ')} />
        <Row label={t('admin.rating')} value={`${Number(shop.rating || 0).toFixed(1)} (${shop.reviews_count || 0})`} />
        <Row label={t('admin.followers')} value={shop.followers_count || 0} />
        <Row label={t('admin.joinedOn')} value={timeAgo(shop.created_at, lang)} />
        <Row label={t('admin.lastOrder')} value={st?.last_order_at ? timeAgo(st.last_order_at, lang) : '—'} />
      </dl>

      {orders?.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-1.5 text-caption font-semibold text-muted">{t('admin.recentOrders')}</h3>
          <ul className="divide-y divide-hairline rounded-card border border-hairline">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-caption text-ink">#{o.order_no} · {o.buyer_name || '—'}</p>
                  <p className="text-[11px] text-muted">{timeAgo(o.created_at, lang)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Price fcfa={o.total_fcfa} className="text-caption font-semibold text-ink" />
                  <OrderStatusBadge status={o.status} method={o.delivery_method} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <a
          href={`/boutique/${shop.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-input border border-hairline py-2.5 text-body font-semibold text-ink"
        >
          <IconExternalLink size={17} /> {t('admin.openShopPage')}
        </a>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy}
            className="flex-1"
            onClick={() => patch({ is_verified: !shop.is_verified }, shop.is_verified ? 'admin.badgeRemoved' : 'admin.badgeGranted')}
          >
            <IconRosetteDiscountCheck size={17} />
            {shop.is_verified ? t('admin.removeBadge') : t('admin.grantBadge')}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            className={`flex-1 ${suspended ? '' : '!border-danger/50 !text-danger'}`}
            onClick={() => patch({ status: suspended ? 'active' : 'suspended' }, suspended ? 'admin.shopReactivated' : 'admin.shopSuspended')}
          >
            {suspended ? <IconCheck size={17} /> : <IconBan size={17} />}
            {suspended ? t('admin.reactivate') : t('admin.suspend')}
          </Button>
        </div>
        <p className="text-[11px] text-muted">{t('admin.suspendHint')}</p>
      </div>
    </Modal>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-card border border-hairline p-2.5 text-center">
      <Icon size={17} className="mx-auto text-teal" />
      <p className="mt-0.5 text-section font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}
