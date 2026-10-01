import { describe, it, expect } from 'vitest';
import { questionsPour, messageQuestion } from './questionsFiche';

const t = (cle, opts) => {
  if (typeof opts === 'string') return opts;
  return (opts?.defaultValue || cle).replace(/\{\{(\w+)\}\}/g, (_, k) => opts[k] ?? '');
};

describe('questions toutes prêtes', () => {
  it('demande le prix pour un article sur devis, la livraison sinon', () => {
    expect(questionsPour({ price_on_request: true }).map((q) => q.cle)).toEqual(['dispo', 'prix', 'variantes']);
    expect(questionsPour({ price_on_request: false }).map((q) => q.cle)).toEqual(['dispo', 'livraison', 'variantes']);
  });

  it('écrit l’article, la variante, la question et le lien', () => {
    const [dispo] = questionsPour({});
    const m = messageQuestion(t, { question: dispo, product: { name: 'Robe wax' }, size: 'M', color: 'Rouge', url: 'https://finjaro.net/product/1' });
    expect(m).toBe('Bonjour, je vous écris depuis Finjaro au sujet de « Robe wax » (M · Rouge). Est-il encore disponible ?\nhttps://finjaro.net/product/1');
  });

  it('sans variante, pas de parenthèses vides', () => {
    const [dispo] = questionsPour({});
    expect(messageQuestion(t, { question: dispo, product: { name: 'Sac' }, url: 'u' })).not.toContain('()');
  });
});
