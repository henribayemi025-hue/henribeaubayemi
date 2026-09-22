import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconMoon } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
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
  const toast = useToast();
  const navigate = useNavigate();
  const [modele, setModele] = useState(null);
  const [effectif, setEffectif] = useState(25);
  const [nom, setNom] = useState('');
  const [projet, setProjet] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const [m, p] = await Promise.all([
      supabase.from('studio_modeles').select('*').eq('actif', true).order('ordre'),
      supabase.from('studio_modele_postes').select('modele, departement, poste, des_la_taille, a_ecrire, est_directeur').order('ordre'),
    ]);
    if (m.error) throw m.error;
    return { modeles: m.data || [], postes: p.data || [] };
  }, [], { cacheKey: 'legion:modeles:v2' });

  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
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
    <div className="pb-24">
      <AppHeader title={t('legion.fonder')} back />
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <p className="text-body text-legion-muted">{t('legion.fonderIntro')}</p>

        {/* 1. Le modèle */}
        <p className="mt-5 text-caption font-semibold uppercase tracking-wider text-legion-muted">{t('legion.etapeModele')}</p>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.modeles.map((m) => {
            const ps = data.postes.filter((p) => p.modele === m.cle);
            const aEcrire = ps.filter((p) => p.a_ecrire).length;
            const choisi = modele?.cle === m.cle;
            return (
              <li key={m.cle}>
                <button type="button" onClick={() => setModele(m)}
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
