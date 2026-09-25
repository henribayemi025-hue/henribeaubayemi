// Chaque salon a son icône, reconnue à son nom.
import { describe, it, expect } from 'vitest';
import { IconHash, IconCrown, IconPalette, IconBriefcase, IconCash, IconCode, IconChartCandle } from '@tabler/icons-react';
import { iconeDept } from './outils';

describe('icône des salons', () => {
  it('reconnaît les départements des modèles, pas seulement ceux de Finjaro', () => {
    expect(iconeDept('direction-produit', 'Direction & Produit')).toBe(IconCrown);
    expect(iconeDept('design', 'Design & Expérience')).toBe(IconPalette);
    expect(iconeDept('gestion', 'Gestion')).toBe(IconBriefcase);
    expect(iconeDept('credit', 'Crédit')).toBe(IconCash);
    expect(iconeDept('developpement', 'Développement')).toBe(IconCode);
    expect(iconeDept('trading', 'Salle de marché — trading')).toBe(IconChartCandle);
  });
  it('garde le # pour ce qui ne ressemble à rien', () => {
    expect(iconeDept('zzz', 'Xyz')).toBe(IconHash);
    expect(iconeDept('maison', 'Maison')).toBe(IconHash);
  });
});
