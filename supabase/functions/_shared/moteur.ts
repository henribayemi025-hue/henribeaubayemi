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
// - « gg:<modèle> » (29/09, Beau) : Gemini avec une DEUXIÈME clé, celle de
//   l'offre gratuite de Google (secret GEMINI_API_KEY_GRATUIT). Quand elle
//   existe, elle passe EN TÊTE : « à défaut on a Gemini gratuit ; si Gemini
//   gratuit ne marche pas on passe à DeepSeek rapide, ensuite le fort,
//   ensuite Kimi, ensuite Gemini payant, ensuite OpenAI ». Son quota épuisé
//   (429) la met en fin de file 15 minutes, comme un solde vide ; rien n'est
//   compté en dépense. Sans ce secret, rien ne change.
//
// Et `garder()`: la trace de ce qui a été demandé et rendu, pour nos
// exemples d'entraînement (0167) — seulement si l'entreprise a dit oui.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ajouterCout, cleOpenAI, gemini, modeleChoisi, moteurChoisi, signalerCoupure } from './cout.ts';
import { appelGratuit, iaGratuiteActive, MODELE_GRATUIT } from './gratuit.ts';
import { reparerJson, adapterAuSchema, champsManquants } from './gratuit-compte.ts';

// LE DISJONCTEUR (28/09). Mesuré ce soir : pour un simple « ça va ? »,
// DeepSeek refusait (solde épuisé, 2 s), OpenAI aussi (0,5 s), puis Kimi ne
// répondait pas et on l'attendait 20 s avant que Google réponde en 2 s — 25 s
// au total, À CHAQUE message. Un moteur qui vient de refuser faute de crédit
// (tout le compte) passe en fin de file 15 minutes ; un modèle qui ne répond
// pas, 5 minutes. Le réglage vaut pour toutes les fonctions (rangé dans
// legion_cache). Rien n'est retiré de la file : l'équipe ne reste jamais
// muette à cause du disjoncteur.
const famille = (nom: string) => (nom.includes(':') ? nom.split(':')[0] : 'gemini');
let endormis = new Map<string, number>();
let endormisLus = 0;
const base = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
async function lireEndormis() {
  if (Date.now() - endormisLus < 30_000) return;
  endormisLus = Date.now();
  try {
    const { data } = await base().from('legion_cache').select('cle, expire_le').like('cle', 'moteur:endormi:%');
    endormis = new Map((data || []).map((r: { cle: string; expire_le: string }) => [r.cle.slice('moteur:endormi:'.length), Date.parse(r.expire_le)]));
  } catch (e) { console.error('disjoncteur (lire):', (e as Error).message); }
}
// Exporté : une fonction qui juge une réponse inutilisable (texte vide après
// 20 s…) peut aussi mettre le modèle en fin de file.
// La file dans le bon ordre, pour qui essaie les moteurs un par un (legion-repondre) :
// les éveillés d'abord, les endormis ensuite, et le secours en dernier.
export async function fileDesMoteurs(liste: string[]): Promise<string[]> {
  await lireEndormis();
  const tous = [...liste, ...secours().filter((x) => !liste.includes(x))];
  const dort = (n: string) => Math.max(endormis.get(famille(n)) ?? 0, endormis.get(n) ?? 0) > Date.now();
  return [...tous.filter((n) => !dort(n)), ...tous.filter(dort)];
}
export async function endormirMoteur(nom: string, ms: number, raison: string) { await endormir(nom, ms, raison); }
async function endormir(f: string, ms: number, raison: string) {
  endormis.set(f, Date.now() + ms);
  try {
    await base().from('legion_cache').upsert({ cle: `moteur:endormi:${f}`, fonction: 'moteur', valeur: { raison: raison.slice(0, 200) }, expire_le: new Date(Date.now() + ms).toISOString() });
  } catch (e) { console.error('disjoncteur (écrire):', (e as Error).message); }
}
const SANS_CREDIT = /HTTP 402|insufficient balance|no credits remaining|insufficient_quota|exceeded your current quota|credit balance|spending cap|HTTP 401|invalid.{0,10}api.?key/i;
const MUET = /timed out|timeout|aborted/i;

export const MOTEURS_PAR_DEFAUT = ['gemini-3.1-pro-preview', 'gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-2.5-flash'];

