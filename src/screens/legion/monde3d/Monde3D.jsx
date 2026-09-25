import { useEffect, useMemo, useRef, useState } from 'react';
import { quiOuEst, repondre, CORPS, RECEPTIONNISTE } from './monde';
import { chargerCiel, phaseDuJour, villeChoisie } from '../parties/ciel';
import { styleVille } from './region';
import { estSalleDeMarche, pairesDuJour, activite14j } from './salle-marche3d';
import { supabase, storageUrl, storageThumbUrl } from '../../../lib/supabase';
import { chargerAffiches } from './affiches';

// LE MONDE 3D DE LÉO (Beau, 25/09) — l'écran : le moteur three.js (chargé à
// la demande), et par-dessus : où je suis, l'ascenseur, les caméras, la carte
// de ce qui est à portée, la réceptionniste, le joystick au téléphone.
// Tout ce qui s'y passe vient des vraies données (monde.js).

const STYLE = `.monde-etiquette{display:flex;align-items:center;gap:6px;padding:3px 9px 3px 3px;border-radius:999px;background:rgba(11,17,32,.8);color:#edf1f8;font:12px system-ui;white-space:nowrap;transform:translateY(-6px)}
.monde-etiquette img{width:24px;height:24px;border-radius:50%;object-fit:cover}.monde-etiquette b{display:block;font-weight:700;line-height:1.1}.monde-etiquette i{display:block;font-style:normal;color:#e3a857;font-size:10.5px;max-width:190px;overflow:hidden;text-overflow:ellipsis}`;
const LIEUX = ['hall', 'reunion', 'atelier'];
const nomsDepts = (departements, agents) => {
  const n = (departements || []).map((d) => d.nom).filter(Boolean);
  if (n.length) return n;
  return [...new Set((agents || []).filter((a) => !a.user_id && a.departement).map((a) => a.departement))];
};
const JOUR = 86_400_000;

function lire(cle, defaut) { try { return localStorage.getItem(cle) || defaut; } catch { return defaut; } }
function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* navigation privée */ } }

