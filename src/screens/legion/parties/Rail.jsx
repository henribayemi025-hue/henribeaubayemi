import { Link } from 'react-router-dom';
import { IconSparkles, IconArrowLeft, IconBuildingSkyscraper } from '@tabler/icons-react';
import { iconeDept } from './outils';

// Le rail des départements — la colonne de gauche de la maquette que Beau
// préfère: une icône par département, un point vert si quelqu'un y est
// allumé, la marque en haut, « Retourner sur Finjaro » en bas.
//
// Terre & Or: terracotta profond, pas le gris ardoise de la maquette. C'est
// le style que les gens ont aimé (CLAUDE.md §6), on ne le rabote pas.
export function Rail({ entreprise, departements, courant, onChoisir, agents, onTous, t }) {
  return (
    <aside className="hidden w-[68px] shrink-0 flex-col items-center bg-gradient-to-b from-teal to-[#8E3F22] py-3 text-white lg:flex">
      <Link to="/legion" title={t('legion.mesEntreprises')} className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 font-serif text-[22px] font-semibold text-white shadow-inner">
        L
      </Link>

      <button
        type="button"
        onClick={onTous}
        title={t('legion.quartierGeneral', 'Tous les salons')}
        className={`relative mb-2 flex h-11 w-11 items-center justify-center rounded-2xl transition ${courant === null ? 'bg-white text-teal shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
      >
        <IconSparkles size={20} />
      </button>
      <div className="my-1 h-px w-8 bg-white/25" />

      <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
        {departements.map((d) => {
          const Icone = iconeDept(d.cle);
          const desAgents = agents.filter((a) => !a.user_id && a.departement && a.departement === d.nom);
          const allumes = desAgents.filter((a) => a.actif).length;
          const choisi = courant === d.id;
          return (
            <div key={d.id} className="group relative">
              <button
                type="button"
                onClick={() => onChoisir(d.id)}
                title={d.nom}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition ${choisi ? 'bg-white text-ink shadow-lg' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}
                style={choisi ? { color: d.couleur } : undefined}
              >
                <Icone size={20} />
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#A94A2B] ${allumes > 0 ? 'bg-success' : 'bg-white/40'}`}
                  title={`${allumes}/${desAgents.length}`}
                />
                {choisi && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-brass" />}
              </button>
              <div className="pointer-events-none absolute left-14 top-1/2 z-50 ml-1 -translate-y-1/2 whitespace-nowrap rounded-card border border-hairline bg-white px-2.5 py-1.5 text-caption text-ink opacity-0 shadow-xl transition group-hover:opacity-100">
                <div className="font-semibold" style={{ color: d.couleur }}>{d.nom}</div>
                {d.a_quoi_ca_sert && <div className="text-muted">{d.a_quoi_ca_sert}</div>}
                <div className="text-[11px] text-muted">{t('legion.allumesSur', { n: allumes, total: desAgents.length })}</div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/apps"
        className="mt-2 flex w-[52px] flex-col items-center gap-0.5 rounded-card bg-brass px-1 py-2 text-center text-[10px] font-semibold leading-tight text-ink shadow-md transition hover:brightness-105"
        title={t('legion.retourFinjaro')}
      >
        <IconArrowLeft size={14} />
        Finjaro
      </Link>
      <span className="mt-2 truncate px-1 font-mono text-[9px] tracking-tight text-white/60" title={entreprise.nom}>
        <IconBuildingSkyscraper size={12} className="mx-auto" />
      </span>
    </aside>
  );
}

// Sur téléphone, le même rail à plat: des pastilles qui défilent.
export function RailPastilles({ departements, courant, onChoisir, onTous, agents, t }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-hairline bg-white px-3 py-2 lg:hidden" style={{ scrollbarWidth: 'none' }}>
      <button
        type="button"
        onClick={onTous}
        className={`flex shrink-0 items-center gap-1 rounded-pill px-3 py-1.5 text-caption font-semibold ${courant === null ? 'bg-ink text-white' : 'border border-hairline text-muted'}`}
      >
        <IconSparkles size={14} /> {t('legion.tous', 'Tous')}
      </button>
      {departements.map((d) => {
        const Icone = iconeDept(d.cle);
        const choisi = courant === d.id;
        const allumes = agents.filter((a) => !a.user_id && a.departement === d.nom && a.actif).length;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChoisir(d.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-semibold transition ${choisi ? 'text-white' : 'border border-hairline text-ink'}`}
            style={choisi ? { backgroundColor: d.couleur } : undefined}
          >
            <Icone size={14} /> {d.nom}
            {allumes > 0 && <span className={`h-1.5 w-1.5 rounded-full ${choisi ? 'bg-white' : 'bg-success'}`} />}
          </button>
        );
      })}
    </div>
  );
}
