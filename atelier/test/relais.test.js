// @vitest-environment node
// Le relais Supabase des modèles (24/09) : une clé absente du Worker passe
// par la fonction atelier-modele avec le jeton de la personne ; une clé
// présente reste prioritaire (appel direct) ; un jeton expiré donne un
// message clair au lieu d'un plantage.
import { describe, it, expect } from 'vitest';
import { appeler, modelesRelais, disponibles, cleDe, ordre, MESSAGE_JETON, jetonExpire } from '../src/moteur.js';
import { envoyer } from '../src/boucle.js';
import { fauxFichiers, fauxBac, fausseDeps, fauxEtat } from './faux.js';
// La traduction Claude ⇄ OpenAI vit dans la fonction edge ; elle n'a aucune
// dépendance Deno, on l'essaie donc ici.
import { versAnthropic, depuisAnthropic } from '../../supabase/functions/atelier-modele/anthropic.ts';

const SUPA = { SUPABASE_URL: 'https://exemple.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_test' };
const RELAIS = 'https://exemple.supabase.co/functions/v1/atelier-modele';
// Un jeton différent à chaque fois (n) : le cache du relais est rangé par jeton.
const jwt = (expSecondes) => `e30.${Buffer.from(JSON.stringify({ sub: 'u1', exp: expSecondes, n: Math.random() })).toString('base64url')}.signature`;
const valide = () => jwt(Math.floor(Date.now() / 1000) + 3600);
const expire = () => jwt(Math.floor(Date.now() / 1000) - 60);

const reponseModele = (texte = 'ok') => ({
  choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: texte } }],
  usage: { prompt_tokens: 100, completion_tokens: 10, total_tokens: 110 },
});

function fauxFetch(repondre) {
  const appels = [];
  const fetchFn = async (url, init = {}) => {
    const corps = init.body ? JSON.parse(init.body) : null;
    appels.push({ url, headers: init.headers || {}, corps });
    return repondre(url, corps, appels.length);
  };
  return { fetchFn, appels };
}

const messages = [{ role: 'user', content: 'Bonjour' }];

