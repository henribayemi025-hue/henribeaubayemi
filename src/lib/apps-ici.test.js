// Le sélecteur d'applications reste sur la préproduction quand on y est.
import { describe, it, expect } from 'vitest';
import { adresseIci } from './apps';

describe('adresseIci', () => {
  const staging = 'https://staging-finjaro.finjaro.workers.dev';
  it('finjaro.net devient la préproduction quand on y est', () => {
    expect(adresseIci('https://finjaro.net/legion', staging)).toBe(`${staging}/legion`);
    expect(adresseIci('https://finjaro.net/relais?x=1', staging)).toBe(`${staging}/relais?x=1`);
  });
  it('rien ne change en production ni pour les autres domaines', () => {
    expect(adresseIci('https://finjaro.net/legion', 'https://finjaro.net')).toBe('https://finjaro.net/legion');
    expect(adresseIci('https://accounting.finjaro.net', staging)).toBe('https://accounting.finjaro.net');
    expect(adresseIci('https://finjaro.net/legion', 'https://exemple.com')).toBe('https://finjaro.net/legion');
  });
});
