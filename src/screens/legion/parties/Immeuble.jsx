import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';
import { sansAccent, statutDe } from './outils';

// L'IMMEUBLE de l'entreprise (Beau, 25/09 : « construire les gars dans un site
// comme ça… un peu comme les Sims » ; « oui, lance l'immeuble, étages et
// Institut »). Un étage par département, chaque agent à son bureau avec sa
// photo ; la salle de réunion, l'atelier et l'accueil au rez-de-chaussée ;
// l'Institut sur le toit. RÈGLE D'OR : on ne montre que du VRAI — un agent
// bouge parce qu'il travaille, jamais pour faire joli (le contraire des
// prototypes où un agent tiré au hasard « agissait » toutes les 14 s).
//
// Qui est où (dans cet ordre) :
//   veille    l'agent est éteint
//   atelier   une séance de l'atelier de code est en cours, et c'est l'agent qui a le droit de modifier
//   reunion   il a parlé dans une réunion pas terminée, il y a moins de 30 min
//   institut  il a proposé une compétence, en attente d'examen ou de validation
//   travaille il a PRIS une tâche il y a moins de 15 min et ne l'a pas encore rendue
//   ecrit     il a écrit un message il y a moins de 10 min
//   tache     sa tâche ouverte
//   dispo     rien de tout ça
// En plus : « vient d'arriver » s'il a été créé il y a moins de 48 h.

const DIX_MIN = 10 * 60 * 1000;
const TRENTE_MIN = 30 * 60 * 1000;
const DEUX_JOURS = 48 * 3600 * 1000;
const QUINZE_MIN = 15 * 60 * 1000;

function reunionsEnCours(messages) {
  const fins = new Set(messages.filter((m) => m.meta?.reunion?.fin || m.meta?.reunion?.terminee).map((m) => m.meta.reunion.id || m.id));
  const limite = Date.now() - TRENTE_MIN;
  const qui = new Set();
  for (const m of messages) {
    const r = m.meta?.reunion;
    if (!r || m.user_id || !r.id || fins.has(r.id) || r.fin) continue;
    if (Date.parse(m.created_at) >= limite) qui.add(m.auteur_id);
  }
  return qui;
}

