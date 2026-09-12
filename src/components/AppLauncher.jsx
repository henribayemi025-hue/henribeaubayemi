import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconGridDots, IconExternalLink } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useAsync } from '../hooks/useAsync';
import { Modal } from './Modal';
import { fetchApps, appsFromCache, visibleApps, accentClass } from '../lib/apps';

// « Finjaro » → F, « Finjaro Accounting » → FA, « Console Finjaro » → CF.
// Deux lettres au plus: au-delà, ça ne se lit plus dans un carré de 44 px.
function monogramme(nom) {
  const mots = String(nom || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  if (mots.length === 1) return mots[0].charAt(0).toUpperCase();
  return (mots[0].charAt(0) + mots[1].charAt(0)).toUpperCase();
}

// Le sélecteur d'applications Finjaro — la grille en haut à droite, comme
// celle de Google. Une seule et même liste dans toutes les applications
// (table finjaro_apps), l'application ouverte est marquée sur place.
//
// Pas d'emoji. Beau (11/09): « les emoji, le design pour cette partie-là est
// à revoir ». Un emoji n'est pas dessiné par nous: il change de tête selon le
// téléphone, il est enfantin sur certains, et il ne ressemble à rien de ce
// qu'on fait ailleurs. On reprend donc le langage des avatars de boutiques —
// un monogramme sérif dans un carré teinté de la couleur de l'application.
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
            <span
              aria-hidden="true"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-input font-serif text-[19px] font-semibold ${accentClass(a.accent)}`}
            >
              {monogramme(a.name)}
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