// DeepSeek d'abord quand sa clé existe (le modèle fort pour les plans et
// livrables, le rapide pour le reste). Les noms suivent leur tarif publié
// (api-docs.deepseek.com, lu le 24/09) : quand ils en changent, on change
// ces deux lignes ou le réglage LEGION_MODELE_DS / LEGION_MODELE_DS_RAPIDE.
const deepseek = () => !!Deno.env.get('DEEPSEEK_API_KEY');
const DS_FORT = () => `ds:${Deno.env.get('LEGION_MODELE_DS') || 'deepseek-v4-pro'}`;
const DS_RAPIDE = () => `ds:${Deno.env.get('LEGION_MODELE_DS_RAPIDE') || 'deepseek-flash'}`;
const kimi = () => !!Deno.env.get('KIMI_API_KEY');
const gratuit = () => Deno.env.get('GEMINI_API_KEY_GRATUIT');
// Les modèles de l'offre gratuite, du premier essayé au dernier (réglable).
// Google a répondu le 29/09 : gemini-2.5-flash « n'est plus disponible pour les
// nouveaux utilisateurs » (404) sur un projet neuf — d'où 3.8-flash.
const GRATUITS = () => (Deno.env.get('LEGION_MODELES_GRATUITS') || 'gemini-3.8-flash,gemini-3.5-flash').split(',').map((m) => m.trim()).filter(Boolean).map((m) => `gg:${m}`);
const KIMI = () => `km:${Deno.env.get('LEGION_MODELE_KIMI') || 'kimi-k2.6'}`;
// « cf: » (05/10, Beau : « oui branche cloudflare gratuit ») : l'IA gratuite
// de Cloudflare, par le Worker de finjaro.net (gratuit.ts). Rien ne la paie :
// elle passe juste après Gemini gratuit, avant tout moteur payant, et
// s'arrête d'elle-même au plafond du jour.
const CF = () => `cf:${MODELE_GRATUIT()}`;
// La relève, dans l'ordre : DeepSeek rapide, puis le fort, puis Kimi, puis
// Google. Le rapide d'abord partout (24/09, premier essai réel) : v4-pro
// réfléchit longtemps et a dépassé les 45 s d'une réponse de salon, puis
// flash a répondu — 75 s en tout. Flash seul répond en 10 à 30 s, et sa
// réponse était la meilleure des deux à l'essai.
const releve = (fort: boolean) => [
  ...(gratuit() ? GRATUITS() : []),
  ...(iaGratuiteActive() ? [CF()] : []),
  ...(deepseek() ? [DS_RAPIDE()] : []),
  ...(deepseek() && fort ? [DS_FORT()] : []),
  ...(kimi() ? [KIMI()] : []),
];

