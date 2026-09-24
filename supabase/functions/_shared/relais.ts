// LE RELAIS — quand Google ne répond plus, d'autres prennent la parole.
//
// Beau, 24/09 au soir : « Branchons Finia aussi avec Kimi et les autres si
// Google échoue ; les autres modèles peuvent lire. » Puis : « même les
// réponses dans Finia, si Google ne passe pas, les autres prennent, ils
// doivent être entraînés comme on avait entraîné Finia ».
//
// Pourquoi : depuis le 24/09 à 01 h 18 UTC, le projet Google a atteint son
// plafond de dépenses et chaque appel rend 429 « spending cap ». Léo avait
// déjà sa relève (moteur.ts) ; Finia, la lecture des photos, le copilote
// vendeuse et la modération appelaient Google en dur, sans personne derrière.
//
// RÈGLE : ce relais ne sert QUE quand Google a échoué. Chaque fonction garde
// son appel à Gemini tel quel et n'appelle ceci qu'après un échec. Quand
// Google répond, rien ne change. Et on passe au relais EXACTEMENT ce que
// Gemini aurait reçu : même consigne, même historique, mêmes outils — pas une
// version raccourcie.
//
// Qui lit quoi (vérifié à la source le 24/09 : platform.kimi.ai, guides
// « Kimi K2.6 » et « Vision », fiche Hugging Face moonshotai/Kimi-K2.6) :
// - Kimi K2.6 (KIMI_API_KEY, https://api.moonshot.ai/v1, compatible OpenAI) :
//   texte, IMAGES (image_url en « data:image/…;base64, » — une adresse http
//   n'est PAS acceptée ; jpeg, png, gif, webp, bmp, heic ; 4K au plus,
//   100 Mo par requête) et outils (`tools` / `tool_calls`). Température
//   IMPOSÉE (1 avec réflexion, 0,6 sans ; toute autre valeur = erreur) : on
//   ne l'envoie donc pas. On coupe la réflexion (« thinking: disabled ») :
//   Finia doit répondre en quelques secondes, pas en une minute.
// - DeepSeek (DEEPSEEK_API_KEY) : texte seul, outils au format OpenAI.
// - OpenAI (24/09, 22 h 30 : clé de Beau rangée sous « Leo », lue par
//   cleOpenAI()) : GPT-5.4 mini, après Kimi. Texte, IMAGES et outils (fiche
//   officielle du modèle, lue le 24/09 : entrée « text, image », function
//   calling, structured outputs). Pas de température imposée ni de
//   « thinking » : GPT-5 refuse l'une et ne connaît pas l'autre ;
//   max_completion_tokens au lieu de max_tokens.
// - Claude (ANTHROPIC_API_KEY, seulement si elle existe) : texte et images.
// - L'audio : Beau, 24/09 : « si Gemini ne donne pas les messages vocaux,
//   OpenAI peut ». Le vocal est TRANSCRIT par OpenAI (transcrire(), plus
//   bas), puis la conversation continue sur le texte comme d'habitude.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ajouterCout, cleOpenAI, signalerCoupure } from './cout.ts';
import { PRIX_DS } from './moteur.ts';

type Json = Record<string, unknown>;
export type Image = { mime: string; data: string }; // base64 SANS le préfixe data:
export type Morceau = { texte: string } | { image: Image };
export type OutilGemini = { name: string; description?: string; parameters?: unknown };

type Fournisseur = { nom: string; url: string; cle: string; modele: string; images: boolean; kimi: boolean; openai?: boolean };

