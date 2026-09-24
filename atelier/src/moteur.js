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
//
// Le RELAIS SUPABASE (24/09 au soir) : Beau veut tous les modèles au choix
// sans recopier chaque clé dans Cloudflare. Les clés sont déjà dans les
// secrets de Supabase ; la fonction edge `atelier-modele` fait l'appel à
// notre place, avec le jeton Supabase de la personne (jamais une clé ici).
// - Une clé posée dans le Worker reste PRIORITAIRE : appel direct, comme avant.
// - Sinon, le modèle passe par le relais s'il le propose (modelesRelais).
// - Le relais rend la réponse du fournisseur telle quelle : la suite
//   (erreurs, usage, coût, plafond de session) ne change pas.
// - Le jeton vit une heure : s'il a expiré en plein travail, on le dit
//   clairement (« reconnecte-toi ») au lieu d'essayer tous les modèles.

export const FOURNISSEURS = {
  ds: { url: 'https://api.deepseek.com/chat/completions', cle: 'DEEPSEEK_API_KEY', nom: 'DeepSeek' },
  km: { url: 'https://api.moonshot.ai/v1/chat/completions', cle: 'KIMI_API_KEY', nom: 'Kimi' },
  gm: { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', cle: 'GEMINI_API_KEY', nom: 'Gemini' },
  // OpenAI (24/09) : la clé peut porter le nom que Beau lui donne (« Leo ») ;
  // on la reconnaît à sa forme « sk- » (voir cleDe).
  oa: { url: 'https://api.openai.com/v1/chat/completions', cle: 'OPENAI_API_KEY', nom: 'OpenAI' },
  // Claude (24/09) : SEULEMENT par le relais Supabase, qui traduit son
  // format (API Messages) dans celui d'OpenAI. Jamais d'appel direct : le
  // Worker ne saurait pas lire sa réponse.
  an: { url: null, cle: null, nom: 'Anthropic', relaisSeulement: true },
};

export const MODELES = ['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'gm:gemini-3.5-flash', 'gm:gemini-2.5-flash', 'gm:gemini-3.1-pro-preview', 'oa:gpt-6-astra', 'oa:gpt-6-sol', 'oa:gpt-5.4-mini', 'an:claude-sonnet-5'];
const AUTO_PAR_DEFAUT = ['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'km:kimi-k2.6', 'gm:gemini-3.5-flash'];

const fournisseur = (m) => FOURNISSEURS[String(m).split(':')[0]];
export const cleDe = (env, m) => {
  const f = fournisseur(m);
  if (!f || f.relaisSeulement) return null;
  if (env?.[f.cle]) return env[f.cle];
  if (String(m).startsWith('oa:')) {
    for (const nom of ['Leo', 'LEO', 'leo', 'Léo']) if (String(env?.[nom] || '').startsWith('sk-')) return env[nom];
  }
  return null;
};

// `relais` : les modèles que la fonction Supabase atelier-modele propose
// pour cette personne (modelesRelais) ; une clé du Worker suffit sinon.
export function disponibles(env, { geminiCoupe = false, relais = [] } = {}) {
  return MODELES.filter((m) => (cleDe(env, m) || relais.includes(m)) && !(geminiCoupe && m.startsWith('gm:')));
}

// ——— Le relais Supabase ———
export const MESSAGE_JETON = 'Ta connexion à Léo a expiré pendant le travail. Recharge la page (ou reconnecte-toi), puis relance ta demande : rien n\'est perdu.';

export function adresseRelais(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) return null;
  return `${String(env.SUPABASE_URL).replace(/\/$/, '')}/functions/v1/atelier-modele`;
}

function entetesRelais(env, jeton) {
  return { 'Content-Type': 'application/json', apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${jeton}` };
}

// Le jeton Supabase a-t-il expiré (ou expire-t-il dans les 30 s) ? Lu sans
// vérification de signature : c'est Supabase qui vérifie ; ici, on évite
// seulement un appel voué à l'échec. Illisible → on laisse Supabase juger.
export function jetonExpire(jeton, maintenant = Date.now(), marge = 30_000) {
  try {
    const partie = String(jeton).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = Number(JSON.parse(atob(partie + '='.repeat((4 - (partie.length % 4)) % 4))).exp);
    return Number.isFinite(exp) ? exp * 1000 <= maintenant + marge : false;
  } catch {
    return false;
  }
}

// Les modèles que le relais propose à cette personne : demandés une fois
// par jeton et gardés 5 minutes (30 s seulement après un échec, pour ne pas
// marteler Supabase). Un échec rend une liste vide : l'atelier retombe sur
// les clés du Worker, sans planter.
const cacheRelais = new Map(); // jeton → { modeles, expire }
export async function modelesRelais(env, jeton, fetchFn = fetch) {
  const adresse = adresseRelais(env);
  if (!adresse || !jeton || jetonExpire(jeton)) return [];
  const deja = cacheRelais.get(jeton);
  if (deja && deja.expire > Date.now()) return deja.modeles;
  let modeles = [];
  let duree = 30_000;
  try {
    const r = await fetchFn(adresse, { method: 'POST', headers: entetesRelais(env, jeton), body: JSON.stringify({ action: 'modeles' }), signal: AbortSignal.timeout(10_000) });
    if (r.ok) {
      const d = await r.json();
      modeles = (Array.isArray(d?.modeles) ? d.modeles : []).filter((m) => MODELES.includes(m));
      duree = 5 * 60_000;
    } else console.warn(`atelier : relais des modèles HTTP ${r.status}`);
  } catch (e) {
    console.warn(`atelier : relais des modèles injoignable (${e.message})`);
  }
  cacheRelais.set(jeton, { modeles, expire: Date.now() + duree });
  if (cacheRelais.size > 200) cacheRelais.delete(cacheRelais.keys().next().value);
  return modeles;
}

// L'ordre d'essai pour un choix donné (« auto » ou un modèle précis).
export function ordre(env, choix = 'auto', etat = {}) {
  const reglage = String(env?.ATELIER_MODELES || '').split(',').map((s) => s.trim()).filter((m) => MODELES.includes(m));
  const auto = (reglage.length ? reglage : AUTO_PAR_DEFAUT);
  const dispo = new Set(disponibles(env, etat));
  // Un modèle choisi, c'est CE modèle seulement, sans relais vers un autre
  // (Beau, 25/09 : « on dit qu'elle travaille seulement avec DeepSeek, pour
  // voir comment il fait »). S'il n'est pas joignable du tout, on retombe sur Auto.
  if (choix && choix !== 'auto' && MODELES.includes(choix) && dispo.has(choix)) return [choix];
  return auto.filter((m) => dispo.has(m));
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
// `jeton` : le jeton Supabase de la personne, pour le relais (clé absente
// du Worker). Il ne sert qu'à ça et ne va jamais dans le bac à sable.
export async function appeler({ modele, messages, outils, env, maxSortie = 8000, signal, fetchFn = fetch, jeton = null }) {
  const [prefixe, nom] = String(modele).split(/:(.+)/);
  const f = FOURNISSEURS[prefixe];
  const cle = cleDe(env, modele);
  const relais = !cle ? adresseRelais(env) : null;
  if (!f || (!cle && !relais)) throw new ErreurMoteur(`${modele} : clé absente`, { code: 'cle', modele });
  if (!cle && (!jeton || jetonExpire(jeton))) throw new ErreurMoteur(MESSAGE_JETON, { code: 'jeton', modele });
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
    r = cle
      ? await fetchFn(f.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        body: JSON.stringify(corps),
        signal,
      })
      : await fetchFn(relais, {
        method: 'POST',
        headers: entetesRelais(env, jeton),
        body: JSON.stringify({ action: 'appel', modele, corps }),
        signal,
      });
  } catch (e) {
    if (signal?.aborted) throw new ErreurMoteur('arrêté', { code: 'arret', modele });
    throw new ErreurMoteur(`${modele} : réseau (${e.message})`, { code: 'reseau', modele });
  }
  // Un refus du RELAIS lui-même (ou de la passerelle Supabase, qui refuse un
  // jeton expiré avant même la fonction) : il ne porte pas l'en-tête
  // « fournisseur ». Une réponse du fournisseur, elle, se lit comme d'habitude.
  if (!cle && !r.ok && r.headers.get('x-atelier-relais') !== 'fournisseur') {
    const texte = (await r.text().catch(() => '')).slice(0, 300);
    let d = null;
    try { d = JSON.parse(texte); } catch { /* pas du JSON */ }
    if (r.status === 401) throw new ErreurMoteur(MESSAGE_JETON, { code: 'jeton', modele });
    if (r.status === 403) throw new ErreurMoteur(`${modele} : le relais Supabase refuse l'accès (${d?.erreur || 'réservé'}).`, { code: 'acces', modele });
    if (r.status === 429 && d?.code === 'plafond_jour') throw new ErreurMoteur(d.erreur, { code: 'plafond_jour', modele });
    throw new ErreurMoteur(`${modele} : relais Supabase HTTP ${r.status} ${d?.erreur || texte}`, { code: 'relais', modele });
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
