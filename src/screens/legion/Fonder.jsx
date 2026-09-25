import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMoon, IconPlus } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { BoutonPalette } from './parties/Palette';
import { modeleTraduit, accueilEnAnglais } from './parties/modelesEn';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Field, TextInput, TextArea } from '../../components/Field';
import { Skeleton, ErrorState } from '../../components/states';
import { tailleDe, composer, horsEquipe, repartition, pourLaBase, estModifiee, choixVide, clePoste } from './parties/fonder/equipe';
import { VisagesModele, BandePostes, Organigramme, FichePoste, AjouterPoste, AideLeo, BoutonFonder } from './parties/fonder/Equipe';

// LEGION — fonder une entreprise d'agents.
//
// Beau, 22/09: on ne part pas d'une liste vide. On CHOISIT un modèle — un
// cabinet de conseil, un studio de cinéma, un laboratoire… — on règle la
// taille, on nomme, on dit le projet, et l'organigramme se déploie: chacun
// avec un nom, un visage, un poste, un mandat.
//
// Beau, 25/09 (audit de Léo): l'équipe se COMPOSE avant de fonder. Les
// visages défilent, chaque poste s'ouvre (voir, retirer, remettre, réécrire
// le mandat, le faire réécrire par Léo), on ajoute un métier du catalogue
// ou de sa main, on envoie un fichier, et Léo aide à composer. « Ce que
// c'est » se modifie. Le bouton Fonder dit ce qu'il fonde, puis ce qu'il
// fait. Le geste réel reste côté serveur (`legion_creer_entreprise`), qui
// reçoit l'équipe composée telle quelle. On ne fait pas semblant.

// L'effectif est un NOMBRE, pas une case: Beau — « c'est à moi de choisir
// selon ma taille, mon entreprise ». 10 000 est le plafond qu'il a dit.
const RACCOURCIS = [3, 25, 150, 1500, 10000];

// Les outils les plus courants; « D'autres ? » laisse écrire le reste.
const OUTILS = ['Excel', 'Google Sheets', 'Word', 'Google Docs', 'PowerPoint', 'WhatsApp', 'Gmail', 'Outlook', 'Notion', 'Trello', 'Slack', 'Microsoft Teams', 'Power BI', 'Tableau', 'Canva', 'Finjaro Accounting'];

