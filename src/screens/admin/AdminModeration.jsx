import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFlag, IconCheck, IconX, IconExternalLink, IconTrash } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const TABS = ['pending', 'resolved', 'dismissed'];

// File de modération. Avant la migration 0034, `reports` n'était lisible que
// par son auteur — l'administration ne voyait donc AUCUN signalement. Chaque
// signalement se traite une fois: traité (action prise) ou rejeté (sans
// suite), avec la date et l'auteur de la décision conservés.
export default function AdminModeration() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at, resolved_at, reporter:reporter_id(name)')
      .order('created_at', { ascending: false });
    if (err) throw err;

    // Résoudre la cible de chaque signalement en un nom cliquable: un
    // identifiant brut ne dit rien de ce qui est reproché à quoi.
    const shopIds = rows.filter((r) => r.target_type === 'shop').map((r) => r.target_id);
    const productIds = rows.filter((r) => r.target_type === 'product').map((r) => r.target_id);
    const [shopsRes, productsRes] = await Promise.all([
      shopIds.length ? supabase.from('shops').select('id, name, slug').in('id', shopIds) : { data: [] },
      productIds.length ? supabase.from('products').select('id, name').in('id', productIds) : { data: [] },
    ]);
    const shops = Object.fromEntries((shopsRes.data || []).map((s) => [s.id, s]));
    const products = Object.fromEntries((productsRes.data || []).map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      targetName: r.target_type === 'shop' ? shops[r.target_id]?.name : products[r.target_id]?.name,
      targetHref: r.target_type === 'shop'
        ? (shops[r.target_id]?.slug ? `/boutique/${shops[r.target_id].slug}` : null)
        : products[r.target_id] ? `/product/${r.target_id}` : null,
    }));
  }, []);

  async function decide(report, status) {
    setBusyId(report.id);
    const { error: err } = await supabase
      .from('reports')
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq('id', report.id);
    setBusyId(null);
    if (err) return toast.error(err.message);
    toast.success(t(status === 'resolved' ? 'admin.reportResolved' : 'admin.reportDismissed'));
    retry();
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const counts = Object.fromEntries(TABS.map((s) => [s, (data || []).filter((r) => (r.status || 'pending') === s).length]));
  const list = (data || []).filter((r) => (r.status || 'pending') === tab);

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`chip shrink-0 ${tab === s ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.reportStatus.${s}`)}
            {counts[s] > 0 && <span className="ml-1 font-semibold">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={IconFlag} title={t('admin.noReports')} />
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="rounded-card border border-hairline p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-ink">
                    {r.targetName || t('admin.deletedTarget')}
                  </p>
                  <p className="text-caption text-muted">
                    {t(`admin.targetType.${r.target_type}`, { defaultValue: r.target_type })}
                    {' · '}
                    {t('admin.reportedBy', { name: r.reporter?.name || '—' })}
                    {' · '}
                    {timeAgo(r.created_at, i18n.language)}
                  </p>
                </div>
                {r.targetHref && (
                  <a href={r.targetHref} target="_blank" rel="noreferrer" className="shrink-0 p-1 text-teal" aria-label={t('admin.openTarget')}>
                    <IconExternalLink size={17} />
                  </a>
                )}
              </div>

              <p className="mt-2 rounded-input bg-base p-2.5 text-caption text-ink">{r.reason}</p>

              {tab === 'pending' ? (
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => decide(r, 'resolved')}>
                    <IconCheck size={17} /> {t('admin.markResolved')}
                  </Button>
                  <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => decide(r, 'dismissed')}>
                    <IconX size={17} /> {t('admin.dismiss')}
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-muted">
                  {t('admin.decidedOn', { when: timeAgo(r.resolved_at || r.created_at, i18n.language) })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 rounded-card bg-base p-3 text-[11px] text-muted">
        <IconTrash size={14} className="mt-0.5 shrink-0" />
        {t('admin.moderationHint')}
      </p>
    </div>
  );
}
