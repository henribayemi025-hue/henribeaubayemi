import { useCallback, useEffect, useState } from 'react';
import { IconBook2, IconPlus, IconSearch, IconSparkles, IconX, IconExternalLink } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — les compétences (chantier 2). Voir docs/LEGION-COMPETENCES.md.
//
// Beau, 22/09: « des agents qui s'améliorent… qui prennent des skills sur
// GitHub ». Une compétence est une fiche de savoir-faire d'expert, copiée
// d'un dépôt GitHub sous licence libre; l'agent la relit avant de répondre.

async function appeler(corps) {
  const { data, error } = await supabase.functions.invoke('legion-competences', { body: corps });
  if (error) throw error;
  if (data?.erreur) throw new Error(data.erreur);
  return data;
}

// Dans la fiche d'un agent: ses compétences, en ajouter, en retirer, ou le
// laisser choisir lui-même.
export function CompetencesAgent({ agent, t }) {
  const [liste, setListe] = useState(null);
  const [cherche, setCherche] = useState('');
  const [trouves, setTrouves] = useState([]);
  const [occupe, setOccupe] = useState(null); // 'choisir' | clé en cours
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_competences').select('id, catalogue_cle, nom, description, pourquoi, source_repo, source_chemin, licence, ajoutee_par, contenu')
      .eq('agent_id', agent.id).eq('actif', true).order('created_at');
    setListe(data || []);
  }, [agent.id]);
  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    const q = cherche.trim();
    if (q.length < 2) { setTrouves([]); return undefined; }
    const minuteur = setTimeout(async () => {
      const motif = `%${q.replace(/[%_]/g, '')}%`;
      const { data } = await supabase.from('studio_catalogue').select('cle, nom, description, categorie')
        .eq('genre', 'skill').or(`nom.ilike.${motif},description.ilike.${motif},categorie.ilike.${motif}`).limit(8);
      setTrouves(data || []);
    }, 250);
    return () => clearTimeout(minuteur);
  }, [cherche]);

  async function laisserChoisir() {
    setOccupe('choisir'); setErreur('');
    try { await appeler({ action: 'choisir', entreprise_id: agent.entreprise_id, agent_id: agent.id }); await charger(); }
    catch (e) { setErreur(e.message); } finally { setOccupe(null); }
  }
  async function equiper(cle) {
    setOccupe(cle); setErreur('');
    try { await appeler({ action: 'equiper', entreprise_id: agent.entreprise_id, agent_id: agent.id, catalogue_cle: cle }); setCherche(''); await charger(); }
    catch (e) { setErreur(e.message); } finally { setOccupe(null); }
  }
  async function retirer(id) {
    setListe((l) => l.filter((x) => x.id !== id));
    await supabase.from('legion_competences').update({ actif: false }).eq('id', id);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">
          <IconBook2 size={13} /> {t('legion.sesCompetences', 'Ses compétences')}
        </p>
        <button type="button" onClick={laisserChoisir} disabled={!!occupe}
          className="flex items-center gap-1 text-[12px] font-semibold text-legion-gold hover:brightness-110 disabled:opacity-40">
          <IconSparkles size={13} /> {occupe === 'choisir' ? t('legion.ilChoisit', 'Il choisit…') : t('legion.quIlChoisisse', 'Qu’il choisisse')}
        </button>
      </div>
      {liste === null ? null : liste.length === 0 ? (
        <p className="rounded-card border border-dashed border-legion-line p-3 text-[12px] text-legion-muted">{t('legion.aucuneCompetence', 'Aucune compétence encore. Laisse-le choisir, ou cherche-en une.')}</p>
      ) : (
        <ul className="space-y-1.5">
          {liste.map((c) => (
            <li key={c.id} className="rounded-card border border-legion-line bg-legion-card px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-legion-ink">{c.nom}</p>
                  {c.pourquoi && <p className="text-[12px] italic text-legion-gold">{c.pourquoi}</p>}
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-legion-muted">
                    <a href={`https://github.com/${c.source_repo}/blob/HEAD/${c.source_chemin}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-legion-ink">
                      {c.source_repo} <IconExternalLink size={11} />
                    </a>
                    <span>· {c.licence}</span>
                    {!c.contenu && <span className="text-legion-danger">· {t('legion.ficheNonLue', 'fiche pas encore lue')}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => retirer(c.id)} title={t('legion.retirer', 'Retirer')} className="shrink-0 rounded-full p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-danger">
                  <IconX size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="relative mt-2">
        <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-legion-muted" />
        <input value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder={t('legion.chercherCompetence', 'Chercher une compétence (en anglais: seo, sql, pricing…)')}
          className="w-full rounded-input border border-legion-line bg-legion-bg py-2 pl-8 pr-3 text-[16px] text-legion-ink outline-none placeholder:text-legion-muted focus:border-legion-gold/60 sm:text-[13px]" />
      </div>
      {trouves.length > 0 && (
        <ul className="mt-1.5 max-h-56 space-y-1 overflow-y-auto">
          {trouves.map((f) => (
            <li key={f.cle}>
              <button type="button" onClick={() => equiper(f.cle)} disabled={!!occupe || liste?.some((c) => c.catalogue_cle === f.cle)}
                className="flex w-full items-start gap-2 rounded-card border border-legion-line bg-legion-card px-3 py-2 text-left hover:border-legion-gold/50 disabled:opacity-40">
                <IconPlus size={14} className="mt-0.5 shrink-0 text-legion-gold" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-legion-ink">{f.nom}{occupe === f.cle ? ' …' : ''}</span>
                  <span className="line-clamp-2 block text-[11px] text-legion-muted">{f.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {erreur && <p className="mt-1.5 text-[12px] text-legion-danger">{erreur}</p>}
    </div>
  );
}

// Sur l'accueil: que toute l'équipe s'équipe d'un coup. L'écran relance par
// lots de quatre, comme pour les photos, et s'arrête si un lot n'avance pas.
export function EquiperEquipe({ entrepriseId, agents, t }) {
  const [sans, setSans] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [bilan, setBilan] = useState('');

  const compter = useCallback(async () => {
    const { data } = await supabase.from('legion_competences').select('agent_id').eq('entreprise_id', entrepriseId).eq('actif', true);
    const equipes = new Set((data || []).map((x) => x.agent_id));
    setSans(agents.filter((a) => !a.user_id && a.moteur !== 'claude-code' && !equipes.has(a.id)).length);
  }, [entrepriseId, agents]);
  useEffect(() => { compter(); }, [compter]);
  // Une entreprise qui vient d'être fondée (?equiper=1): l'équipe s'équipe
  // toute seule, une fois.
  useEffect(() => {
    let parti = false;
    try { parti = new URLSearchParams(window.location.search).get('equiper') === '1'; } catch { parti = false; }
    if (!parti || !agents.length) return;
    try { const u = new URL(window.location.href); u.searchParams.delete('equiper'); window.history.replaceState(null, '', u.toString()); } catch { /* vieux navigateur */ }
    lancer();
  }, [agents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function lancer() {
    setOccupe(true); setBilan('');
    let total = 0;
    try {
      for (let tour = 0; tour < 12; tour += 1) {
        const r = await appeler({ action: 'choisir', entreprise_id: entrepriseId });
        total += r.faits || 0;
        if (!r.faits || !r.restants) { if (!r.faits && r.pourquoi) setBilan(r.pourquoi); break; }
      }
      if (total) setBilan(t('legion.equipesFaits', { n: total, defaultValue: '{{n}} agents se sont équipés. Leurs choix sont dans leurs salons.' }));
    } catch (e) { setBilan(e.message); }
    finally { setOccupe(false); compter(); }
  }

  if (!sans && !bilan) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-legion-gold/30 bg-legion-gold/10 p-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-caption font-bold text-legion-ink"><IconBook2 size={15} className="text-legion-gold" /> {t('legion.competencesTitre', 'Les compétences')}</p>
        <p className="text-[12px] text-legion-muted">
          {bilan || t('legion.sansCompetence', { n: sans, defaultValue: '{{n}} agents n’ont encore aucune compétence. Chacun peut choisir les 3 fiches d’experts qui lui serviront le plus.' })}
        </p>
      </div>
      {sans > 0 && (
        <button type="button" onClick={lancer} disabled={occupe}
          className="flex items-center gap-1.5 rounded-pill bg-legion-gold px-4 py-2 text-caption font-semibold text-legion-bg disabled:opacity-50">
          <IconSparkles size={14} /> {occupe ? t('legion.ilsChoisissent', 'Ils choisissent…') : t('legion.quIlsSEquipent', 'Qu’ils s’équipent')}
        </button>
      )}
    </div>
  );
}
