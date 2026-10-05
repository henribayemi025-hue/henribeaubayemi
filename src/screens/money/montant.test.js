import { describe, it, expect } from 'vitest';
import { lireMontant, montantOuZero } from './montant';

describe('lireMontant', () => {
  it('accepte la virgule française', () => {
    expect(lireMontant('12,50')).toBe(12.5);
    expect(lireMontant('0,16')).toBe(0.16);
  });
  it('accepte le point, les espaces de milliers et un symbole collé', () => {
    expect(lireMontant('22.88')).toBe(22.88);
    expect(lireMontant('1 200')).toBe(1200);
    expect(lireMontant('1 200,5')).toBe(1200.5);
    expect(lireMontant('25 €')).toBe(25);
    expect(lireMontant('1.200,50')).toBe(1200.5);
  });
  it('rend NaN pour un texte qui n\'est pas un montant', () => {
    expect(lireMontant('')).toBeNaN();
    expect(lireMontant('abc')).toBeNaN();
  });
  it('montantOuZero : vide vaut 0', () => {
    expect(montantOuZero('')).toBe(0);
    expect(montantOuZero('7,5')).toBe(7.5);
  });
});