const kimi = (): Fournisseur | null => {
  const cle = Deno.env.get('KIMI_API_KEY');
  return cle ? { nom: 'km', url: 'https://api.moonshot.ai/v1', cle, modele: Deno.env.get('LEGION_MODELE_KIMI') || 'kimi-k2.6', images: true, kimi: true } : null;
};
const deepseek = (): Fournisseur | null => {
  const cle = Deno.env.get('DEEPSEEK_API_KEY');
  return cle ? { nom: 'ds', url: 'https://api.deepseek.com', cle, modele: Deno.env.get('LEGION_MODELE_DS_RAPIDE') || 'deepseek-flash', images: false, kimi: false } : null;
};
const openai = (): Fournisseur | null => {
  const cle = cleOpenAI();
  return cle ? { nom: 'oa', url: 'https://api.openai.com/v1', cle, modele: Deno.env.get('LEGION_MODELE_OA') || 'gpt-5.4-mini', images: true, kimi: false, openai: true } : null;
};
const anthropicCle = () => Deno.env.get('ANTHROPIC_API_KEY');
const anthropicModele = () => Deno.env.get('LEGION_MODELE_ANTHROPIC') || 'claude-sonnet-5';

// ——— Le coût : estimé sur les jetons rendus, écrit dans ai_usage sous le nom
// de la fonction appelante — il entre donc dans le même plafond du mois que
// les appels à Google. ———
const USD_EN_EUR = 0.92;
// Prix OpenAI lus sur la page officielle (developers.openai.com/api/docs/pricing,
// 24/09), en dollars le million de jetons : [entrée en cache, entrée, sortie].
// Un modèle absent d'ici est compté à 0 — on n'invente pas un prix.
const PRIX_OPENAI: Record<string, [number, number, number]> = {
  'gpt-5.4-mini': [0.075, 0.75, 4.5],
};
// Transcription, en dollars la MINUTE (même page, 24/09).
const PRIX_TRANSCRIPTION: Record<string, number> = {
  'gpt-4o-mini-transcribe': 0.003,
  'gpt-4o-transcribe': 0.006,
  'gpt-transcribe': 0.0045,
  'whisper-1': 0.006,
};
function coutOpenAI(modele: string, u: Json | undefined): number {
  const prix = PRIX_DS[modele] ?? PRIX_OPENAI[modele];
  if (!prix || !u) return 0;
  const details = u.prompt_tokens_details as Json | undefined;
  const cache = Number(u.prompt_cache_hit_tokens ?? u.cached_tokens ?? details?.cached_tokens ?? 0);
  const entree = Number(u.prompt_tokens ?? 0) - cache;
  return ((cache * prix[0] + entree * prix[1] + Number(u.completion_tokens ?? 0) * prix[2]) / 1_000_000) * USD_EN_EUR;
}
// Prix publics d'un modèle Sonnet, arrondis au-dessus (3 $ / 15 $ le million)
// comme dans moteur.ts : on ne sous-compte jamais.
const coutAnthropic = (u: Json | undefined) => (((Number(u?.input_tokens ?? 0)) * 3 + Number(u?.output_tokens ?? 0) * 15) / 1_000_000) * USD_EN_EUR;

// Sans nom de fonction (les agents de Léo, qui comptent leur coût par
// compter() dans cout.ts), le coût va au compteur de la requête en cours.
async function noterCout(fn: string | null, eur: number) {
  if (!(eur > 0)) return;
  if (!fn) { ajouterCout(eur); return; }
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { error } = await db.from('ai_usage').insert({ fn, cost_eur: Number(eur.toFixed(6)) });
    if (error) console.error('relais ai_usage:', error.message);
  } catch (e) { console.error('relais ai_usage:', (e as Error).message); }
}

// Un solde épuisé chez Kimi ou DeepSeek : Beau est prévenu (une fois par jour),
// comme dans moteur.ts.
async function surErreur(f: { nom: string }, message: string) {
  if (!/HTTP 402|insufficient balance|exceeded your current quota/i.test(message)) return;
  if (f.nom === 'ds') await signalerCoupure('DeepSeek', 'le solde du compte est épuisé', 'https://platform.deepseek.com/top_up');
  else if (f.nom === 'km') await signalerCoupure('Kimi', 'le solde du compte est épuisé', 'https://platform.moonshot.ai');
  else if (f.nom === 'oa') await signalerCoupure('OpenAI', 'le crédit du compte est épuisé', 'https://platform.openai.com/settings/organization/billing');
}

