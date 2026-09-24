// ATELIER-MODELE — la traduction Anthropic ⇄ format OpenAI (24/09).
//
// L'atelier parle le format chat/completions d'OpenAI (messages, tools,
// tool_calls), que DeepSeek, Kimi, Gemini et OpenAI acceptent tous. Claude
// ne le parle pas : l'API Messages d'Anthropic a son propre format (consigne
// à part, blocs tool_use / tool_result). On traduit donc ici, dans les deux
// sens, pour que le Worker reçoive une réponse qu'il lit EXACTEMENT comme
// celle des autres — il n'a rien à savoir de Claude.
//
// Aucune dépendance (ni Deno ni réseau) : ce fichier est essayé tel quel
// par les tests du Worker (atelier/test/relais.test.js).

type Json = Record<string, unknown>;
type Bloc = Json & { type: string };
type MessageAnthropic = { role: 'user' | 'assistant'; content: Bloc[] };

function texteDe(contenu: unknown): string {
  if (typeof contenu === 'string') return contenu;
  if (Array.isArray(contenu)) return contenu.map((p) => (p && typeof p === 'object' && typeof (p as Json).text === 'string' ? (p as Json).text as string : '')).join('');
  return contenu == null ? '' : String(contenu);
}

// Le contenu d'un message « user » d'OpenAI : du texte, ou des morceaux
// (texte, image en data:…;base64 — une adresse http n'est pas reprise).
function blocsUtilisateur(contenu: unknown): Bloc[] {
  if (!Array.isArray(contenu)) {
    const t = texteDe(contenu);
    return t ? [{ type: 'text', text: t }] : [];
  }
  const blocs: Bloc[] = [];
  for (const p of contenu as Json[]) {
    if (p?.type === 'text' && typeof p.text === 'string' && p.text) blocs.push({ type: 'text', text: p.text });
    if (p?.type === 'image_url') {
      const url = String((p.image_url as Json)?.url || '');
      const m = /^data:([^;]+);base64,(.+)$/s.exec(url);
      if (m) blocs.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
    }
  }
  return blocs;
}

function argumentsDe(texte: unknown): Json {
  if (texte && typeof texte === 'object') return texte as Json;
  try {
    const v = JSON.parse(String(texte || '{}'));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

// OpenAI → Anthropic. `nom` : l'identifiant du modèle chez Anthropic.
export function versAnthropic(corps: Json, nom: string): Json {
  const systeme: string[] = [];
  const messages: MessageAnthropic[] = [];
  // Anthropic veut une alternance user / assistant : deux messages de même
  // rôle qui se suivent sont fondus en un (c'est le cas des résultats de
  // plusieurs outils, qui doivent tous arriver dans le MÊME message user).
  const pousser = (role: 'user' | 'assistant', blocs: Bloc[]) => {
    if (!blocs.length) return;
    const dernier = messages.at(-1);
    if (dernier && dernier.role === role) dernier.content.push(...blocs);
    else messages.push({ role, content: blocs });
  };
  for (const m of (Array.isArray(corps.messages) ? corps.messages : []) as Json[]) {
    if (m?.role === 'system' || m?.role === 'developer') {
      const t = texteDe(m.content);
      if (t) systeme.push(t);
    } else if (m?.role === 'user') {
      pousser('user', blocsUtilisateur(m.content));
    } else if (m?.role === 'assistant') {
      const blocs: Bloc[] = [];
      const t = texteDe(m.content);
      // Anthropic refuse un bloc de texte vide.
      if (t.trim()) blocs.push({ type: 'text', text: t });
      for (const a of (Array.isArray(m.tool_calls) ? m.tool_calls : []) as Json[]) {
        const f = (a?.function || {}) as Json;
        blocs.push({ type: 'tool_use', id: String(a?.id || ''), name: String(f.name || ''), input: argumentsDe(f.arguments) });
      }
      pousser('assistant', blocs);
    } else if (m?.role === 'tool') {
      pousser('user', [{ type: 'tool_result', tool_use_id: String(m.tool_call_id || ''), content: texteDe(m.content) || '(vide)' }]);
    }
  }
  // La conversation doit commencer par un message de la personne.
  if (messages[0]?.role === 'assistant') messages.unshift({ role: 'user', content: [{ type: 'text', text: '(suite de la conversation)' }] });

  const outils = (Array.isArray(corps.tools) ? corps.tools : []) as Json[];
  const tools = outils.map((o) => {
    const f = (o?.function || {}) as Json;
    return { name: String(f.name || ''), ...(f.description ? { description: String(f.description) } : {}), input_schema: (f.parameters as Json) || { type: 'object', properties: {} } };
  }).filter((o) => o.name);

  const rendu: Json = {
    model: nom,
    max_tokens: Number(corps.max_tokens ?? corps.max_completion_tokens ?? 8192),
    messages,
  };
  if (systeme.length) rendu.system = systeme.join('\n\n');
  if (typeof corps.temperature === 'number') rendu.temperature = Math.min(1, Math.max(0, corps.temperature));
  if (Array.isArray(corps.stop)) rendu.stop_sequences = corps.stop;
  else if (typeof corps.stop === 'string') rendu.stop_sequences = [corps.stop];
  if (tools.length) {
    rendu.tools = tools;
    const c = corps.tool_choice as unknown;
    if (c === 'none') rendu.tool_choice = { type: 'none' };
    else if (c === 'required') rendu.tool_choice = { type: 'any' };
    else if (c && typeof c === 'object' && ((c as Json).function as Json)?.name) rendu.tool_choice = { type: 'tool', name: String(((c as Json).function as Json).name) };
    else rendu.tool_choice = { type: 'auto' };
  }
  return rendu;
}

const FINS: Record<string, string> = { end_turn: 'stop', stop_sequence: 'stop', max_tokens: 'length', tool_use: 'tool_calls', refusal: 'content_filter', pause_turn: 'stop' };

// Anthropic → OpenAI : la réponse que le Worker sait lire (choices[0].message,
// finish_reason, usage).
export function depuisAnthropic(r: Json): Json {
  const blocs = (Array.isArray(r?.content) ? r.content : []) as Json[];
  const texte = blocs.filter((b) => b?.type === 'text').map((b) => String(b.text || '')).join('');
  const appels = blocs.filter((b) => b?.type === 'tool_use').map((b) => ({
    id: String(b.id || ''),
    type: 'function',
    function: { name: String(b.name || ''), arguments: JSON.stringify(b.input ?? {}) },
  }));
  const u = (r?.usage || {}) as Record<string, number>;
  const lu = Number(u.cache_read_input_tokens || 0);
  // L'entrée totale, comme OpenAI la compte : cache compris.
  const entree = Number(u.input_tokens || 0) + lu + Number(u.cache_creation_input_tokens || 0);
  const sortie = Number(u.output_tokens || 0);
  return {
    id: r?.id || null,
    object: 'chat.completion',
    model: r?.model || null,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: texte || (appels.length ? null : ''), ...(appels.length ? { tool_calls: appels } : {}) },
      finish_reason: FINS[String(r?.stop_reason)] || 'stop',
    }],
    usage: { prompt_tokens: entree, completion_tokens: sortie, total_tokens: entree + sortie, prompt_tokens_details: { cached_tokens: lu } },
  };
}
