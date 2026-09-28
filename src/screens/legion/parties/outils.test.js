// Chaque salon a son icône, reconnue à son nom.
import { describe, it, expect } from 'vitest';
import { IconHash, IconCrown, IconPalette, IconBriefcase, IconCash, IconCode, IconChartCandle } from '@tabler/icons-react';
import { iconeDept, raisonLisible } from './outils';

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

// Beau, 28/09 (B6) : l'écran accusait Google d'être saturé alors que TOUS les
// moteurs payants étaient à court de crédit. Les deux cas partagent 429 et
// RESOURCE_EXHAUSTED — mais l'un se règle en attendant une minute et l'autre
// pas du tout. On verrouille la distinction ici pour ne plus la reperdre.
describe('pourquoi personne n\'a répondu', () => {
  const t = (cle, defaut) => defaut;

  it('dit « plus de crédit » quand le compte est vide, même avec un 429', () => {
    for (const brut of [
      'RESOURCE_EXHAUSTED: You exceeded your current quota',
      'Error 429: insufficient_quota',
      'Your credit balance is too low to access the API',
      'HTTP 402 Payment Required',
      'Insufficient Balance',
    ]) {
      expect(raisonLisible(brut, t)).toMatch(/plus de crédit/);
    }
  });

  it('ne garde « saturé » que pour une vraie surcharge, et ne nomme plus Google', () => {
    const r = raisonLisible('503 Service Unavailable: model is overloaded', t);
    expect(r).toMatch(/saturé/);
    expect(r).not.toMatch(/Google/);
  });

  it('laisse passer le plafond mensuel, qui a sa propre explication', () => {
    expect(raisonLisible('spending cap reached', t)).toMatch(/budget/);
  });
});
