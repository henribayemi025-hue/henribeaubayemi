import { useEffect, useMemo, useRef, useState } from 'react';
import { IconFile, IconBolt } from '@tabler/icons-react';
import { rechercher, decouper } from './palette';

// La palette de commandes (Ctrl+K), façon VS Code : fichiers et actions de
// l'atelier dans une seule liste. Recherche floue d'Ada (./palette.js).
export default function Palette({ entrees, onChoisir, onFermer, t }) {
  const [requete, setRequete] = useState('');
  const [sel, setSel] = useState(0);
  const champ = useRef(null);
  const liste = useRef(null);
  const resultats = useMemo(() => rechercher(requete, entrees), [requete, entrees]);
  useEffect(() => { champ.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [requete]);
  useEffect(() => { liste.current?.children[sel]?.scrollIntoView({ block: 'nearest' }); }, [sel]);

  const choisir = (r) => { if (!r || r.off) return; onFermer(); onChoisir(r); };
  const touche = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onFermer(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultats.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choisir(resultats[sel]); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div role="dialog" aria-label={t('legion.atelier.palette')} className="w-full max-w-xl overflow-hidden rounded-card border border-legion-line bg-legion-panel shadow-2xl">
        <input ref={champ} value={requete} onChange={(e) => setRequete(e.target.value)} onKeyDown={touche}
          placeholder={t('legion.atelier.paletteAide')} spellCheck="false"
          className="w-full border-b border-legion-line bg-transparent px-4 py-3 text-body text-legion-ink outline-none placeholder:text-legion-muted" />
        <ul ref={liste} className="max-h-[50vh] overflow-y-auto py-1">
          {resultats.map((r, i) => (
            <li key={`${r.type}:${r.label}`}>
              <button type="button" onMouseEnter={() => setSel(i)} onClick={() => choisir(r)} disabled={r.off}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-caption disabled:opacity-40 ${i === sel ? 'bg-legion-gold/15 text-legion-ink' : 'text-legion-muted'}`}>
                {r.type === 'fichier' ? <IconFile size={15} className="shrink-0" /> : <IconBolt size={15} className="shrink-0 text-legion-gold" />}
                <span className={`min-w-0 flex-1 truncate ${r.type === 'fichier' ? 'font-mono' : ''}`}>
                  {decouper(r.label, r.positions).map((m, k) => (m.gras ? <b key={k} className="text-legion-gold">{m.texte}</b> : <span key={k}>{m.texte}</span>))}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-legion-muted">{t(r.type === 'fichier' ? 'legion.atelier.paletteFichier' : 'legion.atelier.paletteAction')}</span>
              </button>
            </li>
          ))}
          {!resultats.length && <li className="px-4 py-3 text-caption text-legion-muted">{t('legion.atelier.paletteRien')}</li>}
        </ul>
      </div>
    </div>
  );
}
