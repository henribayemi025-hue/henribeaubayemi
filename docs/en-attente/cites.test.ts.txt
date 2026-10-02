import { describe, it, expect } from 'vitest';
import { identifiantsCites, blocCites, MAX_CITES } from './cites';

const A = 'ea7ab4a2-69c7-419c-b762-8fae3784229b';
const B = '4c663914-e9e3-4c64-abe7-869f7320313f';

describe('identifiantsCites', () => {
  it('trouve les identifiants, sans doublon ni la tâche elle-même', () => {
    const texte = `- ${A} (Alpha)\n- ${B.toUpperCase()} (Mentor)\n- ${A} encore\nma tâche 225b67bb-e187-40a0-bcfe-f3c5e524182f`;
    expect(identifiantsCites(texte, '225b67bb-e187-40a0-bcfe-f3c5e524182f')).toEqual([A, B]);
  });

  it('rien à citer → liste vide', () => {
    expect(identifiantsCites('Écrire le plan de la semaine')).toEqual([]);
  });

  it(`s'arrête à ${MAX_CITES}`, () => {
    const beaucoup = Array.from({ length: 30 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`).join(' ');
    expect(identifiantsCites(beaucoup)).toHaveLength(MAX_CITES);
  });
});

describe('blocCites', () => {
  it('vide quand rien n’est cité', () => {
    expect(blocCites([])).toBe('');
  });

  it('montre le livrable, ou dit qu’il n’y en a pas', () => {
    const b = blocCites([
      { id: A, texte: 'Trier les 100 propositions', agent: 'Alpha', statut: 'revue', livrable: 'Fait : trié.', livre_le: '2026-09-28T10:00:00Z' },
      { id: B, texte: 'Programme Académie', agent: 'Mentor', livrable: null },
    ]);
    expect(b).toContain(`### Tâche ${A} (Alpha) — statut revue`);
    expect(b).toContain('Livrable du 2026-09-28 :\nFait : trié.');
    expect(b).toContain('Livrable : AUCUN');
  });

  it('tient dans la limite, chaque livrable coupé à sa part', () => {
    const cites = Array.from({ length: 15 }, (_, i) => ({ id: `id${i}`, texte: 't', livrable: 'x'.repeat(5000) }));
    const b = blocCites(cites, 24_000);
    expect(b.length).toBeLessThan(26_000);
    expect(b.match(/… \(coupé\)/g)).toHaveLength(15);
  });
});
