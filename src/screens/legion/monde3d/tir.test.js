import { describe, it, expect } from 'vitest';
import { choisirCible, pointImpact, chute, TIR } from './tir';

const o = { x: 0, y: 1.5, z: 0 };
const devant = { x: 0, y: 0, z: 1 };

describe('tirer', () => {
  it('vise la personne la plus proche du centre, devant soi et à portée', () => {
    const cibles = [
      { ref: 'loin-a-cote', x: 6, y: 1.1, z: 30, rayon: 0.45, genre: 'passant' },
      { ref: 'centre', x: 0.5, y: 1.1, z: 20, rayon: 0.45, genre: 'passant' },
      { ref: 'derriere', x: 0, y: 1.1, z: -5, rayon: 0.45, genre: 'passant' },
      { ref: 'trop-loin', x: 0, y: 1.1, z: 80, rayon: 0.45, genre: 'passant' },
    ];
    expect(choisirCible(o, devant, cibles).cible.ref).toBe('centre');
    expect(choisirCible(o, { x: 0, y: 0, z: -1 }, cibles).cible.ref).toBe('derriere');
  });

  it('rien sur le côté : pas de cible (et l’aide est plus large au pouce)', () => {
    const cibles = [{ ref: 'cote', x: 4, y: 1.1, z: 15, rayon: 0.45 }]; // ≈ 15° à droite
    expect(choisirCible(o, devant, cibles)).toBe(null);
    expect(choisirCible(o, devant, cibles, { angle: TIR.angleTel }).cible.ref).toBe('cote');
  });

  it('un mur cache la cible : on ne la touche pas à travers', () => {
    const cibles = [{ ref: 'cachee', x: 0, y: 1.1, z: 30, rayon: 0.45 }];
    const mur = [{ x0: -5, x1: 5, z0: 10, z1: 14, h: 20 }];
    expect(choisirCible(o, devant, cibles, { boites: mur })).toBe(null);
    expect(choisirCible(o, devant, cibles, { boites: [] }).cible.ref).toBe('cachee');
  });

  it('un coup dans le vide s’arrête au mur, au sol ou à la portée', () => {
    expect(pointImpact(o, devant, [{ x0: -5, x1: 5, z0: 10, z1: 14, h: 20 }]).z).toBeCloseTo(10);
    const bas = { x: 0, y: -0.6, z: 0.8 };
    expect(pointImpact(o, bas).y).toBeCloseTo(0);
    expect(pointImpact(o, devant).z).toBeCloseTo(TIR.portee);
  });

  it('la chute : on tombe, on reste au sol, on se relève', () => {
    expect(chute(0)).toBe(0);
    expect(chute(0.5)).toBe(1);
    expect(chute(TIR.ko - 0.1)).toBe(1);
    expect(chute(TIR.ko + 0.3)).toBeCloseTo(0.5);
    expect(chute(TIR.ko + 1)).toBe(0);
  });
});
