import { describe, it, expect } from 'vitest';
import { aPrixManquant, lirePrix } from './ArticlesSansPrix';

describe('carte « Articles sans prix »', () => {
  const base = { is_active: true, price_on_request: true, category: 'mode' };
  it('ne montre que les articles en ligne « sur demande » pas encore confirmés', () => {
    expect(aPrixManquant(base)).toBe(true);
    expect(aPrixManquant({ ...base, price_on_request: false })).toBe(false); // déjà un prix (cas 1)
    expect(aPrixManquant({ ...base, sur_demande_voulu_le: '2026-09-25' })).toBe(false); // gardé exprès (cas 2)
    expect(aPrixManquant({ ...base, is_active: false })).toBe(false); // brouillon (cas 10)
    expect(aPrixManquant({ ...base, moderation_hidden_at: '2026-09-20' })).toBe(false); // modération (cas 9)
  });
  it('refuse une saisie invalide, accepte la virgule (cas 5)', () => {
    expect(lirePrix('7 500')).toBe(7500);
    expect(lirePrix('12,5')).toBe(12.5);
    for (const x of ['', 'abc', '-3', '0', 'NaN', null]) expect(lirePrix(x)).toBeNull();
  });
});
