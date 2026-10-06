// Finia d'Accounting sur l'IA gratuite : seul un petit texte passe, pour que
// la part « finia » (2 000 neurones par jour) serve à toutes les commerçantes.
import { describe, it, expect } from 'vitest';
import { corpsFinia, ENTREE_FINIA, SORTIE_FINIA } from './finia-gratuit';

const corps = (b) => {
  const r = corpsFinia(b);
  if ('erreur' in r) throw new Error(r.erreur);
  return r.corps;
};

describe('corpsFinia', () => {
  it('texte seulement, rôles connus', () => {
    expect('erreur' in corpsFinia({})).toBe(true);
    expect('erreur' in corpsFinia({ messages: [{ role: 'tool', content: 'x' }] })).toBe(true);
    expect('erreur' in corpsFinia({ messages: [{ role: 'user', content: [{ type: 'image_url' }] }] })).toBe(true);
  });

  it('réponse bornée ; outils et modèle demandés ignorés', () => {
    const c = corps({ model: 'gpt-5', tools: [{}], max_tokens: 99999, messages: [{ role: 'user', content: 'Bonjour' }] });
    expect(c.max_tokens).toBe(SORTIE_FINIA);
    expect(Object.keys(c).sort()).toEqual(['max_tokens', 'messages']);
  });

  it('conversation trop longue : la consigne reste, les anciens messages tombent', () => {
    const long = 'a'.repeat(4000);
    const c = corps({ messages: [
      { role: 'system', content: 'Tu es Finia.' },
      ...Array.from({ length: 6 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: long + i })),
    ] });
    expect(c.messages[0].content).toBe('Tu es Finia.');
    expect(c.messages.at(-1).content.endsWith('5')).toBe(true);
    expect(c.messages.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(ENTREE_FINIA);
  });

  it('un seul message énorme est coupé, pas refusé', () => {
    expect(corps({ messages: [{ role: 'user', content: 'b'.repeat(50_000) }] }).messages[0].content.length).toBe(ENTREE_FINIA);
  });
});
