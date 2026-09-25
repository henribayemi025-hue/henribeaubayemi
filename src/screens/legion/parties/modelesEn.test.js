// Les modèles et le mot d'accueil en anglais.
import { describe, it, expect } from 'vitest';
import { modeleTraduit, accueilEnAnglais } from './modelesEn';

describe('Léo en anglais', () => {
  it('traduit un modèle connu, laisse les autres', () => {
    expect(modeleTraduit({ cle: 'marche', nom: 'Salle de marché' }, 'en').nom).toBe('Trading floor');
    expect(modeleTraduit({ cle: 'marche', nom: 'Salle de marché' }, 'fr').nom).toBe('Salle de marché');
    expect(modeleTraduit({ cle: 'inconnu', nom: 'Mon secteur' }, 'en').nom).toBe('Mon secteur');
  });
  it('remet le mot d\'accueil du directeur en anglais', () => {
    expect(accueilEnAnglais('Bonjour. Je suis Karim Moreau, directeur produit. L\'équipe est en place — 25 personnes en service, 25 métiers. Dis-nous en une phrase ce que tu veux obtenir cette semaine, et on se répartit le travail.'))
      .toBe('Hello. I\'m Karim Moreau, directeur produit. The team is in place — 25 people on duty, 25 roles. Tell us in one sentence what you want to achieve this week, and we\'ll split the work.');
    expect(accueilEnAnglais('Bonjour. Je suis A, b. L\'équipe est en place — 3 personnes en service, 2 métiers, et 4 postes encore à pourvoir. Dis-nous…')).toContain('and 4 positions still open');
    expect(accueilEnAnglais('Autre chose')).toBeNull();
  });
});
