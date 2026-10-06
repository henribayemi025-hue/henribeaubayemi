import { describe, it, expect } from 'vitest';
import { centreDuMouvement, estUnSigne } from './gesteMain';

const image = (largeur, hauteur, colonnes) => {
  const d = new Uint8ClampedArray(largeur * hauteur * 4);
  for (let y = 0; y < hauteur; y++) for (let x = 0; x < largeur; x++) {
    const v = colonnes.includes(x) ? 255 : 0;
    const i = (y * largeur + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  return d;
};

describe('réveil de Jarvis d’un geste', () => {
  it('trouve où ça a bougé, et rien quand rien ne bouge', () => {
    const a = image(20, 10, []);
    const b = image(20, 10, [15, 16, 17, 18, 19]);
    expect(centreDuMouvement(a, b, 20)).toBeCloseTo(0.85, 2);
    expect(centreDuMouvement(a, a, 20)).toBeNull();
  });
  it('reconnaît un signe de la main (gauche-droite-gauche)', () => {
    const pts = [0.2, 0.45, 0.7, 0.45, 0.2, 0.5, 0.75].map((x, i) => ({ x, t: i * 120 }));
    expect(estUnSigne(pts)).toBe(true);
  });
  it('ignore quelqu’un qui passe une seule fois devant la caméra', () => {
    const pts = [0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => ({ x, t: i * 120 }));
    expect(estUnSigne(pts)).toBe(false);
  });
  it('ignore des petits tremblements', () => {
    const pts = [0.5, 0.55, 0.5, 0.56, 0.5, 0.55].map((x, i) => ({ x, t: i * 120 }));
    expect(estUnSigne(pts)).toBe(false);
  });
});
