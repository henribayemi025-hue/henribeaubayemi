// La Finia commune (0202) : ce qui déclenche l'apprentissage, et le nettoyage
// des propositions de savoir. Le module vit avec les fonctions edge
// (supabase/functions/_shared/apprentissage.ts) ; il est pur, donc testable ici.
import { describe, expect, it } from 'vitest';
import { contientDonneePerso, estCorrection, estSansReponse, nettoyer, nombres } from '../../supabase/functions/_shared/apprentissage.ts';

describe('estSansReponse', () => {
  it('reconnaît un aveu franc, en français et en anglais', () => {
    expect(estSansReponse("Je ne sais pas si la livraison est possible le dimanche.")).toBe(true);
    expect(estSansReponse("Je n'ai pas cette information pour le moment.")).toBe(true);
    expect(estSansReponse("I don't know the return policy for that shop.")).toBe(true);
  });
  it("ne prend pas une réponse normale, ni un rayon vide", () => {
    expect(estSansReponse('Voici trois robes à moins de 20 €.')).toBe(false);
    expect(estSansReponse("Je ne trouve pas d'article pour ça, veux-tu que je cherche autre chose ?")).toBe(false);
  });
});

describe('estCorrection', () => {
  it('reconnaît une correction', () => {
    expect(estCorrection("non, ce n'est pas ça")).toBe(true);
    expect(estCorrection("c'est faux, la boutique est ouverte")).toBe(true);
    expect(estCorrection('tu te trompes')).toBe(true);
    expect(estCorrection("that's wrong")).toBe(true);
  });
  it('ne prend pas un simple « non » de conversation', () => {
    expect(estCorrection('non merci, ça ira')).toBe(false);
    expect(estCorrection('une robe rouge')).toBe(false);
  });
});

describe('nettoyer', () => {
  it('masque e-mail, téléphone, adresse, nom et numéro de commande', () => {
    const t = nettoyer("Je m'appelle Awa, mail awa.k@gmail.com, tél +237 6 99 12 34 56, commande n° A1B2C3, au 12 rue des Palmiers, Mme Dupont");
    expect(t).not.toMatch(/Awa|gmail|99 12|A1B2C3|Palmiers|Dupont/);
    expect(t).toMatch(/\[e-mail\]/);
    expect(t).toMatch(/\[téléphone\]/);
    expect(t).toMatch(/\[numéro de commande\]/);
  });
  it('garde un prix ordinaire', () => {
    expect(nettoyer('une robe à 1 500 000 FCFA ou 45 €')).toBe('une robe à 1 500 000 FCFA ou 45 €');
  });
  it('signale ce qui contient encore une donnée personnelle', () => {
    expect(contientDonneePerso('Écris à contact@exemple.com')).toBe(true);
    expect(contientDonneePerso('Quand on demande la livraison, dire les options de la boutique.')).toBe(false);
  });
});

describe('nombres', () => {
  it('lit les nombres, séparateurs retirés', () => {
    expect(nombres('7 jours, 1 500 FCFA, 20 %')).toEqual(['7', '1500', '20']);
  });
});
