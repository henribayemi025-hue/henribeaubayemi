// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ecranPermis, voirEcran } from '../src/ecran.js';

describe('voir_ecran : quelles adresses', () => {
  it('pages publiques en https, y compris le site et sa préproduction', () => {
    expect(ecranPermis('https://finjaro.net/')?.hostname).toBe('finjaro.net');
    expect(ecranPermis('https://staging-finjaro.finjaro.workers.dev/boutique/x')).not.toBeNull();
    expect(ecranPermis('https://www.example.com/a?b=1')).not.toBeNull();
  });
  it('refuse le reste', () => {
    for (const u of ['http://finjaro.net', 'https://127.0.0.1/', 'https://[::1]/', 'https://localhost/', 'https://intranet/',
      'https://x.local/', 'https://a:b@finjaro.net/', 'https://finjaro.net:8443/', 'https://finjaro-atelier.finjaro.workers.dev/api/moi',
      'https://metadata.google.internal/', 'file:///etc/passwd', 'pas une adresse', '']) {
      expect(ecranPermis(u)).toBeNull();
    }
  });
  it('sans navigateur branché, le dit au lieu de planter', async () => {
    expect(await voirEcran({}, 'https://finjaro.net/')).toEqual({ erreur: expect.stringMatching(/navigateur/) });
    expect((await voirEcran({}, 'http://finjaro.net/')).erreur).toMatch(/refusée/);
  });
});
