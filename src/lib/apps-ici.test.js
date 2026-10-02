// Le sélecteur d'applications reste sur la préproduction quand on y est.
import { describe, it, expect } from 'vitest';
import { adresseIci, visibleApps } from './apps';

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

describe('Finjaro Learn dans le menu', () => {
  const base = [{ key: 'marketplace', sort_order: 10, url: 'https://finjaro.net', audience: 'tous' }, { key: 'legion', sort_order: 25, url: 'https://finjaro.net/legion', audience: 'tous' }, { key: 'athlo', sort_order: 30, url: 'https://x.netlify.app', audience: 'tous' }];
  it('apparaît sur la préproduction, après Léo, avec l’adresse de la préproduction', () => {
    const l = visibleApps(base, { origine: 'https://staging-finjaro.finjaro.workers.dev' });
    expect(l.map((a) => a.key)).toEqual(['marketplace', 'legion', 'learn', 'lettre-ia', 'athlo']);
    expect(l[2].url).toBe('https://staging-finjaro.finjaro.workers.dev/learn/');
  });
  it('n’apparaît pas sur finjaro.net', () => {
    expect(visibleApps(base, { origine: 'https://finjaro.net' }).some((a) => a.key === 'learn')).toBe(false);
  });
  it('pas de doublon quand la ligne existera en base', () => {
    const l = visibleApps([...base, { key: 'learn', sort_order: 27, url: 'https://finjaro.net/learn/', audience: 'tous' }], { origine: 'https://staging-finjaro.finjaro.workers.dev' });
    expect(l.filter((a) => a.key === 'learn')).toHaveLength(1);
  });
});