export default function Monde3D({ entreprise, agents, departements = [], messages, taches, onFiche, onParler, onAppeler, onConvoquer, t }) {
  const boite = useRef(null);
  const monde = useRef(null);
  const [etat, setEtat] = useState('chargement'); // chargement | pret | erreur
  const [progres, setProgres] = useState(null);
  const [essai, setEssai] = useState(0);
  const [lieu, setLieu] = useState('hall');
  const [camera, setCamera] = useState('tps');
  const [proche, setProche] = useState(null);
  const [dialogue, setDialogue] = useState(null); // { lignes: [{qui, texte}], aller }
  const [question, setQuestion] = useState('');
  const [etage, setEtage] = useState(false);
  const [choixAvatar, setChoixAvatar] = useState(false);
  const [renfort, setRenfort] = useState(false); // faire venir un agent
  const [convoc, setConvoc] = useState(null); // { sujet, ids }
  const [avatar, setAvatar] = useState(() => lire('leo:avatar', 'Male_Adult_07'));
  const [maintenant, setMaintenant] = useState(Date.now());
  // La cinématique d'arrivée (vidéo tournée pour Léo) : une fois, puis « Revoir l'intro ».
  const [intro, setIntro] = useState(() => !lire('leo:intro-vue', ''));
  const [introFin, setIntroFin] = useState(false);
  const video = useRef(null);
  function finirIntro() { ecrire('leo:intro-vue', '1'); setIntro(false); setIntroFin(false); }
  useEffect(() => {
    const v = video.current;
    if (!intro || !v) return;
    v.currentTime = 0;
    v.muted = false;
    // Sans geste récent, le navigateur refuse le son : on relance sans le son.
    v.play().catch(() => { v.muted = true; v.play().catch(finirIntro); });
  }, [intro]); // eslint-disable-line react-hooks/exhaustive-deps
  const salleMarche = useMemo(() => estSalleDeMarche(entreprise), [entreprise]);
  const libelle = (l) => t(`legion.monde.lieu.${l === 'atelier' && salleMarche ? 'salleMarche' : l}`);
  useEffect(() => { if (salleMarche) monde.current?.majMarche({ jours: activite14j(taches), maintenant }); }, [salleMarche, taches, maintenant]);
  const [jeu, setJeu] = useState(false); // plein écran, téléphone à l'horizontale
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  useEffect(() => { const f = () => { setPortrait(window.innerHeight > window.innerWidth); setTimeout(() => monde.current?.redimensionner(), 120); }; window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  async function modeJeu(oui) {
    setJeu(oui);
    try {
      if (oui) { await document.documentElement.requestFullscreen?.(); await screen.orientation?.lock?.('landscape'); }
      else { screen.orientation?.unlock?.(); if (document.fullscreenElement) await document.exitFullscreen(); }
    } catch { /* iPhone : pas de verrouillage, on demande de tourner le téléphone */ }
    setTimeout(() => monde.current?.redimensionner(), 200);
  }
  const langue = t('legion.ciel.langue', 'fr');
  const mobile = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 700);

  useEffect(() => { const i = setInterval(() => setMaintenant(Date.now()), 30_000); return () => clearInterval(i); }, []);
  const ou = useMemo(() => quiOuEst({ agents, messages, taches, maintenant }), [agents, messages, taches, maintenant]);
  const faits = useMemo(() => {
    const debut = new Date(); debut.setHours(0, 0, 0, 0);
    const rendues = taches.filter((x) => { const d = Date.parse(x.meta?.livre_le || x.termine_le || ''); return d >= debut.getTime() && d < debut.getTime() + JOUR; }).length;
    const noms = ou.auBureau.map((b) => agents.find((a) => a.id === b.id)?.nom).filter(Boolean);
    return {
      titre: t('legion.monde.faitsTitre', { nom: entreprise.nom }),
      lignes: [
        t('legion.monde.faitsRendues', { n: rendues }),
        ou.reunion ? t('legion.monde.faitsReunion', { sujet: ou.reunion.sujet.slice(0, 40) }) : t('legion.monde.faitsSansReunion'),
        noms.length ? t('legion.monde.faitsTravail', { noms: noms.slice(0, 4).join(', ') }) : t('legion.monde.faitsPersonne'),
      ],
    };
  }, [taches, ou, agents, entreprise.nom, t]);

  // Le moteur, chargé seulement quand on ouvre le monde.
  useEffect(() => {
    let fini = false;
    if (!document.getElementById('monde-style')) { const s = document.createElement('style'); s.id = 'monde-style'; s.textContent = STYLE; document.head.appendChild(s); }
    (async () => {
      try {
        // Au-delà de 60 s, on n'attend plus en silence.
        const delai = setTimeout(() => { if (!fini) setEtat((x) => (x === 'chargement' ? 'erreur' : x)); }, 60000);
        const { Monde } = await import('./moteur');
        if (fini) { clearTimeout(delai); return; }
        // La ville ressemble à celle de la personne : ville choisie dans la Ville, sinon fuseau horaire.
        const tz = villeChoisie()?.tz || (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
        const m = new Monde(boite.current, {
          mobile, langue, region: styleVille(tz), salleMarche,
          surEvenement: (e) => {
            if (e.type === 'lieu') setLieu(e.lieu);
            if (e.type === 'progression') setProgres(e.total ? Math.round((e.faits / e.total) * 100) : null);
            if (e.type === 'perdu') setEtat('erreur');
            if (e.type === 'camera') setCamera(e.mode);
            if (e.type === 'proximite') setProche(e.cible);
            if (e.type === 'interagir') interagirRef.current?.(e.cible);
          },
        });
        monde.current = m;
        m.reglerCiel({ phase: phaseDuJour(Date.now()), genre: 'clair' });
        // La météo arrive quand elle arrive : on n'attend pas le réseau pour ouvrir le monde.
        chargerCiel({ langue }).then((c) => { if (c && !fini) m.reglerCiel({ phase: phaseDuJour(Date.now(), c.lever, c.coucher), genre: c.genre || 'clair' }); }).catch(() => {});
        m.majDonnees({ agents, ou, faits, departements: nomsDepts(departements, agents) });
        // Salle des marchés : les taux du jour (même table que les prix de Finjaro).
        if (salleMarche) {
          supabase.from('taux_du_jour').select('code, par_euro').then(({ data }) => {
            if (fini || !data?.length) return;
            m.majMarche({ paires: pairesDuJour(Object.fromEntries(data.map((x) => [x.code, Number(x.par_euro)]))) });
          });
          m.majMarche({ jours: activite14j(taches), maintenant: Date.now() });
        }
        // Les affiches des vraies boutiques Finjaro, sans retarder l'ouverture.
        chargerAffiches(supabase, (seau, chemin, vignette) => (vignette ? storageThumbUrl : storageUrl)(seau, chemin)).then((l) => { if (!fini && l.length) m.afficherBoutiques(l); }).catch(() => {});
        await m.allerA('hall', { nomEntreprise: entreprise.nom, avatar });
        if (fini) { m.detruire(); return; }
        m.demarrer();
        clearTimeout(delai);
        setEtat('pret');
      } catch (err) {
        console.error(err);
        if (!fini) setEtat('erreur');
      }
    })();
    return () => { fini = true; monde.current?.detruire(); monde.current = null; };
  }, [entreprise.id, essai]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { monde.current?.majDonnees({ agents, ou, faits, departements: nomsDepts(departements, agents) }); }, [agents, ou, faits, departements]);

  const interagirRef = useRef(null);
  interagirRef.current = (c) => interagir(c);
  function interagir(cible) {
    if (!cible) return;
    if (cible.type === 'receptionniste') {
      const r = repondre('', { agents, ou, nomEntreprise: entreprise.nom }, langue);
      setDialogue({ lignes: [{ qui: 'elle', texte: r.texte }] });
      parler(r.texte);
    } else if (cible.type === 'ascenseur' || cible.type === 'escalier') setEtage(true);
    else if (cible.type === 'agent') onFiche?.(agents.find((a) => a.id === cible.id));
  }
  // La voix de la réceptionniste : Fish Audio (legion-voix) ; si Fish ne répond
  // pas, la voix du navigateur, pour qu'elle ne reste jamais muette.
  const son = useRef(null);
  async function parler(texte) {
    try { speechSynthesis.cancel(); } catch { /* rien */ }
    son.current?.pause();
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://bokwivwizghdlaedczbw.supabase.co'}/functions/v1/legion-voix`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sess?.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt', 'Content-Type': 'application/json' },
        body: JSON.stringify({ entreprise_id: entreprise.id, texte, langue }),
      });
      if (!r.ok || !String(r.headers.get('content-type')).includes('audio')) throw new Error(String(r.status));
      const url = URL.createObjectURL(await r.blob());
      const a = new Audio(url);
      son.current = a;
      a.onended = () => URL.revokeObjectURL(url);
      await a.play();
      return;
    } catch { /* on se rabat sur la voix du navigateur */ }
    try {
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = langue === 'en' ? 'en-US' : 'fr-FR';
      const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)) && /female|femme|amelie|audrey|marie|samantha|google/i.test(v.name));
      if (voix) u.voice = voix;
      speechSynthesis.speak(u);
    } catch { /* pas de voix sur ce navigateur */ }
  }
  function demander(q) {
    const texte = String(q || question).trim();
    if (!texte) return;
    const r = repondre(texte, { agents, ou, nomEntreprise: entreprise.nom }, langue);
    setDialogue((d) => ({ lignes: [...(d?.lignes || []), { qui: 'moi', texte }, { qui: 'elle', texte: r.texte }].slice(-6), aller: r.aller }));
    setQuestion('');
    parler(r.texte);
  }
  async function aller(l) {
    setEtage(false); setDialogue(null);
    if (!monde.current || l === lieu) return;
    setEtat('chargement');
    await monde.current.allerA(l, { nomEntreprise: entreprise.nom });
    setEtat('pret');
  }
  function changerAvatar(id) {
    setAvatar(id); ecrire('leo:avatar', id); setChoixAvatar(false);
    // Le nouveau corps prend effet au prochain chargement du monde.
    const m = monde.current;
    if (m?.joueur) {
      m.scene.remove(m.joueur.objet);
      m.personnage(id).then((p) => { const pos = m.joueur.objet.position.clone(); m.joueur = p; p.objet.position.copy(pos); m.scene.add(p.objet); });
    }
  }

  // Joystick (téléphone)
  const joy = useRef(null);
  const [bouton, setBouton] = useState(null);
  function joyBouge(e) {
    const r = joy.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const n = Math.max(1, Math.hypot(x, y));
    setBouton({ x: (x / n) * 34, y: (y / n) * 34 });
    if (monde.current) monde.current.joy = { x: (x / n) * 1.6, y: (y / n) * 1.6 };
  }
  function joyFin() { setBouton(null); if (monde.current) monde.current.joy = { x: 0, y: 0 }; }

  const depts = nomsDepts(departements, agents);
  const estEtage = String(lieu).startsWith('etage:');
  const estSalle = String(lieu).startsWith('reunion:');
  const nomLieu = estSalle ? t('legion.monde.salleN', { n: lieu.split(':')[1] }) : estEtage ? t('legion.monde.etage', { n: depts.indexOf(lieu.slice(6)) + 1, nom: lieu.slice(6) }) : libelle(lieu);
  const agentProche = proche?.type === 'agent' ? agents.find((a) => a.id === proche.id) : null;

  return (
    <div className="relative h-[calc(100dvh-13rem)] min-h-[420px] sm:h-[calc(100dvh-9.5rem)] overflow-hidden bg-black">
      <div ref={boite} className="absolute inset-0" />

      {intro && (
        <div className="absolute inset-0 z-20 bg-black">
          <video ref={video} poster="/monde3d/intro.jpg" playsInline preload="auto" className="h-full w-full object-cover"
            onTimeUpdate={(e) => { if (e.currentTarget.currentTime > 5.6) setIntroFin(true); }} onEnded={finirIntro}>
            <source src="/monde3d/intro.mp4" type="video/mp4" />
            {/* Le dernier format : s'il ne passe pas non plus, on entre directement. */}
            <source src="/monde3d/intro.webm" type="video/webm" onError={finirIntro} />
          </video>
          <p className={`pointer-events-none absolute inset-x-0 bottom-[18%] text-center font-serif text-[26px] tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] transition-opacity duration-1000 sm:text-[40px] ${introFin ? 'opacity-100' : 'opacity-0'}`}>
            {t('legion.monde.bienvenue', { nom: entreprise.nom })}
          </p>
          <button type="button" onClick={finirIntro} className="absolute bottom-4 right-4 rounded-pill bg-black/55 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur hover:bg-black/75">{t('legion.monde.passer')} ›</button>
        </div>
      )}

      {etat !== 'pret' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b1120]/90 text-center">
          {etat === 'erreur' ? (
            <>
              <p className="max-w-sm px-6 text-[14px] text-legion-ink">{t('legion.monde.erreur')}</p>
              <button type="button" onClick={() => { setEtat('chargement'); setProgres(null); setEssai((n) => n + 1); }} className="rounded-pill bg-legion-gold px-4 py-2 text-[13px] font-semibold text-legion-bg">{t('legion.monde.reessayer')}</button>
            </>
          ) : (
            <>
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-legion-gold border-t-transparent" />
              <p className="text-[13.5px] text-legion-muted">{t('legion.monde.chargement')}{progres != null ? ` ${progres} %` : ''}</p>
            </>
          )}
        </div>
      )}

      {/* Où je suis */}
      <div className="pointer-events-none absolute left-3 top-3 z-[5] rounded-card bg-[#0b1120]/80 px-3 py-2 text-[12.5px] text-legion-ink backdrop-blur">
        <b className="text-legion-gold">{nomLieu}</b><span className="hidden sm:inline"> · {t(`legion.monde.phrase.${estEtage ? 'etage' : estSalle ? 'reunion' : lieu === 'atelier' && salleMarche ? 'salleMarche' : lieu}`)}</span>
      </div>

      {/* Caméras + avatar */}
      <div className="absolute right-3 top-12 z-[5] flex flex-wrap justify-end gap-1.5 sm:top-3">
        {['tps', 'fps', 'plan'].map((k) => (
          <button key={k} type="button" onClick={() => monde.current?.reglerCamera(k)}
            className={`rounded-pill px-2.5 py-1 text-[12px] font-semibold backdrop-blur ${camera === k ? 'bg-legion-gold text-legion-bg' : 'bg-[#0b1120]/80 text-legion-ink'}`}>{t(`legion.monde.camera.${k}`)}</button>
        ))}
        {mobile && <button type="button" onClick={() => modeJeu(!jeu)} className="rounded-pill bg-legion-gold px-2.5 py-1 text-[12px] font-semibold text-legion-bg">{jeu ? t('legion.monde.quitterJeu') : t('legion.monde.modeJeu')}</button>}
        {String(lieu).startsWith('reunion') && onConvoquer && <button type="button" onClick={() => setConvoc({ sujet: '', ids: [] })} className="rounded-pill bg-legion-gold px-2.5 py-1 text-[12px] font-semibold text-legion-bg">{t('legion.monde.convoquer')}</button>}
        {lieu === 'atelier' && onAppeler && <button type="button" onClick={() => setRenfort(true)} className="rounded-pill bg-[#0b1120]/80 px-2.5 py-1 text-[12px] font-semibold text-legion-gold backdrop-blur">{t('legion.monde.fairevenir')}</button>}
        <button type="button" onClick={() => setIntro(true)} title={t('legion.monde.revoirIntro')} aria-label={t('legion.monde.revoirIntro')} className="rounded-pill bg-[#0b1120]/80 px-2.5 py-1 text-[12px] font-semibold text-legion-ink backdrop-blur">🎬</button>
        <button type="button" onClick={() => setChoixAvatar(true)} className="rounded-pill bg-[#0b1120]/80 px-2.5 py-1 text-[12px] font-semibold text-legion-ink backdrop-blur">{t('legion.monde.monAvatar')}</button>
      </div>

      {/* Ce qui est à portée */}
      {proche && !dialogue && !etage && (
        <div className={`absolute z-[5] rounded-2xl border border-legion-gold/40 bg-[#0b1120]/90 p-2.5 text-center backdrop-blur ${mobile ? 'bottom-[5.5rem] right-3 w-[52%]' : 'bottom-24 left-1/2 w-[min(92%,360px)] -translate-x-1/2 p-3'}`}>
          {agentProche && (
            <div className="mb-2 flex items-center justify-center gap-2">
              {(agentProche.apparence?.mini || agentProche.avatar_url) && <img src={agentProche.apparence?.mini || agentProche.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
              <div className="text-left"><p className="text-[14px] font-semibold text-legion-ink">{agentProche.nom}</p><p className="text-[12px] text-legion-muted">{agentProche.poste}</p></div>
            </div>
          )}
          {agentProche ? (
            <div className="flex gap-1.5">
              {onParler && <button type="button" onClick={() => onParler(agentProche)} className="flex-1 rounded-pill bg-legion-gold px-2 py-2 text-[13px] font-semibold text-legion-bg">{t('legion.monde.parler')}</button>}
              {onAppeler && agentProche.actif !== false && <button type="button" onClick={() => onAppeler(agentProche)} className="flex-1 rounded-pill border border-legion-gold px-2 py-2 text-[13px] font-semibold text-legion-gold">{t('legion.monde.appeler')}</button>}
              <button type="button" onClick={() => onFiche?.(agentProche)} className="rounded-pill border border-legion-line px-2.5 py-2 text-[13px] text-legion-ink">{t('legion.monde.fiche')}</button>
            </div>
          ) : (
          <button type="button" onClick={() => interagir(proche)} className="w-full rounded-pill bg-legion-gold px-4 py-2 text-[13.5px] font-semibold text-legion-bg">
            {!mobile && <kbd className="mr-1.5 rounded bg-black/20 px-1.5 text-[11px]">E</kbd>}
            {t(`legion.monde.action.${proche.type}`, t('legion.monde.action.defaut'))}
          </button>
          )}
        </div>
      )}

      {/* La réceptionniste */}
      {dialogue && (
        <div className="absolute bottom-3 left-1/2 z-[6] w-[min(94%,440px)] -translate-x-1/2 rounded-2xl border border-legion-line bg-[#0b1120]/95 p-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-legion-ink"><img src={`/monde3d/gens/${RECEPTIONNISTE}.jpg`} alt="" className="h-7 w-7 rounded-full object-cover" />{t('legion.monde.receptionniste')}</span>
            <button type="button" onClick={() => setDialogue(null)} className="text-[12.5px] text-legion-muted">{t('common.close', 'Fermer')}</button>
          </div>
          <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
            {dialogue.lignes.map((l, i) => (
              <p key={i} className={`rounded-card px-2.5 py-1.5 text-[13px] ${l.qui === 'moi' ? 'self-end bg-legion-gold/15 text-legion-ink' : 'bg-legion-card text-legion-ink'}`}>{l.texte}</p>
            ))}
          </div>
          {dialogue.aller && <button type="button" onClick={() => aller(dialogue.aller)} className="mt-2 w-full rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg">{t('legion.monde.emmene', { lieu: libelle(dialogue.aller) })}</button>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['reunion', 'travail', 'ouAlpha'].map((k) => (
              <button key={k} type="button" onClick={() => demander(t(`legion.monde.q.${k}`, { nom: agents.find((a) => !a.user_id)?.nom || '' }))} className="rounded-pill border border-legion-line px-2.5 py-1 text-[12px] text-legion-muted hover:border-legion-gold">{t(`legion.monde.q.${k}`, { nom: agents.find((a) => !a.user_id)?.nom || '' })}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); demander(); }} className="mt-2 flex gap-1.5">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('legion.monde.demander')} className="min-w-0 flex-1 rounded-pill border border-legion-line bg-legion-bg px-3 py-1.5 text-[16px] text-legion-ink sm:text-[13px]" />
            <button type="submit" className="rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg">OK</button>
          </form>
        </div>
      )}

      {/* L'ascenseur (et les raccourcis) */}
      {!dialogue && (
        <div className="absolute bottom-3 left-1/2 z-[5] flex -translate-x-1/2 gap-1 rounded-pill bg-[#0b1120]/85 p-1 backdrop-blur">
          {LIEUX.map((l) => (
            <button key={l} type="button" onClick={() => aller(l)} className={`whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[12px] font-semibold sm:px-3 sm:text-[12.5px] ${lieu === l ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{libelle(l)}</button>
          ))}
          <button type="button" onClick={() => aller('maisons')} title={t('legion.monde.lieu.maisons')} aria-label={t('legion.monde.lieu.maisons')} className={`rounded-pill px-2.5 py-1.5 text-[12px] font-semibold ${lieu === 'maisons' ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>🏡</button>
          {depts.length > 0 && <button type="button" onClick={() => setEtage(true)} className={`whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[12px] font-semibold sm:px-3 sm:text-[12.5px] ${estEtage ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{t('legion.monde.etages', { n: depts.length })}</button>}
        </div>
      )}
      {etage && (
        <div className="absolute inset-0 z-[7] flex items-center justify-center bg-black/50" onClick={() => setEtage(false)}>
          <div className="w-[min(90%,300px)] rounded-2xl border border-legion-line bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-[13px] font-semibold text-legion-gold">{t('legion.monde.ascenseur')}</p>
            <div className="max-h-[60vh] overflow-y-auto">
              {[...depts.map((d, i) => ({ id: `etage:${d}`, nom: t('legion.monde.etage', { n: i + 1, nom: d }) })).reverse(), { id: 'atelier', nom: libelle('atelier') }, ...Array.from({ length: Math.max(1, ou.reunions?.length || 0) }, (_, i) => ({ id: i ? `reunion:${i + 1}` : 'reunion', nom: i ? t('legion.monde.salleN', { n: i + 1 }) : t('legion.monde.lieu.reunion') })).reverse(), { id: 'hall', nom: t('legion.monde.lieu.hall') }, { id: 'maisons', nom: `🏡 ${t('legion.monde.lieu.maisons')}` }].map((l) => (
                <button key={l.id} type="button" onClick={() => aller(l.id)} className={`mb-1.5 w-full rounded-card border px-3 py-2 text-left text-[14px] text-legion-ink hover:border-legion-gold ${lieu === l.id ? 'border-legion-gold' : 'border-legion-line'}`}>{l.nom}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commandes */}
      {!mobile && !dialogue && (
        <p className="pointer-events-none absolute bottom-16 left-3 z-[5] hidden rounded-card bg-[#0b1120]/70 px-2.5 py-1.5 text-[11.5px] text-legion-muted lg:block">{t('legion.monde.aide')}</p>
      )}
      {mobile && !dialogue && (
        <>
          <div ref={joy} className="absolute bottom-20 left-4 z-[5] h-28 w-28 touch-none rounded-full border border-white/20 bg-white/10"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); joyBouge(e); }} onPointerMove={(e) => bouton && joyBouge(e)} onPointerUp={joyFin} onPointerCancel={joyFin}>
            <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/40" style={{ transform: `translate(calc(-50% + ${bouton?.x || 0}px), calc(-50% + ${bouton?.y || 0}px))` }} />
          </div>
        </>
      )}

      {jeu && portrait && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-[9] mx-auto w-fit rounded-card bg-black/75 px-4 py-3 text-center text-[14px] text-white">↻ {t('legion.monde.tourne')}</div>
      )}
      {convoc && (
        <div className="absolute inset-0 z-[8] flex items-center justify-center bg-black/60" onClick={() => setConvoc(null)}>
          <form className="max-h-[85%] w-[min(94%,440px)] overflow-y-auto rounded-2xl border border-legion-line bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => { e.preventDefault(); if (convoc.sujet.trim().length < 3 || !convoc.ids.length) return; const ok = await onConvoquer({ sujet: convoc.sujet.trim(), participants: convoc.ids }); if (ok) setConvoc(null); }}>
            <p className="mb-2 text-[14px] font-semibold text-legion-ink">{t('legion.monde.convoquer')}</p>
            <input autoFocus value={convoc.sujet} onChange={(e) => setConvoc({ ...convoc, sujet: e.target.value })} placeholder={t('legion.monde.sujet')} maxLength={160} className="mb-3 w-full rounded-card border border-legion-line bg-legion-bg px-3 py-2 text-[16px] text-legion-ink sm:text-[13.5px]" />
            <p className="mb-1.5 text-[12px] text-legion-muted">{t('legion.monde.qui', { n: convoc.ids.length })}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {agents.filter((a) => !a.user_id && a.actif !== false).map((a) => {
                const pris = convoc.ids.includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => setConvoc({ ...convoc, ids: pris ? convoc.ids.filter((x) => x !== a.id) : [...convoc.ids, a.id].slice(0, 6) })}
                    className={`flex items-center gap-2 rounded-card border px-2 py-1.5 text-left text-[12.5px] text-legion-ink ${pris ? 'border-legion-gold bg-legion-gold/10' : 'border-legion-line'}`}>
                    {(a.apparence?.mini || a.avatar_url) && <img src={a.apparence?.mini || a.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />}<span className="truncate">{a.nom}</span>
                  </button>
                );
              })}
            </div>
            <button type="submit" disabled={convoc.sujet.trim().length < 3 || !convoc.ids.length} className="mt-3 w-full rounded-pill bg-legion-gold px-4 py-2 text-[13.5px] font-semibold text-legion-bg disabled:opacity-40">{t('legion.monde.lancer')}</button>
          </form>
        </div>
      )}
      {renfort && (
        <div className="absolute inset-0 z-[8] flex items-center justify-center bg-black/60" onClick={() => setRenfort(false)}>
          <div className="max-h-[80%] w-[min(94%,420px)] overflow-y-auto rounded-2xl border border-legion-line bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-[14px] font-semibold text-legion-ink">{t('legion.monde.fairevenirTitre')}</p>
            {agents.filter((a) => !a.user_id && a.actif !== false).map((a) => (
              <button key={a.id} type="button" onClick={() => { setRenfort(false); onAppeler(a); }} className="mb-1.5 flex w-full items-center gap-2.5 rounded-card border border-legion-line px-2.5 py-2 text-left hover:border-legion-gold">
                {(a.apparence?.mini || a.avatar_url) && <img src={a.apparence?.mini || a.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
                <span className="min-w-0"><span className="block truncate text-[13.5px] font-semibold text-legion-ink">{a.nom}</span><span className="block truncate text-[12px] text-legion-muted">{a.poste}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
      {choixAvatar && (
        <div className="absolute inset-0 z-[8] flex items-center justify-center bg-black/60" onClick={() => setChoixAvatar(false)}>
          <div className="w-[min(94%,560px)] rounded-2xl border border-legion-line bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-[14px] font-semibold text-legion-ink">{t('legion.monde.choisirAvatar')}</p>
            <div className="grid grid-cols-5 gap-2">
              {CORPS.filter((c) => c.id !== RECEPTIONNISTE).map((c) => (
                <button key={c.id} type="button" onClick={() => changerAvatar(c.id)} className={`overflow-hidden rounded-card border-2 ${avatar === c.id ? 'border-legion-gold' : 'border-transparent'}`}>
                  <img src={`/monde3d/gens/${c.id}.jpg`} alt="" className="aspect-[4/5] w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
