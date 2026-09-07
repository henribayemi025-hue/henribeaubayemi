import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';
import { PLAY_STORE_URL, APP_STORE_URL } from './StoreBadges';
import { PAYS_CONSENTEMENT_REQUIS } from './CookieConsent';
import { useSettings } from '../hooks/useSettings';

// Beau, capture d'écran à l'appui: un concurrent (Senvato) affiche un
// bandeau permanent en bas de son site web pour pousser l'installation de
// l'app. Le lien existait déjà (StoreBadges, Réglages + page marketing)
// mais restait caché derrière une navigation volontaire — il fallait
// SAVOIR le chercher pour le trouver. Ce bandeau va au-devant, sur
// n'importe quel écran, à la manière de ce que Beau a montré.
const DISMISS_KEY = 'finjaro_install_banner_dismissed_at';
const DISMISS_DAYS = 14;

// Écrans où un bandeau serait déplacé: connexion, pages légales, la
// marketing (qui a déjà son propre badge intégré), et les écrans
// immersifs plein écran (chat, Fin) où toute la hauteur compte.
const STANDALONE = ['/auth', '/legal', '/landing', '/a-propos', '/suppression-compte', '/chat', '/fin'];

export function InstallAppBanner() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { country } = useSettings();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Déjà dans l'app installée: rien à proposer.
    if (Capacitor.isNativePlatform()) return;
    if (!PLAY_STORE_URL && !APP_STORE_URL) return;
    if (STANDALONE.some((p) => pathname.startsWith(p))) return;

    // Ne pas doubler la bannière de cookies au même instant: si un choix
    // pixel est encore en attente dans un pays RGPD, elle a la priorité
    // (obligation légale) — celle-ci attend son tour à la navigation
    // suivante, une fois le choix enregistré.
    let consentChoice = null;
    try { consentChoice = localStorage.getItem('finjaro_pixel_consent'); } catch { /* stockage indisponible */ }
    if (!consentChoice && country && PAYS_CONSENTEMENT_REQUIS.has(country)) return;

    let dismissedAt = 0;
    try { dismissedAt = Number(localStorage.getItem(DISMISS_KEY)) || 0; } catch { /* stockage indisponible */ }
    const joursEcoules = (Date.now() - dismissedAt) / 86_400_000;
    if (dismissedAt && joursEcoules < DISMISS_DAYS) return;

    setShow(true);
  }, [pathname, country]);

  function fermer() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* stockage indisponible */ }
    setShow(false);
  }

  if (!show) return null;

  const href = APP_STORE_URL || PLAY_STORE_URL;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-ink p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-app items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brass text-title font-semibold text-white">
          F
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-white">{t('installBanner.title')}</p>
          <p className="truncate text-caption text-white/70">{t('installBanner.subtitle')}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-pill bg-brass px-4 py-2 text-caption font-semibold text-white transition active:scale-95"
        >
          {t('installBanner.cta')}
        </a>
        <button onClick={fermer} aria-label={t('common.close')} className="shrink-0 p-1 text-white/70">
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}
