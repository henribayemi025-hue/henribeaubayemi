// LEGION — les agents s'équipent de compétences (chantier 2, étapes A et B).
//
// Beau, 22/09: « des agents qui s'améliorent… qui prennent des skills sur
// GitHub ». Voir docs/LEGION-COMPETENCES.md.
//
// Deux actions:
//   - « equiper »: attacher UNE compétence du catalogue à UN agent. Le texte
//     de la fiche (SKILL.md) est lu à sa source, sur GitHub, et gardé.
//   - « choisir »: chaque agent (ou un seul) choisit lui-même ses trois
//     compétences dans le catalogue, selon son poste et son mandat, et dit
//     pourquoi. Un message dans son salon le raconte.
//
// Le catalogue est en anglais et les postes en français: on ne trie donc pas
// par mots-clés, on donne au modèle la liste entière (571 lignes courtes,
// quelques centimes pour toute une équipe) et il choisit.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
const PAR_APPEL = 4;           // agents traités par appel: au-delà, l'écran relance
const PAR_AGENT = 3;           // compétences choisies par agent
const TAILLE_MAX = 20_000;     // caractères gardés d'une fiche
const TIMEOUT_MS = 30_000;
const LICENCES_LIBRES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', 'Unlicense'];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev') || host.endsWith('.workers.dev')) return true;
  return false;
}
function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

type Fiche = { cle: string; nom: string; description: string | null; categorie: string | null; source_repo: string; source_chemin: string; licence: string | null };
type Agent = { id: string; nom: string; poste: string; departement: string | null; mandat: string | null; personnalite: string | null; canal_id?: string };

// Lire la fiche à sa source. Si GitHub ne répond pas, on garde au moins la
// description: l'agent sait de quoi il s'agit, et on réessaiera plus tard.
async function lireFiche(f: Fiche): Promise<string | null> {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${f.source_repo}/HEAD/${f.source_chemin}`, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) { console.error('fiche', f.cle, r.status); return null; }
    return (await r.text()).slice(0, TAILLE_MAX);
  } catch (e) { console.error('fiche', f.cle, (e as Error).message); return null; }
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    choix: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { cle: { type: 'STRING' }, pourquoi: { type: 'STRING' } }, required: ['cle', 'pourquoi'] },
    },
  },
  required: ['choix'],
};

async function choisirPour(apiKey: string, a: Agent, entreprise: { nom: string; projet: string | null }, liste: string, dejaCles: string[]):
  Promise<Array<{ cle: string; pourquoi: string }> | { erreur: string }> {
  const invite = `Tu es ${a.nom}, ${a.poste}${a.departement ? ` (département ${a.departement})` : ''} chez « ${entreprise.nom} ».
${entreprise.projet ? `Le projet: ${entreprise.projet}\n` : ''}Ton mandat: ${a.mandat || 'faire ton métier.'}

Voici le catalogue des compétences (fiches de savoir-faire d'experts), une par ligne: clé | catégorie | description.
${liste}

Choisis les ${PAR_AGENT} compétences qui te rendraient le plus utile dans TON travail chez « ${entreprise.nom} ». Pas celles qui font joli: celles dont tu te servirais cette semaine.
${dejaCles.length ? `Tu as déjà: ${dejaCles.join(', ')}. N'en reprends pas.\n` : ''}Pour chacune: sa clé EXACTE telle qu'écrite dans la liste, et en une phrase courte en français, ce que tu vas en faire.`;
  let derniere = 'aucun modèle joignable';
  for (const model of MODELS) {
    try {
      const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: invite }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!r.ok) { derniere = `${model}: HTTP ${r.status}`; continue; }
      const b = await r.json();
      const txt = b?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      const obj = JSON.parse(txt);
      if (Array.isArray(obj.choix)) return obj.choix.slice(0, PAR_AGENT);
      derniere = `${model}: réponse sans choix`;
    } catch (e) { derniere = `${model}: ${(e as Error).message}`; }
  }
  return { erreur: derniere };
}