// ——— Les schémas : Google écrit les types en majuscules (OBJECT, STRING…),
// le JSON Schema des autres en minuscules. ———
export function versJsonSchema(s: unknown): unknown {
  if (Array.isArray(s)) return s.map(versJsonSchema);
  if (!s || typeof s !== 'object') return s;
  const src = s as Json;
  const out: Json = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === 'type' && typeof v === 'string') out.type = v.toLowerCase();
    else if (k === 'properties' && v && typeof v === 'object') {
      out.properties = Object.fromEntries(Object.entries(v as Json).map(([p, d]) => [p, versJsonSchema(d)]));
    } else if (k === 'items') out.items = versJsonSchema(v);
    // Propres à Google, inconnus ailleurs.
    else if (k === 'nullable' || k === 'propertyOrdering' || k === 'format') continue;
    else out[k] = v;
  }
  return out;
}

// La réponse respecte-t-elle le schéma ? Même exigence que responseSchema chez
// Google : champs obligatoires présents, bons types, valeurs d'enum permises.
// Rend la première faute trouvée, ou null.
export function conforme(v: unknown, schema: unknown, chemin = '$'): string | null {
  if (!schema || typeof schema !== 'object') return null;
  const s = schema as Json;
  const type = String(s.type ?? '').toLowerCase();
  if (type === 'object') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return `${chemin}: objet attendu`;
    const o = v as Json;
    for (const r of (s.required as string[] | undefined) ?? []) if (o[r] === undefined || o[r] === null) return `${chemin}.${r}: manquant`;
    for (const [p, d] of Object.entries((s.properties as Json | undefined) ?? {})) {
      if (o[p] === undefined || o[p] === null) continue;
      const e = conforme(o[p], d, `${chemin}.${p}`);
      if (e) return e;
    }
  } else if (type === 'array') {
    if (!Array.isArray(v)) return `${chemin}: tableau attendu`;
    for (let i = 0; i < v.length; i++) {
      const e = conforme(v[i], s.items, `${chemin}[${i}]`);
      if (e) return e;
    }
  } else if (type === 'string') {
    if (typeof v !== 'string') return `${chemin}: texte attendu`;
    if (Array.isArray(s.enum) && !s.enum.includes(v)) return `${chemin}: « ${v.slice(0, 40)} » hors de la liste permise`;
  } else if (type === 'number' || type === 'integer') {
    if (typeof v !== 'number' || !Number.isFinite(v)) return `${chemin}: nombre attendu`;
  } else if (type === 'boolean') {
    if (typeof v !== 'boolean') return `${chemin}: vrai/faux attendu`;
  }
  return null;
}

// Le JSON au milieu d'une réponse (balises ```json, un mot avant ou après).
function extraireJson(txt: string): unknown {
  const net = txt.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(net); } catch { /* on cherche l'objet ou le tableau */ }
  const debut = net.search(/[[{]/);
  const fin = Math.max(net.lastIndexOf('}'), net.lastIndexOf(']'));
  if (debut < 0 || fin <= debut) throw new Error('JSON illisible');
  return JSON.parse(net.slice(debut, fin + 1));
}

// ——— Les appels ———
async function appelOpenAI(f: Fournisseur, corps: Json, delaiMs: number): Promise<{ message: Json; finish: string; cout: number }> {
  const resp = await fetch(`${f.url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${f.cle}` },
    // Pas de température : Kimi K2.6 l'impose et refuse toute autre valeur.
    // Réflexion coupée : plus rapide, et plus besoin de renvoyer le
    // raisonnement (reasoning_content) à chaque tour d'outils. OpenAI ne
    // connaît pas « thinking » et veut max_completion_tokens.
    body: JSON.stringify(f.openai
      ? (({ max_tokens, ...reste }) => ({ model: f.modele, ...reste, ...(max_tokens ? { max_completion_tokens: max_tokens } : {}) }))(corps)
      : { model: f.modele, thinking: { type: 'disabled' }, ...corps }),
    signal: AbortSignal.timeout(delaiMs),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json();
  const choix = body?.choices?.[0];
  if (!choix?.message) throw new Error('réponse sans message');
  return { message: choix.message as Json, finish: String(choix.finish_reason ?? ''), cout: coutOpenAI(f.modele, body?.usage) };
}

async function appelAnthropic(systeme: string, contenu: Json[], maxSortie: number, delaiMs: number): Promise<{ texte: string; cout: number }> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicCle()!, 'anthropic-version': '2023-06-01' },
    // Pas de température : Sonnet 5 la refuse (400).
    body: JSON.stringify({ model: anthropicModele(), max_tokens: maxSortie, ...(systeme ? { system: systeme } : {}), messages: [{ role: 'user', content: contenu }] }),
    signal: AbortSignal.timeout(delaiMs),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json();
  const texte = String((body?.content || []).filter((c: Json) => c.type === 'text').map((c: Json) => c.text).join('')).trim();
  return { texte, cout: coutAnthropic(body?.usage) };
}

