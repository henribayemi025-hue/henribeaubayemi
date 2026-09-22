import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconArrowLeft, IconMoon } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea } from '../../components/Field';
import { Skeleton, ErrorState } from '../../components/states';

// LEGION — fonder une entreprise d'agents.
//
// Beau, 22/09: on ne part pas d'une liste vide. On CHOISIT un modèle — un
// cabinet de conseil, un studio de cinéma, un laboratoire… — on règle la
// taille, on nomme, on dit le projet, et l'organigramme se déploie: chacun
// avec un nom, un visage, un poste, un mandat.
//
// Le geste réel est côté serveur (`legion_creer_entreprise`): cet écran ne
// fait que poser les quatre questions. Il montre aussi, AVANT de fonder, ce
// que le modèle contient vraiment à chaque taille — y compris les postes qui
// n'ont pas encore d'agent dans le catalogue. On ne fait pas semblant.

const TAILLES = ['cocon', 'startup', 'scaleup', 'megacorp'];
// L'effectif est un NOMBRE, pas une case: Beau — « c'est à moi de choisir
// selon ma taille, mon entreprise ». 10 000 est le plafond qu'il a dit.
const RACCOURCIS = [3, 25, 150, 1500, 10000];
// Regroupe les postes par département, dans l'ordre où le modèle les donne
// (directeurs en premier). Pour lire un organigramme, pas une liste.
function parDepartement(postes) {
  const m = new Map();
  for (const p of postes) {
    if (!m.has(p.departement)) m.set(p.departement, { nom: p.departement, postes: [] });
    m.get(p.departement).postes.push(p);
  }
  return [...m.values()];
}
const tailleDe = (n) => (n <= 5 ? 'cocon' : n <= 40 ? 'startup' : n <= 300 ? 'scaleup' : 'megacorp');

