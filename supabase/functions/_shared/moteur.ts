// LE MOTEUR — un seul endroit pour faire écrire un modèle, quel qu'il soit.
//
// Beau, 23/09: « on continue avec Gemini, mais à long terme on utilise
// notre propre IA au lieu de dépendre de Gemini ». Tant que chaque fonction
// appelle Google directement, changer de moteur veut dire tout réécrire. Ici,
// la liste des moteurs essayés dans l'ordre vient d'un RÉGLAGE (le secret
// LEGION_MOTEURS), pas du code: passer à un autre moteur, ou à notre propre
// modèle le jour où il existe, c'est changer ce réglage.
//
// Deux familles:
// - « gemini-… »: l'API de Google, comme avant (coût compté par cout.ts).
// - « oa:<modèle> »: toute API compatible OpenAI — Mistral, un hébergeur de
//   modèles ouverts, ou NOTRE serveur (vLLM, Ollama…) qui fera tourner un
//   Gemma ou un Llama spécialisé. Adresse et clé: MOTEUR_OA_URL et
//   MOTEUR_OA_CLE. Non branché tant que ces secrets n'existent pas.
// - « an:<modèle> » (24/09, idée 130 des 200) : Claude, par l'API
//   d'Anthropic (secret ANTHROPIC_API_KEY). Et le SECOURS : quand tous les
//   modèles de Google ont échoué (saturés, « 503 »), si une clé Anthropic ou
//   une adresse OpenAI est configurée, le moteur essaie encore celui-là au
//   lieu de rendre une erreur. Sans ces secrets, rien ne change.
// - « ds:<modèle> » (24/09, choix de Beau) : DeepSeek, par son API (secret
//   DEEPSEEK_API_KEY, serveurs en Chine — Beau l'accepte). Dès que la clé
//   existe, DeepSeek passe EN PREMIER pour tout ce qui est texte (plans,
//   livrables, réponses, rapports) et Google devient le secours ; sans elle,
//   rien ne change. La voix, les images et la recherche sur Internet restent
//   chez Google : elles ne passent pas par ce moteur.
// - « km:<modèle> » (24/09, Beau : « ils se prennent le relais ») : Kimi, de
//   Moonshot AI (secret KIMI_API_KEY, API compatible OpenAI). Quand sa clé
//   existe, il se place après DeepSeek et avant Google.
//
// Et `garder()`: la trace de ce qui a été demandé et rendu, pour nos
// exemples d'entraînement (0167) — seulement si l'entreprise a dit oui.

import { ajouterCout, gemini, moteurChoisi } from './cout.ts';

export const MOTEURS_PAR_DEFAUT = ['gemini-3.1-pro-preview', 'gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-2.5-flash'];

// DeepSeek d'abord quand sa clé existe (le modèle fort pour les plans et
// livrables, le rapide pour le reste). Les noms suivent leur tarif publié
// (api-docs.deepseek.com, lu le 24/09) : quand ils en changent, on change
// ces deux lignes ou le réglage LEGION_MODELE_DS / LEGION_MODELE_DS_RAPIDE.
const deepseek = () => !!Deno.env.get('DEEPSEEK_API_KEY');
const DS_FORT = () => `ds:${Deno.env.get('LEGION_MODELE_DS') || 'deepseek-v4-pro'}`;
const DS_RAPIDE = () => `ds:${Deno.env.get('LEGION_MODELE_DS_RAPIDE') || 'deepseek-flash'}`;
const kimi = () => !!Deno.env.get('KIMI_API_KEY');
const KIMI = () => `km:${Deno.env.get('LEGION_MODELE_KIMI') || 'kimi-k2.6'}`;
// La relève, dans l'ordre : DeepSeek rapide, puis le fort, puis Kimi, puis
// Google. Le rapide d'abord partout (24/09, premier essai réel) : v4-pro
// réfléchit longtemps et a dépassé les 45 s d'une réponse de salon, puis
// flash a répondu — 75 s en tout. Flash seul répond en 10 à 30 s, et sa
// réponse était la meilleure des deux à l'essai.
const releve = (fort: boolean) => [
  ...(deepseek() ? [DS_RAPIDE()] : []),
  ...(deepseek() && fort ? [DS_FORT()] : []),
  ...(kimi() ? [KIMI()] : []),
];