const dataUrl = (i: Image) => `data:${i.mime};base64,${i.data}`;

// ——— 1. Générer, avec ou sans images ———
//
// Pour la lecture des photos (finou-vision, vendor-copilot, troc-eval) et les
// travaux de texte (modération, réponse automatique). Ordre : avec des
// images, Kimi, OpenAI puis Claude ; en texte seul, DeepSeek d'abord (le
// moins cher, comme la relève de Léo), puis Kimi, OpenAI, Claude.
// Avec un `schema` (à la manière de Google), la réponse est validée comme le
// ferait responseSchema : un modèle qui s'en écarte passe la main au suivant.
export type OptionsGenerer = {
  fn: string | null; // le nom dans ai_usage (null : la fonction n'a pas de nom autorisé)
  systeme?: string;
  contenu: Morceau[];
  schema?: unknown;
  json?: boolean; // JSON attendu sans schéma (un tableau, par exemple)
  maxSortie?: number;
  delaiMs?: number;
};
export type Genere = { texte: string; obj?: unknown; modele: string } | { erreur: string };

export async function relaisGenerer(o: OptionsGenerer): Promise<Genere> {
  const avecImages = o.contenu.some((m) => 'image' in m);
  const liste: Array<Fournisseur | 'an'> = [];
  if (!avecImages) { const d = deepseek(); if (d) liste.push(d); }
  const k = kimi(); if (k) liste.push(k);
  const g = openai(); if (g) liste.push(g);
  if (anthropicCle()) liste.push('an');
  if (!liste.length) return { erreur: 'aucun relais configuré' };

  const schemaJson = o.schema ? versJsonSchema(o.schema) : null;
  const consigneJson = schemaJson
    ? `\n\nRéponds UNIQUEMENT par du JSON valide conforme à ce schéma (JSON Schema), sans texte autour ni balises de code. Les valeurs de « enum » sont les SEULES permises :\n${JSON.stringify(schemaJson)}`
    : o.json ? '\n\nRéponds UNIQUEMENT par du JSON valide, sans texte autour ni balises de code.' : '';
  const systeme = (o.systeme ?? '') + consigneJson;
  const maxSortie = Math.max(o.maxSortie ?? 2048, 1024);
  const delaiMs = o.delaiMs ?? 45_000;
  // JSON imposé côté serveur seulement quand on attend un OBJET : ce mode
  // refuse les tableaux, que la modération attend.
  const objetAttendu = String((schemaJson as Json | null)?.type ?? '') === 'object';

  let cout = 0;
  let derniere = 'aucun relais joignable';
  try {
    for (const f of liste) {
      const nom = f === 'an' ? `an:${anthropicModele()}` : `${f.nom}:${f.modele}`;
      try {
        let texte: string;
        if (f === 'an') {
          const contenu = o.contenu.map((m) => 'image' in m
            ? { type: 'image', source: { type: 'base64', media_type: m.image.mime, data: m.image.data } }
            : { type: 'text', text: m.texte });
          const r = await appelAnthropic(systeme, contenu, maxSortie, delaiMs);
          cout += r.cout; texte = r.texte;
        } else {
          const contenu = avecImages
            ? o.contenu.map((m) => 'image' in m ? { type: 'image_url', image_url: { url: dataUrl(m.image) } } : { type: 'text', text: m.texte })
            : o.contenu.map((m) => (m as { texte: string }).texte).join('\n');
          const r = await appelOpenAI(f, {
            // Une marge au-dessus de la limite de Google : ce que Gemini
            // écrivait en 1 024 jetons peut en prendre un peu plus ailleurs.
            max_tokens: maxSortie + 1024,
            ...(objetAttendu ? { response_format: { type: 'json_object' } } : {}),
            messages: [...(systeme ? [{ role: 'system', content: systeme }] : []), { role: 'user', content: contenu }],
          }, delaiMs);
          cout += r.cout;
          if (r.finish === 'length') throw new Error('réponse coupée (trop longue)');
          texte = String(r.message.content ?? '').trim();
        }
        if (!texte) throw new Error('réponse vide');
        if (!schemaJson && !o.json) return { texte, modele: nom };
        const obj = extraireJson(texte);
        const faute = schemaJson ? conforme(obj, schemaJson) : null;
        if (faute) throw new Error(`hors schéma (${faute})`);
        return { texte: JSON.stringify(obj), obj, modele: nom };
      } catch (e) {
        derniere = `${nom}: ${(e as Error).message}`;
        console.error('relais:', derniere);
        if (f !== 'an') await surErreur(f, derniere);
      }
    }
    return { erreur: derniere };
  } finally {
    await noterCout(o.fn, cout);
  }
}