// Le choix de l'entreprise (0192, Beau 24/09): une IA pour toute l'équipe.
// « auto » garde la relève ci-dessus; un moteur dont la clé manque retombe
// sur « auto » plutôt que de laisser l'équipe muette.
// Les modèles qu'on peut choisir un par un (0193). Le choix passe en premier;
// derrière lui, la relève Auto — un modèle en panne ne laisse jamais
// l'équipe muette.
export const MODELES_CHOISIBLES = ['cf:gemma-4', 'ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'oa:gpt-6-astra', 'oa:gpt-5.4-mini', 'gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-2.5-flash', 'an:claude-sonnet-5'];
function disponible(m: string): boolean {
  if (m.startsWith('ds:')) return deepseek();
  if (m.startsWith('cf:')) return iaGratuiteActive();
  if (m.startsWith('km:')) return kimi();
  if (m.startsWith('gg:')) return !!gratuit();
  if (m.startsWith('an:')) return !!Deno.env.get('ANTHROPIC_API_KEY');
  if (m.startsWith('oa:')) return !!(Deno.env.get('MOTEUR_OA_URL') || cleOpenAI());
  return true;
}
function avecModeleChoisi(liste: string[]): string[] {
  const m = modeleChoisi();
  if (!m || !MODELES_CHOISIBLES.includes(m) || !disponible(m)) return liste;
  return [m, ...liste.filter((x) => x !== m)];
}

function choixEntreprise(fort: boolean): string[] | null {
  const c = moteurChoisi();
  if (c === 'deepseek' && deepseek()) return fort ? [DS_RAPIDE(), DS_FORT()] : [DS_RAPIDE()];
  if (c === 'kimi' && kimi()) return [KIMI()];
  if (c === 'gemini') return fort ? MOTEURS_PAR_DEFAUT : MOTEURS_SIMPLES_PAR_DEFAUT;
  return null;
}

export function moteurs(): string[] {
  const choisi = choixEntreprise(true);
  if (choisi) return avecModeleChoisi(choisi);
  const reglage = (Deno.env.get('LEGION_MOTEURS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (reglage.length) return avecModeleChoisi(reglage);
  return avecModeleChoisi([...releve(true), ...MOTEURS_PAR_DEFAUT]);
}

// Beau, 23/09: « on peut utiliser Flash pour les trucs simples, et ça part
// à Pro quand c'est complexe ». Un salut, une question courte: Flash, plus
// rapide et bien moins cher. Réglable par LEGION_MOTEURS_SIMPLES. Le Pro
// reste en dernier recours si Flash est saturé.
export const MOTEURS_SIMPLES_PAR_DEFAUT = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
export function moteursSimples(): string[] {
  const choisi = choixEntreprise(false);
  if (choisi) return avecModeleChoisi(choisi);
  const reglage = (Deno.env.get('LEGION_MOTEURS_SIMPLES') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (reglage.length) return avecModeleChoisi(reglage);
  return avecModeleChoisi([...releve(false), ...MOTEURS_SIMPLES_PAR_DEFAUT]);
}

type Options = { temperature?: number; reflexion?: number; delaiMs?: number; maxSortie?: number; modeles?: string[]; sansSecours?: boolean };
// `essais` : chaque moteur tenté, avec son temps (28/09) — pour voir où partent les secondes.
export type Essai = { m: string; ms: number; e?: string };
export type Rendu = ({ obj: Record<string, unknown>; modele: string } | { erreur: string }) & { essais?: Essai[] };

// Gemini rend parfois « \n » échappé deux fois: on rétablit les vrais
// retours à la ligne (vu sur le premier livrable d'Alpha, 22/09).
function nettoyer(obj: Record<string, unknown>) {
  for (const k of Object.keys(obj)) if (typeof obj[k] === 'string') obj[k] = (obj[k] as string).replace(/\\r\\n|\\n/g, '\n');
  return obj;
}

// La réflexion. Sur l'offre gratuite, gemini-3.8-flash a dépassé les 12 s de
// la voie rapide avec un simple budget (29/09, « Signal timed out ») : les
// modèles 3.x se règlent par niveau, et un salut n'a besoin que du minimum.
function reflexion(model: string, budget: number, sansFrais: boolean) {
  if (sansFrais && /^gemini-3/.test(model)) return { thinkingLevel: budget <= 4096 ? 'low' : 'high' }; // « MINIMAL is not supported » (400) pour 3.8-flash, vu le 29/09
  return { thinkingBudget: budget };
}

async function viaGemini(apiKey: string, model: string, texte: string, schema: unknown, o: Options, sansFrais = false): Promise<string> {
  // L'offre gratuite ne coûte rien : pas de compteur de dépense.
  const resp = await (sansFrais ? fetch : gemini)(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: texte }] }],
      generationConfig: { temperature: o.temperature ?? 0.6, maxOutputTokens: o.maxSortie ?? 8192, thinkingConfig: reflexion(model, o.reflexion ?? 4096, sansFrais), responseMimeType: 'application/json', responseSchema: schema },
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
export const PRIX_DS: Record<string, [number, number, number]> = {
  'deepseek-flash': [0.006, 0.30, 1.20],
  'deepseek-v4-pro': [0.044, 1.32, 3.96],
  // Kimi K2.6, prix relevés le 24/09 (OpenRouter).
  'kimi-k2.6': [0.1284, 0.4972, 2.97],
};
// Prix OpenAI lus sur la page officielle (developers.openai.com, 24/09), en
// dollars le million de jetons : [entrée en cache, entrée, sortie]. Partagé
// avec relais.ts. 05/10 : viaOpenAI ne lisait que PRIX_DS, donc les livrables
// passés par gpt-5.4-mini (depuis la panne de crédits Google du 03/10) ne
// comptaient rien dans ai_usage — le plafond du mois ne les arrêtait plus.
export const PRIX_OPENAI: Record<string, [number, number, number]> = {
  'gpt-5.4-mini': [0.075, 0.75, 4.5],
};

// Sans adresse réglée, « oa: » va chez OpenAI avec la clé de Beau, reconnue
// à sa forme (24/09 : il l'a rangée sous le nom « Leo »).
async function viaOpenAI(model: string, texte: string, schema: unknown, o: Options, url = Deno.env.get('MOTEUR_OA_URL') || (cleOpenAI() ? 'https://api.openai.com/v1' : undefined), cle = Deno.env.get('MOTEUR_OA_CLE') || cleOpenAI()): Promise<string> {
  if (!url) throw new Error('MOTEUR_OA_URL absent');
  const resp = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cle ? { Authorization: `Bearer ${cle}` } : {}) },
    body: JSON.stringify({
      model,
      // Les modèles récents d'OpenAI (GPT-5, GPT-6, o…) refusent une autre
      // température que la leur et veulent max_completion_tokens (24/09).
      ...(/^(gpt-[5-9]|o\d)/.test(model)
        ? { max_completion_tokens: (o.maxSortie ?? 8192) + (o.reflexion ?? 4096) }
        : {
          // Kimi K2.6 n'accepte que 1 (erreur 400 sinon, vu au banc du 24/09).
          temperature: /^kimi/.test(model) ? 1 : (o.temperature ?? 0.6),
          // Ces modèles comptent leur réflexion dans la sortie : sans cette
          // marge, un tableau un peu long était coupé en plein JSON (banc du 24/09).
          // Doublée le 24/09 au soir : les livrables des agents (DeepSeek fort,
          // Kimi) sortaient encore « coupés », donc vides. On ne paie que ce
          // qui est vraiment écrit.
          max_tokens: Math.min(32_768, 2 * ((o.maxSortie ?? 8192) + (o.reflexion ?? 4096))),
        }),
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
  const prix = PRIX_DS[model] ?? PRIX_OPENAI[model];
  if (!prix) console.error(`coût inconnu pour ${model} : rien n'est compté dans ai_usage`);
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

// L'IA gratuite de Cloudflare : même consigne JSON que viaOpenAI, coût nul
// (le plafond du jour est tenu par gratuit.ts).
async function viaGratuit(model: string, texte: string, schema: unknown, o: Options): Promise<string> {
  const body = await appelGratuit({
    model,
    temperature: o.temperature ?? 0.6,
    max_tokens: Math.min(8192, (o.maxSortie ?? 4096) + (o.reflexion ?? 2048)),
    messages: [
      { role: 'system', content: `Réponds UNIQUEMENT par un objet JSON conforme à ce schéma (types en majuscules à la manière de Google: STRING, ARRAY, OBJECT), sans texte autour ni balises de code:\n${JSON.stringify(schema)}` },
      { role: 'user', content: texte },
    ],
  }, o.delaiMs ?? 90_000);
  const choix = (body.choices as Array<{ message?: { content?: unknown }; finish_reason?: string }> | undefined)?.[0];
  if (choix?.finish_reason === 'length') throw new Error('réponse coupée (trop longue)');
  const txt = String(choix?.message?.content ?? '').trim();
  if (!txt) throw new Error('réponse vide');
  // Réparé ici (balises, retours à la ligne dans les textes, virgules en
  // trop) : sinon le disjoncteur rangeait l'IA gratuite et les agents
  // repartaient sur un moteur payant (05/10).
  const obj = adapterAuSchema(reparerJson(txt), schema);
  if (obj === null || typeof obj !== 'object') throw new Error('JSON illisible');
  // Un JSON valide mais sans ce que l'agent dit : on passe au moteur suivant
  // en gardant un extrait dans les journaux, pour comprendre ce qu'il a rendu.
  const manque = champsManquants(obj, schema);
  if (manque.length) {
    console.error(`ia gratuite, hors schéma (${manque.join(', ')}) :`, txt.slice(0, 300));
    throw new Error(`réponse hors schéma (${manque.join(', ')} vide)`);
  }
  return JSON.stringify(obj);
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
  // OpenAI (clé de Beau), GPT-5.4 mini par défaut (réglable : LEGION_MODELE_OA).
  else if (cleOpenAI()) s.push(`oa:${Deno.env.get('LEGION_MODELE_OA') || 'gpt-5.4-mini'}`);
  // L'IA gratuite reste un recours même quand LEGION_MOTEURS fixe la file.
  if (iaGratuiteActive()) s.push(CF());
  return s;
}

// Fait écrire un objet JSON conforme à `schema`: essaie chaque moteur dans
// l'ordre, rend le premier qui répond juste — puis, si tous ont échoué, les
// moteurs de secours d'autres fournisseurs (quand ils sont configurés).
export async function generer(apiKey: string, texte: string, schema: unknown, o: Options = {}): Promise<Rendu> {
  let derniere = 'aucun modèle joignable';
  let plafondGoogle = false;
  const liste = o.modeles ?? moteurs();
  const candidats = o.sansSecours ? liste : [...liste, ...secours().filter((x) => !liste.includes(x))];
  await lireEndormis();
  const dort = (n: string) => Math.max(endormis.get(famille(n)) ?? 0, endormis.get(n) ?? 0) > Date.now();
  // Ceux qui dorment passent en dernier, sans être retirés : un moteur mis
  // de côté à tort reste un recours.
  const essais: Essai[] = [];
  for (const nom of [...candidats.filter((n) => !dort(n)), ...candidats.filter(dort)]) {
    const debut = Date.now();
    // Le plafond de dépenses du projet Google vaut pour tous ses modèles
    // (vu le 24/09) : inutile de les essayer un par un, on passe au secours.
    if (plafondGoogle && /^gemini/.test(nom)) continue;
    try {
      const txt = nom.startsWith('ds:') ? await viaOpenAI(nom.slice(3), texte, schema, o, 'https://api.deepseek.com', Deno.env.get('DEEPSEEK_API_KEY'))
        : nom.startsWith('km:') ? await viaOpenAI(nom.slice(3), texte, schema, o, 'https://api.moonshot.ai/v1', Deno.env.get('KIMI_API_KEY'))
        : nom.startsWith('oa:') ? await viaOpenAI(nom.slice(3), texte, schema, o)
        : nom.startsWith('an:') ? await viaAnthropic(nom.slice(3), texte, schema, o)
        : nom.startsWith('cf:') ? await viaGratuit(nom.slice(3), texte, schema, o)
        : nom.startsWith('gg:') ? await viaGemini(gratuit() || '', nom.slice(3), texte, schema, o, true)
        : await viaGemini(apiKey, nom, texte, schema, o);
      try { const obj = nettoyer(JSON.parse(txt)); essais.push({ m: nom, ms: Date.now() - debut }); return { obj, modele: nom, essais }; } catch {
        derniere = `${nom}: JSON illisible`; essais.push({ m: nom, ms: Date.now() - debut, e: 'JSON illisible' });
        if (Date.now() - debut > 8_000) await endormir(nom, 5 * 60_000, derniere);
      }
    } catch (e) {
      derniere = `${nom}: ${(e as Error).message}`; console.error(derniere);
      essais.push({ m: nom, ms: Date.now() - debut, e: (e as Error).message.slice(0, 80) });
      if (SANS_CREDIT.test(derniere)) await endormir(famille(nom), 15 * 60_000, derniere);
      // Muet, ou lent ET en échec : seulement CE modèle (un Pro lent qui
      // réussit ne met pas de côté tout Google).
      else if (MUET.test(derniere) || Date.now() - debut > 8_000) await endormir(nom, 5 * 60_000, derniere);
      if (/spending cap/i.test(derniere)) plafondGoogle = true;
      // Un solde épuisé chez DeepSeek ou Kimi : Beau est prévenu (une fois par jour).
      if (/HTTP 402|insufficient balance|exceeded your current quota/i.test(derniere)) {
        if (nom.startsWith('ds:')) await signalerCoupure('DeepSeek', 'le solde du compte est épuisé', 'https://platform.deepseek.com/top_up');
        else if (nom.startsWith('km:')) await signalerCoupure('Kimi', 'le solde du compte est épuisé', 'https://platform.moonshot.ai');
      }
    }
  }
  return { erreur: plafondGoogle && !derniere.includes('spending cap') ? `plafond Google (spending cap) — ${derniere}` : derniere, essais };
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
