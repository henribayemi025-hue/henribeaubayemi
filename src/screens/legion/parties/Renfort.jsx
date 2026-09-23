import { useState } from 'react';
import { IconUsersPlus, IconBriefcase, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Modal } from '../../../components/Modal';

// RENFORCER UN SERVICE / UN EXPERT POUR UNE MISSION (23/09).
//
// Beau : « vous avez 20 personnes à tel service ? on vous envoie les agents
// qui font ceci et ceci » ; « un agent expert en audit : on le branche au
// truc de l'entreprise et il fait — agent intérim ».
//
// On décrit le service (ou on choisit un expert et sa mission) ; Legion
// propose des agents, chacun avec ce qu'il prend, ce qu'il ne fait JAMAIS et
// à qui il passe la main ; on coche ; ils rejoignent l'équipe, avec leurs
// premières tâches au tableau. Une date de fin fait d'eux des intérimaires :
// ils s'éteignent seuls le lendemain (0177).

// Les experts qu'on peut prendre pour une mission. La liste n'enferme rien :
// « Autre » laisse écrire le métier.
const EXPERTS = [
  'Audit interne', 'Clôture du mois et contrôle de gestion', 'Paie et déclarations sociales', 'Recouvrement des impayés',
  'Protection des données personnelles', 'Relecture de contrats', 'Étude de marché', 'Tri des candidatures',
  'Service client : tri des demandes', 'Stratégie de prix', 'Autre',
];

