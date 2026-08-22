import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFlag, IconCheck, IconX, IconExternalLink, IconTrash, IconRobot, IconUser, IconEyeOff, IconArrowBackUp } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const TABS = ['pending', 'resolved', 'dismissed'];

// Où vit chaque type de cible, et comment on le remet en ligne. Les trois
// tables ne se masquent pas de la même façon: `products` a `is_active`,
// `shops` a `status`, `reels` n'a que l'horodatage.
const CIBLES = {
  product: { table: 'products', champ: 'name', reactive: { is_active: true } },
  shop: { table: 'shops', champ: 'name', reactive: { status: 'active' } },
  reel: { table: 'reels', champ: 'caption', reactive: {} },
};

// File de modération. Avant la migration 0034, `reports` n'était lisible que
// par son auteur — l'administration ne voyait donc AUCUN signalement. Chaque
// signalement se traite une fois: traité (action prise) ou rejeté (sans
// suite), avec la date et l'auteur de la décision conservés.
//
// Depuis la migration 0053 la file reçoit aussi les constats de l'inspection
// automatique du matin (`source = 'auto'`). Deux différences importantes:
//   * ce qui est marqué « bloqué » est DÉJÀ hors ligne quand Beau le lit —
//     l'inspection n'attend pas son feu vert pour ce qui est illégal;
//   * il faut donc un bouton pour REMETTRE en ligne, parce que la machine se
//     trompe et qu'une vendeuse honnête ne doit pas attendre.
export default function AdminModeration() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('reports')
      .select('id, target_type, target_id, reason, detail, source, severity, status, created_at, resolved_at, reporter:profiles!reports_reporter_profile_fk(name)')
      .order('created_at', { ascending: false });
    if (err) throw err;

    // Résoudre la cible de chaque signalement en un nom cliquable: un
    // identifiant brut ne dit rien de ce qui est reproché à quoi.
    const parType = (type) => rows.filter((r) => r.target_type === type).map((r) => r.target_id);
    const [shopsRes, productsRes, reelsRes] = await Promise.all([
      parType('shop').length
        ? supabase.from('shops').select('id, name, slug, moderation_hidden_at').in('id', parType('shop'))
        : { data: [] },
      parType('product').length
        ? supabase.from('products').select('id, name, moderation_hidden_at').in('id', parType('product'))
        : { data: [] },
      parType('reel').length
        ? supabase.from('reels').select('id, caption, moderation_hidden_at').in('id', parType('reel'))
        : { data: [] },
    ]);
    const shops = Object.fromEntries((shopsRes.data || []).map((s) => [s.id, s]));
    const products = Object.fromEntries((productsRes.data || []).map((p) => [p.id, p]));
    const reels = Object.fromEntries((reelsRes.data || []).map((r) => [r.id, r]));

    return rows.map((r) => {
      const cible = r.target_type === 'shop' ? shops[r.target_id]
        : r.target_type === 'product' ? products[r.target_id]
          : reels[r.target_id];
      return {
        ...r,
        targetName: cible?.name || cible?.caption,
        hiddenAt: cible?.moderation_hidden_at || null,
        targetHref: r.target_type === 'shop'
          ? (cible?.slug ? `/boutique/${cible.slug}` : null)
          : r.target_type === 'product' && cible ? `/product/${r.target_id}` : null,
      };
    });
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

  // Remettre en ligne ce que l'inspection avait retiré. On efface la marque
  // de modération ET on rouvre l'accès (chaque table à sa façon), puis on
  // classe le signalement « sans suite »: le contenu est jugé correct.
  async function republier(report) {
    const meta = CIBLES[report.target_type];
    if (!meta) return;
    setBusyId(report.id);
    const { error: err } = await supabase
      .from(meta.table)
      .update({ moderation_hidden_at: null, moderation_reason: null, ...meta.reactive })
      .eq('id', report.target_id);
    if (err) { setBusyId(null); return toast.error(err.message); }
    await supabase
      .from('reports')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: user.id })
      .eq('id', report.id);
    setBusyId(null);
    toast.success(t('admin.contentRestored'));
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
          {list.map((r) => {
            const auto = r.source === 'auto';
            return (
              <li key={r.id} className={`rounded-card border p-3 ${r.hiddenAt ? 'border-danger/40 bg-danger-bg/40' : 'border-hairline'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-ink">
                      {r.targetName || t('admin.deletedTarget')}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-caption text-muted">
                      {/* D'où vient le constat: la machine, ou quelqu'un. Ce
                          n'est pas un détail — on ne traite pas de la même
                          façon un soupçon de robot et une plainte humaine. */}
                      <span className="inline-flex items-center gap-1 font-semibold text-ink">
                        {auto ? <IconRobot size={13} /> : <IconUser size={13} />}
                        {t(auto ? 'admin.sourceAuto' : 'admin.sourceUser')}
                      </span>
                      {' · '}
                      {t(`admin.targetType.${r.target_type}`, { defaultValue: r.target_type })}
                      {!auto && <>{' · '}{t('admin.reportedBy', { name: r.reporter?.name || '—' })}</>}
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

                {/* Ce qui est déjà hors ligne doit se voir AVANT le reste:
                    c'est fait, ça n'attend pas de décision, et la seule
                    question qui reste est « est-ce que c'était juste ? ». */}
                {r.hiddenAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-caption font-semibold text-danger">
                    <IconEyeOff size={15} className="shrink-0" />
                    {t('admin.alreadyHidden', { when: timeAgo(r.hiddenAt, i18n.language) })}
                  </p>
                )}

                <p className="mt-2 rounded-input bg-base p-2.5 text-caption text-ink">
                  {r.detail || r.reason}
                </p>

                {tab === 'pending' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.hiddenAt ? (
                      <>
                        <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => decide(r, 'resolved')}>
                          <IconCheck size={17} /> {t('admin.confirmRemoval')}
                        </Button>
                        <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => republier(r)}>
                          <IconArrowBackUp size={17} /> {t('admin.restoreContent')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => decide(r, 'resolved')}>
                          <IconCheck size={17} /> {t('admin.markResolved')}
                        </Button>
                        <Button variant="secondary" disabled={busyId === r.id} className="flex-1" onClick={() => decide(r, 'dismissed')}>
                          <IconX size={17} /> {t('admin.dismiss')}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-muted">
                    {t('admin.decidedOn', { when: timeAgo(r.resolved_at || r.created_at, i18n.language) })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-start gap-2 rounded-card bg-base p-3 text-[11px] text-muted">
        <IconTrash size={14} className="mt-0.5 shrink-0" />
        {t('admin.moderationHint')}
      </p>
    </div>
  );
}
