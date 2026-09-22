import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconSend, IconMoodSmile, IconPhoto, IconMicrophone, IconPlayerStopFilled, IconAt, IconLayoutKanban,
  IconArrowBackUp, IconCopy, IconCheck, IconPlus, IconX, IconSparkles, IconChecks, IconArrowLeft,
  IconChevronDown, IconCamera,
} from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { ChoixEmoji } from './ChoixEmoji';
import { RAPIDES } from '../emojis';
import { GENRES, heure, jourDe, sansAccent, iconeDept } from './outils';

// La conversation — le centre de l'écran, à la WhatsApp: les bulles
// groupées par auteur, le nom en couleur DANS la bulle, la citation, les
// réactions, les photos, les vocaux, l'agent qui « écrit… », et en bas la
// zone de saisie.
//
// Beau, 22/09, capture de WhatsApp à l'appui: « le chat sur le tél est
// affreux… ça doit être comme le deuxième screen… et ça bouge même ». Sur
// téléphone, la conversation prend donc tout l'écran (plus d'en-tête
// d'entreprise, plus de pastilles, plus d'onglets en bas), comme quand on
// ouvre un groupe WhatsApp. Et « ça bouge » venait de deux choses:
// `scrollIntoView` qui fait défiler toute la page sur iPhone, et une zone
// de saisie en 14 px qui fait zoomer Safari à chaque toucher.

const MAX_OCTETS = 10 * 1024 * 1024;

// Une couleur par auteur, lisible sur fond sombre — comme les noms dans un
// groupe WhatsApp. Tirée du nom pour rester la même d'un jour à l'autre.
const COULEURS_NOMS = ['#F2C98A', '#5FC8C0', '#F4A6C0', '#9DB7FF', '#B5E48C', '#FFB38A', '#C8A2FF', '#7FD1FF', '#FFD166', '#80CBC4'];
function couleurNom(a) {
  const s = a?.nom || '?';
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COULEURS_NOMS[h % COULEURS_NOMS.length];
}

