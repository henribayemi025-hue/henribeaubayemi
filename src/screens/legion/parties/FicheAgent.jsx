import { useState } from 'react';
import { IconMessageCircle, IconRobot, IconRefresh, IconCircleCheck, IconCamera, IconPencil } from '@tabler/icons-react';
import { Modal } from '../../../components/Modal';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { AUTONOMIES } from './outils';
import { CompetencesAgent } from './Competences';

// La fiche d'un agent: qui il est, ce qu'on attend de lui, comment il parle,
// et les deux réglages qui comptent — l'interrupteur, et jusqu'où il a le
// droit d'aller sans demander. Beau: « commençons par l'audit de chaque
// personne ».
export function FicheAgent({ agent, dept, departements = [], onFermer, onAllumer, onAutonomie, onEcrireA, onAutreTete, onVraiePhoto, onModifier, onCreer, photosEnCours, t }) {
  const [change, setChange] = useState(false);
  const [enGrand, setEnGrand] = useState(false);
  const [edition, setEdition] = useState(null); // null | { nom, poste, departement, mandat, personnalite }
  if (!agent) return null;

  // Beau, 23/09: « ils peuvent créer ou modifier les agents pour eux ». Un
  // agent appartient à UNE entreprise: le modifier ici ne change jamais
  // l'agent d'une autre entreprise, même du même secteur.
  const nouveau = !agent.id;
  const champs = edition || (nouveau ? { nom: '', poste: '', departement: agent.departement || departements[0]?.nom || '', mandat: '', personnalite: '' } : null);
  if (champs) {
    const maj = (k, v) => setEdition({ ...champs, [k]: v });
    const valide = champs.nom.trim().length >= 2 && champs.poste.trim().length >= 2;
    async function enregistrer(e) {
      e.preventDefault();
      if (!valide || change) return;
      setChange(true);
      try {
        const propre = Object.fromEntries(Object.entries(champs).map(([k, v]) => [k, String(v || '').trim()]));
        if (nouveau) { await onCreer(propre); setEdition(null); onFermer(); } else { await onModifier(agent, propre); setEdition(null); }
      } finally { setChange(false); }
    }
    const champ = 'w-full rounded-input border border-legion-line bg-legion-card px-3 py-2 text-caption text-legion-ink outline-none focus:border-legion-gold';
    return (
      <Modal open onClose={() => (nouveau ? onFermer() : setEdition(null))} title={nouveau ? t('legion.nouvelAgent', 'Nouvel agent') : t('legion.modifierAgent', 'Modifier l’agent')} className="legion-modale">
        <form onSubmit={enregistrer} className="space-y-3 text-legion-ink">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.champNom', 'Son nom')}
            <input className={`${champ} mt-1`} value={champs.nom} maxLength={40} onChange={(e) => maj('nom', e.target.value)} autoFocus />
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.champPoste', 'Son poste')}
            <input className={`${champ} mt-1`} value={champs.poste} maxLength={80} onChange={(e) => maj('poste', e.target.value)} placeholder={t('legion.champPosteEx', 'Ex. : Responsable des réseaux sociaux')} />
          </label>
          {departements.length > 0 && (
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.champDepartement', 'Son département')}
              <select className={`${champ} mt-1`} value={champs.departement} onChange={(e) => maj('departement', e.target.value)}>
                {departements.map((d) => <option key={d.id} value={d.nom}>{d.nom}</option>)}
              </select>
            </label>
          )}
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.mandat', 'Ce qu’on attend de lui')}
            <textarea className={`${champ} mt-1`} rows={3} value={champs.mandat} maxLength={600} onChange={(e) => maj('mandat', e.target.value)} />
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.personnalite', 'Sa personnalité')}
            <textarea className={`${champ} mt-1`} rows={2} value={champs.personnalite} maxLength={300} onChange={(e) => maj('personnalite', e.target.value)} placeholder={t('legion.champPersoEx', 'Ex. : chaleureux, direct, adore les chiffres')} />
          </label>
          <p className="text-[11px] text-legion-muted">{t('legion.agentAToi', 'Cet agent n’existe que dans ton entreprise : le modifier ne change rien ailleurs.')}</p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => (nouveau ? onFermer() : setEdition(null))} className="rounded-input px-3 py-2 text-caption text-legion-muted hover:text-legion-ink">{t('common.cancel')}</button>
            <button type="submit" disabled={!valide || change} className="rounded-input bg-legion-gold px-3.5 py-2 text-caption font-semibold text-legion-bg disabled:opacity-50">
              {nouveau ? t('legion.creerAgent', 'Créer l’agent') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // Beau, 22/09: « par erreur j'ai enlevé la belle photo de Claudinette,
  // je voulais juste la voir ». Toucher le visage le montre en grand; il ne
  // change plus la tête. Et remplacer une vraie photo demande confirmation.
  const aUnePhoto = agent.apparence?.famille === 'photo';
  async function autreTete() {
    if (aUnePhoto && !window.confirm(t('legion.remplacerPhoto', 'Remplacer sa vraie photo par un dessin ? La photo reste gardée, Claude peut la remettre.'))) return;
    setChange(true);
    try { await onAutreTete(agent); } finally { setChange(false); }
  }

  // La fenêtre est rendue sur <body>, hors de `.legion-app`: elle porte donc
  // sa propre classe pour recevoir la peau sombre.
  return (
    <Modal open={!!agent} onClose={onFermer} title={t('legion.ficheAgent', 'Fiche agent')} className="legion-modale">
      {enGrand && (
        <button type="button" onClick={() => setEnGrand(false)} aria-label="✕"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6">
          <img src={agent.avatar_url} alt={agent.nom} className="h-auto max-h-[80vh] w-[min(85vw,480px)] rounded-2xl object-contain shadow-2xl" />
        </button>
      )}
      <div className="space-y-4 text-legion-ink">
        <div className="flex items-start justify-between gap-3 rounded-card border border-legion-line bg-legion-bg p-3">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => agent.avatar_url && setEnGrand(true)} title={agent.nom} className="rounded-full">
              <Visage a={agent} taille={64} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-section text-legion-ink">{agent.nom}</h3>
                {dept && (
                  <span className="rounded-input border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: dept.couleur, color: dept.couleur, backgroundColor: dept.couleur + '14' }}>
                    {dept.nom}
                  </span>
                )}
              </div>
              <p className="text-caption font-semibold text-legion-muted">{agent.poste}</p>
              {onModifier && !agent.user_id && agent.moteur !== 'claude-code' && (
                <button type="button" onClick={() => setEdition({ nom: agent.nom || '', poste: agent.poste || '', departement: agent.departement || '', mandat: agent.mandat || '', personnalite: agent.personnalite || '' })}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-legion-gold hover:brightness-110">
                  <IconPencil size={12} /> {t('legion.modifier', 'Modifier')}
                </button>
              )}
              <p className="mt-1 flex items-center gap-1 text-[11px] text-legion-muted">
                {agent.choisi_par_lui
                  ? <><IconCircleCheck size={12} className="text-legion-success" /> {t('legion.aChoisiLuiMeme', 'Il a choisi lui-même sa tête et son caractère')}</>
                  : <><IconRobot size={12} /> {t('legion.composeParDefaut', 'Composé par défaut — il n’a pas encore choisi')}</>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="mb-1 text-[10px] uppercase tracking-wider text-legion-muted">{t('legion.interrupteur', 'Interrupteur')}</span>
            <Interrupteur on={!!agent.actif} onChange={(v) => onAllumer(agent, v)} label={agent.actif ? t('legion.eteindre') : t('legion.allumer')} />
            <span className={`mt-1 text-[10px] font-semibold ${agent.actif ? 'text-legion-success' : 'text-legion-muted'}`}>
              {agent.actif ? t('legion.operationnel', 'Opérationnel') : t('legion.enVeille', 'En veille')}
            </span>
          </div>
        </div>

        {agent.mandat && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.mandat', 'Ce qu’on attend de lui')}</p>
            <p className="rounded-card border border-legion-line bg-legion-card p-3 text-caption leading-relaxed text-legion-ink">{agent.mandat}</p>
          </div>
        )}

        {agent.personnalite && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.personnalite', 'Sa personnalité')}</p>
            <p className="rounded-card border border-legion-line bg-legion-card p-3 text-caption italic leading-relaxed text-legion-gold">{agent.personnalite}</p>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.niveauAutonomie', 'Jusqu’où il va sans demander')}</p>
            <span className="font-mono text-[11px] text-legion-gold">{t(`legion.autonomie.${agent.autonomie || 'supervise'}`)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AUTONOMIES.map((niv) => (
              <button key={niv} type="button" onClick={() => onAutonomie(agent, niv)}
                className={`rounded-card border p-2.5 text-left transition ${(agent.autonomie || 'supervise') === niv ? 'border-legion-gold bg-legion-gold/10 text-legion-ink' : 'border-legion-line bg-legion-card text-legion-muted hover:text-legion-ink'}`}>
                <div className="text-caption font-semibold">{t(`legion.autonomie.${niv}`)}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-legion-muted">{t(`legion.autonomieAide.${niv}`)}</div>
              </button>
            ))}
          </div>
        </div>

        {agent.moteur !== 'claude-code' && <CompetencesAgent agent={agent} t={t} />}

        <div className="flex items-center justify-between gap-2 border-t border-legion-line pt-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={autreTete} disabled={change} className="flex items-center gap-1 text-caption text-legion-muted hover:text-legion-ink disabled:opacity-40">
              <IconRefresh size={14} /> {t('legion.autreTete', 'Une autre tête')}
            </button>
            {onVraiePhoto && (
              <button type="button" onClick={() => onVraiePhoto(agent)} disabled={photosEnCours}
                title={t('legion.photosCoutent')}
                className="flex items-center gap-1 text-caption text-legion-gold hover:brightness-110 disabled:opacity-40">
                <IconCamera size={14} /> {photosEnCours ? t('legion.photosEnCours') : t('legion.saVraiePhoto')}
              </button>
            )}
          </div>
          <button type="button" onClick={() => { onEcrireA(agent); onFermer(); }}
            className="flex items-center gap-1.5 rounded-input bg-legion-gold px-3.5 py-2 text-caption font-semibold text-legion-ink shadow-md transition hover:brightness-105">
            <IconMessageCircle size={14} /> {t('legion.ouvrirDiscussion', 'Lui écrire en privé')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
