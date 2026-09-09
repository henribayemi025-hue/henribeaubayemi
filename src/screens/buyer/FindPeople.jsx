import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconX } from '@tabler/icons-react';
import { storageThumbUrl, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { searchPeople } from '../../lib/directMessages';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { EmptyState } from '../../components/states';

// Chercher un compte à suivre — jamais une liste ouverte (voir
// search_people, migration 0099): seuls nom + avatar sont exposés, jamais
// téléphone/adresse/e-mail/ville.
export default function FindPeople() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const rows = await searchPeople(q.trim());
        if (!cancelled) setResults(rows);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div>
      <AppHeader title={t('dm.findPeople')} back />
      <div className="border-b border-hairline p-3">
        <div className="relative">
          <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('dm.searchPlaceholder')}
            className="input h-10 w-full bg-base pl-9 pr-9 text-[16px]"
            aria-label={t('dm.searchPlaceholder')}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label={t('common.close')} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted">
              <IconX size={15} />
            </button>
          )}
        </div>
      </div>
      {q.trim().length < 2 ? (
        <p className="p-6 text-center text-caption text-muted">{t('dm.searchHint')}</p>
      ) : !searching && results.length === 0 ? (
        <EmptyState icon={IconSearch} title={t('dm.noResults')} />
      ) : (
        <ul>
          {(user ? results.filter((r) => r.id !== user.id) : results).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => navigate(`/profile/u/${p.id}`)}
                className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-colors hover:bg-base"
              >
                <ShopAvatar
                  src={p.avatar_url ? storageThumbUrl('shops', p.avatar_url) : null}
                  fallbackSrc={p.avatar_url ? storageUrl('shops', p.avatar_url) : null}
                  name={p.name}
                  seed={p.id}
                  className="h-11 w-11"
                />
                <span className="text-body font-semibold text-ink">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
