// La salle des marchés : pour qui, et seulement de vrais chiffres.
import { describe, it, expect } from 'vitest';
import { estSalleDeMarche, pairesDuJour, activite14j } from './salle-marche3d';

describe('salle des marchés', () => {
  it('reconnaît une entreprise de ce métier', () => {
    expect(estSalleDeMarche({ modele: 'marche' })).toBe(true);
    expect(estSalleDeMarche({ nom: 'Kora', projet: 'Je veux acheter des actions chaque jour' })).toBe(true);
    expect(estSalleDeMarche({ nom: 'Maison Kora', projet: 'vêtements et pagnes' })).toBe(false);
    expect(estSalleDeMarche(null)).toBe(false);
  });
  it('calcule les paires depuis les taux par euro, sans rien inventer', () => {
    const p = pairesDuJour({ USD: 1.1, GBP: 0.85, JPY: 160, XAF: 655.957 });
    expect(p.find((x) => x.paire === 'EUR/USD').valeur).toBe('1.1000');
    expect(p.find((x) => x.paire === 'USD/JPY').valeur).toBe('145.45');
    expect(p.find((x) => x.paire === 'EUR/XAF').valeur).toBe('655.96');
    expect(p.some((x) => x.paire === 'USD/NGN')).toBe(false); // pas de taux → pas de ligne
  });
  it('compte les tâches rendues par jour sur 14 jours', () => {
    const maintenant = Date.parse('2026-09-25T12:00:00');
    const j = activite14j([
      { meta: { livre_le: '2026-09-25T08:00:00' } },
      { meta: { livre_le: '2026-09-24T08:00:00' } },
      { meta: { livre_le: '2026-09-24T09:00:00' } },
      { meta: { livre_le: '2026-08-01T09:00:00' } },
      { meta: {} },
    ], maintenant);
    expect(j[13]).toBe(1);
    expect(j[12]).toBe(2);
    expect(j.reduce((a, b) => a + b, 0)).toBe(3);
  });
});
