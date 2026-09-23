import { useEffect, useRef, useState } from 'react';
import { IconMicrophone, IconPhoneOff, IconPlayerStopFilled, IconVolume } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { blobToWavDataUrl } from '../../../lib/audioWav';
import { Visage } from './Visage';

// APPELER UN AGENT (23/09).
//
// Beau, dans sa conversation avec Gemini : « s'ils ne comprennent pas, ils
// m'appellent, on parle ». Et le 23/09 : « continue avec appeler les agents ».
//
// Un appel, ici, c'est une conversation à la voix dans le salon privé avec
// l'agent : on parle, il entend (le vocal est transcrit côté serveur), il
// répond COMME AU TÉLÉPHONE (court, sans titres ni listes), sa réponse est
// lue à voix haute par le téléphone, puis il réécoute. Tout reste écrit dans
// le salon : le vocal, sa transcription, la réponse.
//
// Ce que ce n'est pas : un appel sur le réseau téléphonique. La voix de
// l'agent est celle du téléphone (synthèse vocale du navigateur, gratuite) ;
// une vraie voix et un vrai numéro demanderaient un service payant.
//
// L'écoute s'arrête d'elle-même après un silence d'une seconde et demie
// (une fois qu'on a parlé), ou au toucher, ou au bout d'une minute.

const SILENCE_MS = 1500;
const MAX_MS = 60_000;
const SEUIL = 0.02; // niveau sonore au-dessus duquel on considère qu'on parle

