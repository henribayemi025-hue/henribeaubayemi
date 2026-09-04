import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { chargerPixelMeta } from '../lib/pixel';
import { useSettings } from '../hooks/useSettings';

const CONSENT_KEY = 'finjaro_pixel_consent'; // '1' accepté, '0' refusé

// Zone où le consentement AVANT dépôt d'un cookie publicitaire est LÉGALEMENT
// requis (RGPD/ePrivacy — UE + EEE + Royaume-Uni + Suisse alignée). Une
// vendeuse camerounaise ou une acheteuse en Côte d'Ivoire ne verra donc plus
// le bandeau, comme demandé par Beau : « mets dans la politique et tout
// c'est suffisant la bas ». Pour l'UE le pixel reste opt-in, sinon la CNIL
// peut sanctionner.
const PAYS_CONSENTEMENT_REQUIS = new Set([
  // UE 27
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  // EEE
  'IS','LI','NO',
  // Royaume-Uni (UK-GDPR, meme regime), Suisse (LPD alignee 2023)
  'GB','CH',
]);

// Bandeau de consentement — condition posée par Beau avant d'activer le
// pixel Meta: la politique de confidentialité promettait explicitement
// « aucun pixel de réseau social », donc le pixel ne peut se déclencher
// qu'après un choix explicite dans les pays où la loi l'exige. Hors zone
// RGPD, la mention dans la politique de confidentialité suffit et le pixel
// se charge directement — ne pas montrer un bandeau à une vendeuse qui
// n'en attend pas était la demande de Beau.
//
// Écrans autonomes (connexion, CGU...): montrer un bandeau publicitaire par-
// dessus serait déplacé, comme pour AppIntro.
const STANDALONE = ['/auth', '/legal', '/landing', '/a-propos', '/suppression-compte'];

export function CookieConsent() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { country } = useSettings();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (STANDALONE.some((p) => pathname.startsWith(p))) return;
    let choix = null;
    try { choix = localStorage.getItem(CONSENT_KEY); } catch { /* stockage indisponible */ }
    // Refus déjà exprimé : on respecte, jamais de pixel.
    if (choix === '0') return;
    // Accord déjà donné : on active le pixel, pas de bandeau.
    if (choix === '1') { chargerPixelMeta(); return; }
    // Aucun choix mémorisé : la loi tranche. Hors zone RGPD, le pixel
    // s'active directement (la politique de confidentialité vaut information
    // suffisante). Dans la zone RGPD, on affiche le bandeau.
    if (country && !PAYS_CONSENTEMENT_REQUIS.has(country)) {
      chargerPixelMeta();
      // On mémorise « acceptation implicite » pour ne pas rejouer la
      // détection à chaque navigation.
      try { localStorage.setItem(CONSENT_KEY, '1'); } catch { /* noop */ }
      return;
    }
    // Pays inconnu OU pays RGPD : bandeau (précaution — mieux vaut demander
    // à un camerounais mal détecté que rater un français).
    setShow(true);
  }, [pathname, country]);

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