Deno.serve(compter('legion_competences', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
  let corps: { action?: string; entreprise_id?: string; agent_id?: string; catalogue_cle?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if (!corps.entreprise_id) return json({ erreur: 'Entreprise manquante.' }, 400);

  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await personne.auth.getUser();
  const { data: entreprise } = await personne.from('legion_entreprises').select('id, nom, projet').eq('id', corps.entreprise_id).maybeSingle();
  if (!entreprise || !user) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);

  // Le plafond du mois (compteur de dépense): au-delà, on ne rappelle plus Gemini.
  pourEntreprise(entreprise.id);
  {
    const p = await plafondAtteint(entreprise.id);
    if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € dépensés sur ${p.plafond} €. Tu peux le monter sur l'accueil de Léo.` });
  }

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  async function poser(a: Agent, f: Fiche, par: 'fondateur' | 'agent', pourquoi: string | null) {
    if (f.licence && !LICENCES_LIBRES.includes(f.licence)) return { erreur: `licence ${f.licence} non libre` };
    const contenu = await lireFiche(f);
    const { error } = await service.from('legion_competences').upsert({
      entreprise_id: entreprise!.id, agent_id: a.id, catalogue_cle: f.cle, nom: f.nom, description: f.description,
      contenu, source_repo: f.source_repo, source_chemin: f.source_chemin, licence: f.licence,
      ajoutee_par: par, pourquoi, actif: true,
    }, { onConflict: 'agent_id,catalogue_cle' });
    return error ? { erreur: error.message } : { ok: true, lue: !!contenu };
  }

  const agentsReq = service.from('legion_agents').select('id, nom, poste, departement, mandat, personnalite')
    .eq('entreprise_id', entreprise.id).is('user_id', null).neq('moteur', 'claude-code');

  // --- Équiper un agent d'une compétence précise --------------------------
  if (corps.action === 'equiper') {
    if (!corps.agent_id || !corps.catalogue_cle) return json({ erreur: 'Agent ou compétence manquant.' }, 400);
    const { data: a } = await agentsReq.eq('id', corps.agent_id).maybeSingle();
    // Une même clé peut exister dans deux dépôts: on prend la première.
    const { data: lignes } = await service.from('studio_catalogue').select('cle, nom, description, categorie, source_repo, source_chemin, licence')
      .eq('cle', corps.catalogue_cle).eq('genre', 'skill').order('source_repo').limit(1);
    const f = lignes?.[0];
    if (!a || !f) return json({ erreur: 'Agent ou compétence introuvable.' }, 404);
    return json(await poser(a as Agent, f as Fiche, 'fondateur', null));
  }

  // --- Que chaque agent choisisse ses compétences ------------------------
  if (corps.action === 'choisir') {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
    const { data: tous } = corps.agent_id ? await agentsReq.eq('id', corps.agent_id) : await agentsReq.order('ordre');
    const { data: deja } = await service.from('legion_competences').select('agent_id, catalogue_cle').eq('entreprise_id', entreprise.id).eq('actif', true);
    const parAgent = new Map<string, string[]>();
    for (const d of deja || []) parAgent.set(d.agent_id, [...(parAgent.get(d.agent_id) || []), d.catalogue_cle]);
    // Sans agent précis: seulement ceux qui n'ont encore rien.
    const aFaire = ((tous || []) as Agent[]).filter((a) => corps.agent_id || !parAgent.has(a.id));
    const lot = aFaire.slice(0, PAR_APPEL);
    if (!lot.length) return json({ faits: 0, restants: 0, message: 'Tout le monde est équipé.' });

    const { data: cat } = await service.from('studio_catalogue')
      .select('cle, nom, description, categorie, source_repo, source_chemin, licence').eq('genre', 'skill');
    const fiches = new Map(((cat || []) as Fiche[]).map((f) => [f.cle, f]));
    const liste = ((cat || []) as Fiche[]).map((f) => `${f.cle} | ${f.categorie || ''} | ${(f.description || '').replace(/\s+/g, ' ').slice(0, 140)}`).join('\n');

    // Le salon où raconter: celui du département de l'agent, sinon Direction.
    const { data: salons } = await service.from('legion_canaux').select('id, nom').eq('entreprise_id', entreprise.id).is('prive_entre', null);
    const salonDe = (a: Agent) => (salons || []).find((s) => s.nom === a.departement) || (salons || []).find((s) => /direction/i.test(s.nom));

    let faits = 0;
    let pourquoi = '';
    await Promise.all(lot.map(async (a) => {
      const r = await choisirPour(apiKey, a, entreprise, liste, parAgent.get(a.id) || []);
      if ('erreur' in r) { pourquoi = pourquoi || r.erreur; return; }
      const pris: string[] = [];
      for (const c of r) {
        const f = fiches.get(String(c.cle).trim());
        if (!f) continue; // une clé inventée ne passe pas
        const res = await poser(a, f, 'agent', String(c.pourquoi || '').slice(0, 240));
        if ('ok' in res) pris.push(`• ${f.nom} — ${String(c.pourquoi || '').slice(0, 160)}`);
      }
      if (!pris.length) { pourquoi = pourquoi || `${a.nom}: aucune clé valable`; return; }
      faits += 1;
      const s = salonDe(a);
      if (s) {
        await service.from('legion_messages').insert({
          entreprise_id: entreprise.id, canal_id: s.id, auteur_id: a.id, user_id: null, genre: 'info',
          texte: `Je me suis équipé de ${pris.length === 1 ? 'cette compétence' : 'ces compétences'} :\n${pris.join('\n')}`,
          meta: { par_ia: true, competences: true },
        });
      }
    }));
    // L'écran relance tant qu'il en reste et que le lot a avancé; un lot sans
    // aucun succès s'arrête avec la raison, au lieu de tourner en rond.
    return json({ faits, restants: corps.agent_id ? 0 : aFaire.length - faits, ...(faits === 0 && pourquoi ? { pourquoi } : {}) });
  }

  return json({ erreur: 'Action inconnue.' }, 400);
}));
