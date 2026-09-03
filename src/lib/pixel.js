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
// 2. JAMAIS sans consentement explicite. Voir CookieConsent.jsx — le
//    chargement n'est déclenché que par un clic "Accepter".
const PIXEL_ID = '3321058288094091';

function estAppNative() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

let charge = false;

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

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`;
  document.body.appendChild(img);
}
