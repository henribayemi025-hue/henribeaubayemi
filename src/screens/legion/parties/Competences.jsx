import { useCallback, useEffect, useState } from 'react';
import { IconBook2, IconPlus, IconSearch, IconSparkles, IconX, IconExternalLink, IconFlask, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// Un examen « en cours » plus vieux que ça a été interrompu (la fonction
// legion-examen a dépassé son temps) : on ne le montre plus comme en cours.
const EN_COURS_MAX_MS = 10 * 60_000;
const enCours = (x) => x?.verdict === 'en_cours' && Date.now() - Date.parse(x.created_at) < EN_COURS_MAX_MS;
const note = (n) => (n == null ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

// L'examen d'une compétence (legion-examen, 24/09) : Rigo fait traiter 3 cas
// par l'agent, sans puis avec la fiche, et un correcteur les note à
// l'aveugle. Ici : le dernier verdict, le bouton pour le relancer, et le
// détail des cas à la demande. Le verdict est une proposition : rien n'est
// désactivé tout seul, c'est la croix à côté qui retire une fiche.
function ExamenCompetence({ competence, examens, agent, t, onLance }) {
  const [ouvert, setOuvert] = useState(false);
  const [cas, setCas] = useState(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const dernier = examens[0];
  const conclu = examens.find((x) => x.verdict === 'garde' || x.verdict === 'a_revoir');
  const tourne = enCours(dernier) || envoi;
  // Un essai interrompu APRÈS le dernier verdict : on le dit, sans effacer le verdict.
  const interrompu = dernier && dernier !== conclu && !enCours(dernier) ? dernier : null;

  async function lancer() {
    setEnvoi(true); setErreur('');
    try {
      const { data, error } = await supabase.functions.invoke('legion-examen', { body: { entreprise_id: agent.entreprise_id, competence_id: competence.id } });
      if (error) throw error;
      if (data?.erreur) throw new Error(data.erreur);
      await onLance();
    } catch (e) { setErreur(e.message); } finally { setEnvoi(false); }
  }
  async function voirCas() {
    if (ouvert) { setOuvert(false); return; }
    setOuvert(true);
    if (!conclu) return;
    const { data } = await supabase.from('legion_examens').select('cas').eq('id', conclu.id).maybeSingle();
    setCas(Array.isArray(data?.cas) ? data.cas : []);
  }

  return (
    <div className="mt-1.5 border-t border-legion-line/60 pt-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px]">
          {tourne ? (
            <span className="text-legion-muted">{t('legion.examen.enCours')}</span>
          ) : conclu?.verdict === 'garde' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-legion-success"><IconCircleCheck size={12} /> {t('legion.examen.garde', { gagnes: conclu.gagnes ?? 0, total: conclu.nb_cas ?? 3 })}</span>
          ) : conclu?.verdict === 'a_revoir' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-legion-gold" title={conclu.raison || undefined}><IconAlertTriangle size={12} /> {t('legion.examen.aRevoir', { gagnes: conclu.gagnes ?? 0, total: conclu.nb_cas ?? 3 })}</span>
          ) : (
            <span className="text-legion-muted">{t('legion.examen.jamais')}</span>
          )}
          {!tourne && conclu && (
            <button type="button" onClick={voirCas} className="text-legion-muted underline decoration-dotted hover:text-legion-ink">
              {t('legion.examen.notes', { avec: note(conclu.score_avec), sans: note(conclu.score_sans) })}
            </button>
          )}
        </p>
        <button type="button" onClick={lancer} disabled={tourne}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-legion-gold hover:brightness-110 disabled:opacity-40">
          <IconFlask size={12} /> {t('legion.examen.bouton')}
        </button>
      </div>
      {!tourne && interrompu && <p className="mt-0.5 text-[11px] text-legion-danger">{t('legion.examen.interrompu', { raison: interrompu.raison || t('legion.examen.raisonInconnue') })}</p>}
      {conclu?.verdict === 'a_revoir' && conclu.raison && !tourne && <p className="mt-0.5 text-[11px] text-legion-muted">{t('legion.examen.infraction', { raison: conclu.raison })}</p>}
      {erreur && <p className="mt-0.5 text-[11px] text-legion-danger">{erreur}</p>}
      {ouvert && conclu && (
        cas === null ? <p className="mt-1 text-[11px] text-legion-muted">…</p> : (
          <ol className="mt-1.5 space-y-1.5">
            {cas.map((k, i) => (
              <li key={i} className="rounded-lg bg-legion-bg/60 px-2.5 py-1.5 text-[11px] leading-snug">
                <p className="text-legion-ink">{i + 1}. {k.demande}</p>
                <p className={k.gagnant === 'avec' ? 'text-legion-success' : k.gagnant === 'sans' ? 'text-legion-gold' : 'text-legion-muted'}>
                  {t(`legion.examen.gagnant.${k.gagnant || 'egalite'}`)} · {t('legion.examen.notes', { avec: note(k.note_avec), sans: note(k.note_sans) })}
                </p>
                {k.pourquoi && <p className="text-legion-muted">{k.pourquoi}</p>}
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}

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

  // Les examens de ses compétences, du plus récent au plus ancien (sans le
  // détail des cas, lu seulement quand on l'ouvre). Un humain de l'équipe ne
  // passe pas d'examen : ses réponses ne viennent pas d'un modèle.
  const examinable = !agent.user_id;
  const [examens, setExamens] = useState([]);
  const chargerExamens = useCallback(async () => {
    if (!examinable) return;
    const { data } = await supabase.from('legion_examens').select('id, competence_id, verdict, gagnes, nb_cas, score_avec, score_sans, raison, created_at')
      .eq('agent_id', agent.id).order('created_at', { ascending: false }).limit(100);
    setExamens(data || []);
  }, [agent.id, examinable]);
  useEffect(() => { chargerExamens(); }, [chargerExamens]);
  // Tant qu'un examen tourne, on relit toutes les 8 secondes : le verdict
  // arrive en une à deux minutes.
  useEffect(() => {
    if (!examens.some(enCours)) return undefined;
    const minuteur = setTimeout(chargerExamens, 8000);
    return () => clearTimeout(minuteur);
  }, [examens, chargerExamens]);

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
                    {/* Une fiche du catalogue (dépôt + chemin), une fiche du
                        vestiaire (adresse complète : article, vidéo, fiche),
                        ou une compétence écrite par Léo, livrée avec un
                        modèle (aucune source en ligne : pas de lien cassé). */}
                    {c.source_repo ? (
                      <a href={/^https?:\/\//.test(c.source_repo) ? c.source_repo : `https://github.com/${c.source_repo}${c.source_chemin ? `/blob/HEAD/${c.source_chemin}` : ''}`} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-0.5 hover:text-legion-ink">
                        <span className="truncate">{/^https?:\/\//.test(c.source_repo) ? c.source_repo.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60) : c.source_repo}</span> <IconExternalLink size={11} className="shrink-0" />
                      </a>
                    ) : <span>{t('legion.competenceMaison', 'Écrite par Léo')}</span>}
                    {c.licence && <span>· {c.licence}</span>}
                    {!c.contenu && <span className="text-legion-danger">· {t('legion.ficheNonLue', 'fiche pas encore lue')}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => retirer(c.id)} title={t('legion.retirer', 'Retirer')} className="shrink-0 rounded-full p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-danger">
                  <IconX size={14} />
                </button>
              </div>
              {examinable && (c.contenu || c.description) && (
                <ExamenCompetence competence={c} examens={examens.filter((x) => x.competence_id === c.id)} agent={agent} t={t} onLance={chargerExamens} />
              )}
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
