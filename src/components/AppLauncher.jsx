import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconGridDots, IconExternalLink } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useAsync } from '../hooks/useAsync';
import { Modal } from './Modal';
import { fetchApps, appsFromCache, visibleApps, accentClass } from '../lib/apps';

// Le sélecteur d'applications Finjaro — la grille en haut à droite, comme
// celle de Google. Une seule et même liste dans toutes les applications
// (table finjaro_apps), l'application ouverte est marquée sur place.
//
// `currentKey` est passé à la main plutôt que deviné depuis l'adresse: en
// préproduction l'hôte n'est pas celui de la production, et l'application
// ouverte ne serait alors jamais reconnue.
export function AppLauncher({ currentKey = 'marketplace' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('apps.title')}
        className="rounded-full p-0.5 text-ink transition active:scale-90"
      >
        <IconGridDots size={22} />
      </button>
      <AppsSheet open={open} onClose={() => setOpen(false)} currentKey={currentKey} />
    </>
  );
}

export function AppsSheet({ open, onClose, currentKey }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t('apps.title')}>
      <p className="-mt-1 mb-3 text-caption text-muted">{t('apps.subtitle')}</p>
      <AppsList currentKey={currentKey} />
    </Modal>
  );
}

// Réutilisée telle quelle par la page /apps: une seule mise en forme à tenir.
export function AppsList({ currentKey }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { status } = useVendorStatus();

  // Rendu immédiat depuis le cache, rafraîchi en tâche de fond: ouvrir le
  // sélecteur ne doit jamais faire attendre devant un écran vide.
  const { data } = useAsync(fetchApps, [], { cacheKey: 'finjaro:apps' });
  const apps = visibleApps(data || appsFromCache(), {
    isAdmin: !!profile?.is_admin,
    isVendor: status === 'approved',
  });

  return (
    <ul className="grid gap-2">
      {apps.map((a) => {
        const ouverte = a.key === currentKey;
        const contenu = (
          <>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-[22px] ${accentClass(a.accent)}`}>
              {a.emoji || (a.name || '?').trim().charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-body font-semibold text-ink">{a.name}</span>
                {ouverte && (
                  <span className="shrink-0 rounded-pill bg-base px-2 py-0.5 text-[11px] font-semibold text-muted">
                    {t('apps.current')}
                  </span>
                )}
              </span>
              {a.tagline && <span className="mt-0.5 block text-caption text-muted">{a.tagline}</span>}
            </span>
            {!ouverte && <IconExternalLink size={16} className="shrink-0 text-hairline" />}
          </>
        );
        return (
          <li key={a.key}>
            {ouverte ? (
              <div className="flex items-center gap-3 rounded-card border border-hairline bg-base/60 p-3">{contenu}</div>
            ) : (
              <a
                href={a.url}
                // Chaque application garde son onglet: on ne veut pas
                // remplacer une caisse ouverte par la place de marché.
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-card border border-hairline p-3 transition active:scale-[0.99] hover:bg-base"
              >
                {contenu}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