describe('le relais Supabase, appel par appel', () => {
  it('clé absente du Worker → la requête part au relais, avec le jeton et sans clé', async () => {
    const jeton = valide();
    const f = fauxFetch(() => Response.json(reponseModele('par le relais'), { headers: { 'x-atelier-relais': 'fournisseur' } }));
    const r = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: SUPA, fetchFn: f.fetchFn, jeton });
    expect(r.message.content).toBe('par le relais');
    expect(r.usage.prompt_tokens).toBe(100);
    expect(f.appels).toHaveLength(1);
    const a = f.appels[0];
    expect(a.url).toBe(RELAIS);
    expect(a.headers.Authorization).toBe(`Bearer ${jeton}`);
    expect(a.headers.apikey).toBe('sb_publishable_test');
    expect(a.corps).toMatchObject({ action: 'appel', modele: 'ds:deepseek-flash' });
    // Le corps est celui qu'aurait reçu DeepSeek en direct.
    expect(a.corps.corps).toMatchObject({ model: 'deepseek-flash', max_tokens: 8000, thinking: { type: 'disabled' } });
    expect(a.corps.corps.messages).toEqual(messages);
  });

  it('clé présente dans le Worker → appel direct, le relais n\'est pas touché', async () => {
    const f = fauxFetch(() => Response.json(reponseModele('en direct')));
    const r = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: { ...SUPA, DEEPSEEK_API_KEY: 'cle-worker' }, fetchFn: f.fetchFn, jeton: valide() });
    expect(r.message.content).toBe('en direct');
    expect(f.appels.map((x) => x.url)).toEqual(['https://api.deepseek.com/chat/completions']);
    expect(f.appels[0].headers.Authorization).toBe('Bearer cle-worker');
  });

  it('jeton expiré → message clair « reconnecte-toi », sans appel réseau', async () => {
    const f = fauxFetch(() => { throw new Error('ne doit pas être appelé'); });
    const e = await appeler({ modele: 'km:kimi-k2.6', messages, outils: [], env: SUPA, fetchFn: f.fetchFn, jeton: expire() }).catch((x) => x);
    expect(e.code).toBe('jeton');
    expect(e.message).toBe(MESSAGE_JETON);
    expect(e.message).toMatch(/reconnecte-toi/);
    expect(f.appels).toHaveLength(0);
    expect(jetonExpire(expire())).toBe(true);
    expect(jetonExpire(valide())).toBe(false);
    expect(jetonExpire('pas-un-jwt')).toBe(false); // illisible : Supabase jugera
  });

  it('jeton refusé par Supabase (401 de la passerelle) → le même message clair', async () => {
    const f = fauxFetch(() => new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), { status: 401 }));
    const e = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: SUPA, fetchFn: f.fetchFn, jeton: valide() }).catch((x) => x);
    expect(e.code).toBe('jeton');
    expect(e.message).toBe(MESSAGE_JETON);
  });

  it('une erreur du FOURNISSEUR passe telle quelle et se lit comme en direct', async () => {
    const f = fauxFetch(() => new Response('{"error":{"message":"Insufficient Balance"}}', { status: 402, headers: { 'x-atelier-relais': 'fournisseur' } }));
    const e = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: SUPA, fetchFn: f.fetchFn, jeton: valide() }).catch((x) => x);
    expect(e.code).toBe('solde');
    // Un 401 du fournisseur (clé refusée chez lui) n'est PAS un jeton expiré.
    const g = fauxFetch(() => new Response('{"error":"bad key"}', { status: 401, headers: { 'x-atelier-relais': 'fournisseur' } }));
    const e2 = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: SUPA, fetchFn: g.fetchFn, jeton: valide() }).catch((x) => x);
    expect(e2.code).toBe('http');
  });

  it('le plafond du jour du relais remonte avec son message', async () => {
    const f = fauxFetch(() => new Response(JSON.stringify({ erreur: 'Plafond du jour de l\'atelier atteint (10.00 $ sur 10 $) : reprends demain.', code: 'plafond_jour' }), { status: 429, headers: { 'x-atelier-relais': 'refus' } }));
    const e = await appeler({ modele: 'ds:deepseek-flash', messages, outils: [], env: SUPA, fetchFn: f.fetchFn, jeton: valide() }).catch((x) => x);
    expect(e.code).toBe('plafond_jour');
    expect(e.message).toMatch(/reprends demain/);
  });
});

describe('la liste des modèles', () => {
  it('le relais ajoute ses modèles (connus seulement), gardés en cache', async () => {
    const jeton = valide();
    const f = fauxFetch(() => Response.json({ modeles: ['ds:deepseek-flash', 'km:kimi-k2.6', 'an:claude-sonnet-5', 'xx:inconnu'] }));
    const liste = await modelesRelais(SUPA, jeton, f.fetchFn);
    expect(liste).toEqual(['ds:deepseek-flash', 'km:kimi-k2.6', 'an:claude-sonnet-5']);
    expect(await modelesRelais(SUPA, jeton, f.fetchFn)).toEqual(liste);
    expect(f.appels).toHaveLength(1);
    expect(f.appels[0].corps).toEqual({ action: 'modeles' });
    expect(disponibles(SUPA)).toEqual([]);
    expect(disponibles(SUPA, { relais: liste })).toEqual(['ds:deepseek-flash', 'km:kimi-k2.6', 'an:claude-sonnet-5']);
    expect(disponibles({ ...SUPA, GEMINI_API_KEY: 'g' }, { relais: liste, geminiCoupe: true })).toEqual(['ds:deepseek-flash', 'km:kimi-k2.6', 'an:claude-sonnet-5']);
    // Auto commence par le plus fort (25/09) ; ici le relais n'a que Kimi et DeepSeek Flash.
    expect(ordre(SUPA, 'auto', { relais: liste })).toEqual(['km:kimi-k2.6', 'ds:deepseek-flash']);
  });

  it('relais en panne ou jeton expiré → liste vide, sans planter', async () => {
    const f = fauxFetch(() => new Response('boum', { status: 500 }));
    expect(await modelesRelais(SUPA, valide(), f.fetchFn)).toEqual([]);
    const g = fauxFetch(() => { throw new Error('réseau'); });
    expect(await modelesRelais(SUPA, valide(), g.fetchFn)).toEqual([]);
    const h = fauxFetch(() => Response.json({ modeles: ['ds:deepseek-flash'] }));
    expect(await modelesRelais(SUPA, expire(), h.fetchFn)).toEqual([]);
    expect(await modelesRelais({}, valide(), h.fetchFn)).toEqual([]);
    expect(h.appels).toHaveLength(0);
  });

  it('Claude ne s\'appelle jamais en direct, même si sa clé est dans le Worker', () => {
    expect(cleDe({ ANTHROPIC_API_KEY: 'sk-ant-x' }, 'an:claude-sonnet-5')).toBeNull();
    expect(disponibles({ ANTHROPIC_API_KEY: 'sk-ant-x' })).toEqual([]);
  });
});

