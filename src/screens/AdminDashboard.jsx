import { lazy, Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconEye, IconUsers, IconBuildingStore, IconShoppingBag, IconTrendingUp, IconSparkles,
  IconLayoutDashboard, IconFlag, IconSpeakerphone, IconChevronRight,
} from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { SmartImage } from '../components/SmartImage';
import { Price } from '../components/Price';
import { Skeleton, ErrorState } from '../components/states';
import { Spinner } from '../components/Spinner';
import { timeAgo } from '../lib/format';

const AdminShops = lazy(() => import('./admin/AdminShops'));
const AdminUsers = lazy(() => import('./admin/AdminUsers'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminModeration = lazy(() => import('./admin/AdminModeration'));
const AdminContent = lazy(() => import('./admin/AdminContent'));

const EVENT_TYPES = ['visit', 'product_view', 'shop_view', 'category_view', 'search', 'follow', 'comment', 'mirror_try'];
const AI_BUDGET_EUR = 20;

// L'onglet actif vit dans l'URL (?s=shops) et non dans un état local: le
// bouton Retour du téléphone ramène à l'onglet précédent, et un onglet
// précis se partage/rouvre tel quel.
const SECTIONS = [
  { key: 'overview', icon: IconLayoutDashboard },
  { key: 'shops', icon: IconBuildingStore, Component: AdminShops },
  { key: 'users', icon: IconUsers, Component: AdminUsers },
  { key: 'orders', icon: IconShoppingBag, Component: AdminOrders },
  { key: 'moderation', icon: IconFlag, Component: AdminModeration },
  { key: 'content', icon: IconSpeakerphone, Component: AdminContent },
];

async function countSince(table, days, extra) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (days != null) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    q = q.gte('created_at', since);
  }
  if (extra) q = extra(q);
  const { count } = await q;
  return count || 0;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.some((s) => s.key === params.get('s')) ? params.get('s') : 'overview';

  if (authLoading) return null;
  if (!profile?.is_admin) return <Navigate to="/" replace />;

  const Active = SECTIONS.find((s) => s.key === section)?.Component;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="sticky top-0 z-30 border-b border-hairline bg-white">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-section text-ink">{t('admin.title')}</h1>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.key === section;
            return (
              <button
                key={s.key}
                onClick={() => setParams(s.key === 'overview' ? {} : { s: s.key }, { replace: false })}
                className={`flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-semibold transition ${
                  active ? 'bg-teal text-white' : 'text-muted hover:bg-base'
                }`}
              >
                <Icon size={15} />
                {t(`admin.section.${s.key}`)}
              </button>
            );
          })}
        </div>
      </header>

      {Active ? (
        <Suspense fallback={<div className="flex h-40 items-center justify-center"><Spinner /></div>}>
          <Active />
        </Suspense>
      ) : (
        <Overview goTo={(key) => setParams({ s: key })} />
      )}
    </div>
  );
}

