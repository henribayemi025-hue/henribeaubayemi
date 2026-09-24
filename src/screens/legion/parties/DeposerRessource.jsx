import { useState } from 'react';
import { IconSchool, IconLink, IconExternalLink } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// « DÉPOSER UNE RESSOURCE » — le vestiaire d'entraînement, sans passer par
// Claude (Beau, 24/09).
//
// Beau a envoyé 19 ressources à la main ce jour-là ; chacune a eu sa fiche
// (docs/vestiaire/GABARIT.md) et ses compétences. Ici il colle un lien
// (dépôt GitHub, article, page Notion, vidéo) ou un texte : Mentor, l'agent
// de la formation, écrit la fiche tout seul (legion-vestiaire), elle se range
// dans les documents juste au-dessus, et il PROPOSE des compétences. Rien
// n'est posé sur un agent avant le bouton « Équiper » — et ce bouton passe
// par la fonction : legion_competences n'accepte pas d'insertion directe
// depuis l'écran (0146).

const VERDICT_STYLE = {
  retenu: 'bg-legion-gold text-legion-bg',
  reserve: 'bg-legion-card text-legion-ink',
  mis_de_cote: 'bg-legion-card text-legion-muted',
};

export function DeposerRessource({ entreprise, onFiche, t }) {
  const [lien, setLien] = useState('');
  const [texte, setTexte] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [fiche, setFiche] = useState(null);
  const [etat, setEtat] = useState({});           // clé → 'encours' | 'fait' | message d'erreur
  const [retires, setRetires] = useState(new Set()); // « clé:agent » que la personne a enlevés

  const pret = lien.trim().length > 3 || texte.trim().length >= 40;

  async function deposer(e) {
    e.preventDefault();
    if (!pret || occupe) return;
    setErreur(''); setFiche(null); setEtat({}); setRetires(new Set()); setOccupe(true);
    try {
      const { data, error } = await supabase.functions.invoke('legion-vestiaire', {
        body: { action: 'deposer', entreprise_id: entreprise.id, lien: lien.trim() || undefined, texte: texte.trim() || undefined },
      });
      if (error || data?.erreur) { setErreur(data?.erreur || error?.message || t('errors.generic')); return; }
      setFiche(data);
      setLien(''); setTexte('');
      // La fiche est un document « à lire » : l'écran Documents la découpe et l'indexe.
      onFiche?.(data.document_id);
    } catch (err) { setErreur(err.message || t('errors.generic')); }
    finally { setOccupe(false); }
  }

  function basculer(cle, agentId) {
    setRetires((s) => {
      const n = new Set(s);
      const k = `${cle}:${agentId}`;
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  }

  async function equiper(c) {
    const agents = c.agents.filter((a) => !retires.has(`${c.cle}:${a.id}`));
    if (!agents.length) return;
    setEtat((s) => ({ ...s, [c.cle]: 'encours' }));
    const { data, error } = await supabase.functions.invoke('legion-vestiaire', {
      body: {
        action: 'equiper', entreprise_id: entreprise.id,
        competence: { cle: c.cle, nom: c.nom, description: c.description, contenu: c.contenu, licence: c.licence, source: c.source },
        agents: agents.map((a) => ({ agent_id: a.id, pourquoi: a.pourquoi })),
      },
    });
    setEtat((s) => ({ ...s, [c.cle]: error || data?.erreur ? (data?.erreur || error.message) : 'fait' }));
  }

  const champ = 'w-full rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[15px] text-legion-ink placeholder:text-legion-muted focus:border-legion-gold focus:outline-none';

  return (
    <div className="mt-5 border-t border-legion-line pt-4">
      <h4 className="flex items-center gap-2 text-[14px] font-semibold text-legion-ink"><IconSchool size={17} className="text-legion-gold" /> {t('legion.vestiaire.titre')}</h4>
      <p className="mt-1 text-[12.5px] leading-snug text-legion-muted">{t('legion.vestiaire.aide')}</p>
      <form onSubmit={deposer} className="mt-2 space-y-1.5">
        <div className="relative">
          <IconLink size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-legion-muted" />
          <input value={lien} onChange={(e) => setLien(e.target.value)} type="url" inputMode="url" maxLength={2000} placeholder={t('legion.vestiaire.lien')} className={`${champ} pl-8`} />
        </div>
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} maxLength={60000} placeholder={t('legion.vestiaire.texte')} className={`${champ} resize-y`} />
        <button type="submit" disabled={occupe || !pret}
          className="rounded-pill bg-legion-accent px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40">
          {occupe ? t('legion.vestiaire.enCours') : t('legion.vestiaire.lancer')}
        </button>
        {occupe && <p className="text-[12px] text-legion-muted">{t('legion.vestiaire.patience')}</p>}
      </form>

      {fiche && (
        <div className="mt-3 space-y-2.5 rounded-card border border-legion-line bg-legion-bg p-3 text-[13.5px]">
          <div>
            <p className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-pill px-2 py-0.5 text-[11.5px] font-semibold ${VERDICT_STYLE[fiche.verdict] || VERDICT_STYLE.reserve}`}>{t(`legion.vestiaire.verdict_${fiche.verdict}`)}</span>
              <a href={fiche.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-legion-ink underline-offset-2 hover:underline">
                {t('legion.vestiaire.fiche', { n: fiche.numero, titre: fiche.titre })} <IconExternalLink size={13} />
              </a>
            </p>
            {fiche.verdict_texte && <p className="mt-1 text-legion-ink">{fiche.verdict_texte}</p>}
            <p className="mt-1 text-[12px] text-legion-muted">
              {t('legion.vestiaire.par', { auteur: fiche.auteur })} · <b className="font-semibold">{t('legion.vestiaire.licence')}</b> {fiche.licence}
            </p>
            {fiche.acces?.length > 0 && <p className="mt-0.5 text-[12px] text-legion-muted"><b className="font-semibold">{t('legion.vestiaire.acces')}</b> {fiche.acces.join(' ; ')}</p>}
          </div>

          <div>
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.vestiaire.competences')}</p>
            {!fiche.competences?.length ? (
              <p className="text-[12.5px] text-legion-muted">{t('legion.vestiaire.aucune')}</p>
            ) : (
              <ul className="space-y-2">
                {fiche.competences.map((c) => {
                  const e = etat[c.cle];
                  const restants = c.agents.filter((a) => !retires.has(`${c.cle}:${a.id}`)).length;
                  return (
                    <li key={c.cle} className="rounded-input bg-legion-card p-2.5">
                      <p className="font-semibold text-legion-ink">{c.nom}</p>
                      {c.description && <p className="text-[12.5px] text-legion-muted">{c.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="text-[11.5px] text-legion-muted">{t('legion.vestiaire.pour')}</span>
                        {c.agents.map((a) => {
                          const enleve = retires.has(`${c.cle}:${a.id}`);
                          return (
                            <button key={a.id} type="button" onClick={() => basculer(c.cle, a.id)} disabled={e === 'fait' || e === 'encours'}
                              title={enleve ? t('legion.vestiaire.remettre') : t('legion.vestiaire.enlever')}
                              className={`rounded-pill border px-2 py-0.5 text-[11.5px] font-semibold ${enleve ? 'border-legion-line text-legion-muted line-through' : 'border-legion-gold/50 text-legion-ink'}`}>
                              {a.nom}
                            </button>
                          );
                        })}
                      </div>
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-[12px] font-semibold text-legion-gold">{t('legion.vestiaire.voir')}</summary>
                        <p className="mt-1 whitespace-pre-wrap text-[12.5px] text-legion-ink">{c.contenu}</p>
                      </details>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {e === 'fait' ? <span className="text-[12.5px] font-semibold text-legion-success">✓ {t('legion.equipe', 'Équipé')}</span>
                          : (
                            <button type="button" onClick={() => equiper(c)} disabled={e === 'encours' || !restants}
                              className="rounded-pill bg-legion-gold px-3 py-1 text-[12.5px] font-semibold text-legion-bg disabled:opacity-50">
                              {e === 'encours' ? '…' : t('legion.equiper', 'Équiper')}
                            </button>
                          )}
                        {e && e !== 'fait' && e !== 'encours' && <span className="text-[12px] text-legion-danger">{e}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-[11.5px] text-legion-muted">{t('legion.vestiaire.rienSansClic')}</p>
          </div>
        </div>
      )}
      {erreur && <p className="mt-2 text-[12.5px] text-legion-danger">{erreur}</p>}
    </div>
  );
}
