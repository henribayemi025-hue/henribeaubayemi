import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconPlus, IconChevronRight, IconArrowLeft, IconRobot, IconAlertCircle, IconChecklist,
  IconBuildingSkyscraper, IconSparkles, IconPower,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { modeleTraduit } from './parties/modelesEn';
import { BandeAgents } from './parties/BandeAgents';
import { BoutonPalette } from './parties/Palette';
import { useAuth } from '../../hooks/useAuth';
import { IconLogout } from '@tabler/icons-react';
import { useAsync } from '../../hooks/useAsync';
import { Skeleton, ErrorState } from '../../components/states';

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
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
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

    // Les tâches ouvertes et les messages des trois dernières heures servent à dire ce que
    // chaque agent fait maintenant (la bande qui défile sur chaque carte) — la même lecture
    // que le monde 3D (quiOuEst), sur les vraies données.
    const [{ data: agents }, ouverts, taches, recents] = await Promise.all([
      supabase.from('legion_agents')
        .select('id, entreprise_id, nom, poste, avatar_url, couleur, actif, user_id, emoji, est_directeur')
        .in('entreprise_id', ids).is('user_id', null).order('ordre').limit(2000),
      supabase.from('legion_messages').select('entreprise_id')
        .in('entreprise_id', ids).in('genre', ['question', 'decision']).is('repondu_le', null).limit(2000),
      supabase.from('legion_messages').select('entreprise_id, assigne_a, texte, meta, created_at, termine_le')
        .in('entreprise_id', ids).eq('genre', 'tache').is('termine_le', null).order('created_at', { ascending: false }).limit(2000),
      supabase.from('legion_messages').select('id, entreprise_id, auteur_id, user_id, texte, genre, meta, created_at')
        .in('entreprise_id', ids).neq('genre', 'tache').gte('created_at', new Date(Date.now() - 3 * 3_600_000).toISOString()).order('created_at', { ascending: false }).limit(800),
    ]);
    const compter = (lignes) => (lignes || []).reduce((acc, l) => { acc[l.entreprise_id] = (acc[l.entreprise_id] || 0) + 1; return acc; }, {});
    const parEntreprise = (lignes) => (lignes || []).reduce((acc, l) => { (acc[l.entreprise_id] ||= []).push(l); return acc; }, {});
    return { entreprises: rows || [], agents: agents || [], attente: compter(ouverts.data), taches: compter(taches.data), tachesPar: parEntreprise(taches.data), messagesPar: parEntreprise(recents.data) };
  }, [user?.id], { cacheKey: `legion:mes:v3:${user?.id || 'anon'}` });

  if (authLoading) return <Chargement />;
  if (!user) return <Navigate to="/auth" state={{ from: '/legion' }} replace />;
  if (loading) return <Chargement />;
  if (error) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><ErrorState onRetry={retry} /></div>;

  const { entreprises, agents, attente, taches, tachesPar = {}, messagesPar = {} } = data;
  const totalAgents = agents.length;
  const totalAllumes = agents.filter((a) => a.actif).length;
  const totalAttente = Object.values(attente).reduce((s, n) => s + n, 0);
  const totalTaches = Object.values(taches).reduce((s, n) => s + n, 0);

  return (
    <div className="legion-app h-dvh overflow-y-auto bg-legion-bg text-legion-ink">
      {/* La barre du haut */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-legion-line bg-legion-panel/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Link to="/apps" className="flex items-center gap-1 rounded-pill border border-legion-line px-2.5 py-1 text-caption font-semibold text-legion-muted transition hover:text-legion-ink">
            <IconArrowLeft size={14} /> Finjaro
          </Link>
          <img src="/logos/leo.png" alt="Léo" className="h-8 w-8 rounded-input object-cover" />
          <span className="text-body font-semibold">Léo</span>
        </div>
        <div className="flex items-center gap-2">
          <BoutonPalette t={t} />
          {/* Beau, 22/09: « j'arrive même pas à me déconnecter dans Legion ». */}
          <button type="button" onClick={() => signOut()} title={t('legion.seDeconnecter', 'Se déconnecter')}
            className="flex items-center gap-1 rounded-pill border border-legion-line px-2.5 py-1 text-caption font-semibold text-legion-muted transition hover:text-legion-danger">
            <IconLogout size={14} /> <span className="hidden sm:inline">{t('legion.seDeconnecter', 'Se déconnecter')}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_300px] lg:px-6">
        <main className="min-w-0 space-y-6">
          {/* L'ouverture — le SEUL bouton « Nouvelle entreprise » de la page (Beau, 25/09 : il y était trois fois). */}
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
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {entreprises.map((e) => {
                  const siens = agents.filter((a) => a.entreprise_id === e.id);
                  const allumes = siens.filter((a) => a.actif).length;
                  const enAttente = attente[e.id] || 0;
                  const visages = siens.filter((a) => a.avatar_url).slice(0, 4);
                  return (
                    <li key={e.id}>
                      {/* Beau, 25/09 : « comme dans Finjaro, que les choses défilent » — chaque entreprise est
                          une carte avec son équipe qui passe, et ce que chacun fait maintenant (vraies données). */}
                      <Link to={`/legion/${e.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-legion-line bg-legion-panel shadow-lg transition hover:-translate-y-0.5 hover:border-legion-gold/50">
                        <div className="flex items-start gap-3.5 p-4 pb-3">
                          <span className="grid h-14 w-14 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-card bg-legion-line ring-1 ring-legion-line">
                            {visages.map((a) => <img key={a.id} src={a.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" />)}
                            {Array.from({ length: 4 - visages.length }).map((_, i) => <img key={`l${i}`} src="/logos/leo.png" alt="" className="h-full w-full object-cover opacity-60" />)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[20px] font-extrabold leading-tight tracking-tight text-legion-ink transition group-hover:text-legion-gold">{e.nom}</span>
                            <span className="mt-0.5 block truncate text-caption text-legion-muted">
                              {(e.studio_modeles && modeleTraduit({ ...e.studio_modeles, cle: e.modele }, i18n.language).nom) || e.modele} · {t(`legion.taille.${e.taille}`)} · {siens.length} {t('legion.agentsMot', 'agents')}
                            </span>
                          </span>
                          <IconChevronRight size={18} className="mt-1 shrink-0 text-legion-muted transition group-hover:translate-x-0.5 group-hover:text-legion-gold" />
                        </div>
                        {e.projet && <p className="line-clamp-2 px-4 text-caption leading-snug text-legion-muted">{e.projet}</p>}
                        <div className="mt-3 border-t border-legion-line bg-legion-card/50 px-3 py-2.5">
                          <BandeAgents agents={siens} messages={messagesPar[e.id] || []} taches={tachesPar[e.id] || []} t={t} />
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-legion-line px-4 py-2.5 text-[11px]">
                          <span className="flex items-center gap-1 text-legion-muted">
                            <IconPower size={12} className={allumes ? 'text-legion-success' : ''} /> {allumes}/{siens.length} {t('legion.allumesMot')}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-pill border border-legion-line bg-legion-bg px-2 py-0.5 text-legion-muted"><IconChecklist size={11} /> {taches[e.id] || 0}</span>
                            {enAttente > 0 && (
                              <span className="flex items-center gap-1 rounded-pill bg-legion-accent/20 px-2 py-0.5 font-semibold text-legion-accent">
                                <IconAlertCircle size={11} /> {enAttente}
                              </span>
                            )}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
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

          {/* Beau, 23/09: « comment ça marche dans un cabinet, une entreprise
              qui n'utilise pas Finjaro Accounting ? ». La réponse, en quatre
              temps, et en disant ce qui est déjà là et ce qui arrive. */}
          <div className="rounded-2xl border border-legion-line bg-legion-panel p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.commentCaMarche', 'Comment Léo travaille chez toi')}</p>
            <ol className="space-y-2 text-[12px] leading-snug text-legion-ink">
              <li><b className="text-legion-gold">1.</b> {t('legion.etape1', 'Tu choisis ton métier parmi plus de 50 modèles (cabinet comptable, cabinet d’avocats, laboratoire, entreprise tech, école, projet personnel…) ou tu le décris : Léo pose l’organigramme, chaque poste devient un agent.')}</li>
              <li><b className="text-legion-gold">2.</b> {t('legion.etape2', 'Tu branches TES outils : ta boutique Finjaro, ton dépôt GitHub — et bientôt ton Google (Agenda, Drive). Pas besoin d’utiliser Finjaro Accounting : les agents lisent ce que tu branches, rien d’autre.')}</li>
              <li><b className="text-legion-gold">3.</b> {t('legion.etape3', 'Tu fixes la feuille de route : le trimestre, le mois, la semaine, le jour. Chaque matin, chaque responsable écrit son plan et chaque agent rend un livrable.')}</li>
              <li><b className="text-legion-gold">4.</b> {t('legion.etape4', 'Tu valides ou tu renvoies avec une remarque. Rien ne part en ton nom sans ton clic, et tu fixes toi-même le budget du mois.')}</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-legion-line bg-legion-panel p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.actionsRapides')}</p>
            <div className="grid grid-cols-2 gap-2">
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