// Pour les fonctions qui fabriquent déjà une requête Gemini
// (generateContent) : la même requête, rejouée par le relais, et une réponse
// rendue sous la forme de Google — le code qui lit la réponse ne change pas.
// Rend null si le relais n'a pas pu répondre, ou si la requête contient de
// l'audio (personne ne l'écoute en relais).
export async function relaisDepuisGemini(corps: Json, o: { fn: string | null; delaiMs?: number }): Promise<Json | null> {
  const systeme = (((corps.systemInstruction as Json | undefined)?.parts as Json[] | undefined) ?? [])
    .map((p) => String(p.text ?? '')).filter(Boolean).join('\n');
  const contenu: Morceau[] = [];
  for (const c of (corps.contents as Json[] | undefined) ?? []) {
    for (const p of (c.parts as Json[] | undefined) ?? []) {
      if (typeof p.text === 'string') { if (!p.thought) contenu.push({ texte: p.text }); continue; }
      const d = (p.inlineData ?? p.inline_data) as Json | undefined;
      if (!d) continue;
      const mime = String(d.mimeType ?? d.mime_type ?? '');
      if (!mime.startsWith('image/')) { console.error('relais: pièce non lisible en relais', mime); return null; }
      contenu.push({ image: { mime, data: String(d.data ?? '') } });
    }
  }
  if (!contenu.length) return null;
  const gc = (corps.generationConfig ?? {}) as Json;
  const r = await relaisGenerer({
    fn: o.fn,
    systeme,
    contenu,
    schema: gc.responseSchema,
    json: gc.responseMimeType === 'application/json',
    maxSortie: typeof gc.maxOutputTokens === 'number' ? gc.maxOutputTokens : undefined,
    delaiMs: o.delaiMs,
  });
  if ('erreur' in r) { console.error('relais: échec', r.erreur); return null; }
  console.log('relais: réponse de', r.modele, 'à la place de Google');
  return { candidates: [{ content: { role: 'model', parts: [{ text: r.texte }] }, finishReason: 'STOP' }], relais: r.modele };
}

