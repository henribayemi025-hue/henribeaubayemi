import { useEffect, useRef, useState } from 'react';
import { IconPlayerStopFilled, IconX } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { blobToWavDataUrl } from '../../../lib/audioWav';

// JARVIS V0 — la télécommande vocale de Léo (Beau, 24/09 : « on réveille
// Jarvis d'un geste, puis on lui parle : ouvre les dépôts, je veux parler à
// Alpha, Alpha mon rapport » ; 25/09 : « fais »). À l'écran, il s'appelle
// Léo (« Jarvis » est un personnage de fiction : nom de projet seulement).
//
// Réveil : le bouton, ou la barre d'espace maintenue (hors d'un champ de
// saisie). Le micro ne s'ouvre qu'après ce geste, un voyant le montre, et il
// se coupe tout seul après un silence. L'audio part à legion-jarvis pour être
// transcrit, puis il n'est gardé nulle part. Ce qui ouvre une vue ou une
// conversation se fait tout de suite ; créer une tâche ou poser une question
// à l'équipe se confirme à l'écran ; envoyer hors de Léo, payer, supprimer ne
// se fait jamais à la voix.

const SILENCE_MS = 1300;
const MAX_MS = 20_000;
const SEUIL = 0.02;
const CLE_ACCORD = 'leo:voix-accord';

function lire(cle) { try { return localStorage.getItem(cle); } catch { return null; } }
function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* sans stockage, on redemandera */ } }

