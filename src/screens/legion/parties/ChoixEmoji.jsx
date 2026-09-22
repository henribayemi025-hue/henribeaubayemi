import { useMemo, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { CATEGORIES, PAR_CATEGORIE, chercher, lireRecents, noterRecent } from '../emojis';

// Le clavier d'emojis, comme dans WhatsApp: des onglets par famille, une
// recherche en français, les récents en premier. Beau: « ce n'est pas comme
// dans WhatsApp, avec le clavier, ou avec les stickers ».
export function ChoixEmoji({ onChoisir, onFermer, titre = 'Emoji' }) {
  const [cat, setCat] = useState('recents');
  const [q, setQ] = useState('');
  const [recents, setRecents] = useState(lireRecents);

  const liste = useMemo(() => {
    if (q.trim()) return chercher(q);
    if (cat === 'recents') return recents.map((emoji) => ({ emoji, mots: '' }));
    return PAR_CATEGORIE[cat] || [];
  }, [q, cat, recents]);

  function choisir(e) {
    setRecents(noterRecent(e));
    onChoisir(e);
  }

  return (
    <div className="flex h-72 w-full max-w-sm flex-col overflow-hidden rounded-card border border-legion-line bg-legion-card shadow-xl" role="dialog" aria-label={titre}>
      <div className="flex items-center gap-2 border-b border-legion-line px-2 py-1.5">
        <IconSearch size={14} className="shrink-0 text-legion-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher: coeur, feu, bravo…"
          className="min-w-0 flex-1 bg-transparent text-caption text-legion-ink outline-none placeholder:text-legion-muted"
        />
        {onFermer && (
          <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-full p-1 text-legion-muted hover:bg-legion-bg">
            <IconX size={14} />
          </button>
        )}
      </div>
      {!q && (
        <div className="flex gap-0.5 overflow-x-auto border-b border-legion-line px-1 py-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.cle}
              type="button"
              onClick={() => setCat(c.cle)}
              title={c.nom}
              aria-label={c.nom}
              className={`shrink-0 rounded-input px-1.5 py-0.5 text-[16px] leading-none transition ${cat === c.cle ? 'bg-legion-gold/15' : 'hover:bg-legion-bg'}`}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}
      <div className="grid flex-1 grid-cols-8 content-start gap-0.5 overflow-y-auto p-1.5">
        {liste.length === 0 && (
          <p className="col-span-8 p-3 text-center text-caption text-legion-muted">Rien pour « {q} ».</p>
        )}
        {liste.map((e, i) => (
          <button
            key={`${e.emoji}-${i}`}
            type="button"
            onClick={() => choisir(e.emoji)}
            title={e.mots}
            className="flex h-8 items-center justify-center rounded-input text-[20px] leading-none transition hover:scale-125 hover:bg-legion-bg"
          >
            {e.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
