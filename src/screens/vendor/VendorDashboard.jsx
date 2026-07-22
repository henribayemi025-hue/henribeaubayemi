import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSwitchHorizontal, IconChartBar, IconMovie } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { Price } from '../../components/Price';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Skeleton, ErrorState } from '../../components/states';
import { timeAgo } from '../../lib/format';

export default function VendorDashboard() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data, loading, error, retry } = useAsync(async () => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [{ data: orders }, { data: convs }, { count: pending }, { count: todayCount }] = await Promise.all([
      supabase.from('orders').select('id, order_no, status, total_fcfa, created_at, buyer_name').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('conversations').select('id, last_message, last_message_at, vendor_unread, buyer_id, profiles:buyer_id(name)').eq('shop_id', shop.id).order('last_message_at', { ascending: false }).limit(5),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).in('status', ['new', 'confirmed']),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).gte('created_at', startOfDay.toISOString()),
    ]);
    const unread = (convs || []).reduce((n, c) => n + (c.vendor_unread || 0), 0);
    return { orders: orders || [], convs: convs || [], pending: pending || 0, unread, today: todayCount || 0 };
  }, [shop.id]);

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-4">
        <h1 className="flex-1 text-section text-ink">{t('vendor.greeting', { name: shop.name })}</h1>
        <Link to="/vendor/stats" aria-label={t('nav.stats')} className="p-1 text-ink"><IconChartBar size={22} /></Link>
        <button onClick={() => navigate('/switch/to-buyer')} aria-label={t('vendor.switchToBuyer')} className="p-1 text-teal">
          <IconSwitchHorizontal size={22} />
        </button>
      </header>

      {loading ? (
        <div className="space-y-3 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : (
        <div className="space-y-6 p-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat value={data.today} label={t('vendor.todayOrders')} />
            <Stat value={data.unread} label={t('vendor.unreadMessages')} />
            <Stat value={data.pending} label={t('vendor.pendingShipments')} />
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-section text-ink">{t('vendor.recentOrders')}</h2>
              <Link to="/vendor/orders" className="text-caption font-semibold text-teal">{t('common.seeAll')}</Link>
            </div>
            {data.orders.length === 0 ? (
              <p className="text-caption text-muted">{t('vendor.noRecentOrders')}</p>
            ) : (
              <ul className="space-y-2">
                {data.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-card border border-hairline p-3">
                    <div>
                      <p className="text-body text-ink">#{o.order_no}</p>
                      <Price fcfa={o.total_fcfa} className="text-caption text-muted" />
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-section text-ink">{t('vendor.recentMessages')}</h2>
              <Link to="/vendor/messages" className="text-caption font-semibold text-teal">{t('common.seeAll')}</Link>
            </div>
            {data.convs.length === 0 ? (
              <p className="text-caption text-muted">{t('vendor.noRecentMessages')}</p>
            ) : (
              <ul className="space-y-2">
                {data.convs.map((c) => (
                  <li key={c.id}>
                    <Link to={`/vendor/messages/${c.id}`} className="flex items-center justify-between rounded-card border border-hairline p-3">
                      <div className="min-w-0">
                        <p className="text-body text-ink">{c.profiles?.name || t('vendor.buyerName')}</p>
                        <p className="line-clamp-1 text-caption text-muted">{c.last_message || '—'}</p>
                      </div>
                      <span className="text-caption text-muted">{timeAgo(c.last_message_at, i18n.language)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link to="/vendor/reels" className="flex items-center gap-2 text-teal">
            <IconMovie size={20} /> <span className="text-body font-semibold">{t('nav.reels')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-card border border-hairline p-3 text-center">
      <p className="text-title font-semibold text-teal">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
