import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconEye, IconUsers, IconBuildingStore, IconShoppingBag, IconTrendingUp, IconSparkles, IconId, IconLoader2 } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { SmartImage } from '../components/SmartImage';
import { Price } from '../components/Price';
import { Skeleton, ErrorState } from '../components/states';
import { timeAgo } from '../lib/format';

const EVENT_TYPES = ['visit', 'product_view', 'shop_view', 'category_view', 'search', 'follow', 'comment', 'mirror_try'];
const AI_BUDGET_EUR = 20;

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
  const { t, i18n } = useTranslation();
  const { profile, loading: authLoading } = useAuth();

  const { data, loading, error, retry } = useAsync(async () => {
    const [
      visitsTotal, visits7d, usersTotal, users7d, vendorsTotal,
      ordersTotal, orders7d, revenueRes, topProducts, eventCounts, recentVisitorsRes, aiUsageRes,
      applicationsRes,
    ] = await Promise.all([
      countSince('events', null, (q) => q.eq('type', 'visit')),
      countSince('events', 7, (q) => q.eq('type', 'visit')),
      countSince('profiles', null),
      countSince('profiles', 7),
      countSince('shops', null, (q) => q.eq('status', 'active')),
      countSince('orders', null),
      countSince('orders', 7),
      supabase.from('orders').select('total_fcfa').not('paid_at', 'is', null),
      supabase.from('products').select('id, name, images, price_fcfa, views').eq('is_active', true).order('views', { ascending: false }).limit(8),
      Promise.all(EVENT_TYPES.map((type) => countSince('events', null, (q) => q.eq('type', type)))),
      // Only visits from a logged-in session ever have a name attached — an
      // anonymous browser has no identity to show, on any site.
      supabase
        .from('events')
        .select('id, created_at, user_id, profiles(name)')
        .eq('type', 'visit')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20),
      // Estimated Finou Chou + Miroir AI spend this calendar month — same
      // budget guard the edge functions enforce, mirrored here so it's
      // visible without waiting for the one-time push alert.
      supabase.from('ai_usage').select('cost_eur').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      // Candidatures vendeur à vérifier (lecture admin: politique
      // vendor_apps_admin_read, migration 0028).
      supabase
        .from('vendor_applications')
        .select('id, shop_name, first_name, last_name, phone, country, city, id_front_url, id_back_url, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    const revenueFcfa = (revenueRes.data || []).reduce((s, o) => s + (o.total_fcfa || 0), 0);
    const aiSpendEur = (aiUsageRes.data || []).reduce((s, r) => s + Number(r.cost_eur), 0);
    return {
      visitsTotal, visits7d, usersTotal, users7d, vendorsTotal, ordersTotal, orders7d, revenueFcfa,
      topProducts: topProducts.data || [],
      events: EVENT_TYPES.map((type, i) => ({ type, count: eventCounts[i] })),
      recentVisitors: recentVisitorsRes.data || [],
      aiSpendEur,
      applications: applicationsRes.data || [],
    };
  }, []);

  if (authLoading) return null;
  if (!profile?.is_admin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-hairline bg-white px-4">
        <h1 className="text-section text-ink">{t('admin.title')}</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : (
        <div className="space-y-6 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={IconEye} label={t('admin.visits')} value={data.visitsTotal} sub={t('admin.last7d', { n: data.visits7d })} />
            <Stat icon={IconUsers} label={t('admin.users')} value={data.usersTotal} sub={t('admin.last7d', { n: data.users7d })} />
            <Stat icon={IconBuildingStore} label={t('admin.vendors')} value={data.vendorsTotal} />
            <Stat icon={IconShoppingBag} label={t('admin.orders')} value={data.ordersTotal} sub={t('admin.last7d', { n: data.orders7d })} />
            <Stat icon={IconTrendingUp} label={t('admin.revenue')} value={<Price fcfa={data.revenueFcfa} />} />
            <Stat
              icon={IconSparkles}
              label={t('admin.aiSpend')}
              value={`${data.aiSpendEur.toFixed(2)}€ / ${AI_BUDGET_EUR}€`}
              sub={data.aiSpendEur >= AI_BUDGET_EUR ? t('admin.aiSpendPaused') : t('admin.aiSpendOk')}
            />
          </div>

          <div>
            <h2 className="mb-2 text-section text-ink">{t('admin.applications')}</h2>
            {data.applications.length === 0 ? (
              <p className="rounded-card border border-hairline px-3 py-4 text-center text-caption text-muted">{t('admin.noApplications')}</p>
            ) : (
              <ul className="space-y-2">
                {data.applications.map((a) => <ApplicationCard key={a.id} app={a} />)}
              </ul>
            )}
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
                  <span className="text-caption font-semibold text-teal">{p.views || 0} {t('admin.views')}</span>
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

          <div>
            <h2 className="mb-2 text-section text-ink">{t('admin.activity')}</h2>
            <ul className="divide-y divide-hairline rounded-card border border-hairline">
              {data.events.map((e) => (
                <li key={e.type} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-body text-ink">{t(`admin.eventTypes.${e.type}`)}</span>
                  <span className="text-body font-semibold text-teal">{e.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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

// Candidature vendeur + KYC assisté par OCR (Finou 2.0 #13). Le bouton envoie
// le CHEMIN de la pièce à la fonction kyc-ocr; c'est elle qui lit le fichier
// du bucket privé côté serveur (service-role) et renvoie les champs extraits.
// L'IA n'approuve ni ne rejette RIEN — elle pose les infos côte à côte avec ce
// que la candidate a déclaré, et l'humain tranche.
function ApplicationCard({ app }) {
  const { t, i18n } = useTranslation();
  const [ocr, setOcr] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(null); // 'front' | 'back' | null
  const [ocrError, setOcrError] = useState(false);

  async function analyze(side) {
    const path = side === 'front' ? app.id_front_url : app.id_back_url;
    if (!path) return;
    setOcrLoading(side);
    setOcrError(false);
    try {
      const { data, error } = await supabase.functions.invoke('kyc-ocr', { body: { image_path: path } });
      if (error || !data?.type_piece) throw error || new Error('empty');
      setOcr(data);
    } catch {
      setOcrError(true);
    } finally {
      setOcrLoading(null);
    }
  }

  const declared = [app.first_name, app.last_name].filter(Boolean).join(' ');
  const extracted = ocr ? [ocr.prenom, ocr.nom].filter(Boolean).join(' ') : '';
  // Comparaison indicative nom déclaré / nom lu (accents et casse ignorés).
  const norm = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const match = ocr && declared && extracted ? norm(declared) === norm(extracted) : null;

  return (
    <li className="rounded-card border border-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-1 text-body font-semibold text-ink">{app.shop_name}</p>
          <p className="text-caption text-muted">
            {declared || '—'} · {[app.city, app.country].filter(Boolean).join(', ')} · {timeAgo(app.created_at, i18n.language)}
          </p>
        </div>
        <span className={`chip shrink-0 ${app.status === 'approved' ? 'text-success border-success' : 'text-brass border-brass'}`}>
          {app.status || 'pending'}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {app.id_front_url && (
          <button onClick={() => analyze('front')} disabled={!!ocrLoading} className="chip text-teal disabled:opacity-50">
            {ocrLoading === 'front' ? <IconLoader2 size={14} className="animate-spin" /> : <IconId size={14} />}
            {t('admin.kycAnalyzeFront')}
          </button>
        )}
        {app.id_back_url && (
          <button onClick={() => analyze('back')} disabled={!!ocrLoading} className="chip text-teal disabled:opacity-50">
            {ocrLoading === 'back' ? <IconLoader2 size={14} className="animate-spin" /> : <IconId size={14} />}
            {t('admin.kycAnalyzeBack')}
          </button>
        )}
      </div>
      {ocrError && <p className="mt-2 text-caption text-danger">{t('admin.kycError')}</p>}
      {ocr && (
        <div className="mt-2 rounded-input bg-base p-2.5 text-caption">
          <p className="text-ink">
            <span className="font-semibold">{t('admin.kycType')}:</span> {ocr.type_piece}
            {' · '}
            <span className="font-semibold">{t('admin.kycReadable')}:</span> {ocr.lisible ? '✓' : '✗'}
          </p>
          {extracted && (
            <p className="mt-1 text-ink">
              <span className="font-semibold">{t('admin.kycName')}:</span> {extracted}
              {match != null && (
                <span className={`ml-1 font-semibold ${match ? 'text-success' : 'text-danger'}`}>
                  {match ? t('admin.kycMatch') : t('admin.kycMismatch', { declared })}
                </span>
              )}
            </p>
          )}
          {ocr.date_naissance && <p className="mt-0.5 text-muted">{t('admin.kycBirth')}: {ocr.date_naissance}</p>}
          {ocr.date_expiration && <p className="mt-0.5 text-muted">{t('admin.kycExpiry')}: {ocr.date_expiration}</p>}
          {ocr.remarques && <p className="mt-0.5 text-muted">{ocr.remarques}</p>}
          <p className="mt-1.5 text-[11px] text-muted">{t('admin.kycDisclaimer')}</p>
        </div>
      )}
    </li>
  );
}
