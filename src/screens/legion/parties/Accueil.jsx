import { useState } from 'react';
import {
  IconSparkles, IconSend, IconArrowRight, IconRobot, IconPower, IconLayoutKanban,
  IconBuildingSkyscraper, IconChevronRight, IconMessageCircle, IconCamera, IconAlertCircle,
  IconHandGrab, IconChecklist,
} from '@tabler/icons-react';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { iconeDept, statutDe, STATUTS } from './outils';
import { Memoire } from './Memoire';
import { EquiperEquipe } from './Competences';
import { Depense } from './Depense';
import { Plans } from './Plans';
import { Connecteurs } from './Connecteurs';

// LEGION — la page d'accueil, la tour de contrôle.
//
// Beau, 22/09, en envoyant sa maquette: « voici le truc, prends la page
// d'accueil comme c'est ici ». C'est fait: le bandeau d'ouverture, la barre
// de directive, les quatre compteurs, la grille des départements, et en bas
// les chantiers et le trombinoscope.
//
// UNE SEULE CHOSE CHANGE par rapport à sa maquette, et il faut qu'il le
// sache: elle affiche du MRR, « 99,4 % de consensus », « 26 mois de
// runway », « +14 % vs hier », « latence 420 ms ». Rien de tout ça n'est
// mesuré — c'est le modèle qui a rempli les cases pour faire joli. La règle
// de la maison est qu'un chiffre non mesuré ne s'écrit pas (CLAUDE.md §3).
// Donc: même disposition, mêmes cartes, mais on n'y met que ce qu'on sait
// compter — les agents, ceux qui sont allumés, ceux qui ont choisi leur
// visage, les tâches par colonne, les questions sans réponse. Le jour où on
// mesurera la trésorerie, la carte est prête à la recevoir.