// Ce qui se lit mal à voix haute : titres, puces, gras, liens.
function pourLaVoix(t) {
  return String(t || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export function Appel({ agent, salon, moi, entrepriseId, langue, t, onMessages, onRaccrocher }) {
  const [etat, setEtat] = useState('pret'); // pret | ecoute | envoi | reflechit | parle | erreur
  const [dernier, setDernier] = useState(''); // ce que l'agent vient de dire
  const [erreur, setErreur] = useState('');
  const [niveau, setNiveau] = useState(0);
  const actif = useRef(true);
  const rec = useRef(null);
  const flux = useRef(null);
  const ctx = useRef(null);
  const morceaux = useRef([]);
  const minuteur = useRef(null);

  useEffect(() => () => { actif.current = false; arreterTout(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function arreterTout() {
    try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
    try { if (rec.current?.state === 'recording') rec.current.stop(); } catch { /* rien */ }
    flux.current?.getTracks().forEach((p) => p.stop());
    flux.current = null;
    ctx.current?.close?.().catch?.(() => {});
    ctx.current = null;
    clearInterval(minuteur.current);
  }

  function raccrocher() {
    actif.current = false;
    arreterTout();
    onRaccrocher();
  }

  async function ecouter() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErreur(t('legion.appel.pasDeMicro')); setEtat('erreur'); return;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
    setErreur('');
    try {
      const f = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!actif.current) { f.getTracks().forEach((p) => p.stop()); return; }
      flux.current = f;
      const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
      const r = new MediaRecorder(f, type ? { mimeType: type } : undefined);
      morceaux.current = [];
      r.ondataavailable = (ev) => { if (ev.data.size) morceaux.current.push(ev.data); };
      r.onstop = () => envoyer(new Blob(morceaux.current, { type: r.mimeType || 'audio/webm' }));
      rec.current = r;
      r.start(250);
      setEtat('ecoute');

      // Le silence après avoir parlé arrête l'écoute tout seul.
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const debut = Date.now();
      let aParle = false;
      let dernierSon = Date.now();
      if (Ctx) {
        const c = new Ctx();
        ctx.current = c;
        const an = c.createAnalyser();
        an.fftSize = 1024;
        c.createMediaStreamSource(f).connect(an);
        const buf = new Float32Array(an.fftSize);
        minuteur.current = setInterval(() => {
          an.getFloatTimeDomainData(buf);
          let s = 0; for (const x of buf) s += x * x;
          const rms = Math.sqrt(s / buf.length);
          setNiveau(Math.min(1, rms * 12));
          if (rms > SEUIL) { aParle = true; dernierSon = Date.now(); }
          if ((aParle && Date.now() - dernierSon > SILENCE_MS) || Date.now() - debut > MAX_MS) stopEcoute();
        }, 120);
      } else {
        minuteur.current = setInterval(() => { if (Date.now() - debut > MAX_MS) stopEcoute(); }, 500);
      }
    } catch (e) {
      setErreur(e.message || t('legion.appel.pasDeMicro')); setEtat('erreur');
    }
  }

  function stopEcoute() {
    clearInterval(minuteur.current);
    setNiveau(0);
    try { if (rec.current?.state === 'recording') rec.current.stop(); } catch { /* rien */ }
    flux.current?.getTracks().forEach((p) => p.stop());
    flux.current = null;
    ctx.current?.close?.().catch?.(() => {});
    ctx.current = null;
  }

  async function envoyer(blob) {
    if (!actif.current) return;
    if (blob.size < 1500) { setEtat('pret'); return; } // un toucher sans parler
    setEtat('envoi');
    try {
      // En WAV 16 kHz mono, comme les vocaux du salon (le format que le
      // modèle comprend à coup sûr).
      let fichier = blob; let ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm'; let mime = blob.type || 'audio/webm';
      try { const d = await blobToWavDataUrl(blob); fichier = await (await fetch(d)).blob(); ext = 'wav'; mime = 'audio/wav'; } catch { /* l'original */ }
      const chemin = `${entrepriseId}/${crypto.randomUUID()}.${ext}`;
      const { error: eUp } = await supabase.storage.from('legion').upload(chemin, fichier, { contentType: mime, upsert: false });
      if (eUp) throw eUp;
      const url = supabase.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
      const { data: ligne, error: eIns } = await supabase.from('legion_messages').insert({
        entreprise_id: entrepriseId, canal_id: salon.id, auteur_id: moi.id, user_id: moi.user_id, texte: '🎤', genre: 'info',
        meta: { pieces: [{ type: 'audio', url }], appel: true },
      }).select().single();
      if (eIns) throw eIns;
      onMessages([ligne]);
      if (!actif.current) return;
      setEtat('reflechit');
      const { data: r, error: e2 } = await supabase.functions.invoke('legion-repondre', { body: { message_id: ligne.id } });
      if (e2) throw e2;
      const arrives = (r?.messages || []).filter(Boolean);
      if (arrives.length) onMessages(arrives);
      if (!actif.current) return;
      const reponse = arrives.find((m) => m.auteur_id === agent.id && m.genre !== 'tache');
      if (!reponse) { setErreur(r?.erreur || t('legion.appel.pasDeReponse')); setEtat('erreur'); return; }
      setDernier(reponse.texte);
      parler(reponse.texte);
    } catch (e) {
      setErreur(e.message || t('errors.generic')); setEtat('erreur');
    }
  }

  // La réponse lue à voix haute, puis on réécoute — comme au téléphone.
  function parler(texte) {
    const synth = window.speechSynthesis;
    const phrase = pourLaVoix(texte);
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined' || !phrase) { setEtat('pret'); return; }
    const u = new SpeechSynthesisUtterance(phrase);
    const code = langue === 'en' ? 'en' : 'fr';
    const voix = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith(code));
    if (voix.length) u.voice = voix.find((v) => /female|femme|amelie|audrey|marie|google/i.test(v.name)) || voix[0];
    u.lang = code === 'en' ? 'en-US' : 'fr-FR';
    u.rate = 1.02;
    let fini = false;
    const suite = () => { if (fini) return; fini = true; if (actif.current) ecouter(); };
    u.onend = suite;
    u.onerror = () => { if (!fini) { fini = true; if (actif.current) setEtat('pret'); } };
    setEtat('parle');
    try { synth.cancel(); synth.speak(u); } catch { setEtat('pret'); return; }
    // Filet: certains navigateurs n'annoncent jamais la fin de la lecture.
    setTimeout(() => { if (!fini && actif.current && !synth.speaking) suite(); }, Math.min(90_000, 4000 + phrase.length * 90));
  }

  function toucher() {
    if (etat === 'ecoute') stopEcoute();
    else if (etat === 'parle') { try { window.speechSynthesis?.cancel(); } catch { /* rien */ } ecouter(); }
    else if (etat === 'pret' || etat === 'erreur') ecouter();
  }

  const libelle = {
    pret: t('legion.appel.toucherPourParler'),
    ecoute: t('legion.appel.ecoute'),
    envoi: t('legion.appel.envoi'),
    reflechit: t('legion.appel.reflechit', { nom: agent.nom }),
    parle: t('legion.appel.parle', { nom: agent.nom }),
    erreur: erreur || t('errors.generic'),
  }[etat];
  const occupe = etat === 'envoi' || etat === 'reflechit';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-legion-bg/95 px-6 pb-10 pt-16 backdrop-blur" role="dialog" aria-label={t('legion.appel.titre', { nom: agent.nom })}
      style={{ paddingTop: 'max(4rem, env(safe-area-inset-top))', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}>
      <div className="flex flex-col items-center text-center">
        <div className={`rounded-full p-1.5 transition ${etat === 'parle' ? 'bg-legion-gold/30 animate-pulse' : etat === 'ecoute' ? 'bg-legion-success/20' : 'bg-transparent'}`}>
          <Visage a={agent} taille={132} point={false} />
        </div>
        <h2 className="mt-4 text-[24px] font-semibold text-legion-ink">{agent.nom}</h2>
        <p className="text-[14px] text-legion-muted">{agent.poste}</p>
        <p className={`mt-6 min-h-[1.5rem] text-[16px] ${etat === 'erreur' ? 'text-legion-danger' : 'text-legion-ink'}`} aria-live="polite">{libelle}</p>
        {etat === 'ecoute' && (
          <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-legion-line" aria-hidden="true">
            <div className="h-full rounded-full bg-legion-success transition-[width] duration-100" style={{ width: `${Math.round(niveau * 100)}%` }} />
          </div>
        )}
        {dernier && etat !== 'ecoute' && (
          <p className="mt-5 max-h-40 max-w-md overflow-y-auto text-[14px] leading-snug text-legion-muted">
            <IconVolume size={14} className="mr-1 inline" />{pourLaVoix(dernier)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-10">
        <button type="button" onClick={toucher} disabled={occupe} aria-label={libelle}
          className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition disabled:opacity-50 ${etat === 'ecoute' ? 'bg-legion-success' : 'bg-legion-accent'}`}>
          {etat === 'ecoute' ? <IconPlayerStopFilled size={30} /> : <IconMicrophone size={32} />}
        </button>
        <button type="button" onClick={raccrocher} aria-label={t('legion.appel.raccrocher')}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-legion-danger text-white shadow-xl">
          <IconPhoneOff size={32} />
        </button>
      </div>
    </div>
  );
}
