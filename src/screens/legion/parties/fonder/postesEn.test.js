import { describe, it, expect } from 'vitest';
import { traduirePoste, traduirePostes, enAnglais } from './postesEn';

const TABLE = {
  'conseil|Directeur financier': ['Chief Financial Officer', 'Finance', 'Financial model, treasury, fundraising, unit economics.'],
  'conseil|Analyste financier': ['Financial Analyst', 'Finance department', 'Builds the models.'],
  'conseil|Contrôleur de gestion': ['Management Controller', 'Finance', 'Tracks the budget.'],
};
const POSTES = [
  { modele: 'conseil', poste: 'Directeur financier', departement: 'Finance', mandat: 'Modèle financier.', est_directeur: true },
  { modele: 'conseil', poste: 'Analyste financier', departement: 'Finance', mandat: 'Construit les modèles.' },
  { modele: 'conseil', poste: 'Contrôleur de gestion', departement: 'Finance', mandat: 'Suit le budget.' },
  { modele: 'conseil', poste: 'Poste inconnu', departement: 'Finance', mandat: 'Rien.' },
];

describe('postesEn', () => {
  it('traduit poste, département et mandat, et garde le français à côté', () => {
    const p = traduirePoste(POSTES[0], TABLE);
    expect(p.poste).toBe('Chief Financial Officer');
    expect(p.poste_fr).toBe('Directeur financier');
    expect(p.mandat).toBe('Financial model, treasury, fundraising, unit economics.');
    expect(p.est_directeur).toBe(true);
  });
  it('laisse tel quel un poste que la table ne connaît pas, ou sans table', () => {
    expect(traduirePoste(POSTES[3], TABLE)).toBe(POSTES[3]);
    expect(traduirePoste(POSTES[0], null)).toBe(POSTES[0]);
    expect(traduirePostes(POSTES, null)).toBe(POSTES);
  });
  it('donne un seul libellé anglais par département (le plus fréquent)', () => {
    const l = traduirePostes(POSTES, TABLE);
    expect(l.map((p) => p.departement)).toEqual(['Finance', 'Finance', 'Finance', 'Finance']);
    expect(l[1].poste).toBe('Financial Analyst');
  });
  it('sait quand l’écran est en anglais', () => {
    expect(enAnglais('en')).toBe(true); expect(enAnglais('en-GB')).toBe(true); expect(enAnglais('fr')).toBe(false); expect(enAnglais(undefined)).toBe(false);
  });
});
