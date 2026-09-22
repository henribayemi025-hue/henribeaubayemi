import { useState } from 'react';
import { IconLayoutKanban, IconX, IconPlus, IconArrowRight, IconArrowLeft, IconMessageCircle, IconFilter } from '@tabler/icons-react';
import { Visage } from './Visage';
import { STATUTS, statutDe, PRIORITES, COULEUR_PRIORITE } from './outils';

// Le tableau des tâches — la colonne de droite des maquettes. Une tâche est
// un message de genre « tache »: elle naît dans un salon (ou d'un message
// qu'on transforme), elle avance de colonne en colonne, elle est tenue par
// un agent. Convoquer l'agent ouvre son salon privé avec la question
// déjà écrite.
export function Kanban({ taches, agents, departements, onStatut, onCreer, onConvoquer, onRenvoyer, onFermer, t, className = '' }) {
  const [filtre, setFiltre] = useState('tous');
  // La revue d'un livrable: quelle tâche est en train d'être renvoyée.
  const [renvoi, setRenvoi] = useState(null); // { id, remarque, regle }
  const [ajout, setAjout] = useState(false);
  const [titre, setTitre] = useState('');
  const [agentId, setAgentId] = useState('');
  const [priorite, setPriorite] = useState('haute');

  const machines = agents.filter((a) => !a.user_id);
  const agentDe = (id) => agents.find((a) => a.id === id);
  const deptDe = (tache) => departements.find((d) => d.id === tache.canal_id) || departements.find((d) => d.nom === agentDe(tache.assigne_a)?.departement);
  const visibles = taches.filter((x) => filtre === 'tous' || deptDe(x)?.id === filtre);

  function avancer(x) {
    const s = statutDe(x); const i = STATUTS.findIndex((k) => k.cle === s);
    if (i < STATUTS.length - 1) onStatut(x, STATUTS[i + 1].cle);
  }
  function reculer(x) {
    const s = statutDe(x); const i = STATUTS.findIndex((k) => k.cle === s);
    if (i > 0) onStatut(x, STATUTS[i - 1].cle);
  }
  function creer(e) {
    e.preventDefault();
    if (!titre.trim()) return;
    onCreer({ texte: titre.trim(), assigne_a: agentId || null, priorite });
    setTitre(''); setAjout(false);
  }

  return (
    <aside className={`flex w-full shrink-0 flex-col border-l border-legion-line bg-legion-panel lg:w-[360px] ${className}`}>
      <div className="flex items-center justify-between border-b border-legion-line p-3">
        <h2 className="flex items-center gap-2 text-body font-semibold text-legion-ink"><IconLayoutKanban size={16} className="text-legion-gold" /> {t('legion.tableauTaches', 'Tableau des tâches')}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAjout((v) => !v)}
            className="flex items-center gap-1 rounded-input border border-legion-gold/40 bg-legion-gold/10 px-2 py-1 text-[11px] font-semibold text-legion-ink transition hover:bg-legion-gold/25">
            <IconPlus size={13} /> {t('legion.nouvelleTache', 'Nouvelle tâche')}
          </button>
          {onFermer && (
            <button type="button" onClick={onFermer} aria-label={t('common.close', 'Fermer')} className="rounded-input p-1.5 text-legion-muted hover:bg-legion-bg hover:text-legion-ink">
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-legion-line bg-legion-bg/50 px-3 py-1.5 text-caption" style={{ scrollbarWidth: 'none' }}>
        <IconFilter size={13} className="shrink-0 text-legion-muted" />
        <button type="button" onClick={() => setFiltre('tous')} className={`shrink-0 rounded-input px-2 py-0.5 text-[11px] font-semibold ${filtre === 'tous' ? 'bg-ink text-white' : 'text-legion-muted hover:text-legion-ink'}`}>
          {t('legion.tous', 'Tous')} ({taches.length})
        </button>
        {departements.map((d) => (
          <button key={d.id} type="button" onClick={() => setFiltre(d.id)}
            className={`shrink-0 rounded-input border px-2 py-0.5 text-[11px] font-semibold ${filtre === d.id ? 'text-white' : 'border-transparent text-legion-muted hover:text-legion-ink'}`}
            style={filtre === d.id ? { backgroundColor: d.couleur, borderColor: d.couleur } : undefined}>
            {d.nom}
          </button>
        ))}
      </div>

      {ajout && (
        <form onSubmit={creer} className="space-y-2 border-b border-legion-line bg-legion-card p-3 text-caption">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.nouvelleMission', 'Nouvelle mission pour un agent')}</p>
          <input autoFocus value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={t('legion.intituleTache', 'Ce qu’il faut faire…')} className="input w-full" />
          <div className="grid grid-cols-2 gap-2">
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="input w-full">
              <option value="">{t('legion.personneEncore', 'Personne encore (libre)')}</option>
              {machines.map((a) => <option key={a.id} value={a.id}>{a.nom} — {a.poste}</option>)}
            </select>
            <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className="input w-full">
              {PRIORITES.map((p) => <option key={p} value={p}>{t(`legion.priorite.${p}`)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAjout(false)} className="rounded-input px-2.5 py-1 text-legion-muted hover:bg-legion-bg">{t('common.cancel', 'Annuler')}</button>
            <button type="submit" className="rounded-input bg-legion-gold px-3 py-1 font-semibold text-legion-ink">{t('legion.creerTache', 'Créer la tâche')}</button>
          </div>
        </form>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {STATUTS.map((col) => {
          const dedans = visibles.filter((x) => statutDe(x) === col.cle);
          return (
            <div key={col.cle} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: col.couleur }}>{t(`legion.statut.${col.cle}`)}</span>
                <span className="rounded-input border border-legion-line bg-legion-card px-1.5 font-mono text-[11px] text-legion-muted">{dedans.length}</span>
              </div>
              {dedans.length === 0 ? (
                <div className="rounded-card border border-dashed border-legion-line p-3 text-center text-[11px] text-legion-muted">{t('legion.colonneVide', 'Rien ici')}</div>
              ) : dedans.map((x) => {
                const a = agentDe(x.assigne_a);
                const d = deptDe(x);
                const prio = x.meta?.priorite || 'moyenne';
                const s = statutDe(x);
                const pct = s === 'fait' ? 100 : s === 'revue' ? 85 : s === 'en_cours' ? 50 : 10;
                return (
                  <div key={x.id} className="group space-y-2 rounded-card border border-legion-line bg-legion-card p-3 shadow-sm transition hover:border-legion-gold/50">
                    <div className="flex items-center justify-between text-[10px]">
                      {d ? <span className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: d.couleur, color: d.couleur, backgroundColor: d.couleur + '14' }}>{d.nom}</span> : <span />}
                      <span className="rounded border px-1.5 py-0.5 font-mono font-semibold uppercase" style={{ color: COULEUR_PRIORITE[prio], borderColor: COULEUR_PRIORITE[prio] + '55', backgroundColor: COULEUR_PRIORITE[prio] + '14' }}>{t(`legion.priorite.${prio}`)}</span>
                    </div>
                    <p className="text-caption font-semibold leading-snug text-legion-ink group-hover:text-legion-gold">{x.texte}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-legion-bg">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#2A9D8F' : (d?.couleur || '#E09F3E') }} />
                    </div>
                    {/* À revoir: le livrable est dans le salon; ici, on tranche.
                        Beau, 22/09: « donne-moi le résultat » — et ce qu'il
                        corrige doit servir la fois suivante. */}
                    {s === 'revue' && onRenvoyer && (
                      renvoi?.id === x.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); if (!renvoi.remarque.trim()) return; onRenvoyer(x, renvoi.remarque.trim(), renvoi.regle); setRenvoi(null); }} className="space-y-1.5 rounded-input border border-legion-line bg-legion-bg p-2">
                          <textarea autoFocus rows={2} value={renvoi.remarque} onChange={(e) => setRenvoi({ ...renvoi, remarque: e.target.value })}
                            placeholder={t('legion.remarquePlaceholder', 'Ce qui ne va pas, ce que tu attends…')} className="input w-full text-[13px]" />
                          <label className="flex items-center gap-1.5 text-[11px] text-legion-muted">
                            <input type="checkbox" checked={renvoi.regle} onChange={(e) => setRenvoi({ ...renvoi, regle: e.target.checked })} />
                            {t('legion.enFaireUneRegle', 'En faire une règle pour toute l’équipe')}
                          </label>
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setRenvoi(null)} className="rounded-input px-2 py-1 text-[11px] text-legion-muted hover:bg-legion-card">{t('common.cancel', 'Annuler')}</button>
                            <button type="submit" className="rounded-input bg-legion-gold px-2.5 py-1 text-[11px] font-semibold text-legion-ink">{t('legion.renvoyer', 'Renvoyer')}</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => onStatut(x, 'fait')} className="flex-1 rounded-input bg-legion-success/15 px-2 py-1 text-[11px] font-semibold text-legion-success hover:bg-legion-success/25">✓ {t('legion.valider', 'Valider')}</button>
                          <button type="button" onClick={() => setRenvoi({ id: x.id, remarque: '', regle: false })} className="flex-1 rounded-input bg-legion-danger/10 px-2 py-1 text-[11px] font-semibold text-legion-danger hover:bg-legion-danger/20">↩ {t('legion.renvoyer', 'Renvoyer')}</button>
                        </div>
                      )
                    )}
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => a && onConvoquer(x, a)} disabled={!a} className="flex min-w-0 items-center gap-1.5 text-left disabled:cursor-default" title={a ? t('legion.convoquer', 'Lui demander où il en est') : ''}>
                        {a ? <Visage a={a} taille={22} point={false} /> : <span className="h-[22px] w-[22px] rounded-full border border-dashed border-legion-line" />}
                        <span className="truncate text-[11px] text-legion-muted">{a ? a.nom : t('legion.libre', 'Libre — personne ne l’a prise')}</span>
                        {a && <IconMessageCircle size={12} className="shrink-0 text-legion-muted" />}
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" onClick={() => reculer(x)} disabled={s === 'a_faire'} aria-label="←" className="rounded p-1 text-legion-muted hover:bg-legion-bg disabled:opacity-30"><IconArrowLeft size={13} /></button>
                        <button type="button" onClick={() => avancer(x)} disabled={s === 'fait'} aria-label="→" className="rounded p-1 text-legion-muted hover:bg-legion-bg disabled:opacity-30"><IconArrowRight size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
