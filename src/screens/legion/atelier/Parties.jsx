import { useEffect, useState } from 'react';
import { IconFolder, IconFolderOpen, IconFile, IconTerminal2, IconPencil, IconTrash, IconWorld, IconX } from '@tabler/icons-react';
import { appel } from './api';
import { dollars } from './arbre';

// Les morceaux de l'écran Atelier : l'arbre, la carte d'autorisation, les
// modifications en vert et rouge, le journal, le nouveau projet.

export function Arbre({ noeud, ouvert, onOuvrir, profondeur = 0 }) {
  const [plies, setPlies] = useState({});
  return (
    <ul className="text-[13px]">
      {noeud.dossiers.map((d) => {
        const plie = plies[d.chemin];
        return (
          <li key={d.chemin}>
            <button type="button" onClick={() => setPlies((p) => ({ ...p, [d.chemin]: !plie }))}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-legion-muted hover:bg-legion-card-haut hover:text-legion-ink"
              style={{ paddingLeft: 8 + profondeur * 12 }}>
              {plie ? <IconFolder size={15} className="shrink-0 text-legion-gold" /> : <IconFolderOpen size={15} className="shrink-0 text-legion-gold" />}
              <span className="truncate">{d.nom}</span>
            </button>
            {!plie && <Arbre noeud={d} ouvert={ouvert} onOuvrir={onOuvrir} profondeur={profondeur + 1} />}
          </li>
        );
      })}
      {noeud.fichiers.map((f) => (
        <li key={f.chemin}>
          <button type="button" onClick={() => onOuvrir(f.chemin)}
            className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left ${ouvert === f.chemin ? 'bg-legion-gold/15 text-legion-ink' : 'text-legion-ink/85 hover:bg-legion-card-haut'}`}
            style={{ paddingLeft: 8 + profondeur * 12 }}>
            <IconFile size={15} className="shrink-0 text-legion-muted" />
            <span className="truncate">{f.nom}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Les lignes ajoutées en vert, retirées en rouge.
export function DiffBloc({ diff, t }) {
  if (!diff) return null;
  return (
    <div className="overflow-hidden rounded-input border border-legion-line bg-legion-bg">
      <div className="flex items-center gap-3 border-b border-legion-line px-3 py-1.5 text-[12px]">
        <span className="font-semibold text-legion-success">+{diff.ajouts}</span>
        <span className="font-semibold text-legion-danger">−{diff.retraits}</span>
        {diff.nouveau && <span className="text-legion-muted">{t('legion.atelier.nouveauFichier')}</span>}
        {diff.supprime && <span className="text-legion-muted">{t('legion.atelier.fichierSupprime')}</span>}
      </div>
      <div className="max-h-72 overflow-auto font-mono text-[12px] leading-5">
        {diff.blocs.map((b, i) => (
          <div key={i} className={i ? 'border-t border-dashed border-legion-line' : ''}>
            {b.lignes.map((l, j) => (
              <div key={j} className={`whitespace-pre-wrap break-all px-3 ${l.t === '+' ? 'bg-legion-success/15 text-legion-ink' : l.t === '-' ? 'bg-legion-danger/15 text-legion-ink/80 line-through decoration-legion-danger/40' : 'text-legion-muted'}`}>
                <span className="mr-2 select-none opacity-60">{l.t === ' ' ? ' ' : l.t === '-' ? '−' : '+'}</span>{l.x || ' '}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// La carte « Autoriser une fois / Toujours / Refuser ». C'est le Worker qui
// décide de l'afficher : l'agent ne peut rien écrire ni lancer sans elle.
export function Carte({ demande, occupe, onDecider, t }) {
  if (!demande) return null;
  const commande = demande.outil === 'commande';
  const Icone = commande ? IconTerminal2 : demande.outil === 'supprimer_fichier' ? IconTrash : IconPencil;
  return (
    <div className="rounded-card border-2 border-legion-gold/70 bg-legion-card p-3 shadow-lg" role="alertdialog" aria-label={t('legion.atelier.carteTitre')}>
      <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-legion-ink">
        <Icone size={18} className="text-legion-gold" />
        {commande ? t('legion.atelier.veutLancer') : demande.outil === 'supprimer_fichier' ? t('legion.atelier.veutSupprimer') : t('legion.atelier.veutModifier')}
      </div>
      {commande ? (
        <>
          <pre className="mb-2 whitespace-pre-wrap break-all rounded-input bg-legion-bg px-3 py-2 font-mono text-[13px] text-legion-gold-soft">{demande.commande}</pre>
          <p className="mb-2 flex items-center gap-1.5 text-[12px] text-legion-muted">
            <IconWorld size={14} />
            {demande.reseau?.length ? t('legion.atelier.reseau', { hotes: demande.reseau.join(', ') }) : t('legion.atelier.pasDeReseau')}
          </p>
          {demande.pourquoi && <p className="mb-3 text-caption text-legion-ink">{demande.pourquoi}</p>}
        </>
      ) : (
        <>
          <p className="mb-1 font-mono text-[13px] text-legion-gold-soft">{demande.chemin}</p>
          {demande.explication && <p className="mb-2 text-caption text-legion-ink">{demande.explication}</p>}
          <div className="mb-3"><DiffBloc diff={demande.diff} t={t} /></div>
        </>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" disabled={occupe} onClick={() => onDecider('une_fois')}
          className="rounded-pill bg-legion-gold px-4 py-2 text-caption font-semibold text-legion-bg disabled:opacity-50">
          {t('legion.atelier.autoriserUneFois')}
        </button>
        <button type="button" disabled={occupe} onClick={() => onDecider('toujours')}
          className="rounded-pill border border-legion-gold px-4 py-2 text-caption font-semibold text-legion-gold disabled:opacity-50">
          {commande ? t('legion.atelier.toujoursCommande') : t('legion.atelier.toujoursFichier')}
        </button>
        <button type="button" disabled={occupe} onClick={() => onDecider('refuser')}
          className="rounded-pill border border-legion-danger px-4 py-2 text-caption font-semibold text-legion-danger disabled:opacity-50">
          {t('legion.atelier.refuser')}
        </button>
      </div>
    </div>
  );
}

function Feuille({ titre, onFermer, children, t }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onFermer} role="presentation">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl border border-legion-line bg-legion-panel sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={titre}>
        <div className="flex items-center justify-between border-b border-legion-line px-4 py-3">
          <h3 className="text-[16px] font-semibold text-legion-ink">{titre}</h3>
          <button type="button" onClick={onFermer} aria-label={t('common.close', 'Fermer')} className="rounded-full p-1.5 text-legion-muted hover:text-legion-ink"><IconX size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Modifications({ pid, onFermer, t }) {
  const [liste, setListe] = useState(null);
  const [erreur, setErreur] = useState(null);
  useEffect(() => {
    appel(`/projets/${pid}/modifications`).then((r) => setListe(r.modifications)).catch((e) => setErreur(e.message));
  }, [pid]);
  return (
    <Feuille titre={t('legion.atelier.modifications')} onFermer={onFermer} t={t}>
      <p className="mb-3 text-[12px] text-legion-muted">{t('legion.atelier.modificationsAide')}</p>
      {erreur && <p className="text-caption text-legion-danger">{erreur}</p>}
      {!liste && !erreur && <p className="text-caption text-legion-muted">…</p>}
      {liste?.length === 0 && <p className="text-caption text-legion-muted">{t('legion.atelier.aucuneModification')}</p>}
      <div className="space-y-4">
        {liste?.map((m) => (
          <section key={m.chemin}>
            <h4 className="mb-1 flex items-center gap-2 font-mono text-[13px] text-legion-ink">
              {m.chemin}
              <span className="rounded-pill bg-legion-card px-2 py-0.5 font-sans text-[11px] text-legion-muted">{t(`legion.atelier.statut_${m.statut}`)}</span>
            </h4>
            {m.explications.length > 0 && (
              <ul className="mb-2 list-disc pl-5 text-caption text-legion-ink">
                {m.explications.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            )}
            <DiffBloc diff={m.diff} t={t} />
          </section>
        ))}
      </div>
    </Feuille>
  );
}

export function Journal({ pid, regles, langue, onRetirer, onFermer, t }) {
  const [lignes, setLignes] = useState(null);
  const [erreur, setErreur] = useState(null);
  useEffect(() => {
    appel(`/projets/${pid}/journal`).then((r) => setLignes(r.journal)).catch((e) => setErreur(e.message));
  }, [pid]);
  const heure = (q) => new Date(q).toLocaleTimeString(langue, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <Feuille titre={t('legion.atelier.journal')} onFermer={onFermer} t={t}>
      <h4 className="mb-1 text-caption font-semibold text-legion-ink">{t('legion.atelier.regles')}</h4>
      {regles?.length ? (
        <ul className="mb-4 space-y-1">
          {regles.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-input bg-legion-card px-3 py-1.5">
              <span className="min-w-0 truncate font-mono text-[12px] text-legion-ink">{r.portee === 'fichier' ? '✎ ' : '$ '}{r.regle}</span>
              <button type="button" onClick={() => onRetirer(r.id)} className="shrink-0 text-[12px] font-semibold text-legion-danger">{t('legion.atelier.retirer')}</button>
            </li>
          ))}
        </ul>
      ) : <p className="mb-4 text-[12px] text-legion-muted">{t('legion.atelier.aucuneRegle')}</p>}
      <h4 className="mb-1 text-caption font-semibold text-legion-ink">{t('legion.atelier.chaqueAction')}</h4>
      {erreur && <p className="text-caption text-legion-danger">{erreur}</p>}
      <ol className="space-y-1">
        {lignes?.map((l) => (
          <li key={l.n} className="grid grid-cols-[64px_1fr] gap-2 border-b border-legion-line/60 py-1 text-[12px]">
            <span className="font-mono text-legion-muted">{heure(l.quand)}</span>
            <span className="min-w-0 text-legion-ink">
              <span className="font-semibold">{t(`legion.atelier.acteur_${l.acteur}`)}</span>
              {' · '}{l.outil}
              {l.decision && <span className="ml-1 rounded bg-legion-card px-1.5 text-legion-gold">{t(`legion.atelier.decision_${l.decision}`, l.decision)}</span>}
              {l.cout_usd > 0 && <span className="ml-1 text-legion-muted">{dollars(l.cout_usd, langue)}</span>}
              {l.entree_resumee && <span className="block truncate font-mono text-legion-muted">{l.entree_resumee}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Feuille>
  );
}

const DEPARTS = ['vide', 'page_web', 'python', 'node'];
export function NouveauProjet({ onCreer, onFermer, t }) {
  const [nom, setNom] = useState('');
  const [depart, setDepart] = useState('page_web');
  const [envoi, setEnvoi] = useState(false);
  return (
    <Feuille titre={t('legion.atelier.nouveauProjet')} onFermer={onFermer} t={t}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!nom.trim()) return; setEnvoi(true); try { await onCreer(nom.trim(), depart); } finally { setEnvoi(false); } }} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-caption text-legion-muted">{t('legion.atelier.nomProjet')}</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} autoFocus
            className="w-full rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-body text-legion-ink outline-none focus:border-legion-gold" />
        </label>
        <fieldset>
          <legend className="mb-1 text-caption text-legion-muted">{t('legion.atelier.pointDeDepart')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {DEPARTS.map((d) => (
              <button key={d} type="button" onClick={() => setDepart(d)}
                className={`rounded-card border px-3 py-2 text-left text-caption ${depart === d ? 'border-legion-gold bg-legion-gold/15 text-legion-ink' : 'border-legion-line text-legion-muted'}`}>
                {t(`legion.atelier.depart_${d}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={!nom.trim() || envoi} className="w-full rounded-pill bg-legion-gold py-2.5 text-caption font-semibold text-legion-bg disabled:opacity-50">
          {t('legion.atelier.creer')}
        </button>
      </form>
    </Feuille>
  );
}
