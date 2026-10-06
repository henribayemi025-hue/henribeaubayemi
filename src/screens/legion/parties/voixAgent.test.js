import { describe, it, expect } from 'vitest';
import { choisirVoix, genreDe, tonDe } from './voixAgent';

const VOIX = [
  { name: 'Google français', lang: 'fr-FR' },
  { name: 'Microsoft Denise - French', lang: 'fr-FR' },
  { name: 'Microsoft Henri - French', lang: 'fr-FR' },
  { name: 'Samantha', lang: 'en-US' },
  { name: 'Daniel', lang: 'en-GB' },
];

describe('voix d’un agent au téléphone', () => {
  it('lit le genre dans la description du portrait', () => {
    expect(genreDe({ apparence: { description: 'Portrait of a smiling woman, 30s' } })).toBe('f');
    expect(genreDe({ apparence: { description: 'A man in a navy suit' } })).toBe('m');
    expect(genreDe({ apparence: {} })).toBeNull();
  });
  it('choisit une voix de femme ou d’homme dans la bonne langue', () => {
    expect(choisirVoix(VOIX, 'fr', 'f', 'Ada').name).toMatch(/Denise/);
    expect(choisirVoix(VOIX, 'fr', 'm', 'Alpha').name).toMatch(/Henri/);
    expect(choisirVoix(VOIX, 'en', 'm', 'Rigo').name).toBe('Daniel');
    expect(choisirVoix([], 'fr', 'f', 'x')).toBeNull();
  });
  it('garde la même voix et le même ton pour un même agent', () => {
    expect(choisirVoix(VOIX, 'fr', null, 'Vigie')).toBe(choisirVoix(VOIX, 'fr', null, 'Vigie'));
    const ton = tonDe('Vigie');
    expect(ton).toBeGreaterThanOrEqual(0.9);
    expect(ton).toBeLessThanOrEqual(1.1);
    expect(tonDe('Vigie')).toBe(ton);
  });
});
