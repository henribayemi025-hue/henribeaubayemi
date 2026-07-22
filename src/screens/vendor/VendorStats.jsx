import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowUpRight, IconArrowDownRight, IconFileExport } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Price } from '../../components/Price';
import { Skeleton, ErrorState } from '../../components/states';

const PERIODS = [
  { key: '7d', days: 7, label: 'stats.period7d' },
  { key: '30d', days: 30, label: 'stats.period30d' },
  { key: '3m', days: 90, label: 'stats.period3m' },
  { key: '1y', days: 365, label: 'stats.period1y' },
];

function pct(cur, prev) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export default function VendorStats() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [period, setPeriod] = useState('7d');
  const days = PERIODS.find((p) => p.key === period).days;

  const { data, loading, error, retry } = useAsync(async () => {
    const now = Date.now();
    const from = new Date(now - days * 864e5).toISOString();
    const prevFrom = new Date(now - 2 * days * 864e5).toISOString();
    const [{ data: orders }, { data: products }, { data: reels }] = await Promise.all([
      supabase.from('orders').select('total_fcfa, status, created_at, order_items(name, qty, price_fcfa, product_id)').eq('shop_id', shop.id).gte('created_at', prevFrom),
      supabase.from('products').select('id, name, views, price_fcfa').eq('shop_id', shop.id),
      supabase.from('reels').select('views, likes, comments, shares').eq('shop_id', shop.id),
    ]);
    const inCur = (o) => o.created_at >= from;
    const inPrev = (o) => o.created_at < from;
    const all = orders || [];
    const cur = all.filter(inCur);
    const prev = all.filter(inPrev);
    const sales = cur.filter((o) => o.status === 'delivered').reduce((n, o) => n + o.total_fcfa, 0);
    const salesPrev = prev.filter((o) => o.status === 'delivered').reduce((n, o) => n + o.total_fcfa, 0);
    const delivered = cur.filter((o) => o.status === 'delivered').length;

    // Sales by day of week (last 7 days regardless of period selector).
    const week = Array(7).fill(0);
    const weekFrom = now - 7 * 864e5;
    all.filter((o) => o.status === 'delivered' && new Date(o.created_at).getTime() >= weekFrom)
      .forEach((o) => { week[new Date(o.created_at).getDay()] += o.total_fcfa; });

    // Top products by revenue from delivered order_items in window.
    const agg = {};
    cur.filter((o) => o.status === 'delivered').forEach((o) =>
      (o.order_items || []).forEach((it) => {
        const k = it.product_id || it.name;
        agg[k] = agg[k] || { name: it.name, sales: 0, revenue: 0 };
        agg[k].sales += it.qty;
        agg[k].revenue += it.qty * it.price_fcfa;
      })
    );
    const productViews = (products || []).reduce((n, p) => n + (p.views || 0), 0);
    (products || []).forEach((p) => { if (agg[p.id]) agg[p.id].views = p.views || 0; });
    const top = Object.values(agg).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
    const reelViews = (reels || []).reduce((n, r) => n + (r.views || 0), 0);

    return {
      sales, salesChange: pct(sales, salesPrev),
      orders: cur.length, ordersChange: pct(cur.length, prev.length),
      views: productViews,
      followers: shop.followers_count || 0,
      rating: shop.rating || 0,
      viewsToCart: productViews ? Math.round((cur.length / productViews) * 100) : 0,
      ordersToDelivered: cur.length ? Math.round((delivered / cur.length) * 100) : 0,
      reelsToViews: reelViews ? Math.round((productViews / reelViews) * 100) : 0,
      week, top, reelViews,
      reelLikes: (reels || []).reduce((n, r) => n + (r.likes || 0), 0),
      reelComments: (reels || []).reduce((n, r) => n + (r.comments || 0), 0),
      reelShares: (reels || []).reduce((n, r) => n + (r.shares || 0), 0),
      empty: all.length === 0 && productViews === 0,
    };
  }, [shop.id, days]);

  const dayNames = i18n.language === 'fr' ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxDay = data ? Math.max(...data.week, 1) : 1;

  return (
    <div className="pb-6">
      <AppHeader title={t('nav.stats')} right={<button onClick={() => toast.info(t('stats.exportSoon'))} aria-label={t('stats.export')} className="p-1 text-teal"><IconFileExport size={20} /></button>} />
      <div className="flex gap-2 border-b border-hairline px-4 pb-2 pt-1">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`chip flex-1 justify-center ${period === p.key ? 'chip-active' : 'text-ink'}`}>{t(p.label)}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : data.empty ? (
        <p className="p-8 text-center text-body text-muted">{t('stats.noData')}</p>
      ) : (
        <div className="space-y-6 p-4">
          <div className="grid grid-cols-2 gap-3">
            <KPI label={t('stats.sales')} value={<Price fcfa={data.sales} />} change={data.salesChange} />
            <KPI label={t('stats.ordersCount')} value={data.orders} change={data.ordersChange} />
            <KPI label={t('stats.views')} value={data.views} />
            <KPI label={t('stats.followers')} value={data.followers} />
          </div>

          <section>
            <h2 className="mb-2 text-section text-ink">{t('stats.conversions')}</h2>
            <div className="space-y-2">
              <Bar label={t('stats.viewsToCart')} value={data.viewsToCart} />
              <Bar label={t('stats.ordersToDelivered')} value={data.ordersToDelivered} />
              <Bar label={t('stats.reelsToViews')} value={data.reelsToViews} />
              <div className="flex justify-between text-body"><span className="text-muted">{t('stats.avgRating')}</span><span className="font-semibold text-ink">{Number(data.rating).toFixed(1)} / 5</span></div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-section text-ink">{t('stats.salesByDay')}</h2>
            <div className="flex h-32 items-end gap-2">
              {data.week.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-teal" style={{ height: `${(v / maxDay) * 100}%`, minHeight: v > 0 ? 4 : 0 }} />
                  <span className="text-[10px] text-muted">{dayNames[i]}</span>
                </div>
              ))}
            </div>
          </section>

          {data.top.length > 0 && (
            <section>
              <h2 className="mb-2 text-section text-ink">{t('stats.topProducts')}</h2>
              <ul className="space-y-2">
                {data.top.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-card border border-hairline p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brass/15 text-caption font-semibold text-brass">{t('stats.rank', { n: i + 1 })}</span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-body text-ink">{p.name}</p>
                      <p className="text-caption text-muted">{t('stats.salesCount', { n: p.sales })} · {p.views || 0} {t('stats.views').toLowerCase()}</p>
                    </div>
                    <Price fcfa={p.revenue} className="text-caption font-semibold text-teal" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-section text-ink">{t('stats.reelsPerf')}</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Mini value={data.reelViews} label={t('stats.totalViews')} />
              <Mini value={data.reelLikes} label={t('stats.totalLikes')} />
              <Mini value={data.reelComments} label={t('stats.totalComments')} />
              <Mini value={data.reelShares} label={t('stats.totalShares')} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, change }) {
  const { t } = useTranslation();
  const up = change >= 0;
  return (
    <div className="rounded-card border border-hairline p-3">
      <p className="text-caption text-muted">{label}</p>
      <p className="mt-1 text-section font-semibold text-ink">{value}</p>
      {change != null && (
        <p className={`mt-0.5 flex items-center gap-0.5 text-caption ${up ? 'text-success' : 'text-danger'}`}>
          {up ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
          {Math.abs(change)}% <span className="text-muted">{t('stats.vsPrevious')}</span>
        </p>
      )}
    </div>
  );
}

function Bar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-caption"><span className="text-muted">{label}</span><span className="font-semibold text-ink">{value}%</span></div>
      <div className="mt-1 h-2 w-full rounded-pill bg-hairline">
        <div className="h-2 rounded-pill bg-teal" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function Mini({ value, label }) {
  return (
    <div className="rounded-card border border-hairline p-2">
      <p className="text-body font-semibold text-teal">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}