export default function Fonder() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useFondLegion();
  const toast = useToast();
  const navigate = useNavigate();
  const [modele, setModele] = useState(null);
  const [effectif, setEffectif] = useState(25);
  const [nom, setNom] = useState('');
  const [projet, setProjet] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [secteur, setSecteur] = useState('');
  const [generation, setGeneration] = useState(false);
  const [generationErreur, setGenerationErreur] = useState('');
  const [filtre, setFiltre] = useState('');
  const [tous, setTous] = useState(false);
  const plat = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const modelesFiltres = (data?.modeles || []).filter((m) => {
    if (modele?.cle === m.cle) return true;
    const q = plat(filtre.trim());
    return !q || plat(`${m.nom} ${m.promesse} ${m.niveau} ${m.secteur_demande || ''}`).includes(q);
  });
  const modelesVisibles = tous || filtre.trim() ? modelesFiltres : modelesFiltres.slice(0, 12);

  // Un nouveau modèle, écrit pour le secteur décrit; puis la liste se
  // recharge et le modèle est sélectionné.
  async function genererModele(e) {
    e.preventDefault();
    if (generation || secteur.trim().length < 3) return;
    setGeneration(true); setGenerationErreur('');
    try {
      const { data: r, error: err } = await supabase.functions.invoke('legion-modele', { body: { secteur: secteur.trim() } });
      if (err) throw err;
      if (r?.erreur) throw new Error(r.erreur);
      try { localStorage.removeItem('legion:modeles:v2'); } catch { /* sans stockage */ }
      await retry();
      setSecteur('');
      setTimeout(() => { const m = document.querySelector(`[data-modele="${r.cle}"]`); if (m) { m.click(); m.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 300);
    } catch (e2) {
      setGenerationErreur(e2.message || t('errors.generic'));
    } finally { setGeneration(false); }
  }

  const { data, loading, error, retry } = useAsync(async () => {
    const [m, p] = await Promise.all([
      supabase.from('studio_modeles').select('*').eq('actif', true).order('ordre'),
      supabase.from('studio_modele_postes').select('modele, departement, poste, des_la_taille, a_ecrire, est_directeur').order('ordre'),
    ]);
    if (m.error) throw m.error;
    return { modeles: m.data || [], postes: p.data || [] };
  }, [], { cacheKey: 'legion:modeles:v2' });

  if (loading) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <div className="legion-app min-h-dvh bg-legion-bg p-4"><ErrorState onRetry={retry} /></div>;
  if (!data) return null;

  const taille = tailleDe(Number(effectif) || 1);
  const niveau = TAILLES.indexOf(taille);
  const postesDu = (cle) => data.postes.filter((p) => p.modele === cle && TAILLES.indexOf(p.des_la_taille) <= niveau);

  async function fonder() {
    if (!modele || !user) return;
    setEnvoi(true);
    try {
      const { data: id, error: err } = await supabase.rpc('legion_creer_entreprise', {
        p_nom: nom.trim(), p_modele: modele.cle, p_taille: taille, p_projet: projet.trim() || null,
        p_effectif: Math.max(1, Math.min(10000, Number(effectif) || 1)),
      });
      if (err) throw err;
      navigate(`/legion/${id}`);
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  return (
    // h-dvh + overflow-y-auto, pas min-h-dvh: le <body> de l'application
    // ne défile jamais (global.css), c'est la page qui doit porter son
    // propre défilement. Beau, 22/09: « je clique, je suis collé ici, je ne
    // monte pas, je ne descends pas ».
    <div className="legion-app h-dvh overflow-y-auto bg-legion-bg pb-24 text-legion-ink">
      {/* L'en-tête sombre de Legion, pas celui, crème, de la place de marché. */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-legion-line bg-legion-panel/95 px-4 backdrop-blur">
        <Link to="/legion" aria-label={t('common.back')} className="rounded-full p-1 text-legion-muted hover:text-legion-ink"><IconArrowLeft size={20} /></Link>
        <img src="/logos/legion.png" alt="Legion" className="h-8 w-8 rounded-input object-cover" />
        <h1 className="text-body font-semibold">{t('legion.fonder')}</h1>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <p className="text-body text-legion-muted">{t('legion.fonderIntro')}</p>

        {/* 1. Le modèle */}
        <p className="mt-5 text-caption font-semibold uppercase tracking-wider text-legion-muted">{t('legion.etapeModele')}</p>
        {/* Cinquante secteurs et plus (22/09): un champ pour chercher le sien,
            et la liste ne s'étale pas — douze cartes, puis « voir tous ». */}
        <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder={t('legion.chercherSecteur', { n: data.modeles.length, defaultValue: 'Chercher parmi {{n}} secteurs…' })}
          className="input mt-2 w-full" />
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {modelesVisibles.map((m) => {
            const ps = data.postes.filter((p) => p.modele === m.cle);
            const aEcrire = ps.filter((p) => p.a_ecrire).length;
            const choisi = modele?.cle === m.cle;
            return (
              <li key={m.cle}>
                <button type="button" onClick={() => setModele(m)} data-modele={m.cle}
                  className={`flex w-full items-start gap-3 rounded-card border p-3 text-left ${
                    choisi ? 'border-legion-gold bg-legion-gold/15' : 'border-legion-line bg-legion-card'}`}>
                  <span className="text-title">{m.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-legion-ink">{m.nom}</span>
                    <span className="block text-caption text-legion-muted">{m.promesse}</span>
                    <span className="mt-1 block text-caption text-legion-muted">
                      {t('legion.postesCatalogue', { n: ps.length - aEcrire })}
                      {' · '}{t('legion.departements', { n: new Set(ps.map((p) => p.departement)).size })}
                      {aEcrire > 0 && <> · <IconMoon size={11} className="inline" /> {t('legion.postesAEcrire', { n: aEcrire })}</>}
                    </span>
                  </span>
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
          <p className="mt-2 text-caption text-legion-muted">{t('legion.aucunSecteur', 'Aucun secteur ne correspond — décris-le ci-dessous, Legion l’écrit.')}</p>
        )}

        {/* Ton secteur n'est pas là ? Beau, 22/09: « il y a des milliers de
            services ». On décrit le secteur, Legion écrit l'organigramme
            (fonction legion-modele), et il entre au catalogue pour tous. */}
        <form onSubmit={genererModele} className="mt-3 rounded-card border border-dashed border-legion-line bg-legion-card/60 p-3">
          <p className="text-caption font-semibold text-legion-ink">{t('legion.autreSecteurTitre', 'Ton secteur n’est pas là ?')}</p>
          <p className="mt-0.5 text-caption text-legion-muted">{t('legion.autreSecteurAide', 'Décris-le en quelques mots : Legion écrit les départements et les métiers, avec leur mandat.')}</p>
          <div className="mt-2 flex gap-2">
            <input value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder={t('legion.autreSecteurPlaceholder', 'Opérateur télécom, clinique privée, salon de coiffure…')}
              className="input min-w-0 flex-1" maxLength={160} />
            <button type="submit" disabled={generation || secteur.trim().length < 3}
              className="shrink-0 rounded-input bg-legion-gold px-3 py-2 text-caption font-semibold text-legion-ink disabled:opacity-50">
              {generation ? t('legion.autreSecteurEnCours', 'Écriture… (1 min)') : t('legion.autreSecteurBouton', 'Créer le modèle')}
            </button>
          </div>
          {generationErreur && <p className="mt-2 text-caption text-legion-danger">{generationErreur}</p>}
        </form>

        {modele && (
          <>
            {/* Le concept: c'est quoi, comment c'est organisé, combien de gens
                d'habitude. Beau: « un cabinet de conseil c'est quoi le concept,
                combien de personnes, qui y travaille ». */}
            {(modele.concept || modele.effectifs) && (
              <div className="mt-4 rounded-card border border-legion-line bg-legion-card p-3">
                {modele.concept && (
                  <>
                    <p className="text-caption font-semibold uppercase tracking-wider text-legion-muted">{t('legion.conceptTitre')}</p>
                    <p className="mt-1 text-body text-legion-ink">{modele.concept}</p>
                  </>
                )}
                {modele.effectifs && (
                  <>
                    <p className="mt-3 text-caption font-semibold uppercase tracking-wider text-legion-muted">{t('legion.effectifsTitre')}</p>
                    <p className="mt-1 text-body text-legion-ink">{modele.effectifs}</p>
                  </>
                )}
              </div>
            )}

            {/* 2. L'effectif — un nombre, à lui de choisir */}
            <p className="mt-6 text-caption font-semibold uppercase tracking-wider text-legion-muted">{t('legion.etapeEffectif')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {RACCOURCIS.map((n) => (
                <button key={n} type="button" onClick={() => setEffectif(n)}
                  className={`rounded-pill px-3 py-1 text-caption font-semibold ${
                    Number(effectif) === n ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>
                  {n.toLocaleString('fr-FR')}
                </button>
              ))}
              <input type="number" min={1} max={10000} inputMode="numeric" value={effectif}
                onChange={(e) => setEffectif(e.target.value)} aria-label={t('legion.etapeEffectif')}
                className="input w-28" />
            </div>
            <p className="mt-1 text-caption text-legion-muted">{t('legion.effectifAide')}</p>

            {/* Ce qu'on obtient VRAIMENT à cette taille */}
            <div className="mt-3 rounded-card border border-legion-line bg-legion-card p-3">
              <p className="text-caption font-semibold text-legion-ink">
                {t('legion.apercuEffectif', { metiers: postesDu(modele.cle).length, personnes: Math.max(Number(effectif) || 1, postesDu(modele.cle).length) })}
              </p>
              {/* Par département, comme un organigramme — pas une liste plate. */}
              {parDepartement(postesDu(modele.cle)).map((d) => (
                <div key={d.nom} className="mt-3">
                  <p className="text-caption font-semibold text-legion-ink">{d.nom} <span className="font-normal text-legion-muted">· {d.postes.length}</span></p>
                  <p className="mt-0.5 text-caption text-legion-muted">
                    {d.postes.slice(0, 12).map((p, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        <span className={p.est_directeur ? 'font-semibold text-legion-ink' : ''}>{p.est_directeur ? '★ ' : ''}{p.poste}</span>
                        {p.a_ecrire && <span className="ml-1 rounded-pill bg-legion-gold/15 px-1.5 text-legion-gold">{t('legion.aEcrire')}</span>}
                      </span>
                    ))}
                    {d.postes.length > 12 && <span> {t('legion.etPlus', { n: d.postes.length - 12 })}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* 3 et 4. Le nom, le projet */}
            <div className="mt-6 space-y-3">
              <Field label={t('legion.nomEntreprise')} required>
                {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t('legion.nomExemple')} />}
              </Field>
              <Field label={t('legion.projet')} hint={t('legion.projetAide')}>
                {(id) => <TextArea id={id} rows={3} value={projet} onChange={(e) => setProjet(e.target.value)} />}
              </Field>
              <Button onClick={fonder} loading={envoi} disabled={nom.trim() === '' || !user}>
                {t('legion.fonderBouton')} <IconArrowRight size={18} />
              </Button>
              {!user && <p className="text-caption text-legion-muted">{t('legion.connecteToi')}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
