import { useCallback, useEffect, useState } from 'react';
import { IconCalendarEvent, IconPlayerPlay } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { espacerPhrases } from './outils';

// LEGION — les plans, et le bouton « Au travail ».
//
// Beau, 22/09: « le directeur ne sait pas ce qu'on va faire aujourd'hui,
// demain. Quel est le plan de la semaine ? Du mois ? Rien. » Chaque matin
// (fonction legion-travail), chaque responsable de département écrit son
// plan de la semaine et, une fois par mois, celui du mois; puis chaque
// agent allumé rend un livrable sur sa tâche. Ici: les derniers plans par
// département, et le bouton pour lancer la journée tout de suite.

export function Plans({ entreprise, t }) {
  const [plans, setPlans] = useState([]);
  const [ouvert, setOuvert] = useState(null);
  const [etat, setEtat] = useState(''); // '' | 'encours' | 'fait' | erreur

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_plans').select('id, departement, horizon, contenu, created_at')
      .eq('entreprise_id', entreprise.id).order('created_at', { ascending: false }).limit(40);
    // Le dernier plan de chaque département, par horizon.
    const vus = new Set();
    const derniers = [];
    for (const p of data || []) {
      const k = `${p.departement}|${p.horizon}`;
      if (vus.has(k)) continue;
      vus.add(k); derniers.push(p);
    }
    setPlans(derniers);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);

  async function auTravail() {
    if (etat === 'encours') return;
    setEtat('encours');
    const { data, error } = await supabase.functions.invoke('legion-travail', { body: { entreprise_id: entreprise.id } });
    if (error || data?.erreur) setEtat(data?.erreur || error.message);
    else {
      // La journée se fait en tranches côté serveur: les plans et les
      // livrables continuent d'arriver après cette réponse.
      setEtat('fait'); charger();
      setTimeout(charger, 60_000); setTimeout(charger, 150_000);
      setTimeout(() => setEtat(''), 8000);
    }
  }

  // UN plan (Beau, 22/09: « tu ne m'envoies pas quatre plans différents »):
  // celui de la Direction est le plan de l'entreprise; ceux des
  // départements sont ses annexes, repliées.
  const estDirection = (p) => /^direction$/i.test(String(p.departement || '').normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const semaines = plans.filter((p) => p.horizon === 'semaine');
  const principal = semaines.find(estDirection) || null;
  const annexes = semaines.filter((p) => p !== principal);
  const moisDe = (p) => plans.find((x) => x.departement === p.departement && x.horizon === 'mois');
  const date = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconCalendarEvent size={15} className="text-legion-gold" /> {t('legion.plansTitre', { nom: entreprise.nom, defaultValue: 'Le plan de {{nom}}' })}
        </h3>
        <button type="button" onClick={auTravail} disabled={etat === 'encours'}
          className="inline-flex items-center gap-1.5 rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-60">
          <IconPlayerPlay size={13} />
          {etat === 'encours' ? t('legion.auTravailEnCours', 'Ils se mettent au travail…') : etat === 'fait' ? t('legion.auTravailFait', '✓ Lancé — les plans et livrables arrivent dans les salons') : t('legion.auTravail', 'Au travail maintenant')}
        </button>
      </div>
      {etat && etat !== 'encours' && etat !== 'fait' && <p className="text-[12px] text-legion-danger">{etat}</p>}
      {semaines.length === 0 ? (
        <p className="text-[12px] leading-snug text-legion-muted">{t('legion.plansVide', 'Aucun plan encore. Chaque matin, chaque responsable écrit le plan de son département et chaque agent allumé rend un livrable sur sa tâche. Touche « Au travail maintenant » pour ne pas attendre demain.')}</p>
      ) : (
        <>
        {principal && (
          <div className="space-y-3">
            <p className="text-[11px] text-legion-muted">{t('legion.planSemaineDu', { date: date(principal.created_at), defaultValue: 'Semaine du {{date}}' })}</p>
            <Texte contenu={principal.contenu} className="text-[13.5px] leading-snug text-legion-ink" />
            {moisDe(principal) && (
              <details className="rounded-card border border-legion-line bg-legion-bg px-3 py-2">
                <summary className="cursor-pointer text-[12px] font-semibold text-legion-ink">{t('legion.planDuMois', 'Le plan du mois')}</summary>
                <div className="pt-2"><Texte contenu={moisDe(principal).contenu} /></div>
              </details>
            )}
          </div>
        )}
        {annexes.length > 0 && <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-legion-muted">{t('legion.plansAnnexes', 'Par département')}</p>}
        <ul className="space-y-2">
          {annexes.map((p) => {
            const mois = moisDe(p);
            const estOuvert = ouvert === p.id;
            return (
              <li key={p.id} className="rounded-card border border-legion-line bg-legion-bg">
                <button type="button" onClick={() => setOuvert(estOuvert ? null : p.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
                  <span className="text-[13px] font-semibold text-legion-ink">{p.departement}</span>
                  <span className="text-[11px] text-legion-muted">{t('legion.planDu', { date: date(p.created_at), defaultValue: 'plan du {{date}}' })}{mois ? ` · ${t('legion.planMois', 'mois')}` : ''} {estOuvert ? '▴' : '▾'}</span>
                </button>
                {estOuvert && (
                  <div className="space-y-3 border-t border-legion-line px-3 py-2">
                    <Texte contenu={p.contenu} />
                    {mois && (<>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-legion-muted">{t('legion.planDuMois', 'Le plan du mois')}</p>
                      <Texte contenu={mois.contenu} />
                    </>)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </>
      )}
    </section>
  );
}

// Le Markdown léger des agents (## titres, - listes, **gras**), sans
// bibliothèque: ce sont les seules formes qu'on leur demande. Servi ici et
// dans les bulles des salons (Beau, 22/09: « mets ça point par point, bien
// clair, présentable »).
export function Texte({ contenu, className = 'text-[13px] leading-snug text-legion-ink', titre = 'text-legion-gold' }) {
  const lignes = espacerPhrases(contenu).split('\n');
  return (
    <div className={`space-y-1 ${className}`}>
      {lignes.map((l, i) => {
        if (/^#{1,3}\s/.test(l)) return <p key={i} className={`pt-1 text-[12px] font-bold uppercase tracking-wide ${titre}`}>{l.replace(/^#{1,3}\s*/, '')}</p>;
        if (/^\s*(\d+[.)]|[-•*])\s/.test(l)) return <p key={i} className="pl-3 before:mr-1.5 before:content-['–']">{gras(l.replace(/^\s*(\d+[.)]|[-•*])\s*/, ''))}</p>;
        if (!l.trim()) return null;
        return <p key={i}>{gras(l)}</p>;
      })}
    </div>
  );
}
// Un texte d'agent qui contient un titre ou une liste mérite la mise en
// forme; un simple salut reste une phrase.
export const estStructure = (s) => /(^|\n)(#{1,3}\s|\s*(\d+[.)]|[-•*])\s)/.test(String(s || ''));
function gras(s) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}
