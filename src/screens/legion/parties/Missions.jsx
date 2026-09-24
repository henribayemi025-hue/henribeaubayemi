import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconBooks, IconChevronDown } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { MISSIONS, agentPour } from './missions';
import { sansAccent } from './outils';

// LEGION — la bibliothèque de missions (24/09). Lancer une mission, c'est
// poser sa tâche au tableau de l'agent choisi : il la prend à sa prochaine
// journée de travail (ou tout de suite avec « Au travail maintenant »).
// « Chaque semaine / mois / an » la garde dans legion_missions (0186) : elle
// revient seule, le matin, tant qu'on ne l'arrête pas.

const PAS = { semaine: 7, mois: 30, an: 365 };
function prochaineDate(rythme) {
  const d = new Date();
  if (rythme === 'mois') d.setMonth(d.getMonth() + 1);
  else if (rythme === 'an') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + (PAS[rythme] || 7));
  return d.toISOString().slice(0, 10);
}

export function Missions({ entreprise, agents, departements, moi, onLancee, t, langue = 'fr' }) {
  const [actives, setActives] = useState([]);
  const [choix, setChoix] = useState({}); // cle → agent_id
  const [occupe, setOccupe] = useState(null);
  const [fait, setFait] = useState({}); // cle → message court
  const [tout, setTout] = useState(false);
  const L = langue === 'en' ? 'en' : 'fr';

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_missions').select('*').eq('entreprise_id', entreprise.id);
    setActives(data || []);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);

  const libres = useMemo(() => agents.filter((a) => !a.user_id && a.moteur !== 'claude-code'), [agents]);
  const quiPour = (m) => libres.find((a) => a.id === choix[m.cle]) || agentPour(m, libres, sansAccent);

  async function poserTache(m, a, extra = {}) {
    const salon = departements.find((d) => sansAccent(d.nom) === sansAccent(a.departement))
      || departements.find((d) => sansAccent(d.nom) === 'direction') || departements[0];
    if (!salon || !moi) return null;
    const { data: ligne, error } = await supabase.from('legion_messages').insert({
      entreprise_id: entreprise.id, canal_id: salon.id, auteur_id: moi.id, user_id: moi.user_id, texte: m.texte[L], genre: 'tache', assigne_a: a.id,
      meta: { statut: 'a_faire', priorite: 'moyenne', mission: { cle: m.cle, titre: m.titre[L], ...extra } },
    }).select().single();
    if (error) return null;
    onLancee?.(ligne);
    return ligne;
  }

  async function lancer(m) {
    const a = quiPour(m);
    if (!a || occupe) return;
    setOccupe(m.cle);
    const ok = await poserTache(m, a);
    setOccupe(null);
    setFait((f) => ({ ...f, [m.cle]: ok ? t('legion.missions.lancee', { nom: a.nom }) : t('errors.generic') }));
  }

  async function activer(m) {
    const a = quiPour(m);
    if (!a || occupe) return;
    setOccupe(m.cle);
    const { data: ligne, error } = await supabase.from('legion_missions').upsert({
      entreprise_id: entreprise.id, cle: m.cle, titre: m.titre[L], texte: m.texte[L], agent_id: a.id, recurrence: m.rythme,
      prochaine: prochaineDate(m.rythme), actif: true, cree_par: moi?.user_id || null,
    }, { onConflict: 'entreprise_id,cle' }).select().single();
    // La première tout de suite ; les suivantes reviennent seules.
    if (!error && ligne) await poserTache(m, a, { id: ligne.id, recurrence: m.rythme });
    setOccupe(null);
    setFait((f) => ({ ...f, [m.cle]: error ? t('errors.generic') : t('legion.missions.activee', { nom: a.nom }) }));
    charger();
  }

  async function arreter(active) {
    await supabase.from('legion_missions').delete().eq('id', active.id);
    charger();
  }

  const visibles = tout ? MISSIONS : MISSIONS.slice(0, 6);
  const dateCourte = (iso) => new Date(iso).toLocaleDateString(L === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });

  return (
    <section className="space-y-4 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconBooks size={15} className="text-legion-gold" /> {t('legion.missions.titre')}
        </h3>
        <p className="mt-1 text-[12px] leading-snug text-legion-muted">{t('legion.missions.aide')}</p>
      </div>

      {actives.filter((x) => x.actif).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.missions.enCours')}</p>
          {actives.filter((x) => x.actif).map((x) => (
            <div key={x.id} className="flex items-center gap-2 rounded-card border border-legion-gold/30 bg-legion-gold/10 px-3 py-2 text-caption">
              <span>{MISSIONS.find((m) => m.cle === x.cle)?.emoji || '🔁'}</span>
              <span className="min-w-0 flex-1 truncate text-legion-ink">{x.titre}</span>
              <span className="shrink-0 text-[11px] text-legion-muted">{t(`legion.missions.rythme.${x.recurrence}`)} · {t('legion.missions.prochaine', { date: dateCourte(x.prochaine) })}</span>
              <button type="button" onClick={() => arreter(x)} className="shrink-0 text-[11px] font-semibold text-legion-danger">{t('legion.missions.arreter')}</button>
            </div>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map((m) => {
          const a = quiPour(m);
          const active = actives.find((x) => x.cle === m.cle && x.actif);
          return (
            <li key={m.cle} className="flex flex-col gap-2 rounded-card border border-legion-line bg-legion-card p-3">
              <div className="flex items-start gap-2">
                <span className="text-[20px] leading-none">{m.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-tight text-legion-ink">{m.titre[L]}</p>
                  <p className="mt-0.5 text-[11px] text-legion-muted">
                    {m.rythme ? t(`legion.missions.rythme.${m.rythme}`) : t('legion.missions.uneFois')}
                    {m.source ? ` · ${t(`legion.missions.source.${m.source}`)}` : ''}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 text-[12px] leading-snug text-legion-muted">{m.texte[L]}</p>
              <label className="flex items-center gap-1.5 text-[11px] text-legion-muted">
                {t('legion.missions.qui')}
                <select value={a?.id || ''} onChange={(e) => setChoix((c) => ({ ...c, [m.cle]: e.target.value }))}
                  className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-1.5 py-1 text-[16px] text-legion-ink sm:text-[12px]">
                  {libres.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.poste}{x.actif ? '' : ` (${t('legion.enVeille', 'En veille')})`}</option>)}
                </select>
              </label>
              <div className="mt-auto flex flex-wrap gap-1.5">
                <button type="button" onClick={() => lancer(m)} disabled={!a || !!occupe}
                  className="rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
                  {occupe === m.cle ? '…' : t('legion.missions.lancer')}
                </button>
                {m.rythme && !active && (
                  <button type="button" onClick={() => activer(m)} disabled={!a || !!occupe}
                    className="rounded-pill border border-legion-gold/50 px-3 py-1 text-[12px] font-semibold text-legion-gold disabled:opacity-50">
                    🔁 {t(`legion.missions.activer.${m.rythme}`)}
                  </button>
                )}
                {active && <span className="self-center text-[11px] text-legion-gold">🔁 {t('legion.missions.dejaActive')}</span>}
              </div>
              {fait[m.cle] && <p className="text-[11px] text-legion-success">{fait[m.cle]}</p>}
            </li>
          );
        })}
      </ul>
      {MISSIONS.length > 6 && (
        <button type="button" onClick={() => setTout((v) => !v)} className="flex items-center gap-1 text-[12px] font-semibold text-legion-gold">
          <IconChevronDown size={14} className={tout ? 'rotate-180' : ''} /> {tout ? t('legion.missions.moins') : t('legion.missions.toutes', { n: MISSIONS.length })}
        </button>
      )}
    </section>
  );
}
