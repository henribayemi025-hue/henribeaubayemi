import { useEffect, useState } from 'react';
import { IconMessageCircle, IconRobot, IconRefresh, IconCircleCheck, IconCamera, IconPencil, IconSearch } from '@tabler/icons-react';
import { Modal } from '../../../components/Modal';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { AUTONOMIES } from './outils';
import { CompetencesAgent } from './Competences';

// Ce qu'un agent peut lire parmi ce que l'entreprise a branché (0177, E4).
// Vide = tout. Les fonctions des agents s'y tiennent.
const SOURCES = ['mesures', 'boutique', 'comptabilite', 'web', 'github', 'documents'];

// Chercher un poste dans le catalogue (studio_modele_postes) au lieu de
// partir d'une page blanche (D7, 23/09). Toucher un résultat remplit le
// poste, le mandat, et le département s'il existe dans l'entreprise.
function ChercherCatalogue({ onChoisir, t }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [total, setTotal] = useState(null);
  useEffect(() => {
    supabase.from('studio_modele_postes').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count ?? null), () => {});
  }, []);
  useEffect(() => {
    const propre = q.replace(/[^\p{L}\p{N} '’-]/gu, ' ').trim();
    if (propre.length < 3) { setRes([]); return undefined; }
    const minuterie = setTimeout(async () => {
      const motif = `%${propre.replace(/\s+/g, '%')}%`;
      const { data } = await supabase.from('studio_modele_postes').select('id, poste, mandat, departement, modele')
        .or(`poste.ilike.${motif},mandat.ilike.${motif}`).order('poste').limit(30);
      // Un même intitulé revient d'un modèle à l'autre: on n'en garde qu'un.
      const vus = new Set();
      setRes((data || []).filter((x) => { const k = x.poste.toLowerCase(); if (vus.has(k)) return false; vus.add(k); return true; }).slice(0, 12));
    }, 300);
    return () => clearTimeout(minuterie);
  }, [q]);
  return (
    <div className="rounded-card border border-legion-line bg-legion-bg p-2.5">
      <label className="flex items-center gap-2 text-caption text-legion-muted">
        <IconSearch size={15} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={total ? t('legion.catalogueChercher', { n: total.toLocaleString(), defaultValue: 'Chercher parmi {{n}} postes (ex. : paie, audit, réseaux sociaux)' }) : t('legion.catalogueChercherSimple', 'Chercher un poste dans le catalogue')}
          className="w-full bg-transparent text-[16px] text-legion-ink outline-none placeholder:text-legion-muted" />
      </label>
      {res.length > 0 && (
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {res.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => { onChoisir(x); setQ(''); setRes([]); }} className="w-full rounded-input px-2 py-1.5 text-left hover:bg-legion-card">
                <span className="block text-caption font-semibold text-legion-ink">{x.poste}</span>
                <span className="block text-[11px] text-legion-muted">{x.departement} · {x.mandat?.slice(0, 110)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Ce que sa consigne CONTIENT, dans l'ordre où il le reçoit avant chaque
// réponse (E4, 23/09: « voir exactement ce qu'un agent reçoit »). Chaque
// partie avec son vrai contenu: rien d'inventé, rien de caché.
function SaConsigne({ agent, t }) {
  const [ouvert, setOuvert] = useState(false);
  const [regles, setRegles] = useState(null);
  const [competences, setCompetences] = useState(null);
  useEffect(() => {
    if (!ouvert || regles) return;
    supabase.from('legion_memoire').select('regle').eq('entreprise_id', agent.entreprise_id).eq('actif', true).order('created_at').limit(60)
      .then(({ data }) => setRegles((data || []).map((x) => x.regle)), () => setRegles([]));
    supabase.from('legion_competences').select('nom').eq('agent_id', agent.id).eq('actif', true).limit(4)
      .then(({ data }) => setCompetences((data || []).map((x) => x.nom)), () => setCompetences([]));
  }, [ouvert, regles, agent.entreprise_id, agent.id]);
  const lire = Array.isArray(agent.peut_lire)
    ? (agent.peut_lire.length ? agent.peut_lire.map((x) => t(`legion.source.${x}`)).join(', ') : t('legion.peutLireRien'))
    : t('legion.peutLireTout');
  const parties = [
    [t('legion.consigne.identite', 'Qui il est'), `${agent.nom}, ${agent.poste}${agent.departement ? ` — ${agent.departement}` : ''}`],
    [t('legion.mandat'), agent.mandat || '—'],
    [t('legion.personnalite'), agent.personnalite || '—'],
    agent.mission?.objectif ? [t('legion.mission'), agent.mission.objectif] : null,
    [t('legion.jamais'), agent.jamais || t('legion.jamaisDefaut')],
    [t('legion.peutLire'), lire],
    [t('legion.consigne.regles', 'Les règles de la maison'), regles === null ? '…' : (regles.length ? regles.map((r) => `• ${r}`).join('\n') : '—')],
    [t('legion.consigne.competences', 'Ses compétences (4 au plus)'), competences === null ? '…' : (competences.length ? competences.join(', ') : '—')],
    [t('legion.consigne.contexte', 'Le contexte'), t('legion.consigne.contexteTexte', 'Le projet de l’entreprise et sa feuille de route ; les derniers messages du salon et sa mémoire ; ce qui s’est dit ailleurs et le concerne ; ses tâches ouvertes et le plan de son département ; l’équipe (qui est allumé).')],
    [t('legion.consigne.fixes', 'Les règles fixes de Legion'), t('legion.consigne.fixesTexte', 'Répondre à la question posée, dans la langue du message ; livrer plutôt que proposer ; ton chaleureux d’expert ; aucun chiffre ni travail inventé ; ne rien dire fait qui ne l’est pas (seul ton bouton « Confirmer » exécute une action) ; poser une vraie question quand il lui manque quelque chose. Une relecture vérifie les chiffres avant envoi.')],
  ].filter(Boolean);
  return (
    <div>
      <button type="button" onClick={() => setOuvert((v) => !v)} className="text-[11px] font-semibold uppercase tracking-wider text-legion-gold">
        {ouvert ? '▾' : '▸'} {t('legion.consigne.titre', 'Ce qu’il reçoit avant chaque réponse')}
      </button>
      {ouvert && (
        <ol className="mt-1.5 space-y-1.5 rounded-card border border-legion-line bg-legion-card p-3 text-caption leading-relaxed">
          {parties.map(([titre, texte], i) => (
            <li key={i}><b className="text-legion-ink">{i + 1}. {titre}</b><span className="block whitespace-pre-wrap text-legion-muted">{texte}</span></li>
          ))}
        </ol>
      )}
    </div>
  );
}

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
  const champs = edition || (nouveau ? { nom: '', poste: '', departement: agent.departement || departements[0]?.nom || '', mandat: '', personnalite: '', jamais: '', peut_lire: null, fin_mission: '' } : null);
  if (champs) {
    const maj = (k, v) => setEdition({ ...champs, [k]: v });
    const valide = champs.nom.trim().length >= 2 && champs.poste.trim().length >= 2;
    async function enregistrer(e) {
      e.preventDefault();
      if (!valide || change) return;
      setChange(true);
      try {
        const propre = Object.fromEntries(['nom', 'poste', 'departement', 'mandat', 'personnalite', 'jamais'].map((k) => [k, String(champs[k] || '').trim()]));
        propre.jamais = propre.jamais || null;
        propre.peut_lire = Array.isArray(champs.peut_lire) ? champs.peut_lire : null;
        propre.fin_mission = champs.fin_mission || null;
        // Une date de fin fait de lui un intérimaire: il s'éteint seul le lendemain.
        propre.interim = !!champs.fin_mission;
        if (nouveau) { await onCreer(propre); setEdition(null); onFermer(); } else { await onModifier(agent, propre); setEdition(null); }
      } finally { setChange(false); }
    }
    const champ = 'w-full rounded-input border border-legion-line bg-legion-card px-3 py-2 text-caption text-legion-ink outline-none focus:border-legion-gold';
    return (
      <Modal open onClose={() => (nouveau ? onFermer() : setEdition(null))} title={nouveau ? t('legion.nouvelAgent', 'Nouvel agent') : t('legion.modifierAgent', 'Modifier l’agent')} className="legion-modale">
        <form onSubmit={enregistrer} className="space-y-3 text-legion-ink">
          {nouveau && (
            <ChercherCatalogue t={t} onChoisir={(x) => setEdition({ ...champs, poste: x.poste, mandat: x.mandat || '',
              departement: departements.find((d) => d.nom.toLowerCase() === String(x.departement || '').toLowerCase())?.nom || champs.departement })} />
          )}
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
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.jamais', 'Ce qu’il ne fait jamais')}
            <textarea className={`${champ} mt-1`} rows={2} value={champs.jamais || ''} maxLength={800} onChange={(e) => maj('jamais', e.target.value)} placeholder={t('legion.jamaisEx', 'Ex. : promettre un remboursement ; parler des salaires ; envoyer quoi que ce soit sans validation')} />
          </label>
          <fieldset>
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.peutLire', 'Ce qu’il peut lire')}</legend>
            <label className="mt-1 flex items-center gap-2 text-caption">
              <input type="checkbox" checked={!Array.isArray(champs.peut_lire)} onChange={(e) => maj('peut_lire', e.target.checked ? null : [])} className="h-4 w-4 accent-legion-gold" />
              {t('legion.peutLireTout', 'Tout ce que l’entreprise a branché')}
            </label>
            {Array.isArray(champs.peut_lire) && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SOURCES.map((x) => {
                  const pris = champs.peut_lire.includes(x);
                  return (
                    <button key={x} type="button" aria-pressed={pris} onClick={() => maj('peut_lire', pris ? champs.peut_lire.filter((y) => y !== x) : [...champs.peut_lire, x])}
                      className={`rounded-pill px-2.5 py-1 text-[12px] font-semibold ${pris ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>
                      {t(`legion.source.${x}`)}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.finMission', 'Fin de mission (intérim)')}
            <input type="date" className={`${champ} mt-1`} value={champs.fin_mission || ''} onChange={(e) => maj('fin_mission', e.target.value)} />
            <span className="mt-0.5 block text-[10.5px] normal-case tracking-normal">{t('legion.finMissionAide', 'Vide : il reste. Une date : il s’éteint seul le lendemain matin, et le dit.')}</span>
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
                <button type="button" onClick={() => setEdition({ nom: agent.nom || '', poste: agent.poste || '', departement: agent.departement || '', mandat: agent.mandat || '', personnalite: agent.personnalite || '', jamais: agent.jamais || '', peut_lire: Array.isArray(agent.peut_lire) ? agent.peut_lire : null, fin_mission: agent.fin_mission || '' })}
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

        {/* La fiche de mission (renfort d'un service, expert, intérim — 0177) */}
        {(agent.mission || agent.fin_mission) && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.mission', 'Sa mission')}</p>
            <div className="space-y-1 rounded-card border border-legion-line bg-legion-card p-3 text-caption leading-relaxed">
              {agent.mission?.objectif && <p>{agent.mission.objectif}</p>}
              {agent.mission?.prend?.length > 0 && <p className="text-legion-muted"><b className="text-legion-ink">{t('legion.renfort.prend')}</b> {agent.mission.prend.join(' · ')}</p>}
              {agent.mission?.relais_humain && <p className="text-legion-muted"><b className="text-legion-ink">{t('legion.renfort.relais')}</b> {agent.mission.relais_humain}</p>}
              {agent.fin_mission && <p className="font-semibold text-legion-gold">{t('legion.jusquau', { date: new Date(`${agent.fin_mission}T12:00:00`).toLocaleDateString(), defaultValue: 'Intérim jusqu’au {{date}}' })}</p>}
            </div>
          </div>
        )}

        {/* Ce qu'il ne fait jamais, et ce qu'il peut lire (E3, E4): les
            fonctions des agents s'y tiennent avant chaque réponse. */}
        {!agent.user_id && agent.moteur !== 'claude-code' && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.sesLimites', 'Ses limites')}</p>
            <div className="space-y-1 rounded-card border border-legion-line bg-legion-card p-3 text-caption leading-relaxed">
              <p><b className="text-legion-danger">{t('legion.jamais', 'Ce qu’il ne fait jamais')}</b> — {agent.jamais || t('legion.jamaisDefaut', 'rien de précisé : les règles de la maison et celles de Legion s’appliquent (rien d’envoyé ni de modifié sans ton clic).')}</p>
              <p><b className="text-legion-ink">{t('legion.peutLire', 'Ce qu’il peut lire')}</b> — {Array.isArray(agent.peut_lire) ? (agent.peut_lire.length ? agent.peut_lire.map((x) => t(`legion.source.${x}`)).join(', ') : t('legion.peutLireRien', 'rien au-delà de la conversation')) : t('legion.peutLireTout', 'Tout ce que l’entreprise a branché')}</p>
            </div>
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

        {!agent.user_id && agent.moteur !== 'claude-code' && <SaConsigne agent={agent} t={t} />}

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