function Overview({ goTo }) {
  const { t, i18n } = useTranslation();

  const { data, loading, error, retry } = useAsync(async () => {
    const [
      visitsTotal, visits7d, usersTotal, users7d, vendorsTotal,
      ordersTotal, orders7d, revenueRes, topProducts, eventCounts, recentVisitorsRes, aiUsageRes,
      pendingReports, pendingApps,
    ] = await Promise.all([
      countSince('events', null, (q) => q.eq('type', 'visit')),
      countSince('events', 7, (q) => q.eq('type', 'visit')),
      countSince('profiles', null),
      countSince('profiles', 7),
      countSince('shops', null, (q) => q.eq('status', 'active')),
      countSince('orders', null),
      countSince('orders', 7),
      // Chiffre d'affaires RÉELLEMENT réalisé = commandes livrées. Se fier à
      // `paid_at` ne mesurerait que le paiement en ligne, alors que
      // l'écrasante majorité des commandes se règlent à la livraison.
      supabase.from('orders').select('total_fcfa').eq('status', 'delivered'),
      supabase.from('products').select('id, name, images, price_fcfa, views').eq('is_active', true).order('views', { ascending: false }).limit(8),
      Promise.all(EVENT_TYPES.map((type) => countSince('events', null, (q) => q.eq('type', type)))),
      supabase
        .from('events')
        .select('id, created_at, user_id, profiles(name)')
        .eq('type', 'visit')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('ai_usage').select('cost_eur').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      countSince('reports', null, (q) => q.eq('status', 'pending')),
      countSince('vendor_applications', null, (q) => q.eq('status', 'pending')),
    ]);
    const revenueFcfa = (revenueRes.data || []).reduce((s, o) => s + (o.total_fcfa || 0), 0);
    const aiSpendEur = (aiUsageRes.data || []).reduce((s, r) => s + Number(r.cost_eur), 0);
    return {
      visitsTotal, visits7d, usersTotal, users7d, vendorsTotal, ordersTotal, orders7d, revenueFcfa,
      topProducts: topProducts.data || [],
      events: EVENT_TYPES.map((type, i) => ({ type, count: eventCounts[i] })),
      recentVisitors: recentVisitorsRes.data || [],
      aiSpendEur, pendingReports, pendingApps,
    };
  }, []);

  if (loading) return <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const maxEvent = Math.max(...data.events.map((e) => e.count), 1);

  return (
    <div className="space-y-6 p-4">
      {/* Ce qui attend une décision passe en tête: sans ça, un signalement
          peut dormir des jours sans que personne ne le voie. Ce sont des
          BOUTONS qui changent d'onglet, pas des liens vers une adresse — la
          console n'a qu'une seule page. */}
      {(data.pendingReports > 0 || data.pendingApps > 0) && (
        <div className="space-y-2">
          {data.pendingReports > 0 && (
            <button
              type="button"
              onClick={() => goTo('moderation')}
              className="flex w-full items-center gap-2 rounded-card border border-danger/30 bg-danger-bg p-3 text-left text-body font-semibold text-danger transition active:scale-[0.99]"
            >
              <IconFlag size={18} className="shrink-0" />
              <span className="flex-1">{t('admin.pendingReportsBanner', { count: data.pendingReports })}</span>
              <IconChevronRight size={18} className="shrink-0" />
            </button>
          )}
          {data.pendingApps > 0 && (
            <button
              type="button"
              onClick={() => goTo('content')}
              className="flex w-full items-center gap-2 rounded-card border border-brass/30 bg-brass/5 p-3 text-left text-body font-semibold text-brass transition active:scale-[0.99]"
            >
              <IconUsers size={18} className="shrink-0" />
              <span className="flex-1">{t('admin.pendingAppsBanner', { count: data.pendingApps })}</span>
              <IconChevronRight size={18} className="shrink-0" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={IconEye} label={t('admin.visits')} value={data.visitsTotal} sub={t('admin.last7d', { n: data.visits7d })} />
        <Stat icon={IconUsers} label={t('admin.users')} value={data.usersTotal} sub={t('admin.last7d', { n: data.users7d })} />
        <Stat icon={IconBuildingStore} label={t('admin.vendors')} value={data.vendorsTotal} />
        <Stat icon={IconShoppingBag} label={t('admin.orders')} value={data.ordersTotal} sub={t('admin.last7d', { n: data.orders7d })} />
        <Stat icon={IconTrendingUp} label={t('admin.revenue')} value={<Price fcfa={data.revenueFcfa} />} sub={t('admin.revenueHint')} />
        <Stat
          icon={IconSparkles}
          label={t('admin.aiSpend')}
          value={`${data.aiSpendEur.toFixed(2)}€ / ${AI_BUDGET_EUR}€`}
          sub={data.aiSpendEur >= AI_BUDGET_EUR ? t('admin.aiSpendPaused') : t('admin.aiSpendOk')}
        />
      </div>

      <div>
        <h2 className="mb-2 text-section text-ink">{t('admin.topProducts')}</h2>
        <ul className="divide-y divide-hairline rounded-card border border-hairline">
          {data.topProducts.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <SmartImage src={p.images?.[0] ? storageThumbUrl('products', p.images[0]) : null} fallbackSrc={p.images?.[0] ? storageUrl('products', p.images[0]) : null} alt={p.name} className="h-11 w-11" rounded="rounded-input" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-body text-ink">{p.name}</p>
                <Price fcfa={p.price_fcfa} className="text-caption text-muted" />
              </div>
              <span className="shrink-0 text-caption font-semibold text-teal">{p.views || 0} {t('admin.views')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Activité en barres: un tableau de nombres ne se lit pas d'un coup
          d'œil, une barre proportionnelle si. */}
      <div>
        <h2 className="mb-2 text-section text-ink">{t('admin.activity')}</h2>
        <ul className="space-y-2 rounded-card border border-hairline p-3">
          {data.events.map((e) => (
            <li key={e.type}>
              <div className="flex items-center justify-between text-caption">
                <span className="text-ink">{t(`admin.eventTypes.${e.type}`)}</span>
                <span className="font-semibold text-teal">{e.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-base">
                <div className="h-full rounded-pill bg-teal" style={{ width: `${(e.count / maxEvent) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-section text-ink">{t('admin.recentVisitors')}</h2>
        {data.recentVisitors.length === 0 ? (
          <p className="rounded-card border border-hairline px-3 py-4 text-center text-caption text-muted">{t('admin.noIdentifiedVisitors')}</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-card border border-hairline">
            {data.recentVisitors.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-body text-ink">{v.profiles?.name || '—'}</span>
                <span className="text-caption text-muted">{timeAgo(v.created_at, i18n.language)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 text-[11px] text-muted">{t('admin.anonymousNote')}</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-card border border-hairline p-3">
      <Icon size={20} className="text-teal" />
      <p className="mt-1 text-title font-semibold text-ink">{value}</p>
      <p className="text-caption text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
