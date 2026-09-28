// Le pixel publicitaire compte des pages vues qui finissent dans les
// statistiques de campagne de Beau. Sa règle : aucun chiffre gonflé. Ces tests
// figent les trois promesses : les deux pixels reçoivent la même page, la
// première page n'est comptée qu'une fois, et chaque nouvel écran est compté.
import { describe, it, expect, beforeEach } from 'vitest';
import { chargerPixelMeta, pageVueMeta, PIXEL_IDS, _reinitialiserPixelPourTests } from './pixel';

let appels;
beforeEach(() => {
  _reinitialiserPixelPourTests();
  appels = [];
  window.fbq = (...args) => appels.push(args);
  delete window.Capacitor;
  window.history.replaceState({}, '', '/');
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
});
