// Les liens cités sans avoir été ouverts sont repérés ; les autres passent.
import { describe, it, expect } from 'vitest';
import { liensNonOuverts, cleLien } from './liens';

describe('liensNonOuverts', () => {
  const vus = [
    'lire_page({"url":"https://www.goldenbusinesschallenge.com/candidater/","titre":"GBC"}) → {"texte":"date limite 15 octobre"}',
    'https://jamaafunding.com/appels',
  ];
  it('signale le lien fabriqué jamais ouvert (cas Radar, 08/10)', () => {
    const t = 'Lien : [officiel](https://www.eventbrite.com/e/entrepreneur-networking-abidjan-2026-tickets-123456789).';
    expect(liensNonOuverts(t, vus)).toEqual(['https://www.eventbrite.com/e/entrepreneur-networking-abidjan-2026-tickets-123456789']);
  });
  it('laisse passer une page lue, même écrite sans www ni barre finale', () => {
    expect(liensNonOuverts('Voir https://goldenbusinesschallenge.com/candidater.', vus)).toEqual([]);
  });
  it('admet la page d’accueil d’un site dont une page a été lue', () => {
    expect(liensNonOuverts('https://jamaafunding.com/', vus)).toEqual([]);
  });
  it('ne signale jamais nos propres adresses', () => {
    expect(liensNonOuverts('https://finjaro.net/boutique/x et https://staging-finjaro.finjaro.workers.dev/legion', [])).toEqual([]);
  });
  it('compte chaque lien une fois', () => {
    expect(liensNonOuverts('https://a.org/x https://a.org/x', [])).toHaveLength(1);
  });
  it('normalise l’adresse', () => {
    expect(cleLien('https://WWW.Exemple.org/Page/')).toBe('exemple.org/page');
  });
});
