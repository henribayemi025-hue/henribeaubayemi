// La ville ressemble à celle de la personne, d'après le fuseau horaire.
import { describe, it, expect } from 'vitest';
import { regionDuFuseau, styleVille } from './region';

describe('style de la ville', () => {
  it('suit le fuseau horaire, pas la langue', () => {
    expect(regionDuFuseau('Africa/Douala')).toBe('afrique');
    expect(regionDuFuseau('Europe/Paris')).toBe('europe');
    expect(regionDuFuseau('Asia/Tokyo')).toBe('asie');
    expect(regionDuFuseau('America/Toronto')).toBe('amerique');
    expect(regionDuFuseau('Asia/Dubai')).toBe('mixte');
    expect(regionDuFuseau('')).toBe('mixte');
  });
  it('rend les réglages complets de la région', () => {
    const s = styleVille('Africa/Lagos');
    expect(s.nom).toBe('afrique');
    expect(s.marche).toBe(true);
    expect(s.hauteur).toBeLessThan(1);
  });
});
