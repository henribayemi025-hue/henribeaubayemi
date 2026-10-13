// La consigne courte : la plus complète qui tient sous la borne, jamais rien d'autre.
import { describe, it, expect } from 'vitest';
import { consigneCourte, COMPACTE_MAX } from './consigne-courte';

const fil = Array.from({ length: 40 }, (_, i) => `message ${i} ${'x'.repeat(400)}`);
const construire = ({ coupe, garde }: { coupe: (t: string, m: number) => string; garde: <T>(l: T[], m: number) => T[] }) =>
  `RÈGLES\n${coupe('p'.repeat(5000), 600)}\n${garde(fil, 30).map((l) => coupe(l, 300)).join('\n')}\nÉCRIS`;

describe('consigneCourte', () => {
  it('garde le premier niveau quand il tient', () => {
    const t = consigneCourte(() => 'court');
    expect(t).toBe('court');
  });
  it('resserre jusqu’à tenir sous la borne, règles et fin comprises', () => {
    const t = consigneCourte(construire);
    expect(t.length).toBeLessThanOrEqual(COMPACTE_MAX);
    expect(t.startsWith('RÈGLES')).toBe(true);
    expect(t.endsWith('ÉCRIS')).toBe(true);
  });
  it('rend le niveau le plus serré si rien ne tient (moteur.ts le signalera)', () => {
    const t = consigneCourte(construire, 100);
    expect(t.length).toBeGreaterThan(100);
    expect(t.length).toBeLessThanOrEqual(consigneCourte(construire).length);
  });
});
