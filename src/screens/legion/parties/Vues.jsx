import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconX, IconDownload, IconPrinter, IconChevronLeft, IconChevronRight, IconMaximize, IconThumbUp, IconTrash, IconSend, IconChecklist } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';
import { sansAccent, initiales, statutDe } from './outils';
import { Veilleur } from './Veilleur';
import { Texte } from './Plans';

// LEGION — les grandes vues (idées 51, 52, 59, 62, 69 et 166 des 200, 24/09) :
// le bureau et l'organigramme vivants, la frise, la présentation, le tableau
// d'idées. Chacune s'ouvre en plein écran depuis l'accueil ; rien n'y est
// inventé : ce qui bouge, c'est ce que les agents font vraiment.

const DIX_MINUTES = 10 * 60 * 1000;
const JOUR = 86_400_000;

export function PleinEcran({ titre, onFermer, actions, children, t }) {
  useEffect(() => {
    // Échap dans l'éditeur de l'atelier (CodeMirror) ne ferme pas la vue.
    const k = (e) => { if (e.key === 'Escape' && !e.target?.closest?.('.cm-editor')) onFermer(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onFermer]);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-legion-bg" role="dialog" aria-label={titre}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-legion-line bg-legion-card px-3 sm:px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <h2 className="truncate text-[16px] font-semibold text-legion-ink">{titre}</h2>
        <div className="flex items-center gap-1.5">
          {actions}
          <button type="button" onClick={onFermer} aria-label={t('common.close', 'Fermer')} className="rounded-full p-2 text-legion-muted hover:text-legion-ink"><IconX size={20} /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// Qui est « au travail » : un message dans les dix dernières minutes.
function actifsRecents(messages) {
  const limite = Date.now() - DIX_MINUTES;
  return new Set(messages.filter((m) => !m.user_id && Date.parse(m.created_at) >= limite).map((m) => m.auteur_id));
}

// ——— Le bureau (52) et l'organigramme (51), vivants ———
export function Bureau({ entreprise, agents, departements, messages, taches, onFiche, t }) {
  const [mode, setMode] = useState('bureau');
  const [maintenant, setMaintenant] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setMaintenant(Date.now()), 30_000); return () => clearInterval(i); }, []);
  const auTravail = useMemo(() => actifsRecents(messages), [messages, maintenant]); // eslint-disable-line react-hooks/exhaustive-deps
  const machines = agents.filter((a) => !a.user_id);
  const parDept = departements.map((d) => {
    const siens = machines.filter((a) => sansAccent(a.departement) === sansAccent(d.nom));
    return { ...d, agents: [...siens.filter((a) => a.est_directeur), ...siens.filter((a) => !a.est_directeur)] };
  });
  const sansDept = machines.filter((a) => !departements.some((d) => sansAccent(d.nom) === sansAccent(a.departement)));
  if (sansDept.length) parDept.push({ id: 'sans', nom: t('legion.vues.sansDepartement'), couleur: '#93A1B8', agents: sansDept });
  const tacheDe = (id) => taches.find((x) => x.assigne_a === id && statutDe(x) !== 'fait');
  const svg = useRef(null);

  function telecharger(type) {
    const el = svg.current;
    if (!el) return;
    const texte = new XMLSerializer().serializeToString(el);
    const nom = `organigramme-${sansAccent(entreprise.nom).replace(/[^a-z0-9]+/g, '-')}`;
    const lien = (url, ext) => { const a = document.createElement('a'); a.href = url; a.download = `${nom}.${ext}`; document.body.appendChild(a); a.click(); a.remove(); };
    const blob = new Blob([texte], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    if (type === 'svg') { lien(url, 'svg'); setTimeout(() => URL.revokeObjectURL(url), 2000); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = el.viewBox.baseVal.width * 2; c.height = el.viewBox.baseVal.height * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0B1120'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      if (type === 'png') { lien(c.toDataURL('image/png'), 'png'); return; }
      // PDF : une page à imprimer (« Enregistrer en PDF » dans la fenêtre d'impression).
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!doctype html><title>${nom}</title><style>@page{size:landscape;margin:10mm}body{margin:0;background:#0B1120}img{width:100%}</style><img src="${c.toDataURL('image/png')}" onload="setTimeout(()=>print(),200)">`);
      w.document.close();
    };
    img.src = url;
  }

  // L'organigramme en SVG : dessiné ici, donc exportable tel quel.
  const COL = 210, GAP = 24, H = 58, PAD = 24;
  const n = Math.max(1, parDept.length);
  const largeur = PAD * 2 + n * COL + (n - 1) * GAP;
  const hauteur = 150 + Math.max(1, ...parDept.map((d) => d.agents.length)) * (H + 12) + PAD;
  const court = (s, k) => (String(s || '').length > k ? `${String(s).slice(0, k - 1)}…` : String(s || ''));

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['bureau', 'organigramme'].map((k) => (
          <button key={k} type="button" onClick={() => setMode(k)}
            className={`rounded-pill px-3 py-1 text-[13px] font-semibold ${mode === k ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>{t(`legion.vues.${k}`)}</button>
        ))}
        {mode === 'organigramme' && (
          <span className="ml-auto flex flex-wrap gap-1.5">
            {['png', 'svg', 'pdf'].map((k) => (
              <button key={k} type="button" onClick={() => telecharger(k)} className="flex items-center gap-1 rounded-pill border border-legion-line px-2.5 py-1 text-[12px] text-legion-ink hover:border-legion-gold">
                {k === 'pdf' ? <IconPrinter size={13} /> : <IconDownload size={13} />} {k.toUpperCase()}
              </button>
            ))}
          </span>
        )}
      </div>
      <p className="mb-3 text-[12px] text-legion-muted">{t('legion.vues.legende')}</p>

      {mode === 'bureau' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parDept.map((d) => (
            <section key={d.id} className="rounded-2xl border-2 bg-legion-panel p-3" style={{ borderColor: `${d.couleur || '#C25E38'}66` }}>
              <h3 className="mb-3 flex items-center justify-between text-caption font-bold text-legion-ink">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.couleur || '#C25E38' }} />{d.nom}</span>
                <span className="text-[11px] font-normal text-legion-muted">{t('legion.vues.auTravail', { n: d.agents.filter((a) => auTravail.has(a.id)).length })}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {d.agents.map((a) => {
                  const bosse = auTravail.has(a.id);
                  const tache = tacheDe(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => onFiche?.(a)} title={tache ? `${a.nom} — ${tache.texte}` : a.nom}
                      className={`relative flex flex-col items-center gap-1 rounded-card border p-2 text-center ${bosse ? 'border-legion-gold/60 bg-legion-gold/10' : 'border-legion-line bg-legion-card'} ${a.actif ? '' : 'opacity-50'}`}>
                      <span className={`rounded-full ${bosse ? 'animate-pulse ring-2 ring-legion-gold' : ''}`}><Visage a={a} taille={46} /></span>
                      <span className="w-full truncate text-[12px] font-semibold text-legion-ink">{a.nom}</span>
                      <span className="w-full truncate text-[10px] text-legion-muted">{!a.actif ? `💤 ${t('legion.enVeille', 'En veille')}` : bosse ? `⌨️ ${t('legion.vues.ecrit')}` : tache ? `📌 ${tache.texte}` : t('legion.vues.disponible')}</span>
                      {a.est_directeur && <span className="absolute right-1 top-1 text-[11px]" title={t('legion.chef')}>👑</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-auto rounded-card border border-legion-line">
          <svg ref={svg} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${largeur} ${hauteur}`} width={largeur} height={hauteur} style={{ fontFamily: 'system-ui, sans-serif', background: '#0B1120' }}>
            <rect x={largeur / 2 - 130} y={PAD} width={260} height={46} rx={12} fill="#1A2337" stroke="#E3A857" strokeWidth={2} />
            <text x={largeur / 2} y={PAD + 29} textAnchor="middle" fill="#EDF1F8" fontSize={16} fontWeight={700}>{court(entreprise.nom, 28)}</text>
            {parDept.map((d, i) => {
              const x = PAD + i * (COL + GAP);
              const cx = x + COL / 2;
              return (
                <g key={d.id}>
                  <path d={`M ${largeur / 2} ${PAD + 46} V ${PAD + 62} H ${cx} V ${PAD + 78}`} fill="none" stroke="#2A3550" strokeWidth={2} />
                  <rect x={x} y={PAD + 78} width={COL} height={32} rx={8} fill={d.couleur || '#C25E38'} />
                  <text x={cx} y={PAD + 99} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{court(d.nom, 24)}</text>
                  {d.agents.map((a, j) => {
                    const y = PAD + 124 + j * (H + 12);
                    const bosse = auTravail.has(a.id);
                    return (
                      <g key={a.id} opacity={a.actif ? 1 : 0.5}>
                        <line x1={cx} y1={y - 12} x2={cx} y2={y} stroke="#2A3550" strokeWidth={2} />
                        <rect x={x} y={y} width={COL} height={H} rx={10} fill="#1A2337" stroke={bosse ? '#E3A857' : a.est_directeur ? '#5FC8C0' : '#2A3550'} strokeWidth={bosse || a.est_directeur ? 2 : 1} />
                        <circle cx={x + 26} cy={y + H / 2} r={17} fill={`${a.couleur || '#C25E38'}33`} stroke={a.couleur || '#C25E38'} strokeWidth={2} />
                        <text x={x + 26} y={y + H / 2 + 4} textAnchor="middle" fill="#EDF1F8" fontSize={11} fontWeight={700}>{initiales(a.nom)}</text>
                        <text x={x + 52} y={y + 24} fill="#EDF1F8" fontSize={12} fontWeight={600}>{court(a.nom, 20)}{a.est_directeur ? ' ★' : ''}</text>
                        <text x={x + 52} y={y + 41} fill="#93A1B8" fontSize={10}>{court(a.poste, 26)}</text>
                        {bosse && <circle cx={x + COL - 12} cy={y + 12} r={4} fill="#E3A857"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" /></circle>}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ——— La frise (59) : revoir une journée, et l'état du tableau ce soir-là ———
export function Frise({ entreprise, agents, t, langue = 'fr' }) {
  const [lignes, setLignes] = useState(null);
  const [jour, setJour] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => {
    let vivant = true;
    const depuis = new Date(Date.now() - 30 * JOUR).toISOString();
    Promise.all([
      supabase.from('legion_messages').select('id, genre, texte, created_at, termine_le, meta, auteur_id, user_id').eq('entreprise_id', entreprise.id).gte('created_at', depuis).neq('genre', 'tache').order('created_at').limit(3000),
      supabase.from('legion_messages').select('id, genre, texte, created_at, termine_le, meta, auteur_id, assigne_a').eq('entreprise_id', entreprise.id).eq('genre', 'tache').limit(3000),
    ]).then(([a, b]) => { if (vivant) setLignes({ messages: a.data || [], taches: b.data || [] }); });
    return () => { vivant = false; };
  }, [entreprise.id]);
  const jours = useMemo(() => Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * JOUR).toISOString().slice(0, 10)), []);
  if (!lignes) return <p className="p-6 text-caption text-legion-muted">…</p>;
  const duJour = (iso) => String(iso || '').slice(0, 10);
  const parJour = Object.fromEntries(jours.map((j) => [j, lignes.messages.filter((m) => duJour(m.created_at) === j).length]));
  const max = Math.max(1, ...Object.values(parJour));
  const nomDe = (id) => agents.find((a) => a.id === id)?.nom || '—';
  const ceJour = lignes.messages.filter((m) => duJour(m.created_at) === jour);
  const finDuJour = Date.parse(`${jour}T23:59:59`);
  const ouvertesCeSoir = lignes.taches.filter((x) => Date.parse(x.created_at) <= finDuJour && (!x.termine_le || Date.parse(x.termine_le) > finDuJour));
  const creees = lignes.taches.filter((x) => duJour(x.created_at) === jour);
  const terminees = lignes.taches.filter((x) => duJour(x.termine_le) === jour);
  const groupes = [
    ['decisions', ceJour.filter((m) => m.genre === 'decision')],
    ['livrables', ceJour.filter((m) => m.meta?.livrable)],
    ['reunions', ceJour.filter((m) => m.meta?.reunion?.ouverture)],
    ['rapports', ceJour.filter((m) => m.meta?.rapport)],
    ['questions', ceJour.filter((m) => m.genre === 'question' && !m.user_id)],
  ];
  const date = (j) => new Date(`${j}T12:00:00`).toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex h-24 items-end gap-[2px] sm:gap-1">
          {jours.map((j) => (
            <button key={j} type="button" onClick={() => setJour(j)} title={`${date(j)} — ${parJour[j]}`}
              className={`flex-1 rounded-t ${j === jour ? 'bg-legion-gold' : 'bg-legion-teal/50 hover:bg-legion-teal'}`}
              style={{ height: `${Math.max(4, (parJour[j] / max) * 100)}%` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-legion-muted">
          <span>{date(jours[0])}</span><span>{t('legion.vues.aujourdhui')}</span>
        </div>
      </div>
      <h3 className="text-[15px] font-semibold capitalize text-legion-ink">{date(jour)}</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Case n={creees.length} libelle={t('legion.vues.tachesCreees')} />
        <Case n={terminees.length} libelle={t('legion.vues.tachesTerminees')} />
        <Case n={ouvertesCeSoir.length} libelle={t('legion.vues.ouvertesCeSoir')} />
      </div>
      {groupes.every(([, l]) => !l.length) && <div className="flex items-center gap-3 text-caption text-legion-muted"><Veilleur taille={48} />{t('legion.vues.rienCeJour')}</div>}
      {groupes.filter(([, l]) => l.length).map(([k, l]) => (
        <div key={k}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t(`legion.vues.groupe.${k}`)} ({l.length})</p>
          <ul className="space-y-1">
            {l.slice(0, 12).map((m) => (
              <li key={m.id} className="rounded-card border border-legion-line bg-legion-card px-3 py-2 text-caption">
                <span className="text-[11px] text-legion-muted">{new Date(m.created_at).toLocaleTimeString(langue === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })} · {nomDe(m.auteur_id)}</span>
                <p className="line-clamp-2 text-legion-ink">{String(m.texte).replace(/[#*_]/g, '').slice(0, 240)}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
function Case({ n, libelle }) {
  return <div className="rounded-card border border-legion-line bg-legion-card py-2"><div className="text-xl font-bold text-legion-ink">{n}</div><div className="text-[11px] text-legion-muted">{libelle}</div></div>;
}

// ——— La présentation (62) : des diapositives faites de ce qui est vrai ———
export function Presentation({ entreprise, agents, departements, t, langue = 'fr' }) {
  const [d, setD] = useState(null);
  const [i, setI] = useState(0);
  const zone = useRef(null);
  useEffect(() => {
    let vivant = true;
    Promise.all([
      supabase.from('legion_plans').select('departement, horizon, contenu, created_at').eq('entreprise_id', entreprise.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('legion_feuille').select('titre, horizon, debut, fin, fait, fait_le').eq('entreprise_id', entreprise.id).order('debut').limit(60),
      supabase.rpc('legion_tableau_de_bord', { p_entreprise: entreprise.id, p_jours: 30 }),
      supabase.from('legion_messages').select('texte, created_at').eq('entreprise_id', entreprise.id).eq('genre', 'decision').is('user_id', null).order('created_at', { ascending: false }).limit(5),
    ]).then(([p, f, tb, dec]) => { if (vivant) setD({ plans: p.data || [], feuille: f.data || [], tdb: tb.data || null, decisions: dec.data || [] }); });
    return () => { vivant = false; };
  }, [entreprise.id]);
  const diapos = useMemo(() => {
    if (!d) return [];
    const machines = agents.filter((a) => !a.user_id);
    const plan = d.plans.find((p) => sansAccent(p.departement) === 'direction') || d.plans[0];
    const somme = (k) => (d.tdb?.agents || []).reduce((s, x) => s + Number(x[k] || 0), 0);
    const aVenir = d.feuille.filter((x) => !x.fait).slice(0, 6);
    const franchies = d.feuille.filter((x) => x.fait).slice(-4);
    const propre = (s) => String(s || '').replace(/[#*_>`]/g, '').trim();
    return [
      { titre: entreprise.nom, corps: [propre(entreprise.projet).slice(0, 420) || t('legion.vues.pasDeProjet')], pied: new Date().toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
      { titre: t('legion.vues.diapo.equipe', { n: machines.length }), corps: departements.map((dep) => `${dep.nom} — ${machines.filter((a) => sansAccent(a.departement) === sansAccent(dep.nom)).map((a) => a.nom).join(', ') || '—'}`) },
      { titre: t('legion.vues.diapo.plan'), corps: plan ? propre(plan.contenu).split('\n').filter(Boolean).slice(0, 9) : [t('legion.vues.pasDePlan')] },
      { titre: t('legion.vues.diapo.feuille'), corps: [...franchies.map((x) => `✓ ${x.titre}`), ...aVenir.map((x) => `→ ${x.titre}${x.debut ? ` (${x.debut})` : ''}`)].slice(0, 9).concat(d.feuille.length ? [] : [t('legion.vues.pasDeFeuille')]) },
      { titre: t('legion.vues.diapo.mesure'), corps: [
        t('legion.vues.diapo.livrables', { n: somme('livrables') }), t('legion.vues.diapo.taches', { n: somme('taches_faites') }),
        t('legion.vues.diapo.reunions', { n: somme('reunions') }), t('legion.vues.diapo.relues', { r: somme('relues'), c: somme('corrigees') }),
      ], pied: t('legion.vues.diapo.mesureNote') },
      { titre: t('legion.vues.diapo.decisions'), corps: d.decisions.length ? d.decisions.map((x) => propre(x.texte).split('\n')[0].slice(0, 160)) : [t('legion.vues.pasDeDecision')] },
      { titre: t('legion.vues.diapo.merci'), corps: [t('legion.vues.diapo.questions')] },
    ];
  }, [d, agents, departements, entreprise, t, langue]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowRight') setI((x) => Math.min(x + 1, diapos.length - 1)); if (e.key === 'ArrowLeft') setI((x) => Math.max(x - 1, 0)); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [diapos.length]);
  if (!d) return <p className="p-6 text-caption text-legion-muted">…</p>;
  const s = diapos[i];
  function imprimer() {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (x) => String(x).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    w.document.write(`<!doctype html><title>${esc(entreprise.nom)}</title><style>@page{size:landscape;margin:0}body{margin:0;font-family:Georgia,serif}section{height:100vh;box-sizing:border-box;padding:8vh 8vw;page-break-after:always;background:#FBF6EE;color:#2B2118}h1{font-size:44px;color:#C25E38;margin:0 0 24px}li{font-size:22px;margin:8px 0}footer{position:absolute;bottom:6vh;font-size:14px;color:#8A7A66}</style>${diapos.map((x) => `<section><h1>${esc(x.titre)}</h1><ul>${x.corps.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>${x.pied ? `<footer>${esc(x.pied)}</footer>` : ''}</section>`).join('')}<script>setTimeout(()=>print(),300)</script>`);
    w.document.close();
  }
  return (
    <div className="flex h-full flex-col p-3 sm:p-6">
      <div ref={zone} className="relative mx-auto flex aspect-video w-full max-w-5xl flex-col justify-center overflow-hidden rounded-2xl border-4 border-legion-gold/40 bg-[#FBF6EE] p-6 text-[#2B2118] shadow-2xl sm:p-12">
        <h1 className="mb-4 font-serif text-2xl font-bold text-[#C25E38] sm:text-4xl">{s.titre}</h1>
        <ul className="space-y-1.5 sm:space-y-2.5">
          {s.corps.map((c, k) => <li key={k} className="text-[13px] leading-snug sm:text-xl">{c}</li>)}
        </ul>
        {s.pied && <p className="absolute bottom-3 left-6 text-[11px] text-[#8A7A66] sm:bottom-6 sm:left-12 sm:text-sm">{s.pied}</p>}
        <span className="absolute bottom-3 right-4 text-[11px] text-[#8A7A66] sm:bottom-6 sm:right-8">{i + 1} / {diapos.length}</span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" onClick={() => setI((x) => Math.max(x - 1, 0))} disabled={i === 0} className="rounded-full border border-legion-line p-2 text-legion-ink disabled:opacity-30"><IconChevronLeft size={20} /></button>
        <button type="button" onClick={() => setI((x) => Math.min(x + 1, diapos.length - 1))} disabled={i === diapos.length - 1} className="rounded-full border border-legion-line p-2 text-legion-ink disabled:opacity-30"><IconChevronRight size={20} /></button>
        <button type="button" onClick={() => zone.current?.requestFullscreen?.()} className="flex items-center gap-1 rounded-pill border border-legion-line px-3 py-1.5 text-[12px] text-legion-ink"><IconMaximize size={14} /> {t('legion.vues.pleinEcran')}</button>
        <button type="button" onClick={imprimer} className="flex items-center gap-1 rounded-pill border border-legion-line px-3 py-1.5 text-[12px] text-legion-ink"><IconPrinter size={14} /> PDF</button>
      </div>
      <p className="mt-2 text-center text-[11px] text-legion-muted">{t('legion.vues.presentationNote')}</p>
    </div>
  );
}

// ——— Le tableau d'idées (166) ———
const COULEURS = { creme: 'bg-[#FBF6EE] text-[#2B2118]', terracotta: 'bg-[#C25E38] text-white', laiton: 'bg-[#E3A857] text-[#2B2118]', turquoise: 'bg-[#5FC8C0] text-[#0B1120]' };
export function Idees({ entreprise, moi, departements, onTache, onDirective, t }) {
  const [liste, setListe] = useState(null);
  const [texte, setTexte] = useState('');
  const [couleur, setCouleur] = useState('creme');
  const uid = moi?.user_id;
  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_idees').select('*').eq('entreprise_id', entreprise.id).order('created_at', { ascending: false }).limit(200);
    setListe(data || []);
  }, [entreprise.id]);
  useEffect(() => {
    charger();
    const abo = supabase.channel(`legion-idees:${entreprise.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legion_idees', filter: `entreprise_id=eq.${entreprise.id}` }, () => charger())
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [charger, entreprise.id]);
  async function poser(e) {
    e.preventDefault();
    if (texte.trim().length < 2) return;
    await supabase.from('legion_idees').insert({ entreprise_id: entreprise.id, texte: texte.trim().slice(0, 500), couleur });
    setTexte(''); charger();
  }
  async function voter(x) {
    const votes = x.votes?.includes(uid) ? x.votes.filter((v) => v !== uid) : [...(x.votes || []), uid];
    await supabase.from('legion_idees').update({ votes }).eq('id', x.id);
    charger();
  }
  async function retirer(x) { await supabase.from('legion_idees').delete().eq('id', x.id); charger(); }
  async function enTache(x) {
    const ligne = await onTache?.(x.texte);
    if (ligne?.id) { await supabase.from('legion_idees').update({ tache_id: ligne.id }).eq('id', x.id); charger(); }
  }
  const trie = [...(liste || [])].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
  return (
    <div className="space-y-4 p-4">
      <form onSubmit={poser} className="flex flex-col gap-2 rounded-card border border-legion-line bg-legion-card p-3 sm:flex-row sm:items-center">
        <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500} placeholder={t('legion.vues.ideePlaceholder')}
          className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[16px] text-legion-ink outline-none focus:border-legion-gold sm:text-caption" />
        <div className="flex items-center gap-1.5">
          {Object.keys(COULEURS).map((c) => (
            <button key={c} type="button" onClick={() => setCouleur(c)} aria-label={c} className={`h-6 w-6 rounded-full ${COULEURS[c]} ${couleur === c ? 'ring-2 ring-legion-gold ring-offset-2 ring-offset-legion-card' : ''}`} />
          ))}
          <button type="submit" className="ml-1 rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg">{t('legion.vues.poser')}</button>
        </div>
      </form>
      {liste && liste.length === 0 && <div className="flex flex-col items-center gap-2 py-6 text-center text-caption text-legion-muted"><Veilleur taille={80} />{t('legion.vues.aucuneIdee')}</div>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trie.map((x, k) => (
          <li key={x.id} className={`flex min-h-[120px] flex-col justify-between rounded-md p-3 shadow-lg ${COULEURS[x.couleur] || COULEURS.creme}`} style={{ transform: `rotate(${((k % 5) - 2) * 0.6}deg)` }}>
            <p className="whitespace-pre-wrap text-[14px] leading-snug">{x.texte}</p>
            <div className="mt-3 flex items-center gap-1.5 text-[12px]">
              <button type="button" onClick={() => voter(x)} className={`flex items-center gap-1 rounded-pill px-2 py-0.5 ${x.votes?.includes(uid) ? 'bg-black/25' : 'bg-black/10'}`}><IconThumbUp size={13} /> {x.votes?.length || 0}</button>
              {x.tache_id ? <span className="rounded-pill bg-black/10 px-2 py-0.5">✓ {t('legion.vues.enTache')}</span> : (
                <button type="button" onClick={() => enTache(x)} title={t('legion.vues.versTache')} className="rounded-pill bg-black/10 p-1"><IconChecklist size={14} /></button>
              )}
              {departements.length > 0 && <button type="button" onClick={() => onDirective?.(x.texte)} title={t('legion.vues.versEquipe')} className="rounded-pill bg-black/10 p-1"><IconSend size={14} /></button>}
              {x.user_id === uid && <button type="button" onClick={() => retirer(x)} title={t('legion.vues.retirer')} className="ml-auto rounded-pill bg-black/10 p-1"><IconTrash size={14} /></button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ——— Le wiki de l'équipe (165) : tenu par le directeur, corrigeable ———
export function Wiki({ entreprise, lecteur = false, t }) {
  const [pages, setPages] = useState(null);
  const [choix, setChoix] = useState('decisions');
  const [edition, setEdition] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_wiki').select('id, cle, titre, contenu, maj_le, par_user').eq('entreprise_id', entreprise.id).order('cle');
    setPages(data || []);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);
  async function mettreAJour() {
    setOccupe(true);
    await supabase.functions.invoke('legion-rapport', { body: { entreprise_id: entreprise.id, mode: 'wiki' } });
    setOccupe(false); charger();
  }
  async function enregistrer() {
    const p = pages.find((x) => x.cle === choix);
    if (!p) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('legion_wiki').update({ contenu: edition.slice(0, 20000), par_user: user?.id || null, maj_le: new Date().toISOString() }).eq('id', p.id);
    setEdition(null); charger();
  }
  if (!pages) return <p className="p-6 text-caption text-legion-muted">…</p>;
  const page = pages.find((x) => x.cle === choix) || pages[0];
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((p) => (
          <button key={p.cle} type="button" onClick={() => { setChoix(p.cle); setEdition(null); }}
            className={`rounded-pill px-3 py-1 text-[13px] font-semibold ${page?.cle === p.cle ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>{p.titre}</button>
        ))}
        {!lecteur && <button type="button" onClick={mettreAJour} disabled={occupe} className="ml-auto rounded-pill border border-legion-gold/50 px-3 py-1 text-[12px] font-semibold text-legion-gold disabled:opacity-50">{occupe ? t('legion.vues.wikiEnCours') : t('legion.vues.wikiMaj')}</button>}
      </div>
      {!page ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-caption text-legion-muted"><Veilleur taille={80} />{t('legion.vues.wikiVide')}</div>
      ) : (
        <div className="rounded-card border border-legion-line bg-legion-card p-4">
          <p className="mb-2 text-[11px] text-legion-muted">{t('legion.vues.wikiMajLe', { date: new Date(page.maj_le).toLocaleString(), par: page.par_user ? t('legion.vues.wikiParHumain') : t('legion.vues.wikiParDirecteur') })}</p>
          {edition != null ? (
            <>
              <textarea value={edition} onChange={(e) => setEdition(e.target.value)} rows={14} className="w-full rounded-input border border-legion-line bg-legion-bg p-2 font-mono text-[13px] text-legion-ink outline-none focus:border-legion-gold" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={enregistrer} className="rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg">{t('common.save')}</button>
                <button type="button" onClick={() => setEdition(null)} className="rounded-pill border border-legion-line px-3 py-1 text-[12px] text-legion-muted">{t('common.cancel', 'Annuler')}</button>
              </div>
            </>
          ) : (
            <>
              <Texte contenu={page.contenu} className="text-[14px] leading-relaxed text-legion-ink" titre="text-legion-gold" />
              {!lecteur && <button type="button" onClick={() => setEdition(page.contenu)} className="mt-3 text-[12px] font-semibold text-legion-gold">{t('legion.vues.wikiCorriger')}</button>}
            </>
          )}
        </div>
      )}
      <p className="text-[11px] text-legion-muted">{t('legion.vues.wikiAide')}</p>
    </div>
  );
}