describe('la boucle avec le relais', () => {
  function monter(repondre, { jeton, relais = ['ds:deepseek-flash', 'km:kimi-k2.6'], env = SUPA } = {}) {
    const fichiers = fauxFichiers({ 'index.js': 'x' });
    const f = fauxFetch(repondre);
    const journal = [];
    const deps = fausseDeps({ fichiers, bac: fauxBac(fichiers), fetchFn: f.fetchFn, env, journal, jeton, relais });
    return { f, journal, deps, etat: fauxEtat() };
  }

  it('sans clé dans le Worker, la boucle répond par le relais et compte le coût', async () => {
    const m = monter(() => Response.json(reponseModele('Fait.')), { jeton: valide() });
    await envoyer(m.etat, m.deps, 'bonjour');
    expect(m.etat.session.statut).toBe('pret');
    expect(m.f.appels[0].url).toBe(RELAIS);
    expect(m.etat.session.coutModele).toBeGreaterThan(0);
    expect(m.etat.affichage.at(-1).texte).toBe('Fait.');
  });

  it('jeton expiré avant l\'appel → arrêt propre, message clair, aucun appel', async () => {
    const m = monter(() => { throw new Error('ne doit pas être appelé'); }, { jeton: expire() });
    await envoyer(m.etat, m.deps, 'bonjour');
    expect(m.etat.session.statut).toBe('erreur');
    expect(m.etat.session.raison).toBe(MESSAGE_JETON);
    expect(m.f.appels).toHaveLength(0);
    // Un seul essai : les autres modèles du relais ne sont pas tentés pour rien.
    expect(m.journal.filter((j) => j.outil === 'modele' && j.decision === 'erreur')).toHaveLength(1);
  });

  it('jeton expiré EN COURS de travail (401 du relais) → même message, pas de plantage', async () => {
    const m = monter(() => new Response('{"message":"Invalid JWT"}', { status: 401 }), { jeton: valide() });
    await envoyer(m.etat, m.deps, 'bonjour');
    expect(m.etat.session.statut).toBe('erreur');
    expect(m.etat.session.raison).toMatch(/reconnecte-toi/);
    expect(m.f.appels).toHaveLength(1);
  });

  it('jeton refusé mais une clé du Worker existe → le modèle direct prend la relève', async () => {
    // Le relais propose un modèle plus fort que Kimi (essayé d'abord), puis Kimi, dont le Worker a la clé.
    const m = monter((url) => (url === RELAIS ? new Response('{}', { status: 401 }) : Response.json(reponseModele('direct'))), {
      jeton: valide(),
      env: { ...SUPA, KIMI_API_KEY: 'k' },
      relais: ['ds:deepseek-v4-pro', 'km:kimi-k2.6'],
    });
    await envoyer(m.etat, m.deps, 'bonjour');
    expect(m.etat.session.statut).toBe('pret');
    expect(m.f.appels.map((a) => a.url)).toEqual([RELAIS, 'https://api.moonshot.ai/v1/chat/completions']);
  });
});

