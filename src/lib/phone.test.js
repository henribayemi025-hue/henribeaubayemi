import { describe, it, expect } from 'vitest';
import { whatsappNumber, whatsappLink } from './phone';

// Le 28/09, en préparant une relance à la main, le bouton WhatsApp de la
// Console pointait sur `wa.me/691024291` pour une boutique de Yaoundé: un
// lien mort, l'indicatif manquait. Ces cas-là ne doivent plus repasser.
describe('whatsappNumber', () => {
  it('ajoute l’indicatif du pays de la boutique quand le numéro est local', () => {
    expect(whatsappNumber('691024291', 'CM')).toBe('237691024291');
  });

  it('respecte un numéro déjà international', () => {
    expect(whatsappNumber('+49 177 651 2211', 'CM')).toBe('491776512211');
  });

  it('ne double pas un indicatif déjà saisi', () => {
    expect(whatsappNumber('237691024291', 'CM')).toBe('237691024291');
  });

  it('retire le zéro de tête des formats locaux', () => {
    expect(whatsappNumber('0612345678', 'FR')).toBe('33612345678');
  });

  it('traite le 00 comme un +', () => {
    expect(whatsappNumber('0033612345678', 'FR')).toBe('33612345678');
  });

  // Un mobile camerounais « 61… » commence par l'indicatif australien. Le pays
  // de la boutique doit primer, sinon le message part à l'autre bout du monde.
  it('fait primer le pays de la boutique sur ce que le numéro semble dire', () => {
    expect(whatsappNumber('612345678', 'CM')).toBe('237612345678');
  });

  it('n’invente pas d’indicatif quand le pays est inconnu', () => {
    expect(whatsappNumber('691024291', null)).toBeNull();
    expect(whatsappNumber('691024291', 'ZZ')).toBeNull();
  });

  it('accepte un numéro international même sans pays connu', () => {
    expect(whatsappNumber('+237691024291', null)).toBe('237691024291');
  });

  it('rend null sur un numéro vide', () => {
    expect(whatsappNumber('', 'CM')).toBeNull();
    expect(whatsappNumber(null, 'CM')).toBeNull();
  });
});

describe('whatsappLink', () => {
  it('écrit le message dans le lien', () => {
    const lien = whatsappLink('691024291', 'CM', 'Bonjour à toi');
    expect(lien).toBe('https://wa.me/237691024291?text=Bonjour%20%C3%A0%20toi');
  });

  it('rend null plutôt qu’un lien mort', () => {
    expect(whatsappLink('691024291', null, 'Bonjour')).toBeNull();
  });
});
