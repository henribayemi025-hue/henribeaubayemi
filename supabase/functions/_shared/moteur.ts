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
//
// Et `garder()`: la trace de ce qui a été demandé et rendu, pour nos
// exemples d'entraînement (0167) — seulement si l'entreprise a dit oui.

import { gemini } from './cout.ts';

export const MOTEURS_PAR_DEFAUT = ['gemini-3.1-pro-preview', 'gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-2.5-flash'];

export function moteurs(): string[] {
  const reglage = (Deno.env.get('LEGION_MOTEURS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return reglage.length ? reglage : MOTEURS_PAR_DEFAUT;
}

type Options = { temperature?: number; reflexion?: number; delaiMs?: number; maxSortie?: number; modeles?: string[] };
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

async function viaOpenAI(model: string, texte: string, schema: unknown, o: Options): Promise<string> {
  const url = Deno.env.get('MOTEUR_OA_URL');
  const cle = Deno.env.get('MOTEUR_OA_CLE');
  if (!url) throw new Error('MOTEUR_OA_URL absent');
  const resp = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cle ? { Authorization: `Bearer ${cle}` } : {}) },
    body: JSON.stringify({
      model,
      temperature: o.temperature ?? 0.6,
      max_tokens: o.maxSortie ?? 8192,
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
  const txt = body?.choices?.[0]?.message?.content ?? '';
  if (!txt) throw new Error('réponse vide');
  return txt;
}

// Fait écrire un objet JSON conforme à `schema`: essaie chaque moteur dans
// l'ordre, rend le premier qui répond juste.
export async function generer(apiKey: string, texte: string, schema: unknown, o: Options = {}): Promise<Rendu> {
  let derniere = 'aucun modèle joignable';
  for (const nom of o.modeles ?? moteurs()) {
    try {
      const txt = nom.startsWith('oa:') ? await viaOpenAI(nom.slice(3), texte, schema, o) : await viaGemini(apiKey, nom, texte, schema, o);
      try { return { obj: nettoyer(JSON.parse(txt)), modele: nom }; } catch { derniere = `${nom}: JSON illisible`; }
    } catch (e) { derniere = `${nom}: ${(e as Error).message}`; console.error(derniere); }
  }
  return { erreur: derniere };
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
    .replace(/^\n+/, '')
    .trim();
}
