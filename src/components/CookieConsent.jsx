import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { chargerPixelMeta } from '../lib/pixel';

const CONSENT_KEY = 'finjaro_pixel_consent'; // '1' accepté, '0' refusé

// Bandeau de consentement — condition posée par Beau avant d'activer le
// pixel Meta: la politique de confidentialité promettait explicitement
// « aucun pixel de réseau social », donc le pixel ne peut se déclencher
// qu'après un choix explicite, jamais par défaut. Refuser reste aussi
// simple qu'accepter, et le choix est mémorisé pour ne plus jamais redemander.
//
// Écrans autonomes (connexion, CGU...): montrer un bandeau publicitaire par-
// dessus serait déplacé, comme pour AppIntro.
const STANDALONE = ['/auth', '/legal', '/landing', '/a-propos', '/suppression-compte'];

export function CookieConsent() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (STANDALONE.some((p) => pathname.startsWith(p))) return;
    let choix = null;
    try { choix = localStorage.getItem(CONSENT_KEY); } catch { /* stockage indisponible */ }
    if (choix === '1') chargerPixelMeta();
    if (choix === null) setShow(true);
  }, [pathname]);

  function repondre(accepte) {
    try { localStorage.setItem(CONSENT_KEY, accepte ? '1' : '0'); } catch { /* noop */ }
    if (accepte) chargerPixelMeta();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-app">
        <p className="text-caption text-muted">{t('cookies.body')}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => repondre(false)} className="btn-secondary flex-1">
            {t('cookies.decline')}
          </button>
          <button onClick={() => repondre(true)} className="btn-primary flex-1">
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
