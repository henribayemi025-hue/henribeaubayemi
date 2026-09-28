// Le prix suggéré par l'IA arrive du serveur en FCFA (l'unité de stockage,
// médiane du catalogue). Les écrans de saisie, eux, sont libellés dans la
// devise de la boutique et repassent par `toFcfa` à l'enregistrement.
//
// L'écran « créer un article » convertissait déjà ; l'écran « dépôt en masse »
// l'avait oublié, et écrivait la médiane brute dans une case marquée EUR. Une
// vendeuse en euros voyait « 15000 » et enregistrait 15 000 € — 655 fois le
// prix voulu, sur autant d'articles qu'elle en déposait d'un coup.
//
// Ce test fige l'aller-retour : ce qu'on affiche, une fois réenregistré, doit
// retomber sur le montant de départ.
import { describe, it, expect } from 'vitest';
import { convertFromFcfa, toFcfa } from './currency';

const MEDIANE_FCFA = 15000;

describe('prix suggéré par l’IA', () => {
  it('revient au même montant après un aller-retour, dans toutes les devises', () => {
    for (const devise of ['FCFA', 'EUR', 'CAD', 'GBP', 'USD']) {
      const affiche = Math.round(convertFromFcfa(MEDIANE_FCFA, devise));
      const enregistre = toFcfa(affiche, devise);
      // Tolérance : l'arrondi à l'unité de la devise peut décaler le FCFA.
      // Un écart de quelques pour cent est normal ; un facteur 655 ne l'est pas.
      expect(Math.abs(enregistre - MEDIANE_FCFA) / MEDIANE_FCFA).toBeLessThan(0.05);
    }
  });

  it('montre bien l’ampleur du défaut qu’on vient de corriger', () => {
    // Sans conversion, la médiane brute lue comme des euros.
    const sansConversion = toFcfa(MEDIANE_FCFA, 'EUR');
    expect(sansConversion / MEDIANE_FCFA).toBeGreaterThan(600);
  });
});
