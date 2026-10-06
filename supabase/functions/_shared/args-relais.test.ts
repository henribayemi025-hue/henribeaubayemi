import { describe, it, expect } from 'vitest';
import { argsPourOutil, lireParametres, exempleParametres } from './args-relais.ts';

describe('paramètres rendus par le moteur de secours', () => {
  it('lit un JSON propre, entouré de texte, ou vide', () => {
    expect(lireParametres('{"requete":"salon Douala"}')).toEqual({ requete: 'salon Douala' });
    expect(lireParametres('Voici : {"url":"https://a.org"} merci')).toEqual({ url: 'https://a.org' });
    expect(lireParametres('')).toEqual({});
    expect(lireParametres('pas du json')).toEqual({});
  });

  it('ramène les autres noms vers celui que l\'outil attend', () => {
    expect(argsPourOutil('{"query":"bijoux Abidjan"}', ['requete'])).toMatchObject({ requete: 'bijoux Abidjan' });
    expect(argsPourOutil('{"lien":"https://cinetpay.com"}', ['url', 'a_partir_de'])).toMatchObject({ url: 'https://cinetpay.com' });
    expect(argsPourOutil('{"requete":{"value":"coiffure Paris"}}', ['requete'])).toMatchObject({ requete: 'coiffure Paris' });
    expect(argsPourOutil('{"mot_cle":"tarifs CinetPay"}', ['requete'])).toMatchObject({ requete: 'tarifs CinetPay' });
  });

  it('ne remplace pas une valeur déjà juste', () => {
    expect(argsPourOutil('{"requete":"a b c","query":"autre"}', ['requete']).requete).toBe('a b c');
  });

  it('donne un exemple avec les vrais noms', () => {
    expect(exempleParametres({ requete: { type: 'STRING' } }, ['requete'])).toContain('"requete"');
    expect(exempleParametres({ url: { type: 'STRING' }, a_partir_de: { type: 'INTEGER' } }, ['url'])).toBe('{"url":"https://exemple.org/page"}');
  });
});