// Le choix de l'entreprise (0192, Beau 24/09): une IA pour toute l'équipe.
// « auto » garde la relève ci-dessus; un moteur dont la clé manque retombe
// sur « auto » plutôt que de laisser l'équipe muette.
function choixEntreprise(fort: boolean): string[] | null {
  const c = moteurChoisi();
  if (c === 'deepseek' && deepseek()) return fort ? [DS_RAPIDE(), DS_FORT()] : [DS_RAPIDE()];
  if (c === 'kimi' && kimi()) return [KIMI()];
  if (c === 'gemini') return fort ? MOTEURS_PAR_DEFAUT : MOTEURS_SIMPLES_PAR_DEFAUT;
  return null;
}

export function moteurs(): string[] {
  const choisi = choixEntreprise(true);
  if (choisi) return choisi;
  const reglage = (Deno.env.get('LEGION_MOTEURS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (reglage.length) return reglage;
  return [...releve(true), ...MOTEURS_PAR_DEFAUT];
}

// Beau, 23/09: « on peut utiliser Flash pour les trucs simples, et ça part
// à Pro quand c'est complexe ». Un salut, une question courte: Flash, plus
// rapide et bien moins cher. Réglable par LEGION_MOTEURS_SIMPLES. Le Pro
// reste en dernier recours si Flash est saturé.
export const MOTEURS_SIMPLES_PAR_DEFAUT = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
export function moteursSimples(): string[] {
  const choisi = choixEntreprise(false);
  if (choisi) return choisi;
  const reglage = (Deno.env.get('LEGION_MOTEURS_SIMPLES') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (reglage.length) return reglage;
  return [...releve(false), ...MOTEURS_SIMPLES_PAR_DEFAUT];
}

type Options = { temperature?: number; reflexion?: number; delaiMs?: number; maxSortie?: number; modeles?: string[]; sansSecours?: boolean };
export type Rendu = { obj: Record<string, unknown>; modele: string } | { erreur: string };

// Gemini rend parfois « \n » échappé deux fois: on rétablit les vrais
// retours à la ligne (vu sur le premier livrable d'Alpha, 22/09).
function nettoyer(obj: Record<string, unknown>) {
  for (const k of Object.keys(obj)) if (typeof obj[k] === 'string') obj[k] = (obj[k] as string).replace(/\\r\\n|\\n/g, '\n');
  return obj;
}

async function viaGemini(apiKey: string, model: string, texte: string, schema: unknown, o: Options): Promise<string> {
  const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: texte }] }],
      generationConfig: { temperature: o.temperature ?? 0.6, maxOutputTokens: o.maxSortie ?? 8192, thinkingConfig: { thinkingBudget: o.reflexion ?? 4096 }, responseMimeType: 'application/json', responseSchema: schema },
    }),
    signal: AbortSignal.timeout(o.delaiMs ?? 90_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json();
  const txt = body?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!txt) throw new Error(`réponse vide (${body?.candidates?.[0]?.finishReason ?? '?'})`);
  return txt;
}

// Prix DeepSeek publiés le 24/09 (dollars le million de jetons, tarif des
// heures pleines — le plus cher, pour ne jamais sous-compter) :
// [entrée déjà en cache, entrée, sortie].
const PRIX_DS: Record<string, [number, number, number]> = {
  'deepseek-flash': [0.006, 0.30, 1.20],
  'deepseek-v4-pro': [0.044, 1.32, 3.96],
  // Kimi K2.6, prix relevés le 24/09 (OpenRouter).
  'kimi-k2.6': [0.1284, 0.4972, 2.97],
};

