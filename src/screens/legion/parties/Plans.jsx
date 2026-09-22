import { useCallback, useEffect, useState } from 'react';
import { IconCalendarEvent, IconPlayerPlay } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

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
    else { setEtat('fait'); charger(); setTimeout(() => setEtat(''), 4000); }
  }

  const semaines = plans.filter((p) => p.horizon === 'semaine');
  const date = (s) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconCalendarEvent size={15} className="text-legion-gold" /> {t('legion.plansTitre', 'Le plan de la semaine, par département')}
        </h3>
        <button type="button" onClick={auTravail} disabled={etat === 'encours'}
          className="inline-flex items-center gap-1.5 rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-60">
          <IconPlayerPlay size={13} />
          {etat === 'encours' ? t('legion.auTravailEnCours', 'Ils travaillent… (une à trois minutes)') : etat === 'fait' ? t('legion.auTravailFait', '✓ Livré dans les salons') : t('legion.auTravail', 'Au travail maintenant')}
        </button>
      </div>
      {etat && etat !== 'encours' && etat !== 'fait' && <p className="text-[12px] text-legion-danger">{etat}</p>}
      {semaines.length === 0 ? (
        <p className="text-[12px] leading-snug text-legion-muted">{t('legion.plansVide', 'Aucun plan encore. Chaque matin, chaque responsable écrit le plan de son département et chaque agent allumé rend un livrable sur sa tâche. Touche « Au travail maintenant » pour ne pas attendre demain.')}</p>
      ) : (
        <ul className="space-y-2">
          {semaines.map((p) => {
            const mois = plans.find((x) => x.departement === p.departement && x.horizon === 'mois');
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
      )}
    </section>
  );
}

// Le Markdown léger des agents (## titres, - listes, **gras**), sans
// bibliothèque: ce sont les seules formes qu'on leur demande.
function Texte({ contenu }) {
  const lignes = String(contenu || '').split('\n');
  return (
    <div className="space-y-1 text-[13px] leading-snug text-legion-ink">
      {lignes.map((l, i) => {
        if (/^##\s/.test(l)) return <p key={i} className="pt-1 text-[12px] font-bold uppercase tracking-wide text-legion-gold">{l.replace(/^##\s*/, '')}</p>;
        if (/^[-•]\s/.test(l)) return <p key={i} className="pl-3 before:mr-1.5 before:content-['–']">{gras(l.replace(/^[-•]\s*/, ''))}</p>;
        if (!l.trim()) return null;
        return <p key={i}>{gras(l)}</p>;
      })}
    </div>
  );
}
function gras(s) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}
