import { describe, expect, it } from 'vitest';
import { appliquerTaux, convertFromFcfa, currencyForCountry, CURRENCIES, estMonnaie, formatPrice, nomMonnaie, paysDuFuseau, toFcfa } from './currency';

describe('monnaies du monde (23/09)', () => {
  it('donne à chaque pays SA monnaie, jamais le franc CFA par défaut', () => {
    expect(currencyForCountry('CA')).toBe('CAD');
    expect(currencyForCountry('CM')).toBe('FCFA');
    expect(currencyForCountry('SN')).toBe('FCFA');
    expect(currencyForCountry('GB')).toBe('GBP');
    expect(currencyForCountry('RU')).toBe('RUB');
    expect(currencyForCountry('NG')).toBe('NGN');
    expect(currencyForCountry('CH')).toBe('CHF');
    expect(currencyForCountry(null)).toBe('USD');
    expect(currencyForCountry('XX')).toBe('USD');
  });

  it('retrouve le pays d’un fuseau, anciens noms compris', () => {
    expect(paysDuFuseau('Africa/Douala')).toBe('CM');
    expect(paysDuFuseau('America/Toronto')).toBe('CA');
    expect(paysDuFuseau('Asia/Calcutta')).toBe('IN');
    expect(paysDuFuseau('Nulle/Part')).toBe(null);
  });

  it('garde la parité fixe du franc CFA avec l’euro', () => {
    expect(toFcfa(1, 'EUR')).toBe(656);
    expect(toFcfa(10, 'EUR')).toBe(6560);
    expect(convertFromFcfa(655.957, 'EUR')).toBeCloseTo(1, 6);
    expect(toFcfa(4500, 'FCFA')).toBe(4500);
  });

  it('prend les taux du jour et les applique', () => {
    appliquerTaux([{ code: 'GBP', par_euro: 0.8, maj: '2099-01-01T00:00:00Z' }]);
    expect(toFcfa(10, 'GBP')).toBe(Math.round((10 * 655.957) / 0.8));
    expect(formatPrice(toFcfa(10, 'GBP'), 'GBP', 'en')).toBe('£10.00');
  });

  it('écrit chaque monnaie avec ses décimales à elle', () => {
    expect(formatPrice(4500, 'FCFA', 'fr')).toMatch(/^4\s500 FCFA$/);
    expect(formatPrice(toFcfa(1000, 'JPY'), 'JPY', 'en')).toBe('¥1,000');
  });

  it('propose toutes les monnaies, le franc CFA une seule fois', () => {
    expect(CURRENCIES.length).toBeGreaterThan(150);
    expect(CURRENCIES).toContain('FCFA');
    expect(CURRENCIES).toContain('CAD');
    expect(CURRENCIES).not.toContain('XAF');
    expect(estMonnaie('XOF')).toBe(false);
    expect(estMonnaie('RUB')).toBe(true);
    expect(nomMonnaie('FCFA', 'fr')).toBe('franc CFA');
  });
});
