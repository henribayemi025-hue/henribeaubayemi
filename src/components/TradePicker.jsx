import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { Modal } from './Modal';
import { normalizeText } from '../lib/trades';

// Le menu déroulant des métiers de l'onglet Services.
//
// Beau (10/09): « il doit y avoir un truc où quand tu cliques, tous les
// métiers apparaissent et tu choisis. Pas que je doive aller à gauche pour
// voir. Un truc pro, comme Google. » Donc: un seul bouton, une liste
// complète, sobre — du texte, un compteur discret, une coche. Pas de tuiles,
// pas d'emojis.
//
// Sur grand écran, la liste s'ouvre sous le bouton comme un vrai menu
// déroulant; sur téléphone, elle monte du bas, plein écran, là où le pouce
// l'attend.
function useLarge() {
  const [large, setLarge] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const onChange = (e) => setLarge(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return large;
}

function Liste({ trades, value, counts, q, onPick, t }) {
  const items = useMemo(() => {
    const needle = normalizeText(q.trim());
    return trades
      .map((c) => ({ id: c.id, label: t(`categories.${c.id}`), n: counts[c.id] || 0 }))
      .filter((c) => !needle || normalizeText(c.label).includes(needle))
      .sort((a, b) => (a.id === 'autre_service') - (b.id === 'autre_service') || a.label.localeCompare(b.label, 'fr'));
  }, [trades, counts, q, t]);

  if (items.length === 0) {
    return <p className="px-3 py-6 text-center text-caption text-muted">{t('nearYou.noTradeMatch')}</p>;
  }
  return (
    <ul role="listbox" aria-label={t('nearYou.pickTrade')}>
      {!q && (
        <li role="option" aria-selected={value == null}>
          <button
            type="button"
            onClick={() => onPick(null)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-body transition hover:bg-base ${value == null ? 'font-semibold text-teal' : 'text-ink'}`}
          >
            <span className="flex-1">{t('nearYou.allTrades')}</span>
            {value == null && <IconCheck size={18} className="text-teal" />}
          </button>
        </li>
      )}
      {items.map((c) => {
        const actif = value === c.id;
        return (
          <li key={c.id} role="option" aria-selected={actif}>
            <button
              type="button"
              onClick={() => onPick(c.id)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-body transition hover:bg-base ${actif ? 'font-semibold text-teal' : 'text-ink'}`}
            >
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              {c.n > 0 && <span className="shrink-0 text-caption tabular-nums text-muted">{c.n}</span>}
              {actif && <IconCheck size={18} className="shrink-0 text-teal" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Recherche({ q, setQ, t }) {
  return (
    <div className="relative">
      <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('nearYou.searchTrade')}
        className="input h-10 pl-9 pr-9 text-[15px]"
        aria-label={t('nearYou.searchTrade')}
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ('')}
          aria-label={t('common.close')}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted"
        >
          <IconX size={15} />
        </button>
      )}
    </div>
  );
}

// Le bouton ET son menu: on les tient ensemble pour ancrer le menu sous le
// bouton sur grand écran.
export function TradePicker({ trades, value, onChange, counts = {}, className = '' }) {
  const { t } = useTranslation();
  const large = useLarge();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const racine = useRef(null);

  useEffect(() => {
    if (!open || !large) return undefined;
    const onDoc = (e) => { if (racine.current && !racine.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, large]);

  function pick(id) {
    onChange(id);
    setQ('');
    setOpen(false);
  }

  const label = value ? t(`categories.${value}`) : t('nearYou.allTrades');

  return (
    <div ref={racine} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2 rounded-input border bg-white px-3 text-left text-body transition ${
          value ? 'border-teal text-teal' : 'border-hairline text-ink'
        }`}
      >
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <IconChevronDown size={17} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && large && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 min-w-[18rem] overflow-hidden rounded-card border border-hairline bg-white shadow-lg">
          <div className="border-b border-hairline p-2">
            <Recherche q={q} setQ={setQ} t={t} />
          </div>
          <div className="max-h-[22rem] overflow-y-auto py-1">
            <Liste trades={trades} value={value} counts={counts} q={q} onPick={pick} t={t} />
          </div>
        </div>
      )}

      {!large && (
        <Modal open={open} onClose={() => { setOpen(false); setQ(''); }} title={t('nearYou.pickTrade')}>
          <Recherche q={q} setQ={setQ} t={t} />
          <div className="-mx-4 mt-2 max-h-[65vh] overflow-y-auto border-t border-hairline pb-[env(safe-area-inset-bottom)]">
            <Liste trades={trades} value={value} counts={counts} q={q} onPick={pick} t={t} />
          </div>
        </Modal>
      )}
    </div>
  );
}
