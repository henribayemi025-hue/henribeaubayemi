import { describe, it, expect, beforeEach } from 'vitest';
import { retourApres } from './useAuth';

// Où l'on revient après Google ou Apple. Beau, 22/09: parti de « Mon argent »,
// revenu sur la place de marché. Le code renvoyait toujours à la racine.
function surLaPage(pathname, search = '') {
  delete window.location;
  window.location = { origin: 'https://finjaro.net', pathname, search };
}

describe('retourApres', () => {
  beforeEach(() => surLaPage('/profile/argent'));

  it('revient sur la page d’où l’on vient', () => {
    expect(retourApres()).toBe('https://finjaro.net/profile/argent');
  });

  it('garde les paramètres de l’adresse', () => {
    surLaPage('/search', '?q=sac');
    expect(retourApres()).toBe('https://finjaro.net/search?q=sac');
  });

  it('suit la destination que RequireAuth a mise de côté', () => {
    surLaPage('/auth');
    expect(retourApres('/profile/argent')).toBe('https://finjaro.net/profile/argent');
  });

  it('ne revient pas sur l’écran de connexion', () => {
    surLaPage('/auth');
    expect(retourApres()).toBe('https://finjaro.net');
  });

  it('refuse une adresse extérieure déguisée en chemin', () => {
    surLaPage('/auth');
    expect(retourApres('//ailleurs.example/vol')).toBe('https://finjaro.net');
    expect(retourApres('https://ailleurs.example')).toBe('https://finjaro.net');
  });
});