// Un projet de site, d'application, de logiciel ou de place de marché arrive
// avec son équipe de DÉVELOPPEMENT, qui a le droit de coder dans l'atelier
// (Beau, 25/09 : « je crée une marketplace de voitures… il n'y a même pas
// d'agents spécialisés dans le développement web »). La création prend les
// postes du modèle dans l'ordre, jusqu'à l'effectif : une petite équipe
// n'arrivait jamais jusqu'aux développeurs. Vaut pour TOUTES les entreprises.
const PROJET_CODE = /\b(site|web|app|appli|application|logiciel|saas|market ?place|plateforme|e-?commerce|boutique en ligne|code|coder|d[ée]velopp|mobile|api)\w*/i;
const POSTE_CODE = /(d[ée]veloppeu|developer|int[ée]grateur|ing[ée]nieur (logiciel|web|mobile|d'int[ée]gration|de croissance|full)|technique|full.?stack|front.?end|back.?end|devops|tests automatis|programm)/i;
async function equiperDeveloppeurs(entrepriseId, texte) {
  if (!PROJET_CODE.test(texte)) return;
  try {
    const { data: agents } = await supabase.from('legion_agents').select('id, poste, cle').eq('entreprise_id', entrepriseId).is('user_id', null);
    const devs = (agents || []).filter((a) => POSTE_CODE.test(a.poste || ''));
    if (devs.length) {
      await supabase.from('legion_agents').update({ peut_coder: true }).in('id', devs.map((a) => a.id));
      return;
    }
    const graine = (c) => `https://api.dicebear.com/9.x/notionists/svg?seed=${entrepriseId}-${c}`;
    await supabase.from('legion_agents').insert([
      { entreprise_id: entrepriseId, cle: 'developpeuse-web', nom: 'Awa Mensah', poste: 'Développeuse web full-stack', departement: 'Développement',
        mandat: "Construit le site et l'application dans l'atelier de code : pages, base de données, paiement, tests. Rien ne part en ligne sans le Confirmer du fondateur.",
        avatar_url: graine('developpeuse-web'), couleur: '#2A9D8F', est_directeur: true, actif: true, ordre: 40, autonomie: 'supervise', peut_coder: true },
      { entreprise_id: entrepriseId, cle: 'testeur-qualite', nom: 'Idris Kamga', poste: 'Testeur qualité', departement: 'Développement',
        mandat: "Relit et teste chaque modification avant qu'elle soit acceptée : ce qui marche, ce qui casse, sur téléphone et sur ordinateur.",
        avatar_url: graine('testeur-qualite'), couleur: '#6366F1', est_directeur: false, actif: true, ordre: 41, autonomie: 'supervise', peut_coder: false },
    ]);
    await supabase.from('legion_canaux').insert({ entreprise_id: entrepriseId, cle: 'developpement', nom: 'Développement', a_quoi_ca_sert: 'Le code du projet : le site, l’application, les tests.', emoji: '💻', ordre: 30 });
  } catch { /* l'entreprise existe déjà ; l'équipe de code s'ajoute aussi depuis le catalogue */ }
}

async function passerEnAnglais(entrepriseId) {
  await supabase.from('legion_entreprises').update({ langue: 'en' }).eq('id', entrepriseId);
  const { data: mots } = await supabase.from('legion_messages').select('id, texte').eq('entreprise_id', entrepriseId).eq('genre', 'question').is('user_id', null).limit(3);
  for (const m of mots || []) {
    const en = accueilEnAnglais(m.texte);
    if (en) await supabase.from('legion_messages').update({ texte: en }).eq('id', m.id);
  }
}

// Une fonction edge qui refuse (400, 429) met son explication dans le corps ;
// le client ne la lit pas tout seul.
async function lisible(err) {
  try { const j = await err?.context?.json(); if (j?.erreur) return new Error(j.erreur); } catch { /* pas de corps */ }
  return err;
}

// Un titre d'étape : le numéro dans une pastille, le mot en capitales.
function Etape({ n, titre }) {
  return (
    <div className="mt-7 flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-legion-gold text-[12px] font-extrabold text-legion-bg">{n}</span>
      <p className="text-[12px] font-bold uppercase tracking-wider text-legion-muted">{String(titre).replace(/^\d+\.\s*/, '')}</p>
    </div>
  );
}

export default function Fonder() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  useFondLegion();
  const toast = useToast();
  const navigate = useNavigate();
  const [modele, setModele] = useState(null);
  const [effectif, setEffectif] = useState(25);
  const [nom, setNom] = useState('');
  const [projet, setProjet] = useState('');
  // Beau, 23/09: « je choisis mon entreprise ou mon projet, je dis qui je
  // suis, ce que je veux ». Les agents le lisent avec le projet.
  const [quiJeSuis, setQuiJeSuis] = useState('');
  const [objectif, setObjectif] = useState('');
  // « Tes outils » (E1, 23/09): Excel, WhatsApp, Notion… Les agents le lisent
  // avec le projet et rendent leurs livrables dans ces formats.
  const [outils, setOutils] = useState([]);
  const [autresOutils, setAutresOutils] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [secteur, setSecteur] = useState('');
  const [generation, setGeneration] = useState(false);
  const [generationErreur, setGenerationErreur] = useState('');
  const [filtre, setFiltre] = useState('');
  const [tous, setTous] = useState(false);
  // L'équipe composée : ce qu'on a retiré, ajouté, réécrit — par rapport au
  // modèle. Remis à zéro quand on change de modèle.
  const [choix, setChoix] = useState(choixVide);
  const [concept, setConcept] = useState('');
  const [complets, setComplets] = useState({});
  const [fiche, setFiche] = useState(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  // Un nouveau modèle, écrit pour le secteur décrit; puis la liste se
  // recharge et le modèle est sélectionné.
  async function genererModele(e) {
    e.preventDefault();
    if (generation || secteur.trim().length < 3) return;
    setGeneration(true); setGenerationErreur('');
    try {
      const { data: r, error: err } = await supabase.functions.invoke('legion-modele', { body: { secteur: secteur.trim() } });
      if (err) throw await lisible(err);
      if (r?.erreur) throw new Error(r.erreur);
      try { localStorage.removeItem('legion:modeles:v3'); } catch { /* sans stockage */ }
      await retry();
      setSecteur('');
      setTimeout(() => { const m = document.querySelector(`[data-modele="${r.cle}"]`); if (m) { m.click(); m.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 300);
    } catch (e2) {
      setGenerationErreur(e2.message || t('errors.generic'));
    } finally { setGeneration(false); }
  }

  const { data, loading, error, retry } = useAsync(async () => {
    // La base ne rend que 1 000 lignes par demande, et les 54 secteurs en
    // ont plus de 3 000: on les lit par pages, sinon la plupart des secteurs
    // s'affichaient sans leurs métiers.
    const lirePostes = async () => {
      const tout = [];
      for (let de = 0; de < 20000; de += 1000) {
        const { data: page, error: e } = await supabase.from('studio_modele_postes')
          .select('modele, departement, poste, des_la_taille, a_ecrire, est_directeur').order('modele').order('ordre').range(de, de + 999);
        if (e) throw e;
        tout.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      return tout;
    };
    const [m, postes] = await Promise.all([
      supabase.from('studio_modeles').select('*').eq('actif', true).order('ordre'),
      lirePostes(),
    ]);
    if (m.error) throw m.error;
    return { modeles: m.data || [], postes };
  }, [], { cacheKey: 'legion:modeles:v3' });

  // Les postes complets (mandat, poids, clé au catalogue) du modèle choisi,
  // lus quand on le choisit — les 3 880 mandats ne se chargent pas d'avance.
  const cleModele = modele?.cle;
  useEffect(() => {
    if (!cleModele || complets[cleModele]) return undefined;
    let vivant = true;
    supabase.from('studio_modele_postes').select('departement, poste, mandat, des_la_taille, a_ecrire, est_directeur, poids, agent_cle, ordre')
      .eq('modele', cleModele).order('ordre').range(0, 999)
      .then(({ data: rows }) => { if (vivant && rows) setComplets((c) => ({ ...c, [cleModele]: rows })); });
    return () => { vivant = false; };
  }, [cleModele]); // eslint-disable-line react-hooks/exhaustive-deps

  // Après useAsync: la liste filtrée lit `data`. Placée avant, elle
  // faisait planter la page (« Cannot access before initialization »):
  // la page « Fonder » restait blanche. Vu par Beau le 23/09.
  const plat = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const postesParModele = useMemo(() => {
    const m = {};
    for (const p of data?.postes || []) (m[p.modele] ||= []).push(p);
    return m;
  }, [data]);
  const modelesFiltres = (data?.modeles || []).map((m) => modeleTraduit(m, i18n.language)).filter((m) => {
    if (modele?.cle === m.cle) return true;
    const q = plat(filtre.trim());
    return !q || plat(`${m.nom} ${m.promesse} ${m.niveau} ${m.secteur_demande || ''}`).includes(q);
  });
  const modelesVisibles = tous || filtre.trim() ? modelesFiltres : modelesFiltres.slice(0, 12);

  // L'équipe qu'on obtient vraiment, et combien de personnes par poste —
  // la même règle que la base (equipe.js).
  const postesModele = (modele && (complets[modele.cle] || postesParModele[modele.cle])) || [];
  const equipe = useMemo(() => (modele ? composer(postesModele, effectif, choix) : []), [modele, postesModele, effectif, choix]);
  const dehors = useMemo(() => (modele ? horsEquipe(postesModele, effectif, choix) : []), [modele, postesModele, effectif, choix]);
  const personnes = Math.max(Number(effectif) || 1, equipe.length);
  const repartis = useMemo(() => repartition(equipe, personnes), [equipe, personnes]);
  const departements = useMemo(() => [...new Set(equipe.map((p) => p.departement).filter(Boolean))], [equipe]);

  if (loading) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><ErrorState onRetry={retry} /></div>;
  if (!data) return null;

  function choisirModele(m) {
    setModele(m); setChoix(choixVide()); setConcept(m.concept || ''); setFiche(null);
  }
  // « Déjà là » = dans l'équipe telle qu'elle est (un poste du modèle coupé
  // par l'effectif n'y est pas : le remettre, c'est l'ajouter par-dessus).
  const dansLEquipe = (k) => equipe.some((x) => clePoste(x.poste) === k);
  function retirer(p) {
    const k = clePoste(p.poste);
    setChoix((c) => (p.ajoute
      ? { ...c, ajoutes: c.ajoutes.filter((a) => clePoste(a.poste) !== k) }
      : { ...c, retires: { ...c.retires, [k]: true } }));
  }
  function ajouter(p) {
    const k = clePoste(p.poste);
    if (!k) return;
    setChoix((c) => {
      const retires = { ...c.retires }; delete retires[k];
      const deja = c.ajoutes.some((a) => clePoste(a.poste) === k) || (!c.retires[k] && dansLEquipe(k));
      return { ...c, retires, ajoutes: deja ? c.ajoutes : [...c.ajoutes, p] };
    });
  }
  const changerMandat = (p, mandat) => setChoix((c) => ({ ...c, mandats: { ...c.mandats, [clePoste(p.poste)]: mandat } }));
  function appliquer({ ajouter: plus, retirer: moins, modifier }) {
    setChoix((c) => {
      const n = { retires: { ...c.retires }, ajoutes: [...c.ajoutes], mandats: { ...c.mandats } };
      for (const poste of moins) { const k = clePoste(poste); n.retires[k] = true; n.ajoutes = n.ajoutes.filter((a) => clePoste(a.poste) !== k); }
      for (const p of plus) { const k = clePoste(p.poste); const etaitRetire = !!n.retires[k]; delete n.retires[k]; if (!n.ajoutes.some((a) => clePoste(a.poste) === k) && (etaitRetire || !dansLEquipe(k))) n.ajoutes.push(p); }
      for (const m of modifier) n.mandats[clePoste(m.poste)] = m.mandat;
      return n;
    });
    toast.success(t('legion.fonderEquipe.applique', { a: plus.length, r: moins.length, m: modifier.length }));
  }
  async function demanderLeo(consigne, texte = '') {
    const { data: r, error: err } = await supabase.functions.invoke('legion-modele', {
      body: { mode: 'postes', consigne, texte, langue: i18n.language, modele_nom: modele?.nom || '', existants: equipe.map((p) => ({ departement: p.departement, poste: p.poste })) },
    });
    if (err) throw await lisible(err);
    if (r?.erreur) throw new Error(r.erreur);
    return r;
  }

  async function fonder() {
    if (!modele || !user) return;
    setEnvoi(true);
    try {
      const et = (k) => t(`legion.projetEtiquettes.${k}`);
      const conceptModifie = concept.trim() && concept.trim() !== String(modele.concept || '').trim();
      const args = {
        p_nom: nom.trim(), p_modele: modele.cle, p_taille: tailleDe(personnes),
        p_projet: [projet.trim(), quiJeSuis.trim() && `${et('qui')} : ${quiJeSuis.trim()}`, objectif.trim() && `${et('objectif')} : ${objectif.trim()}`,
          (outils.length || autresOutils.trim()) && `${et('outils')} : ${[...outils, ...autresOutils.split(',').map((x) => x.trim()).filter(Boolean)].join(', ')} (${et('outilsNote')})`,
          conceptModifie && `${et('concept')} : ${concept.trim()}`].filter(Boolean).join('\n') || null,
        p_effectif: Math.max(1, Math.min(10000, personnes)),
      };
      // L'équipe composée ne part que si elle diffère du modèle : sinon la
      // base fait exactement ce qu'elle a toujours fait.
      if (estModifiee(choix)) args.p_postes = pourLaBase(equipe);
      const { data: id, error: err } = await supabase.rpc('legion_creer_entreprise', args);
      if (err) throw err;
      // La langue de l'équipe = celle de l'écran au moment de fonder (Beau, 25/09 : compte en anglais,
      // mais toute l'équipe répondait en français). Le mot d'accueil, écrit en français par la base,
      // est remis en anglais.
      if (String(i18n.language || '').startsWith('en')) await passerEnAnglais(id);
      await equiperDeveloppeurs(id, `${nom} ${projet} ${objectif} ${modele.cle} ${modele.nom || ''}`);
      // Les agents choisissent leurs compétences dès l'arrivée (Beau: « chaque
      // type d'entreprise arrive avec ses agents et leurs compétences »), et,
      // depuis le 25/09, leur nom et — pour les directeurs — leur vraie photo
      // (« ils prennent leurs photos réelles et choisissent leur nom »).
      navigate(`/legion/${id}?equiper=1&arrivee=1`);
    } catch (e) { toast.error(e.message || t('errors.generic')); setEnvoi(false); }
  }

  const ficheDansEquipe = fiche ? equipe.some((p) => clePoste(p.poste) === clePoste(fiche.poste)) : false;

  return (
    // h-dvh + overflow-y-auto, pas min-h-dvh: le <body> de l'application
    // ne défile jamais (global.css), c'est la page qui doit porter son
    // propre défilement. Beau, 22/09: « je clique, je suis collé ici, je ne
    // monte pas, je ne descends pas ».
    <div className="legion-app h-dvh overflow-y-auto bg-legion-bg pb-24 text-legion-ink">
      {/* L'en-tête sombre de Legion, pas celui, crème, de la place de marché. */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-legion-line bg-legion-panel/95 px-4 backdrop-blur">
        <Link to="/legion" aria-label={t('common.back')} className="rounded-full p-1 text-legion-muted hover:text-legion-ink"><IconArrowLeft size={20} /></Link>
        <img src="/logos/leo.png" alt="Léo" className="h-8 w-8 rounded-input object-cover" />
        <h1 className="min-w-0 flex-1 truncate text-body font-semibold">{t('legion.fonder')}</h1>
        <BoutonPalette t={t} />
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <p className="text-body text-legion-muted">{t('legion.fonderIntro')}</p>

        {/* 1. Le modèle */}
        <Etape n={1} titre={t('legion.etapeModele')} />
        {/* Cinquante secteurs et plus (22/09): un champ pour chercher le sien,
            et la liste ne s'étale pas — douze cartes, puis « voir tous ». */}
        <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder={t('legion.chercherSecteur', { n: data.modeles.length, defaultValue: 'Chercher parmi {{n}} secteurs…' })}
          className="input mt-2 w-full" />
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {modelesVisibles.map((m) => {
            const ps = postesParModele[m.cle] || [];
            const aEcrire = ps.filter((p) => p.a_ecrire).length;
            const choisi = modele?.cle === m.cle;
            return (
              <li key={m.cle}>
                <button type="button" onClick={() => choisirModele(m)} data-modele={m.cle} aria-pressed={choisi}
                  className={`flex w-full flex-col gap-2 rounded-card border p-3 text-left transition ${
                    choisi ? 'border-legion-gold bg-legion-gold/15 shadow-[0_0_0_1px_rgb(var(--leo-gold))]' : 'border-legion-line bg-legion-card hover:border-legion-gold/50'}`}>
                  <span className="flex items-center gap-3">
                    <VisagesModele modele={m.cle} postes={ps} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-bold text-legion-ink">{m.nom}</span>
                      <span className="block text-[11px] text-legion-muted">
                        {t('legion.postesCatalogue', { n: ps.length - aEcrire })}
                        {' · '}{t('legion.departements', { n: new Set(ps.map((p) => p.departement)).size })}
                        {aEcrire > 0 && <> · <IconMoon size={11} className="inline" /> {t('legion.postesAEcrire', { n: aEcrire })}</>}
                      </span>
                    </span>
                  </span>
                  <span className="block text-caption leading-snug text-legion-muted">{m.promesse}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {!tous && !filtre.trim() && modelesFiltres.length > 12 && (
          <button type="button" onClick={() => setTous(true)} className="mt-2 w-full rounded-card border border-legion-line py-2 text-caption font-semibold text-legion-gold hover:bg-legion-card">
            {t('legion.voirTousModeles', { n: modelesFiltres.length, defaultValue: 'Voir les {{n}} secteurs' })}
          </button>
        )}
        {filtre.trim() && modelesFiltres.length === 0 && (
          <p className="mt-2 text-caption text-legion-muted">{t('legion.aucunSecteur', 'Aucun secteur ne correspond — décris-le ci-dessous, Léo l’écrit.')}</p>
        )}

        {/* Ton secteur n'est pas là ? Beau, 22/09: « il y a des milliers de
            services ». On décrit le secteur, Legion écrit l'organigramme
            (fonction legion-modele), et il entre au catalogue pour tous. */}
        <form onSubmit={genererModele} className="mt-3 rounded-card border border-legion-line bg-legion-card/60 p-3">
          <p className="text-caption font-semibold text-legion-ink">{t('legion.autreSecteurTitre', 'Ton secteur n’est pas là ?')}</p>
          <p className="mt-0.5 text-caption text-legion-muted">{t('legion.autreSecteurAide', 'Décris-le en quelques mots : Léo écrit les départements et les métiers, avec leur mandat.')}</p>
          <div className="mt-2 flex gap-2">
            <input value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder={t('legion.autreSecteurPlaceholder', 'Opérateur télécom, clinique privée, salon de coiffure…')}
              className="input min-w-0 flex-1" maxLength={160} />
            <button type="submit" disabled={generation || secteur.trim().length < 3}
              className="shrink-0 rounded-input bg-legion-gold px-3 py-2 text-caption font-semibold text-legion-bg disabled:opacity-50">
              {generation ? t('legion.autreSecteurEnCours', 'Écriture… (1 min)') : t('legion.autreSecteurBouton', 'Créer le modèle')}
            </button>
          </div>
          {generationErreur && <p className="mt-2 text-caption text-legion-danger">{generationErreur}</p>}
        </form>

        {modele && (
          <>
            {/* Le concept: c'est quoi, comment c'est organisé, combien de gens
                d'habitude. Beau: « un cabinet de conseil c'est quoi le concept,
                combien de personnes, qui y travaille ». Depuis le 25/09, il
                se modifie : c'est la version de la personne, pas du catalogue. */}
            {(modele.concept || modele.effectifs) && (
              <div className="mt-4 rounded-card border border-legion-line bg-legion-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.conceptTitre')}</p>
                <TextArea value={concept} onChange={(e) => setConcept(e.target.value)} rows={4} maxLength={1500}
                  className="mt-1 min-h-[80px] border-transparent bg-transparent px-0 py-1 text-body leading-relaxed text-legion-ink focus:border-legion-gold" />
                <p className="text-[11px] text-legion-muted">{t('legion.fonderEquipe.conceptAide')}</p>
                {modele.effectifs && (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.effectifsTitre')}</p>
                    <p className="mt-1 text-body text-legion-ink">{modele.effectifs}</p>
                  </>
                )}
              </div>
            )}

            {/* 2. L'équipe — l'effectif (un nombre, à lui de choisir), puis
                les gens qu'on obtient vraiment, un par un. */}
            <Etape n={2} titre={t('legion.fonderEquipe.etapeEquipe')} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {RACCOURCIS.map((n) => (
                <button key={n} type="button" onClick={() => setEffectif(n)}
                  className={`rounded-pill px-3 py-1 text-caption font-semibold ${
                    Number(effectif) === n ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>
                  {n.toLocaleString(i18n.language)}
                </button>
              ))}
              <input type="number" min={1} max={10000} inputMode="numeric" value={effectif}
                onChange={(e) => setEffectif(e.target.value)} aria-label={t('legion.etapeEffectif')}
                className="input w-28" />
            </div>
            <p className="mt-1 text-caption text-legion-muted">{t('legion.effectifAide')}</p>

            <div className="mt-3 rounded-card border border-legion-line bg-legion-card p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-body font-bold text-legion-ink">
                  {t('legion.apercuEffectif', { metiers: equipe.length, personnes })}
                  {estModifiee(choix) && <span className="ml-2 rounded-pill bg-legion-teal/15 px-2 py-0.5 text-[11px] font-semibold text-legion-teal">✎</span>}
                </p>
                <button type="button" onClick={() => setAjoutOuvert(true)} className="inline-flex items-center gap-1.5 rounded-input bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg hover:brightness-110">
                  <IconPlus size={14} /> {t('legion.fonderEquipe.ajouter')}
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-legion-muted">{t('legion.fonderEquipe.bande')}</p>
              <BandePostes modele={modele.cle} equipe={equipe} repartis={repartis} onOuvrir={setFiche} t={t} />
              <Organigramme equipe={equipe} dehors={dehors} repartis={repartis} onOuvrir={setFiche} onRemettre={ajouter} t={t} />
            </div>

            <AideLeo demanderLeo={demanderLeo} onAppliquer={appliquer} t={t} />

            {/* 3. Le nom, le projet */}
            <Etape n={3} titre={t('legion.fonderEquipe.etapeEntreprise')} />
            <div className="mt-2 space-y-3">
              <Field label={t('legion.nomEntreprise')} required>
                {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t('legion.nomExemple')} />}
              </Field>
              <Field label={t('legion.quiJeSuis', 'Qui es-tu ?')} hint={t('legion.quiJeSuisAide', 'Ex. : fondateur d’une boutique en ligne, étudiante en droit, comptable indépendant…')}>
                {(id) => <TextInput id={id} value={quiJeSuis} maxLength={200} onChange={(e) => setQuiJeSuis(e.target.value)} />}
              </Field>
              <Field label={t('legion.objectif', 'Ce que tu veux obtenir')} hint={t('legion.objectifAide', 'Ex. : 300 clients d’ici fin octobre, réussir mes examens, lancer mon application.')}>
                {(id) => <TextInput id={id} value={objectif} maxLength={300} onChange={(e) => setObjectif(e.target.value)} />}
              </Field>
              <Field label={t('legion.outils', 'Tes outils de travail')} hint={t('legion.outilsAide', 'Les agents rendent leurs livrables dans ces formats : un tableau pour Excel, un message court pour WhatsApp…')}>
                {(id) => (
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {OUTILS.map((o) => {
                        const pris = outils.includes(o);
                        return (
                          <button key={o} type="button" aria-pressed={pris} onClick={() => setOutils((x) => (pris ? x.filter((y) => y !== o) : [...x, o]))}
                            className={`rounded-pill px-2.5 py-1 text-[13px] font-semibold transition ${pris ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted hover:text-legion-ink'}`}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                    <TextInput id={id} value={autresOutils} maxLength={200} onChange={(e) => setAutresOutils(e.target.value)} placeholder={t('legion.outilsAutres', 'D’autres ? (séparés par des virgules)')} className="mt-2" />
                  </div>
                )}
              </Field>
              <Field label={t('legion.projet')} hint={t('legion.projetAide')}>
                {(id) => <TextArea id={id} rows={3} value={projet} onChange={(e) => setProjet(e.target.value)} />}
              </Field>
              <BoutonFonder nom={nom.trim()} personnes={personnes} metiers={equipe.length} envoi={envoi} disabled={nom.trim() === '' || !user} onClick={fonder} t={t} />
              {!user && <p className="text-caption text-legion-muted">{t('legion.connecteToi')}</p>}
            </div>
          </>
        )}
      </div>

      {fiche && modele && (
        <FichePoste poste={fiche} modele={modele.cle} dansEquipe={ficheDansEquipe} n={repartis[clePoste(fiche.poste)] || 1}
          onFermer={() => setFiche(null)} onRetirer={retirer} onRemettre={ajouter} onMandat={changerMandat} demanderLeo={demanderLeo} t={t} />
      )}
      {ajoutOuvert && modele && (
        <AjouterPoste catalogue={data.postes} modeles={data.modeles} departements={departements} existants={equipe}
          onAjouter={(p) => { ajouter(p); setAjoutOuvert(false); }} onFermer={() => setAjoutOuvert(false)} t={t} />
      )}
    </div>
  );
}
