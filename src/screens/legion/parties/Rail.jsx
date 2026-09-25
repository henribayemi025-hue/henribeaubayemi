import { Link } from 'react-router-dom';
import { IconSparkles, IconArrowLeft, IconBuildingSkyscraper, IconCode } from '@tabler/icons-react';
import { iconeDept } from './outils';
import { PhotoSalon } from './PhotoSalon';

// Le rail des départements — la colonne de gauche de la maquette que Beau
// préfère: une icône par département, un point vert si quelqu'un y est
// allumé, la marque en haut, « Retourner sur Finjaro » en bas.
//
// Terre & Or: terracotta profond, pas le gris ardoise de la maquette. C'est
// le style que les gens ont aimé (CLAUDE.md §6), on ne le rabote pas.
export function Rail({ entreprise, departements, courant, onChoisir, agents, onTous, onAtelier, onImmeuble, t }) {
  return (
    <aside className="hidden w-[68px] shrink-0 flex-col items-center bg-legion-panel py-3 text-legion-ink lg:flex">
      <Link to="/legion" title={t('legion.mesEntreprises')} className="mb-3 block h-11 w-11 overflow-hidden rounded-2xl shadow-lg">
        <img src="/logos/leo.png" alt="Léo" className="h-full w-full object-cover" />
      </Link>

      <button
        type="button"
        onClick={onTous}
        title={t('legion.quartierGeneral', 'Tous les salons')}
        className={`relative mb-2 flex h-11 w-11 items-center justify-center rounded-2xl transition ${courant === null ? 'bg-legion-card text-legion-gold shadow-lg' : 'bg-legion-card hover:bg-legion-card-haut'}`}
      >
        <IconSparkles size={20} />
      </button>
      <div className="my-1 h-px w-8 bg-legion-line" />

      <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
        {departements.map((d) => {
          const Icone = iconeDept(d.cle, d.nom);
          const desAgents = agents.filter((a) => !a.user_id && a.departement && a.departement === d.nom);
          const allumes = desAgents.filter((a) => a.actif).length;
          const choisi = courant === d.id;
          return (
            <div key={d.id} className="group relative">
              <button
                type="button"
                onClick={() => onChoisir(d.id)}
                title={d.nom}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition ${choisi ? 'bg-legion-card text-legion-ink shadow-lg' : 'bg-legion-card text-legion-muted hover:bg-legion-card-haut hover:text-legion-ink'}`}
                style={choisi ? { color: d.couleur } : undefined}
              >
                <PhotoSalon salon={d} agents={agents} Icone={Icone} taille={44} arrondi="rounded-2xl" />
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-legion-panel ${allumes > 0 ? 'bg-legion-success' : 'bg-legion-line'}`}
                  title={`${allumes}/${desAgents.length}`}
                />
                {choisi && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-legion-gold" />}
              </button>
              <div className="pointer-events-none absolute left-14 top-1/2 z-50 ml-1 -translate-y-1/2 whitespace-nowrap rounded-card border border-legion-line bg-legion-card px-2.5 py-1.5 text-caption text-legion-ink opacity-0 shadow-xl transition group-hover:opacity-100">
                <div className="font-semibold" style={{ color: d.couleur }}>{d.nom}</div>
                {d.a_quoi_ca_sert && <div className="text-legion-muted">{d.a_quoi_ca_sert}</div>}
                <div className="text-[11px] text-legion-muted">{t('legion.allumesSur', { n: allumes, total: desAgents.length })}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* L'immeuble en direct (25/09, Beau : « je ne vois pas où ils travaillent ensemble ») */}
      {onImmeuble && (
        <button type="button" onClick={onImmeuble} title={t('legion.immeuble.entree')}
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-legion-gold/50 bg-legion-card text-[20px] transition hover:bg-legion-card-haut">🏢</button>
      )}

      {/* L'Atelier de code (V0, 24/09) : seulement là où il est ouvert. */}
      {onAtelier && (
        <button
          type="button"
          onClick={onAtelier}
          title={t('legion.atelier.entree')}
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-legion-gold/50 bg-legion-card text-legion-gold transition hover:bg-legion-card-haut"
        >
          <IconCode size={20} />
        </button>
      )}

      <Link
        to="/apps"
        className="mt-2 flex w-[52px] flex-col items-center gap-0.5 rounded-card bg-legion-gold px-1 py-2 text-center text-[10px] font-semibold leading-tight text-legion-ink shadow-md transition hover:brightness-105"
        title={t('legion.retourFinjaro')}
      >
        <IconArrowLeft size={14} />
        Finjaro
      </Link>
      <span className="mt-2 truncate px-1 font-mono text-[9px] tracking-tight text-legion-muted" title={entreprise.nom}>
        <IconBuildingSkyscraper size={12} className="mx-auto" />
      </span>
    </aside>
  );
}

// Sur téléphone, le même rail à plat: des pastilles qui défilent.
export function RailPastilles({ departements, courant, onChoisir, onTous, agents, onAtelier, onImmeuble, t }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-legion-line bg-legion-card px-3 py-2 lg:hidden" style={{ scrollbarWidth: 'none' }}>
      <button
        type="button"
        onClick={onTous}
        className={`flex shrink-0 items-center gap-1 rounded-pill px-3 py-1.5 text-caption font-semibold ${courant === null ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}
      >
        <IconSparkles size={14} /> {t('legion.tous', 'Tous')}
      </button>
      {onImmeuble && (
        <button type="button" onClick={onImmeuble}
          className="flex shrink-0 items-center gap-1 rounded-pill border border-legion-gold/60 bg-legion-gold/15 px-3 py-1.5 text-caption font-semibold text-legion-ink">
          🏢 {t('legion.immeuble.entreeCourte')}
        </button>
      )}
      {onAtelier && (
        <button
          type="button"
          onClick={onAtelier}
          className="flex shrink-0 items-center gap-1 rounded-pill border border-legion-gold/60 px-3 py-1.5 text-caption font-semibold text-legion-gold"
        >
          <IconCode size={14} /> {t('legion.atelier.entreeCourte')}
        </button>
      )}
      {departements.map((d) => {
        const Icone = iconeDept(d.cle, d.nom);
        const choisi = courant === d.id;
        const allumes = agents.filter((a) => !a.user_id && a.departement === d.nom && a.actif).length;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChoisir(d.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-semibold transition ${choisi ? 'text-white' : 'border border-legion-line text-legion-ink'}`}
            style={choisi ? { backgroundColor: d.couleur } : undefined}
          >
            <Icone size={14} /> {d.nom}
            {allumes > 0 && <span className={`h-1.5 w-1.5 rounded-full ${choisi ? 'bg-legion-card' : 'bg-legion-success'}`} />}
          </button>
        );
      })}
    </div>
  );
}
