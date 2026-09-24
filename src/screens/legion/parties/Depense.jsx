import { useCallback, useEffect, useState } from 'react';
import { IconCoin } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — ce que Legion coûte ce mois-ci, et le plafond (plan B9).
//
// Beau, 22/09, devant 42 € de facture Gemini qu'il n'attendait pas: « je
// savais pas que ça pouvait être aussi cher ». Chaque appel des agents à
// Gemini est compté (estimation à partir des jetons, prix publics de Google);
// au-delà du plafond, les agents s'arrêtent jusqu'au mois suivant. La vraie
// facture reste celle d'AI Studio.

const NOMS = {
  legion_repondre: 'Réponses des agents',
  legion_competences: 'Choix des compétences',
  legion_portrait: 'Photos des agents',
  legion_se_choisir: 'Visages et caractères',
  legion_veilleur: 'Le veilleur',
  legion_travail: 'La journée de travail (plans et livrables)',
};

export function Depense({ entreprise, t }) {
  const [formule, setFormule] = useState(entreprise.formule || null);
  const [modele, setModele] = useState(entreprise.modele || '');
  const [d, setD] = useState(null);
  const [plafond, setPlafond] = useState('');
  const [enregistre, setEnregistre] = useState(false);
  const proprietaire = true; // la base refuse d'elle-même si on ne l'est pas

  const charger = useCallback(async () => {
    const { data } = await supabase.rpc('legion_depense_mois', { p_entreprise: entreprise.id });
    setD(data || null);
    setPlafond(data?.plafond_eur != null ? String(data.plafond_eur) : '');
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);

  async function fixer(e) {
    e.preventDefault();
    const v = plafond.trim() === '' ? null : Math.max(0, Number(plafond.replace(',', '.')));
    if (v !== null && Number.isNaN(v)) return;
    const { error } = await supabase.from('legion_entreprises').update({ plafond_mois_eur: v }).eq('id', entreprise.id);
    if (!error) { setEnregistre(true); setTimeout(() => setEnregistre(false), 1500); charger(); }
  }

  if (!d) return null;
  const total = Number(d.total_eur || 0);
  const max = d.plafond_eur != null ? Number(d.plafond_eur) : null;
  const part = max ? Math.min(100, (total / max) * 100) : null;
  // Quelques millièmes d'euro ne s'affichent pas « 0,00 € » (vu au check-up
  // du 23/09 : la ligne semblait gratuite alors qu'elle avait coûté).
  const euros = (n) => (n > 0 && n < 0.005 ? t('legion.depenseMoinsDunCentime', 'moins de 0,01 €') : `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

  // L'IA de toute l'équipe (0192-0193, Beau 24/09) : Auto en arrivant ; ou
  // un modèle précis, comme on choisit Opus ou Fable dans Claude.
  async function choisirModele(v) {
    const avant = modele;
    setModele(v);
    const { error } = await supabase.from('legion_entreprises').update({ modele: v || null, moteur: 'auto' }).eq('id', entreprise.id);
    if (error) setModele(avant);
  }

  async function choisirFormule(k) {
    setFormule(k);
    await supabase.from('legion_entreprises').update({ formule: k }).eq('id', entreprise.id);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex items-center justify-between border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconCoin size={15} className="text-legion-gold" /> {t('legion.depenseTitre', 'Ce que Legion coûte ce mois-ci')}
        </h3>
        <span className="text-[11px] text-legion-muted">{t('legion.depenseEstimation', 'estimation')}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-legion-ink">{euros(total)}</span>
        {max != null && <span className="text-caption text-legion-muted">/ {euros(max)}</span>}
        <span className="ml-auto text-[11px] text-legion-muted">{t('legion.depenseAppels', { n: d.appels, defaultValue: '{{n}} appels' })}</span>
      </div>
      {part != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-legion-card">
          <div className={`h-full rounded-full transition-all ${part >= 90 ? 'bg-legion-danger' : 'bg-legion-gold'}`} style={{ width: `${part}%` }} />
        </div>
      )}
      {Object.keys(d.par_fonction || {}).length > 0 && (
        <ul className="space-y-1 text-[12px]">
          {Object.entries(d.par_fonction).sort((a, b) => b[1] - a[1]).map(([fn, eur]) => (
            <li key={fn} className="flex justify-between text-legion-muted"><span>{NOMS[fn] || fn}</span><span className="text-legion-ink">{euros(Number(eur))}</span></li>
          ))}
        </ul>
      )}
      {proprietaire && (
        <form onSubmit={fixer} className="flex items-center gap-2 border-t border-legion-line pt-3">
          <label className="text-[12px] text-legion-muted" htmlFor="plafond">{t('legion.plafond', 'Plafond du mois')}</label>
          <input id="plafond" inputMode="decimal" value={plafond} onChange={(e) => setPlafond(e.target.value)} placeholder={t('legion.sansPlafond', 'aucun')}
            className="w-24 rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-right text-[16px] text-legion-ink outline-none focus:border-legion-gold/60 sm:text-[13px]" />
          <span className="text-[12px] text-legion-muted">€</span>
          <button type="submit" className="ml-auto rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg">
            {enregistre ? '✓' : t('legion.fixer', 'Fixer')}
          </button>
        </form>
      )}
      {/* La formule (0170): gratuite = Flash seulement, sans recherche sur
          Internet; complète = Pro pour le complexe, recherche comprise. */}
      {proprietaire && (
        <div className="flex flex-wrap items-center gap-2 border-t border-legion-line pt-3">
          <span className="text-[12px] text-legion-muted">{t('legion.formule', 'Formule')}</span>
          {[['complete', t('legion.formuleComplete', 'Complète')], ['gratuite', t('legion.formuleGratuite', 'Gratuite')]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => choisirFormule(k)}
              className={`rounded-pill px-3 py-1 text-[12px] font-semibold ${(formule || 'complete') === k ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted hover:text-legion-ink'}`}>{l}</button>
          ))}
          <span className="w-full text-[11px] leading-snug text-legion-muted">{(formule || 'complete') === 'gratuite'
            ? t('legion.formuleGratuiteAide', 'Gratuite : les agents répondent avec le modèle rapide (Flash), sans recherche sur Internet.')
            : t('legion.formuleCompleteAide', 'Complète : le modèle Pro pour tout ce qui est complexe, et la recherche sur Internet.')}</span>
        </div>
      )}
      {proprietaire && (
        <div className="space-y-1.5 border-t border-legion-line pt-3">
          <label htmlFor="modele" className="text-[12px] text-legion-muted">{t('legion.moteurEquipe', 'L’IA des agents')}</label>
          <select id="modele" value={modele} onChange={(e) => choisirModele(e.target.value)}
            className="w-full rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[16px] text-legion-ink outline-none focus:border-legion-gold/60 sm:text-[13px]">
            <option value="">{t('legion.modeleAuto', 'Auto — DeepSeek, puis Kimi, puis Gemini (recommandé)')}</option>
            <optgroup label="DeepSeek">
              <option value="ds:deepseek-flash">DeepSeek Flash — {t('legion.modeleRapide', 'rapide et économique')}</option>
              <option value="ds:deepseek-v4-pro">DeepSeek Pro — {t('legion.modeleFort', 'plus fort, plus lent')}</option>
            </optgroup>
            <optgroup label="Kimi"><option value="km:kimi-k2.6">Kimi K2.6</option></optgroup>
            <optgroup label="Google Gemini">
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </optgroup>
            <optgroup label="Anthropic"><option value="an:claude-sonnet-5">Claude Sonnet 5</option></optgroup>
          </select>
          <span className="block text-[11px] leading-snug text-legion-muted">{modele
            ? t('legion.modeleChoisiAide', 'Toute l’équipe travaille avec ce modèle. S’il ne répond pas ou si sa clé n’est pas posée, Léo passe au suivant en Auto plutôt que de laisser les agents muets.')
            : t('legion.moteurAutoAide', 'Auto : DeepSeek d’abord, Kimi s’il ne répond pas, puis Gemini. Le réglage vaut pour toute l’équipe.')}</span>
        </div>
      )}
      <p className="text-[11px] leading-snug text-legion-muted">{t('legion.depenseAide', 'Au-delà du plafond, les agents s’arrêtent jusqu’au mois suivant. La vraie facture reste celle de Google AI Studio.')}</p>
    </section>
  );
}
