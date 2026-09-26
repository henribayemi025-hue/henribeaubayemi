import { useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowRight, IconCheck, IconFileText, IconLoader2, IconPencil, IconPlus, IconRotateClockwise, IconSearch, IconSparkles, IconStar, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { supabase } from '../../../../lib/supabase';
import { Modal } from '../../../../components/Modal';
import { Field, TextInput, TextArea } from '../../../../components/Field';
import { sansAccent } from '../outils';
import { clePoste, visageDe, visagesDistincts, parDepartement, lireFichierPostes, TAILLES } from './equipe';

// La page Fonder, côté équipe (Beau, 25/09 — audit de Léo) :
//   « des photos d'agents qui défilent, pas un emoji » → BandePostes, VisagesModele ;
//   « les 71 rôles cliquables : voir, ajouter, retirer, définir par prompt,
//     envoyer un fichier » → Organigramme, FichePoste, AjouterPoste, AideLeo ;
//   « le bouton Fonder doit être dynamique » → BoutonFonder.
// Aucun de ces composants n'écrit en base : ils composent l'équipe que la
// page enverra à legion_creer_entreprise au moment de fonder.

const ORIGINES = { main: 'legion.fonderEquipe.origineMain', leo: 'legion.fonderEquipe.origineLeo', fichier: 'legion.fonderEquipe.origineFichier', catalogue: 'legion.fonderEquipe.origineCatalogue' };

function Visage({ modele, poste, src, taille = 40, className = '' }) {
  return <img src={src || visageDe(modele, poste)} alt="" loading="lazy" decoding="async" width={taille} height={taille} className={`shrink-0 rounded-full border-2 border-legion-card bg-legion-card object-cover ${className}`} style={{ width: taille, height: taille }} />;
}

// Cinq visages qui se chevauchent + le compte : la carte d'un modèle, avant
// même de le choisir, montre des gens, pas un pictogramme.
export function VisagesModele({ modele, postes, n = 5, taille = 30 }) {
  const tetes = useMemo(() => [...postes].sort((a, b) => Number(!!b.est_directeur) - Number(!!a.est_directeur)).slice(0, n), [postes, n]);
  const photos = useMemo(() => visagesDistincts(modele, tetes.map((p) => p.poste_fr || p.poste)), [modele, tetes]);
  return (
    <span className="flex shrink-0 items-center">
      {tetes.map((p, i) => <Visage key={p.poste} src={photos[i]} taille={taille} className={i > 0 ? '-ml-2.5' : ''} />)}
      {postes.length > n && <span className="-ml-1.5 flex h-[30px] min-w-[30px] items-center justify-center rounded-full border-2 border-legion-card bg-legion-card-haut px-1 text-[10px] font-bold text-legion-ink">+{postes.length - n}</span>}
    </span>
  );
}

// La bande qui défile : chaque poste de l'équipe avec son visage. Touchée,
// elle ouvre la fiche. Quarante visages au plus (un studio de 274 postes ne
// fait pas défiler 548 images) — le reste est dans l'organigramme dessous.
export function BandePostes({ modele, equipe, repartis, onOuvrir, t }) {
  const tetes = useMemo(() => [...equipe].sort((a, b) => Number(!!b.est_directeur) - Number(!!a.est_directeur)).slice(0, 40), [equipe]);
  if (!tetes.length) return null;
  const piste = [...tetes, ...tetes];
  return (
    <div className="leo-defile -mx-4 mt-3 px-4" style={{ '--leo-defile-duree': `${Math.max(24, tetes.length * 2.2)}s` }} aria-label={t('legion.fonderEquipe.bande')}>
      <div className="leo-defile-piste">
        {piste.map((p, i) => (
          <button key={`${p.poste}-${i}`} type="button" onClick={() => onOuvrir(p)} aria-hidden={i >= tetes.length}
            className="flex w-[92px] shrink-0 flex-col items-center gap-1 rounded-card px-1 py-2 text-center transition hover:bg-legion-card">
            <span className="relative">
              <Visage modele={modele} poste={p.poste_fr || p.poste} taille={48} />
              {p.est_directeur && <IconStar size={12} className="absolute -right-0.5 -top-0.5 rounded-full bg-legion-gold p-0.5 text-legion-bg" />}
              {(repartis?.[clePoste(p.poste)] || 1) > 1 && <span className="absolute -bottom-1 -right-1 rounded-full bg-legion-teal px-1 text-[9px] font-bold text-white">×{repartis[clePoste(p.poste)]}</span>}
            </span>
            <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-legion-ink">{p.poste}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// L'organigramme : par département, un bouton par poste. ★ dirige. Les
// postes ajoutés sont marqués ; ceux retirés ou ouverts plus tard se
// remettent d'un clic (rien n'est perdu).
export function Organigramme({ equipe, dehors, repartis, onOuvrir, onRemettre, t }) {
  const [voirDehors, setVoirDehors] = useState(false);
  const groupes = useMemo(() => parDepartement(equipe), [equipe]);
  const retires = dehors.filter((p) => p.raison === 'retire');
  const plusTard = dehors.filter((p) => p.raison === 'taille');
  const plusDeMonde = dehors.filter((p) => p.raison === 'effectif');
  return (
    <div className="mt-3 space-y-3">
      {groupes.map((d) => (
        <div key={d.nom}>
          <p className="text-caption font-semibold text-legion-ink">{d.nom} <span className="font-normal text-legion-muted">· {d.postes.length}</span></p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {d.postes.map((p) => {
              const n = repartis?.[clePoste(p.poste)] || 1;
              return (
                <button key={p.poste} type="button" onClick={() => onOuvrir(p)}
                  className={`inline-flex max-w-full items-center gap-1 rounded-pill border px-2.5 py-1 text-[12px] transition hover:border-legion-gold ${
                    p.ajoute ? 'border-legion-teal/60 bg-legion-teal/10 text-legion-ink' : p.est_directeur ? 'border-legion-gold/60 bg-legion-gold/10 font-semibold text-legion-ink' : 'border-legion-line bg-legion-card text-legion-ink'}`}>
                  {p.est_directeur && <IconStar size={11} className="shrink-0 text-legion-gold" />}
                  <span className="truncate">{p.poste}</span>
                  {n > 1 && <span className="shrink-0 rounded-pill bg-legion-card-haut px-1 text-[10px] font-bold text-legion-muted">×{n}</span>}
                  {p.a_ecrire && <span className="shrink-0 rounded-pill bg-legion-gold/15 px-1 text-[10px] text-legion-gold">{t('legion.aEcrire')}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {dehors.length > 0 && (
        <div className="border-t border-legion-line pt-2">
          <button type="button" onClick={() => setVoirDehors((v) => !v)} className="text-[12px] font-semibold text-legion-muted hover:text-legion-ink">
            {[
              retires.length > 0 && t('legion.fonderEquipe.retires', { n: retires.length }),
              plusDeMonde.length > 0 && t('legion.fonderEquipe.plusDeMonde', { n: plusDeMonde.length }),
              plusTard.length > 0 && t('legion.fonderEquipe.plusTard', { n: plusTard.length }),
            ].filter(Boolean).join(' · ')}
            {' '}<span className="text-legion-gold">{voirDehors ? '▴' : '▾'}</span>
          </button>
          {voirDehors && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[...retires, ...plusDeMonde, ...plusTard].map((p) => (
                <button key={p.poste} type="button" onClick={() => onRemettre(p)} title={t('legion.fonderEquipe.remettre')}
                  className={`inline-flex items-center gap-1 rounded-pill border border-dashed px-2.5 py-1 text-[12px] text-legion-muted hover:border-legion-teal hover:text-legion-ink ${p.raison === 'retire' ? 'border-legion-danger/50 line-through' : 'border-legion-line'}`}>
                  <IconRotateClockwise size={11} /> {p.poste}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// La fiche d'un poste : ce qu'il fait, combien de personnes le tiendront, à
// partir de quelle taille il existe. Retirer / remettre, réécrire le mandat
// à la main, ou le faire réécrire par Léo (« définir par prompt »).
export function FichePoste({ poste, modele, dansEquipe, n, onFermer, onRetirer, onRemettre, onMandat, demanderLeo, t }) {
  const [edition, setEdition] = useState(false);
  const [mandat, setMandat] = useState(poste?.mandat || '');
  const [demande, setDemande] = useState('');
  const [attente, setAttente] = useState(false);
  const [reponse, setReponse] = useState('');
  useEffect(() => { setMandat(poste?.mandat || ''); setEdition(false); setDemande(''); setReponse(''); }, [poste]);
  if (!poste) return null;
  const tailleCle = TAILLES.includes(poste.des_la_taille) ? poste.des_la_taille : 'cocon';
  async function demander(e) {
    e.preventDefault();
    if (attente || demande.trim().length < 3) return;
    setAttente(true); setReponse('');
    try {
      const r = await demanderLeo(`${t('legion.fonderEquipe.pourLePoste', { poste: poste.poste })} ${demande.trim()}`);
      const m = r?.modifier?.find((x) => clePoste(x.poste) === clePoste(poste.poste)) || (r?.ajouter?.length === 1 ? r.ajouter[0] : null);
      if (m?.mandat) { setMandat(m.mandat); onMandat(poste, m.mandat); }
      setReponse(r?.conseil || (m ? '' : t('legion.fonderEquipe.rienChange')));
      setDemande('');
    } catch (err) { setReponse(err.message || t('errors.generic')); }
    finally { setAttente(false); }
  }
  return (
    <Modal open onClose={onFermer} title={t('legion.fonderEquipe.fiche')} className="legion-modale">
      <div className="space-y-4 text-legion-ink">
        <div className="flex items-start gap-3 rounded-card border border-legion-line bg-legion-bg p-3">
          <Visage modele={modele} poste={poste.poste_fr || poste.poste} taille={64} />
          <div className="min-w-0 flex-1">
            <h3 className="text-section font-bold leading-tight text-legion-ink">{poste.poste}</h3>
            <p className="text-caption text-legion-muted">{poste.departement}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
              {poste.est_directeur && <span className="inline-flex items-center gap-1 rounded-pill bg-legion-gold/15 px-2 py-0.5 font-semibold text-legion-gold"><IconStar size={11} /> {t('legion.fonderEquipe.directeur')}</span>}
              {dansEquipe && <span className="rounded-pill bg-legion-card-haut px-2 py-0.5 text-legion-ink">{n > 1 ? t('legion.fonderEquipe.personnesPoste', { n }) : t('legion.fonderEquipe.unePersonne')}</span>}
              {!poste.ajoute && <span className="rounded-pill bg-legion-card-haut px-2 py-0.5 text-legion-muted">{t('legion.fonderEquipe.desLaTaille', { taille: t(`legion.taille.${tailleCle}`) })}</span>}
              {poste.ajoute && <span className="rounded-pill bg-legion-teal/15 px-2 py-0.5 text-legion-teal">{t(ORIGINES[poste.origine] || ORIGINES.main)}</span>}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.fonderEquipe.mandat')}</p>
            {!edition && (
              <button type="button" onClick={() => setEdition(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-legion-gold hover:brightness-110">
                <IconPencil size={12} /> {t('legion.fonderEquipe.modifierMandat')}
              </button>
            )}
          </div>
          {edition ? (
            <div>
              <TextArea value={mandat} maxLength={300} onChange={(e) => setMandat(e.target.value)} rows={3} />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => { onMandat(poste, mandat.trim()); setEdition(false); }} disabled={mandat.trim().length < 10}
                  className="inline-flex items-center gap-1 rounded-input bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50"><IconCheck size={13} /> {t('legion.fonderEquipe.garderMandat')}</button>
                <button type="button" onClick={() => { setMandat(poste.mandat || ''); setEdition(false); }} className="rounded-input border border-legion-line px-3 py-1.5 text-[12px] font-semibold text-legion-muted">{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <p className="rounded-card border border-legion-line bg-legion-card p-3 text-caption leading-relaxed text-legion-ink">{mandat || <span className="italic text-legion-muted">{t('legion.fonderEquipe.sansMandat')}</span>}</p>
          )}
        </div>

        <form onSubmit={demander} className="rounded-card border border-legion-line bg-legion-card p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted"><IconSparkles size={12} className="text-legion-gold" /> {t('legion.fonderEquipe.demanderLeo')}</p>
          <div className="mt-1.5 flex gap-2">
            <input value={demande} onChange={(e) => setDemande(e.target.value)} placeholder={t('legion.fonderEquipe.demanderLeoAide')} maxLength={400} className="input min-w-0 flex-1 py-2 text-[14px]" />
            <button type="submit" disabled={attente || demande.trim().length < 3} className="shrink-0 rounded-input bg-legion-gold px-3 py-2 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
              {attente ? <IconLoader2 size={16} className="animate-spin" /> : <IconArrowRight size={16} />}
            </button>
          </div>
          {reponse && <p className="mt-2 text-caption leading-relaxed text-legion-ink">{reponse}</p>}
        </form>

        <div className="flex gap-2">
          {dansEquipe ? (
            <button type="button" onClick={() => { onRetirer(poste); onFermer(); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-input border border-legion-danger/50 px-3 py-2.5 text-[13px] font-semibold text-legion-danger hover:bg-legion-danger/10">
              <IconTrash size={15} /> {t('legion.fonderEquipe.retirer')}
            </button>
          ) : (
            <button type="button" onClick={() => { onRemettre(poste); onFermer(); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-input bg-legion-teal px-3 py-2.5 text-[13px] font-semibold text-white">
              <IconRotateClockwise size={15} /> {t('legion.fonderEquipe.remettre')}
            </button>
          )}
          <button type="button" onClick={onFermer} className="rounded-input border border-legion-line px-4 py-2.5 text-[13px] font-semibold text-legion-muted hover:text-legion-ink">{t('common.close')}</button>
        </div>
      </div>
    </Modal>
  );
}

// Ajouter un métier : chercher dans TOUT le catalogue (tous les secteurs),
// ou l'écrire soi-même. Le mandat d'un poste du catalogue est lu à l'ajout.
export function AjouterPoste({ catalogue, modeles, departements, existants, onAjouter, onFermer, t }) {
  const [q, setQ] = useState('');
  const [main, setMain] = useState({ departement: '', poste: '', mandat: '' });
  const [attente, setAttente] = useState('');
  const deja = useMemo(() => new Set(existants.map((p) => clePoste(p.poste))), [existants]);
  const nomsModeles = useMemo(() => Object.fromEntries((modeles || []).map((m) => [m.cle, m.nom])), [modeles]);
  const resultats = useMemo(() => {
    const s = sansAccent(q.trim());
    if (s.length < 2) return [];
    const vus = new Set(); const out = [];
    for (const p of catalogue) {
      const k = clePoste(p.poste);
      if (vus.has(k) || !sansAccent(`${p.poste} ${p.departement}`).includes(s)) continue;
      vus.add(k); out.push(p);
      if (out.length >= 40) break;
    }
    return out;
  }, [catalogue, q]);
  async function prendre(p) {
    setAttente(p.poste);
    try {
      // Le catalogue peut être affiché traduit : la base se lit avec le poste d'origine.
      const { data } = await supabase.from('studio_modele_postes').select('mandat, poids, agent_cle, est_directeur').eq('modele', p.modele).eq('poste', p.poste_fr || p.poste).limit(1).maybeSingle();
      onAjouter({ departement: p.departement, poste: p.poste, poste_fr: p.poste_fr, mandat: p.mandat || data?.mandat || '', poids: data?.poids || 1, agent_cle: data?.agent_cle || null, est_directeur: false, origine: 'catalogue' });
    } finally { setAttente(''); }
  }
  function ecrire(e) {
    e.preventDefault();
    if (main.poste.trim().length < 2) return;
    onAjouter({ departement: main.departement.trim() || departements[0] || '—', poste: main.poste.trim(), mandat: main.mandat.trim(), poids: 1, est_directeur: false, origine: 'main' });
    setMain({ departement: '', poste: '', mandat: '' });
  }
  return (
    <Modal open onClose={onFermer} title={t('legion.fonderEquipe.ajouter')} className="legion-modale">
      <div className="space-y-4 text-legion-ink">
        <div>
          <div className="relative">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-legion-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('legion.fonderEquipe.chercherCatalogue', { n: catalogue.length.toLocaleString() })} className="input pl-9" />
          </div>
          {resultats.length > 0 && (
            <ul className="mt-2 max-h-[40vh] divide-y divide-legion-line overflow-y-auto rounded-card border border-legion-line">
              {resultats.map((p) => {
                const la = deja.has(clePoste(p.poste));
                return (
                  <li key={`${p.modele}-${p.poste}`} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-legion-ink">{p.poste}</span>
                      <span className="block truncate text-[11px] text-legion-muted">{p.departement} · {nomsModeles[p.modele] || p.modele}</span>
                    </span>
                    <button type="button" disabled={la || attente === p.poste} onClick={() => prendre(p)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-legion-gold px-2.5 py-1 text-[11px] font-semibold text-legion-bg disabled:bg-legion-card-haut disabled:text-legion-muted">
                      {attente === p.poste ? <IconLoader2 size={12} className="animate-spin" /> : la ? <IconCheck size={12} /> : <IconPlus size={12} />} {la ? t('legion.fonderEquipe.dejaLa') : t('legion.fonderEquipe.ajouterCe')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {q.trim().length >= 2 && resultats.length === 0 && <p className="mt-2 text-caption text-legion-muted">{t('legion.fonderEquipe.aucunPoste')}</p>}
        </div>
        <form onSubmit={ecrire} className="space-y-2 rounded-card border border-legion-line bg-legion-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.fonderEquipe.ecrireMain')}</p>
          <Field label={t('legion.fonderEquipe.champPoste')} required>{(id) => <TextInput id={id} value={main.poste} maxLength={80} onChange={(e) => setMain((m) => ({ ...m, poste: e.target.value }))} />}</Field>
          <Field label={t('legion.fonderEquipe.champDepartement')}>
            {(id) => (
              <>
                <TextInput id={id} list={`${id}-depts`} value={main.departement} maxLength={60} onChange={(e) => setMain((m) => ({ ...m, departement: e.target.value }))} placeholder={departements[0] || ''} />
                <datalist id={`${id}-depts`}>{departements.map((d) => <option key={d} value={d} />)}</datalist>
              </>
            )}
          </Field>
          <Field label={t('legion.fonderEquipe.champMandat')}>{(id) => <TextArea id={id} rows={2} value={main.mandat} maxLength={300} onChange={(e) => setMain((m) => ({ ...m, mandat: e.target.value }))} />}</Field>
          <button type="submit" disabled={main.poste.trim().length < 2} className="inline-flex items-center gap-1.5 rounded-input bg-legion-gold px-3 py-2 text-[13px] font-semibold text-legion-bg disabled:opacity-50"><IconPlus size={14} /> {t('legion.fonderEquipe.ajouterCe')}</button>
        </form>
      </div>
    </Modal>
  );
}

// Léo t'aide à composer l'équipe : une consigne, un fichier, ou les deux ;
// il propose qui ajouter, qui retirer, quels mandats réécrire — et la
// personne coche avant d'appliquer. Un CSV bien formé est lu SANS moteur.
export function AideLeo({ demanderLeo, onAppliquer, t }) {
  const [consigne, setConsigne] = useState('');
  const [fichier, setFichier] = useState(null); // { nom, texte } ou null
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState('');
  const [prop, setProp] = useState(null); // { conseil, ajouter, retirer, modifier }
  const [coches, setCoches] = useState({});
  const entree = useRef(null);

  function lireFichier(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setErreur('');
    if (!/\.(txt|csv|tsv|md|json|text)$/i.test(f.name) && !f.type.startsWith('text/')) { setErreur(t('legion.fonderEquipe.aideFichierFormat')); return; }
    if (f.size > 400_000) { setErreur(t('legion.fonderEquipe.aideFichierTrop')); return; }
    const lecteur = new FileReader();
    lecteur.onload = () => setFichier({ nom: f.name, texte: String(lecteur.result || '').slice(0, 15_000) });
    lecteur.readAsText(f);
  }

  async function demander(e) {
    e.preventDefault();
    if (attente || (consigne.trim().length < 3 && !fichier)) return;
    setAttente(true); setErreur(''); setProp(null);
    try {
      const lu = fichier && !consigne.trim() ? lireFichierPostes(fichier.texte) : null;
      const r = lu ? { conseil: t('legion.fonderEquipe.fichierLu', { n: lu.length }), ajouter: lu, retirer: [], modifier: [] }
        : await demanderLeo(consigne.trim(), fichier?.texte || '');
      const c = {};
      (r.ajouter || []).forEach((_, i) => { c[`a${i}`] = true; });
      (r.retirer || []).forEach((_, i) => { c[`r${i}`] = true; });
      (r.modifier || []).forEach((_, i) => { c[`m${i}`] = true; });
      setCoches(c); setProp(r);
    } catch (err) { setErreur(err.message || t('errors.generic')); }
    finally { setAttente(false); }
  }

  const nCoches = Object.values(coches).filter(Boolean).length;
  function appliquer() {
    if (!prop) return;
    onAppliquer({
      ajouter: (prop.ajouter || []).filter((_, i) => coches[`a${i}`]).map((p) => ({ ...p, origine: p.origine || 'leo' })),
      retirer: (prop.retirer || []).filter((_, i) => coches[`r${i}`]),
      modifier: (prop.modifier || []).filter((_, i) => coches[`m${i}`]),
    });
    setProp(null); setConsigne(''); setFichier(null);
  }
  const Coche = ({ k, children }) => (
    <label className={`flex cursor-pointer items-start gap-2 rounded-card border px-2.5 py-2 text-[12px] ${coches[k] ? 'border-legion-teal/50 bg-legion-teal/10' : 'border-legion-line bg-legion-card'}`}>
      <input type="checkbox" checked={!!coches[k]} onChange={(e) => setCoches((c) => ({ ...c, [k]: e.target.checked }))} className="mt-0.5 accent-[#2A9D8F]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );

  return (
    <div className="mt-4 rounded-card border border-legion-gold/40 bg-legion-card p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <img src="/logos/leo.png" alt="" className="h-8 w-8 rounded-input object-cover" />
        <div>
          <p className="text-body font-bold text-legion-ink">{t('legion.fonderEquipe.aideTitre')}</p>
          <p className="text-[12px] text-legion-muted">{t('legion.fonderEquipe.aideIntro')}</p>
        </div>
      </div>
      <form onSubmit={demander} className="mt-3">
        <TextArea value={consigne} onChange={(e) => setConsigne(e.target.value)} rows={2} maxLength={800} placeholder={t('legion.fonderEquipe.aidePlaceholder')} className="min-h-[64px]" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input ref={entree} type="file" accept=".txt,.csv,.tsv,.md,.json,text/*" onChange={lireFichier} className="hidden" />
          <button type="button" onClick={() => entree.current?.click()} className="inline-flex items-center gap-1.5 rounded-input border border-legion-line px-3 py-2 text-[12px] font-semibold text-legion-muted hover:text-legion-ink">
            <IconUpload size={14} /> {t('legion.fonderEquipe.aideFichier')}
          </button>
          {fichier && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-legion-card-haut px-2 py-1 text-[11px] text-legion-ink">
              <IconFileText size={12} /> {fichier.nom}
              <button type="button" onClick={() => setFichier(null)} aria-label={t('common.close')} className="ml-0.5 text-legion-muted hover:text-legion-danger"><IconX size={12} /></button>
            </span>
          )}
          <button type="submit" disabled={attente || (consigne.trim().length < 3 && !fichier)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-input bg-legion-gold px-3.5 py-2 text-[13px] font-semibold text-legion-bg disabled:opacity-50">
            {attente ? <><IconLoader2 size={15} className="animate-spin" /> {t('legion.fonderEquipe.aideEnCours')}</> : <><IconSparkles size={15} /> {t('legion.fonderEquipe.aideBouton')}</>}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-legion-muted">{t('legion.fonderEquipe.aideFichierAide')}</p>
        {erreur && <p className="mt-2 text-caption text-legion-danger">{erreur}</p>}
      </form>
      {prop && (
        <div className="mt-3 space-y-3 border-t border-legion-line pt-3">
          {prop.conseil && <p className="text-caption leading-relaxed text-legion-ink">{prop.conseil}</p>}
          {prop.ajouter?.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-teal">{t('legion.fonderEquipe.propAjouter')} · {prop.ajouter.length}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {prop.ajouter.map((p, i) => (
                  <Coche key={`a${i}`} k={`a${i}`}>
                    <span className="block font-semibold text-legion-ink">{p.est_directeur && <IconStar size={11} className="mr-0.5 inline text-legion-gold" />}{p.poste} <span className="font-normal text-legion-muted">· {p.departement}</span></span>
                    {p.mandat && <span className="block text-legion-muted">{p.mandat}</span>}
                  </Coche>
                ))}
              </div>
            </div>
          )}
          {prop.retirer?.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-danger">{t('legion.fonderEquipe.propRetirer')} · {prop.retirer.length}</p>
              <div className="flex flex-wrap gap-1.5">{prop.retirer.map((p, i) => <Coche key={`r${i}`} k={`r${i}`}><span className="line-through">{p}</span></Coche>)}</div>
            </div>
          )}
          {prop.modifier?.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-gold">{t('legion.fonderEquipe.propModifier')} · {prop.modifier.length}</p>
              <div className="grid gap-1.5">{prop.modifier.map((m, i) => <Coche key={`m${i}`} k={`m${i}`}><span className="block font-semibold text-legion-ink">{m.poste}</span><span className="block text-legion-muted">{m.mandat}</span></Coche>)}</div>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={appliquer} disabled={nCoches === 0} className="inline-flex items-center gap-1.5 rounded-input bg-legion-teal px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
              <IconCheck size={15} /> {nCoches ? t('legion.fonderEquipe.appliquer', { n: nCoches }) : t('legion.fonderEquipe.rienAAppliquer')}
            </button>
            <button type="button" onClick={() => setProp(null)} className="rounded-input border border-legion-line px-3 py-2 text-[13px] font-semibold text-legion-muted hover:text-legion-ink">{t('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Le bouton Fonder, vivant : il dit ce qu'il va fonder (le nom, l'équipe),
// puis, pendant la fondation, ce qui se passe — étape après étape.
const ETAPES = ['reunit', 'postes', 'salons', 'accueil'];
export function BoutonFonder({ nom, personnes, metiers, envoi, disabled, onClick, t }) {
  const [etape, setEtape] = useState(0);
  useEffect(() => {
    if (!envoi) { setEtape(0); return undefined; }
    const id = setInterval(() => setEtape((e) => Math.min(ETAPES.length - 1, e + 1)), 1100);
    return () => clearInterval(id);
  }, [envoi]);
  return (
    <button type="button" onClick={onClick} disabled={disabled || envoi} aria-busy={envoi}
      className={`leo-fonder relative flex w-full items-center gap-3 overflow-hidden rounded-card px-5 py-4 text-left text-legion-bg transition ${disabled && !envoi ? 'opacity-50' : 'hover:brightness-110 active:scale-[0.99]'}`}>
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-[17px] font-extrabold leading-tight">
          {envoi ? t(`legion.fonderEtapes.${ETAPES[etape]}`) : nom ? t('legion.fonderNom', { nom }) : t('legion.fonderBouton')}
        </span>
        <span className="block text-[12px] font-semibold opacity-80">{t('legion.apercuEffectif', { metiers, personnes })}</span>
      </span>
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-legion-bg/20">
        {envoi ? <IconLoader2 size={20} className="animate-spin" /> : <IconArrowRight size={20} />}
      </span>
      {envoi && <span className="leo-fonder-barre absolute inset-x-0 bottom-0 h-1 bg-legion-bg/50" />}
    </button>
  );
}
