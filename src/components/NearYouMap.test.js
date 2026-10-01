// Épingle de boutique sur la carte : le nom et la photo viennent de la
// vendeuse, ils ne doivent jamais devenir du code (audit du 01/10, C-1).
import { describe, it, expect, vi } from 'vitest';

vi.mock('maplibre-gl', () => ({}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('../lib/supabase', () => ({
  storageUrl: (b, p) => p,
  storageThumbUrl: (b, p) => (p.startsWith('http') || p.startsWith('/') ? p : `/img/${b}/${p}`),
}));

const { elementBoutique } = await import('./NearYouMap');

describe('épingle de boutique', () => {
  it('une adresse piégée ne crée aucun attribut ni code', () => {
    window.__pirate = 0;
    const el = elementBoutique({ id: 's1', name: 'Kora', avatar_url: 'https://x.test/a.jpg" onerror="window.__pirate=1' });
    document.body.appendChild(el);
    const img = el.querySelector('img');
    expect(img.getAttribute('onerror')).toBeNull();
    expect(img.getAttribute('src')).toBe('https://x.test/a.jpg" onerror="window.__pirate=1');
    expect(el.querySelectorAll('[onerror],[onload],script').length).toBe(0);
    expect(window.__pirate).toBe(0);
    el.remove();
  });

  it('un nom piégé reste du texte', () => {
    const el = elementBoutique({ id: 's2', name: '<img src=x onerror=alert(1)>', avatar_url: null });
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<');
  });

  it("refuse une photo qui n'est ni https ni un chemin du site", () => {
    // Un « javascript: » n'est qu'un nom de fichier du dossier : il devient un chemin /img/, jamais du code.
    expect(elementBoutique({ id: 's3', name: 'A', avatar_url: 'javascript:alert(1)' }).querySelector('img').getAttribute('src')).toBe('/img/shops/javascript:alert(1)');
    expect(elementBoutique({ id: 's4', name: 'A', avatar_url: 'http://x.test/a.jpg' }).querySelector('img')).toBeNull();
  });

  it('affiche normalement la photo de stockage et retire une image cassée', () => {
    const el = elementBoutique({ id: 's5', name: 'Awa', avatar_url: 'u1/photo.jpg' });
    const img = el.querySelector('img');
    expect(img.getAttribute('src')).toBe('/img/shops/u1/photo.jpg');
    img.dispatchEvent(new Event('error'));
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('A');
  });
});
