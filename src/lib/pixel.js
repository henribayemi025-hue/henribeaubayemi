// Pixel publicitaire Meta (Facebook/Instagram) — mesure des campagnes de pub.
//
// Deux garde-fous volontaires, non négociables:
//
// 1. JAMAIS dans l'app native (iOS/Android). Les apps chargent finjaro.net
//    dans une coque Capacitor — sans ce garde-fou, le pixel tournerait aussi
//    À L'INTÉRIEUR de l'app, ce qui relève du pistage publicitaire
//    inter-app au sens d'Apple (App Tracking Transparency) et exposerait
//    l'app, actuellement en toute première revue App Store, à un refus ou à
//    une exigence de bandeau ATT. Le pixel ne sert de toute façon qu'aux
//    campagnes web (Facebook/Instagram Ads pointant vers finjaro.net).
// 2. JAMAIS sans consentement là où la loi l'exige. Voir CookieConsent.jsx.

// Deux pixels, et c'est voulu. Beau a envoyé le 28/09 le code de son pixel
// actuel (`1530672592412912`) ; le code en portait déjà un autre depuis le
// 04/09 (`3321058288094091`). Remplacer l'ancien aurait coupé les données de
// toute campagne ou audience qui s'appuie encore dessus, sans que personne ne
// le voie. Meta accepte plusieurs pixels sur une même page : chaque `init`
// ajoute un destinataire, et un seul `track` part vers tous. On retirera
// l'ancien quand Beau aura confirmé qu'il ne sert plus.
export const PIXEL_IDS = ['1530672592412912', '3321058288094091'];

function estAppNative() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

let charge = false;
// Le chemin dont la page vue a déjà été comptée. Sert à ne jamais compter deux
// fois la même page (voir `pageVueMeta`).
let derniereVue = null;

export function chargerPixelMeta() {
  if (charge || estAppNative() || typeof document === 'undefined') return;
  charge = true;

  window.fbq = window.fbq || function fbq() {
    (window.fbq.queue = window.fbq.queue || []).push(arguments);
  };
  window._fbq = window._fbq || window.fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  for (const id of PIXEL_IDS) window.fbq('init', id);
  window.fbq('track', 'PageView');
  derniereVue = window.location?.pathname ?? null;

  // Il n'y a volontairement PAS d'image `facebook.com/tr?…&noscript=1` ici.
  // Dans l'extrait officiel de Meta, cette image est enveloppée dans
  // <noscript> : elle ne sert qu'aux navigateurs SANS JavaScript. Injectée par
  // du JavaScript, elle partait à chaque fois EN PLUS du `track` ci-dessus, et
  // comptait donc la première page deux fois — des chiffres de pub gonflés.
}

// Finjaro est une application à une seule page : changer d'écran ne recharge
// rien, donc l'extrait de Meta ne voyait QUE la première page. Pour une
// campagne, ça veut dire que Meta ignorait tout ce que la personne regardait
// ensuite — un article, une boutique, le panier. On signale chaque changement
// d'écran, une seule fois par chemin, et seulement si le pixel a été chargé
// (donc seulement si la personne l'a accepté, là où c'est exigé).
export function pageVueMeta(chemin) {
  if (!charge || typeof window === 'undefined' || !window.fbq) return;
  if (!chemin || chemin === derniereVue) return;
  derniereVue = chemin;
  window.fbq('track', 'PageView');
}

// Le choix de la personne, gardé sur son appareil : '1' accepté (ou accord
// implicite hors zone RGPD), '0' refusé. Lu aussi par CookieConsent et
// InstallAppBanner.
export const PIXEL_CONSENT_KEY = 'finjaro_pixel_consent';

export function pixelDisponible() {
  return typeof window !== 'undefined' && !estAppNative();
}

/** Le pixel est-il permis sur cet appareil ? (null : personne n'a encore choisi) */
export function lireAccordPixel() {
  try {
    const v = localStorage.getItem(PIXEL_CONSENT_KEY);
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
}

// Hors Europe, le pixel se charge sans bandeau (décision de Beau). Il faut
// donc un moyen de dire non APRÈS coup, sinon la politique de confidentialité
// mentirait en parlant d'un refus possible : c'est le réglage de Paramètres.
// Refuser coupe l'envoi tout de suite (`consent revoke` de Meta : les appels
// suivants ne partent plus), et le choix est gardé pour les visites d'après.
export function reglerAccordPixel(accepte) {
  try { localStorage.setItem(PIXEL_CONSENT_KEY, accepte ? '1' : '0'); } catch { /* noop */ }
  if (typeof window === 'undefined') return;
  if (accepte) {
    if (charge && window.fbq) window.fbq('consent', 'grant');
    else chargerPixelMeta();
  } else if (charge && window.fbq) {
    window.fbq('consent', 'revoke');
  }
}

// Pour les tests seulement : repart d'un état vierge.
export function _reinitialiserPixelPourTests() {
  charge = false;
  derniereVue = null;
}
