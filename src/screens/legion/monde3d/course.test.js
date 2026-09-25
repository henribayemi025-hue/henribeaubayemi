// Les courses : les portes se passent dans l'ordre, le chrono est mesuré.
import { describe, it, expect } from 'vitest';
import { nouvelleCourse, avancerCourse, chrono, CIRCUIT } from './course';

describe('course', () => {
  it('ne compte une porte que si on passe dedans, et dans l\'ordre', () => {
    let c = nouvelleCourse();
    c = avancerCourse(c, ...CIRCUIT[3], 1); // porte 3 avant la 1 : rien
    expect(c.prochaine).toBe(1);
    c = avancerCourse(c, ...CIRCUIT[1], 1);
    expect(c.prochaine).toBe(2);
    expect(c.temps).toBe(2);
  });
  it('finit en revenant au départ après toutes les portes', () => {
    let c = nouvelleCourse();
    for (let i = 1; i < CIRCUIT.length; i += 1) c = avancerCourse(c, ...CIRCUIT[i], 5);
    expect(c.finie).toBe(false);
    c = avancerCourse(c, ...CIRCUIT[0], 5);
    expect(c.finie).toBe(true);
    expect(c.temps).toBe(5 * CIRCUIT.length);
    expect(avancerCourse(c, 0, 0, 3).temps).toBe(c.temps); // le chrono s'arrête à l'arrivée
  });
  it('affiche le chrono en minutes et dixièmes', () => {
    expect(chrono(62.34)).toBe('1:02.3');
    expect(chrono(9.06)).toBe('0:09.1');
  });
});
