// La planète : le soleil au bon endroit, les points au bon endroit.
import { describe, it, expect } from 'vitest';
import { pointSubsolaire, versSphere } from './planete3d';

describe('planète', () => {
  it('le soleil est au zénith vers le méridien de Greenwich à midi UTC, et au sud en décembre', () => {
    const midi = pointSubsolaire(Date.UTC(2026, 5, 21, 12, 0));
    expect(Math.abs(midi.lon)).toBeLessThan(1);
    expect(midi.lat).toBeGreaterThan(23);
    expect(pointSubsolaire(Date.UTC(2026, 11, 21, 12, 0)).lat).toBeLessThan(-23);
    expect(pointSubsolaire(Date.UTC(2026, 8, 25, 18, 0)).lon).toBeCloseTo(-90, 0);
  });
  it('place les points sur la sphère au bon endroit', () => {
    const nord = versSphere(90, 0);
    expect(nord.y).toBeCloseTo(1, 5);
    const g = versSphere(0, 0);
    expect(g.x).toBeCloseTo(1, 5);
    expect(versSphere(0, 90).z).toBeCloseTo(-1, 5);
  });
});