async function viaOpenAI(model: string, texte: string, schema: unknown, o: Options, url = Deno.env.get('MOTEUR_OA_URL'), cle = Deno.env.get('MOTEUR_OA_CLE')): Promise<string> {
  if (!url) throw new Error('MOTEUR_OA_URL absent');
  const resp = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cle ? { Authorization: `Bearer ${cle}` } : {}) },
    body: JSON.stringify({
      model,
      // Kimi K2.6 n'accepte que 1 (erreur 400 sinon, vu au banc du 24/09).
      temperature: /^kimi/.test(model) ? 1 : (o.temperature ?? 0.6),
      // Ces modèles comptent leur réflexion dans la sortie : sans cette
      // marge, un tableau un peu long était coupé en plein JSON (banc du 24/09).
      max_tokens: (o.maxSortie ?? 8192) + (o.reflexion ?? 4096),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Réponds UNIQUEMENT par un objet JSON conforme à ce schéma (types en majuscules à la manière de Google: STRING, ARRAY, OBJECT):\n${JSON.stringify(schema)}` },
        { role: 'user', content: texte },
      ],
    }),
    signal: AbortSignal.timeout(o.delaiMs ?? 90_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json();
  const prix = PRIX_DS[model];
  if (prix) {
    const u = body?.usage ?? {};
    const cache = u.prompt_cache_hit_tokens ?? u.cached_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0;
    const entree = (u.prompt_tokens ?? 0) - cache;
    ajouterCout(((cache * prix[0] + entree * prix[1] + (u.completion_tokens ?? 0) * prix[2]) / 1_000_000) * 0.92);
  }
  const txt = String(body?.choices?.[0]?.message?.content ?? '').trim();
  if (body?.choices?.[0]?.finish_reason === 'length') throw new Error('réponse coupée (trop longue)');
  if (!txt) throw new Error('réponse vide');
  const net = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  // Un mot avant ou après l'objet : on garde l'objet.
  const a = net.indexOf('{'), b = net.lastIndexOf('}');
  return a > 0 || (b >= 0 && b < net.length - 1) ? net.slice(a, b + 1) : net;
}

async function viaAnthropic(model: string, texte: string, schema: unknown, o: Options): Promise<string> {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) throw new Error('ANTHROPIC_API_KEY absent');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': cle, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: o.maxSortie ?? 8192,
      temperature: o.temperature ?? 0.6,
      system: `Réponds UNIQUEMENT par un objet JSON conforme à ce schéma (types en majuscules à la manière de Google: STRING, ARRAY, OBJECT), sans texte autour ni balises de code:\n${JSON.stringify(schema)}`,
      messages: [{ role: 'user', content: texte }],
    }),
    signal: AbortSignal.timeout(o.delaiMs ?? 90_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json();
  // Le coût compte aussi (prix publics d'un modèle Sonnet : 3 $ / 15 $ le million de jetons).
  ajouterCout((((body?.usage?.input_tokens ?? 0) * 3 + (body?.usage?.output_tokens ?? 0) * 15) / 1_000_000) * 0.92);
  const txt = String((body?.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('')).trim();
  if (!txt) throw new Error('réponse vide');
  // Au cas où le modèle entoure le JSON de ```json … ```.
  return txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
}

// Les moteurs de secours, d'autres fournisseurs, quand ils sont configurés.
function secours(): string[] {
  const s: string[] = [];
  if (Deno.env.get('ANTHROPIC_API_KEY')) s.push(`an:${Deno.env.get('LEGION_MODELE_ANTHROPIC') || 'claude-sonnet-5'}`);
  if (Deno.env.get('MOTEUR_OA_URL') && Deno.env.get('LEGION_MODELE_OA')) s.push(`oa:${Deno.env.get('LEGION_MODELE_OA')}`);
  return s;
}

// Fait écrire un objet JSON conforme à `schema`: essaie chaque moteur dans
// l'ordre, rend le premier qui répond juste — puis, si tous ont échoué, les
// moteurs de secours d'autres fournisseurs (quand ils sont configurés).
export async function generer(apiKey: string, texte: string, schema: unknown, o: Options = {}): Promise<Rendu> {
  let derniere = 'aucun modèle joignable';
  let plafondGoogle = false;
  const liste = o.modeles ?? moteurs();
  for (const nom of o.sansSecours ? liste : [...liste, ...secours().filter((x) => !liste.includes(x))]) {
    // Le plafond de dépenses du projet Google vaut pour tous ses modèles
    // (vu le 24/09) : inutile de les essayer un par un, on passe au secours.
    if (plafondGoogle && /^gemini/.test(nom)) continue;
    try {
      const txt = nom.startsWith('ds:') ? await viaOpenAI(nom.slice(3), texte, schema, o, 'https://api.deepseek.com', Deno.env.get('DEEPSEEK_API_KEY'))
        : nom.startsWith('km:') ? await viaOpenAI(nom.slice(3), texte, schema, o, 'https://api.moonshot.ai/v1', Deno.env.get('KIMI_API_KEY'))
        : nom.startsWith('oa:') ? await viaOpenAI(nom.slice(3), texte, schema, o)
        : nom.startsWith('an:') ? await viaAnthropic(nom.slice(3), texte, schema, o)
        : await viaGemini(apiKey, nom, texte, schema, o);
      try { return { obj: nettoyer(JSON.parse(txt)), modele: nom }; } catch { derniere = `${nom}: JSON illisible`; }
    } catch (e) {
      derniere = `${nom}: ${(e as Error).message}`; console.error(derniere);
      if (/spending cap/i.test(derniere)) plafondGoogle = true;
    }
  }
  return { erreur: plafondGoogle && !derniere.includes('spending cap') ? `plafond Google (spending cap) — ${derniere}` : derniere };
}

// La trace pour nos exemples d'entraînement (0167). Ne casse jamais rien:
// une trace perdue vaut mieux qu'un livrable perdu.
// deno-lint-ignore no-explicit-any
type Service = any;
const consent = new Map<string, boolean>();
export async function garder(service: Service, t: { entreprise_id: string; message_id?: string | null; fonction: string; modele: string; consigne: string; sortie: string }) {
  try {
    if (!consent.has(t.entreprise_id)) {
      const { data } = await service.from('legion_entreprises').select('entrainement').eq('id', t.entreprise_id).maybeSingle();
      consent.set(t.entreprise_id, !!data?.entrainement);
    }
    if (!consent.get(t.entreprise_id)) return;
    await service.from('ia_traces').insert({ ...t, consigne: t.consigne.slice(0, 60_000), sortie: t.sortie.slice(0, 20_000) });
  } catch (e) { console.error('trace:', (e as Error).message); }
}

// Un texte arrivé d'un seul bloc (vu le 23/09 avec Flash, quand le Pro de
// Google était saturé: « trouvé :## Opportunités- Startup Day  - Date … »).
// Beau: « mets ça point par point, bien clair, présentable ». On remet les
// titres et les points sur leurs lignes; un texte qui a déjà des retours à
// la ligne n'est pas touché.
export function aerer(t: string): string {
  if (!t || t.includes('\n')) return t;
  return t
    .replace(/\s*(#{1,3} )/g, '\n\n$1')
    .replace(/ {2,}- /g, '\n  - ')
    .replace(/([^\s-])- (?=[A-ZÀ-ÖØ-Þ0-9[«"*])/g, '$1\n- ')
    .replace(/([.:!?)»])[ \t]+- (?=\S)/g, '$1\n- ')
    .replace(/(\d)([A-ZÀ-ÖØ-Þ][a-zà-ÿ]{1,})/g, '$1\n$2')
    .replace(/([.!?:])\s*(\d{1,2})\.\s(?=[A-ZÀ-ÖØ-Þ])/g, '$1\n$2. ')
    // Des clés de tickets collées (« In ProgressJRASERVER-78848 », vu le 24/09) :
    // une par ligne.
    .replace(/([a-zà-ÿ):])\s?([A-Z][A-Z0-9]{1,9}-\d+)(?= :| —| -|:)/g, '$1\n- $2')
    .replace(/^\n+/, '')
    .trim();
}