export function Immeuble({ agents, departements, messages, taches, onFiche, t }) {
  const [maintenant, setMaintenant] = useState(Date.now());
  const [formation, setFormation] = useState(() => new Map()); // agent_id → nom de la compétence
  const [atelierEnCours, setAtelierEnCours] = useState(false);
  // « Voir comment il travaille » (Beau, 25/09 : « quand je clique sur un
  // agent au travail, ça doit ouvrir où il travaille, ce qu'il fait, les
  // chiffres, comment il fait »).
  const [regard, setRegard] = useState(null);
  useEffect(() => { const i = setInterval(() => setMaintenant(Date.now()), 30_000); return () => clearInterval(i); }, []);

  const machines = useMemo(() => agents.filter((a) => !a.user_id), [agents]);
  const ids = machines.map((a) => a.id).join(',');
  useEffect(() => {
    let vivant = true;
    const liste = ids ? ids.split(',') : [];
    if (!liste.length) return undefined;
    (async () => {
      const [{ data: comp }, { data: sess }] = await Promise.all([
        supabase.from('legion_competences').select('agent_id, nom, etat').in('agent_id', liste).in('etat', ['a_examiner', 'a_valider', 'a_revoir']).limit(200),
        supabase.from('atelier_sessions').select('id, statut').eq('statut', 'en_cours').limit(1),
      ]);
      if (!vivant) return;
      setFormation(new Map((comp || []).map((c) => [c.agent_id, c.nom])));
      setAtelierEnCours(!!sess?.length);
    })().catch(() => {});
    return () => { vivant = false; };
  }, [ids, maintenant]);

  const codeur = machines.find((a) => a.peut_coder && a.actif && a.avatar_url) || machines.find((a) => a.peut_coder && a.actif) || null;
  const enReunion = useMemo(() => reunionsEnCours(messages), [messages, maintenant]); // eslint-disable-line react-hooks/exhaustive-deps
  const ecrit = useMemo(() => {
    const limite = Date.now() - DIX_MIN;
    return new Set(messages.filter((m) => !m.user_id && Date.parse(m.created_at) >= limite).map((m) => m.auteur_id));
  }, [messages, maintenant]); // eslint-disable-line react-hooks/exhaustive-deps

  // Une tâche PRISE (legion-travail note travaille_depuis) et pas encore rendue.
  const enTache = useMemo(() => {
    const limite = Date.now() - QUINZE_MIN;
    const qui = new Map();
    for (const x of taches) {
      const d = Date.parse(x.meta?.travaille_depuis || 0);
      const rendu = Date.parse(x.meta?.livre_le || 0);
      if (x.assigne_a && d >= limite && !(rendu >= d)) qui.set(x.assigne_a, x);
    }
    return qui;
  }, [taches, maintenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const etat = (a) => {
    if (!a.actif) return 'veille';
    if (atelierEnCours && codeur?.id === a.id) return 'atelier';
    if (enReunion.has(a.id)) return 'reunion';
    if (formation.has(a.id)) return 'institut';
    if (enTache.has(a.id)) return 'travaille';
    if (ecrit.has(a.id)) return 'ecrit';
    if (taches.some((x) => x.assigne_a === a.id && statutDe(x) !== 'fait')) return 'tache';
    return 'dispo';
  };
  const nouveau = (a) => Date.now() - Date.parse(a.created_at || 0) < DEUX_JOURS;
  const tacheDe = (a) => taches.find((x) => x.assigne_a === a.id && statutDe(x) !== 'fait');

  const etages = departements.map((d) => {
    const siens = machines.filter((a) => sansAccent(a.departement) === sansAccent(d.nom));
    return { ...d, agents: [...siens.filter((a) => a.est_directeur), ...siens.filter((a) => !a.est_directeur)] };
  }).filter((d) => d.agents.length);
  const sansDept = machines.filter((a) => !departements.some((d) => sansAccent(d.nom) === sansAccent(a.departement)));
  if (sansDept.length) etages.push({ id: 'sans', nom: t('legion.vues.sansDepartement'), couleur: '#93A1B8', agents: sansDept });
  // La Direction en haut, comme dans un vrai immeuble.
  etages.sort((x, y) => Number(sansAccent(y.nom) === 'direction') - Number(sansAccent(x.nom) === 'direction'));

  const aLInstitut = machines.filter((a) => etat(a) === 'institut');
  const enSalle = machines.filter((a) => etat(a) === 'reunion');
  const arrivees = machines.filter((a) => nouveau(a));
  const actifs = machines.filter((a) => ['atelier', 'reunion', 'institut', 'ecrit'].includes(etat(a))).length;

  const bulle = (a) => {
    const e = etat(a);
    if (e === 'tache') return `📌 ${tacheDe(a)?.texte || ''}`;
    if (e === 'travaille') return `✍️ ${enTache.get(a.id)?.texte || ''}`;
    return `${{ veille: '💤', atelier: '💻', reunion: '🗣️', institut: '📚', ecrit: '⌨️', travaille: '✍️', dispo: '☕' }[e]} ${t(`legion.immeuble.etat.${e}`)}`;
  };

  const Personne = ({ a, petit = false }) => (
    <button type="button" onClick={() => setRegard(a)} title={`${a.nom} — ${bulle(a)}`}
      className={`imm-personne group flex flex-col items-center ${['ecrit', 'travaille', 'atelier'].includes(etat(a)) ? 'imm-tape' : ''}`}>
      <span className={`rounded-full ${['ecrit', 'travaille', 'atelier', 'reunion', 'institut'].includes(etat(a)) ? 'ring-2 ring-legion-gold' : ''} ${a.actif ? '' : 'opacity-40 grayscale'}`}>
        <Visage a={a} taille={petit ? 30 : 38} />
      </span>
      <span className="mt-0.5 max-w-[84px] truncate text-[10px] font-semibold text-legion-ink group-hover:text-legion-gold">{a.nom.split(' ')[0]}</span>
    </button>
  );

  // Un poste de travail : l'écran s'allume quand l'agent travaille pour de vrai.
  const Poste = ({ a }) => {
    const e = etat(a);
    const ailleurs = e === 'reunion' || e === 'atelier' || e === 'institut';
    const allume = e === 'ecrit' || e === 'travaille' || e === 'tache';
    return (
      <div className="relative flex w-[92px] shrink-0 flex-col items-center">
        {nouveau(a) && !ailleurs && <span className="absolute -top-1 right-1 z-10 rounded-pill bg-legion-gold px-1.5 text-[9px] font-bold text-legion-bg">{t('legion.immeuble.nouveau')}</span>}
        <div className="flex h-[58px] items-end">{ailleurs ? <span className="block pt-3 text-[10px] italic text-legion-muted">{t(`legion.immeuble.parti.${e}`)}</span> : <Personne a={a} />}</div>
        <svg width="84" height="30" viewBox="0 0 84 30" aria-hidden="true">
          <rect x="30" y="1" width="24" height="15" rx="2" fill={allume ? '#1c3a4a' : '#1a2233'} stroke={allume ? '#5FC8C0' : '#2A3550'} className={e === 'ecrit' || e === 'travaille' ? 'imm-ecran' : ''} />
          {(e === 'ecrit' || e === 'travaille') && <g stroke="#5FC8C0" strokeWidth="1"><line x1="33" y1="6" x2="47" y2="6" /><line x1="33" y1="9" x2="51" y2="9" /><line x1="33" y1="12" x2="43" y2="12" /></g>}
          <rect x="40" y="16" width="4" height="4" fill="#2A3550" />
          <rect x="4" y="20" width="76" height="5" rx="2" fill="#8a5a3c" />
          <rect x="8" y="25" width="3" height="5" fill="#5e3d29" /><rect x="73" y="25" width="3" height="5" fill="#5e3d29" />
        </svg>
        {!ailleurs && <span className="mt-0.5 w-full truncate text-center text-[9px] leading-tight text-legion-muted" title={bulle(a)}>{bulle(a)}</span>}
      </div>
    );
  };

  return (
    <div className="imm relative min-h-full overflow-x-hidden px-3 pb-8 pt-4" style={{ background: 'linear-gradient(180deg,#060a14 0%,#0d1630 55%,#141d33 100%)' }}>
      <style>{`
        @keyframes imm-tape { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        @keyframes imm-ecran { 0%,100% { opacity: 1 } 50% { opacity: .75 } }
        @keyframes imm-scintille { 0%,100% { opacity: .9 } 50% { opacity: .25 } }
        @keyframes imm-entre { from { transform: translateX(-60px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        .imm-tape { animation: imm-tape 1.1s ease-in-out infinite }
        .imm-ecran { animation: imm-ecran 1.6s ease-in-out infinite }
        .imm-etoile { animation: imm-scintille 3s ease-in-out infinite }
        .imm-entre { animation: imm-entre 1.4s ease-out both }
        @keyframes imm-arrive { from { transform: translateY(-8px); opacity: 0; background: rgba(227,168,87,.18) } to { transform: none; opacity: 1; background: transparent } }
        .imm-arrive { animation: imm-arrive 1.2s ease-out both }
        @media (prefers-reduced-motion: reduce) { .imm-tape, .imm-ecran, .imm-etoile, .imm-entre, .imm-arrive { animation: none } }
      `}</style>
      {/* Le ciel : quelques étoiles, la lune. Décor fixe, rien qui fait croire à une activité. */}
      {[[6, 8], [18, 3], [31, 11], [47, 5], [62, 9], [78, 4], [90, 12], [12, 16], [70, 17]].map(([x, y], i) => (
        <span key={i} className="imm-etoile absolute h-[2px] w-[2px] rounded-full bg-white" style={{ left: `${x}%`, top: `${y * 6}px`, animationDelay: `${i * 0.4}s` }} />
      ))}
      <span className="absolute right-[8%] top-4 h-8 w-8 rounded-full bg-[#f4e7c5] opacity-80 shadow-[0_0_24px_#f4e7c5]" />

      <p className="relative mx-auto mb-3 max-w-3xl text-center text-[12px] text-legion-muted">
        {t('legion.immeuble.accueil', { n: actifs })}
      </p>

      <div className="relative mx-auto grid max-w-7xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative w-full">
        {/* LE TOIT : l'Institut, sous une verrière. */}
        <div className="mx-auto h-6 w-[92%]" style={{ background: 'linear-gradient(90deg,#1b2b4a,#27406b,#1b2b4a)', clipPath: 'polygon(6% 100%, 50% 0, 94% 100%)' }} />
        <section className="relative rounded-t-md border-2 border-b-0 border-[#5FC8C0]/50 bg-[#0f1c33] px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-[#5FC8C0]">{t('legion.immeuble.institut')}</h3>
            <span className="text-[10px] text-legion-muted">{t('legion.immeuble.institutAide')}</span>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <svg width="120" height="54" viewBox="0 0 120 54" aria-hidden="true" className="shrink-0">
              <rect x="1" y="1" width="118" height="44" rx="3" fill="#0a1426" stroke="#2A3550" />
              <path d="M8 30 Q 22 6, 36 30 T 64 30" fill="none" stroke="#C25E38" strokeWidth="1.5" />
              <path d="M74 12 L 86 34 L 98 18 L 110 30" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
              <rect x="50" y="45" width="20" height="8" fill="#2A3550" />
            </svg>
            {aLInstitut.length ? aLInstitut.map((a) => (
              <div key={a.id} className="flex flex-col items-center">
                <Personne a={a} />
                <span className="max-w-[110px] truncate text-[9px] text-[#5FC8C0]" title={formation.get(a.id)}>📚 {formation.get(a.id)}</span>
              </div>
            )) : <span className="text-[11px] italic text-legion-muted">{t('legion.immeuble.institutVide')}</span>}
          </div>
        </section>

        {/* LES ÉTAGES : un par département. */}
        {etages.map((d) => {
          const auTravail = d.agents.filter((a) => ['ecrit', 'travaille', 'atelier', 'reunion', 'institut'].includes(etat(a))).length;
          return (
            <section key={d.id} className="relative flex border-x-2 border-t-2 border-[#2A3550] bg-[#111a2e]">
              <div className="flex w-[74px] shrink-0 flex-col justify-center gap-1 border-r border-[#2A3550] px-2 py-2 sm:w-[120px]" style={{ background: `linear-gradient(180deg, ${d.couleur || '#C25E38'}22, transparent)` }}>
                <span className="h-1.5 w-8 rounded" style={{ backgroundColor: d.couleur || '#C25E38' }} />
                <span className="text-[11px] font-bold leading-tight text-legion-ink sm:text-[12px]">{d.nom}</span>
                <span className="text-[9px] text-legion-muted">{t('legion.vues.auTravail', { n: auTravail })}</span>
                {/* Les fenêtres : une allumée par agent qui travaille vraiment. */}
                <span className="mt-1 flex gap-0.5">
                  {d.agents.map((a) => {
                    const on = ['ecrit', 'travaille', 'atelier', 'reunion', 'institut'].includes(etat(a));
                    return <span key={a.id} className="h-2 w-1.5 rounded-[1px]" style={{ backgroundColor: on ? '#E3A857' : '#1f2a40', boxShadow: on ? '0 0 4px #E3A857' : 'none' }} />;
                  })}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-1 gap-y-2 px-2 pb-1 pt-2">
                {d.agents.map((a) => <Poste key={a.id} a={a} />)}
              </div>
            </section>
          );
        })}

        {/* LE REZ-DE-CHAUSSÉE : l'accueil, la salle de réunion, l'atelier. */}
        <section className="grid grid-cols-1 border-2 border-[#2A3550] bg-[#0c1426] sm:grid-cols-3">
          <div className="relative border-b border-[#2A3550] p-3 sm:border-b-0 sm:border-r">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-legion-gold">{t('legion.immeuble.accueilLieu')}</h4>
            <div className="flex items-end gap-3">
              <svg width="34" height="52" viewBox="0 0 34 52" aria-hidden="true" className="shrink-0"><rect x="1" y="1" width="32" height="50" rx="2" fill="#1a2233" stroke="#8a5a3c" strokeWidth="2" /><circle cx="26" cy="28" r="2" fill="#E3A857" /></svg>
              {arrivees.length ? arrivees.map((a) => <span key={a.id} className="imm-entre"><Personne a={a} petit /></span>)
                : <span className="text-[11px] italic text-legion-muted">{t('legion.immeuble.accueilVide')}</span>}
            </div>
          </div>
          <div className="border-b border-[#2A3550] p-3 sm:border-b-0 sm:border-r">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-legion-gold">{t('legion.immeuble.salle')}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden="true" className="shrink-0"><ellipse cx="20" cy="12" rx="19" ry="10" fill="#6b4630" stroke="#8a5a3c" /></svg>
              {enSalle.length ? enSalle.map((a) => <Personne key={a.id} a={a} petit />)
                : <span className="text-[11px] italic text-legion-muted">{t('legion.immeuble.salleVide')}</span>}
            </div>
          </div>
          <div className="p-3">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-legion-gold">{t('legion.immeuble.atelier')}</h4>
            <div className="flex items-center gap-3">
              <svg width="56" height="38" viewBox="0 0 56 38" aria-hidden="true" className="shrink-0">
                <rect x="1" y="1" width="54" height="30" rx="2" fill="#0a1426" stroke={atelierEnCours ? '#5FC8C0' : '#2A3550'} />
                {atelierEnCours && <g stroke="#5FC8C0" strokeWidth="1.2" className="imm-ecran"><line x1="6" y1="8" x2="30" y2="8" /><line x1="10" y1="13" x2="44" y2="13" /><line x1="10" y1="18" x2="36" y2="18" /><line x1="6" y1="23" x2="24" y2="23" /></g>}
                <rect x="24" y="31" width="8" height="6" fill="#2A3550" />
              </svg>
              {atelierEnCours && codeur ? <Personne a={codeur} petit /> : <span className="text-[11px] italic text-legion-muted">{t('legion.immeuble.atelierVide')}</span>}
            </div>
          </div>
        </section>
        <div className="h-3 rounded-b bg-[#1f2a40]" />
      </div>

      <FilDirect agents={agents} messages={messages} taches={taches} onFiche={onFiche} t={t} />
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-[10px] leading-relaxed text-legion-muted">{t('legion.immeuble.regle')}</p>
      {regard && (
        <CommentIlTravaille a={regard} etat={etat(regard)} bulle={bulle(regard)} tache={enTache.get(regard.id) || tacheDe(regard)}
          messages={messages} formation={formation.get(regard.id)} onFiche={() => { const a = regard; setRegard(null); onFiche?.(a); }}
          onFermer={() => setRegard(null)} t={t} />
      )}
    </div>
  );
}

// LE FIL « EN DIRECT » (Beau, 25/09 : « un espace où je vois comment ils
// travaillent, comment ça défile, qui participe, qui fait quoi ») : ce que
// l'entreprise fait, du plus récent au plus ancien, mis à jour en direct
// (les messages arrivent par le temps réel de Léo). Rien d'inventé : chaque
// ligne est un message, une tâche prise ou une tâche rendue.
const nettoyer = (x, n = 120) => {
  const s = String(x || '').replace(/[#*`>_|]/g, '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

function FilDirect({ agents, messages, taches, onFiche, t }) {
  const parId = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);
  const tacheParId = useMemo(() => new Map(taches.map((x) => [x.id, x])), [taches]);
  const lignes = useMemo(() => {
    const l = [];
    for (const x of taches) {
      if (x.meta?.travaille_depuis && x.assigne_a) l.push({ id: `p-${x.id}`, quand: x.meta.travaille_depuis, qui: parId.get(x.assigne_a), genre: 'prend', texte: x.texte });
    }
    for (const m of messages) {
      const qui = parId.get(m.auteur_id);
      if (!qui) continue;
      if (m.genre === 'tache') {
        l.push({ id: m.id, quand: m.created_at, qui, genre: 'confie', vers: parId.get(m.assigne_a), texte: m.texte });
      } else if (m.meta?.livrable) {
        const tc = tacheParId.get(m.meta.livrable.tache_id);
        l.push({ id: m.id, quand: m.created_at, qui, genre: m.meta.livrable.statut === 'bloque' || /\*\*Bloqué/.test(m.texte) ? 'bloque' : 'rend', texte: tc?.texte || m.texte });
      } else if (m.meta?.reunion) {
        l.push({ id: m.id, quand: m.created_at, qui, genre: m.meta.reunion.fin ? 'compte_rendu' : 'reunion', texte: m.texte });
      } else {
        l.push({ id: m.id, quand: m.created_at, qui, genre: m.genre === 'decision' ? 'decision' : 'dit', texte: m.texte });
      }
    }
    return l.filter((x) => x.qui).sort((a, b) => Date.parse(b.quand) - Date.parse(a.quand)).slice(0, 60);
  }, [messages, taches, parId, tacheParId]);
  const heure = (q) => new Date(q).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const couleur = { prend: '#5FC8C0', rend: '#E3A857', bloque: '#E0664F', confie: '#a78bfa', reunion: '#93A1B8', compte_rendu: '#E3A857', decision: '#E3A857', dit: '#93A1B8' };
  return (
    <aside className="rounded-card border border-legion-line bg-[#0b1222]/90 lg:sticky lg:top-2">
      <h3 className="flex items-center gap-2 border-b border-legion-line px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-legion-ink">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#E0664F]" /> {t('legion.immeuble.direct')}
      </h3>
      <ol className="max-h-[70vh] overflow-y-auto px-2 py-1">
        {lignes.map((x) => (
          <li key={x.id} className="imm-arrive flex gap-2 rounded px-1 py-1.5">
            <button type="button" onClick={() => onFiche?.(x.qui)} className="shrink-0"><Visage a={x.qui} taille={26} /></button>
            <div className="min-w-0 flex-1 text-[11px] leading-snug">
              <span className="font-semibold text-legion-ink">{x.qui.nom.split(' ')[0]}</span>{' '}
              <span style={{ color: couleur[x.genre] }}>{t(`legion.immeuble.fil.${x.genre}`, { nom: x.vers?.nom?.split(' ')[0] || '' })}</span>
              <span className="block text-legion-muted">{nettoyer(x.texte)}</span>
            </div>
            <span className="shrink-0 font-mono text-[9px] text-legion-muted">{heure(x.quand)}</span>
          </li>
        ))}
        {!lignes.length && <li className="px-2 py-3 text-[11px] italic text-legion-muted">{t('legion.immeuble.filVide')}</li>}
      </ol>
    </aside>
  );
}

// ——— « Comment il travaille » : ce qu'il fait maintenant, comment il s'y
// prend (ce qu'il a vérifié dans les chiffres, ses sources sur Internet, le
// modèle), ce que ça coûte, et ses derniers messages. Tout vient des messages
// et des tâches réels ; rien n'est deviné.
function CommentIlTravaille({ a, etat, bulle, tache, messages, formation, onFiche, onFermer, t }) {
  const siens = messages.filter((m) => m.auteur_id === a.id).sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
  const livrables = siens.filter((m) => m.meta?.livrable);
  const dernier = livrables[0];
  const minuit = new Date(); minuit.setHours(0, 0, 0, 0);
  const aujourdhui = siens.filter((m) => Date.parse(m.created_at) >= minuit.getTime());
  const coutJour = aujourdhui.reduce((n, m) => n + (Number(m.meta?.cout_eur) || 0), 0);
  const verifie = Array.isArray(dernier?.meta?.verifie) ? dernier.meta.verifie : [];
  const sources = Array.isArray(dernier?.meta?.sources) ? dernier.meta.sources : [];
  const depuis = tache?.meta?.travaille_depuis ? Math.max(1, Math.round((Date.now() - Date.parse(tache.meta.travaille_depuis)) / 60000)) : null;
  const heure = (q) => new Date(q).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const Bloc = ({ titre, children }) => (
    <section className="mb-3">
      <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-legion-gold">{titre}</h4>
      {children}
    </section>
  );
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end bg-black/40 sm:items-stretch" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <aside className="imm-arrive max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-legion-line bg-legion-panel p-4 sm:max-h-none sm:w-[380px] sm:rounded-none">
        <div className="mb-3 flex items-center gap-3">
          <Visage a={a} taille={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-bold text-legion-ink">{a.nom}</p>
            <p className="truncate text-[11px] text-legion-muted">{a.poste}{a.departement ? ` · ${a.departement}` : ''}</p>
            <p className="mt-0.5 text-[11px] text-legion-gold">{bulle}</p>
          </div>
          <button type="button" onClick={onFermer} aria-label={t('common.close', 'Fermer')} className="rounded-full px-2 text-legion-muted hover:text-legion-ink">✕</button>
        </div>

        <Bloc titre={t('legion.immeuble.regard.maintenant')}>
          {tache ? (
            <p className="rounded-card bg-legion-card p-2 text-[12px] text-legion-ink">
              {tache.texte}
              {depuis && <span className="mt-1 block text-[10px] text-legion-muted">{t('legion.immeuble.regard.depuis', { n: depuis })}</span>}
            </p>
          ) : etat === 'institut' && formation ? (
            <p className="text-[12px] text-legion-ink">📚 {t('legion.immeuble.regard.apprend', { nom: formation })}</p>
          ) : <p className="text-[12px] text-legion-muted">{t('legion.immeuble.regard.rien')}</p>}
        </Bloc>

        {dernier && (
          <Bloc titre={t('legion.immeuble.regard.comment')}>
            <ul className="space-y-1 text-[11px] text-legion-ink">
              {dernier.meta?.modele && <li>🧠 {t('legion.immeuble.regard.modele', { modele: dernier.meta.modele })}</li>}
              {verifie.length > 0 && <li>🔎 {t('legion.immeuble.regard.verifie')} <span className="text-legion-muted">{verifie.slice(0, 6).map((v) => String(v).split('(')[0]).join(', ')}</span></li>}
              {sources.length > 0 && (
                <li>🌐 {t('legion.immeuble.regard.sources', { n: sources.length })}
                  <span className="mt-0.5 block space-y-0.5">
                    {sources.slice(0, 4).map((x, i) => {
                      const url = typeof x === 'string' ? x : x?.url || x?.uri;
                      const titre = typeof x === 'string' ? x : x?.titre || x?.title || url;
                      return url ? <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-[10px] text-[#5FC8C0] underline">{titre}</a> : null;
                    })}
                  </span>
                </li>
              )}
              {!verifie.length && !sources.length && <li className="text-legion-muted">{t('legion.immeuble.regard.sansVerif')}</li>}
            </ul>
          </Bloc>
        )}

        <Bloc titre={t('legion.immeuble.regard.chiffres')}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[aujourdhui.length, t('legion.immeuble.regard.messagesJour')], [livrables.filter((m) => Date.parse(m.created_at) >= minuit.getTime()).length, t('legion.immeuble.regard.livrablesJour')], [`${coutJour.toFixed(3)} €`, t('legion.immeuble.regard.coutJour')]].map(([v, l]) => (
              <div key={l} className="rounded-card bg-legion-card p-2"><div className="text-body font-bold text-legion-ink tabular-nums">{v}</div><div className="text-[9px] text-legion-muted">{l}</div></div>
            ))}
          </div>
        </Bloc>

        <Bloc titre={t('legion.immeuble.regard.derniers')}>
          <ol className="space-y-1.5">
            {siens.slice(0, 5).map((m) => (
              <li key={m.id} className="rounded-card bg-legion-card p-2 text-[11px] leading-snug text-legion-ink">
                <span className="float-right font-mono text-[9px] text-legion-muted">{heure(m.created_at)}</span>
                {m.meta?.livrable && <span className="mr-1 rounded bg-legion-gold/20 px-1 text-[9px] text-legion-gold">{t('legion.immeuble.regard.livrable')}</span>}
                {nettoyer(m.texte, 220)}
              </li>
            ))}
            {!siens.length && <li className="text-[11px] text-legion-muted">{t('legion.immeuble.regard.aucunMessage')}</li>}
          </ol>
        </Bloc>

        <button type="button" onClick={onFiche} className="w-full rounded-pill border border-legion-gold/60 py-2 text-caption font-semibold text-legion-gold hover:bg-legion-gold/10">{t('legion.immeuble.regard.fiche')}</button>
      </aside>
    </div>
  );
}
