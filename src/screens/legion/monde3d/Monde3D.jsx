import { useEffect, useMemo, useRef, useState } from 'react';
import { quiOuEst, repondre, CORPS, RECEPTIONNISTE, etatDe } from './monde';
import { chargerCiel, phaseDuJour, villeChoisie } from '../parties/ciel';
import { styleVille } from './region';
import { chrono } from './conduite';
import { Compteur, MiniCarte, Volant, Pedales } from './TableauBord';
import { estSalleDeMarche, pairesDuJour, activite14j } from './salle-marche3d';
import { tours as calculerTours, aLaDate, bornesFrise } from '../parties/ville';
import { supabase, storageUrl, storageThumbUrl } from '../../../lib/supabase';
import { chargerAffiches } from './affiches';
import { batirVille } from './maVille';

// LE MONDE 3D DE LÉO (Beau, 25/09) — l'écran : le moteur three.js (chargé à
// la demande), et par-dessus : où je suis, l'ascenseur, les caméras, la carte
// de ce qui est à portée, la réceptionniste, le joystick au téléphone.
// Tout ce qui s'y passe vient des vraies données (monde.js).

const STYLE = `.monde-leger .monde-etiquette{padding:2px 7px 2px 2px;font-size:11px}.monde-leger .monde-etiquette img{width:18px;height:18px}.monde-leger .monde-etiquette i{display:none}.monde-etiquette{display:flex;align-items:center;gap:6px;padding:3px 9px 3px 3px;border-radius:999px;background:rgba(11,17,32,.8);color:#edf1f8;font:12px system-ui;white-space:nowrap;transform:translateY(-6px)}
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

export default function Monde3D({ entreprise, agents, departements = [], messages, taches, onFiche, onParler, onAppeler, onConvoquer, vueVille = false, onChantier, t }) {
  const boite = useRef(null);
  const monde = useRef(null);
  const [etat, setEtat] = useState('chargement'); // chargement | pret | erreur
  const [progres, setProgres] = useState(null);
  const [conseil, setConseil] = useState(() => Math.floor(Math.random() * 6));
  const [essai, setEssai] = useState(0);
  const [lieu, setLieu] = useState('hall');
  const [dehors, setDehors] = useState(false);
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
  const [intro, setIntro] = useState(() => !vueVille && !lire('leo:intro-vue', ''));
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
  // Les projets de l'entreprise, en chantiers en face de l'immeuble (même calcul que la ville 2D).
  const [projets, setProjets] = useState([]);
  useEffect(() => {
    let vivant = true;
    supabase.from('legion_projets').select('*').eq('entreprise_id', entreprise.id).order('debut').then(({ data }) => { if (vivant) setProjets(data || []); });
    return () => { vivant = false; };
  }, [entreprise.id]);
  // La ville de chacun (maVille.js) : les vraies boutiques Finjaro de la personne qui a fondé
  // l'entreprise, leurs articles et leurs clients (comptes de test exclus). Rien → terrains à bâtir.
  const [maVille, setMaVille] = useState(null);
  useEffect(() => {
    let vivant = true;
    (async () => {
      if (!entreprise.owner_id) { setMaVille(batirVille({})); return; }
      const { data: boutiques } = await supabase.from('shops').select('id, name, slug, avatar_url, banner_url').eq('owner_id', entreprise.owner_id);
      if (!boutiques?.length) { if (vivant) setMaVille(batirVille({})); return; }
      const ids = boutiques.map((b) => b.id);
      const [{ data: articles }, { data: commandes }] = await Promise.all([
        supabase.from('products').select('shop_id, is_active, images').in('shop_id', ids).limit(2000),
        supabase.from('orders').select('id, shop_id, buyer_id, guest_id, buyer_name, status, delivered_at, cancelled_at').in('shop_id', ids).limit(2000),
      ]);
      const acheteurs = [...new Set((commandes || []).map((c) => c.buyer_id).filter(Boolean))];
      const reels = new Set();
      await Promise.all(acheteurs.map(async (u) => { const { data } = await supabase.rpc('compte_reel', { p_user_id: u }); if (data) reels.add(u); }));
      const photo = (b) => {
        const p = [b.banner_url, b.avatar_url].find((x) => typeof x === 'string' && x && !/^(blob|data):/.test(x));
        if (p) return /^https?:/.test(p) ? p : storageThumbUrl('shops', p);
        const img = (articles || []).find((a) => a.shop_id === b.id && a.is_active !== false && a.images?.length)?.images[0];
        return img ? (/^https?:/.test(img) ? img : storageThumbUrl('products', img)) : null;
      };
      if (vivant) setMaVille(batirVille({ boutiques: boutiques.map((b) => ({ ...b, banner_url: photo(b), avatar_url: null })), articles: articles || [], commandes: commandes || [], reels }));
    })().catch(() => { if (vivant) setMaVille(batirVille({})); });
    return () => { vivant = false; };
  }, [entreprise.id, entreprise.owner_id]);
  // Où j'habite : une maison (au bord de la mer, près des agents) ou un appartement en cité.
  // Gardé dans la fiche de la personne dans Léo (sans toucher à la base), sinon dans ce navigateur.
  const [moiId, setMoiId] = useState(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMoiId(data?.user?.id || null)).catch(() => {}); }, []);
  const moi = useMemo(() => (agents || []).find((a) => a.user_id && a.user_id === moiId) || null, [agents, moiId]);
  const [habitatLocal, setHabitatLocal] = useState(() => lire(`leo:habitat:${entreprise.id}`, ''));
  const habitat = moi?.apparence?.habitat || habitatLocal || null;
  const [choixHabitat, setChoixHabitat] = useState(false);
  async function choisirHabitat(genre) {
    setChoixHabitat(false);
    setHabitatLocal(genre); ecrire(`leo:habitat:${entreprise.id}`, genre);
    if (moi) await supabase.from('legion_agents').update({ apparence: { ...(moi.apparence || {}), habitat: genre } }).eq('id', moi.id).then(() => {}, () => {});
    setTimeout(() => monde.current?.rentrer(), 300);
  }
  const prenomMoi = String(moi?.nom || '').split(/\s+/)[0] || '';
  useEffect(() => { if (etat === 'pret' && maVille) monde.current?.majQuartiers(maVille, habitat ? { genre: habitat, nom: prenomMoi } : null); }, [maVille, habitat, prenomMoi, etat]);
  useEffect(() => { if (etat === 'pret' && !habitat && !lire(`leo:habitat-plus-tard:${entreprise.id}`, '')) setChoixHabitat(true); }, [etat, habitat, entreprise.id]);
  // L'historique complet des tâches (l'écran n'en garde que les plus récentes) :
  // juste les dates, pour la frise. Les tâches fraîches de l'écran passent devant.
  const [histoire, setHistoire] = useState([]);
  useEffect(() => {
    let vivant = true;
    supabase.from('legion_messages').select('id, created_at, termine_le, assigne_a, meta').eq('entreprise_id', entreprise.id).eq('genre', 'tache').order('created_at').limit(2000)
      .then(({ data }) => { if (vivant) setHistoire(data || []); });
    return () => { vivant = false; };
  }, [entreprise.id]);
  const toutes = useMemo(() => {
    const fraiches = new Map((taches || []).map((x) => [x.id, x]));
    return [...histoire.filter((x) => !fraiches.has(x.id)), ...fraiches.values()];
  }, [histoire, taches]);
  // La 4D : une frise pour revoir les chantiers grandir, jour après jour (vraies dates).
  const frise = useMemo(() => bornesFrise(projets, toutes, maintenant), [projets, toutes, maintenant]);
  const [jour, setJour] = useState(null); // null = maintenant ; sinon n° du jour depuis frise.debut
  const [lecture, setLecture] = useState(false);
  const quand = jour == null ? maintenant : frise.debut + jour * 86_400_000 + 86_399_000; // fin de ce jour-là
  useEffect(() => {
    if (!lecture) return undefined;
    // Tout revoir en 5 à 8 secondes, quelle que soit la durée de l'histoire.
    const pas = Math.max(1, Math.round(frise.jours / 50));
    const i = setInterval(() => setJour((j) => {
      const n = (j ?? 0) + pas;
      if (n >= frise.jours) { setLecture(false); return null; }
      return n;
    }), Math.max(120, Math.min(900, 6000 / Math.max(1, frise.jours / pas))));
    return () => clearInterval(i);
  }, [lecture, frise.jours]);
  useEffect(() => { if (etat === 'pret') monde.current?.vueChantiers(jour != null || lecture); }, [jour, lecture, etat]);
  const chantiers = useMemo(() => {
    const eteints = new Set((agents || []).filter((a) => a.actif === false).map((a) => a.id));
    const passe = aLaDate(projets, toutes, quand, maintenant);
    return calculerTours(passe.projets, passe.taches, Math.min(quand, maintenant), eteints).map((x) => ({
      id: x.id, nom: x.projet ? x.projet.nom : t('legion.ville.quotidien'), debut: x.projet?.debut || null, fin: x.projet?.fin || null,
      rendues: x.rendues, total: x.total, avancement: x.avancement, termine: x.termine, enRetard: x.enRetard, agentsAuTravail: x.agentsAuTravail,
    }));
  }, [projets, toutes, agents, maintenant, quand, t]);
  const [volant, setVolant] = useState(null); // { kmh } pendant qu'on conduit
  const [choc, setChoc] = useState(0);
  const [course, setCourse] = useState(null); // { prochaine, total, temps, finie, record, nouveau }
  const [nage, setNage] = useState(null); // { sous, air } quand on nage
  useEffect(() => { if (etat !== 'chargement') return undefined; const i = setInterval(() => setConseil((c) => c + 1), 4500); return () => clearInterval(i); }, [etat]);
  const [menu, setMenu] = useState(false);
  const [ciel3d, setCiel3d] = useState(false); // la planète est affichée
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
            if (e.type === 'dehors') setDehors(e.dehors);
            if (e.type === 'progression') setProgres(e.total ? Math.round((e.faits / e.total) * 100) : null);
            if (e.type === 'perdu') setEtat('erreur');
            if (e.type === 'camera') setCamera(e.mode);
            if (e.type === 'proximite') setProche(e.cible);
            if (e.type === 'ciel') setCiel3d(e.actif);
            if (e.type === 'interagir') interagirRef.current?.(e.cible);
            if (e.type === 'conduite' && !e.active) setCourse(null);
            if (e.type === 'conduite') setVolant((v) => (e.active ? { ...(v || {}), ...e, kmh: e.kmh || 0, genre: e.genre || 'voiture', alt: e.alt || 0, sePoser: e.sePoser ? Date.now() : (v?.sePoser || 0) } : null));
            if (e.type === 'nage') setNage(e.active ? { sous: e.sous, air: e.air } : null);
            if (e.type === 'course') setCourse((avant) => {
              if (!e.active) return null;
              if (e.nouvelle) return { ...e, record: Number(lire('leo:course-record', '0')) || 0 };
              if (e.finie && !avant?.finie) { // le record reste dans ce navigateur
                const ancien = Number(lire('leo:course-record', '0')) || 0;
                const nouveau = !ancien || e.temps < ancien;
                if (nouveau) ecrire('leo:course-record', String(e.temps));
                return { ...e, record: nouveau ? e.temps : ancien, nouveau };
              }
              return avant?.finie ? avant : { ...e, record: Number(lire('leo:course-record', '0')) || 0 };
            });
            if (e.type === 'choc') { setChoc(Date.now()); try { navigator.vibrate?.(Math.min(120, e.force * 4)); } catch { /* pas de vibreur */ } }
          },
        });
        monde.current = m;
        m.reglerCiel({ phase: phaseDuJour(Date.now()), genre: 'clair' });
        // La météo arrive quand elle arrive : on n'attend pas le réseau pour ouvrir le monde.
        chargerCiel({ langue }).then((c) => {
          if (!c || fini) return;
          m.reglerCiel({ phase: phaseDuJour(Date.now(), c.lever, c.coucher), genre: c.genre || 'clair' });
          m.majPlanete({ lat: c.lat, lon: c.lon, titre: entreprise.nom, sous: `${t('legion.monde.vousEtesIci')} · ${c.ville}` });
        }).catch(() => {});
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
        if (vueVille) m.placerJoueur(0, 22.6, Math.PI); // dans la rue, face aux chantiers des projets
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
  useEffect(() => { if (etat === 'pret') monde.current?.majChantiers(chantiers); }, [chantiers, etat]);

  const interagirRef = useRef(null);
  interagirRef.current = (c) => interagir(c);
  function interagir(cible) {
    if (!cible) return;
    if (cible.type === 'voiture') { monde.current?.monterVoiture(cible.id); return; }
    if (cible.type === 'helico') { monde.current?.monterHelico(); return; }
    if (cible.type === 'bateau') { monde.current?.monterBateau(); return; }
    if (cible.type === 'boutique') { setDialogue({ lignes: [{ qui: 'elle', texte: t('legion.monde.ville.boutiqueResume', { nom: cible.nom, articles: cible.articles, commandes: cible.commandes, livrees: cible.livrees }) }], lien: cible.slug ? `/boutique/${cible.slug}` : null }); return; }
    if (cible.type === 'client') { setDialogue({ lignes: [{ qui: 'elle', texte: t('legion.monde.ville.clientResume', { nom: cible.nom || t('legion.monde.ville.client'), commandes: cible.commandes, livrees: cible.livrees }) }] }); return; }
    if (cible.type === 'chezmoi') { setDialogue({ chezMoi: true, lignes: [{ qui: 'elle', texte: prenomMoi ? t('legion.monde.ville.bienvenue', { nom: prenomMoi }) : t('legion.monde.ville.bienvenueSans') }] }); return; }
    if (cible.type === 'receptionniste') {
      const r = repondre('', { agents, ou, nomEntreprise: entreprise.nom }, langue);
      setDialogue({ lignes: [{ qui: 'elle', texte: r.texte }] });
      parler(r.texte);
    } else if (cible.type === 'ascenseur' || cible.type === 'escalier') setEtage(true);
    else if (cible.type === 'agent') onFiche?.(agents.find((a) => a.id === cible.id));
    else if (cible.type === 'chantier') {
      if (onChantier) onChantier(cible.id);
      else {
        const c = chantiers.find((x) => x.id === cible.id);
        if (c) setDialogue({ lignes: [{ qui: 'elle', texte: t('legion.monde.chantierResume', { nom: c.nom, rendues: c.rendues, total: c.total }) }] });
      }
    }
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
  const enVille = lieu === 'hall' && dehors;
  const nomLieu = estSalle ? t('legion.monde.salleN', { n: lieu.split(':')[1] }) : estEtage ? t('legion.monde.etage', { n: depts.indexOf(lieu.slice(6)) + 1, nom: lieu.slice(6) }) : enVille ? t('legion.monde.lieu.ville') : libelle(lieu);
  const agentProche = proche?.type === 'agent' ? agents.find((a) => a.id === proche.id) : null;
  // Ce que fait l'agent dont on s'approche (Beau, 25/09 : « je dois voir sa fiche mais aussi ce qu'il est
  // en train de faire, sur quoi il travaille ») — seulement ce que les données disent.
  const activiteProche = useMemo(() => etatDe(agentProche, ou, taches), [agentProche, ou, taches]);

  return (
    <div className={`relative ${vueVille ? 'h-[calc(100dvh-12.25rem)] sm:h-[calc(100dvh-10.5rem)]' : 'h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-9.5rem)]'} min-h-[420px] overflow-hidden bg-black ${mobile ? 'monde-leger' : ''}`}>{/* l'onglet « La ville » a deux lignes de plus au-dessus : tout doit tenir dans l'écran */}
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
        <div className={`absolute inset-0 z-10 flex flex-col items-center gap-3 overflow-hidden text-center ${etat === 'erreur' ? 'justify-center bg-[#0b1120]/90' : 'bg-[#070b14]'}`}>
          {etat === 'erreur' ? (
            <>
              <p className="max-w-sm px-6 text-[14px] text-legion-ink">{t('legion.monde.erreur')}</p>
              <button type="button" onClick={() => { setEtat('chargement'); setProgres(null); setEssai((n) => n + 1); }} className="rounded-pill bg-legion-gold px-4 py-2 text-[13px] font-semibold text-legion-bg">{t('legion.monde.reessayer')}</button>
            </>
          ) : (
            <>
              {/* Écran de chargement : la ville de Léo (image créée pour Léo), le nom de l'entreprise, la progression, un conseil */}
              <img src="/monde3d/intro.jpg" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover" style={{ animation: 'leoZoom 14s ease-out forwards' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/55 to-[#070b14]/10" />
              <div className="relative mt-auto w-full max-w-md px-6 pb-10 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-legion-gold">Léo</p>
                <p className="font-serif text-[30px] font-semibold leading-tight text-white drop-shadow sm:text-[36px]">{entreprise?.nom}</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c8893d] to-legion-gold transition-[width] duration-500" style={{ width: `${progres ?? 6}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px] text-white/75">
                  <span>{t('legion.monde.chargement')}</span><span className="font-mono">{progres != null ? `${progres} %` : ''}</span>
                </div>
                <p key={conseil} className="mt-4 min-h-[2.6rem] text-[13.5px] leading-snug text-white/90" style={{ animation: 'leoFondu .6s ease-out' }}>💡 {t(`legion.monde.conseil${(conseil % 6) + 1}`)}</p>
              </div>
              <style>{'@keyframes leoZoom{from{transform:scale(1.12)}to{transform:scale(1.02)}}@keyframes leoFondu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'}</style>
            </>
          )}
        </div>
      )}

      {/* Où je suis */}
      <div className="pointer-events-none absolute left-3 top-3 z-[5] rounded-card bg-[#0b1120]/80 px-3 py-2 text-[12.5px] text-legion-ink backdrop-blur">
        <b className="text-legion-gold">{nomLieu}</b><span className="hidden sm:inline"> · {t(`legion.monde.phrase.${estEtage ? 'etage' : estSalle ? 'reunion' : lieu === 'atelier' && salleMarche ? 'salleMarche' : enVille ? 'ville' : lieu}`)}</span>
      </div>

      {/* En haut à droite : une seule ligne (Beau, 25/09 : « l'arrangement des boutons est horrible »).
          L'action du lieu, le plein écran au téléphone, et un menu pour le reste. */}
      <div className="absolute right-3 top-3 z-[6] flex items-center gap-1.5">
        {String(lieu).startsWith('reunion') && onConvoquer && <button type="button" onClick={() => setConvoc({ sujet: '', ids: [] })} className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg shadow">{t('legion.monde.convoquer')}</button>}
        {lieu === 'atelier' && onAppeler && <button type="button" onClick={() => setRenfort(true)} className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg shadow">{t('legion.monde.fairevenir')}</button>}
        {!mobile && (
          <div className="flex rounded-pill bg-[#0b1120]/80 p-0.5 backdrop-blur">
            {['tps', 'fps', 'plan'].map((k) => (
              <button key={k} type="button" onClick={() => monde.current?.reglerCamera(k)}
                className={`rounded-pill px-2.5 py-1 text-[12px] font-semibold ${camera === k ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{t(`legion.monde.camera.${k}`)}</button>
            ))}
          </div>
        )}
        {mobile && <button type="button" onClick={() => modeJeu(!jeu)} aria-label={jeu ? t('legion.monde.quitterJeu') : t('legion.monde.modeJeu')} title={jeu ? t('legion.monde.quitterJeu') : t('legion.monde.modeJeu')} className="grid h-9 w-9 place-items-center rounded-full bg-[#0b1120]/80 text-[16px] text-legion-ink backdrop-blur">{jeu ? '✕' : '⛶'}</button>}
        <button type="button" onClick={() => setMenu((v) => !v)} aria-label={t('legion.monde.menu')} aria-expanded={menu} className={`grid h-9 w-9 place-items-center rounded-full text-[18px] backdrop-blur ${menu ? 'bg-legion-gold text-legion-bg' : 'bg-[#0b1120]/80 text-legion-ink'}`}>☰</button>
      </div>
      {menu && (
        <div className="absolute right-3 top-14 z-[8] w-56 rounded-2xl border border-legion-line bg-[#0b1120]/95 p-2 shadow-xl backdrop-blur">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-legion-muted">{t('legion.monde.vue')}</p>
          <div className="mb-2 flex rounded-pill bg-black/30 p-0.5">
            {['tps', 'fps', 'plan'].map((k) => (
              <button key={k} type="button" onClick={() => { monde.current?.reglerCamera(k); setMenu(false); }}
                className={`flex-1 rounded-pill px-1 py-1.5 text-[12px] font-semibold ${camera === k ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{t(`legion.monde.camera.${k}`)}</button>
            ))}
          </div>
          <button type="button" onClick={() => { setChoixAvatar(true); setMenu(false); }} className="w-full rounded-card px-2 py-2 text-left text-[13.5px] text-legion-ink hover:bg-white/5">🧍 {t('legion.monde.monAvatar')}</button>
          <button type="button" onClick={() => { setChoixHabitat(true); setMenu(false); }} className="w-full rounded-card px-2 py-2 text-left text-[13.5px] text-legion-ink hover:bg-white/5">🏠 {t('legion.monde.ville.ouHabiter')}</button>
          <button type="button" onClick={() => { setIntro(true); setMenu(false); }} className="w-full rounded-card px-2 py-2 text-left text-[13.5px] text-legion-ink hover:bg-white/5">🎬 {t('legion.monde.revoirIntro')}</button>
        </div>
      )}

      {vueVille && etat === 'pret' && !ciel3d && !volant && frise.jours > 0 && (
        <div className="absolute left-3 right-3 top-14 z-[4] mx-auto max-w-xl rounded-2xl border border-legion-line bg-[#0b1120]/85 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { if (lecture) setLecture(false); else { if (jour == null) setJour(0); setLecture(true); } }}
              aria-label={lecture ? t('legion.monde.frise.pause') : t('legion.monde.frise.revoir')} title={lecture ? t('legion.monde.frise.pause') : t('legion.monde.frise.revoir')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-legion-gold text-[13px] font-bold text-legion-bg">{lecture ? '❚❚' : '▶'}</button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="truncate font-semibold text-legion-ink">{jour == null ? t('legion.monde.frise.aujourdhui') : new Date(quand).toLocaleDateString(t('legion.monde.frise.locale'), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="shrink-0 font-mono text-legion-muted">{t('legion.monde.frise.rendues', { n: chantiers.reduce((a, c) => a + c.rendues, 0), total: chantiers.reduce((a, c) => a + c.total, 0) })}</span>
              </div>
              <input type="range" min={0} max={frise.jours} step={1} value={jour == null ? frise.jours : jour}
                onChange={(e) => { setLecture(false); const v = Number(e.target.value); setJour(v >= frise.jours ? null : v); }}
                aria-label={t('legion.monde.frise.titre')} className="mt-1 w-full accent-[#e3a857]" />
            </div>
            {jour != null && <button type="button" onClick={() => { setLecture(false); setJour(null); }} className="shrink-0 rounded-pill border border-legion-line px-2 py-1 text-[11.5px] text-legion-ink">{t('legion.monde.frise.retour')}</button>}
          </div>
        </div>
      )}

      {choixHabitat && (
        <div className="absolute inset-0 z-[12] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-legion-line bg-[#0b1120]/95 p-4 text-center backdrop-blur">
            <p className="font-serif text-[22px] font-semibold text-legion-ink">{t('legion.monde.ville.ouHabiter')}</p>
            <p className="mt-1 text-[13px] text-legion-muted">{t('legion.monde.ville.ouHabiterAide')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[['maison', '🏡'], ['cite', '🏢']].map(([k, ic]) => (
                <button key={k} type="button" onClick={() => choisirHabitat(k)} className={`rounded-2xl border px-2 py-3 text-[13.5px] font-semibold text-legion-ink hover:border-legion-gold ${habitat === k ? 'border-legion-gold bg-legion-gold/10' : 'border-legion-line'}`}>
                  <span className="block text-[30px]">{ic}</span>{t(`legion.monde.ville.${k}`)}<span className="mt-1 block text-[11.5px] font-normal text-legion-muted">{t(`legion.monde.ville.${k}Aide`)}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setChoixHabitat(false); ecrire(`leo:habitat-plus-tard:${entreprise.id}`, '1'); }} className="mt-3 text-[12.5px] text-legion-muted underline">{t('legion.monde.ville.plusTard')}</button>
          </div>
        </div>
      )}

      {ciel3d && (
        <div className="absolute inset-x-0 bottom-4 z-[9] flex flex-col items-center gap-2 px-4 text-center">
          <p className="rounded-card bg-black/55 px-3 py-1.5 text-[12.5px] text-white/90 backdrop-blur">{t('legion.monde.planeteAide')}</p>
          <button type="button" onClick={() => monde.current?.vueCiel(false)} className="rounded-pill bg-legion-gold px-5 py-2 text-[13.5px] font-semibold text-legion-bg">{t('legion.monde.redescendre')}</button>
        </div>
      )}

      {/* Ce qui est à portée */}
      {proche && !dialogue && !etage && (
        <div className={`absolute z-[5] rounded-2xl border border-legion-gold/40 bg-[#0b1120]/90 p-2.5 text-center backdrop-blur ${mobile ? 'bottom-[5.5rem] right-3 w-[52%]' : 'bottom-24 left-1/2 w-[min(92%,360px)] -translate-x-1/2 p-3'}`}>
          {agentProche && (
            <div className="mb-2 flex items-center justify-center gap-2">
              {(agentProche.apparence?.mini || agentProche.avatar_url) && <img src={agentProche.apparence?.mini || agentProche.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
              <div className="text-left"><p className="text-[14px] font-semibold text-legion-ink">{agentProche.nom}</p><p className="text-[12px] text-legion-muted">{agentProche.poste}</p></div>
            </div>
          )}
          {agentProche && activiteProche && (
            <div className="mb-2 rounded-card border border-legion-line bg-legion-card/70 px-2.5 py-1.5 text-left">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-gold">
                <span className={`h-2 w-2 rounded-full ${activiteProche.etat === 'travaille' ? 'animate-pulse bg-legion-success' : activiteProche.etat === 'veille' ? 'bg-legion-line' : 'bg-legion-gold'}`} />
                {t(`legion.monde.activite.${activiteProche.etat}`, { n: activiteProche.n ?? 0 })}
              </p>
              {activiteProche.texte && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-legion-ink">{String(activiteProche.texte).replace(/^.*?te demande : /, '')}</p>}
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
            {!mobile && <kbd className="mr-1.5 rounded bg-black/20 px-1.5 text-[11px]">{['voiture', 'helico', 'bateau'].includes(proche.type) ? 'F' : 'E'}</kbd>}
            {t(`legion.monde.action.${proche.type}`, t('legion.monde.action.defaut'))}{proche.type === 'chantier' && proche.nom ? ` · ${proche.nom}` : ''}
          </button>
          )}
        </div>
      )}

      {/* La réceptionniste */}
      {dialogue && (
        <div className="absolute bottom-3 left-1/2 z-[6] w-[min(94%,440px)] -translate-x-1/2 rounded-2xl border border-legion-line bg-[#0b1120]/95 p-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            {dialogue.chezMoi ? (
              <span className="flex items-center gap-2 text-[13px] font-semibold text-legion-ink"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-legion-gold/20 text-[14px]">🔑</span>{t('legion.monde.ville.chezMoi')}</span>
            ) : (
              <span className="flex items-center gap-2 text-[13px] font-semibold text-legion-ink"><img src={`/monde3d/gens/${RECEPTIONNISTE}.jpg`} alt="" className="h-7 w-7 rounded-full object-cover" />{t('legion.monde.receptionniste')}</span>
            )}
            <button type="button" onClick={() => setDialogue(null)} className="text-[12.5px] text-legion-muted">{t('common.close', 'Fermer')}</button>
          </div>
          <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
            {dialogue.lignes.map((l, i) => (
              <p key={i} className={`rounded-card px-2.5 py-1.5 text-[13px] ${l.qui === 'moi' ? 'self-end bg-legion-gold/15 text-legion-ink' : 'bg-legion-card text-legion-ink'}`}>{l.texte}</p>
            ))}
          </div>
          {dialogue.lien && <a href={dialogue.lien} target="_blank" rel="noreferrer" className="mt-2 block w-full rounded-pill bg-legion-gold px-3 py-1.5 text-center text-[13px] font-semibold text-legion-bg">{t('legion.monde.ville.voirBoutique')}</a>}
          {dialogue.aller && <button type="button" onClick={() => aller(dialogue.aller)} className="mt-2 w-full rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg">{t('legion.monde.emmene', { lieu: libelle(dialogue.aller) })}</button>}
          {!dialogue.chezMoi && <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['reunion', 'travail', 'ouAlpha'].map((k) => (
              <button key={k} type="button" onClick={() => demander(t(`legion.monde.q.${k}`, { nom: agents.find((a) => !a.user_id)?.nom || '' }))} className="rounded-pill border border-legion-line px-2.5 py-1 text-[12px] text-legion-muted hover:border-legion-gold">{t(`legion.monde.q.${k}`, { nom: agents.find((a) => !a.user_id)?.nom || '' })}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); demander(); }} className="mt-2 flex gap-1.5">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t('legion.monde.demander')} className="min-w-0 flex-1 rounded-pill border border-legion-line bg-legion-bg px-3 py-1.5 text-[16px] text-legion-ink sm:text-[13px]" />
            <button type="submit" className="rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg">OK</button>
          </form>
          </>}
        </div>
      )}

      {/* Dans l'eau : teinte bleue sous la surface, réserve d'air, bouton pour plonger */}
      {nage && (
        <>
          {nage.sous && <div className="pointer-events-none absolute inset-0 z-[4] bg-[#0b3d5c]/45 [box-shadow:inset_0_0_120px_rgba(3,20,40,.8)]" />}
          <div className={`pointer-events-none absolute z-[5] w-40 rounded-2xl border border-white/20 bg-[#0b1120]/80 px-3 py-2 backdrop-blur ${mobile ? 'left-2 top-12' : 'bottom-4 right-4'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-legion-muted">{nage.sous ? t('legion.monde.nage.air') : t('legion.monde.nage.titre')}</p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/15"><div className={`h-full rounded-full transition-[width] ${nage.air < 25 ? 'bg-red-500' : 'bg-[#4cc9f0]'}`} style={{ width: `${nage.air}%` }} /></div>
            {!mobile && <p className="mt-1 text-[11px] text-legion-muted">{t('legion.monde.nage.aide')}</p>}
          </div>
          {mobile && (
            <button type="button" aria-label={t('legion.monde.nage.plonger')} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); monde.current?.pedales({ frein: true }); }} onPointerUp={() => monde.current?.pedales({ frein: false })} onPointerCancel={() => monde.current?.pedales({ frein: false })}
              className="absolute bottom-24 right-4 z-[6] grid h-16 w-16 touch-none select-none place-items-center rounded-full border border-[#4cc9f0] bg-[#0b1120]/80 text-[22px] text-[#4cc9f0] backdrop-blur active:scale-95">▼</button>
          )}
        </>
      )}

      {/* Au volant : compteur, descendre, pédales au téléphone */}
      {volant && (
        <>
          <div className={`pointer-events-none absolute z-[5] ${mobile ? 'left-2 top-12' : 'bottom-3 right-4'} ${Date.now() - choc < 400 ? 'animate-pulse' : ''}`}>
            <Compteur kmh={volant.kmh} jauge={volant.genre === 'voiture' ? (volant.jauge ?? 100) : null} nitro={!!volant.nitro} alt={volant.genre === 'helico' ? volant.alt : null} taille={mobile ? 92 : 150} />
          </div>
          {volant.x != null && (
            <div className={`pointer-events-none absolute z-[5] ${mobile ? 'left-2 top-[9rem]' : 'right-4 top-14'}`}>
              <MiniCarte x={volant.x} z={volant.z} cap={volant.cap || 0} porte={course && !course.finie ? course.porte : null} taille={mobile ? 84 : 124} />
            </div>
          )}
          {volant.genre === 'voiture' && !course && (
            <button type="button" onClick={() => monde.current?.lancerCourse()} className={`absolute z-[6] rounded-pill border border-legion-gold bg-[#0b1120]/85 px-3 py-1.5 text-[12.5px] font-semibold text-legion-gold backdrop-blur ${mobile ? 'right-3 top-[6.5rem]' : 'bottom-4 left-[calc(50%+5.5rem)]'}`}>🏁 {t('legion.monde.course.lancer')}</button>
          )}
          {course && (
            <div className={`absolute left-1/2 z-[6] -translate-x-1/2 rounded-2xl border border-legion-gold/50 bg-[#0b1120]/90 px-4 py-2 text-center backdrop-blur ${mobile ? 'top-[6.5rem]' : 'top-16'}`}>
              {course.finie ? (
                <>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-legion-gold">{course.nouveau ? t('legion.monde.course.nouveauRecord') : t('legion.monde.course.arrivee')}</p>
                  <p className="font-mono text-[26px] font-bold leading-tight text-legion-ink">{chrono(course.temps)}</p>
                  {!course.nouveau && course.record > 0 && <p className="text-[11.5px] text-legion-muted">{t('legion.monde.course.record', { temps: chrono(course.record) })}</p>}
                  <div className="mt-1.5 flex justify-center gap-2">
                    <button type="button" onClick={() => monde.current?.lancerCourse()} className="rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg">{t('legion.monde.course.rejouer')}</button>
                    <button type="button" onClick={() => monde.current?.arreterCourse()} className="rounded-pill border border-legion-line px-3 py-1 text-[12px] text-legion-ink">{t('common.close', 'Fermer')}</button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-[12px] font-semibold text-legion-gold">{course.prochaine === course.total ? t('legion.monde.course.versArrivee') : t('legion.monde.course.porte', { n: course.prochaine, total: course.total - 1 })}</span>
                  <span className="font-mono text-[20px] font-bold text-legion-ink">{chrono(course.temps)}</span>
                  <button type="button" onClick={() => monde.current?.arreterCourse()} aria-label={t('legion.monde.course.abandonner')} className="text-[14px] text-legion-muted">✕</button>
                </div>
              )}
            </div>
          )}
          {volant.genre === 'helico' && Date.now() - volant.sePoser < 3000 && (
            <p className="pointer-events-none absolute left-1/2 top-24 z-[6] -translate-x-1/2 rounded-pill bg-black/70 px-3 py-1.5 text-[12.5px] text-white">{t('legion.monde.conduite.sePoser')}</p>
          )}
          <button type="button" onClick={() => monde.current?.descendreVoiture()} className={`absolute z-[6] rounded-pill bg-legion-gold px-4 py-2 text-[13px] font-semibold text-legion-bg shadow ${mobile ? 'right-3 top-14' : 'bottom-4 left-1/2 -translate-x-1/2'}`}>
            {!mobile && <kbd className="mr-1.5 rounded bg-black/20 px-1.5 text-[11px]">F</kbd>}{t('legion.monde.conduite.descendre')}
          </button>
          {!mobile && <p className="pointer-events-none absolute bottom-16 left-3 z-[5] rounded-card bg-[#0b1120]/70 px-2.5 py-1.5 text-[11.5px] text-legion-muted">{t(volant.genre === 'helico' ? 'legion.monde.conduite.aideHelico' : volant.genre === 'bateau' ? 'legion.monde.conduite.aideBateau' : 'legion.monde.conduite.aide')}</p>}
          {mobile && volant.genre === 'voiture' && (
            <>
              <div className="absolute bottom-5 left-3 z-[6]"><Volant taille={124} surTourner={(v) => { if (monde.current) monde.current.joy = { x: v, y: 0 }; }} /></div>
              <div className="absolute bottom-5 right-3 z-[6]"><Pedales jauge={volant.jauge ?? 100} surAppui={(p) => monde.current?.pedales(p)} etiquettes={{ gaz: t('legion.monde.conduite.gaz'), frein: t('legion.monde.conduite.frein'), nitro: t('legion.monde.conduite.nitro') }} /></div>
            </>
          )}
          {mobile && volant.genre !== 'voiture' && (
            <div className="absolute bottom-20 right-4 z-[6] flex flex-col gap-3">
              {[['gaz', '▲'], ['frein', '▼']].map(([k, s]) => (
                <button key={k} type="button" aria-label={t(`legion.monde.conduite.${volant.genre === 'helico' ? (k === 'gaz' ? 'monter' : 'descendreAlt') : k}`)}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); monde.current?.pedales({ [k]: true }); }} onPointerLeave={undefined}
                  onPointerUp={() => monde.current?.pedales({ [k]: false })} onPointerCancel={() => monde.current?.pedales({ [k]: false })}
                  className={`grid h-16 w-16 touch-none select-none place-items-center rounded-full border text-[22px] font-bold backdrop-blur ${k === 'gaz' ? 'border-legion-gold bg-legion-gold/30 text-legion-gold' : 'border-white/30 bg-white/10 text-white'}`}>{s}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* L'ascenseur (et les raccourcis) */}
      {!dialogue && !volant && (
        <div className="absolute bottom-3 left-1/2 z-[5] flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-pill bg-[#0b1120]/85 p-1 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LIEUX.map((l) => (
            <button key={l} type="button" onClick={() => aller(l)} className={`whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[12px] font-semibold sm:px-3 sm:text-[12.5px] ${lieu === l ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{libelle(l)}</button>
          ))}
          <button type="button" onClick={() => monde.current?.vueCiel(true)} title={t('legion.monde.planete')} aria-label={t('legion.monde.planete')} className="rounded-pill px-2.5 py-1.5 text-[12px] font-semibold text-legion-ink">🌍</button>
          <button type="button" onClick={() => (habitat ? monde.current?.rentrer() : setChoixHabitat(true))} title={t('legion.monde.ville.chezMoi')} aria-label={t('legion.monde.ville.chezMoi')} className="whitespace-nowrap rounded-pill px-2.5 py-1.5 text-[12px] font-semibold text-legion-ink">🔑</button>
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
      {!mobile && !dialogue && !volant && (
        <p className="pointer-events-none absolute bottom-16 left-3 z-[5] hidden rounded-card bg-[#0b1120]/70 px-2.5 py-1.5 text-[11.5px] text-legion-muted lg:block">{t('legion.monde.aide')}</p>
      )}
      {mobile && !dialogue && !(volant && volant.genre === 'voiture') && (
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
