// Le choix de l'IA qui fait parler les agents (Beau, 24/09 : « Auto quand
// tu arrives ; si quelqu'un veut, il choisit Gemini Pro ou Flash et il
// continue avec — comme on choisit Opus ou Fable »). Le même menu sert pour
// toute l'équipe (réglages, zone de saisie) et pour un agent seul (sa fiche).
// Les valeurs sont celles de MODELES_CHOISIBLES (supabase/functions/_shared/moteur.ts).
export const MODELES_IA = [
  ['DeepSeek', [['ds:deepseek-flash', 'DeepSeek Flash'], ['ds:deepseek-v4-pro', 'DeepSeek Pro']]],
  ['Kimi', [['km:kimi-k2.6', 'Kimi K2.6']]],
  // OpenAI (24/09) : la clé de Beau, rangée sous le nom « Leo ».
  ['OpenAI', [['oa:gpt-6-astra', 'GPT-6 Astra'], ['oa:gpt-5.4-mini', 'GPT-5.4 mini']]],
  ['Google Gemini', [['gemini-3.1-pro-preview', 'Gemini 3.1 Pro'], ['gemini-3.5-flash', 'Gemini 3.5 Flash'], ['gemini-2.5-flash', 'Gemini 2.5 Flash']]],
  ['Anthropic', [['an:claude-sonnet-5', 'Claude Sonnet 5']]],
];

export function nomDuModele(v) {
  for (const [, liste] of MODELES_IA) for (const [k, l] of liste) if (k === v) return l;
  return null;
}

// vide = Auto (ou « comme l'équipe » pour un agent).
export function ChoixModele({ valeur, onChange, t, libelleVide, compact = false, id }) {
  return (
    <select id={id} value={valeur || ''} onChange={(e) => onChange(e.target.value)}
      aria-label={t('legion.moteurEquipe', 'L’IA des agents')}
      className={compact
        ? 'max-w-[11rem] truncate rounded-pill border border-legion-line bg-legion-bg px-2 py-0.5 text-[16px] text-legion-muted outline-none hover:text-legion-ink focus:border-legion-gold/60 sm:text-[11.5px]'
        : 'w-full rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[16px] text-legion-ink outline-none focus:border-legion-gold/60 sm:text-[13px]'}>
      <option value="">{libelleVide || t('legion.modeleAuto', 'Auto — DeepSeek, puis Kimi, puis Gemini (recommandé)')}</option>
      {MODELES_IA.map(([groupe, liste]) => (
        <optgroup key={groupe} label={groupe}>
          {liste.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
