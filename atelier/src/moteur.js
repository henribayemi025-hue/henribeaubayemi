// Le MOTEUR LÉGER de l'atelier : une version courte du moteur commun de Léo
// (supabase/functions/_shared/moteur.ts), portée dans le Worker.
//
// Pourquoi une copie et pas un appel à une fonction Supabase :
// - la boucle d'un agent de code enchaîne des dizaines d'appels et attend
//   parfois longtemps ; les fonctions Supabase ont 2 s de CPU par appel et
//   une durée plafonnée (plan, 1.3). Le Worker, lui, attend sans compter ;
// - une nouvelle fonction Supabase serait COMMUNE à staging et à la
//   production (CLAUDE.md §4) : la V0 n'en déploie aucune ;
// - les clés des modèles restent dans le Worker, qui appelle le modèle
//   lui-même, HORS du bac à sable.
//
// Même logique que le moteur commun :
// - « Auto » : DeepSeek rapide, puis DeepSeek fort, puis Kimi, puis Gemini
//   en dernier. Un modèle dont la clé manque est sauté ; Gemini est sauté
//   pour la journée dès qu'il répond « spending cap » (son plafond de
//   dépense, atteint le 24/09) : Auto marche sans lui.
// - Un modèle précis peut être choisi ; s'il tombe, la relève Auto prend
//   la suite.
// La différence : ici on parle le format « outils » compatible OpenAI
// (function calling), que DeepSeek, Kimi et Gemini acceptent tous les trois.

export const FOURNISSEURS = {
  ds: { url: 'https://api.deepseek.com/chat/completions', cle: 'DEEPSEEK_API_KEY', nom: 'DeepSeek' },
  km: { url: 'https://api.moonshot.ai/v1/chat/completions', cle: 'KIMI_API_KEY', nom: 'Kimi' },
  gm: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', cle: 'GEMINI_API_KEY', nom: 'Gemini' },
  // OpenAI (24/09) : la clé peut porter le nom que Beau lui donne (« Leo ») ;
  // on la reconnaît à sa forme « sk- » (voir cleDe).
  oa: { url: 'https://api.openai.com/v1/chat/completions', cle: 'OPENAI_API_KEY', nom: 'OpenAI' },
};

export const MODELES = ['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'gm:gemini-3.5-flash', 'gm:gemini-2.5-flash', 'gm:gemini-3.1-pro-preview', 'oa:gpt-6-astra', 'oa:gpt-6-sol', 'oa:gpt-5.4-mini'];
const AUTO_PAR_DEFAUT = ['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'gm:gemini-3.5-flash'];

const fournisseur = (m) => FOURNISSEURS[String(m).split(':')[0]];
export const cleDe = (env, m) => {
  const f = fournisseur(m);
  if (!f) return null;
  if (env?.[f.cle]) return env[f.cle];
  if (String(m).startsWith('oa:')) {
    for (const nom of ['Leo', 'LEO', 'leo', 'Léo']) if (String(env?.[nom] || '').startsWith('sk-')) return env[nom];
  }
  return null;
};

export function disponibles(env, { geminiCoupe = false } = {}) {
  return MODELES.filter((m) => cleDe(env, m) && !(geminiCoupe && m.startsWith('gm:')));
}

// L'ordre d'essai pour un choix donné (« auto » ou un modèle précis).
export function ordre(env, choix = 'auto', etat = {}) {
  const reglage = String(env?.ATELIER_MODELES || '').split(',').map((s) => s.trim()).filter((m) => MODELES.includes(m));
  const auto = (reglage.length ? reglage : AUTO_PAR_DEFAUT);
  const liste = choix && choix !== 'auto' && MODELES.includes(choix) ? [choix, ...auto.filter((m) => m !== choix)] : auto;
  const dispo = new Set(disponibles(env, etat));
  return liste.filter((m) => dispo.has(m));
}

export class ErreurMoteur extends Error {
  constructor(message, { code = 'http', modele = null } = {}) {
    super(message);
    this.code = code;
    this.modele = modele;
  }
}

// Chaque fournisseur reçoit une conversation qu'il accepte.
function preparer(messages, prefixe) {
  return messages.map((m) => {
    if (m.role !== 'assistant') return m;
    const { reasoning_content, ...reste } = m;
    // DeepSeek exige qu'on lui rende sa réflexion quand il a appelé des
    // outils (doc « thinking mode », lue le 24/09) ; les autres ne la veulent pas.
    return prefixe === 'ds' && reasoning_content ? { ...reste, reasoning_content } : reste;
  });
}

// UN appel à UN modèle. Rend { message, usage } ou lève une ErreurMoteur.
export async function appeler({ modele, messages, outils, env, maxSortie = 8000, signal, fetchFn = fetch }) {
  const [prefixe, nom] = String(modele).split(/:(.+)/);
  const f = FOURNISSEURS[prefixe];
  const cle = cleDe(env, modele);
  if (!f || !cle) throw new ErreurMoteur(`${modele} : clé absente`, { code: 'cle', modele });
  const corps = {
    model: nom,
    messages: preparer(messages, prefixe),
    // OpenAI (GPT-5/6) : max_completion_tokens, et pas d'autre température
    // que la sienne (24/09).
    ...(prefixe === 'oa'
      ? { max_completion_tokens: maxSortie }
      // Kimi K2.6 n'accepte que 1 (vu au banc de Léo le 24/09).
      : { max_tokens: maxSortie, temperature: prefixe === 'km' ? 1 : 0.3 }),
    ...(outils?.length ? { tools: outils, tool_choice: 'auto' } : {}),
  };
  // DeepSeek : réflexion coupée par défaut (plus rapide, coût prévisible) ;
  // ATELIER_REFLEXION=oui la rallume.
  if (prefixe === 'ds') corps.thinking = { type: env?.ATELIER_REFLEXION === 'oui' ? 'enabled' : 'disabled' };
  let r;
  try {
    r = await fetchFn(f.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
      body: JSON.stringify(corps),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw new ErreurMoteur('arrêté', { code: 'arret', modele });
    throw new ErreurMoteur(`${modele} : réseau (${e.message})`, { code: 'reseau', modele });
  }
  if (!r.ok) {
    const texte = (await r.text().catch(() => '')).slice(0, 300);
    let code = 'http';
    if (/spending cap/i.test(texte)) code = 'plafond_google';
    else if (r.status === 402 || /insufficient balance|exceeded your current quota/i.test(texte)) code = 'solde';
    throw new ErreurMoteur(`${modele} : HTTP ${r.status} ${texte}`, { code, modele });
  }
  const corpsRendu = await r.json();
  const choix = corpsRendu?.choices?.[0];
  const message = choix?.message;
  if (!message) throw new ErreurMoteur(`${modele} : réponse vide`, { code: 'vide', modele });
  return {
    message: {
      role: 'assistant',
      content: message.content ?? '',
      ...(message.tool_calls?.length ? { tool_calls: message.tool_calls } : {}),
      ...(message.reasoning_content ? { reasoning_content: message.reasoning_content } : {}),
    },
    fin: choix.finish_reason,
    usage: corpsRendu.usage || {},
  };
}
