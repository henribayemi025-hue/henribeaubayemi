import { useEffect, useMemo, useRef, useState } from 'react';
import { quiOuEst, repondre, CORPS, RECEPTIONNISTE } from './monde';
import { chargerCiel, phaseDuJour } from '../parties/ciel';

// LE MONDE 3D DE LÉO (Beau, 25/09) — l'écran : le moteur three.js (chargé à
// la demande), et par-dessus : où je suis, l'ascenseur, les caméras, la carte
// de ce qui est à portée, la réceptionniste, le joystick au téléphone.
// Tout ce qui s'y passe vient des vraies données (monde.js).

const STYLE = `.monde-etiquette{display:flex;align-items:center;gap:6px;padding:3px 9px 3px 3px;border-radius:999px;background:rgba(11,17,32,.8);color:#edf1f8;font:12px system-ui;white-space:nowrap;transform:translateY(-6px)}
.monde-etiquette img{width:24px;height:24px;border-radius:50%;object-fit:cover}.monde-etiquette b{display:block;font-weight:700;line-height:1.1}.monde-etiquette i{display:block;font-style:normal;color:#e3a857;font-size:10.5px;max-width:190px;overflow:hidden;text-overflow:ellipsis}`;
const LIEUX = ['hall', 'reunion', 'atelier'];
const JOUR = 86_400_000;

function lire(cle, defaut) { try { return localStorage.getItem(cle) || defaut; } catch { return defaut; } }
function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* navigation privée */ } }