export function parlerHaut(texte, langue) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const phrase = String(texte || '').replace(/[*_`#>]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 600);
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined' || !phrase) return;
  const u = new SpeechSynthesisUtterance(phrase);
  const code = langue === 'en' ? 'en' : 'fr';
  const voix = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith(code));
  if (voix.length) u.voice = voix.find((v) => /female|femme|amelie|audrey|marie|google/i.test(v.name)) || voix[0];
  u.lang = code === 'en' ? 'en-US' : 'fr-FR';
  u.rate = 1.04;
  try { synth.cancel(); synth.speak(u); } catch { /* sans voix, le texte reste affiché */ }
}

export function Jarvis({ entrepriseId, langue, t, onAction, enConversation = false }) {
  const [etat, setEtat] = useState('repos'); // repos | accord | ecoute | comprend | confirme | reponse | erreur
  const [bulle, setBulle] = useState(null); // { dit, reponse }
  const [attente, setAttente] = useState(null); // intention à confirmer
  const [niveau, setNiveau] = useState(0);
  const rec = useRef(null);
  const flux = useRef(null);
  const ctx = useRef(null);
  const morceaux = useRef([]);
  const minuteur = useRef(null);
  const espace = useRef(false);

  useEffect(() => () => couper(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // La barre d'espace maintenue, hors d'un champ de saisie.
  useEffect(() => {
    const dansUnChamp = (e) => { const x = e.target; return x && (x.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(x.tagName)); };
    const bas = (e) => {
      if (e.code !== 'Space' || e.repeat || dansUnChamp(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      espace.current = true;
      reveiller();
    };
    const haut = (e) => { if (e.code === 'Space' && espace.current) { espace.current = false; arreterEcoute(); } };
    window.addEventListener('keydown', bas);
    window.addEventListener('keyup', haut);
    return () => { window.removeEventListener('keydown', bas); window.removeEventListener('keyup', haut); };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function couper() {
    clearInterval(minuteur.current);
    try { if (rec.current?.state === 'recording') rec.current.stop(); } catch { /* rien */ }
    flux.current?.getTracks().forEach((p) => p.stop());
    flux.current = null;
    ctx.current?.close?.().catch?.(() => {});
    ctx.current = null;
    setNiveau(0);
  }

  function reveiller() {
    if (etat === 'ecoute') { arreterEcoute(); return; }
    if (lire(CLE_ACCORD) !== 'oui') { setEtat('accord'); return; }
    ecouter();
  }

  async function ecouter() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setBulle({ dit: '', reponse: t('legion.jarvis.pasDeMicro') }); setEtat('erreur'); return;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
    setAttente(null);
    try {
      const f = await navigator.mediaDevices.getUserMedia({ audio: true });
      flux.current = f;
      const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
      const r = new MediaRecorder(f, type ? { mimeType: type } : undefined);
      morceaux.current = [];
      r.ondataavailable = (ev) => { if (ev.data.size) morceaux.current.push(ev.data); };
      r.onstop = () => comprendre(new Blob(morceaux.current, { type: r.mimeType || 'audio/webm' }));
      rec.current = r;
      r.start(250);
      setEtat('ecoute');
      setBulle({ dit: '', reponse: t('legion.jarvis.ecoute') });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const debut = Date.now();
      let aParle = false; let dernierSon = Date.now();
      if (Ctx) {
        const c = new Ctx(); ctx.current = c;
        const an = c.createAnalyser(); an.fftSize = 1024;
        c.createMediaStreamSource(f).connect(an);
        const buf = new Float32Array(an.fftSize);
        minuteur.current = setInterval(() => {
          an.getFloatTimeDomainData(buf);
          let s = 0; for (const x of buf) s += x * x;
          const rms = Math.sqrt(s / buf.length);
          setNiveau(Math.min(1, rms * 12));
          if (rms > SEUIL) { aParle = true; dernierSon = Date.now(); }
          // La barre d'espace tenue : c'est elle qui décide de la fin.
          if (!espace.current && ((aParle && Date.now() - dernierSon > SILENCE_MS) || Date.now() - debut > MAX_MS)) arreterEcoute();
        }, 120);
      }
    } catch (e) {
      setBulle({ dit: '', reponse: e.message || t('legion.jarvis.pasDeMicro') }); setEtat('erreur');
    }
  }

  function arreterEcoute() { couper(); }

  async function comprendre(blob) {
    if (blob.size < 1500) { setEtat('repos'); setBulle(null); return; }
    setEtat('comprend');
    setBulle({ dit: '…', reponse: t('legion.jarvis.comprend') });
    try {
      let donnees; let mime = blob.type || 'audio/webm';
      try { donnees = (await blobToWavDataUrl(blob)).split(',')[1]; mime = 'audio/wav'; } catch {
        donnees = await new Promise((ok, ko) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = ko; fr.readAsDataURL(blob); });
      }
      const { data: r, error } = await supabase.functions.invoke('legion-jarvis', { body: { entreprise_id: entrepriseId, audio: donnees, mime, langue } });
      if (error) throw error;
      if (r?.erreur && !r?.intention) throw new Error(r.erreur);
      setBulle({ dit: r.transcription || '', reponse: r.reponse });
      if (['creer_tache', 'question'].includes(r.intention)) {
        setAttente(r); setEtat('confirme'); parlerHaut(r.reponse, langue); return;
      }
      setEtat('reponse');
      parlerHaut(r.reponse, langue);
      if (['ouvrir_vue', 'parler_a', 'demander_rapport'].includes(r.intention)) {
        const suite = await onAction(r);
        if (suite) { setBulle({ dit: r.transcription || '', reponse: suite }); parlerHaut(suite, langue); }
      }
    } catch (e) {
      setBulle({ dit: '', reponse: e.message || t('legion.jarvis.erreur') }); setEtat('erreur');
    }
  }

  async function confirmer(oui) {
    const r = attente;
    setAttente(null);
    if (!oui || !r) { setEtat('repos'); setBulle(null); return; }
    setEtat('reponse');
    const suite = await onAction({ ...r, confirme: true });
    const dit = suite || t('legion.jarvis.fait');
    setBulle({ dit: r.transcription || '', reponse: dit });
    parlerHaut(dit, langue);
  }

  const visible = etat !== 'repos';
  return (
    <>
      {visible && (
        <div role="status" aria-live="polite" className={`fixed right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-card border border-legion-line bg-legion-card p-3 text-[13px] shadow-xl ${enConversation ? 'top-[10.5rem] lg:right-auto lg:left-1/2 lg:top-[3.9rem] lg:-translate-x-1/2' : 'bottom-[calc(env(safe-area-inset-bottom)+9.25rem)] lg:bottom-24'}`}>
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 font-semibold text-legion-gold">Léo</p>
            <button type="button" onClick={() => { couper(); setEtat('repos'); setBulle(null); setAttente(null); try { window.speechSynthesis?.cancel(); } catch { /* rien */ } }} aria-label={t('common.close', 'Fermer')} className="text-legion-muted hover:text-legion-ink"><IconX size={15} /></button>
          </div>
          {etat === 'accord' ? (
            <div className="mt-1 space-y-2 text-legion-ink">
              <p>{t('legion.jarvis.accord')}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { ecrire(CLE_ACCORD, 'oui'); ecouter(); }} className="rounded-pill bg-legion-gold px-3 py-1 font-semibold text-legion-bg">{t('legion.jarvis.accepter')}</button>
                <button type="button" onClick={() => setEtat('repos')} className="rounded-pill px-3 py-1 text-legion-muted">{t('common.cancel', 'Annuler')}</button>
              </div>
            </div>
          ) : (
            <div className="mt-1 space-y-1">
              {bulle?.dit && <p className="text-legion-muted">« {bulle.dit} »</p>}
              {bulle?.reponse && <p className="text-legion-ink">{bulle.reponse}</p>}
              {etat === 'ecoute' && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-legion-bg" aria-hidden>
                  <div className="h-full rounded-full bg-legion-gold transition-all" style={{ width: `${Math.max(6, niveau * 100)}%` }} />
                </div>
              )}
              {etat === 'confirme' && attente && (
                <div className="mt-2 rounded-input border border-legion-gold/40 bg-legion-bg p-2">
                  <p className="text-[12px] text-legion-muted">{attente.intention === 'creer_tache' ? t('legion.jarvis.tachePour', { nom: attente.agent || t('legion.personneEncore', 'Personne encore (libre)') }) : t('legion.jarvis.questionEquipe')}</p>
                  <p className="font-semibold text-legion-ink">{attente.texte}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => confirmer(true)} className="rounded-pill bg-legion-gold px-3 py-1 font-semibold text-legion-bg">{t('legion.jarvis.oui')}</button>
                    <button type="button" onClick={() => confirmer(false)} className="rounded-pill px-3 py-1 text-legion-muted">{t('legion.jarvis.non')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Beau, 25/09 : « je vois deux icônes d'audio, je ne comprends pas » — le micro du message vocal et
          celui de Jarvis se superposaient au-dessus de la zone de saisie. Jarvis n'est plus un micro : c'est
          le lion de Léo, nommé, et dans un salon il se range en haut à droite, loin du micro du message. */}
      <button type="button" onClick={reveiller} title={t('legion.jarvis.bouton')} aria-label={t('legion.jarvis.bouton')} aria-pressed={etat === 'ecoute'}
        className={`group fixed right-4 z-40 flex items-center gap-2 rounded-full p-1 pr-1 shadow-xl transition sm:pr-3.5 ${enConversation ? 'top-[6.5rem] lg:right-auto lg:left-1/2 lg:top-[0.45rem] lg:-translate-x-1/2' : 'bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:bottom-6'} ${etat === 'ecoute' ? 'bg-legion-danger text-white ring-4 ring-legion-danger/30' : 'bg-legion-panel text-legion-ink ring-1 ring-legion-gold/50 hover:ring-legion-gold'}`}>
        <span className={`relative flex ${enConversation ? 'h-9 w-9' : 'h-12 w-12'} items-center justify-center overflow-hidden rounded-full bg-legion-bg`}>
          {etat === 'ecoute' ? <IconPlayerStopFilled size={20} /> : <img src="/logos/leo.png" alt="" className="h-full w-full object-cover transition group-hover:scale-110" />}
          {etat === 'ecoute' && <span className="absolute inset-0 animate-ping rounded-full bg-white/20" aria-hidden />}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[12px] font-bold">Jarvis</span>
          <span className="block text-[10px] text-legion-muted group-aria-pressed:text-white/80">{etat === 'ecoute' ? t('legion.jarvis.ecoute', 'Je t’écoute…') : t('legion.jarvis.parler', 'Parle à Léo')}</span>
        </span>
      </button>
    </>
  );
}
