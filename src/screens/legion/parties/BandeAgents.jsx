import { useMemo } from 'react';
import { Visage } from './Visage';
import { quiOuEst, etatDe } from '../monde3d/monde';

// La bande des agents qui défile (Beau, 25/09 : « comme dans Finjaro, que les choses défilent,
// les images des agents, on montre comment ils travaillent »). Chaque visage passe avec ce que
// l'agent fait VRAIMENT maintenant : sa tâche en cours, en réunion, en pause, vient de rendre,
// disponible, ou éteint. Rien n'est inventé : sans agent, la bande le dit.
const POINT = { travaille: 'bg-legion-success animate-pulse', reunion: 'bg-legion-gold', pause: 'bg-legion-gold', aFaire: 'bg-legion-gold', rendu: 'bg-legion-teal', veille: 'bg-legion-line', dispo: 'bg-legion-success' };

export function BandeAgents({ agents = [], messages = [], taches = [], t, taille = 30, className = '' }) {
  const lignes = useMemo(() => {
    const machines = agents.filter((a) => !a.user_id);
    const ou = quiOuEst({ agents: machines, messages, taches });
    const rang = { travaille: 0, reunion: 1, rendu: 2, aFaire: 3, pause: 4, dispo: 5, veille: 6 };
    return machines.map((a) => ({ a, ...etatDe(a, ou, taches) })).sort((x, y) => rang[x.etat] - rang[y.etat]);
  }, [agents, messages, taches]);
  if (!lignes.length) return <p className={`text-caption text-legion-muted ${className}`}>{t('legion.bande.personne', 'Aucun agent encore.')}</p>;
  // Le texte court d'un état : la tâche, ramenée à quelques mots.
  const libelle = (l) => {
    const base = t(`legion.monde.activite.${l.etat}`, { n: l.n ?? 0 });
    const texte = l.texte ? String(l.texte).replace(/^.*?te demande : /, '').replace(/\s+/g, ' ').trim() : '';
    return texte ? `${base} ${texte.length > 42 ? `${texte.slice(0, 41)}…` : texte}` : base;
  };
  const piste = [...lignes, ...lignes]; // deux fois : la boucle est invisible
  return (
    <div className={`leo-defile ${className}`} style={{ '--leo-defile-duree': `${Math.max(18, lignes.length * 6)}s` }} aria-label={t('legion.bande.titre', 'Ce que fait l’équipe en ce moment')}>
      <div className="leo-defile-piste">
        {piste.map((l, i) => (
          <span key={`${l.a.id}-${i}`} className="flex shrink-0 items-center gap-2 rounded-pill border border-legion-line bg-legion-panel py-1 pl-1 pr-3" aria-hidden={i >= lignes.length}>
            <Visage a={l.a} taille={taille} point={false} />
            <span className="text-left leading-tight">
              <span className="block text-[12px] font-semibold text-legion-ink">{l.a.nom}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-legion-muted"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${POINT[l.etat]}`} />{libelle(l)}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