export default function Monde3D({ entreprise, agents, messages, taches, onFiche, t }) {
  const boite = useRef(null);
  const monde = useRef(null);
  const [etat, setEtat] = useState('chargement'); // chargement | pret | erreur
  const [lieu, setLieu] = useState('hall');
  const [camera, setCamera] = useState('tps');
  const [proche, setProche] = useState(null);
  const [dialogue, setDialogue] = useState(null); // { lignes: [{qui, texte}], aller }
  const [question, setQuestion] = useState('');
  const [etage, setEtage] = useState(false);
  const [choixAvatar, setChoixAvatar] = useState(false);
  const [avatar, setAvatar] = useState(() => lire('leo:avatar', 'Male_Adult_07'));
  const [maintenant, setMaintenant] = useState(Date.now());
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
        const { Monde } = await import('./moteur');
        if (fini) return;
        const m = new Monde(boite.current, {
          mobile, langue,
          surEvenement: (e) => {
            if (e.type === 'lieu') setLieu(e.lieu);
            if (e.type === 'camera') setCamera(e.mode);
            if (e.type === 'proximite') setProche(e.cible);
            if (e.type === 'interagir') interagirRef.current?.(e.cible);
          },
        });
        monde.current = m;
        const c = await chargerCiel({ langue }).catch(() => null);
        m.reglerCiel({ phase: phaseDuJour(Date.now(), c?.lever, c?.coucher), genre: c?.genre || 'clair' });
        m.majDonnees({ agents, ou, faits });
        await m.allerA('hall', { nomEntreprise: entreprise.nom, avatar });
        if (fini) { m.detruire(); return; }
        m.demarrer();
        setEtat('pret');
      } catch (err) {
        console.error(err);
        if (!fini) setEtat('erreur');
      }
    })();
    return () => { fini = true; monde.current?.detruire(); monde.current = null; };
  }, [entreprise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { monde.current?.majDonnees({ agents, ou, faits }); }, [agents, ou, faits]);

  const interagirRef = useRef(null);
  interagirRef.current = (c) => interagir(c);
  function interagir(cible) {
    if (!cible) return;
    if (cible.type === 'receptionniste') {
      const r = repondre('', { agents, ou, nomEntreprise: entreprise.nom }, langue);
      setDialogue({ lignes: [{ qui: 'elle', texte: r.texte }] });
      parler(r.texte);
    } else if (cible.type === 'ascenseur') setEtage(true);
    else if (cible.type === 'agent') onFiche?.(agents.find((a) => a.id === cible.id));
  }
  function parler(texte) {
    try {
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = langue === 'en' ? 'en-US' : 'fr-FR';
      const voix = speechSynthesis.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)) && /female|femme|amelie|audrey|marie|samantha|google/i.test(v.name));
      if (voix) u.voice = voix;
      speechSynthesis.cancel();
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

  const nomLieu = t(`legion.monde.lieu.${lieu}`);
  const agentProche = proche?.type === 'agent' ? agents.find((a) => a.id === proche.id) : null;

  return (
    <div className="relative h-[calc(100dvh-13rem)] min-h-[420px] sm:h-[calc(100dvh-9.5rem)] overflow-hidden bg-black">
      <div ref={boite} className="absolute inset-0" />

      {etat !== 'pret' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b1120]/90 text-center">
          {etat === 'erreur' ? <p className="max-w-sm px-6 text-[14px] text-legion-ink">{t('legion.monde.erreur')}</p> : (
            <>
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-legion-gold border-t-transparent" />
              <p className="text-[13.5px] text-legion-muted">{t('legion.monde.chargement')}</p>
            </>
          )}
        </div>
      )}

      {/* Où je suis */}
      <div className="pointer-events-none absolute left-3 top-3 z-[5] rounded-card bg-[#0b1120]/80 px-3 py-2 text-[12.5px] text-legion-ink backdrop-blur">
        <b className="text-legion-gold">{nomLieu}</b><span className="hidden sm:inline"> · {t(`legion.monde.phrase.${lieu}`)}</span>
      </div>

      {/* Caméras + avatar */}
      <div className="absolute right-3 top-12 z-[5] flex flex-wrap justify-end gap-1.5 sm:top-3">
        {['tps', 'fps', 'plan'].map((k) => (
          <button key={k} type="button" onClick={() => monde.current?.reglerCamera(k)}
            className={`rounded-pill px-2.5 py-1 text-[12px] font-semibold backdrop-blur ${camera === k ? 'bg-legion-gold text-legion-bg' : 'bg-[#0b1120]/80 text-legion-ink'}`}>{t(`legion.monde.camera.${k}`)}</button>
        ))}
        <button type="button" onClick={() => setChoixAvatar(true)} className="rounded-pill bg-[#0b1120]/80 px-2.5 py-1 text-[12px] font-semibold text-legion-ink backdrop-blur">{t('legion.monde.monAvatar')}</button>
      </div>

      {/* Ce qui est à portée */}
      {proche && !dialogue && !etage && (
        <div className="absolute bottom-24 left-1/2 z-[5] w-[min(92%,360px)] -translate-x-1/2 rounded-2xl border border-legion-gold/40 bg-[#0b1120]/90 p-3 text-center backdrop-blur">
          {agentProche && (
            <div className="mb-2 flex items-center justify-center gap-2">
              {(agentProche.apparence?.mini || agentProche.avatar_url) && <img src={agentProche.apparence?.mini || agentProche.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
              <div className="text-left"><p className="text-[14px] font-semibold text-legion-ink">{agentProche.nom}</p><p className="text-[12px] text-legion-muted">{agentProche.poste}</p></div>
            </div>
          )}
          <button type="button" onClick={() => interagir(proche)} className="w-full rounded-pill bg-legion-gold px-4 py-2 text-[13.5px] font-semibold text-legion-bg">
            {!mobile && <kbd className="mr-1.5 rounded bg-black/20 px-1.5 text-[11px]">E</kbd>}
            {t(`legion.monde.action.${proche.type}`, t('legion.monde.action.defaut'))}
          </button>
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
          {dialogue.aller && <button type="button" onClick={() => aller(dialogue.aller)} className="mt-2 w-full rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg">{t('legion.monde.emmene', { lieu: t(`legion.monde.lieu.${dialogue.aller}`) })}</button>}
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
            <button key={l} type="button" onClick={() => aller(l)} className={`whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[12px] font-semibold sm:px-3 sm:text-[12.5px] ${lieu === l ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{t(`legion.monde.lieu.${l}`)}</button>
          ))}
        </div>
      )}
      {etage && (
        <div className="absolute inset-0 z-[7] flex items-center justify-center bg-black/50" onClick={() => setEtage(false)}>
          <div className="w-[min(90%,300px)] rounded-2xl border border-legion-line bg-[#0b1120] p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-[13px] font-semibold text-legion-gold">{t('legion.monde.ascenseur')}</p>
            {LIEUX.map((l) => <button key={l} type="button" onClick={() => aller(l)} className="mb-1.5 w-full rounded-card border border-legion-line px-3 py-2 text-left text-[14px] text-legion-ink hover:border-legion-gold">{t(`legion.monde.lieu.${l}`)}</button>)}
          </div>
        </div>
      )}

      {/* Commandes */}
      {!mobile && !dialogue && (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[5] hidden rounded-card bg-[#0b1120]/70 px-2.5 py-1.5 text-[11.5px] text-legion-muted lg:block">{t('legion.monde.aide')}</p>
      )}
      {mobile && !dialogue && (
        <>
          <div ref={joy} className="absolute bottom-20 left-4 z-[5] h-28 w-28 touch-none rounded-full border border-white/20 bg-white/10"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); joyBouge(e); }} onPointerMove={(e) => bouton && joyBouge(e)} onPointerUp={joyFin} onPointerCancel={joyFin}>
            <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/40" style={{ transform: `translate(calc(-50% + ${bouton?.x || 0}px), calc(-50% + ${bouton?.y || 0}px))` }} />
          </div>
          {proche && <button type="button" onClick={() => interagir(proche)} className="absolute bottom-20 right-5 z-[5] h-14 w-14 rounded-full bg-legion-gold text-[16px] font-bold text-legion-bg">E</button>}
        </>
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
