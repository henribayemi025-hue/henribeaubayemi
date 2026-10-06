// La copie serveur de PAYS_MONNAIE ne doit pas s'écarter de celle de
// l'application : une vendeuse verrait sinon deux monnaies pour sa boutique.
import { describe, it, expect } from 'vitest';
import { PAYS_MONNAIE as SERVEUR, monnaieDeBoutique, versFcfa, depuisFcfa, FCFA_PAR_EURO } from './monnaie-boutique';
import { PAYS_MONNAIE as APPLI } from '../../../src/lib/monnaies-donnees';
import { currencyForCountry } from '../../../src/lib/currency';

describe('monnaie de la boutique (serveur)', () => {
  it('même liste pays → monnaie que l’application', () => {
    expect(SERVEUR).toEqual(APPLI);
  });
  it('même règle que currencyForCountry, sans FCFA par défaut', () => {
    for (const p of ['CM', 'GB', 'CA', 'fr', 'NG', 'ZZ', null, '']) expect(monnaieDeBoutique(p)).toBe(currencyForCountry(p));
    expect(monnaieDeBoutique(null)).toBe('USD');
  });
  it('conversions', () => {
    expect(versFcfa(10, 1)).toBe(6560);            // 10 € → 6 560 FCFA
    expect(versFcfa(25000, FCFA_PAR_EURO)).toBe(25000);
    expect(depuisFcfa(6560, 1)).toBe(10);
  });
});