export function Accueil({
  entreprise, departements, agents, messages, taches, moi,
  onEntrer, onOuvrirSalon, onEcrireA, onFiche, onKanban,
  onAllumer, onAllumerTous, onDirective, onVraiesPhotos, photosEnCours,
  sansPhoto, aChoisir, t,
}) {
  const [directive, setDirective] = useState('');
  const [cible, setCible] = useState(departements[0]?.id || '');
  const [envoi, setEnvoi] = useState(false);

  const machines = agents.filter((a) => !a.user_id);
  const allumes = machines.filter((a) => a.actif).length;
  const tousAllumes = allumes === machines.length && machines.length > 0;
  const ontChoisi = machines.filter((a) => a.choisi_par_lui).length;
  const enAttente = messages.filter((m) => ['question', 'decision'].includes(m.genre) && !m.repondu_le).length;
  const libres = taches.filter((x) => !x.assigne_a && !x.termine_le).length;
  const faites = taches.filter((x) => statutDe(x) === 'fait').length;

  async function envoyerDirective(e) {
    e.preventDefault();
    const corps = directive.trim();
    if (!corps || envoi) return;
    setEnvoi(true);
    try { await onDirective(corps, cible); setDirective(''); } finally { setEnvoi(false); }
  }

  const RACCOURCIS = [
    ['🎯', t('legion.directive1'), 'direction'],
    ['🔭', t('legion.directive2'), 'concurrence'],
    ['🚀', t('legion.directive3'), 'marketing'],
    ['💳', t('legion.directive4'), 'argent'],
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto bg-legion-bg p-4 md:p-6 lg:p-8">
      {/* 1. L'ouverture */}
      <section className="relative overflow-hidden rounded-2xl border border-legion-line bg-gradient-to-br from-legion-panel via-legion-panel to-legion-bg p-5 shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-pill border border-legion-gold/30 bg-legion-gold/10 px-3 py-1 text-[11px] font-medium text-legion-gold">
              <IconSparkles size={13} /> {t('legion.tourDeControle')}
              <span className="h-1 w-1 rounded-full bg-legion-gold" />
              <span className="font-mono text-[10px]">{entreprise.nom}</span>
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-legion-ink sm:text-3xl lg:text-4xl">
              {t('legion.heroTitre1')}{' '}
              <span className="bg-gradient-to-r from-legion-gold via-legion-gold-soft to-legion-teal bg-clip-text text-transparent">
                {t('legion.heroTitre2')}
              </span>
            </h1>
            <p className="text-body leading-relaxed text-legion-muted">
              {t('legion.heroTexte', { departements: departements.length, agents: machines.length, allumes })}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button type="button" onClick={() => onEntrer()}
                className="inline-flex items-center gap-2 rounded-card bg-gradient-to-r from-legion-gold to-legion-accent px-4 py-2.5 text-caption font-semibold text-legion-bg shadow-lg transition hover:brightness-110">
                <IconSparkles size={16} /> {t('legion.entrerQG')} <IconArrowRight size={15} />
              </button>
              <button type="button" onClick={onKanban}
                className="inline-flex items-center gap-2 rounded-card border border-legion-line bg-legion-card px-4 py-2.5 text-caption font-medium text-legion-ink transition hover:bg-legion-card-haut">
                <IconLayoutKanban size={16} className="text-legion-gold" />
                {t('legion.tableauTaches')} ({taches.length})
              </button>
              {sansPhoto > 0 && (
                <button type="button" onClick={() => onVraiesPhotos(null)} disabled={photosEnCours}
                  title={t('legion.photosCoutent')}
                  className="inline-flex items-center gap-2 rounded-card border border-legion-gold/40 bg-legion-gold/10 px-4 py-2.5 text-caption font-medium text-legion-gold transition hover:bg-legion-gold/20 disabled:opacity-50">
                  <IconCamera size={16} />
                  {photosEnCours ? t('legion.photosEnCours') : `${t('legion.vraiesPhotos')} (${sansPhoto})`}
                </button>
              )}
            </div>
          </div>

          {/* L'interrupteur général, comme sur la maquette */}
          <div className="w-full shrink-0 space-y-4 rounded-card border border-legion-line bg-legion-bg/80 p-5 lg:w-[280px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">
                <IconPower size={13} className="text-legion-gold" /> {t('legion.interrupteurGeneral')}
              </span>
              <span className={`rounded px-2 py-0.5 font-mono text-[11px] ${tousAllumes ? 'border border-legion-success/40 bg-legion-success/15 text-legion-success' : 'border border-legion-line bg-legion-card text-legion-muted'}`}>
                {allumes}/{machines.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-card border border-legion-line bg-legion-card p-3">
              <div className="min-w-0">
                <p className="text-caption font-semibold text-legion-ink">
                  {tousAllumes ? t('legion.tousActifs') : t('legion.partiellementEnVeille')}
                </p>
                <p className="text-[11px] text-legion-muted">{t('legion.pretsARepondre', { n: allumes })}</p>
              </div>
              <Interrupteur on={allumes > 0} onChange={(v) => onAllumerTous(v)} label={t('legion.interrupteurGeneral')} />
            </div>
            <p className="flex items-center justify-between border-t border-legion-line pt-2 text-[11px] text-legion-muted">
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${allumes > 0 ? 'animate-pulse bg-legion-success' : 'bg-legion-muted'}`} />
                {t('legion.moteur')}
              </span>
              <span className="font-mono">{ontChoisi}/{machines.length} {t('legion.ontLeurVisage')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Donner un ordre, tout de suite */}
      <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-caption font-semibold text-legion-ink">
            <IconSparkles size={15} className="text-legion-gold" /> {t('legion.directiveTitre')}
          </p>
          <span className="hidden text-[11px] text-legion-muted sm:inline">{t('legion.directiveAide')}</span>
        </div>
        <form onSubmit={envoyerDirective} className="space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <select value={cible} onChange={(e) => setCible(e.target.value)}
              className="input shrink-0 sm:w-64" aria-label={t('legion.directiveCible')}>
              {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <div className="relative flex-1">
              <input value={directive} onChange={(e) => setDirective(e.target.value)}
                placeholder={t('legion.directivePlaceholder')} className="input w-full pr-28" />
              <button type="submit" disabled={!directive.trim() || envoi}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-input bg-legion-gold px-3 py-1.5 text-[12px] font-bold text-legion-bg transition disabled:opacity-40">
                {envoi ? t('legion.envoiEnCours') : t('legion.transmettre')} <IconSend size={13} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px]" style={{ scrollbarWidth: 'none' }}>
            <span className="shrink-0 font-medium text-legion-muted">{t('legion.directivesTypes')}</span>
            {RACCOURCIS.map(([emoji, texte, cle]) => {
              const d = departements.find((x) => x.cle === cle);
              if (!d) return null;
              return (
                <button key={cle} type="button" onClick={() => { setDirective(texte); setCible(d.id); }}
                  className="shrink-0 whitespace-nowrap rounded-input border border-legion-line bg-legion-card px-2.5 py-1 text-legion-muted transition hover:bg-legion-card-haut hover:text-legion-ink">
                  {emoji} {texte}
                </button>
              );
            })}
          </div>
        </form>
      </section>

      {/* 3. Les quatre compteurs — et QUE des chiffres mesurés */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Compteur titre={t('legion.kpiAgents')} icone={<IconRobot size={15} className="text-legion-gold" />}
          valeur={allumes} suffixe={`/ ${machines.length} ${t('legion.allumesMot')}`}
          barre={machines.length ? (allumes / machines.length) * 100 : 0}
          bas={t('legion.kpiDepartements', { n: departements.length })} t={t} />
        <Compteur titre={t('legion.kpiVisages')} icone={<IconCamera size={15} className="text-legion-teal" />}
          valeur={ontChoisi} suffixe={`/ ${machines.length}`}
          barre={machines.length ? (ontChoisi / machines.length) * 100 : 0}
          bas={aChoisir > 0 ? t('legion.kpiResteAChoisir', { n: aChoisir }) : t('legion.tousOntChoisi')} t={t} />
        <Compteur titre={t('legion.kpiAttente')} icone={<IconAlertCircle size={15} className="text-legion-accent" />}
          valeur={enAttente} bas={enAttente > 0 ? t('legion.kpiAttenteBas') : t('legion.kpiRienNAttend')} t={t} />
        <Compteur titre={t('legion.kpiTaches')} icone={<IconChecklist size={15} className="text-legion-success" />}
          valeur={taches.length} suffixe={`· ${faites} ${t('legion.faitesMot')}`}
          barre={taches.length ? (faites / taches.length) * 100 : 0}
          bas={libres > 0 ? t('legion.kpiLibres', { n: libres }) : t('legion.kpiToutesPrises')} t={t} />
      </section>

      {/* 4. Les départements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-section text-legion-ink">
              <IconBuildingSkyscraper size={18} className="text-legion-gold" />
              {t('legion.lesDepartements', { n: departements.length })}
            </h2>
            <p className="text-[11px] text-legion-muted">{t('legion.departementsAide')}</p>
          </div>
          <button type="button" onClick={() => onEntrer()}
            className="flex items-center gap-1 text-[12px] font-medium text-legion-gold hover:brightness-110">
            {t('legion.entrerQG')} <IconChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {departements.map((d) => {
            const Icone = iconeDept(d.cle);
            const siens = machines.filter((a) => a.departement === d.nom);
            const actifs = siens.filter((a) => a.actif).length;
            const chef = siens.find((a) => a.est_directeur) || siens[0];
            return (
              <div key={d.id} className="group flex flex-col justify-between rounded-card border border-legion-line bg-legion-panel p-4 transition hover:border-legion-gold/40">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-white shadow-sm" style={{ backgroundColor: d.couleur }}>
                        <Icone size={17} />
                      </span>
                      <h3 className="truncate text-caption font-bold text-legion-ink transition group-hover:text-legion-gold">{d.nom}</h3>
                    </div>
                    <span className={`shrink-0 rounded-pill border px-2 py-0.5 text-[10px] font-medium ${actifs > 0 ? 'border-legion-success/40 bg-legion-success/15 text-legion-success' : 'border-legion-line bg-legion-card text-legion-muted'}`}>
                      {actifs}/{siens.length}
                    </span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-legion-muted">{d.a_quoi_ca_sert}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-legion-line pt-3">
                    <div className="flex -space-x-1.5">
                      {siens.slice(0, 6).map((a) => (
                        <button key={a.id} type="button" onClick={() => onFiche(a)} title={`${a.nom} — ${a.poste}`}>
                          <Visage a={a} taille={24} point={false} className="ring-2 ring-legion-panel" />
                        </button>
                      ))}
                      {siens.length > 6 && <span className="ml-3 self-center text-[10px] text-legion-muted">+{siens.length - 6}</span>}
                    </div>
                    {chef && <span className="max-w-[120px] truncate text-[11px] text-legion-muted">{t('legion.chef')} <strong className="text-legion-ink">{chef.nom}</strong></span>}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-legion-line pt-3">
                  <button type="button" onClick={() => onOuvrirSalon(d.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-input bg-legion-card px-2.5 py-1.5 text-[12px] font-medium text-legion-ink transition hover:bg-legion-card-haut">
                    <IconMessageCircle size={13} /> {d.nom}
                  </button>
                  {chef && (
                    <button type="button" onClick={() => onEcrireA(chef)} title={`${t('legion.ouvrirDiscussion')} — ${chef.nom}`}
                      className="rounded-input border border-legion-gold/30 bg-legion-gold/10 px-2.5 py-1.5 text-[12px] font-medium text-legion-gold transition hover:bg-legion-gold/20">
                      1:1
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Les chantiers, et le trombinoscope */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
          <div className="flex items-center justify-between border-b border-legion-line pb-3">
            <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
              <IconLayoutKanban size={15} className="text-legion-gold" /> {t('legion.chantiers')}
            </h3>
            <button type="button" onClick={onKanban} className="flex items-center gap-1 text-[12px] font-medium text-legion-gold hover:brightness-110">
              {t('legion.toutVoir')} <IconChevronRight size={13} />
            </button>
          </div>
          {taches.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-legion-muted">{t('legion.aucuneTache')}</p>
          ) : taches.slice(0, 5).map((x) => {
            const a = agents.find((z) => z.id === x.assigne_a);
            const st = STATUTS.find((k) => k.cle === statutDe(x));
            return (
              <button key={x.id} type="button" onClick={onKanban}
                className="flex w-full items-start gap-2.5 rounded-card border border-legion-line bg-legion-card p-2.5 text-left transition hover:bg-legion-card-haut">
                {a ? <Visage a={a} taille={24} point={false} /> : <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-dashed border-legion-line" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-legion-ink">{x.texte}</span>
                  <span className="text-[11px]" style={{ color: st?.couleur }}>{t(`legion.statut.${statutDe(x)}`)}</span>
                  {!a && <span className="ml-2 text-[11px] text-legion-muted">· {t('legion.libre')}</span>}
                </span>
              </button>
            );
          })}
        </section>

        <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-legion-line pb-3">
            <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
              <IconRobot size={15} className="text-legion-gold" /> {t('legion.trombinoscope', { n: machines.length })}
            </h3>
            <span className="text-[11px] text-legion-muted">{t('legion.interrupteur')}</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {machines.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-center gap-2.5 rounded-card border border-legion-line bg-legion-card p-2.5">
                <button type="button" onClick={() => onFiche(a)} className="shrink-0"><Visage a={a} taille={34} /></button>
                <button type="button" onClick={() => onEcrireA(a)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[12px] font-semibold text-legion-ink">{a.nom}</span>
                  <span className="block truncate text-[11px] text-legion-muted">{a.poste}</span>
                </button>
                <Interrupteur petit on={!!a.actif} onChange={(v) => onAllumer(a, v)} label={a.actif ? t('legion.eteindre') : t('legion.allumer')} />
              </li>
            ))}
          </ul>
          {machines.length > 12 && (
            <button type="button" onClick={() => onEntrer('equipe')} className="w-full rounded-card border border-legion-line py-2 text-[12px] font-medium text-legion-gold transition hover:bg-legion-card">
              {t('legion.etPlusPersonnes', { count: machines.length - 12 })}
            </button>
          )}
        </section>
      </div>

      {/* 6. Les plans par département, et « Au travail maintenant » */}
      <Plans entreprise={entreprise} t={t} />

      {/* 7. Les compétences: que l'équipe s'équipe (chantier 2) */}
      <EquiperEquipe entrepriseId={entreprise.id} agents={agents} t={t} />

      {/* 8. La mémoire, les connecteurs, et ce que Legion coûte */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Memoire entrepriseId={entreprise.id} t={t} /></div>
        <div className="space-y-6">
          <Connecteurs entreprise={entreprise} t={t} />
          <Depense entreprise={entreprise} t={t} />
        </div>
      </div>
    </div>
  );
}

function Compteur({ titre, icone, valeur, suffixe, barre, bas }) {
  return (
    <div className="flex flex-col justify-between rounded-card border border-legion-line bg-legion-panel p-4 transition hover:border-legion-gold/30">
      <div className="flex items-center justify-between text-legion-muted">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{titre}</span>
        {icone}
      </div>
      <div className="my-2.5">
        <p className="flex items-baseline gap-1.5 text-2xl font-bold text-legion-ink">
          {valeur}
          {suffixe && <span className="text-caption font-normal text-legion-muted">{suffixe}</span>}
        </p>
        {typeof barre === 'number' && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-legion-card">
            <div className="h-full rounded-full bg-legion-gold transition-all" style={{ width: `${Math.min(100, barre)}%` }} />
          </div>
        )}
      </div>
      <p className="border-t border-legion-line pt-1.5 text-[11px] text-legion-muted">{bas}</p>
    </div>
  );
}
