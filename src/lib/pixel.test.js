// Le pixel publicitaire compte des pages vues qui finissent dans les
// statistiques de campagne de Beau. Sa règle : aucun chiffre gonflé. Ces tests
// figent les trois promesses : les deux pixels reçoivent la même page, la
// première page n'est comptée qu'une fois, et chaque nouvel écran est compté.
import { describe, it, expect, beforeEach } from 'vitest';
import { chargerPixelMeta, pageVueMeta, PIXEL_IDS, lireAccordPixel, reglerAccordPixel, _reinitialiserPixelPourTests } from './pixel';

let appels;
beforeEach(() => {
  _reinitialiserPixelPourTests();
  appels = [];
  window.fbq = (...args) => appels.push(args);
  delete window.Capacitor;
  window.history.replaceState({}, '', '/');
  try { localStorage.clear(); } catch { /* noop */ }
});

const pagesVues = () => appels.filter(([a, b]) => a === 'track' && b === 'PageView').length;

describe('pixel Meta', () => {
  it('initialise le pixel de Beau ET l’ancien, sans en perdre aucun', () => {
    chargerPixelMeta();
    const inits = appels.filter(([a]) => a === 'init').map(([, id]) => id);
    expect(inits).toEqual(PIXEL_IDS);
    expect(inits).toContain('1530672592412912');
  });

  it('compte la première page UNE seule fois', () => {
    chargerPixelMeta();
    pageVueMeta('/'); // l'effet de navigation voit la même page
    expect(pagesVues()).toBe(1);
  });

  it('compte chaque nouvel écran, mais pas deux fois le même', () => {
    chargerPixelMeta();
    pageVueMeta('/product/abc');
    pageVueMeta('/product/abc');
    pageVueMeta('/cart');
    expect(pagesVues()).toBe(3); // accueil + article + panier
  });

  it('ne compte rien tant que le pixel n’est pas chargé (pas d’accord)', () => {
    pageVueMeta('/product/abc');
    expect(pagesVues()).toBe(0);
  });

  it('ne se charge jamais dans l’application iPhone / Android', () => {
    window.Capacitor = { isNativePlatform: () => true };
    chargerPixelMeta();
    expect(appels.length).toBe(0);
  });

  // Hors Europe le pixel se charge sans bandeau : la politique de
  // confidentialité promet qu'on peut le refuser dans Paramètres. Ces tests
  // tiennent cette promesse.
  it('refuser dans Paramètres coupe l’envoi tout de suite et s’en souvient', () => {
    chargerPixelMeta();
    reglerAccordPixel(false);
    expect(appels).toContainEqual(['consent', 'revoke']);
    expect(lireAccordPixel()).toBe(false);
  });

  it('réaccepter rouvre l’envoi sans recharger le pixel', () => {
    chargerPixelMeta();
    reglerAccordPixel(false);
    reglerAccordPixel(true);
    expect(appels).toContainEqual(['consent', 'grant']);
    expect(appels.filter(([a]) => a === 'init').length).toBe(PIXEL_IDS.length);
    expect(lireAccordPixel()).toBe(true);
  });

  it('accepter depuis Paramètres charge le pixel s’il ne l’était pas', () => {
    reglerAccordPixel(true);
    expect(appels.filter(([a]) => a === 'init').length).toBe(PIXEL_IDS.length);
  });
});
