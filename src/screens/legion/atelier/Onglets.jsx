import { IconX } from '@tabler/icons-react';

// Les onglets de fichiers, façon VS Code (repris du prototype « Finjaro Visual
// Studio Code » de Beau, 25/09) : l'étiquette du langage, le trait coloré sur
// l'onglet actif, le point « modifié » qui devient une croix au survol, et le
// visage de l'agent sur l'onglet où il écrit.
export const ETIQUETTES = {
  js: ['JS', '#facc15'], jsx: ['JS', '#facc15'], mjs: ['JS', '#facc15'], cjs: ['JS', '#facc15'],
  ts: ['TS', '#38bdf8'], tsx: ['TS', '#38bdf8'],
  html: ['<>', '#fb923c'], htm: ['<>', '#fb923c'],
  css: ['#', '#60a5fa'], json: ['{}', '#fde047'], py: ['PY', '#34d399'],
  md: ['MD', '#a3a3a3'], txt: ['TXT', '#a3a3a3'], sql: ['SQL', '#c084fc'], sh: ['SH', '#a3e635'],
};
export const extension = (chemin) => String(chemin).split('.').pop().toLowerCase();

export default function Onglets({ onglets, actif, onChoisir, onFermer, ecritIci, visage, t }) {
  if (!onglets.length) return null;
  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-legion-line bg-[#0a0f1c]" style={{ scrollbarWidth: 'none' }} role="tablist">
      {onglets.map((o) => {
        const est = o.chemin === actif;
        const sale = o.brouillon !== o.contenu;
        const [etiq, couleur] = ETIQUETTES[extension(o.chemin)] || ['·', '#a3a3a3'];
        const nom = o.chemin.split('/').pop();
        return (
          <div key={o.chemin} role="tab" aria-selected={est} title={o.chemin}
            onClick={() => onChoisir(o.chemin)} onAuxClick={(e) => { if (e.button === 1) onFermer(o.chemin); }}
            className={`group flex max-w-[190px] shrink-0 cursor-pointer items-center gap-1.5 border-r border-legion-line px-3 text-[12px] ${est ? 'border-t-2 border-t-legion-gold bg-legion-panel text-legion-ink' : 'border-t-2 border-t-transparent text-legion-muted hover:text-legion-ink'}`}>
            <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: couleur }}>{etiq}</span>
            <span className="truncate">{nom}</span>
            {ecritIci === o.chemin && <span className="shrink-0" title={t('legion.atelier.ecritIci')}>{visage}</span>}
            <button type="button" onClick={(e) => { e.stopPropagation(); onFermer(o.chemin); }} aria-label={t('legion.atelier.fermerOnglet')}
              className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-white/10">
              {sale ? (<><span className="h-2 w-2 rounded-full bg-legion-gold group-hover:hidden" /><IconX size={12} className="hidden group-hover:block" /></>)
                : <IconX size={12} className={est ? '' : 'opacity-0 group-hover:opacity-100'} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
