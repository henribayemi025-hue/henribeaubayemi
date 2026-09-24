import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconPlayerStopFilled, IconDownload, IconHistory, IconGitCompare, IconPresentation, IconSend, IconPlus, IconDeviceFloppy, IconFiles, IconCode, IconMessages, IconLoader2, IconEye, IconRefresh, IconDeviceMobile, IconDeviceDesktop, IconPaperclip, IconExternalLink } from '@tabler/icons-react';
import { appel, ErreurAtelier } from './api';
import { construireArbre, dollars } from './arbre';
import { Arbre, Carte, Modifications, Journal, NouveauProjet } from './Parties';
import { pageDeDepart, dependances, assembler } from './apercu';
import { Texte } from '../parties/Plans';

// L'ATELIER DE CODE de Léo — V0 (Beau, 24/09 : « oui atelier »).
//
// Un projet, un agent (le Codeur), et Beau qui garde la main : chaque
// modification et chaque commande passe par une carte « Autoriser une fois /
// Toujours / Refuser ». Ce n'est pas cet écran qui l'impose : c'est le Worker
// finjaro-atelier (atelier/src/politique.js). Ici on montre, on clique.
//
// Ordinateur : l'arbre à gauche, l'éditeur au centre, la conversation à
// droite. Téléphone : trois onglets.
// Pas d'envoi sur GitHub, pas de déploiement en V0 : on exporte un .zip.

const Editeur = lazy(() => import('./Editeur'));

const NOMS_MODELES = {
  auto: 'Auto',
  'ds:deepseek-flash': 'DeepSeek rapide',
  'ds:deepseek-v4-pro': 'DeepSeek fort',
  'km:kimi-k2.6': 'Kimi K2.6',
  'gm:gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gm:gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gm:gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
  'oa:gpt-6-astra': 'GPT-6 Astra',
  'oa:gpt-6-sol': 'GPT-6 Sol',
  'oa:gpt-5.4-mini': 'GPT-5.4 mini',
  'an:claude-sonnet-5': 'Claude Sonnet 5',
};

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* navigation privée */ } };

// Beau, 24/09 : « je pensais que les agents devaient écrire au milieu » et
// « on doit voir la photo de profil des agents ». Le Codeur prend donc le
// visage et le nom de l'agent développeur de l'entreprise (peut_coder), et
// l'éditeur SUIT l'agent : il ouvre le fichier qu'il lit, et tape sous nos
// yeux ce qu'il propose d'écrire, pendant que la carte attend l'accord.
// Les réponses de l'agent mises en forme (Beau, 25/09 : « il y a les étoiles,
// ce n'est pas beau, pas pro ») : titres, listes, gras, et les blocs de code
// dans un encadré.
// Un tableau Markdown (| a | b |) devient un vrai tableau (25/09 : les « | »
// s'affichaient tels quels).
function enBlocs(texte) {
  const blocs = [];
  let tableau = null;
  let texteCourant = [];
  const vider = () => { if (texteCourant.length) { blocs.push({ t: 'texte', v: texteCourant.join('\n') }); texteCourant = []; } };
  for (const l of texte.split('\n')) {
    if (/^\s*\|.*\|\s*$/.test(l)) {
      vider();
      if (!tableau) { tableau = { t: 'tableau', lignes: [] }; blocs.push(tableau); }
      if (!/^\s*\|[\s:|-]+\|\s*$/.test(l)) tableau.lignes.push(l.trim().slice(1, -1).split('|').map((c) => c.trim()));
    } else { tableau = null; texteCourant.push(l); }
  }
  vider();
  return blocs;
}
function Riche({ texte }) {
  const morceaux = String(texte || '').split(/```[\w-]*\n?/);
  return morceaux.map((m, i) => (i % 2
    ? <pre key={i} className="my-1.5 overflow-x-auto rounded-md border border-legion-line bg-legion-bg p-2 font-mono text-[12px] text-legion-gold-soft">{m.replace(/\n$/, '')}</pre>
    : enBlocs(m.replace(/`([^`\n]+)`/g, '$1')).map((b, j) => (b.t === 'tableau'
      ? (
        <div key={`${i}-${j}`} className="my-1.5 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <tbody>{b.lignes.map((l, k) => <tr key={k} className={k === 0 ? 'font-semibold text-legion-gold' : 'border-t border-legion-line'}>{l.map((c, n) => <td key={n} className="px-2 py-1 align-top text-legion-ink">{c.replace(/\*\*/g, '')}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
      : b.v.trim() ? <Texte key={`${i}-${j}`} contenu={b.v} className="text-caption leading-snug text-legion-ink" /> : null))));
}

function Visage({ codeur, taille = 28 }) {
  if (codeur?.avatar_url) return <img src={codeur.avatar_url} alt="" width={taille} height={taille} className="shrink-0 rounded-full object-cover" style={{ width: taille, height: taille }} />;
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-legion-gold/20 text-legion-gold" style={{ width: taille, height: taille }}><IconCode size={taille * 0.55} /></span>;
}