export function Conversation({
  salon, dept, agentPrive, messages, agents, moi, reactions, langue, tape, brouillon, onBrouillonPris,
  onEnvoyer, onReagir, onTacheDepuis, onFiche, onAllumer, onToggleKanban, onRetour, onTaches, entrepriseId, t,
}) {
  const fil = useRef(null);
  const colle = useRef(true); // la liste est-elle tout en bas ?
  const [enHaut, setEnHaut] = useState(false);
  const [ouvert, setOuvert] = useState(null); // barre d'actions ouverte (id du message)
  const [picker, setPicker] = useState(null); // 'saisie' | id du message
  const [reponseA, setReponseA] = useState(null);
  const [copie, setCopie] = useState(null);

  // Descendre en bas SANS scrollIntoView: sur iPhone, il fait défiler
  // toute la page avec, et l'écran « bouge ».
  const enBas = (doux) => {
    const el = fil.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: doux ? 'smooth' : 'auto' });
  };
  useEffect(() => { colle.current = true; enBas(false); }, [salon?.id]);
  useEffect(() => { if (colle.current) enBas(false); }, [messages.length, tape]);
  // Le clavier qui s'ouvre rétrécit le fil: le dernier message reste en vue.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const suivre = () => { if (colle.current) enBas(false); };
    vv.addEventListener('resize', suivre);
    return () => vv.removeEventListener('resize', suivre);
  }, []);
  function defile() {
    const el = fil.current;
    if (!el) return;
    colle.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setEnHaut(!colle.current);
  }

  const agentDe = (id) => agents.find((a) => a.id === id);
  const parEmoji = useMemo(() => {
    const m = new Map();
    for (const r of reactions) {
      const k = r.message_id;
      if (!m.has(k)) m.set(k, new Map());
      const e = m.get(k);
      if (!e.has(r.emoji)) e.set(r.emoji, { n: 0, moi: false, qui: [] });
      const x = e.get(r.emoji);
      x.n += 1; if (moi && r.auteur_id === moi.id) x.moi = true;
      x.qui.push(agentDe(r.auteur_id)?.nom || '?');
    }
    return m;
  }, [reactions, moi, agents]);

  // Qui est dans ce salon — la ligne sous le nom, comme la liste des
  // membres d'un groupe.
  const membres = useMemo(() => {
    if (agentPrive || !salon) return [];
    const n = sansAccent(salon.nom);
    return agents.filter((a) => !a.user_id && a.actif && sansAccent(a.departement) === n);
  }, [agents, salon, agentPrive]);

  function copier(m) {
    navigator.clipboard?.writeText(m.texte).catch(() => {});
    setCopie(m.id); setTimeout(() => setCopie(null), 1500);
  }
  function repondre(m) { setReponseA(m); setOuvert(null); }

  const Icone = iconeDept(salon?.cle);
  const sousTitre = tape
    ? `${tape.nom} ${t('legion.ecrit', 'écrit…')}`
    : agentPrive
      ? (agentPrive.actif ? t(`legion.autonomie.${agentPrive.autonomie || 'supervise'}`) : t('legion.enVeille', 'En veille'))
      : membres.length
        ? [...membres.map((a) => a.nom), t('legion.toi', 'toi')].join(', ')
        : (salon?.a_quoi_ca_sert || dept?.a_quoi_ca_sert || '');

  // Les messages, avec pour chacun: nouveau jour ? premier / dernier d'une
  // suite du même auteur ? (le nom en haut de la première bulle, le visage
  // à côté de la dernière — exactement comme WhatsApp).
  const lignes = useMemo(() => {
    let jourPrec = null;
    return messages.map((m, i) => {
      const jour = jourDe(m.created_at, langue);
      const sep = jour !== jourPrec; jourPrec = jour;
      const prec = messages[i - 1];
      const suiv = messages[i + 1];
      const meme = (x) => x && x.genre !== 'tache' && m.genre !== 'tache' && x.auteur_id === m.auteur_id && jourDe(x.created_at, langue) === jour;
      return { m, jour, sep, premier: !meme(prec), dernier: !meme(suiv) };
    });
  }, [messages, langue]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-legion-bg">
      {/* L'en-tête du salon — sur téléphone, avec la flèche de retour */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-legion-line bg-legion-card px-2 lg:h-16 lg:px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          {onRetour && (
            <button type="button" onClick={onRetour} aria-label={t('legion.retour', 'Retour')} className="-ml-1 rounded-full p-1.5 text-legion-ink lg:hidden">
              <IconArrowLeft size={22} />
            </button>
          )}
          {agentPrive ? (
            <button type="button" onClick={() => onFiche(agentPrive)}><Visage a={agentPrive} taille={38} point={false} /></button>
          ) : (
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-white lg:h-10 lg:w-10 lg:rounded-card" style={{ backgroundColor: salon?.couleur || '#C25E38' }}>
              <Icone size={18} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold leading-tight text-legion-ink">{agentPrive ? agentPrive.nom : salon?.nom}</h3>
            <p className={`truncate text-[12px] leading-tight ${tape ? 'text-legion-success' : 'text-legion-muted'}`}>{sousTitre}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {agentPrive && (
            <Interrupteur petit on={!!agentPrive.actif} onChange={(v) => onAllumer(agentPrive, v)} label={t('legion.interrupteur')} />
          )}
          {onTaches && (
            <button type="button" onClick={onTaches} title={t('legion.tableauTaches')} className="rounded-full p-2 text-legion-ink lg:hidden">
              <IconLayoutKanban size={20} />
            </button>
          )}
          {onToggleKanban && (
            <button type="button" onClick={onToggleKanban} title={t('legion.tableauTaches')} className="hidden rounded-input border border-legion-line bg-legion-bg p-2 text-legion-gold transition hover:bg-legion-card lg:block">
              <IconLayoutKanban size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Le fil */}
      <div ref={fil} onScroll={defile} className="legion-fond-chat flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-3 pt-2 sm:px-5">
        {messages.length === 0 && (
          <div className="mx-auto mt-4 max-w-sm rounded-card bg-legion-card p-4 text-center text-caption text-legion-muted">
            {agentPrive ? t('legion.videPrive', { nom: agentPrive.nom }) : t('legion.videSalon', 'Personne n’a encore écrit ici. Commence.')}
          </div>
        )}
        {lignes.map(({ m, jour, sep, premier, dernier }) => {
          const a = agentDe(m.auteur_id);
          const mien = moi && m.auteur_id === moi.id;
          const reac = parEmoji.get(m.id);
          const genre = GENRES.find((g) => g.cle === m.genre);
          const pieces = m.meta?.pieces || [];
          const ouverte = ouvert === m.id;

          if (m.genre === 'tache') {
            const pris = agentDe(m.assigne_a);
            return (
              <div key={m.id} className="mt-2">
                {sep && <Jour label={jour} />}
                <div className="flex justify-center">
                  <div className="flex max-w-[90%] items-center gap-2 rounded-card bg-legion-card/90 px-3 py-1.5 text-[12px] text-legion-ink shadow-sm">
                    <span>📌</span>
                    <span className="min-w-0 truncate"><span className="font-semibold">{t('legion.genre.tache', 'Tâche')}</span> · {m.texte}</span>
                    {pris && <span className="flex shrink-0 items-center gap-1 text-legion-muted"><Visage a={pris} taille={16} point={false} /> {pris.nom}</span>}
                  </div>
                </div>
              </div>
            );
          }

          const seulementPiece = pieces.length && (m.texte === '📷' || m.texte === '🎤');
          const citeAuteur = m.meta?.reponse_a && agents.find((x) => x.nom === m.meta.reponse_a.nom);
          return (
            <div key={m.id} className={premier ? 'mt-2.5' : 'mt-0.5'}>
              {sep && <Jour label={jour} />}
              <Glissable onGlisse={() => repondre(m)} onAppui={() => setOuvert(m.id)}>
                <div className={`group relative flex items-end gap-1.5 ${mien ? 'justify-end' : ''}`}>
                  {!mien && (
                    <div className="w-7 shrink-0 sm:w-8">
                      {dernier && (
                        <button type="button" onClick={() => a && !a.user_id && onFiche(a)} title={a?.poste}>
                          <Visage a={a} taille={28} point={false} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`relative flex max-w-[82%] flex-col sm:max-w-[70%] ${mien ? 'items-end' : 'items-start'}`}>
                    <div className={`relative min-w-[84px] rounded-[18px] px-3 pb-1.5 pt-1.5 shadow-sm ${mien ? 'bg-legion-accent text-white' : 'bg-legion-card text-legion-ink'} ${premier ? (mien ? 'rounded-tr-[6px]' : 'rounded-tl-[6px]') : ''}`}>
                      {!mien && premier && (
                        <div className="mb-0.5 flex min-w-0 items-center gap-1.5 pr-1">
                          <span className="truncate text-[13px] font-semibold" style={{ color: couleurNom(a) }}>{a?.nom || '?'}</span>
                          {m.meta?.par_ia && <IconSparkles size={11} className="shrink-0 text-legion-gold" />}
                        </div>
                      )}
                      {m.meta?.reponse_a && (
                        <div className={`mb-1 overflow-hidden rounded-[10px] border-l-4 px-2.5 py-1.5 ${mien ? 'bg-black/20' : 'bg-legion-bg/70'}`}
                          style={{ borderColor: mien ? 'rgba(255,255,255,.7)' : couleurNom(citeAuteur || { nom: m.meta.reponse_a.nom }) }}>
                          <div className="text-[13px] font-semibold" style={{ color: mien ? '#fff' : couleurNom(citeAuteur || { nom: m.meta.reponse_a.nom }) }}>{m.meta.reponse_a.nom}</div>
                          <div className="line-clamp-2 text-[13px] opacity-80">{m.meta.reponse_a.texte}</div>
                        </div>
                      )}
                      {genre && genre.cle !== 'info' && (
                        <span className={`mb-0.5 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${mien ? 'bg-black/15' : 'bg-legion-bg text-legion-muted'}`}>
                          {genre.emoji} {t(`legion.genre.${genre.cle}`)}
                        </span>
                      )}
                      {pieces.length > 0 && (
                        <div className="mb-1 mt-0.5 space-y-1.5">
                          {pieces.map((p, i) => (
                            p.type === 'image' ? (
                              <a key={i} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt="" className="min-h-[96px] min-w-[140px] max-h-72 w-auto max-w-full rounded-[12px] bg-black/10 object-cover" loading="lazy" />
                              </a>
                            ) : p.type === 'audio' ? (
                              <audio key={i} controls preload="metadata" src={p.url} className="h-10 w-60 max-w-full" />
                            ) : (
                              <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block rounded-input bg-black/10 px-2 py-1 text-[13px] underline">{p.nom || 'Fichier'}</a>
                            )
                          ))}
                        </div>
                      )}
                      {!seulementPiece && (
                        <p className="whitespace-pre-wrap break-words text-[15.5px] leading-[1.35]">
                          {m.texte}
                          {/* La place de l'heure, pour qu'elle ne chevauche jamais le texte */}
                          <span className={`inline-block ${mien ? 'w-[58px]' : 'w-[40px]'}`} />
                        </p>
                      )}
                      {(m.meta?.verifie?.length > 0 || m.meta?.retenu) && (
                        <div className="mb-3 mt-1 space-y-1 border-t border-legion-line/60 pt-1.5 text-[12px] text-legion-muted">
                          {m.meta?.verifie?.length > 0 && <p>🔎 {t('legion.verifieBase', 'Vérifié dans la base')} · {m.meta.verifie.map((v) => v.split('(')[0].replaceAll('_', ' ')).join(', ')}</p>}
                          {m.meta?.retenu && <p className="text-legion-gold">🧠 {t('legion.retenu', 'Retenu')} : {m.meta.retenu}</p>}
                        </div>
                      )}
                      <span className={`absolute bottom-1 right-2.5 flex items-center gap-0.5 text-[11px] ${mien ? 'text-white/75' : 'text-legion-muted'}`}>
                        {heure(m.created_at, langue)}
                        {mien && <IconChecks size={15} />}
                      </span>
                      {seulementPiece ? <div className="h-3" /> : null}
                    </div>
                    {reac && reac.size > 0 && (
                      <div className={`relative z-[1] -mt-1.5 flex flex-wrap gap-1 ${mien ? 'pr-2' : 'pl-2'}`}>
                        {[...reac.entries()].map(([emoji, x]) => (
                          <button key={emoji} type="button" onClick={() => onReagir(m.id, emoji)} title={x.qui.join(', ')}
                            className={`flex items-center gap-0.5 rounded-pill border-2 border-legion-bg px-1.5 py-px text-[13px] ${x.moi ? 'bg-legion-gold/25' : 'bg-legion-card'}`}>
                            <span>{emoji}</span>{x.n > 1 && <span className="text-[10px] font-semibold text-legion-muted">{x.n}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Les actions: au survol sur ordinateur; appui long sur téléphone */}
                    <div className={`absolute -top-10 z-30 flex items-center gap-0.5 rounded-pill border border-legion-line bg-legion-card px-1.5 py-1 shadow-xl transition ${mien ? 'right-0' : 'left-0'} ${ouverte ? 'opacity-100' : 'pointer-events-none opacity-0 lg:-top-4 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100'}`}>
                      {RAPIDES.slice(0, 6).map((e) => (
                        <button key={e} type="button" onClick={() => { onReagir(m.id, e); setOuvert(null); }} className="p-1 text-[20px] leading-none transition hover:scale-125 lg:p-0.5 lg:text-[15px]">{e}</button>
                      ))}
                      <button type="button" onClick={() => setPicker(picker === m.id ? null : m.id)} title={t('legion.autreEmoji', 'Un autre emoji')} className="rounded-full p-1 text-legion-muted hover:bg-legion-bg"><IconPlus size={18} /></button>
                    </div>
                    {ouverte && (
                      <div className={`absolute top-full z-30 mt-1 w-48 overflow-hidden rounded-card border border-legion-line bg-legion-card shadow-xl ${mien ? 'right-0' : 'left-0'}`}>
                        <Action icone={IconArrowBackUp} label={t('legion.repondre', 'Répondre')} onClick={() => repondre(m)} />
                        <Action icone={IconCopy} label={copie === m.id ? t('legion.copie', 'Copié') : t('legion.copier', 'Copier')} onClick={() => { copier(m); setOuvert(null); }} />
                        <Action icone={IconPlus} label={t('legion.enFaireUneTache', 'En faire une tâche')} onClick={() => { onTacheDepuis(m); setOuvert(null); }} />
                      </div>
                    )}
                    <div className="absolute -top-4 z-20 hidden items-center gap-0.5 rounded-pill border border-legion-line bg-legion-card p-0.5 opacity-0 shadow-lg transition lg:group-hover:flex lg:group-hover:opacity-100" style={mien ? { left: -76 } : { right: -76 }}>
                      <button type="button" onClick={() => repondre(m)} title={t('legion.repondre', 'Répondre')} className="rounded-full p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-ink"><IconArrowBackUp size={14} /></button>
                      <button type="button" onClick={() => onTacheDepuis(m)} title={t('legion.enFaireUneTache', 'En faire une tâche')} className="rounded-full p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-gold"><IconPlus size={14} /></button>
                      <button type="button" onClick={() => copier(m)} title={t('legion.copier', 'Copier')} className="rounded-full p-1 text-legion-muted hover:bg-legion-bg">{copie === m.id ? <IconCheck size={14} className="text-legion-success" /> : <IconCopy size={14} />}</button>
                    </div>
                    {picker === m.id && (
                      <div className={`absolute top-6 z-40 ${mien ? 'right-0' : 'left-0'}`}>
                        <ChoixEmoji onChoisir={(e) => { onReagir(m.id, e); setPicker(null); setOuvert(null); }} onFermer={() => setPicker(null)} />
                      </div>
                    )}
                  </div>
                </div>
              </Glissable>
            </div>
          );
        })}

        {tape && (
          <div className="mt-2.5 flex items-end gap-1.5">
            <div className="w-7 shrink-0 sm:w-8"><Visage a={tape} taille={28} point={false} /></div>
            <div className="rounded-[18px] rounded-tl-[6px] bg-legion-card px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 py-0.5">
                {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-legion-muted" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Un appui ailleurs referme le menu d'un message */}
      {ouvert && <button type="button" aria-label="✕" className="fixed inset-0 z-20 cursor-default bg-black/30 lg:bg-transparent" onClick={() => { setOuvert(null); setPicker(null); }} />}

      {enHaut && (
        <button type="button" onClick={() => enBas(true)} aria-label="↓"
          className="absolute bottom-24 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-legion-line bg-legion-card text-legion-ink shadow-lg">
          <IconChevronDown size={20} />
        </button>
      )}

      <Composeur
        moi={moi} agents={agents} entrepriseId={entrepriseId} t={t}
        reponseA={reponseA} onAnnulerReponse={() => setReponseA(null)}
        picker={picker === 'saisie'} onPicker={(v) => setPicker(v ? 'saisie' : null)}
        brouillon={brouillon} onBrouillonPris={onBrouillonPris}
        onEnvoyer={async (x) => { colle.current = true; await onEnvoyer({ ...x, meta: { ...(x.meta || {}), ...(reponseA ? { reponse_a: { id: reponseA.id, nom: agentDe(reponseA.auteur_id)?.nom || '?', texte: reponseA.texte.slice(0, 160) } } : {}) } }); setReponseA(null); }}
      />
    </div>
  );
}

function Action({ icone: I, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[15px] text-legion-ink hover:bg-legion-bg active:bg-legion-bg">
      {label}<I size={18} className="text-legion-muted" />
    </button>
  );
}

// Glisser un message vers la droite pour lui répondre, comme sur WhatsApp;
// appuyer longtemps pour réagir, copier, en faire une tâche.
// Beau, 22/09: « je n'arrive pas à tirer un message pour répondre, si je
// veux répondre à Claudinette ». Au doigt seulement: la souris a la barre
// d'actions au survol. Un geste plutôt vertical reste un défilement.
const SEUIL_GLISSE = 56;
const APPUI_LONG_MS = 450;
function Glissable({ onGlisse, onAppui, children }) {
  const bloc = useRef(null);
  const fleche = useRef(null);
  const geste = useRef(null);

  function poser(dx) {
    if (bloc.current) bloc.current.style.transform = dx ? `translateX(${dx}px)` : '';
    if (fleche.current) {
      fleche.current.style.opacity = String(Math.min(dx / SEUIL_GLISSE, 1));
      fleche.current.style.transform = `scale(${dx >= SEUIL_GLISSE ? 1.15 : 0.75})`;
    }
  }
  function debut(e) {
    const p = e.touches[0];
    const g = { x: p.clientX, y: p.clientY, dx: 0, sens: null, minuteur: null };
    g.minuteur = setTimeout(() => {
      if (geste.current === g && !g.sens) { g.sens = 'appui'; navigator.vibrate?.(12); onAppui?.(); }
    }, APPUI_LONG_MS);
    geste.current = g;
    if (bloc.current) bloc.current.style.transition = 'none';
  }
  function bouge(e) {
    const g = geste.current;
    if (!g || g.sens === 'appui') return;
    const p = e.touches[0];
    const dx = p.clientX - g.x;
    const dy = p.clientY - g.y;
    if (!g.sens) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      clearTimeout(g.minuteur);
      g.sens = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.5 ? 'h' : 'v';
    }
    if (g.sens !== 'h') return;
    const avant = g.dx;
    g.dx = Math.max(0, Math.min(dx, 88));
    if (avant < SEUIL_GLISSE && g.dx >= SEUIL_GLISSE) navigator.vibrate?.(8);
    poser(g.dx);
  }
  function fin(e) {
    const g = geste.current;
    geste.current = null;
    if (g) clearTimeout(g.minuteur);
    if (g?.sens === 'appui') e.preventDefault(); // pas de « clic » juste après l'appui long
    if (bloc.current) bloc.current.style.transition = 'transform 180ms ease-out';
    poser(0);
    if (g?.sens === 'h' && g.dx >= SEUIL_GLISSE) onGlisse();
  }

  return (
    <div className="relative select-none lg:select-text" style={{ WebkitTouchCallout: 'none' }}
      onTouchStart={debut} onTouchMove={bouge} onTouchEnd={fin} onTouchCancel={fin} onContextMenu={(e) => { if (onAppui && window.matchMedia('(pointer: coarse)').matches) e.preventDefault(); }}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
        <span ref={fleche} className="flex h-8 w-8 items-center justify-center rounded-full bg-legion-card text-legion-gold opacity-0 shadow-md" style={{ transition: 'transform 120ms' }}>
          <IconArrowBackUp size={16} />
        </span>
      </span>
      <div ref={bloc} style={{ touchAction: 'pan-y' }}>{children}</div>
    </div>
  );
}

function Jour({ label }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-[8px] bg-legion-card px-3 py-1 text-[12px] font-medium text-legion-muted shadow-sm">{label}</span>
    </div>
  );
}

// La zone de saisie, à la WhatsApp: « + » pour le reste (photo, genre du
// message, nommer quelqu'un), la bulle de texte avec l'emoji dedans,
// l'appareil photo, et le micro qui devient la flèche dès qu'on écrit.
// Tout ce qui part passe par `onEnvoyer({texte, genre, meta})`.
function Composeur({ moi, agents, entrepriseId, t, reponseA, onAnnulerReponse, picker, onPicker, brouillon, onBrouillonPris, onEnvoyer }) {
  const [texte, setTexte] = useState('');
  const [genre, setGenre] = useState('info');
  const [envoi, setEnvoi] = useState(false);
  const [plus, setPlus] = useState(false);
  const [mentions, setMentions] = useState(false);
  const [filtreMention, setFiltreMention] = useState('');
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [depot, setDepot] = useState(null); // 'photo' | 'vocal' pendant l'envoi
  const zone = useRef(null);
  const fichier = useRef(null);
  const enregistreur = useRef(null);
  const morceaux = useRef([]);
  const chrono = useRef(null);

  // Répondre à quelqu'un ouvre le clavier tout de suite.
  useEffect(() => { if (reponseA) zone.current?.focus(); }, [reponseA]);

  useEffect(() => {
    if (brouillon) { setTexte(brouillon); onBrouillonPris?.(); setTimeout(() => zone.current?.focus(), 50); }
  }, [brouillon, onBrouillonPris]);

  const machines = agents.filter((a) => !a.user_id);
  const candidats = machines.filter((a) => sansAccent(a.nom).includes(sansAccent(filtreMention))).slice(0, 8);
  const genreChoisi = GENRES.find((g) => g.cle === genre);

  function changer(e) {
    const v = e.target.value; setTexte(v);
    const at = v.lastIndexOf('@');
    if (at !== -1 && at >= v.length - 20 && !/\s/.test(v.slice(at + 1))) { setFiltreMention(v.slice(at + 1)); setMentions(true); }
    else setMentions(false);
    e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  }
  function mentionner(a) {
    const at = texte.lastIndexOf('@');
    setTexte(`${texte.slice(0, at)}@${a.nom} `); setMentions(false); zone.current?.focus();
  }
  async function envoyer(e) {
    e?.preventDefault();
    const corps = texte.trim();
    if (!corps || !moi || envoi) return;
    setEnvoi(true);
    try {
      await onEnvoyer({ texte: corps, genre });
      setTexte(''); setGenre('info'); setMentions(false);
      if (zone.current) zone.current.style.height = 'auto';
    } finally { setEnvoi(false); }
  }
  function toucheClavier(e) {
    // Sur téléphone, « Entrée » va à la ligne, comme WhatsApp; on envoie
    // avec la flèche. Sur ordinateur, Entrée envoie.
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); envoyer(); }
  }

  async function deposer(blob, ext, contentType) {
    const chemin = `${entrepriseId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('legion').upload(chemin, blob, { contentType, upsert: false });
    if (error) throw error;
    return supabase.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
  }

  async function photoChoisie(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_OCTETS) { alert(t('legion.tropLourd', 'Trop lourd: 10 Mo au plus.')); return; }
    setDepot('photo');
    try {
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      const url = await deposer(f, ext, f.type || 'image/jpeg');
      await onEnvoyer({ texte: texte.trim() || '📷', genre, meta: { pieces: [{ type: 'image', url, nom: f.name }] } });
      setTexte('');
    } catch (err) { alert(err.message); }
    finally { setDepot(null); }
  }

  async function micro() {
    if (enregistre) {
      enregistreur.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert(t('legion.pasDeMicro', 'Ce navigateur ne sait pas enregistrer.'));
      return;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
      const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      morceaux.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) morceaux.current.push(ev.data); };
      rec.onstop = async () => {
        flux.getTracks().forEach((p) => p.stop());
        clearInterval(chrono.current);
        const duree = secondes;
        setEnregistre(false); setSecondes(0);
        const blob = new Blob(morceaux.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size < 1000) return; // un clic sans parler
        setDepot('vocal');
        try {
          const ext = (rec.mimeType || '').includes('mp4') ? 'm4a' : 'webm';
          const url = await deposer(blob, ext, rec.mimeType || 'audio/webm');
          await onEnvoyer({ texte: '🎤', genre: 'info', meta: { pieces: [{ type: 'audio', url, duree }] } });
        } catch (err) { alert(err.message); }
        finally { setDepot(null); }
      };
      enregistreur.current = rec;
      rec.start();
      setEnregistre(true); setSecondes(0);
      chrono.current = setInterval(() => setSecondes((s) => s + 1), 1000);
    } catch (err) { alert(err.message); }
  }

  const aEcrit = texte.trim() !== '';

  return (
    <div className="relative shrink-0 bg-legion-card px-1.5 pt-1.5 lg:border-t lg:border-legion-line lg:px-3 lg:pt-3" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
      {reponseA && (
        <div className="mx-1 mb-1.5 flex items-center justify-between rounded-[10px] border-l-4 border-legion-gold bg-legion-bg px-2.5 py-1.5">
          <div className="min-w-0"><span className="text-[13px] font-semibold text-legion-gold">{agents.find((a) => a.id === reponseA.auteur_id)?.nom}</span><p className="line-clamp-1 text-[13px] text-legion-muted">{reponseA.texte}</p></div>
          <button type="button" onClick={onAnnulerReponse} aria-label="✕" className="p-1.5 text-legion-muted"><IconX size={16} /></button>
        </div>
      )}

      {/* Le genre du message: en clair sur ordinateur, derrière « + » sur téléphone */}
      <div className="mb-2 hidden gap-1.5 overflow-x-auto lg:flex" style={{ scrollbarWidth: 'none' }}>
        {GENRES.map((g) => (
          <button key={g.cle} type="button" onClick={() => setGenre(g.cle)}
            className={`flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[12px] font-semibold transition ${genre === g.cle ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted hover:text-legion-ink'}`}
            title={g.sonne ? t('legion.sonne', 'Fait sonner le téléphone') : ''}>
            {g.emoji} {t(`legion.genre.${g.cle}`)}
          </button>
        ))}
      </div>
      {genre !== 'info' && (
        <div className="mx-1 mb-1.5 flex lg:hidden">
          <button type="button" onClick={() => setGenre('info')} className="flex items-center gap-1 rounded-pill bg-legion-gold/20 px-2.5 py-1 text-[12px] font-semibold text-legion-gold">
            {genreChoisi?.emoji} {t(`legion.genre.${genre}`)} <IconX size={12} />
          </button>
        </div>
      )}

      {plus && (
        <>
          <button type="button" aria-label="✕" className="fixed inset-0 z-20 cursor-default" onClick={() => setPlus(false)} />
          <div className="absolute bottom-full left-2 z-30 mb-2 w-60 overflow-hidden rounded-card border border-legion-line bg-legion-card shadow-2xl">
            <Action icone={IconPhoto} label={t('legion.photo', 'Photo')} onClick={() => { setPlus(false); fichier.current?.click(); }} />
            <Action icone={IconAt} label={t('legion.mentionner', 'Nommer quelqu’un')} onClick={() => { setPlus(false); setTexte((v) => `${v}@`); setMentions(true); setFiltreMention(''); zone.current?.focus(); }} />
            <div className="border-t border-legion-line" />
            {GENRES.filter((g) => g.cle !== 'info').map((g) => (
              <button key={g.cle} type="button" onClick={() => { setGenre(g.cle); setPlus(false); zone.current?.focus(); }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[15px] hover:bg-legion-bg ${genre === g.cle ? 'text-legion-gold' : 'text-legion-ink'}`}>
                <span className="w-5 text-center">{g.emoji}</span>{t(`legion.genre.${g.cle}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {mentions && candidats.length > 0 && (
        <div className="absolute bottom-full left-2 right-2 z-30 mb-2 max-h-56 max-w-sm overflow-y-auto rounded-card border border-legion-line bg-legion-card p-1.5 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.mentionner', 'Nommer quelqu’un')}</p>
          {candidats.map((a) => (
            <button key={a.id} type="button" onClick={() => mentionner(a)} className="flex w-full items-center gap-2.5 rounded-input p-1.5 text-left hover:bg-legion-bg">
              <Visage a={a} taille={28} point={false} />
              <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-legion-ink">@{a.nom}</span><span className="block truncate text-[11px] text-legion-muted">{a.poste}</span></span>
              <span className={`h-2 w-2 rounded-full ${a.actif ? 'bg-legion-success' : 'bg-legion-line'}`} />
            </button>
          ))}
        </div>
      )}

      {picker && (
        <div className="absolute bottom-full left-2 z-30 mb-2">
          <ChoixEmoji onChoisir={(e) => { setTexte((v) => v + e); zone.current?.focus(); }} onFermer={() => onPicker(false)} />
        </div>
      )}

      <form onSubmit={envoyer} className="flex items-end gap-1">
        <button type="button" onClick={() => setPlus((v) => !v)} aria-label="+" className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${plus ? 'rotate-45 text-legion-gold' : 'text-legion-ink'}`}>
          <IconPlus size={26} />
        </button>
        <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-legion-line bg-legion-bg pl-3.5 pr-1 transition focus-within:border-legion-gold/60">
          <textarea
            ref={zone} rows={1} value={texte} onChange={changer} onKeyDown={toucheClavier}
            placeholder={enregistre ? `🔴 ${t('legion.enregistrement', 'Enregistrement')} ${secondes}s` : depot ? t('legion.envoiEnCours', 'Envoi…') : t('legion.ecrireCourt', 'Message')}
            // 16 px au moins: en dessous, Safari zoome sur la page à chaque toucher.
            className="max-h-[140px] min-h-[40px] w-full resize-none bg-transparent py-[9px] text-[16px] leading-[22px] text-legion-ink outline-none placeholder:text-legion-muted focus-visible:outline-none"
            aria-label={t('equipe.ecrire')}
          />
          <button type="button" onClick={() => onPicker(!picker)} title={t('legion.emoji', 'Emoji')} className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${picker ? 'text-legion-gold' : 'text-legion-muted'}`}>
            <IconMoodSmile size={22} />
          </button>
        </div>
        {!aEcrit && (
          <button type="button" onClick={() => fichier.current?.click()} disabled={!!depot} title={t('legion.photo', 'Photo')} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-legion-ink disabled:opacity-40">
            <IconCamera size={24} />
          </button>
        )}
        <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={photoChoisie} />
        {aEcrit ? (
          <button type="submit" disabled={envoi || !moi} aria-label={t('equipe.envoyer')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-legion-gold text-legion-bg shadow-md transition active:scale-95 disabled:opacity-50">
            <IconSend size={20} />
          </button>
        ) : (
          <button type="button" onClick={micro} disabled={!!depot} title={enregistre ? t('legion.arreter', 'Arrêter') : t('legion.vocal', 'Message vocal')}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40 ${enregistre ? 'animate-pulse bg-legion-danger text-white' : 'bg-legion-gold text-legion-bg'}`}>
            {enregistre ? <IconPlayerStopFilled size={20} /> : <IconMicrophone size={22} />}
          </button>
        )}
      </form>
    </div>
  );
}
