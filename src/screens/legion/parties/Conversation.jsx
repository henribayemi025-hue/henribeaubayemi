import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconSend, IconMoodSmile, IconPhoto, IconMicrophone, IconPlayerStopFilled, IconAt, IconLayoutKanban,
  IconArrowBackUp, IconCopy, IconCheck, IconPlus, IconX, IconSparkles, IconChecks, IconArrowLeft,
  IconChevronDown, IconCamera, IconUserPlus, IconUsersGroup, IconSwords, IconHandStop, IconPhone, IconPaperclip, IconFileSpreadsheet, IconFileText,
  IconVolume, IconPlayerStop, IconNews,
} from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { blobToWavDataUrl } from '../../../lib/audioWav';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { ChoixEmoji } from './ChoixEmoji';
import { RAPIDES } from '../emojis';
import { GENRES, heure, jourDe, sansAccent, iconeDept, espacerPhrases } from './outils';
import { Texte, estStructure } from './Plans';

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
  onEnvoyer, onReagir, onTacheDepuis, onFiche, onAllumer, onToggleKanban, onRetour, onTaches, onPhotoSalon, onMembres, entrepriseId, t,
  reunion, onReunion, onConclureReunion, onAppeler, onRapport, onCreerTache, lecteur = false,
}) {
  const photoSalon = useRef(null);
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
  // Sur téléphone, la conversation est cachée tant qu'on n'ouvre pas
  // l'onglet: descendre en bas ne faisait alors rien, et le fil s'ouvrait
  // sur les vieux messages. Dès que le fil prend une taille (il apparaît,
  // ou le clavier le rétrécit), on redescend s'il était en bas.
  useEffect(() => {
    const el = fil.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => { if (colle.current) enBas(false); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
    const ajoutes = salon.membres || [];
    return agents.filter((a) => !a.user_id && a.actif && (sansAccent(a.departement) === n || ajoutes.includes(a.cle)));
  }, [agents, salon, agentPrive]);
  const [gererMembres, setGererMembres] = useState(false);
  const [convoquer, setConvoquer] = useState(false);
  const [rapport, setRapport] = useState(false);

  // Les commandes « / » (idée 58 des 200, 24/09) : taper « / » dans la case
  // propose la liste. Chacune fait ce que ferait le bouton correspondant.
  const trouverAgent = (nom) => agents.find((a) => !a.user_id && sansAccent(a.nom).startsWith(sansAccent(String(nom || '').replace(/^@/, '').trim())) && String(nom || '').trim());
  const commandes = [
    !agentPrive && onReunion && !reunion && { cle: 'reunion', faire: () => { setConvoquer(true); setGererMembres(false); setRapport(false); } },
    !agentPrive && onRapport && { cle: 'rapport', faire: () => { setRapport(true); setConvoquer(false); } },
    onCreerTache && { cle: 'tache', arg: true, faire: (x) => (x.trim().length >= 3 ? onCreerTache({ texte: x.trim().slice(0, 200), assigne_a: null, priorite: 'moyenne' }) : null) },
    onAppeler && { cle: 'appeler', arg: true, faire: (x) => { const a = trouverAgent(x); if (a && a.actif && a.moteur !== 'claude-code') onAppeler(a); } },
    { cle: 'regle', arg: true, faire: async (x) => { if (x.trim().length >= 8 && moi) await supabase.from('legion_memoire').insert({ entreprise_id: entrepriseId, regle: x.trim().slice(0, 400), source: 'main', cree_par: moi.user_id }); } },
  ].filter(Boolean);

  // Faire relire un livrable par un collègue (idée 2 des 200) : un autre
  // agent du service, sinon un responsable. Il répond comme d'habitude, et
  // peut contester.
  function relecteurDe(m) {
    const auteur = agents.find((a) => a.id === m.auteur_id);
    if (!auteur) return null;
    const libres = agents.filter((a) => !a.user_id && a.actif && a.moteur !== 'claude-code' && a.id !== auteur.id);
    return libres.find((a) => sansAccent(a.departement) === sansAccent(auteur.departement)) || libres.find((a) => a.est_directeur) || null;
  }
  async function faireRelire(m) {
    const qui = relecteurDe(m);
    const auteur = agents.find((a) => a.id === m.auteur_id);
    if (!qui || !auteur) return;
    colle.current = true;
    await onEnvoyer({
      texte: `@${qui.nom} ${t('legion.conteste.consigne', { nom: auteur.nom })}`,
      genre: 'info',
      meta: { reponse_a: { id: m.id, nom: auteur.nom, texte: String(m.texte).slice(0, 160) } },
    });
  }

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
            // Toucher l'icône du salon: lui mettre une photo (Beau, 22/09).
            <button type="button" onClick={() => photoSalon.current?.click()} disabled={!onPhotoSalon}
              title={t('legion.photoDuSalon', 'Changer la photo du salon')} className="shrink-0">
              {salon?.image_url ? (
                <img src={salon.image_url} alt="" className="h-[38px] w-[38px] rounded-full object-cover lg:h-10 lg:w-10" />
              ) : (
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-white lg:h-10 lg:w-10 lg:rounded-card" style={{ backgroundColor: salon?.couleur || '#C25E38' }}>
                  <Icone size={18} />
                </span>
              )}
              <input ref={photoSalon} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPhotoSalon?.(salon, f); }} />
            </button>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold leading-tight text-legion-ink">{agentPrive ? agentPrive.nom : salon?.nom}</h3>
            <p className={`truncate text-[12px] leading-tight ${tape ? 'text-legion-success' : 'text-legion-muted'}`}>{sousTitre}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {agentPrive && onAppeler && agentPrive.moteur !== 'claude-code' && (
            <button type="button" onClick={() => onAppeler(agentPrive)} disabled={!agentPrive.actif}
              title={agentPrive.actif ? t('legion.appel.appeler', { nom: agentPrive.nom }) : t('legion.enVeille', 'En veille')}
              className="rounded-full p-2 text-legion-ink transition disabled:opacity-40">
              <IconPhone size={20} />
            </button>
          )}
          {agentPrive && (
            <Interrupteur petit on={!!agentPrive.actif} onChange={(v) => onAllumer(agentPrive, v)} label={t('legion.interrupteur')} />
          )}
          {!agentPrive && onRapport && (
            <button type="button" onClick={() => { setRapport((v) => !v); setConvoquer(false); setGererMembres(false); }}
              title={t('legion.rapport.titre')} aria-label={t('legion.rapport.titre')}
              className={`rounded-full p-2 transition ${rapport ? 'text-legion-gold' : 'text-legion-ink'}`}>
              <IconNews size={20} />
            </button>
          )}
          {!agentPrive && onReunion && (
            <button type="button" onClick={() => { setConvoquer((v) => !v); setGererMembres(false); setRapport(false); }} disabled={!!reunion}
              title={reunion ? t('legion.reunion.enCours') : t('legion.reunion.titre')}
              className={`rounded-full p-2 transition disabled:opacity-40 ${convoquer ? 'text-legion-gold' : 'text-legion-ink'}`}>
              <IconUsersGroup size={20} />
            </button>
          )}
          {!agentPrive && onMembres && (
            <button type="button" onClick={() => { setGererMembres((v) => !v); setConvoquer(false); }} title={t('legion.gererMembres', 'Qui est dans ce salon')}
              className={`rounded-full p-2 transition ${gererMembres ? 'text-legion-gold' : 'text-legion-ink'}`}>
              <IconUserPlus size={20} />
            </button>
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

      {/* Qui est dans ce salon: le département, et ceux qu'on ajoute à la main */}
      {gererMembres && !agentPrive && salon && (
        <div className="max-h-[45%] shrink-0 overflow-y-auto border-b border-legion-line bg-legion-panel px-3 py-2.5">
          <p className="mb-2 text-[12px] text-legion-muted">{t('legion.membresAide', 'Les agents du département sont là d’office. Ajoute qui tu veux en plus.')}</p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {agents.filter((a) => !a.user_id).map((a) => {
              const duDept = sansAccent(a.departement) === sansAccent(salon.nom);
              const ajoute = (salon.membres || []).includes(a.cle);
              return (
                <li key={a.id} className="flex items-center gap-2 rounded-card bg-legion-card px-2.5 py-1.5">
                  <Visage a={a} taille={28} point={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-legion-ink">{a.nom}</span>
                    <span className="block truncate text-[11px] text-legion-muted">{a.poste}</span>
                  </span>
                  {duDept ? (
                    <span className="shrink-0 text-[11px] text-legion-muted">{t('legion.duDepartement', 'du département')}</span>
                  ) : (
                    <button type="button" onClick={() => onMembres(salon, ajoute ? (salon.membres || []).filter((c) => c !== a.cle) : [...(salon.membres || []), a.cle])}
                      className={`shrink-0 rounded-pill px-2.5 py-1 text-[12px] font-semibold ${ajoute ? 'border border-legion-line text-legion-muted' : 'bg-legion-gold text-legion-bg'}`}>
                      {ajoute ? t('legion.retirer', 'Retirer') : t('legion.ajouter', 'Ajouter')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Le rapport tout de suite (legion-rapport, 23/09) */}
      {rapport && !agentPrive && onRapport && (
        <DemanderRapport t={t} onFermer={() => setRapport(false)}
          onDemander={async (mode) => { const ok = await onRapport(mode); if (ok) { setRapport(false); colle.current = true; } return ok; }} />
      )}
      {/* Convoquer une réunion (legion-reunion, 23/09) */}
      {convoquer && !agentPrive && salon && !reunion && (
        <ConvoquerReunion salon={salon} agents={agents} t={t} onFermer={() => setConvoquer(false)}
          onOuvrir={async (x) => { const ok = await onReunion(x); if (ok) { setConvoquer(false); colle.current = true; } return ok; }} />
      )}
      {/* La réunion en cours: qui parle, où on en est, et « conclure » */}
      {reunion && !agentPrive && (
        <BandeauReunion reunion={reunion} agents={agents} t={t} onConclure={() => onConclureReunion(reunion.id)} />
      )}

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

          const seulementPiece = pieces.length && (m.texte === '📷' || m.texte === '🎤' || m.texte === '📎');
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
                      {genre && genre.cle !== 'info' && !m.meta?.reunion?.fin && (
                        <span className={`mb-0.5 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${mien ? 'bg-black/15' : 'bg-legion-bg text-legion-muted'}`}>
                          {genre.emoji} {t(`legion.genre.${genre.cle}`)}
                        </span>
                      )}
                      <EtiquetteReunion m={m} mien={mien} agents={agents} t={t} messages={messages} langue={langue} />
                      {pieces.length > 0 && (
                        <div className="mb-1 mt-0.5 space-y-1.5">
                          {pieces.map((p, i) => (
                            p.type === 'image' ? (
                              <a key={i} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt="" className="min-h-[96px] min-w-[140px] max-h-72 w-auto max-w-full rounded-[12px] bg-black/10 object-cover" loading="lazy" />
                              </a>
                            ) : p.type === 'audio' ? (
                              <div key={i}>
                                <audio controls preload="metadata" src={p.url} className="h-10 w-60 max-w-full" />
                                {/* Ce que l'agent a entendu (transcrit côté serveur, 23/09). */}
                                {p.transcription && <p className="mt-1 text-[12px] italic opacity-80">« {p.transcription} »</p>}
                              </div>
                            ) : (
                              <a key={i} href={p.url} target="_blank" rel="noreferrer" download={p.nom || undefined}
                                className="flex items-center gap-2 rounded-[12px] bg-black/10 px-2.5 py-2 text-[13px]">
                                {/\.(xlsx|xls|csv)$/i.test(p.nom || '') ? <IconFileSpreadsheet size={22} className="shrink-0" /> : <IconFileText size={22} className="shrink-0" />}
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold">{p.nom || t('legion.fichier', 'Fichier')}</span>
                                  <span className="block text-[11px] opacity-75">{p.texte ? t('legion.fichierLu', 'lu par l’équipe') : ''}{p.cree_par_agent ? t('legion.fichierCree', 'préparé par l’agent — télécharger') : ''}</span>
                                </span>
                              </a>
                            )
                          ))}
                        </div>
                      )}
                      {!seulementPiece && ((m.meta?.par_ia || m.meta?.rapport) && estStructure(m.texte) ? (
                        // Un plan, un livrable, une réponse point par point
                        // (Beau, 22/09: « présentable, on n'est pas au
                        // primaire »): titres et listes rendus, pas du
                        // Markdown brut dans une bulle.
                        <div className="mb-3 break-words">
                          <Texte contenu={m.texte} className={`text-[15px] leading-[1.35] ${mien ? 'text-white' : 'text-legion-ink'}`} titre={mien ? 'text-white/85' : 'text-legion-gold'} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[15.5px] leading-[1.35]">
                          {m.meta?.par_ia ? espacerPhrases(m.texte) : m.texte}
                          {/* La place de l'heure, pour qu'elle ne chevauche jamais le texte */}
                          <span className={`inline-block ${mien ? 'w-[58px]' : 'w-[40px]'}`} />
                        </p>
                      ))}
                      {(m.meta?.plan || m.meta?.livrable) && (
                        <p className={`mb-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${m.meta?.livrable?.statut === 'bloque' ? 'bg-legion-danger/15 text-legion-danger' : 'bg-legion-gold/15 text-legion-gold'}`}>
                          {m.meta?.plan ? `📅 ${t('legion.badgePlan', 'Plan')} · ${m.meta.plan.departement || ''}`
                            : m.meta.livrable.statut === 'bloque' ? `⛔ ${t('legion.badgeBloque', 'Bloqué')} · ${m.meta.livrable.tache || ''}`
                            : `📦 ${t('legion.badgeLivrable', 'Livrable')} · ${m.meta.livrable.tache || ''}`}
                        </p>
                      )}
                      {m.meta?.action && <ActionProposee message={m} t={t} />}
                      {/* « S'ils ne comprennent pas, ils m'appellent, on parle » (Beau) :
                          une question d'un agent se règle aussi de vive voix. */}
                      {m.genre === 'question' && !mien && a && !a.user_id && a.actif && a.moteur !== 'claude-code' && onAppeler && (
                        <button type="button" onClick={() => onAppeler(a)}
                          className="mb-3 mt-1 inline-flex items-center gap-1.5 rounded-pill border border-legion-line bg-legion-bg px-2.5 py-1 text-[12px] font-semibold text-legion-ink">
                          <IconPhone size={13} /> {t('legion.appel.enParler', { nom: a.nom })}
                        </button>
                      )}
                      {Array.isArray(m.meta?.propositions) && m.meta.propositions.length > 0 && (
                        <PropositionsVeilleur propositions={m.meta.propositions} entrepriseId={entrepriseId} t={t} />
                      )}
                      {/* Les sources d'une recherche sur Internet (23/09): gardées en
                          base depuis le début, jamais montrées jusqu'ici. Une
                          réponse qui s'appuie sur le web doit dire d'où. */}
                      {Array.isArray(m.meta?.sources) && m.meta.sources.some((x) => /^https?:\/\//.test(x?.url || '')) && (
                        <div className="mb-3 mt-1 border-t border-legion-line/60 pt-1.5 text-[12px] text-legion-muted">
                          <p className="mb-0.5">🔗 {t('legion.sources', 'Sources')}</p>
                          <ol className="list-decimal space-y-0.5 pl-4">
                            {m.meta.sources.filter((x) => /^https?:\/\//.test(x?.url || '')).slice(0, 6).map((x, i) => (
                              <li key={i}><a href={x.url} target="_blank" rel="noreferrer" className="break-words underline">{x.titre || x.url}</a></li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {(m.meta?.verifie?.length > 0 || m.meta?.retenu || m.meta?.relu?.corrige) && (
                        <div className="mb-3 mt-1 space-y-1 border-t border-legion-line/60 pt-1.5 text-[12px] text-legion-muted">
                          {m.meta?.verifie?.length > 0 && <p>🔎 {t('legion.verifieBase', 'Vérifié dans la base')} · {m.meta.verifie.map((v) => v.split('(')[0].replaceAll('_', ' ')).join(', ')}</p>}
                          {m.meta?.retenu && <p className="text-legion-gold">🧠 {t('legion.retenu', 'Retenu')} : {m.meta.retenu}</p>}
                          {m.meta?.relu?.corrige && <p>🧐 {t('legion.reluCorrige', 'Relu et corrigé')}{m.meta.relu.raison ? ` : ${m.meta.relu.raison}` : ''}</p>}
                        </div>
                      )}
                      <span className={`absolute bottom-1 right-2.5 flex items-center gap-0.5 text-[11px] ${mien ? 'text-white/75' : 'text-legion-muted'}`}>
                        {heure(m.created_at, langue)}
                        {mien && (m.meta?.en_attente ? <span title={t('legion.horsLigne.enAttente')}>🕓</span> : <IconChecks size={15} />)}
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
                        {m.meta?.livrable && !mien && relecteurDe(m) && (
                          <Action icone={IconSwords} label={t('legion.conteste.demander', { nom: relecteurDe(m).nom })} onClick={() => { faireRelire(m); setOuvert(null); }} />
                        )}
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

      {lecteur ? (
        <p className="shrink-0 border-t border-legion-line bg-legion-card px-4 py-3 text-center text-caption text-legion-muted" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>{t('legion.securite.lecteurNote')}</p>
      ) : (
      <Composeur
        moi={moi} agents={agents} entrepriseId={entrepriseId} t={t} commandes={commandes}
        reponseA={reponseA} onAnnulerReponse={() => setReponseA(null)}
        picker={picker === 'saisie'} onPicker={(v) => setPicker(v ? 'saisie' : null)}
        brouillon={brouillon} onBrouillonPris={onBrouillonPris}
        onEnvoyer={async (x) => {
          // La citation part avec le message et disparaît tout de suite de la case.
          const cite = reponseA;
          colle.current = true; setReponseA(null);
          await onEnvoyer({ ...x, meta: { ...(x.meta || {}), ...(cite ? { reponse_a: { id: cite.id, nom: agentDe(cite.auteur_id)?.nom || '?', texte: cite.texte.slice(0, 160) } } : {}) } });
        }}
      />
      )}
    </div>
  );
}

// Une action proposée par un agent: rien ne part sans « Confirmer »
// (fonction legion-action, avec le jeton du fondateur).
const LIBELLES_ACTION = {
  allumer_agent: (a) => `Allumer ${a.agent}`,
  eteindre_agent: (a) => `Éteindre ${a.agent}`,
  retenir_regle: (a) => `Retenir la règle : « ${a.valeur} »`,
  equiper_competence: (a) => `Équiper ${a.agent} de « ${a.valeur} »`,
  // « Prénom Nom | Poste | Département | Ce qu'il fera » (idée 3 des 200).
  engager_agent: (a) => {
    const [nom, poste, dep, mandat] = String(a.valeur || '').split('|').map((x) => x.trim());
    return `Engager ${nom} — ${poste}${dep ? ` (${dep})` : ''}${mandat ? ` : ${mandat}` : ''}`;
  },
};
function ActionProposee({ message, t }) {
  const [etat, setEtat] = useState(message.meta.action);
  const [occupe, setOccupe] = useState(false);
  const libelle = (LIBELLES_ACTION[etat.type] || (() => etat.type))(etat);
  async function decider(decision) {
    setOccupe(true);
    const { data, error } = await supabase.functions.invoke('legion-action', { body: { message_id: message.id, decision } });
    setOccupe(false);
    if (error || data?.erreur) { setEtat((e) => ({ ...e, resultat: data?.erreur || error.message })); return; }
    setEtat((e) => ({ ...e, statut: data.statut, resultat: data.resultat }));
  }
  return (
    <div className="mb-3 mt-2 rounded-card border border-legion-gold/40 bg-legion-gold/10 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-gold">{t('legion.actionProposee', 'Action proposée')}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-legion-ink">{libelle}</p>
      {etat.statut === 'a_confirmer' ? (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => decider('confirmer')} disabled={occupe}
            className="rounded-pill bg-legion-gold px-3.5 py-1.5 text-[13px] font-semibold text-legion-bg disabled:opacity-50">{occupe ? '…' : t('legion.confirmer', 'Confirmer')}</button>
          <button type="button" onClick={() => decider('refuser')} disabled={occupe}
            className="rounded-pill border border-legion-line px-3.5 py-1.5 text-[13px] font-semibold text-legion-muted disabled:opacity-50">{t('legion.refuser', 'Refuser')}</button>
        </div>
      ) : (
        <p className={`mt-1 text-[12px] font-semibold ${etat.statut === 'faite' ? 'text-legion-success' : etat.statut === 'echec' ? 'text-legion-danger' : 'text-legion-muted'}`}>
          {etat.statut === 'faite' ? '✓ ' : etat.statut === 'refusee' ? '✕ ' : ''}{etat.resultat}
        </p>
      )}
      {etat.statut === 'a_confirmer' && etat.resultat && <p className="mt-1 text-[12px] text-legion-danger">{etat.resultat}</p>}
    </div>
  );
}

// Les propositions du veilleur: une compétence pour un agent, un bouton
// « Équiper ». Rien n'est attaché sans ce clic.
function PropositionsVeilleur({ propositions, entrepriseId, t }) {
  const [etat, setEtat] = useState({}); // clé → 'encours' | 'fait' | message d'erreur
  async function equiper(p) {
    const k = `${p.agent_id}:${p.cle}`;
    setEtat((e) => ({ ...e, [k]: 'encours' }));
    const { data, error } = await supabase.functions.invoke('legion-competences', { body: { action: 'equiper', entreprise_id: entrepriseId, agent_id: p.agent_id, catalogue_cle: p.cle } });
    setEtat((e) => ({ ...e, [k]: error || data?.erreur ? (data?.erreur || error.message) : 'fait' }));
  }
  return (
    <div className="mb-3 mt-2 space-y-1.5">
      {propositions.map((p) => {
        const k = `${p.agent_id}:${p.cle}`;
        const e = etat[k];
        return (
          <div key={k} className="flex items-center justify-between gap-2 rounded-input bg-legion-bg/70 px-2.5 py-1.5 text-[12px]">
            <span className="min-w-0 truncate"><span className="font-semibold">{p.nom}</span> → {p.agent}</span>
            {e === 'fait' ? <span className="shrink-0 font-semibold text-legion-success">✓ {t('legion.equipe', 'Équipé')}</span>
              : <button type="button" onClick={() => equiper(p)} disabled={e === 'encours'}
                  className="shrink-0 rounded-pill bg-legion-gold px-2.5 py-0.5 font-semibold text-legion-bg disabled:opacity-50">
                  {e === 'encours' ? '…' : t('legion.equiper', 'Équiper')}
                </button>}
            {e && e !== 'fait' && e !== 'encours' && <span className="text-legion-danger">{e}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ——— Les réunions (legion-reunion, 23/09) ———
// Beau: « faire communiquer et disputer les agents »; « on va voir comment
// ils sont en train de le faire ». Les participants par défaut sont ceux qui
// répondent dans ce salon (le département, les ajoutés à la main; en
// Direction, les responsables), cinq au plus: on peut en retirer ou en
// ajouter.
function participantsParDefaut(salon, agents) {
  const machines = agents.filter((a) => !a.user_id && a.moteur !== 'claude-code' && a.actif);
  const n = sansAccent(salon.nom);
  const ajoutes = salon.membres || [];
  const duSalon = machines.filter((a) => sansAccent(a.departement) === n || ajoutes.includes(a.cle));
  const vivier = n === 'direction'
    ? [...duSalon.filter((a) => a.est_directeur), ...machines.filter((a) => a.est_directeur && !duSalon.includes(a)), ...duSalon.filter((a) => !a.est_directeur)]
    : [...duSalon.filter((a) => a.est_directeur), ...duSalon.filter((a) => !a.est_directeur)];
  const choisis = vivier.slice(0, 5);
  for (const a of machines.filter((x) => x.est_directeur)) if (choisis.length < 3 && !choisis.includes(a)) choisis.push(a);
  return choisis.map((a) => a.id);
}

// Les formats de réunion (idées 6, 16, 20, 72, 78, 93, 120, 125, 175, 181,
// 184, 186, 190 des 200) : le serveur (legion-reunion) donne les rôles et
// titre le compte rendu ; ici, on choisit.
const FORMATS_REUNION = ['debat', 'vote', 'avocat', 'presse', 'clients', 'negociation', 'investisseurs', 'crise', 'etsi', 'retro', 'budget', 'impact'];

// Le rapport du soir arrive seul chaque soir; ici, on le demande tout de suite —
// la journée, la semaine, ou la transparence du mois écoulé.
function DemanderRapport({ t, onFermer, onDemander }) {
  const [enCours, setEnCours] = useState(null);
  async function demander(mode) {
    if (enCours) return;
    setEnCours(mode);
    try { await onDemander(mode); } finally { setEnCours(null); }
  }
  return (
    <div className="shrink-0 border-b border-legion-line bg-legion-panel px-3 py-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold text-legion-ink">{t('legion.rapport.titre')}</p>
          <p className="text-[12px] text-legion-muted">{t('legion.rapport.aide')}</p>
        </div>
        <button type="button" onClick={onFermer} aria-label={t('common.close', 'Fermer')} className="rounded-full p-1 text-legion-muted"><IconX size={18} /></button>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {['soir', 'semaine', 'mois'].map((mode) => (
          <button key={mode} type="button" onClick={() => demander(mode)} disabled={!!enCours}
            className="rounded-card border border-legion-line bg-legion-card px-3 py-2 text-left transition hover:border-legion-gold disabled:opacity-60">
            <span className="block text-[13px] font-semibold text-legion-ink">{t(`legion.rapport.${mode}`)}</span>
            <span className="block text-[11px] text-legion-muted">{enCours === mode ? t('legion.rapport.enCours') : t(`legion.rapport.${mode}Aide`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConvoquerReunion({ salon, agents, t, onFermer, onOuvrir }) {
  const [sujet, setSujet] = useState('');
  const [format, setFormat] = useState('debat');
  const [choisis, setChoisis] = useState(() => participantsParDefaut(salon, agents));
  const [envoi, setEnvoi] = useState(false);
  const [recherche, setRecherche] = useState(false);
  const allumes = agents.filter((a) => !a.user_id && a.moteur !== 'claude-code' && a.actif);
  const basculer = (id) => setChoisis((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 5 ? c : [...c, id]));
  const pret = sujet.trim().length >= 3 && choisis.length >= 2 && !envoi;
  async function ouvrir(e) {
    e.preventDefault();
    if (!pret) return;
    setEnvoi(true);
    try { await onOuvrir({ sujet: sujet.trim(), participants: choisis, recherche, format: format === 'debat' ? undefined : format }); } finally { setEnvoi(false); }
  }
  return (
    <form onSubmit={ouvrir} className="max-h-[60%] shrink-0 overflow-y-auto border-b border-legion-line bg-legion-panel px-3 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-legion-ink">{t('legion.reunion.titre')}</p>
        <button type="button" onClick={onFermer} aria-label={t('legion.retour', 'Retour')} className="rounded-full p-1 text-legion-muted"><IconX size={18} /></button>
      </div>
      <label className="mb-1 block text-[12px] font-semibold text-legion-muted" htmlFor="format-reunion">{t('legion.reunion.format', 'Le format')}</label>
      <select id="format-reunion" value={format} onChange={(e) => setFormat(e.target.value)}
        className="mb-1 w-full rounded-input border border-legion-line bg-legion-card px-3 py-2 text-[15px] text-legion-ink focus:border-legion-gold focus:outline-none">
        {FORMATS_REUNION.map((f) => <option key={f} value={f}>{t(`legion.reunion.formats.${f}.nom`)}</option>)}
      </select>
      <p className="mb-2.5 text-[12.5px] leading-snug text-legion-muted">{t(`legion.reunion.formats.${format}.aide`)}</p>
      <label className="mb-1 block text-[12px] font-semibold text-legion-muted" htmlFor="sujet-reunion">{t('legion.reunion.sujet')}</label>
      <textarea id="sujet-reunion" value={sujet} onChange={(e) => setSujet(e.target.value)} rows={2} maxLength={800}
        placeholder={t(`legion.reunion.formats.${format}.exemple`)}
        className="mb-2.5 w-full resize-none rounded-input border border-legion-line bg-legion-card px-3 py-2 text-[16px] text-legion-ink placeholder:text-legion-muted focus:border-legion-gold focus:outline-none" />
      <p className="mb-1 text-[12px] font-semibold text-legion-muted">{t('legion.reunion.participants')} · {t('legion.reunion.participantsAide')}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {allumes.map((a) => {
          const pris = choisis.includes(a.id);
          return (
            <button key={a.id} type="button" onClick={() => basculer(a.id)} aria-pressed={pris}
              className={`flex items-center gap-1.5 rounded-pill py-1 pl-1 pr-2.5 text-[13px] transition ${pris ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>
              <Visage a={a} taille={22} point={false} />
              <span className="font-semibold">{a.nom}</span>
            </button>
          );
        })}
      </div>
      <label className="mb-3 flex items-start gap-2 text-[13px] text-legion-ink">
        <input type="checkbox" checked={recherche} onChange={(e) => setRecherche(e.target.checked)} className="mt-0.5 h-4 w-4 accent-legion-gold" />
        <span>{t('legion.reunion.recherche')}<span className="block text-[12px] text-legion-muted">{t('legion.reunion.rechercheAide')}</span></span>
      </label>
      <button type="submit" disabled={!pret}
        className="w-full rounded-pill bg-legion-accent px-4 py-2.5 text-[15px] font-semibold text-white transition disabled:opacity-40">
        {envoi ? t('legion.reunion.ouverture') : t('legion.reunion.ouvrir')}
      </button>
    </form>
  );
}

function BandeauReunion({ reunion, agents, t, onConclure }) {
  const [demande, setDemande] = useState(false);
  const participants = (reunion.participants || []).map((id) => agents.find((a) => a.id === id)).filter(Boolean);
  const president = agents.find((a) => a.id === reunion.president);
  const total = (reunion.tours || 2) * participants.length;
  const fini = reunion.conclure || demande || reunion.prochain >= total;
  const suivant = !fini && participants.length ? participants[reunion.prochain % participants.length] : null;
  const tour = participants.length ? Math.min(Math.floor(reunion.prochain / participants.length) + 1, reunion.tours || 2) : 1;
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-legion-line bg-legion-gold/10 px-3 py-2">
      <IconUsersGroup size={18} className="shrink-0 text-legion-gold" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-legion-ink">{reunion.format ? t(`legion.reunion.formats.${reunion.format}.nom`) : t('legion.reunion.enCours')} · {reunion.sujet}</p>
        <p className="truncate text-[12px] text-legion-muted">
          {fini
            ? t('legion.reunion.redige', { nom: president?.nom || '' })
            : `${t(`legion.reunion.tour${tour}`)} · ${t('legion.reunion.auTourDe', { nom: suivant?.nom || '' })} · ${t('legion.reunion.paroles', { n: Math.min(reunion.prochain, total), total })}`}
        </p>
      </div>
      {!fini && (
        <button type="button" onClick={() => { setDemande(true); onConclure(); }}
          className="shrink-0 rounded-pill border border-legion-line bg-legion-card px-2.5 py-1 text-[12px] font-semibold text-legion-ink">
          {t('legion.reunion.conclure')}
        </button>
      )}
    </div>
  );
}

// Ce qu'un message est dans la réunion: l'ouverture, un tour (et qui il
// conteste), une intervention humaine, le compte rendu.
function EtiquetteReunion({ m, mien, agents, t, messages = [], langue = 'fr' }) {
  const r = m.meta?.reunion;
  const base = `mb-1 mr-1 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${mien ? 'bg-black/15 text-white' : 'bg-legion-gold/15 text-legion-gold'}`;
  if (m.meta?.dans_reunion) return <span className={base}><IconHandStop size={12} /> {t('legion.reunion.intervention')}</span>;
  // Un collègue conteste un livrable (idée 2 des 200, 24/09).
  if (m.meta?.conteste) return <span className="mb-1 mr-1 inline-flex items-center gap-1 rounded-pill bg-legion-danger/15 px-1.5 py-0.5 text-[11px] font-semibold text-legion-danger"><IconSwords size={12} /> {t('legion.conteste.badge', { nom: m.meta.conteste.agent })}</span>;
  const rap = m.meta?.rapport;
  if (rap) {
    return (
      <span className="inline-flex flex-wrap items-center">
        <span className={base}><IconNews size={12} /> {t(`legion.rapport.${rap.type}`)}</span>
        {rap.alertes > 0 && <span className="mb-1 mr-1 inline-flex items-center gap-1 rounded-pill bg-legion-danger/15 px-1.5 py-0.5 text-[11px] font-semibold text-legion-danger">{t('legion.rapport.alertes', { count: rap.alertes })}</span>}
        <EcouterReunion seul={m} messages={messages} agents={agents} langue={langue} t={t} mien={mien} libelle={t('legion.rapport.ecouter')} />
      </span>
    );
  }
  if (!r) return null;
  if (r.ouverture) {
    const noms = (r.participants || []).map((id) => agents.find((a) => a.id === id)?.nom).filter(Boolean).join(', ');
    const president = agents.find((a) => a.id === r.president)?.nom || '';
    return (
      <div className="mb-1">
        <span className={base}><IconUsersGroup size={12} /> {r.format ? t(`legion.reunion.formats.${r.format}.nom`) : t('legion.reunion.convoquee')}</span>
        <p className={`text-[12px] ${mien ? 'text-white/85' : 'text-legion-muted'}`}>{t('legion.reunion.autourDeLaTable', { noms, president })}</p>
      </div>
    );
  }
  if (r.fin && !r.interrompue && !r.annulee && !r.echec) {
    return (
      <span className="inline-flex flex-wrap items-center">
        <span className={base}>📋 {t('legion.reunion.compteRendu')}</span>
        <EcouterReunion reunionId={r.id} messages={messages} agents={agents} langue={langue} t={t} mien={mien} />
      </span>
    );
  }
  if (typeof r.tour === 'number') {
    return (
      <span className="inline-flex flex-wrap items-center">
        <span className={base}>{t(`legion.reunion.tour${Math.min(r.tour, 2)}`)}</span>
        {r.conteste && <span className="mb-1 mr-1 inline-flex items-center gap-1 rounded-pill bg-legion-danger/15 px-1.5 py-0.5 text-[11px] font-semibold text-legion-danger"><IconSwords size={12} /> {t('legion.reunion.conteste', { nom: r.conteste })}</span>}
        {r.vote && <span className={`mb-1 mr-1 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${r.vote === 'pour' ? 'bg-emerald-500/15 text-emerald-400' : r.vote === 'contre' ? 'bg-legion-danger/15 text-legion-danger' : 'bg-legion-bg text-legion-muted'}`}>🗳️ {t(`legion.reunion.vote_${r.vote}`)}</span>}
      </span>
    );
  }
  return null;
}

// Écouter une réunion à plusieurs voix (idée 187 des 200) : chaque agent a
// sa voix (celles du téléphone, dans la langue de l'entreprise), le sujet
// puis chaque prise de parole puis le compte rendu. Rien ne part au serveur.
function EcouterReunion({ reunionId, seul, messages, agents, langue, t, mien, libelle }) {
  const [joue, setJoue] = useState(false);
  const peut = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => () => { if (joue && peut) window.speechSynthesis.cancel(); }, [joue, peut]);
  if (!peut) return null;
  function lire() {
    const synth = window.speechSynthesis;
    if (joue) { synth.cancel(); setJoue(false); return; }
    const suite = seul ? [seul] : messages.filter((x) => x.id === reunionId || x.meta?.reunion?.id === reunionId).filter((x) => !x.meta?.reunion?.rate)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    const code = langue === 'en' ? 'en' : 'fr';
    const voix = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith(code));
    const ordre = [...new Set(suite.map((x) => x.auteur_id))];
    const nettoyer = (txt) => String(txt || '').replace(/[#*_>`]/g, '').replace(/\s+-\s+/g, '. ').replace(/https?:\/\/\S+/g, '');
    synth.cancel();
    suite.forEach((x, i) => {
      const a = agents.find((y) => y.id === x.auteur_id);
      const rang = ordre.indexOf(x.auteur_id);
      const u = new SpeechSynthesisUtterance(`${a?.nom || ''}. ${nettoyer(x.texte).slice(0, 1800)}`);
      u.lang = code === 'en' ? 'en-US' : 'fr-FR';
      if (voix.length) u.voice = voix[rang % voix.length];
      u.pitch = 0.85 + ((rang * 0.13) % 0.4);
      u.rate = 1.02;
      if (i === suite.length - 1) u.onend = () => setJoue(false);
      synth.speak(u);
    });
    setJoue(true);
  }
  return (
    <button type="button" onClick={lire}
      className={`mb-1 mr-1 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${mien ? 'bg-black/15 text-white' : 'bg-legion-bg text-legion-ink'}`}>
      {joue ? <IconPlayerStop size={12} /> : <IconVolume size={12} />} {joue ? t('legion.reunion.arreterEcoute', 'Arrêter') : (libelle || t('legion.reunion.ecouter', 'Écouter la réunion'))}
    </button>
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
function Composeur({ moi, agents, entrepriseId, t, reponseA, onAnnulerReponse, picker, onPicker, brouillon, onBrouillonPris, onEnvoyer, commandes = [] }) {
  const [texte, setTexte] = useState('');
  const [genre, setGenre] = useState('info');
  const [plus, setPlus] = useState(false);
  const [mentions, setMentions] = useState(false);
  const [filtreMention, setFiltreMention] = useState('');
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [depot, setDepot] = useState(null); // 'photo' | 'vocal' pendant l'envoi
  const zone = useRef(null);
  const fichier = useRef(null);
  const document_ = useRef(null); // Excel, CSV, PDF, texte (23/09)
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
  // La case se vide TOUT DE SUITE, comme WhatsApp — pas quand l'agent a fini
  // de répondre. Beau, 22/09: « le message reste dans la case jusqu'à ce
  // qu'il réponde, et ce que j'ai recommencé à écrire s'efface ». On ne
  // bloque plus la saisie pendant que l'agent réfléchit; si l'envoi échoue,
  // le texte revient dans la case.
  async function envoyer(e) {
    e?.preventDefault();
    const corps = texte.trim();
    if (!corps || !moi) return;
    // « /commande argument » : exécutée ici, pas envoyée comme message.
    const cmd = /^\/(\S+)\s*([\s\S]*)$/.exec(corps);
    const c = cmd && commandes.find((x) => x.cle === cmd[1].toLowerCase() || t(`legion.commandes.${x.cle}.nom`) === cmd[1].toLowerCase());
    if (c) {
      setTexte(''); if (zone.current) zone.current.style.height = 'auto';
      await c.faire(cmd[2] || '');
      return;
    }
    const genreEnvoye = genre;
    setTexte(''); setGenre('info'); setMentions(false);
    if (zone.current) zone.current.style.height = 'auto';
    try {
      await onEnvoyer({ texte: corps, genre: genreEnvoye });
    } catch {
      setTexte((v) => (v ? v : corps)); setGenre(genreEnvoye);
    }
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

  // Un fichier de travail (Beau, 23/09: « connecter mes agents avec Excel »,
  // « capable d'ouvrir Excel et modifier »): il part tel quel; le serveur le
  // lit (feuilles en CSV, PDF en texte) avant que l'agent réponde.
  async function documentChoisi(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_OCTETS) { alert(t('legion.tropLourd', 'Trop lourd: 10 Mo au plus.')); return; }
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    const MIMES = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel', csv: 'text/csv', pdf: 'application/pdf', txt: 'text/plain' };
    const mime = MIMES[ext];
    if (!mime) { alert(t('legion.fichierNonPris', 'Excel, CSV, PDF ou texte seulement.')); return; }
    setDepot('fichier');
    try {
      const url = await deposer(f, ext, mime);
      await onEnvoyer({ texte: texte.trim() || '📎', genre, meta: { pieces: [{ type: 'fichier', url, nom: f.name, mime }] } });
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
          // En WAV (16 kHz mono): c'est le format que le modèle comprend à coup
          // sûr — un vocal WebM arrivait chez l'agent sans être entendu — et il
          // se lit sur tous les téléphones. Échec de conversion: l'original.
          let fichier = blob; let ext = (rec.mimeType || '').includes('mp4') ? 'm4a' : 'webm'; let mime = rec.mimeType || 'audio/webm';
          try {
            const dataUrl = await blobToWavDataUrl(blob);
            fichier = await (await fetch(dataUrl)).blob(); ext = 'wav'; mime = 'audio/wav';
          } catch { /* on garde l'original */ }
          const url = await deposer(fichier, ext, mime);
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
            <Action icone={IconPaperclip} label={t('legion.fichier', 'Fichier (Excel, CSV, PDF)')} onClick={() => { setPlus(false); document_.current?.click(); }} />
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

      {texte.startsWith('/') && !texte.includes(' ') && commandes.length > 0 && (
        <div className="absolute bottom-full left-2 right-2 z-30 mb-2 max-w-sm overflow-hidden rounded-card border border-legion-line bg-legion-card p-1.5 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.commandes.titre')}</p>
          {commandes.filter((c) => `/${c.cle}`.startsWith(texte.toLowerCase())).map((c) => (
            <button key={c.cle} type="button" onClick={() => { if (c.arg) { setTexte(`/${c.cle} `); zone.current?.focus(); } else { setTexte(''); c.faire(''); } }}
              className="flex w-full items-baseline gap-2 rounded-input px-2 py-1.5 text-left hover:bg-legion-bg">
              <span className="font-mono text-[13px] text-legion-gold">/{c.cle}</span>
              <span className="truncate text-[12px] text-legion-muted">{t(`legion.commandes.${c.cle}.aide`)}</span>
            </button>
          ))}
        </div>
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
            id="legion-composer"
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
        <input ref={document_} type="file" accept=".xlsx,.xls,.csv,.pdf,.txt" className="hidden" onChange={documentChoisi} />
        {aEcrit ? (
          <button type="submit" disabled={!moi} aria-label={t('equipe.envoyer')}
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
