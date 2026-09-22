import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconSend, IconMoodSmile, IconPhoto, IconMicrophone, IconPlayerStopFilled, IconAt, IconLayoutKanban,
  IconArrowBackUp, IconCopy, IconCheck, IconPlus, IconX, IconSparkles, IconDots, IconChecks,
} from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { ChoixEmoji } from './ChoixEmoji';
import { RAPIDES } from '../emojis';
import { GENRES, heure, jourDe, sansAccent, iconeDept } from './outils';

// La conversation — le centre de l'écran, à la WhatsApp Web: les bulles,
// les réactions, la citation, les photos, les vocaux, l'agent qui « écrit… »,
// et en bas la zone de saisie avec le clavier d'emojis, la mention @, la
// photo, le micro.
//
// Beau: « je peux même pas envoyer des photos, je peux même pas faire de
// voix ». Les deux passent par le rangement `legion` de la base, sous le
// dossier de l'entreprise: seuls ses membres peuvent y déposer.

const MAX_OCTETS = 10 * 1024 * 1024;

export function Conversation({
  salon, dept, agentPrive, messages, agents, moi, reactions, langue, tape, brouillon, onBrouillonPris,
  onEnvoyer, onReagir, onTacheDepuis, onFiche, onAllumer, onToggleKanban, entrepriseId, t,
}) {
  const bas = useRef(null);
  const [ouvert, setOuvert] = useState(null); // barre d'actions ouverte sur téléphone (id du message)
  const [picker, setPicker] = useState(null); // 'saisie' | id du message
  const [reponseA, setReponseA] = useState(null);
  const [copie, setCopie] = useState(null);

  useEffect(() => { bas.current?.scrollIntoView({ block: 'end' }); }, [messages.length, tape]);

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

  function copier(m) {
    navigator.clipboard?.writeText(m.texte).catch(() => {});
    setCopie(m.id); setTimeout(() => setCopie(null), 1500);
  }

  const Icone = iconeDept(salon?.cle);
  let jourPrecedent = null;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-legion-bg">
      {/* L'en-tête du salon */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-legion-line bg-legion-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          {agentPrive ? (
            <button type="button" onClick={() => onFiche(agentPrive)}><Visage a={agentPrive} taille={40} /></button>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-white shadow-md" style={{ backgroundColor: salon?.couleur || '#C25E38' }}>
              <Icone size={18} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-body font-semibold text-legion-ink">{agentPrive ? agentPrive.nom : salon?.nom}</h3>
              {agentPrive && <span className="rounded border px-1.5 py-0.5 text-[10px] font-mono" style={{ borderColor: agentPrive.couleur, color: agentPrive.couleur, backgroundColor: agentPrive.couleur + '15' }}>{agentPrive.poste}</span>}
            </div>
            <p className="truncate text-[11px] text-legion-muted">
              {agentPrive
                ? (agentPrive.actif ? <span className="font-semibold text-legion-success">{t(`legion.autonomie.${agentPrive.autonomie || 'supervise'}`)}</span> : t('legion.enVeille', 'En veille'))
                : (salon?.a_quoi_ca_sert || dept?.a_quoi_ca_sert || '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agentPrive && (
            <div className="flex items-center gap-2 rounded-input border border-legion-line bg-legion-bg px-2.5 py-1">
              <span className="hidden text-[11px] font-semibold text-legion-muted sm:inline">{agentPrive.actif ? t('legion.allume', 'Allumé') : t('legion.eteint', 'Éteint')}</span>
              <Interrupteur petit on={!!agentPrive.actif} onChange={(v) => onAllumer(agentPrive, v)} label={t('legion.interrupteur')} />
            </div>
          )}
          {onToggleKanban && (
            <button type="button" onClick={onToggleKanban} title={t('legion.tableauTaches')} className="hidden rounded-input border border-legion-line bg-legion-bg p-2 text-legion-gold transition hover:bg-legion-card lg:block">
              <IconLayoutKanban size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Le fil */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="mx-auto max-w-sm rounded-card border border-legion-line bg-legion-card p-4 text-center text-caption text-legion-muted">
            {agentPrive ? t('legion.videPrive', { nom: agentPrive.nom }) : t('legion.videSalon', 'Personne n’a encore écrit ici. Commence.')}
          </div>
        )}
        {messages.map((m) => {
          const a = agentDe(m.auteur_id);
          const mien = moi && m.auteur_id === moi.id;
          const jour = jourDe(m.created_at, langue);
          const sep = jour !== jourPrecedent; jourPrecedent = jour;
          const reac = parEmoji.get(m.id);
          const genre = GENRES.find((g) => g.cle === m.genre);
          const pieces = m.meta?.pieces || [];
          const ouverte = ouvert === m.id;

          if (m.genre === 'tache') {
            const pris = agentDe(m.assigne_a);
            return (
              <div key={m.id}>
                {sep && <Jour label={jour} />}
                <div className="flex justify-center">
                  <div className="flex max-w-md items-center gap-2 rounded-card border border-legion-line bg-legion-card px-3 py-1.5 text-[12px] text-legion-ink shadow-sm">
                    <span>📌</span>
                    <span className="min-w-0 truncate"><span className="font-semibold">{t('legion.genre.tache', 'Tâche')}</span> · {m.texte}</span>
                    {pris && <span className="flex shrink-0 items-center gap-1 text-legion-muted"><Visage a={pris} taille={16} point={false} /> {pris.nom}</span>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id}>
              {sep && <Jour label={jour} />}
              <div className={`group relative flex items-start gap-2.5 ${mien ? 'flex-row-reverse' : ''}`}>
                {!mien && (
                  <button type="button" onClick={() => a && !a.user_id && onFiche(a)} className="mt-5 shrink-0" title={a?.poste}>
                    <Visage a={a} taille={32} point={false} />
                  </button>
                )}
                <div className={`flex max-w-[86%] flex-col sm:max-w-[72%] ${mien ? 'items-end' : 'items-start'}`}>
                  {!mien && (
                    <div className="mb-1 flex items-center gap-2 px-1">
                      <span className="text-[12px] font-semibold text-legion-ink">{a?.nom || '?'}</span>
                      {a?.poste && <span className="truncate text-[10px] text-legion-muted">· {a.poste}</span>}
                      {m.meta?.par_ia && <IconSparkles size={11} className="text-legion-gold" title="IA" />}
                    </div>
                  )}
                  <div className={`relative rounded-2xl px-3.5 py-2.5 shadow-sm ${mien ? 'rounded-tr-sm bg-legion-accent text-white' : 'rounded-tl-sm border border-legion-line bg-legion-card text-legion-ink'}`}>
                    {m.meta?.reponse_a && (
                      <div className={`mb-2 rounded-input border-l-2 px-2 py-1 text-[11px] ${mien ? 'border-legion-gold bg-black/15' : 'border-legion-gold bg-legion-bg'}`}>
                        <div className="font-semibold opacity-90">{m.meta.reponse_a.nom}</div>
                        <div className="line-clamp-2 opacity-75">{m.meta.reponse_a.texte}</div>
                      </div>
                    )}
                    {genre && genre.cle !== 'info' && (
                      <span className={`mb-1 inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 text-[10px] font-semibold ${mien ? 'bg-legion-card/20' : 'bg-legion-bg text-legion-muted'}`}>
                        {genre.emoji} {t(`legion.genre.${genre.cle}`)}
                      </span>
                    )}
                    {!(pieces.length && (m.texte === '📷' || m.texte === '🎤')) && (
                      <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{m.texte}</p>
                    )}
                    {pieces.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {pieces.map((p, i) => (
                          p.type === 'image' ? (
                            <a key={i} href={p.url} target="_blank" rel="noreferrer">
                              <img src={p.url} alt="" className="min-h-[96px] min-w-[120px] max-h-72 w-auto max-w-full rounded-card border border-black/10 bg-black/10 object-cover" loading="lazy" />
                            </a>
                          ) : p.type === 'audio' ? (
                            <audio key={i} controls preload="metadata" src={p.url} className="h-10 w-64 max-w-full" />
                          ) : (
                            <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block rounded-input bg-black/10 px-2 py-1 text-[12px] underline">{p.nom || 'Fichier'}</a>
                          )
                        ))}
                      </div>
                    )}
                    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mien ? 'text-white/80' : 'text-legion-muted'}`}>
                      <span>{heure(m.created_at, langue)}</span>
                      {mien && <IconChecks size={13} />}
                    </div>
                  </div>
                  {reac && reac.size > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 px-1">
                      {[...reac.entries()].map(([emoji, x]) => (
                        <button key={emoji} type="button" onClick={() => onReagir(m.id, emoji)} title={x.qui.join(', ')}
                          className={`flex items-center gap-1 rounded-pill border px-1.5 py-0.5 text-[12px] transition ${x.moi ? 'border-legion-gold bg-legion-gold/15' : 'border-legion-line bg-legion-card'}`}>
                          <span>{emoji}</span><span className="text-[10px] font-semibold text-legion-muted">{x.n}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* La barre d'actions: au survol sur ordinateur, sur « ⋯ » sur téléphone */}
                <button type="button" onClick={() => setOuvert(ouverte ? null : m.id)} aria-label="…"
                  className={`mt-5 shrink-0 rounded-full p-1 text-legion-muted lg:hidden ${ouverte ? 'bg-legion-card' : ''}`}>
                  <IconDots size={14} />
                </button>
                <div className={`absolute -top-3 z-10 flex items-center gap-0.5 rounded-input border border-legion-line bg-legion-card p-1 shadow-lg transition ${mien ? 'left-2' : 'right-2'} ${ouverte ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'} ${ouverte ? '' : 'pointer-events-none lg:pointer-events-auto'}`}>
                  {RAPIDES.slice(0, 5).map((e) => (
                    <button key={e} type="button" onClick={() => { onReagir(m.id, e); setOuvert(null); }} className="p-0.5 text-[14px] transition hover:scale-125">{e}</button>
                  ))}
                  <button type="button" onClick={() => setPicker(picker === m.id ? null : m.id)} title={t('legion.autreEmoji', 'Un autre emoji')} className="rounded p-1 text-legion-muted hover:bg-legion-bg"><IconMoodSmile size={14} /></button>
                  <span className="mx-0.5 h-4 w-px bg-legion-line" />
                  <button type="button" onClick={() => { setReponseA(m); setOuvert(null); }} title={t('legion.repondre', 'Répondre')} className="rounded p-1 text-legion-muted hover:bg-legion-bg"><IconArrowBackUp size={14} /></button>
                  <button type="button" onClick={() => { onTacheDepuis(m); setOuvert(null); }} title={t('legion.enFaireUneTache', 'En faire une tâche')} className="rounded p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-gold"><IconPlus size={14} /></button>
                  <button type="button" onClick={() => copier(m)} title={t('legion.copier', 'Copier')} className="rounded p-1 text-legion-muted hover:bg-legion-bg">{copie === m.id ? <IconCheck size={14} className="text-legion-success" /> : <IconCopy size={14} />}</button>
                </div>
                {picker === m.id && (
                  <div className={`absolute top-6 z-20 ${mien ? 'left-2' : 'right-2'}`}>
                    <ChoixEmoji onChoisir={(e) => { onReagir(m.id, e); setPicker(null); setOuvert(null); }} onFermer={() => setPicker(null)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {tape && (
          <div className="flex items-start gap-2.5">
            <Visage a={tape} taille={32} point={false} />
            <div className="rounded-2xl rounded-tl-sm border border-legion-line bg-legion-card px-3.5 py-2.5 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-legion-gold"><span>{tape.nom}</span><span className="font-normal text-legion-muted">{t('legion.ecrit', 'écrit…')}</span></div>
              <div className="flex items-center gap-1.5 py-0.5">
                {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-legion-gold" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bas} />
      </div>

      <Composeur
        moi={moi} agents={agents} entrepriseId={entrepriseId} t={t}
        reponseA={reponseA} onAnnulerReponse={() => setReponseA(null)}
        picker={picker === 'saisie'} onPicker={(v) => setPicker(v ? 'saisie' : null)}
        brouillon={brouillon} onBrouillonPris={onBrouillonPris}
        onEnvoyer={async (x) => { await onEnvoyer({ ...x, meta: { ...(x.meta || {}), ...(reponseA ? { reponse_a: { id: reponseA.id, nom: agentDe(reponseA.auteur_id)?.nom || '?', texte: reponseA.texte.slice(0, 160) } } : {}) } }); setReponseA(null); }}
      />
    </div>
  );
}

function Jour({ label }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-pill border border-legion-line bg-legion-card px-3 py-0.5 text-[11px] font-medium text-legion-muted shadow-sm">{label}</span>
    </div>
  );
}

// La zone de saisie. Tout ce qui part passe par `onEnvoyer({texte, genre, meta})`.
function Composeur({ moi, agents, entrepriseId, t, reponseA, onAnnulerReponse, picker, onPicker, brouillon, onBrouillonPris, onEnvoyer }) {
  const [texte, setTexte] = useState('');
  const [genre, setGenre] = useState('info');
  const [envoi, setEnvoi] = useState(false);
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

  useEffect(() => {
    if (brouillon) { setTexte(brouillon); onBrouillonPris?.(); setTimeout(() => zone.current?.focus(), 50); }
  }, [brouillon, onBrouillonPris]);

  const machines = agents.filter((a) => !a.user_id);
  const candidats = machines.filter((a) => sansAccent(a.nom).includes(sansAccent(filtreMention))).slice(0, 8);

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); }
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

  return (
    <div className="shrink-0 border-t border-legion-line bg-legion-card p-2.5 sm:p-3">
      {reponseA && (
        <div className="mb-2 flex items-center justify-between rounded-input border-l-2 border-legion-gold bg-legion-bg px-2 py-1.5 text-[11px]">
          <div className="min-w-0"><span className="font-semibold text-legion-gold">{t('legion.reponseA', 'Réponse à')} {agents.find((a) => a.id === reponseA.auteur_id)?.nom}</span><p className="line-clamp-1 text-legion-muted">{reponseA.texte}</p></div>
          <button type="button" onClick={onAnnulerReponse} aria-label="✕" className="px-2 text-legion-muted"><IconX size={14} /></button>
        </div>
      )}
      <div className="mb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {GENRES.map((g) => (
          <button key={g.cle} type="button" onClick={() => setGenre(g.cle)}
            className={`flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[12px] font-semibold transition ${genre === g.cle ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted hover:text-legion-ink'}`}
            title={g.sonne ? t('legion.sonne', 'Fait sonner le téléphone') : ''}>
            {g.emoji} {t(`legion.genre.${g.cle}`)}
          </button>
        ))}
      </div>

      {mentions && candidats.length > 0 && (
        <div className="absolute bottom-28 left-3 right-3 z-30 max-h-56 max-w-sm overflow-y-auto rounded-card border border-legion-line bg-legion-card p-1.5 shadow-2xl">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.mentionner', 'Nommer quelqu’un')}</p>
          {candidats.map((a) => (
            <button key={a.id} type="button" onClick={() => mentionner(a)} className="flex w-full items-center gap-2.5 rounded-input p-1.5 text-left hover:bg-legion-bg">
              <Visage a={a} taille={24} point={false} />
              <span className="min-w-0 flex-1"><span className="block truncate text-caption font-semibold text-legion-ink">@{a.nom}</span><span className="block truncate text-[10px] text-legion-muted">{a.poste}</span></span>
              <span className={`h-2 w-2 rounded-full ${a.actif ? 'bg-legion-success' : 'bg-legion-line'}`} />
            </button>
          ))}
        </div>
      )}

      {picker && (
        <div className="absolute bottom-28 left-3 z-30">
          <ChoixEmoji onChoisir={(e) => { setTexte((v) => v + e); zone.current?.focus(); }} onFermer={() => onPicker(false)} />
        </div>
      )}

      <form onSubmit={envoyer} className="flex items-end gap-1.5 sm:gap-2">
        <div className="flex items-center pb-1">
          <button type="button" onClick={() => onPicker(!picker)} title={t('legion.emoji', 'Emoji')} className={`rounded-input p-2 transition hover:bg-legion-bg ${picker ? 'text-legion-gold' : 'text-legion-muted hover:text-legion-ink'}`}><IconMoodSmile size={20} /></button>
          <button type="button" onClick={() => { setTexte((v) => `${v}@`); setMentions(true); setFiltreMention(''); zone.current?.focus(); }} title="@" className="rounded-input p-2 text-legion-muted transition hover:bg-legion-bg hover:text-legion-gold"><IconAt size={20} /></button>
          <button type="button" onClick={() => fichier.current?.click()} disabled={!!depot} title={t('legion.photo', 'Photo')} className="rounded-input p-2 text-legion-muted transition hover:bg-legion-bg hover:text-legion-ink disabled:opacity-40"><IconPhoto size={20} /></button>
          <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={photoChoisie} />
        </div>
        <div className="flex-1 rounded-card border border-legion-line bg-legion-bg px-3 py-2 transition focus-within:border-legion-gold">
          <textarea
            ref={zone} rows={1} value={texte} onChange={changer} onKeyDown={toucheClavier}
            placeholder={enregistre ? `🔴 ${t('legion.enregistrement', 'Enregistrement')} ${secondes}s` : depot ? t('legion.envoiEnCours', 'Envoi…') : t('legion.ecrireIci', 'Écris, ou nomme quelqu’un avec @')}
            className="max-h-[140px] w-full resize-none bg-transparent text-[14px] text-legion-ink outline-none placeholder:text-legion-muted"
            aria-label={t('equipe.ecrire')}
          />
        </div>
        <button type="button" onClick={micro} disabled={!!depot} title={enregistre ? t('legion.arreter', 'Arrêter') : t('legion.vocal', 'Message vocal')}
          className={`rounded-card border p-2.5 transition ${enregistre ? 'animate-pulse border-legion-danger bg-legion-danger text-white' : 'border-legion-line bg-legion-bg text-legion-muted hover:text-legion-ink'} disabled:opacity-40`}>
          {enregistre ? <IconPlayerStopFilled size={18} /> : <IconMicrophone size={18} />}
        </button>
        <button type="submit" disabled={envoi || texte.trim() === '' || !moi} aria-label={t('equipe.envoyer')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-legion-gold text-legion-bg shadow-md transition hover:brightness-105 disabled:bg-legion-line disabled:text-legion-muted disabled:shadow-none">
          <IconSend size={18} />
        </button>
      </form>
    </div>
  );
}
