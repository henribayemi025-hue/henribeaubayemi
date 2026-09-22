import { useState } from 'react';
import { IconMessageCircle, IconRobot, IconRefresh, IconCircleCheck, IconCamera } from '@tabler/icons-react';
import { Modal } from '../../../components/Modal';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { AUTONOMIES } from './outils';
import { CompetencesAgent } from './Competences';

// La fiche d'un agent: qui il est, ce qu'on attend de lui, comment il parle,
// et les deux réglages qui comptent — l'interrupteur, et jusqu'où il a le
// droit d'aller sans demander. Beau: « commençons par l'audit de chaque
// personne ».
export function FicheAgent({ agent, dept, onFermer, onAllumer, onAutonomie, onEcrireA, onAutreTete, onVraiePhoto, photosEnCours, t }) {
  const [change, setChange] = useState(false);
  if (!agent) return null;

  async function autreTete() {
    setChange(true);
    try { await onAutreTete(agent); } finally { setChange(false); }
  }

  // La fenêtre est rendue sur <body>, hors de `.legion-app`: elle porte donc
  // sa propre classe pour recevoir la peau sombre.
  return (
    <Modal open={!!agent} onClose={onFermer} title={t('legion.ficheAgent', 'Fiche agent')} className="legion-modale">
      <div className="space-y-4 text-legion-ink">
        <div className="flex items-start justify-between gap-3 rounded-card border border-legion-line bg-legion-bg p-3">
          <div className="flex items-start gap-3">
            <button type="button" onClick={autreTete} disabled={change} title={t('legion.autreTete', 'Une autre tête')} className="rounded-full disabled:opacity-40">
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
