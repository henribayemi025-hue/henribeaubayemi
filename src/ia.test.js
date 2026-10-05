// L'IA gratuite de Cloudflare (src/ia.js) : jeton exigé, corps borné, forme
// d'OpenAI rendue quel que soit le format du modèle.
import { describe, it, expect, vi } from 'vitest';
import worker from './worker';
import { corpsPourCloudflare, versOpenAI, SORTIE_MAX } from './ia';

const JETON = 'jeton-de-test';
// SHA-256 de « jeton-de-test ».
async function empreinte(t) {
  const o = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)));
  return [...o].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const ctx = { waitUntil: () => {} };
async function appel({ jeton = JETON, corps = { messages: [{ role: 'user', content: 'Bonjour' }] }, ai, methode = 'POST' } = {}) {
  const env = {
    ASSETS: { fetch: vi.fn(async () => new Response('page')) },
    IA_JETON_SHA256: await empreinte(JETON),
    AI: ai ?? { run: vi.fn(async () => ({ response: 'Salut !', usage: { prompt_tokens: 5, completion_tokens: 3 } })) },
  };
  const r = await worker.fetch(new Request('https://finjaro.net/ia/chat/completions', {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    ...(methode === 'POST' ? { body: JSON.stringify(corps) } : {}),
  }), env, ctx);
  return { r, env };
}

describe('/ia/chat/completions', () => {
  it('refuse sans jeton ou avec un mauvais jeton, sans appeler le modèle', async () => {
    for (const jeton of [null, 'faux']) {
      const { r, env } = await appel({ jeton });
      expect(r.status).toBe(401);
      expect(env.AI.run).not.toHaveBeenCalled();
    }
  });

  it('refuse autre chose que POST', async () => {
    const { r } = await appel({ methode: 'GET' });
    expect(r.status).toBe(405);
  });

  it('répond à la manière d\'OpenAI avec le bon jeton', async () => {
    const { r, env } = await appel();
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.choices[0].message.content).toBe('Salut !');
    expect(b.usage.completion_tokens).toBe(3);
    expect(env.AI.run).toHaveBeenCalledWith('@cf/google/gemma-4-26b-a4b-it', expect.objectContaining({ max_tokens: 2048 }));
  });

  it('dit 402 quand Cloudflare annonce la part gratuite épuisée', async () => {
    const ai = { run: vi.fn(async () => { throw new Error('3036: You have used up your daily free allocation of 10,000 neurons'); }) };
    const { r } = await appel({ ai });
    expect(r.status).toBe(402);
  });
});

describe('corpsPourCloudflare', () => {
  it('borne la sortie, écarte les champs des autres fournisseurs et les modèles inconnus', () => {
    const c = corpsPourCloudflare({ model: 'kimi-k2.6', max_tokens: 999_999, thinking: { type: 'disabled' }, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: 'x' }] });
    expect(c.alias).toBe('gemma-4');
    expect(c.entree.max_tokens).toBe(SORTIE_MAX);
    expect(c.entree.thinking).toBeUndefined();
    expect(c.entree.response_format).toBeUndefined();
  });

  it('coupe la réflexion de Gemma 4 (elle comptait dans la sortie et faisait couper les réponses)', () => {
    const c = corpsPourCloudflare({ model: 'gemma-4', messages: [{ role: 'user', content: 'x' }] });
    expect(c.entree.chat_template_kwargs).toEqual({ enable_thinking: false });
  });

  it('refuse une entrée démesurée ou vide', () => {
    expect(corpsPourCloudflare({ messages: [] }).erreur).toBeTruthy();
    expect(corpsPourCloudflare({ messages: [{ role: 'user', content: 'a'.repeat(250_000) }] }).erreur).toBeTruthy();
  });
});

describe('versOpenAI', () => {
  it('traduit les appels d\'outils de l\'ancienne forme', () => {
    const b = versOpenAI({ response: '', tool_calls: [{ name: 'search_products', arguments: { q: 'robe' } }] }, 'gemma-4');
    const appel = b.choices[0].message.tool_calls[0];
    expect(b.choices[0].finish_reason).toBe('tool_calls');
    expect(appel.function.name).toBe('search_products');
    expect(JSON.parse(appel.function.arguments)).toEqual({ q: 'robe' });
  });

  it('laisse passer la forme d\'OpenAI telle quelle', () => {
    const b = versOpenAI({ choices: [{ message: { role: 'assistant', content: 'ok' } }], usage: { prompt_tokens: 1 } }, 'glm-4.7-flash');
    expect(b.choices[0].message.content).toBe('ok');
    expect(b.model).toBe('glm-4.7-flash');
  });
});
