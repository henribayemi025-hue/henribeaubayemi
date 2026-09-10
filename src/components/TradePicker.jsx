import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconX, IconCheck } from '@tabler/icons-react';
import { Modal } from './Modal';
import { tradeEmoji, normalizeText } from '../lib/trades';

// Le sélecteur de métier de l'onglet Services — une vraie fenêtre, pas une
// rangée de puces qui déborde. Beau (10/09): « il n'y a même pas de
// dropdown pour choisir les services ». Avec une cinquantaine de métiers,
// il faut chercher ET voir d'un coup d'œil où il y a du monde: chaque tuile
// porte son emoji et, quand il y en a, le nombre de prestataires.
//
// `counts` vient de la page (nombre de boutiques par métier): un métier sans
// personne reste visible mais s'affiche en retrait — on ne cache rien, on
// ne promet rien non plus.
export function TradePicker({ open, onClose, trades, value, onChange, counts = {} }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    const needle = normalizeText(q.trim());
    return trades
      .map((c) => ({ id: c.id, label: t(`categories.${c.id}`), n: counts[c.id] || 0 }))
      .filter((c) => !needle || normalizeText(c.label).includes(needle))
      .sort((a, b) => (b.n > 0) - (a.n > 0) || a.label.localeCompare(b.label, 'fr'));
  }, [trades, counts, q, t]);

  function pick(id) {
    onChange(id);
    setQ('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('nearYou.pickTrade')}>
      <div className="relative">
        <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('nearYou.searchTrade')}
          className="input h-11 pl-9 pr-9"
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

      <div className="mt-3 max-h-[60vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {!q && (
          <button
            type="button"
            onClick={() => pick(null)}
            className={`mb-2 flex w-full items-center gap-3 rounded-card border p-3 text-left transition ${
              value == null ? 'border-teal bg-teal/5' : 'border-hairline bg-white'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-base text-[20px]">🧭</span>
            <span className="flex-1 text-body font-semibold text-ink">{t('nearYou.allTradesCount', { count: trades.length })}</span>
            {value == null && <IconCheck size={18} className="text-teal" />}
          </button>
        )}

        {items.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted">{t('nearYou.noTradeMatch')}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((c) => {
              const actif = value === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pick(c.id)}
                    className={`flex h-full w-full flex-col items-center gap-1.5 rounded-card border p-2.5 text-center transition active:scale-95 ${
                      actif ? 'border-teal bg-teal text-white' : c.n > 0 ? 'border-hairline bg-white text-ink' : 'border-hairline bg-base/60 text-muted'
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-[22px] ${
                        actif ? 'bg-white/20' : 'bg-base'
                      }`}
                    >
                      {tradeEmoji(c.id)}
                    </span>
                    <span className="line-clamp-2 text-[12px] font-semibold leading-tight">{c.label}</span>
                    {c.n > 0 && (
                      <span className={`rounded-pill px-1.5 text-[10px] font-bold ${actif ? 'bg-white/25 text-white' : 'bg-teal/10 text-teal'}`}>
                        {c.n}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