export default function Atelier({ t, langue = 'fr', codeur = null }) {
  const [moi, setMoi] = useState(null);
  const [acces, setAcces] = useState(null); // null | 'ok' | 'hors_ligne' | 'reserve' | 'connexion' | message
  const [projets, setProjets] = useState([]);
  const [pid, setPid] = useState(() => lire('atelier:projet'));
  const [vue, setVue] = useState(null);
  const [fichier, setFichier] = useState(null); // { chemin, contenu, brouillon }
  const [onglet, setOnglet] = useState('conversation');
  const [panneau, setPanneau] = useState(null);
  const [texte, setTexte] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [modele, setModele] = useState(() => lire('atelier:modele') || 'auto');
  const fin = useRef(null);
  const [suivre, setSuivre] = useState(() => lire('atelier:suivre2') !== '0');
  const [activite, setActivite] = useState(null); // { verbe: 'lit' | 'ecrit', chemin }
  const vuJusqua = useRef(null);
  const nomCodeur = codeur?.nom?.split(' ')[0] || t('legion.atelier.leCodeur');

  const statut = vue?.session?.statut;
  const travaille = occupe || statut === 'en_cours';

  const signaler = useCallback((e) => {
    if (e?.name === 'AbortError') return;
    if (e instanceof ErreurAtelier && e.statut === 0) setErreur(t('legion.atelier.horsLigne'));
    else setErreur(e?.message || String(e));
  }, [t]);

  // L'accès, puis la liste des projets.
  useEffect(() => {
    let vivant = true;
    (async () => {
      try {
        const m = await appel('/moi');
        const p = await appel('/projets');
        if (!vivant) return;
        setMoi(m);
        setProjets(p.projets || []);
        setAcces('ok');
        if (!pid && p.projets?.length) setPid(p.projets[0].id);
        if (!p.projets?.length) setPanneau('nouveau');
      } catch (e) {
        if (!vivant) return;
        setAcces(e.statut === 0 ? 'hors_ligne' : e.statut === 403 ? 'reserve' : e.statut === 401 ? 'connexion' : e.message);
      }
    })();
    return () => { vivant = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const charger = useCallback(async (id = pid) => {
    if (!id) return;
    try { setVue(await appel(`/projets/${id}`)); } catch (e) {
      if (e.statut === 404) { setPid(null); setVue(null); } else signaler(e);
    }
  }, [pid, signaler]);

  useEffect(() => {
    if (acces !== 'ok' || !pid) return;
    ecrire('atelier:projet', pid);
    setFichier(null);
    charger(pid);
  }, [acces, pid, charger]);

  // Pendant que l'agent travaille, on suit le journal et le coût.
  useEffect(() => {
    if (!travaille || !pid) return undefined;
    const minuterie = setInterval(() => charger(pid), 2000);
    return () => clearInterval(minuterie);
  }, [travaille, pid, charger]);

  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [vue?.affichage?.length, vue?.demande?.id]);

  // Un fichier ouvert que l'agent vient de changer : on le relit (sauf si
  // Beau est en train de le modifier lui-même).
  const tailleOuverte = vue?.fichiers?.find((f) => f.chemin === fichier?.chemin)?.taille;
  const nbActions = vue?.affichage?.[vue.affichage.length - 1]?.id || '';
  useEffect(() => {
    if (!fichier || fichier.brouillon !== fichier.contenu || !pid) return;
    appel(`/projets/${pid}/fichier?chemin=${encodeURIComponent(fichier.chemin)}`)
      .then((r) => setFichier((f) => (f && f.chemin === r.chemin && f.brouillon === f.contenu ? { ...f, contenu: r.contenu, brouillon: r.contenu } : f)))
      .catch(() => setFichier((f) => (f && f.brouillon === f.contenu && tailleOuverte === undefined ? null : f)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailleOuverte, nbActions]);

  async function agir(fn) {
    setErreur(null);
    setOccupe(true);
    try { const r = await fn(); if (r?.session) setVue(r); return r; } catch (e) { signaler(e); await charger(); return null; } finally { setOccupe(false); }
  }

  const envoyer = (e) => {
    e?.preventDefault();
    const m = texte.trim();
    if (!m || travaille || statut === 'attente') return;
    setTexte('');
    setOnglet('conversation');
    agir(() => appel(`/projets/${pid}/message`, { methode: 'POST', corps: { texte: m, modele } }));
  };
  // « Tout autoriser » : le mode Auto pour la suite, puis cette carte autorisée une fois.
  const decider = (choix) => agir(async () => {
    if (choix === 'tout') {
      await appel(`/projets/${pid}/mode`, { methode: 'POST', corps: { mode: 'auto' } });
      choix = 'une_fois';
    }
    return appel(`/projets/${pid}/decision`, { methode: 'POST', corps: { demande_id: vue.demande.id, choix } });
  });
  const presenter = () => { setOnglet('conversation'); agir(() => appel(`/projets/${pid}/presenter`, { methode: 'POST', corps: { texte: t('legion.atelier.presenteMoiTexte') } })); };
  // Stop passe même quand une requête est en cours : c'est le but.
  const stop = async () => { try { setVue(await appel(`/projets/${pid}/stop`, { methode: 'POST', corps: {} })); } catch (e) { signaler(e); } };
  const changerMode = (mode) => agir(() => appel(`/projets/${pid}/mode`, { methode: 'POST', corps: { mode } }));
  const nouvelleSession = () => { if (window.confirm(t('legion.atelier.nouvelleSessionConfirmer'))) agir(() => appel(`/projets/${pid}/session`, { methode: 'POST', corps: {} })); };
  const retirerRegle = (id) => agir(() => appel(`/projets/${pid}/regles/${id}`, { methode: 'DELETE' }));

  async function ouvrir(chemin, basculer = true) {
    try {
      const r = await appel(`/projets/${pid}/fichier?chemin=${encodeURIComponent(chemin)}`);
      setFichier({ chemin: r.chemin, contenu: r.contenu, brouillon: r.contenu });
      if (basculer) setOnglet('editeur');
    } catch (e) {
      // Un fichier que l'agent crée n'existe pas encore : on l'ouvre vide.
      if (!basculer && e?.statut === 404) setFichier({ chemin, contenu: '', brouillon: '' });
      else if (basculer) signaler(e);
    }
  }

  // L'éditeur suit l'agent. Au premier chargement, on ne rejoue pas le passé.
  const proposition = vue?.demande?.outil === 'ecrire_fichier' && typeof vue.demande.contenu === 'string' ? vue.demande : null;
  useEffect(() => {
    const liste = vue?.affichage || [];
    const dernier = liste[liste.length - 1];
    if (vuJusqua.current === null) { vuJusqua.current = dernier?.id || ''; return; }
    if (!dernier || dernier.id === vuJusqua.current) return;
    const i = liste.findIndex((a) => a.id === vuJusqua.current);
    const nouveaux = liste.slice(i + 1);
    vuJusqua.current = dernier.id;
    // L'agent veut MONTRER quelque chose (l'aperçu ou un fichier) : on l'ouvre.
    const montre = [...nouveaux].reverse().find((a) => a.qui === 'action' && a.outil === 'montrer' && a.ok);
    if (montre) {
      // Une page web (tests.html…) se montre dans l'aperçu, un autre fichier dans l'éditeur.
      if (montre.resume === 'apercu') { setPageApercu(null); setOnglet('apercu'); }
      else if (/\.html?$/i.test(montre.resume)) { setPageApercu(montre.resume); setOnglet('apercu'); }
      else ouvrir(montre.resume, true);
      return;
    }
    const geste = [...nouveaux].reverse().find((a) => a.qui === 'action' && ['lire_fichier', 'ecrire_fichier'].includes(a.outil) && a.ok && a.resume && a.resume !== '.');
    if (!geste) return;
    setActivite({ verbe: geste.outil === 'lire_fichier' ? 'lit' : 'ecrit', chemin: geste.resume });
    if (suivre && fichier?.chemin !== geste.resume && (!fichier || fichier.brouillon === fichier.contenu)) {
      // Un fichier qu'elle vient d'ÉCRIRE s'ouvre vide, puis se tape sous nos
      // yeux en descendant là où elle écrit (25/09 : « la barre reste à 1 »).
      if (geste.outil === 'ecrire_fichier') { setFichier({ chemin: geste.resume, contenu: '', brouillon: '' }); setTimeout(() => ouvrir(geste.resume, false), 120); }
      else ouvrir(geste.resume, false);
    }
    // Le fil est tronqué à 200 lignes par le serveur : on suit le DERNIER
    // élément, pas la longueur (25/09 : au-delà de 200, l'éditeur ne suivait plus).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vue?.affichage?.[vue.affichage.length - 1]?.id]);
  useEffect(() => {
    if (!proposition) return;
    setActivite({ verbe: 'ecrit', chemin: proposition.chemin });
    if (suivre && fichier?.chemin !== proposition.chemin && (!fichier || fichier.brouillon === fichier.contenu)) ouvrir(proposition.chemin, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposition?.id]);
  useEffect(() => { if (!travaille && statut !== 'attente') setActivite(null); }, [travaille, statut]);
  // Le fichier s'ouvre d'abord tel qu'il est, puis l'agent y tape sa proposition.
  const [propPrete, setPropPrete] = useState(null);
  useEffect(() => {
    if (!proposition || fichier?.chemin !== proposition.chemin) return undefined;
    const m = setTimeout(() => setPropPrete(proposition.id), 450);
    return () => clearTimeout(m);
  }, [proposition?.id, fichier?.chemin]); // eslint-disable-line react-hooks/exhaustive-deps
  // L'aperçu : la page web du projet, assemblée et affichée dans un cadre isolé.
  // Si l'agent attend un accord sur un fichier, on montre la page AVEC sa
  // proposition : on voit le résultat avant de dire oui.
  const [docApercu, setDocApercu] = useState(null);
  const [pageApercu, setPageApercu] = useState(null);
  const [grandTerminal, setGrandTerminal] = useState(false);
  const [basOuvert, setBasOuvert] = useState(true);
  const [panneauBas, setPanneauBas] = useState('agent');
  const [terminaux, setTerminaux] = useState([]);
  const [saisieTerminal, setSaisieTerminal] = useState('');
  const fichierJoint = useRef(null);
  const [etroit, setEtroit] = useState(false);
  const apercuVisible = onglet === 'apercu';
  const signature = (vue?.fichiers || []).map((f) => `${f.chemin}:${f.taille}`).join('|');
  const rafraichirApercu = useCallback(async () => {
    if (!pid) return;
    const chemins = (vue?.fichiers || []).map((f) => f.chemin);
    const page = pageApercu && chemins.includes(pageApercu) ? pageApercu : pageDeDepart(chemins);
    if (!page) { setDocApercu({ vide: true }); return; }
    const prop = vue?.demande?.outil === 'ecrire_fichier' && typeof vue.demande.contenu === 'string' ? vue.demande : null;
    const lireF = async (c) => {
      if (prop?.chemin === c) return prop.contenu;
      if (fichier?.chemin === c) return fichier.brouillon;
      return (await appel(`/projets/${pid}/fichier?chemin=${encodeURIComponent(c)}`)).contenu;
    };
    try {
      const html = await lireF(page);
      const contenus = {};
      await Promise.all(dependances(page, html).map(async (c) => { try { contenus[c] = await lireF(c); } catch { /* fichier absent */ } }));
      setDocApercu({ page, doc: assembler(page, html, contenus), proposition: !!prop });
    } catch (e) { setDocApercu({ page, erreur: e?.message || String(e) }); }
  }, [pid, vue?.fichiers, vue?.demande, fichier, pageApercu]);
  useEffect(() => {
    if (!apercuVisible) return undefined;
    const m = setTimeout(rafraichirApercu, 350);
    return () => clearTimeout(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apercuVisible, signature, vue?.demande?.id, fichier?.brouillon, pid, pageApercu]);

  // La page ouverte à part, en grand (un « artefact » cliquable) : toujours
  // dans un cadre isolé, pour qu'elle ne voie jamais la session de Léo.
  const ouvrirAPart = () => {
    if (!docApercu?.doc) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.opener = null;
    const cadre = w.document.createElement('iframe');
    cadre.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
    cadre.srcdoc = docApercu.doc;
    cadre.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff';
    w.document.title = docApercu.page || 'Aperçu';
    w.document.body.style.margin = '0';
    w.document.body.appendChild(cadre);
  };
  const basculerSuivre = () => setSuivre((x) => { ecrire('atelier:suivre2', x ? '0' : '1'); return !x; });
  const enregistrer = () => fichier && agir(async () => {
    const r = await appel(`/projets/${pid}/fichier`, { methode: 'PUT', corps: { chemin: fichier.chemin, contenu: fichier.brouillon } });
    setFichier((f) => ({ ...f, contenu: f.brouillon }));
    return r;
  });

  function telecharger(chemin, contenu) {
    const url = URL.createObjectURL(new Blob([contenu ?? ''], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = chemin.split('/').pop(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  // Joindre un fichier à sa demande : il est déposé dans le projet, et la
  // demande le mentionne (25/09 : « je ne peux pas joindre un fichier »).
  // Textes seulement pour l'instant (code, CSV, JSON, Markdown…).
  async function joindre(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !pid) return;
    if (f.size > 1_000_000) { setErreur(t('legion.atelier.jointTropGros')); return; }
    const texteF = await f.text();
    if (/\u0000/.test(texteF.slice(0, 2000))) { setErreur(t('legion.atelier.jointBinaire', { nom: f.name })); return; }
    await agir(() => appel(`/projets/${pid}/fichier`, { methode: 'PUT', corps: { chemin: f.name, contenu: texteF } }));
    setTexte((x) => `${x}${x ? '\n' : ''}${t('legion.atelier.jointMention', { nom: f.name })}`);
  }

  async function exporter() {
    try {
      const r = await appel(`/projets/${pid}/export`, { brut: true });
      const nom = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'projet.zip';
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) { signaler(e); }
  }

  async function creer(nom, depart) {
    const r = await agir(() => appel('/projets', { methode: 'POST', corps: { nom, depart } }));
    if (r?.projet) {
      setProjets((p) => [r.projet, ...p]);
      setPid(r.projet.id);
      setPanneau(null);
    }
  }

  const arbre = useMemo(() => construireArbre(vue?.fichiers), [vue?.fichiers]);

  if (acces !== 'ok') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <IconCode size={40} className="text-legion-gold" />
        <p className="max-w-md text-body text-legion-ink">
          {acces === null ? <IconLoader2 className="mx-auto animate-spin text-legion-muted" /> : acces === 'hors_ligne' ? t('legion.atelier.pasEnLigne') : acces === 'reserve' ? t('legion.atelier.reserve') : acces === 'connexion' ? t('legion.atelier.connexion') : acces}
        </p>
      </div>
    );
  }

  const s = vue?.session;
  const part = s ? Math.min(1, s.cout / s.plafond) : 0;
  const sale = fichier && fichier.brouillon !== fichier.contenu;
  const enProposition = !!(proposition && fichier?.chemin === proposition.chemin && propPrete === proposition.id);

  const colonneArbre = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-legion-muted">
        {t('legion.atelier.fichiers')}
        <span>{vue?.fichiers?.length ?? 0}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-3">{vue && <Arbre noeud={arbre} ouvert={fichier?.chemin} onOuvrir={ouvrir} />}</div>
    </div>
  );

  const colonneEditeur = (
    <div className="flex h-full min-h-0 flex-col">
      {activite && (
        <div className="flex items-center gap-2 border-b border-legion-line bg-legion-card px-3 py-1.5 text-[12px]">
          <Visage codeur={codeur} taille={22} />
          <span className="min-w-0 truncate text-legion-ink">
            {t(`legion.atelier.activite_${activite.verbe}`, { nom: nomCodeur, chemin: activite.chemin })}
            {enProposition && <span className="text-legion-gold-soft"> · {t('legion.atelier.attendTonAccord')}</span>}
          </span>
          {enProposition && (
            <span title={t('legion.atelier.rejoueAide', { nom: nomCodeur })} className="shrink-0 rounded-pill border border-legion-line px-2 py-0.5 text-[10px] text-legion-muted">{t('legion.atelier.rejoue')}</span>
          )}
          <span className="ml-auto flex shrink-0 gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((k) => <span key={k} className="h-1.5 w-1.5 animate-pulse rounded-full bg-legion-gold" style={{ animationDelay: `${k * 200}ms` }} />)}
          </span>
        </div>
      )}
      {fichier ? (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-legion-line px-3 py-1.5">
            <span className="min-w-0 truncate font-mono text-[12px] text-legion-ink">{fichier.chemin}{sale ? ' •' : ''}</span>
            <button type="button" onClick={basculerSuivre} aria-pressed={suivre} title={t('legion.atelier.suivreAide')}
              className={`ml-auto shrink-0 rounded-pill border px-2.5 py-1 text-[11px] font-semibold ${suivre ? 'border-legion-gold text-legion-gold' : 'border-legion-line text-legion-muted'}`}>
              {suivre ? '● ' : '○ '}{t(suivre ? 'legion.atelier.suivreOui' : 'legion.atelier.suivreNon', { nom: nomCodeur })}
            </button>
            <button type="button" onClick={() => telecharger(fichier.chemin, fichier.brouillon)} title={t('legion.atelier.telecharger')}
              className="shrink-0 rounded-pill border border-legion-line p-1.5 text-legion-muted hover:text-legion-gold"><IconDownload size={14} /></button>
            <button type="button" onClick={enregistrer} disabled={!sale || travaille || enProposition}
              className="flex shrink-0 items-center gap-1 rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-40">
              <IconDeviceFloppy size={14} /> {t('legion.atelier.enregistrer')}
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Suspense fallback={<div className="p-4 text-caption text-legion-muted">…</div>}>
              <Editeur chemin={fichier.chemin} valeur={enProposition ? proposition.contenu : fichier.brouillon} lectureSeule={travaille || enProposition}
                auteur={nomCodeur}
                onChange={(v) => setFichier((f) => (f ? { ...f, brouillon: v } : f))} />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-caption text-legion-muted">{t('legion.atelier.choisisUnFichier')}</div>
      )}
    </div>
  );

  // La console en direct, sous l'éditeur (Beau, 25/09 : « je veux voir les
  // logs, comment ça défile ») : chaque geste de l'agent, à la seconde.
  const lignesConsole = (vue?.affichage || []).filter((a) => a.qui === 'action' || a.qui === 'agent').slice(-40);
  // Le panneau du bas, façon VS Code (Beau, 25/09 : « je ne peux pas fermer
  // ou ajouter le terminal ») : l'onglet « Agent » (ce qu'il fait, à la
  // seconde) et autant de terminaux qu'on veut, où l'on tape soi-même.
  const heure = (q) => (q ? new Date(q).toLocaleTimeString(langue, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '');
  const blocCommande = (a) => (
    <div key={a.id} className="py-0.5">
      <p className="truncate"><span className="text-legion-muted">{heure(a.quand)} </span><span className={a.par === 'humain' ? 'text-legion-success' : 'text-legion-gold'}>{a.par === 'humain' ? '›' : '$'}</span> <span className="text-legion-ink">{a.resume}</span></p>
      {a.terminal?.sortie && <pre className={`whitespace-pre-wrap break-all pl-4 ${a.terminal.code === 0 ? 'text-[#b9c6d8]' : 'text-legion-danger'}`}>{a.terminal.sortie}</pre>}
      {a.terminal && <p className={`pl-4 ${a.terminal.code === 0 ? 'text-legion-success' : 'text-legion-danger'}`}>{t('legion.atelier.codeSortie', { code: a.terminal.code })}</p>}
    </div>
  );
  const ongletActif = terminaux.find((x) => x.id === panneauBas) || null;
  const lancerCommande = async (e) => {
    e.preventDefault();
    const c = saisieTerminal.trim();
    if (!c || !ongletActif || !pid) return;
    setSaisieTerminal('');
    const r = await agir(() => appel(`/projets/${pid}/commande`, { methode: 'POST', corps: { commande: c } }));
    const derniere = [...(r?.affichage || [])].reverse().find((a) => a.par === 'humain');
    if (derniere) setTerminaux((ts) => ts.map((x) => (x.id === ongletActif.id ? { ...x, ids: [...x.ids, derniere.id] } : x)));
  };
  const console_ = basOuvert ? (
    <div className={`${grandTerminal ? 'h-[42vh]' : 'h-[170px]'} flex shrink-0 flex-col border-t border-legion-line bg-[#070b14]`}>
      <div className="flex items-center gap-1 border-b border-legion-line px-2 py-1 text-[11px]">
        <button type="button" onClick={() => setPanneauBas('agent')} className={`rounded px-2 py-0.5 ${panneauBas === 'agent' ? 'bg-legion-card text-legion-gold' : 'text-legion-muted'}`}>{t('legion.atelier.ongletAgent', { nom: nomCodeur })}</button>
        {terminaux.map((x, n) => (
          <span key={x.id} className={`flex items-center rounded ${panneauBas === x.id ? 'bg-legion-card text-legion-gold' : 'text-legion-muted'}`}>
            <button type="button" onClick={() => setPanneauBas(x.id)} className="px-2 py-0.5">{t('legion.atelier.terminalN', { n: n + 1 })}</button>
            <button type="button" aria-label={t('legion.atelier.fermerTerminal')} onClick={() => { setTerminaux((ts) => ts.filter((y) => y.id !== x.id)); if (panneauBas === x.id) setPanneauBas('agent'); }} className="pr-1.5 hover:text-legion-danger">×</button>
          </span>
        ))}
        <button type="button" onClick={() => { const id = `t${Date.now()}`; setTerminaux((ts) => [...ts, { id, ids: [] }]); setPanneauBas(id); }} title={t('legion.atelier.nouveauTerminal')} className="rounded px-2 py-0.5 text-legion-muted hover:text-legion-gold">+</button>
        <span className="ml-auto" />
        <button type="button" onClick={() => setGrandTerminal((x) => !x)} className="rounded px-2 py-0.5 text-legion-muted hover:text-legion-gold">{t(grandTerminal ? 'legion.atelier.terminalPetit' : 'legion.atelier.terminalGrand')}</button>
        <button type="button" onClick={() => setBasOuvert(false)} aria-label={t('legion.atelier.fermerPanneau')} className="rounded px-2 py-0.5 text-legion-muted hover:text-legion-danger">×</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1.5 font-mono text-[11px] leading-relaxed" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
        {!ongletActif ? (
          <>
            {!lignesConsole.length && <p className="text-legion-muted">{t('legion.atelier.consoleVide')}</p>}
            {lignesConsole.map((a) => (a.terminal ? blocCommande(a) : (
              <p key={a.id} className="truncate">
                <span className="text-legion-muted">{heure(a.quand)} </span>
                {a.qui === 'action'
                  ? <><span className={a.decision?.startsWith('refuse') ? 'text-legion-danger' : a.ok ? 'text-legion-success' : 'text-legion-gold'}>{a.outil}</span> <span className="text-legion-ink">{a.resume}</span> <span className="text-legion-muted">· {t(`legion.atelier.decision_${a.decision}`, a.decision)}</span></>
                  : <><span className="text-legion-gold">{nomCodeur}</span> <span className="text-legion-ink">{String(a.texte || '').replace(/[*#`]+/g, '').replace(/\s+/g, ' ').slice(0, 160)}</span></>}
              </p>
            )))}
            {travaille && <p className="text-legion-gold">▍</p>}
          </>
        ) : (
          <>
            {!ongletActif.ids.length && <p className="text-legion-muted">{t('legion.atelier.terminalVide')}</p>}
            {(vue?.affichage || []).filter((a) => ongletActif.ids.includes(a.id)).map(blocCommande)}
          </>
        )}
      </div>
      {ongletActif && (
        <form onSubmit={lancerCommande} className="flex items-center gap-2 border-t border-legion-line px-3 py-1 font-mono text-[12px]">
          <span className="text-legion-success">›</span>
          <input value={saisieTerminal} onChange={(e) => setSaisieTerminal(e.target.value)} disabled={travaille || statut === 'attente'} placeholder={t('legion.atelier.terminalSaisie')} spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-legion-ink outline-none placeholder:text-legion-muted disabled:opacity-50" />
        </form>
      )}
    </div>
  ) : (
    <button type="button" onClick={() => setBasOuvert(true)} className="shrink-0 border-t border-legion-line bg-[#070b14] px-3 py-1 text-left font-mono text-[11px] text-legion-muted hover:text-legion-gold">▸ {t('legion.atelier.ouvrirPanneau')}</button>
  );

  const colonneApercu = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-legion-line px-3 py-1.5 text-[12px]">
        <IconEye size={14} className="shrink-0 text-legion-gold" />
        {(vue?.fichiers || []).filter((f) => /\.html?$/i.test(f.chemin)).length > 1 ? (
          <select value={docApercu?.page || ''} onChange={(e) => setPageApercu(e.target.value)} aria-label={t('legion.atelier.apercu')}
            className="min-w-0 rounded-input border border-legion-line bg-legion-bg px-1.5 py-0.5 font-mono text-[12px] text-legion-ink">
            {(vue?.fichiers || []).filter((f) => /\.html?$/i.test(f.chemin)).map((f) => <option key={f.chemin} value={f.chemin}>{f.chemin}</option>)}
          </select>
        ) : <span className="min-w-0 truncate font-mono text-legion-ink">{docApercu?.page || t('legion.atelier.apercu')}</span>}
        {docApercu?.proposition && <span className="shrink-0 text-legion-gold-soft">· {t('legion.atelier.apercuProposition', { nom: nomCodeur })}</span>}
        <button type="button" onClick={() => setEtroit((x) => !x)} title={t(etroit ? 'legion.atelier.apercuLarge' : 'legion.atelier.apercuTelephone')}
          className="ml-auto hidden rounded-pill border border-legion-line p-1.5 text-legion-muted hover:text-legion-gold lg:block">
          {etroit ? <IconDeviceDesktop size={14} /> : <IconDeviceMobile size={14} />}
        </button>
        <button type="button" onClick={ouvrirAPart} disabled={!docApercu?.doc} title={t('legion.atelier.ouvrirAPart')}
          className="rounded-pill border border-legion-line p-1.5 text-legion-muted hover:text-legion-gold disabled:opacity-40 max-lg:ml-auto"><IconExternalLink size={14} /></button>
        <button type="button" onClick={rafraichirApercu} title={t('legion.atelier.actualiser')}
          className="rounded-pill border border-legion-line p-1.5 text-legion-muted hover:text-legion-gold"><IconRefresh size={14} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#1a2030] p-2">
        {docApercu?.doc ? (
          <iframe title={t('legion.atelier.apercu')} sandbox="allow-scripts allow-forms allow-modals" srcDoc={docApercu.doc}
            className="mx-auto block h-full rounded-md bg-white shadow-lg" style={{ width: etroit ? 390 : '100%', maxWidth: '100%' }} />
        ) : (
          <p className="p-6 text-center text-caption text-legion-muted">
            {docApercu?.vide ? t('legion.atelier.apercuVide') : docApercu?.erreur || <IconLoader2 className="mx-auto animate-spin" />}
          </p>
        )}
      </div>
    </div>
  );

  const colonneConversation = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {!vue?.affichage?.length && <p className="rounded-card bg-legion-card p-3 text-caption text-legion-muted">{t('legion.atelier.accueil')}</p>}
        {vue?.affichage?.map((a) => (a.qui === 'action' ? (
          <div key={a.id} className="flex items-center gap-2 px-1 font-mono text-[11px] text-legion-muted">
            <span className={a.decision?.startsWith('refuse') ? 'text-legion-danger' : a.ok ? 'text-legion-success' : 'text-legion-gold'}>●</span>
            <span className="min-w-0 truncate">{a.outil} {a.resume}</span>
            <span className="shrink-0">{t(`legion.atelier.decision_${a.decision}`, a.decision)}</span>
          </div>
        ) : a.qui === 'agent' ? (
          <div key={a.id} className="flex max-w-[96%] items-start gap-2">
            <Visage codeur={codeur} />
            <div className="min-w-0">
              <p className="mb-0.5 text-[11px] font-semibold text-legion-gold">{codeur?.nom || nomCodeur}{a.modele && <span className="ml-1.5 font-normal text-legion-muted">· {NOMS_MODELES[a.modele] || a.modele}</span>}</p>
              <div className="rounded-card bg-legion-card px-3 py-2"><Riche texte={a.texte} /></div>
            </div>
          </div>
        ) : (
          <div key={a.id} className={`max-w-[92%] whitespace-pre-wrap rounded-card px-3 py-2 text-caption ${a.qui === 'humain' ? 'ml-auto bg-legion-accent text-white' : 'mx-auto border border-legion-gold/40 text-center text-legion-gold-soft'}`}>
            {a.texte}
          </div>
        )))}
        {travaille && statut !== 'attente' && (
          <p className="flex items-center gap-2 px-1 text-[12px] text-legion-muted"><Visage codeur={codeur} taille={20} /> {activite ? t(`legion.atelier.activite_${activite.verbe}`, { nom: nomCodeur, chemin: activite.chemin }) : t('legion.atelier.travailleNom', { nom: nomCodeur })} <IconLoader2 size={14} className="animate-spin" /></p>
        )}
        <Carte demande={vue?.demande} occupe={occupe} onDecider={decider} t={t} nom={nomCodeur} />
        <div ref={fin} />
      </div>
      <form onSubmit={envoyer} className="border-t border-legion-line p-2">
        <div className="flex items-end gap-2">
          <input ref={fichierJoint} type="file" className="hidden" onChange={joindre} />
          <button type="button" onClick={() => fichierJoint.current?.click()} disabled={!vue || travaille} aria-label={t('legion.atelier.joindre')} title={t('legion.atelier.joindre')}
            className="self-center rounded-full border border-legion-line p-2 text-legion-muted hover:text-legion-gold disabled:opacity-40"><IconPaperclip size={16} /></button>
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) envoyer(e); }}
            placeholder={statut === 'attente' ? t('legion.atelier.reponds') : t('legion.atelier.ecris')}
            disabled={!vue || statut === 'attente'}
            className="min-h-[44px] flex-1 resize-none rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-caption text-legion-ink outline-none focus:border-legion-gold disabled:opacity-50" />
          <button type="submit" disabled={!texte.trim() || travaille || statut === 'attente'} aria-label={t('legion.atelier.envoyer')}
            className="rounded-full bg-legion-gold p-2.5 text-legion-bg disabled:opacity-40"><IconSend size={18} /></button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-legion-bg text-legion-ink">
      {/* La barre : projet, mode, modèle, coût, Stop */}
      <div className="flex flex-wrap items-center gap-2 border-b border-legion-line bg-legion-card px-3 py-2">
        <select value={pid || ''} onChange={(e) => (e.target.value === '+' ? setPanneau('nouveau') : setPid(e.target.value))}
          aria-label={t('legion.atelier.projet')}
          className="max-w-[46vw] rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-caption text-legion-ink sm:max-w-[220px]">
          {!pid && <option value="">{t('legion.atelier.aucunProjet')}</option>}
          {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          <option value="+">+ {t('legion.atelier.nouveauProjet')}</option>
        </select>

        {vue && (
          <>
            <div className="flex overflow-hidden rounded-pill border border-legion-line text-[12px]" role="radiogroup" aria-label={t('legion.atelier.mode')}>
              {['demander', 'accepter', 'auto', 'reflechir'].map((m) => (
                <button key={m} type="button" role="radio" aria-checked={vue.mode === m} disabled={travaille} onClick={() => vue.mode !== m && changerMode(m)}
                  title={t(`legion.atelier.modeAide_${m}`)}
                  className={`px-3 py-1.5 font-semibold ${vue.mode === m ? 'bg-legion-gold text-legion-bg' : 'text-legion-muted'}`}>
                  {t(`legion.atelier.mode_${m}`)}
                </button>
              ))}
            </div>
            <select value={modele} onChange={(e) => { setModele(e.target.value); ecrire('atelier:modele', e.target.value); }} aria-label={t('legion.atelier.modele')}
              className="rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[12px] text-legion-ink">
              {['auto', ...(moi?.modeles || [])].map((m) => <option key={m} value={m}>{NOMS_MODELES[m] || m}</option>)}
            </select>

            <div className="min-w-[128px] flex-1 sm:flex-none" title={s ? t('legion.atelier.coutDetail', { modele: dollars(s.cout_modele, langue), machine: dollars(s.cout_machine, langue), appels: s.appels }) : ''}>
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="hidden text-legion-muted sm:inline">{t('legion.atelier.cout')}</span>
                <span className="font-semibold tabular-nums">{dollars(s?.cout, langue)} <span className="font-normal text-legion-muted">/ {dollars(s?.plafond, langue)}</span></span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-legion-line">
                <div className={`h-full ${part >= 0.8 ? 'bg-legion-danger' : 'bg-legion-gold'}`} style={{ width: `${part * 100}%` }} />
              </div>
            </div>

            <button type="button" onClick={stop} disabled={!travaille && statut !== 'attente'}
              className="ml-auto flex items-center gap-1.5 rounded-pill bg-legion-danger px-4 py-2 text-caption font-bold text-white shadow-md disabled:opacity-35">
              <IconPlayerStopFilled size={16} /> {t('legion.atelier.stop')}
            </button>
          </>
        )}
      </div>

      {vue && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-legion-line px-3 py-1.5 text-[12px]" style={{ scrollbarWidth: 'none' }}>
          {[
            [IconPresentation, t('legion.atelier.presenteMoi'), presenter, travaille || statut === 'attente'],
            [IconGitCompare, t('legion.atelier.modifications'), () => setPanneau('modifications'), false],
            [IconHistory, t('legion.atelier.journal'), () => setPanneau('journal'), false],
            [IconDownload, t('legion.atelier.exporter'), exporter, travaille],
            [IconPlus, t('legion.atelier.nouvelleSession'), nouvelleSession, travaille || statut === 'attente'],
          ].map(([Icone, label, fn, off]) => (
            <button key={label} type="button" onClick={fn} disabled={off}
              className="flex shrink-0 items-center gap-1 rounded-pill border border-legion-line px-3 py-1 text-legion-ink hover:border-legion-gold disabled:opacity-40">
              <Icone size={14} className="text-legion-gold" /> {label}
            </button>
          ))}
        </div>
      )}

      {(erreur || (s && ['arrete', 'plafond', 'erreur'].includes(statut) && s.raison)) && (
        <div className={`border-b border-legion-line px-3 py-1.5 text-[12px] ${erreur || statut === 'erreur' ? 'text-legion-danger' : 'text-legion-gold-soft'}`}>
          {erreur || s.raison}
        </div>
      )}

      {/* Ordinateur : trois colonnes. Téléphone : un onglet à la fois. */}
      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_400px]">
        <div className={`${onglet === 'fichiers' ? 'block' : 'hidden'} h-full min-h-0 border-legion-line bg-legion-panel lg:block lg:border-r`}>{colonneArbre}</div>
        <div className={`${onglet === 'editeur' || onglet === 'apercu' ? 'flex' : 'hidden'} h-full min-h-0 flex-col lg:flex`}>
          <div className="hidden shrink-0 gap-1 border-b border-legion-line px-3 py-1 lg:flex" role="tablist">
            {[[false, IconCode, t('legion.atelier.code')], [true, IconEye, t('legion.atelier.apercu')]].map(([v, Icone, label]) => (
              <button key={label} type="button" role="tab" aria-selected={apercuVisible === v} onClick={() => setOnglet(v ? 'apercu' : 'editeur')}
                className={`flex items-center gap-1 rounded-pill px-3 py-1 text-[12px] font-semibold ${apercuVisible === v ? 'bg-legion-gold text-legion-bg' : 'text-legion-muted hover:text-legion-ink'}`}>
                <Icone size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">{apercuVisible ? colonneApercu : colonneEditeur}</div>
          {console_}
        </div>
        <div className={`${onglet === 'conversation' ? 'block' : 'hidden'} h-full min-h-0 border-legion-line bg-legion-panel lg:block lg:border-l`}>{colonneConversation}</div>
      </div>

      <nav className="flex shrink-0 border-t border-legion-line bg-legion-card lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          ['fichiers', IconFiles, t('legion.atelier.fichiers')],
          ['editeur', IconCode, t('legion.atelier.editeur')],
          ['apercu', IconEye, t('legion.atelier.apercu')],
          ['conversation', IconMessages, t('legion.atelier.conversation')],
        ].map(([k, Icone, label]) => (
          <button key={k} type="button" onClick={() => setOnglet(k)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${onglet === k ? 'text-legion-gold' : 'text-legion-muted'}`}>
            <Icone size={19} /> {label}
            {k === 'conversation' && statut === 'attente' && onglet !== k && <span className="absolute right-[30%] top-1.5 h-2.5 w-2.5 rounded-full bg-legion-danger" />}
          </button>
        ))}
      </nav>

      {panneau === 'nouveau' && <NouveauProjet onCreer={creer} onFermer={() => setPanneau(null)} t={t} />}
      {panneau === 'modifications' && pid && <Modifications pid={pid} onFermer={() => setPanneau(null)} t={t} />}
      {panneau === 'journal' && pid && <Journal pid={pid} regles={vue?.regles} langue={langue} onRetirer={retirerRegle} onFermer={() => setPanneau(null)} t={t} />}
    </div>
  );
}
