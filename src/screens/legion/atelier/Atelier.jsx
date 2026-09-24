import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconPlayerStopFilled, IconDownload, IconHistory, IconGitCompare, IconPresentation, IconSend, IconPlus, IconDeviceFloppy, IconFiles, IconCode, IconMessages, IconLoader2 } from '@tabler/icons-react';
import { appel, ErreurAtelier } from './api';
import { construireArbre, dollars } from './arbre';
import { Arbre, Carte, Modifications, Journal, NouveauProjet } from './Parties';

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

export default function Atelier({ t, langue = 'fr' }) {
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
  const nbActions = vue?.affichage?.length || 0;
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
  const decider = (choix) => agir(() => appel(`/projets/${pid}/decision`, { methode: 'POST', corps: { demande_id: vue.demande.id, choix } }));
  const presenter = () => { setOnglet('conversation'); agir(() => appel(`/projets/${pid}/presenter`, { methode: 'POST', corps: { texte: t('legion.atelier.presenteMoiTexte') } })); };
  // Stop passe même quand une requête est en cours : c'est le but.
  const stop = async () => { try { setVue(await appel(`/projets/${pid}/stop`, { methode: 'POST', corps: {} })); } catch (e) { signaler(e); } };
  const changerMode = (mode) => agir(() => appel(`/projets/${pid}/mode`, { methode: 'POST', corps: { mode } }));
  const nouvelleSession = () => { if (window.confirm(t('legion.atelier.nouvelleSessionConfirmer'))) agir(() => appel(`/projets/${pid}/session`, { methode: 'POST', corps: {} })); };
  const retirerRegle = (id) => agir(() => appel(`/projets/${pid}/regles/${id}`, { methode: 'DELETE' }));

  async function ouvrir(chemin) {
    try {
      const r = await appel(`/projets/${pid}/fichier?chemin=${encodeURIComponent(chemin)}`);
      setFichier({ chemin: r.chemin, contenu: r.contenu, brouillon: r.contenu });
      setOnglet('editeur');
    } catch (e) { signaler(e); }
  }
  const enregistrer = () => fichier && agir(async () => {
    const r = await appel(`/projets/${pid}/fichier`, { methode: 'PUT', corps: { chemin: fichier.chemin, contenu: fichier.brouillon } });
    setFichier((f) => ({ ...f, contenu: f.brouillon }));
    return r;
  });

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
      {fichier ? (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-legion-line px-3 py-1.5">
            <span className="min-w-0 truncate font-mono text-[12px] text-legion-ink">{fichier.chemin}{sale ? ' •' : ''}</span>
            <button type="button" onClick={enregistrer} disabled={!sale || travaille}
              className="flex shrink-0 items-center gap-1 rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-40">
              <IconDeviceFloppy size={14} /> {t('legion.atelier.enregistrer')}
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Suspense fallback={<div className="p-4 text-caption text-legion-muted">…</div>}>
              <Editeur chemin={fichier.chemin} valeur={fichier.brouillon} lectureSeule={travaille}
                onChange={(v) => setFichier((f) => (f ? { ...f, brouillon: v } : f))} />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center text-caption text-legion-muted">{t('legion.atelier.choisisUnFichier')}</div>
      )}
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
        ) : (
          <div key={a.id} className={`max-w-[92%] whitespace-pre-wrap rounded-card px-3 py-2 text-caption ${a.qui === 'humain' ? 'ml-auto bg-legion-accent text-white' : a.qui === 'agent' ? 'bg-legion-card text-legion-ink' : 'mx-auto border border-legion-gold/40 text-center text-legion-gold-soft'}`}>
            {a.texte}
          </div>
        )))}
        {travaille && statut !== 'attente' && (
          <p className="flex items-center gap-2 px-1 text-[12px] text-legion-muted"><IconLoader2 size={14} className="animate-spin" /> {t('legion.atelier.travaille')}</p>
        )}
        <Carte demande={vue?.demande} occupe={occupe} onDecider={decider} t={t} />
        <div ref={fin} />
      </div>
      <form onSubmit={envoyer} className="border-t border-legion-line p-2">
        <div className="flex items-end gap-2">
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
              {['demander', 'reflechir'].map((m) => (
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
        <div className={`${onglet === 'editeur' ? 'block' : 'hidden'} h-full min-h-0 lg:block`}>{colonneEditeur}</div>
        <div className={`${onglet === 'conversation' ? 'block' : 'hidden'} h-full min-h-0 border-legion-line bg-legion-panel lg:block lg:border-l`}>{colonneConversation}</div>
      </div>

      <nav className="flex shrink-0 border-t border-legion-line bg-legion-card lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          ['fichiers', IconFiles, t('legion.atelier.fichiers')],
          ['editeur', IconCode, t('legion.atelier.editeur')],
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