// ——— 2. Converser avec des outils (Finia) ———
//
// Les outils déclarés pour Gemini (functionDeclarations), traduits au format
// OpenAI. La logique de chaque outil ne change pas : c'est le même code qui
// les exécute (`executer`), quel que soit le modèle qui les demande.
export function outilsOpenAI(declarations: OutilGemini[]): Json[] {
  return declarations.map((d) => ({
    type: 'function',
    function: {
      name: d.name,
      ...(d.description ? { description: d.description } : {}),
      parameters: versJsonSchema(d.parameters ?? { type: 'OBJECT', properties: {} }),
    },
  }));
}

// Ce qu'on met à la place d'une pièce que le modèle ne peut pas lire. Dit
// honnêtement — jamais « j'ai bien vu ta photo » quand on ne l'a pas vue.
export const NOTE_IMAGE = "[La personne a joint une photo, mais tu ne peux pas la voir en ce moment. Ne prétends pas l'avoir vue : dis-le simplement et demande-lui de décrire ce qu'elle montre.]";
export const NOTE_AUDIO = "[La personne a envoyé un message vocal, mais tu ne peux pas l'écouter en ce moment. Ne prétends pas l'avoir entendu et n'invente pas son contenu : dis-lui honnêtement, en une ou deux phrases, que tu n'as pas pu écouter son vocal, et demande-lui de l'écrire.]";

