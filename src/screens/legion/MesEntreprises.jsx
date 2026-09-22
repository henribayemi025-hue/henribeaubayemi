import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconPlus, IconChevronRight, IconArrowLeft, IconRobot, IconAlertCircle, IconChecklist,
  IconBuildingSkyscraper, IconSparkles, IconPower,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { Skeleton, ErrorState } from '../../components/states';
import { Visage } from './parties/Visage';

// LEGION — la porte d'entrée: mes entreprises, ou en fonder une.
//
// Beau, 22/09, devant la première version: « ici c'est trop vide ». Il avait
// raison: un bouton et une ligne. Sa maquette montre un vrai tableau de bord
// — les entreprises en grandes cartes, un panneau « vue d'ensemble » à
// droite, des actions rapides. On la reprend, dans la peau sombre de Legion.
//
// Comme sur l'accueil d'une entreprise: la maquette affichait « Active
// Projects: 12 », « Project Velocity » et une courbe — inventés. Ici, chaque
// nombre se compte en base: agents, allumés, ce qui attend une réponse,
// tâches ouvertes. La base ne renvoie que les entreprises dont on est membre.

export default function MesEntreprises() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  useFondLegion();

  const { data, loading, error, retry } = useAsync(async () => {
    if (!user?.id) return { entreprises: [], agents: [], attente: {}, taches: {} };
    const { data: rows, error: err } = await supabase
      .from('legion_entreprises')
      .select('id, nom, modele, taille, projet, created_at, studio_modeles(nom, emoji)')
      .order('created_at', { ascending: false });
    if (err) throw err;
    const ids = (rows || []).map((e) => e.id);
    if (!ids.length) return { entreprises: [], agents: [], attente: {}, taches: {} };

    const [{ data: agents }, ouverts, taches] = await Promise.all([
      supabase.from('legion_agents')
        .select('id, entreprise_id, nom, poste, avatar_url, couleur, actif, user_id, emoji')
        .in('entreprise_id', ids).is('user_id', null).order('ordre').limit(2000),
      supabase.from('legion_messages').select('entreprise_id')
        .in('entreprise_id', ids).in('genre', ['question', 'decision']).is('repondu_le', null).limit(2000),
      supabase.from('legion_messages').select('entreprise_id')
        .in('entreprise_id', ids).eq('genre', 'tache').is('termine_le', null).limit(2000),
    ]);
    const compter = (lignes) => (lignes || []).reduce((acc, l) => { acc[l.entreprise_id] = (acc[l.entreprise_id] || 0) + 1; return acc; }, {});
    return { entreprises: rows || [], agents: agents || [], attente: compter(ouverts.data), taches: compter(taches.data) };
  }, [user?.id], { cacheKey: `legion:mes:v2:${user?.id || 'anon'}` });

  if (authLoading) return <Chargement />;
  if (!user) return <Navigate to="/auth" state={{ from: '/legion' }} replace />;
  if (loading) return <Chargement />;
  if (error) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><ErrorState onRetry={retry} /></div>;

  const { entreprises, agents, attente, taches } = data;
  const totalAgents = agents.length;
  const totalAllumes = agents.filter((a) => a.actif).length;
  const totalAttente = Object.values(attente).reduce((s, n) => s + n, 0);
  const totalTaches = Object.values(taches).reduce((s, n) => s + n, 0);

  return (
    <div className="legion-app min-h-dvh bg-legion-bg text-legion-ink">
      {/* La barre du haut */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-legion-line bg-legion-panel/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Link to="/apps" className="flex items-center gap-1 rounded-pill border border-legion-line px-2.5 py-1 text-caption font-semibold text-legion-muted transition hover:text-legion-ink">
            <IconArrowLeft size={14} /> Finjaro
          </Link>
          <img src="/logos/legion.png" alt="Legion" className="h-8 w-8 rounded-input object-cover" />
          <span className="text-body font-semibold">Legion</span>
        </div>
        <Link to="/legion/fonder"
          className="hidden items-center gap-1 rounded-pill bg-legion-gold px-3 py-1.5 text-caption font-semibold text-legion-bg transition hover:brightness-110 sm:flex">
          <IconPlus size={15} /> {t('legion.nouvelle')}
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_300px] lg:px-6">
        <main className="min-w-0 space-y-6">
          {/* L'ouverture */}
          <section className="relative overflow-hidden rounded-2xl border border-legion-line bg-gradient-to-br from-legion-panel to-legion-bg p-5 md:p-7">
            <span className="inline-flex items-center gap-2 rounded-pill border border-legion-gold/30 bg-legion-gold/10 px-3 py-1 text-[11px] font-medium text-legion-gold">
              <IconSparkles size={13} /> {t('legion.mesEntreprises')}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t('legion.porteTitre1')}{' '}
              <span className="bg-gradient-to-r from-legion-gold via-legion-gold-soft to-legion-teal bg-clip-text text-transparent">{t('legion.porteTitre2')}</span>
            </h1>
            <p className="mt-2 max-w-xl text-body leading-relaxed text-legion-muted">{t('legion.porteTexte')}</p>
            <Link to="/legion/fonder"
              className="mt-4 inline-flex items-center gap-2 rounded-card bg-gradient-to-r from-legion-gold to-legion-accent px-4 py-2.5 text-caption font-semibold text-legion-bg shadow-lg transition hover:brightness-110">
              <IconPlus size={16} /> {t('legion.nouvelle')}
            </Link>
          </section>

          {/* Les entreprises */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">
              {t('legion.mesEntreprises')} ({entreprises.length})
            </p>
            {entreprises.length === 0 ? (
              <Link to="/legion/fonder"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-legion-line bg-legion-panel px-4 py-12 text-center transition hover:border-legion-gold/50">
                <IconBuildingSkyscraper size={32} className="text-legion-gold" />
                <span className="text-body font-semibold">{t('legion.aucune')}</span>
                <span className="text-caption text-legion-muted">{t('legion.aucuneAide')}</span>
              </Link>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {entreprises.map((e) => {
                  const siens = agents.filter((a) => a.entreprise_id === e.id);
                  const allumes = siens.filter((a) => a.actif).length;
                  const enAttente = attente[e.id] || 0;
                  return (
                    <li key={e.id}>
                      <Link to={`/legion/${e.id}`}
                        className="group flex h-full flex-col rounded-2xl border border-legion-line bg-gradient-to-br from-legion-card to-legion-panel p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-legion-gold/50">
                        <div className="flex items-start gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-legion-bg text-[24px] ring-1 ring-legion-line">
                            {e.studio_modeles?.emoji || '🏢'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-section font-semibold transition group-hover:text-legion-gold">{e.nom}</span>
                            <span className="block truncate text-caption text-legion-muted">
                              {e.studio_modeles?.nom || e.modele} · {t(`legion.taille.${e.taille}`)}
                            </span>
                          </span>
                          <IconChevronRight size={18} className="mt-1 shrink-0 text-legion-muted transition group-hover:translate-x-0.5 group-hover:text-legion-gold" />
                        </div>

                        {e.projet && <p className="mt-3 line-clamp-2 text-caption text-legion-muted">{e.projet}</p>}

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-legion-line pt-3">
                          <div className="flex -space-x-2">
                            {siens.slice(0, 7).map((a) => (
                              <Visage key={a.id} a={a} taille={28} point={false} className="ring-2 ring-legion-card" />
                            ))}
                            {siens.length > 7 && (
                              <span className="flex h-7 items-center pl-3 text-[11px] text-legion-muted">+{siens.length - 7}</span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1 rounded-pill border border-legion-line bg-legion-bg px-2 py-0.5 text-legion-muted">
                              <IconPower size={11} className={allumes ? 'text-legion-success' : ''} /> {allumes}/{siens.length}
                            </span>
                            {enAttente > 0 && (
                              <span className="flex items-center gap-1 rounded-pill bg-legion-accent/20 px-2 py-0.5 font-semibold text-legion-accent">
                                <IconAlertCircle size={11} /> {enAttente}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link to="/legion/fonder"
                    className="flex h-full min-h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-legion-line text-legion-muted transition hover:border-legion-gold/50 hover:text-legion-gold">
                    <IconPlus size={26} />
                    <span className="text-caption font-semibold">{t('legion.nouvelle')}</span>
                  </Link>
                </li>
              </ul>
            )}
          </section>
        </main>

        {/* La vue d'ensemble — uniquement des nombres comptés */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-legion-line bg-legion-panel">
            <p className="border-b border-legion-line bg-gradient-to-r from-legion-card to-legion-panel px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">
              {t('legion.vueEnsemble')}
            </p>
            <dl className="divide-y divide-legion-line">
              <Ligne icone={<IconBuildingSkyscraper size={15} className="text-legion-gold" />} label={t('legion.mesEntreprises')} valeur={entreprises.length} />
              <Ligne icone={<IconRobot size={15} className="text-legion-teal" />} label={t('legion.kpiAgents')} valeur={`${totalAllumes} / ${totalAgents}`} aide={t('legion.allumesMot')} />
              <Ligne icone={<IconAlertCircle size={15} className="text-legion-accent" />} label={t('legion.kpiAttente')} valeur={totalAttente} />
              <Ligne icone={<IconChecklist size={15} className="text-legion-success" />} label={t('legion.tachesOuvertes')} valeur={totalTaches} />
            </dl>
          </div>

          <div className="rounded-2xl border border-legion-line bg-legion-panel p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.actionsRapides')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Action to="/legion/fonder" icone={<IconPlus size={20} />} label={t('legion.nouvelle')} />
              {entreprises[0] && <Action to={`/legion/${entreprises[0].id}`} icone={<IconSparkles size={20} />} label={t('legion.reprendre', { nom: entreprises[0].nom })} />}
              <Action to="/apps" icone={<IconArrowLeft size={20} />} label={t('legion.retourFinjaro')} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Ligne({ icone, label, valeur, aide }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="flex items-center gap-2 text-caption text-legion-muted">{icone} {label}</dt>
      <dd className="text-right">
        <span className="text-body font-bold text-legion-ink">{valeur}</span>
        {aide && <span className="ml-1 text-[11px] text-legion-muted">{aide}</span>}
      </dd>
    </div>
  );
}

function Action({ to, icone, label }) {
  return (
    <Link to={to}
      className="flex flex-col items-center justify-center gap-1.5 rounded-card border border-legion-line bg-gradient-to-b from-legion-card to-legion-panel px-2 py-4 text-center text-[12px] font-semibold text-legion-ink shadow transition hover:border-legion-gold/50 hover:text-legion-gold">
      <span className="text-legion-gold">{icone}</span>
      <span className="line-clamp-2">{label}</span>
    </Link>
  );
}

function Chargement() {
  return (
    <div className="legion-app min-h-dvh bg-legion-bg p-4">
      <Skeleton className="mx-auto h-40 w-full max-w-6xl" />
    </div>
  );
}
