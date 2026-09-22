import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconChevronRight, IconBuildingSkyscraper } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

// LEGION — la porte d'entrée: mes entreprises, ou en fonder une.
// La base ne renvoie que celles dont on est membre; rien à filtrer ici.
export default function MesEntreprises() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const { data, loading, error, retry } = useAsync(async () => {
    if (!user?.id) return [];
    const { data: rows, error: err } = await supabase
      .from('legion_entreprises')
      .select('id, nom, modele, taille, projet, created_at, studio_modeles(nom, emoji)')
      .order('created_at', { ascending: false });
    if (err) throw err;
    return rows || [];
  }, [user?.id], { cacheKey: `legion:mes:${user?.id || 'anon'}` });

  if (authLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!user) return <Navigate to="/auth" state={{ from: '/legion' }} replace />;
  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div className="pb-24">
      <AppHeader title={t('legion.nom')} back />
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <Link to="/legion/fonder"
          className="flex w-full items-center justify-center gap-1 rounded-pill bg-teal px-3 py-2 text-body font-semibold text-white">
          <IconPlus size={18} /> {t('legion.nouvelle')}
        </Link>

        <p className="mt-6 text-caption font-semibold uppercase tracking-wider text-muted">{t('legion.mesEntreprises')}</p>
        {data.length === 0 ? (
          <EmptyState icon={IconBuildingSkyscraper} title={t('legion.aucune')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {data.map((e) => (
              <li key={e.id}>
                <Link to={`/legion/${e.id}`}
                  className="flex items-center gap-3 rounded-card border border-hairline bg-white p-3">
                  <span className="text-title">{e.studio_modeles?.emoji || '🏢'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-ink">{e.nom}</span>
                    <span className="block truncate text-caption text-muted">
                      {e.studio_modeles?.nom || e.modele} · {t(`legion.taille.${e.taille}`)}
                    </span>
                  </span>
                  <IconChevronRight size={18} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
