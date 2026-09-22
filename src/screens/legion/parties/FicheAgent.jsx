import { useState } from 'react';
import { IconMessageCircle, IconRobot, IconRefresh, IconCircleCheck } from '@tabler/icons-react';
import { Modal } from '../../../components/Modal';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { AUTONOMIES } from './outils';

// La fiche d'un agent: qui il est, ce qu'on attend de lui, comment il parle,
// et les deux réglages qui comptent — l'interrupteur, et jusqu'où il a le
// droit d'aller sans demander. Beau: « commençons par l'audit de chaque
// personne ».
export function FicheAgent({ agent, dept, onFermer, onAllumer, onAutonomie, onEcrireA, onAutreTete, t }) {
  const [change, setChange] = useState(false);
  if (!agent) return null;

  async function autreTete() {
    setChange(true);
    try { await onAutreTete(agent); } finally { setChange(false); }
  }

  return (
    <Modal open={!!agent} onClose={onFermer} title={t('legion.ficheAgent', 'Fiche agent')}>
      <div className="space-y-4 text-ink">
        <div className="flex items-start justify-between gap-3 rounded-card border border-hairline bg-base p-3">
          <div className="flex items-start gap-3">
            <button type="button" onClick={autreTete} disabled={change} title={t('legion.autreTete', 'Une autre tête')} className="rounded-full disabled:opacity-40">
              <Visage a={agent} taille={64} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-section text-ink">{agent.nom}</h3>
                {dept && (
                  <span className="rounded-input border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: dept.couleur, color: dept.couleur, backgroundColor: dept.couleur + '14' }}>
                    {dept.nom}
                  </span>
                )}
              </div>
              <p className="text-caption font-semibold text-muted">{agent.poste}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                {agent.choisi_par_lui
                  ? <><IconCircleCheck size={12} className="text-success" /> {t('legion.aChoisiLuiMeme', 'Il a choisi lui-même sa tête et son caractère')}</>
                  : <><IconRobot size={12} /> {t('legion.composeParDefaut', 'Composé par défaut — il n’a pas encore choisi')}</>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="mb-1 text-[10px] uppercase tracking-wider text-muted">{t('legion.interrupteur', 'Interrupteur')}</span>
            <Interrupteur on={!!agent.actif} onChange={(v) => onAllumer(agent, v)} label={agent.actif ? t('legion.eteindre') : t('legion.allumer')} />
            <span className={`mt-1 text-[10px] font-semibold ${agent.actif ? 'text-success' : 'text-muted'}`}>
              {agent.actif ? t('legion.operationnel', 'Opérationnel') : t('legion.enVeille', 'En veille')}
            </span>
          </div>
        </div>

        {agent.mandat && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{t('legion.mandat', 'Ce qu’on attend de lui')}</p>
            <p className="rounded-card border border-hairline bg-white p-3 text-caption leading-relaxed text-ink">{agent.mandat}</p>
          </div>
        )}

        {agent.personnalite && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{t('legion.personnalite', 'Sa personnalité')}</p>
            <p className="rounded-card border border-hairline bg-white p-3 text-caption italic leading-relaxed text-teal">{agent.personnalite}</p>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('legion.niveauAutonomie', 'Jusqu’où il va sans demander')}</p>
            <span className="font-mono text-[11px] text-brass">{t(`legion.autonomie.${agent.autonomie || 'supervise'}`)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AUTONOMIES.map((niv) => (
              <button key={niv} type="button" onClick={() => onAutonomie(agent, niv)}
                className={`rounded-card border p-2.5 text-left transition ${(agent.autonomie || 'supervise') === niv ? 'border-brass bg-brass/10 text-ink' : 'border-hairline bg-white text-muted hover:text-ink'}`}>
                <div className="text-caption font-semibold">{t(`legion.autonomie.${niv}`)}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-muted">{t(`legion.autonomieAide.${niv}`)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
          <button type="button" onClick={autreTete} disabled={change} className="flex items-center gap-1 text-caption text-muted hover:text-ink disabled:opacity-40">
            <IconRefresh size={14} /> {t('legion.autreTete', 'Une autre tête')}
          </button>
          <button type="button" onClick={() => { onEcrireA(agent); onFermer(); }}
            className="flex items-center gap-1.5 rounded-input bg-brass px-3.5 py-2 text-caption font-semibold text-ink shadow-md transition hover:brightness-105">
            <IconMessageCircle size={14} /> {t('legion.ouvrirDiscussion', 'Lui écrire en privé')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