describe('la traduction Claude (fonction atelier-modele)', () => {
  it('OpenAI → Anthropic : consigne, outils, appels et résultats d\'outils', () => {
    const corps = {
      max_tokens: 8000,
      temperature: 0.3,
      tool_choice: 'auto',
      tools: [{ type: 'function', function: { name: 'lire_fichier', description: 'Lit', parameters: { type: 'object', properties: { chemin: { type: 'string' } } } } }],
      messages: [
        { role: 'system', content: 'Tu es le Codeur.' },
        { role: 'user', content: 'Lis index.js et package.json' },
        { role: 'assistant', content: '', tool_calls: [
          { id: 'a1', type: 'function', function: { name: 'lire_fichier', arguments: '{"chemin":"index.js"}' } },
          { id: 'a2', type: 'function', function: { name: 'lire_fichier', arguments: '{"chemin":"package.json"}' } },
        ] },
        { role: 'tool', tool_call_id: 'a1', content: 'x' },
        { role: 'tool', tool_call_id: 'a2', content: '{}' },
      ],
    };
    const a = versAnthropic(corps, 'claude-sonnet-5');
    expect(a.model).toBe('claude-sonnet-5');
    expect(a.system).toBe('Tu es le Codeur.');
    expect(a.max_tokens).toBe(8000);
    expect(a.tools).toEqual([{ name: 'lire_fichier', description: 'Lit', input_schema: corps.tools[0].function.parameters }]);
    expect(a.tool_choice).toEqual({ type: 'auto' });
    expect(a.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(a.messages[1].content).toEqual([
      { type: 'tool_use', id: 'a1', name: 'lire_fichier', input: { chemin: 'index.js' } },
      { type: 'tool_use', id: 'a2', name: 'lire_fichier', input: { chemin: 'package.json' } },
    ]);
    // Les deux résultats dans le MÊME message user, comme Anthropic l'exige.
    expect(a.messages[2].content.map((b) => b.tool_use_id)).toEqual(['a1', 'a2']);
  });

  it('Anthropic → OpenAI : texte, appels d\'outils, fin et jetons', () => {
    const o = depuisAnthropic({
      id: 'msg_1', model: 'claude-sonnet-5', stop_reason: 'tool_use',
      content: [{ type: 'text', text: 'Je lis.' }, { type: 'tool_use', id: 't1', name: 'lire_fichier', input: { chemin: 'a.js' } }],
      usage: { input_tokens: 900, cache_read_input_tokens: 100, output_tokens: 50 },
    });
    const c = o.choices[0];
    expect(c.finish_reason).toBe('tool_calls');
    expect(c.message.content).toBe('Je lis.');
    expect(c.message.tool_calls).toEqual([{ id: 't1', type: 'function', function: { name: 'lire_fichier', arguments: '{"chemin":"a.js"}' } }]);
    expect(o.usage).toEqual({ prompt_tokens: 1000, completion_tokens: 50, total_tokens: 1050, prompt_tokens_details: { cached_tokens: 100 } });
  });
});

describe('OpenAI avec des outils (25/09)', () => {
  it('GPT-6 reçoit reasoning_effort « none » quand il a des outils, sinon HTTP 400 à chaque appel', async () => {
    const f = fauxFetch(() => Response.json(reponseModele('ok')));
    await appeler({ modele: 'oa:gpt-6-sol', messages, outils: [{ type: 'function', function: { name: 'lister', parameters: { type: 'object', properties: {} } } }], env: { OPENAI_API_KEY: 'sk-x' }, maxSortie: 100, fetchFn: f.fetchFn });
    expect(f.appels[0].corps.reasoning_effort).toBe('none');
    expect(f.appels[0].corps.max_completion_tokens).toBe(100);
    const g = fauxFetch(() => Response.json(reponseModele('ok')));
    await appeler({ modele: 'oa:gpt-6-sol', messages, outils: [], env: { OPENAI_API_KEY: 'sk-x' }, maxSortie: 100, fetchFn: g.fetchFn });
    expect(g.appels[0].corps.reasoning_effort).toBeUndefined();
  });
});