// L'historique au format Gemini -> les messages au format OpenAI.
// - un tour « model » : son texte, et ses functionCall en tool_calls ;
// - un tour « user » : ses functionResponse deviennent des messages « tool »
//   (appariés dans l'ordre aux appels du tour d'avant), le reste un message
//   « user » — les images en image_url si le modèle les lit, sinon une note.
export function messagesOpenAI(systeme: string, contents: Json[], o: { images: boolean }): Json[] {
  const messages: Json[] = [{ role: 'system', content: systeme }];
  let appelsPrecedents: Array<{ id: string; name: string }> = [];
  contents.forEach((c, i) => {
    const parts = (c.parts as Json[] | undefined) ?? [];
    if (c.role === 'model') {
      const texte = parts.filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text as string).join('');
      const appels = parts.filter((p) => p.functionCall || p.function_call).map((p, j) => {
        const fc = (p.functionCall ?? p.function_call) as { id?: string; name: string; args?: Json };
        return { id: fc.id || `appel_${i}_${j}`, type: 'function', function: { name: fc.name, arguments: JSON.stringify(fc.args ?? {}) } };
      });
      appelsPrecedents = appels.map((a) => ({ id: a.id, name: a.function.name }));
      if (appels.length) messages.push({ role: 'assistant', content: texte, tool_calls: appels });
      else messages.push({ role: 'assistant', content: texte });
      return;
    }
    const reponses = parts.filter((p) => p.functionResponse || p.function_response);
    reponses.forEach((p, j) => {
      const fr = (p.functionResponse ?? p.function_response) as { id?: string; name: string; response?: unknown };
      const appel = appelsPrecedents.find((a) => a.id === fr.id) ?? appelsPrecedents.find((a) => a.name === fr.name) ?? appelsPrecedents[0];
      messages.push({ role: 'tool', tool_call_id: appel?.id ?? `appel_${i}_${j}`, name: fr.name, content: JSON.stringify(fr.response ?? {}).slice(0, 20_000) });
      if (appel) appelsPrecedents = appelsPrecedents.filter((a) => a !== appel);
    });
    const morceaux: Json[] = [];
    for (const p of parts) {
      if (p.functionResponse || p.function_response) continue;
      if (typeof p.text === 'string') { morceaux.push({ type: 'text', text: p.text }); continue; }
      const d = (p.inlineData ?? p.inline_data) as Json | undefined;
      if (!d) continue;
      const mime = String(d.mimeType ?? d.mime_type ?? '');
      if (mime.startsWith('image/') && o.images) morceaux.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${d.data}` } });
      else morceaux.push({ type: 'text', text: mime.startsWith('audio/') ? NOTE_AUDIO : NOTE_IMAGE });
    }
    if (!morceaux.length) return;
    const seulementTexte = morceaux.every((m) => m.type === 'text');
    messages.push({ role: 'user', content: seulementTexte ? morceaux.map((m) => m.text).join('\n') : morceaux });
  });
  return messages;
}

// Passer d'un modèle à l'autre en cours de conversation : ce que le suivant
// ne sait pas lire est remplacé par une note, et la réflexion propre au
// précédent est retirée.
function pourFournisseur(messages: Json[], f: Fournisseur): Json[] {
  return messages.map((m) => {
    const { reasoning_content: _r, ...reste } = m;
    if (!f.images && Array.isArray(reste.content)) {
      reste.content = (reste.content as Json[]).map((c) => c.type === 'image_url' ? NOTE_IMAGE : String(c.text ?? '')).join('\n');
    }
    // Kimi veut le nom de l'outil sur chaque réponse d'outil ; DeepSeek et
    // OpenAI ne l'attendent pas (format OpenAI strict).
    if (reste.role === 'tool' && !f.kimi) delete reste.name;
    return reste;
  });
}

export type OptionsConversation = {
  fn: string | null;
  systeme: string;
  contents: Json[]; // l'historique au format Gemini, tel qu'il allait partir chez Google
  declarations: OutilGemini[];
  executer: (nom: string, args: Json) => Promise<unknown>;
  maxTours?: number;
  maxSortie?: number;
  delaiMs?: number;
};

// Kimi d'abord (il lit les photos), OpenAI ensuite (photos aussi), DeepSeek
// en dernier (texte seul). Un outil
// déjà exécuté ne l'est jamais deux fois : si Kimi tombe en plein milieu,
// DeepSeek reprend la MÊME conversation, résultats d'outils compris — un
// message envoyé à une boutique ne part pas en double.
export async function relaisConversation(o: OptionsConversation): Promise<{ texte: string; modele: string } | { erreur: string }> {
  const liste = [kimi(), openai(), deepseek()].filter(Boolean) as Fournisseur[];
  if (!liste.length) return { erreur: 'aucun relais configuré' };
  const tools = outilsOpenAI(o.declarations);
  const maxTours = o.maxTours ?? 4;
  const delaiMs = o.delaiMs ?? 40_000;
  let messages: Json[] | null = null;
  let tours = 0;
  let cout = 0;
  let derniere = 'aucun relais joignable';
  try {
    for (const f of liste) {
      const nom = `${f.nom}:${f.modele}`;
      messages = messages ? pourFournisseur(messages, f) : pourFournisseur(messagesOpenAI(o.systeme, o.contents, { images: f.images }), f);
      try {
        for (;;) {
          // Plus de tours d'outils permis : on lui demande de répondre avec ce
          // qu'il a (le même garde-fou que MAX_TOOL_ROUNDS chez Google).
          const dernierTour = tours >= maxTours;
          const r = await appelOpenAI(f, {
            messages, tools, tool_choice: dernierTour ? 'none' : 'auto', max_tokens: (o.maxSortie ?? 3072) + 1024,
          }, delaiMs);
          cout += r.cout;
          const appels = (r.message.tool_calls as Array<{ id: string; function: { name: string; arguments?: string } }> | undefined) ?? [];
          if (!appels.length || dernierTour) {
            const texte = String(r.message.content ?? '').trim();
            if (!texte) throw new Error(`réponse vide (${r.finish})`);
            return { texte, modele: nom };
          }
          tours++;
          messages.push({
            role: 'assistant', content: r.message.content ?? '', tool_calls: appels,
            ...(r.message.reasoning_content ? { reasoning_content: r.message.reasoning_content } : {}),
          });
          for (const a of appels) {
            let args: Json = {};
            try { args = a.function.arguments ? JSON.parse(a.function.arguments) : {}; } catch { /* arguments illisibles : l'outil dira ce qui manque */ }
            let resultat: unknown;
            try { resultat = await o.executer(a.function.name, args); } catch (e) { resultat = { error: (e as Error).message }; }
            messages.push({ role: 'tool', tool_call_id: a.id, ...(f.kimi ? { name: a.function.name } : {}), content: JSON.stringify(resultat ?? {}).slice(0, 20_000) });
          }
        }
      } catch (e) {
        derniere = `${nom}: ${(e as Error).message}`;
        console.error('relais:', derniere);
        await surErreur(f, derniere);
      }
    }
    return { erreur: derniere };
  } finally {
    await noterCout(o.fn, cout);
  }
}

// ——— 3. Transcrire un vocal (OpenAI) ———
//
// Beau, 24/09 : « si Gemini ne donne pas les messages vocaux, OpenAI peut ;
// entraînons aussi ça ». Vérifié à la source le 24/09
// (developers.openai.com : guide « speech to text » et référence
// « Create transcription ») : POST /v1/audio/transcriptions en
// multipart/form-data (champs file et model) ; formats flac, mp3, mp4, mpeg,
// mpga, m4a, ogg, wav, webm ; 25 Mo au plus ; réponse JSON avec `text`.
// Le format se lit au nom du fichier : on lui donne donc la bonne extension.
// gpt-4o-mini-transcribe d'abord (le moins cher), whisper-1 en repli.
const EXTENSIONS_AUDIO: Record<string, string> = {
  'audio/webm': 'webm', 'video/webm': 'webm', 'audio/ogg': 'ogg', 'audio/opus': 'ogg',
  'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'video/mp4': 'mp4',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mpga': 'mpga',
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/flac': 'flac', 'audio/x-flac': 'flac',
};
const MAX_AUDIO = 25 * 1024 * 1024;

function octetsDe(donnees: Uint8Array | string): Uint8Array {
  if (typeof donnees !== 'string') return donnees;
  const bin = atob(donnees);
  const o = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
  return o;
}

export async function transcrire(
  audio: { mime: string; donnees: Uint8Array | string }, // octets, ou base64 sans préfixe
  o: { fn: string | null; delaiMs?: number },
): Promise<{ texte: string; modele: string } | { erreur: string }> {
  const cle = cleOpenAI();
  if (!cle) return { erreur: 'pas de clé OpenAI' };
  const mime = audio.mime.split(';')[0].trim().toLowerCase();
  const ext = EXTENSIONS_AUDIO[mime];
  if (!ext) return { erreur: `format audio non pris en charge (${mime})` };
  const octets = octetsDe(audio.donnees);
  if (!octets.length) return { erreur: 'vocal vide' };
  if (octets.length > MAX_AUDIO) return { erreur: 'vocal trop long (plus de 25 Mo)' };
  let derniere = 'transcription impossible';
  for (const modele of ['gpt-4o-mini-transcribe', 'whisper-1']) {
    try {
      const form = new FormData();
      form.append('file', new Blob([octets], { type: mime }), `vocal.${ext}`);
      form.append('model', modele);
      form.append('response_format', 'json');
      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cle}` },
        body: form,
        signal: AbortSignal.timeout(o.delaiMs ?? 45_000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
      const body = await resp.json();
      // Le prix est à la minute. La durée vient de la réponse quand elle la
      // donne (usage.seconds) ; sinon on l'estime au débit le plus bas d'une
      // voix compressée (16 kbit/s, 2 Ko par seconde) : on surestime plutôt
      // qu'on ne sous-compte.
      const secondes = Number(body?.usage?.seconds ?? body?.duration ?? 0) || octets.length / 2000;
      await noterCout(o.fn, (secondes / 60) * (PRIX_TRANSCRIPTION[modele] ?? 0) * USD_EN_EUR);
      const texte = String(body?.text ?? '').trim();
      if (!texte) throw new Error('transcription vide');
      console.log('relais: vocal transcrit par', modele);
      return { texte, modele: `oa:${modele}` };
    } catch (e) {
      derniere = `oa:${modele}: ${(e as Error).message}`;
      console.error('relais:', derniere);
      await surErreur({ nom: 'oa' }, derniere);
    }
  }
  return { erreur: derniere };
}
