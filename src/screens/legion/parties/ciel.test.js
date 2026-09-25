// Le ciel de la Ville : l'heure et la météo de là où est la personne.
import { describe, it, expect } from 'vitest';
import { villeDuFuseau, instantLocal, phaseDuJour, genreMeteo, uniteTemperature, ilFaitChaud, couleursCiel } from './ciel';

describe('ciel de la Ville', () => {
  it('la ville vient du fuseau, pas de la langue', () => {
    expect(villeDuFuseau('Africa/Douala')).toBe('Douala');
    expect(villeDuFuseau('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(villeDuFuseau('UTC')).toBeNull();
    expect(villeDuFuseau('Etc/GMT+1')).toBeNull();
  });
  it('lever et coucher : heure locale → instant réel', () => {
    expect(instantLocal('2026-09-25T06:09', 3600)).toBe(Date.parse('2026-09-25T05:09:00Z'));
  });
  it('les quatre moments du jour', () => {
    const lever = Date.parse('2026-09-25T05:09:00Z'), coucher = Date.parse('2026-09-25T17:15:00Z');
    expect(phaseDuJour(Date.parse('2026-09-25T05:20:00Z'), lever, coucher)).toBe('aube');
    expect(phaseDuJour(Date.parse('2026-09-25T09:30:00Z'), lever, coucher)).toBe('jour');
    expect(phaseDuJour(Date.parse('2026-09-25T16:40:00Z'), lever, coucher)).toBe('couchant');
    expect(phaseDuJour(Date.parse('2026-09-25T21:00:00Z'), lever, coucher)).toBe('nuit');
  });
  it('codes météo, unités, chaleur, couleurs', () => {
    expect([0, 2, 3, 45, 61, 81, 73, 95].map(genreMeteo)).toEqual(['clair', 'nuages', 'couvert', 'brouillard', 'pluie', 'pluie', 'neige', 'orage']);
    expect(uniteTemperature('America/Chicago', 'en-US')).toBe('fahrenheit');
    expect(uniteTemperature('America/Toronto', 'en-CA')).toBe('celsius');
    expect(uniteTemperature('Europe/London', 'en-GB')).toBe('celsius');
    expect(ilFaitChaud(31, 'celsius')).toBe(true);
    expect(ilFaitChaud(27, 'celsius')).toBe(false);
    expect(ilFaitChaud(88, 'fahrenheit')).toBe(true);
    expect(couleursCiel('jour', 'clair')).not.toEqual(couleursCiel('nuit', 'clair'));
  });
});
