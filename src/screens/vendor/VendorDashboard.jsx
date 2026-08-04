import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconSwitchHorizontal, IconChartBar, IconAlertCircle, IconChevronRight,
  IconArrowUpRight, IconArrowDownRight, IconWallet, IconPlus, IconShare2,
  IconMovie, IconTrophy, IconAward,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Price } from '../../components/Price';
import { NotificationBell } from '../../components/NotificationBell';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Skeleton, ErrorState } from '../../components/states';
import { timeAgo } from '../../lib/format';

function pct(cur, prev) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export default function VendorDashboard() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const shopUrl = `${window.location.origin}/boutique/${shop.slug}`;

  async function shareShopLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shop.name, url: shopUrl });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast.success(t('vendor.shopLinkCopied'));
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  const { data, loading, error, retry } = useAsync(async () => {
    const now = Date.now();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const weekFrom = new Date(now - 7 * 864e5).toISOString();
    const prevWeekFrom = new Date(now - 14 * 864e5).toISOString();
    const [{ data: weekOrders }, { data: orders }, { data: convs }, { count: pending }, { count: todayCount }, { data: shopRow }] = await Promise.all([
      supabase.from('orders').select('total_fcfa, status, created_at').eq('shop_id', shop.id).gte('created_at', prevWeekFrom),
      supabase.from('orders').select('id, order_no, status, total_fcfa, created_at, buyer_name').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('conversations').select('id, last_message, last_message_at, vendor_unread, buyer_id, profiles:buyer_id(name)').eq('shop_id', shop.id).order('last_message_at', { ascending: false }).limit(3),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('status', 'new'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).gte('created_at', startOfDay.toISOString()),
      supabase.from('shops').select('seller_points').eq('id', shop.id).maybeSingle(),
    ]);
    const all = weekOrders || [];
    const paid = (o) => o.status === 'delivered';
    const cur = all.filter((o) => o.created_at >= weekFrom);
    const prev = all.filter((o) => o.created_at < weekFrom);
    const revenue = cur.filter(paid).reduce((n, o) => n + o.total_fcfa, 0);
    const revenuePrev = prev.filter(paid).reduce((n, o) => n + o.total_fcfa, 0);
    // 7 barres, une par jour, du plus ancien au plus récent.
    const week = Array.from({ length: 7 }, (_, i) => {
      const end = now - i * 864e5;
      const start = end - 864e5;
      return cur.filter(paid)
        .filter((o) => { const ts = new Date(o.created_at).getTime(); return ts > start && ts <= end; })
        .reduce((n, o) => n + o.total_fcfa, 0);
    }).reverse();
    const unread = (convs || []).reduce((n, c) => n + (c.vendor_unread || 0), 0);
    return {
      revenue, revenueChange: pct(revenue, revenuePrev), week,
      orders: orders || [], convs: convs || [], pending: pending || 0,
      unread, today: todayCount || 0, points: shopRow?.seller_points || 0,
    };
  }, [shop.id]);

  const maxDay = data ? Math.max(...data.week, 1) : 1;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-4">
        <h1 className="flex-1 truncate text-section text-ink">{t('vendor.greeting', { name: shop.name })}</h1>
        <NotificationBell />
        <Link to="/vendor/stats" aria-label={t('nav.stats')} className="p-1 text-ink"><IconChartBar size={22} /></Link>
        <button onClick={() => navigate('/switch/to-buyer')} aria-label={t('vendor.switchToBuyer')} className="p-1 text-teal">
          <IconSwitchHorizontal size={22} />
        </button>
      </header>

      {loading ? (
        <div className="space-y-3 p-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-32 w-full" /></div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : (
        <div className="space-y-5 p-4">
          {/* L'action nº1 d'une boutique: répondre aux commandes en attente. */}
          {data.pending > 0 && (
            <Link
              to="/vendor/orders"
              className="flex items-center gap-3 rounded-card border border-warning/40 bg-warning-bg p-4 transition active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-warning">
                <IconAlertCircle size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">{t('vendor.pendingBanner', { count: data.pending })}</p>
                <p className="text-caption text-muted">{t('vendor.pendingBannerHint')}</p>
              </div>
              <IconChevronRight size={20} className="shrink-0 text-warning" />
            </Link>
          )}

          {/* Carte revenus façon Uber conducteur: LE chiffre de la semaine,
              mini graphe 7 jours, et un tap ouvre la compta complète. */}
          <Link to="/vendor/finances" className="block rounded-card bg-gradient-to-br from-teal to-[#0F4C46] p-5 text-white shadow-lg transition active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/80">
                <IconWallet size={18} />
                <p className="text-caption font-semibold uppercase tracking-wide">{t('finances.weekRevenue')}</p>
              </div>
              <span className="flex items-center gap-0.5 text-caption font-semibold text-white/80">
                {t('finances.seeAll')} <IconChevronRight size={14} />
              </span>
            </div>
            <Price fcfa={data.revenue} className="mt-1 block text-[30px] font-bold leading-tight" />
            <div className="mt-1 flex items-center gap-1.5 text-caption">
              <span className={`flex items-center gap-0.5 rounded-pill px-2 py-0.5 font-semibold ${data.revenueChange >= 0 ? 'bg-white/20' : 'bg-black/20'}`}>
                {data.revenueChange >= 0 ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
                {Math.abs(data.revenueChange)}%
              </span>
              <span className="text-white/70">{t('stats.vsPrevious')}</span>
            </div>
            <div className="mt-3 flex h-12 items-end gap-1.5">
              {data.week.map((v, i) => (
                <div key={i} className="flex-1 rounded-t bg-white/85" style={{ height: `${(v / maxDay) * 100}%`, minHeight: v > 0 ? 3 : 1, opacity: v > 0 ? 1 : 0.25 }} />
              ))}
            </div>
          </Link>

          <div className="grid grid-cols-3 gap-3">
            <Stat value={data.today} label={t('vendor.todayOrders')} />
            <Stat value={data.unread} label={t('vendor.unreadMessages')} />
            <Stat value={data.pending} label={t('vendor.pendingShipments')} />
          </div>

          {/* Actions rapides: les 4 gestes quotidiens, à un tap. */}
          <div className="grid grid-cols-4 gap-2">
            <Action icon={IconPlus} label={t('vendor.actionAddProduct')} onClick={() => navigate('/vendor/products/new')} />
            <Action icon={IconShare2} label={t('vendor.actionShare')} onClick={shareShopLink} />
            <Action icon={IconMovie} label={t('nav.reels')} onClick={() => navigate('/vendor/reels')} />
            <Action icon={IconTrophy} label={t('vendor.leaderboard')} onClick={() => navigate('/vendor/leaderboard')} />
          </div>

          <Link
            to="/vendor/leaderboard"
            className="flex items-center gap-3 rounded-card border border-brass/30 bg-brass/5 p-3.5 transition active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
              <IconAward size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted">{t('vendor.sellerPoints')}</p>
              <p className="text-section font-semibold text-ink">{data.points}</p>
            </div>
            <p className="max-w-[45%] text-right text-caption text-muted">{t('vendor.sellerPointsHint')}</p>
          </Link>

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
                  <li key={o.id}>
                    <Link to="/vendor/orders" className="flex items-center justify-between rounded-card border border-hairline p-3">
                      <div className="min-w-0">
                        <p className="truncate text-body text-ink">{o.buyer_name || `#${o.order_no}`}</p>
                        <p className="text-caption text-muted">#{o.order_no} · <Price fcfa={o.total_fcfa} /></p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </Link>
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
                    <Link to={`/vendor/messages/${c.id}`} className="flex items-center justify-between gap-2 rounded-card border border-hairline p-3">
                      <div className="min-w-0">
                        <p className={`text-body text-ink ${c.vendor_unread > 0 ? 'font-semibold' : ''}`}>{c.profiles?.name || t('vendor.buyerName')}</p>
                        <p className="line-clamp-1 text-caption text-muted">{c.last_message || '—'}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-caption text-muted">{timeAgo(c.last_message_at, i18n.language)}</span>
                        {c.vendor_unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1.5 text-[11px] font-bold text-white">{c.vendor_unread}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
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

function Action({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-card border border-hairline p-3 transition active:scale-95">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-light text-teal">
        <Icon size={20} />
      </span>
      <span className="line-clamp-1 text-[10px] font-semibold text-ink">{label}</span>
    </button>
  );
}
