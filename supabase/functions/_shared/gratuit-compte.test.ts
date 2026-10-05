// L'IA gratuite : le compte des neurones doit réserver large, jamais court —
// c'est lui qui empêche Cloudflare de facturer (gratuit.ts).
import { describe, it, expect } from 'vitest';
import { jetonsEstimes, neurones, NEURONES, SORTIE_MAX } from './gratuit-compte';

describe('neurones', () => {
  it('suit les prix publiés de gemma-4, arrondis au-dessus', () => {
    expect(neurones('gemma-4', 1_000_000, 0)).toBe(9091);
    expect(neurones('gemma-4', 0, 1_000_000)).toBe(27273);
    expect(neurones('gemma-4', 1, 1)).toBe(1);
  });

  it('ne laisse jamais passer un modèle inconnu', () => {
    expect(neurones('kimi-k2.6', 10, 10)).toBe(Infinity);
  });

  it('le pire appel permis par le Worker tient sous le plafond du jour (8 000)', () => {
    for (const alias of Object.keys(NEURONES)) {
      expect(neurones(alias, 200_000 / 2.5, SORTIE_MAX)).toBeLessThan(8000);
    }
  });
});

describe('jetonsEstimes', () => {
  it('compte plus large que la réalité du français (≈ 4 signes par jeton)', () => {
    const texte = 'Bonjour, voici la tâche du jour pour l’équipe commerciale. '.repeat(100);
    expect(jetonsEstimes({ messages: [{ role: 'user', content: texte }] })).toBeGreaterThan(texte.length / 3);
  });
});

import { reparerJson, adapterAuSchema, champsManquants } from './gratuit-compte';

describe('reparerJson', () => {
  it('lit un JSON propre', () => {
    expect(reparerJson('{"texte":"ok"}')).toEqual({ texte: 'ok' });
  });
  it('enlève les balises et le texte autour', () => {
    expect(reparerJson('Voici :\n```json\n{"texte":"ok"}\n```\nBonne journée')).toEqual({ texte: 'ok' });
  });
  it('accepte de vrais retours à la ligne dans un texte', () => {
    expect(reparerJson('{"texte":"Fait : une ligne\nJe propose : une autre"}')).toEqual({ texte: 'Fait : une ligne\nJe propose : une autre' });
  });
  it('enlève une virgule en trop', () => {
    expect(reparerJson('{"a":[1,2,],"b":"x",}')).toEqual({ a: [1, 2], b: 'x' });
  });
  it('rend null pour un JSON vraiment cassé', () => {
    expect(reparerJson('{"texte": "coupé au mil')).toBeNull();
  });
});

describe('adapterAuSchema / champsManquants', () => {
  const schema = { type: 'OBJECT', properties: { texte: { type: 'STRING' }, genre: { type: 'STRING' } }, required: ['genre'] };
  it('reprend « text » ou « réponse » comme texte', () => {
    expect(adapterAuSchema({ text: 'Salut', genre: 'info' }, schema)).toEqual({ texte: 'Salut', genre: 'info' });
    expect((adapterAuSchema({ 'réponse': 'Oui', genre: 'info' }, schema) as { texte: string }).texte).toBe('Oui');
  });
  it('retire un emballage d\'un seul objet', () => {
    expect(adapterAuSchema({ reponse: { texte: 'A', genre: 'info' } }, schema)).toEqual({ texte: 'A', genre: 'info' });
  });
  it('laisse une réponse déjà conforme telle quelle', () => {
    expect(adapterAuSchema({ texte: 'A', genre: 'info' }, schema)).toEqual({ texte: 'A', genre: 'info' });
  });
  it('signale le texte vide même s\'il n\'est pas exigé', () => {
    expect(champsManquants({ texte: '  ', genre: 'info' }, schema)).toEqual(['texte']);
    expect(champsManquants({ texte: 'ok', genre: 'info' }, schema)).toEqual([]);
  });
});
