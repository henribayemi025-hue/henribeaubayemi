import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { statutDe } from './outils';

// Deux pièces que Beau a aimées dans ses prototypes (25/09) — avec les
// vraies données de Léo, sans chiffre décoratif :
// - la SALLE DE RÉUNION : les réunions réelles (legion-reunion), autour d'une
//   table ; le compte rendu ; les actions devenues tâches ;
// - l'ACADÉMIE : compétences équipées, compétences à l'examen, examens,
//   livrables contestés par un collègue — et « Envoyer en formation », qui
//   crée une vraie tâche d'entraînement.

const court = (s, n) => { const x = String(s || ''); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const heure = (d) => new Date(d).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function Visage({ a, taille = 36, anneau = false }) {
  const init = (a?.nom || '?').slice(0, 1);
  return a?.avatar_url
    ? <img src={a.avatar_url} alt="" width={taille} height={taille} className={`shrink-0 rounded-full object-cover ${anneau ? 'ring-2 ring-legion-gold' : 'ring-2 ring-legion-panel'}`} style={{ width: taille, height: taille }} />
    : <span className={`grid shrink-0 place-items-center rounded-full bg-legion-card-haut font-bold text-legion-gold ${anneau ? 'ring-2 ring-legion-gold' : ''}`} style={{ width: taille, height: taille, fontSize: taille * 0.42 }}>{init}</span>;
}

export function SalleReunion({ agents, messages, taches, t }) {
  const parId = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const reunions = useMemo(() => {
    const m = new Map();
    for (const x of messages) {
      const id = x.meta?.reunion?.id;
      if (!id) continue;
      if (!m.has(id)) m.set(id, { id, propos: [], cr: null, debut: x.created_at, fin: null });
      const r = m.get(id);
      if (x.meta.reunion.fin) { r.cr = x; r.fin = x.created_at; } else if (x.genre !== 'tache') r.propos.push(x);
      if (x.created_at < r.debut) r.debut = x.created_at;
    }
    for (const r of m.values()) {
      r.propos.sort((a, b) => (a.meta.reunion.ordre ?? 0) - (b.meta.reunion.ordre ?? 0) || a.created_at.localeCompare(b.created_at));
      r.actions = taches.filter((x) => x.meta?.reunion?.id === r.id);
      const ids = r.cr?.meta?.reunion?.participants || [...new Set(r.propos.map((p) => p.auteur_id))];
      r.participants = ids.map((i) => parId.get(i)).filter(Boolean);
      r.sujet = court(String(r.cr?.texte || r.propos[0]?.texte || '').split('\n')[0].replace(/^Compte rendu\s*[—-]\s*/i, '').replace(/[#*]/g, ''), 110);
      r.enCours = !r.cr;
    }
    return [...m.values()].sort((a, b) => b.debut.localeCompare(a.debut));
  }, [messages, taches, parId]);
  const [choix, setChoix] = useState(null);
  const r = reunions.find((x) => x.id === choix) || reunions[0];

  if (!r) return <p className="p-6 text-center text-[14px] text-legion-muted">{t('legion.salle.vide')}</p>;
  const parle = r.enCours ? r.propos[r.propos.length - 1]?.auteur_id : null;
  const n = r.participants.length;
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {reunions.slice(0, 12).map((x) => (
          <button key={x.id} type="button" onClick={() => setChoix(x.id)}
            className={`shrink-0 rounded-pill border px-3 py-1.5 text-left text-[12.5px] ${x.id === r.id ? 'border-legion-gold bg-legion-card-haut text-legion-ink' : 'border-legion-line text-legion-muted'}`}>
            {x.enCours && <span className="mr-1 text-legion-teal">●</span>}{court(x.sujet, 38)} <span className="font-mono text-[11px] opacity-70">{heure(x.debut)}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-2xl border border-legion-line bg-[radial-gradient(ellipse_at_center,#1C2842_0%,#121A2B_70%)] p-4">
          <div>
            <p className={`font-mono text-[11px] uppercase tracking-[.14em] ${r.enCours ? 'text-legion-teal' : 'text-legion-muted'}`}>{r.enCours ? `● ${t('legion.salle.enDirect')}` : t('legion.salle.terminee', { quand: heure(r.fin) })}</p>
            <h3 className="mt-1 text-[17px] font-semibold text-legion-ink">{r.sujet}</h3>
          </div>
          <div className="relative mx-auto mb-10 mt-14 aspect-[2.4/1] w-full max-w-[440px] rounded-[50%] bg-gradient-to-b from-[#5b3a22] to-[#3d2616] shadow-[inset_0_2px_0_#7a5233,0_10px_30px_#0008]">
            {r.participants.map((a, i) => {
              const ang = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
              return (
                <div key={a.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center text-[11px] text-legion-ink"
                  style={{ left: `${50 + Math.cos(ang) * 54}%`, top: `${50 + Math.sin(ang) * 72}%` }}>
                  <Visage a={a} taille={38} anneau={a.id === parle} />
                  <span className="max-w-[70px] truncate">{a.nom}</span>
                </div>
              );
            })}
          </div>
          <ol className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {r.propos.map((p) => {
              const a = parId.get(p.auteur_id);
              return (
                <li key={p.id} className="grid grid-cols-[30px_1fr] gap-2.5 rounded-card bg-legion-card px-3 py-2">
                  <Visage a={a} taille={30} />
                  <div className="min-w-0">
                    <p className="text-[13px]"><b className="text-legion-ink">{a?.nom || '—'}</b> <span className="text-[11.5px] text-legion-muted">{a?.poste}</span>
                      {p.meta.reunion.conteste && <span className="ml-1 text-[11.5px] text-legion-accent">→ {p.meta.reunion.conteste}</span>}</p>
                    <p className="whitespace-pre-line text-[13px] text-legion-ink">{court(p.texte, 600)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-legion-line bg-legion-panel p-4">
            <h3 className="mb-2 text-[15px] font-semibold text-legion-ink">{t('legion.salle.compteRendu')}</h3>
            {r.cr ? <p className="max-h-[320px] overflow-y-auto whitespace-pre-line text-[13px] text-legion-muted">{court(r.cr.texte.replace(/[#*]/g, ''), 2500)}</p>
              : <p className="text-[13px] text-legion-muted">{t('legion.salle.pasEncore')}</p>}
          </section>
          <section className="rounded-2xl border border-legion-line bg-legion-panel p-4">
            <h3 className="mb-2 text-[15px] font-semibold text-legion-ink">{t('legion.salle.actions', { n: r.actions.length })}</h3>
            <ul className="flex flex-col gap-1.5">
              {r.actions.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 rounded-input bg-legion-card px-3 py-2 text-[13px]">
                  <span className="min-w-0 text-legion-ink">{court(x.texte, 120)}</span>
                  <span className="shrink-0 text-right text-[12px] text-legion-gold-soft">{parId.get(x.assigne_a)?.nom || '—'}<br /><span className="text-legion-muted">{t(`legion.statut.${statutDe(x)}`, statutDe(x))}</span></span>
                </li>
              ))}
              {!r.actions.length && <li className="text-[13px] text-legion-muted">{t('legion.salle.aucuneAction')}</li>}
            </ul>
          </section>
          <p className="text-[12px] text-legion-muted">{t('legion.salle.convoquer')}</p>
        </div>
      </div>
    </div>
  );
}

export function Academie({ agents, onCreerTache, peutAgir, t }) {
  // Les agents de l'équipe (pas Claude Code, qui ne s'entraîne pas ici).
  const machines = agents.filter((a) => !a.user_id && a.moteur !== 'claude-code');
  const [agentId, setAgentId] = useState(machines[0]?.id || null);
  const [donnees, setDonnees] = useState(null);
  const [envoye, setEnvoye] = useState(new Set());
  const a = machines.find((x) => x.id === agentId);

  useEffect(() => {
    if (!agentId) return undefined;
    let vivant = true;
    setDonnees(null);
    (async () => {
      const depuis = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [{ data: comp }, { data: exam }, { data: livres }] = await Promise.all([
        supabase.from('legion_competences').select('id, nom, description, etat, actif, created_at').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(200),
        supabase.from('legion_examens').select('id, competence_id, verdict, gagnes, nb_cas, created_at').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(20),
        supabase.from('legion_messages').select('id').eq('auteur_id', agentId).not('meta->livrable', 'is', null).gte('created_at', depuis).limit(300),
      ]);
      const ids = (livres || []).map((x) => x.id);
      let contestes = 0;
      if (ids.length) {
        const { count } = await supabase.from('legion_messages').select('id', { count: 'exact', head: true }).in('meta->conteste->>livrable_id', ids.slice(0, 100));
        contestes = count || 0;
      }
      if (vivant) setDonnees({ comp: comp || [], exam: exam || [], livres: ids.length, contestes });
    })().catch(() => vivant && setDonnees({ comp: [], exam: [], livres: 0, contestes: 0 }));
    return () => { vivant = false; };
  }, [agentId]);

  const actives = donnees?.comp.filter((c) => c.actif) || [];
  const aExaminer = donnees?.comp.filter((c) => ['a_examiner', 'a_valider', 'a_revoir'].includes(c.etat)) || [];
  const reussis = donnees?.exam.filter((e) => /reussi|valide|garde/i.test(e.verdict || '')).length || 0;

  async function entrainer(c) {
    await onCreerTache?.({ texte: `Entraînement (Académie) : « ${c.nom} » — fais un exercice concret de cette compétence sur un vrai sujet de l'entreprise, puis dis ce qui a marché et ce que tu referais autrement.`.slice(0, 200), assigne_a: a.id, priorite: 'haute' });
    setEnvoye(new Set([...envoye, c.id]));
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <section className="flex flex-col gap-3 rounded-2xl border border-legion-line bg-legion-panel p-4">
        <label className="flex items-center gap-2 text-[12.5px] text-legion-muted" htmlFor="academie-agent">{t('legion.academie.apprenant')}
          <select id="academie-agent" value={agentId || ''} onChange={(e) => setAgentId(e.target.value)} className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[13.5px] text-legion-ink">
            {machines.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.poste}</option>)}
          </select>
        </label>
        {a && (
          <div className="flex items-center gap-3">
            <Visage a={a} taille={56} />
            <div className="min-w-0"><h3 className="text-[18px] font-semibold text-legion-ink">{a.nom}</h3><p className="truncate text-[13px] text-legion-muted">{a.poste}{a.departement ? ` · ${a.departement}` : ''}</p></div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {[[actives.length, t('legion.academie.equipees')], [aExaminer.length, t('legion.academie.aLExamen')], [`${reussis}/${donnees?.exam.length ?? 0}`, t('legion.academie.examens')], [`${donnees?.contestes ?? 0}/${donnees?.livres ?? 0}`, t('legion.academie.contestes')]].map(([v, l]) => (
            <div key={l} className="rounded-card bg-legion-card px-3 py-2 text-center"><b className="block font-mono text-[18px] tabular-nums text-legion-ink">{donnees ? v : '…'}</b><span className="text-[11.5px] text-legion-muted">{l}</span></div>
          ))}
        </div>
        <p className="text-[12px] text-legion-muted">{t('legion.academie.verite')}</p>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[.14em] text-legion-gold">{t('legion.academie.modules')}</h3>
        {!donnees && <p className="text-[13px] text-legion-muted">…</p>}
        {donnees && !actives.length && !aExaminer.length && <p className="text-[13px] text-legion-muted">{t('legion.academie.aucune')}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {[...aExaminer, ...actives].slice(0, 12).map((c) => (
            <article key={c.id} className="flex flex-col gap-2 rounded-card border border-legion-line bg-legion-card p-3">
              <span className={`font-mono text-[10.5px] uppercase tracking-[.12em] ${c.actif ? 'text-legion-teal' : 'text-legion-gold'}`}>{c.actif ? t('legion.academie.equipee') : t('legion.academie.enExamen')}</span>
              <b className="text-[14px] text-legion-ink">{c.nom}</b>
              {c.description && <p className="text-[12.5px] text-legion-muted">{court(c.description, 140)}</p>}
              {peutAgir && c.actif && (
                <button type="button" disabled={envoye.has(c.id)} onClick={() => entrainer(c)}
                  className="mt-auto self-start rounded-pill border border-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-gold disabled:opacity-50">
                  {envoye.has(c.id) ? t('legion.academie.envoye') : t('legion.academie.envoyer')}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
