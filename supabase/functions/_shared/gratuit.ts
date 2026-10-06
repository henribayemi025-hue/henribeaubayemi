// L'IA GRATUITE — Cloudflare Workers AI, par le Worker de finjaro.net
// (src/ia.js, /ia/chat/completions). Beau, 05/10 : « oui branche cloudflare
// gratuit », le matin où Gemini, DeepSeek, Kimi et OpenAI étaient tous à sec.
//
// Famille « cf:<alias> » du moteur (moteur.ts) et fournisseur « cf » du relais
// (relais.ts). Moins fort que les autres, mais il ne coûte rien — à une
// condition : rester sous la part gratuite du jour. Le compte Cloudflare est
// sur l'offre payante Workers (l'atelier en a besoin), donc au-delà de 10 000
// neurones par jour, Cloudflare FACTURERAIT. D'où la règle, sans exception :
// chaque appel réserve d'abord son pire cas dans la base
// (ia_gratuite_reserver, plafond 8 000) et ne part que si la réservation
// passe ; ce qui n'a pas servi est rendu ensuite.
//
// Coupé d'un mot : secret LEGION_IA_GRATUITE = « non ».

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { jetonsEstimes, neurones, NEURONES, SORTIE_MAX } from './gratuit-compte.ts';

type Json = Record<string, unknown>;

export const iaGratuiteActive = () => (Deno.env.get('LEGION_IA_GRATUITE') || '').toLowerCase() !== 'non';
const URL_IA = () => (Deno.env.get('IA_GRATUITE_URL') || 'https://finjaro.net/ia').replace(/\/$/, '');
export const MODELE_GRATUIT = () => Deno.env.get('LEGION_MODELE_CF') || 'gemma-4';

const service = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

let jeton: string | null = null;
async function lireJeton(): Promise<string> {
  if (jeton) return jeton;
  const { data, error } = await service().rpc('app_secret', { p_nom: 'ia_gratuite' });
  if (error || !data) throw new Error(`jeton ia_gratuite illisible${error ? ` (${error.message})` : ''}`);
  jeton = String(data);
  return jeton;
}

// Un appel au format Chat Completions d'OpenAI. Rend le corps de la réponse
// (choices, usage). Lève une erreur qui commence par « HTTP 402 » quand la
// part du jour est prise : le disjoncteur du moteur range alors toute la
// famille « cf » pour 15 minutes, comme un solde vide.
// Chaque application a sa part du jour (0232, Beau 06/10) : « leo » 6 000,
// « finia » 2 000, sous le total commun de 8 000. Tant que la migration 0232
// n'est pas passée, on retombe sur le compteur commun seul (0231).
export type AppGratuite = 'leo' | 'finia';
let parts: boolean | null = null;
async function reserver(sb: ReturnType<typeof service>, n: number, app: AppGratuite): Promise<boolean> {
  if (parts !== false) {
    const { data, error } = await sb.rpc('ia_gratuite_reserver_app', { p_neurones: n, p_app: app });
    if (!error) { parts = true; return !!data; }
    if (!/ia_gratuite_reserver_app|PGRST202|does not exist|not find/i.test(error.message)) throw new Error(`compteur de l'IA gratuite : ${error.message}`);
    parts = false;
  }
  const { data, error } = await sb.rpc('ia_gratuite_reserver', { p_neurones: n });
  if (error) throw new Error(`compteur de l'IA gratuite : ${error.message}`);
  return !!data;
}

export async function appelGratuit(corps: Json, delaiMs = 60_000, app: AppGratuite = 'leo'): Promise<Json> {
  if (!iaGratuiteActive()) throw new Error('HTTP 402 IA gratuite coupée (LEGION_IA_GRATUITE)');
  const alias = typeof corps.model === 'string' && NEURONES[corps.model] ? corps.model : MODELE_GRATUIT();
  const sortie = Math.max(1, Math.min(SORTIE_MAX, Number(corps.max_tokens ?? 2048) || 2048));
  const reserve = neurones(alias, jetonsEstimes(corps), sortie);
  if (!Number.isFinite(reserve)) throw new Error(`modèle gratuit inconnu : ${alias}`);

  const sb = service();
  const ok = await reserver(sb, reserve, app);
  if (!ok) throw new Error(`HTTP 402 part gratuite du jour épuisée pour ${app} (plafond Finjaro, remise à zéro à minuit UTC)`);

  // Sans réponse lisible, on garde la réservation entière : on ne sait pas
  // ce que Cloudflare a compté.
  let consomme = reserve;
  try {
    const resp = await fetch(`${URL_IA()}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await lireJeton()}` },
      body: JSON.stringify({ ...corps, model: alias, max_tokens: sortie }),
      signal: AbortSignal.timeout(delaiMs),
    });
    if (!resp.ok) {
      // Refusé avant de tourner (jeton, corps, part épuisée chez Cloudflare) :
      // rien n'a été consommé.
      if ([400, 401, 402, 404, 405].includes(resp.status)) consomme = 0;
      throw new Error(`HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`);
    }
    const body = await resp.json() as Json;
    const u = body.usage as Json | null | undefined;
    if (u && Number.isFinite(Number(u.prompt_tokens)) && Number.isFinite(Number(u.completion_tokens))) {
      consomme = neurones(alias, Number(u.prompt_tokens), Number(u.completion_tokens));
    }
    return body;
  } finally {
    const rendre = reserve - consomme;
    if (rendre > 0) {
      const { error: e } = parts
        ? await sb.rpc('ia_gratuite_rendre_app', { p_neurones: rendre, p_app: app })
        : await sb.rpc('ia_gratuite_rendre', { p_neurones: rendre });
      if (e) console.error('ia gratuite, rendre :', e.message);
    } else if (rendre < 0) {
      // L'estimation était trop basse : le surplus est inscrit quand même,
      // au-delà du plafond s'il le faut ; les appels suivants s'arrêtent
      // d'autant plus tôt grâce à la marge de 2 000. (Avant 0232, il passait
      // par ia_gratuite_reserver(-n), qui refuse les négatifs : jamais compté.)
      if (parts) {
        const { error: e } = await sb.rpc('ia_gratuite_inscrire_app', { p_neurones: -rendre, p_app: app });
        if (e) console.error('ia gratuite, surplus :', e.message);
      }
    }
  }
}