export function Renfort({ entrepriseId, departements, t, onFermer, onEngager }) {
  const [mode, setMode] = useState('renfort');
  const [departement, setDepartement] = useState(departements[0]?.nom || '');
  const [nouveauDept, setNouveauDept] = useState('');
  const [description, setDescription] = useState('');
  const [expert, setExpert] = useState(EXPERTS[0]);
  const [autreExpert, setAutreExpert] = useState('');
  const [objectif, setObjectif] = useState('');
  const [finMission, setFinMission] = useState('');
  const [etat, setEtat] = useState('saisie'); // saisie | cherche | propositions | engage
  const [erreur, setErreur] = useState('');
  const [reponse, setReponse] = useState(null);
  const [choisis, setChoisis] = useState([]);

  const deptFinal = departement === '__nouveau' ? nouveauDept.trim() : departement;
  const expertFinal = expert === 'Autre' ? autreExpert.trim() : expert;
  const pret = mode === 'renfort' ? description.trim().length >= 10 : (expertFinal && objectif.trim().length >= 10);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  async function proposer(e) {
    e.preventDefault();
    if (!pret) return;
    setEtat('cherche'); setErreur('');
    const { data, error } = await supabase.functions.invoke('legion-renfort', {
      body: { entreprise_id: entrepriseId, mode, departement: deptFinal, description, expert: expertFinal, objectif, fin_mission: finMission || null },
    });
    if (error || data?.erreur || !data?.agents?.length) {
      setErreur(data?.erreur || error?.message || t('legion.renfort.rien'));
      setEtat('saisie');
      return;
    }
    setReponse(data);
    setChoisis(data.agents.map((_, i) => i));
    setEtat('propositions');
  }

  async function engager() {
    if (!choisis.length) return;
    setEtat('engage');
    const ok = await onEngager(choisis.map((i) => reponse.agents[i]), {
      departement: deptFinal || (mode === 'expert' ? t('legion.renfort.deptExperts') : ''),
      finMission: finMission || null, mode, objectif: mode === 'expert' ? objectif.trim() : description.trim(), expert: expertFinal,
    });
    if (ok) onFermer(); else setEtat('propositions');
  }

  const champ = 'w-full rounded-input border border-legion-line bg-legion-card px-3 py-2 text-[16px] text-legion-ink placeholder:text-legion-muted focus:border-legion-gold focus:outline-none';
  const etiquette = 'mb-1 block text-[12px] font-semibold text-legion-muted';

  return (
    <Modal open onClose={onFermer} title={t('legion.renfort.titre')} className="legion-modale">
      {etat !== 'propositions' && etat !== 'engage' ? (
        <form onSubmit={proposer} className="space-y-3">
          <div className="flex gap-1.5">
            {[['renfort', IconUsersPlus], ['expert', IconBriefcase]].map(([m, I]) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill px-3 py-2 text-[13px] font-semibold ${mode === m ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted'}`}>
                <I size={16} /> {t(`legion.renfort.mode_${m}`)}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] leading-snug text-legion-muted">{t(`legion.renfort.aide_${mode}`)}</p>

          {mode === 'renfort' ? (
            <>
              <div>
                <label className={etiquette} htmlFor="renfort-dept">{t('legion.renfort.service')}</label>
                <select id="renfort-dept" value={departement} onChange={(e) => setDepartement(e.target.value)} className={champ}>
                  {departements.map((d) => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                  <option value="__nouveau">{t('legion.renfort.nouveauService')}</option>
                </select>
                {departement === '__nouveau' && (
                  <input value={nouveauDept} onChange={(e) => setNouveauDept(e.target.value)} maxLength={60} placeholder={t('legion.renfort.nomService')} className={`${champ} mt-1.5`} />
                )}
              </div>
              <div>
                <label className={etiquette} htmlFor="renfort-desc">{t('legion.renfort.description')}</label>
                <textarea id="renfort-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000}
                  placeholder={t('legion.renfort.descriptionExemple')} className={`${champ} resize-none`} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={etiquette} htmlFor="renfort-expert">{t('legion.renfort.expert')}</label>
                <select id="renfort-expert" value={expert} onChange={(e) => setExpert(e.target.value)} className={champ}>
                  {EXPERTS.map((x) => <option key={x} value={x}>{x === 'Autre' ? t('legion.renfort.autre') : x}</option>)}
                </select>
                {expert === 'Autre' && (
                  <input value={autreExpert} onChange={(e) => setAutreExpert(e.target.value)} maxLength={100} placeholder={t('legion.renfort.metier')} className={`${champ} mt-1.5`} />
                )}
              </div>
              <div>
                <label className={etiquette} htmlFor="renfort-obj">{t('legion.renfort.objectif')}</label>
                <textarea id="renfort-obj" value={objectif} onChange={(e) => setObjectif(e.target.value)} rows={3} maxLength={1200}
                  placeholder={t('legion.renfort.objectifExemple')} className={`${champ} resize-none`} />
              </div>
            </>
          )}

          <div>
            <label className={etiquette} htmlFor="renfort-fin">{t('legion.renfort.fin')}</label>
            <input id="renfort-fin" type="date" min={aujourdhui} value={finMission} onChange={(e) => setFinMission(e.target.value)} className={champ} />
            <p className="mt-1 text-[11.5px] text-legion-muted">{t('legion.renfort.finAide')}</p>
          </div>

          {erreur && <p className="text-[13px] text-legion-danger">{erreur}</p>}
          <button type="submit" disabled={!pret || etat === 'cherche'}
            className="w-full rounded-pill bg-legion-accent px-4 py-2.5 text-[15px] font-semibold text-white disabled:opacity-40">
            {etat === 'cherche' ? t('legion.renfort.cherche') : t('legion.renfort.proposer')}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {reponse?.lecture && <p className="text-[13px] leading-snug text-legion-ink">{reponse.lecture}</p>}
          <ul className="space-y-2">
            {reponse.agents.map((a, i) => {
              const pris = choisis.includes(i);
              return (
                <li key={i}>
                  <button type="button" onClick={() => setChoisis((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))} aria-pressed={pris}
                    className={`w-full rounded-card border p-3 text-left transition ${pris ? 'border-legion-gold bg-legion-gold/10' : 'border-legion-line bg-legion-card'}`}>
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block text-[15px] font-semibold text-legion-ink">{a.nom}</span>
                        <span className="block text-[12.5px] text-legion-gold">{a.poste}</span>
                      </span>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${pris ? 'border-legion-gold bg-legion-gold text-legion-bg' : 'border-legion-line'}`}>{pris && <IconCheck size={13} />}</span>
                    </span>
                    <span className="mt-1.5 block text-[13px] text-legion-ink">{a.mandat}</span>
                    {a.prend?.length > 0 && (
                      <span className="mt-1.5 block text-[12.5px] text-legion-muted"><b className="text-legion-ink">{t('legion.renfort.prend')}</b> {a.prend.join(' · ')}</span>
                    )}
                    <span className="mt-1 block text-[12.5px] text-legion-muted"><b className="text-legion-danger">{t('legion.renfort.jamais')}</b> {a.jamais}</span>
                    <span className="mt-1 block text-[12.5px] text-legion-muted"><b className="text-legion-ink">{t('legion.renfort.relais')}</b> {a.relais_humain}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {reponse?.reste_humain && <p className="rounded-card bg-legion-panel p-2.5 text-[12.5px] text-legion-muted"><b className="text-legion-ink">{t('legion.renfort.resteHumain')}</b> {reponse.reste_humain}</p>}
          {finMission && <p className="text-[12.5px] text-legion-muted">{t('legion.renfort.interimJusquau', { date: new Date(`${finMission}T12:00:00`).toLocaleDateString() })}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setEtat('saisie')} className="flex-1 rounded-pill border border-legion-line px-4 py-2.5 text-[14px] font-semibold text-legion-ink">{t('legion.renfort.modifier')}</button>
            <button type="button" onClick={engager} disabled={!choisis.length || etat === 'engage'}
              className="flex-1 rounded-pill bg-legion-accent px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">
              {etat === 'engage' ? t('legion.renfort.engagement') : t('legion.renfort.engager', { n: choisis.length })}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
