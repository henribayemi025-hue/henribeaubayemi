// LEGION — un agent se fait faire sa vraie photo.
//
// Beau, 22/09: « ils peuvent même prendre de vraies images humanisées pour
// faire leurs photos hein. Vraiment, chacun est libre de choisir la photo
// qu'il veut. »
//
// Ce que je NE fais pas, et pourquoi: aller chercher la photo d'une vraie
// personne sur le web. C'est le visage de quelqu'un. La même règle que
// « aucune photo d'article prise sur le web » s'applique, en plus grave:
// un visage se reconnaît, et son propriétaire a des droits dessus. Un
// avatar volé, c'est une mise en demeure en attente.
//
// Ce que je fais à la place: l'agent DÉCRIT le visage qu'il veut, et on le
// FABRIQUE. Le résultat est photoréaliste, il n'appartient à personne
// d'autre, il vit dans notre propre rangement, et il est différent pour
// chacun. C'est exactement « chacun choisit sa photo », sans le visage d'un
// inconnu.
//
// ⚠️ CECI COÛTE DE L'ARGENT. Fabriquer une image se paie, contrairement à
// un dessin DiceBear qui est gratuit. D'où trois garde-fous:
//   - une photo par agent, jamais deux (on ne repaie pas ce qui est payé);
//   - un plafond par appel;
//   - c'est un bouton à part, qui dit que ça coûte. Beau décide.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cleOpenAI as lireCleOpenAI, compter, gemini, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteursSimples } from '../_shared/moteur.ts';
import { Image as Dessin } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

// Les portraits sortent du modèle en PNG d'environ 1,5 Mo (mesuré le 24/09) :
// trop lourd pour une liste d'agents sur un téléphone. On garde l'original
// (la photo « en grand ») et on sert partout une miniature JPEG 256 × 256
// d'une vingtaine de Ko (idée 134 des 200). La transformation d'images de
// Supabase n'est pas active sur ce projet (403) : on la fait ici.
async function miniature(octets: Uint8Array): Promise<Uint8Array | null> {
  try {
    const img = await Dessin.decode(octets);
    img.cover(256, 256);
    return await img.encodeJPEG(82);
  } catch (e) {
    console.error('miniature:', (e as Error).message);
    return null;
  }
}

const MODELES_IMAGE = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
const PROD_HOST = 'finjaro.net';
const LIMITE_MAX = 25;
const EN_PARALLELE = 3;
const TIMEOUT_MS = 60_000;

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

type Agent = { id: string; nom: string; poste: string; departement: string | null; mandat: string | null; personnalite: string | null };

// 1. L'agent décrit le visage qu'il veut. C'est LUI qui choisit: âge,
//    origine, coupe, tenue, expression. On ne lui impose rien.
function consigneDescription(a: Agent, entreprise: string): string {
  return `Tu es ${a.nom}, ${a.poste}${a.departement ? ` (${a.departement})` : ''} chez « ${entreprise} ».
${a.personnalite ? `Ton caractère: ${a.personnalite}` : ''}

On va faire ta photo de profil. Décris la photo que TU veux, en une seule
phrase en anglais, pour un photographe.

Tu es libre, complètement (Beau, 24/09: « ne les confine pas, rends-les
libres »): âge, genre, origine, coiffure, tenue, expression — et aussi le
décor, la lumière, l'ambiance, le cadrage. Un bureau, une rue, un atelier,
la plage, un fond uni: ce qui te ressemble, selon ton caractère. Pas le
cliché de ton métier. Deux collègues ne doivent pas se ressembler.

Réponds UNIQUEMENT par la phrase, sans guillemets, sans explication.
Exemple de forme: "a 34-year-old West African woman with short natural hair,
small gold earrings and a dark green blazer, laughing on a sunny rooftop terrace at golden hour".`;
}

// 2. La consigne du photographe: la photo que l'agent a décrite, telle
//    quelle. Seules limites: une personne qui n'existe pas, le visage bien
//    visible (c'est une photo de profil), ni texte ni logo.
function consignePhoto(description: string): string {
  return `Photograph of a fictional person who does not exist: ${description}.
Profile picture: the face is clearly visible and well lit, photorealistic, high detail, natural skin texture.
Do not include any text, watermark, logo or border. Do not depict any real or recognisable public figure.`;
}

// Par le moteur commun (24/09) : l'IA choisie par l'entreprise, DeepSeek
// d'abord en Auto — avant, Gemini seul, et rien quand Google coupait.
async function demanderTexte(apiKey: string, texte: string): Promise<string | null> {
  const r = await generer(apiKey, texte, { type: 'OBJECT', properties: { description: { type: 'STRING' } }, required: ['description'] },
    { modeles: moteursSimples(), temperature: 1.0, maxSortie: 400, reflexion: 0, delaiMs: 30_000 });
  if ('erreur' in r) { console.error('description:', r.erreur); return null; }
  const d = String(r.obj.description || '').trim().replace(/^"|"$/g, '');
  return d || null;
}

type Image = { octets: Uint8Array; type: string } | { erreur: string };

async function fabriquerImage(apiKey: string, invite: string): Promise<Image> {
  let derniere = 'aucun modèle d’image joignable';
  for (const modele of MODELES_IMAGE) {
    try {
      const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: invite }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!r.ok) {
        derniere = `${modele}: HTTP ${r.status} ${(await r.text()).slice(0, 180)}`;
        console.error(derniere);
        continue;
      }
      const b = await r.json();
      const parts = b?.candidates?.[0]?.content?.parts ?? [];
      const img = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p?.inlineData?.data);
      if (!img) {
        derniere = `${modele}: pas d’image dans la réponse (${b?.candidates?.[0]?.finishReason ?? '?'})`;
        console.error(derniere, JSON.stringify(b).slice(0, 300));
        continue;
      }
      const brut = atob(img.inlineData.data as string);
      const octets = new Uint8Array(brut.length);
      for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
      return { octets, type: (img.inlineData.mimeType as string) || 'image/png' };
    } catch (e) {
      derniere = `${modele}: ${(e as Error).message}`;
      console.error(derniere);
    }
  }
  // Le relais quand Google coupe (proposition 3 de Beau, 24/09 : « ne plus
  // jamais dépendre de Google seul ») : OpenAI, si sa clé est posée.
  const cleOpenAI = lireCleOpenAI();
  if (cleOpenAI) {
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleOpenAI}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: Deno.env.get('LEGION_MODELE_IMAGE_OA') || 'gpt-image-1', prompt: invite, size: '1024x1024', n: 1 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 180)}`);
      const b = await r.json();
      const b64 = b?.data?.[0]?.b64_json;
      if (!b64) throw new Error('pas d’image dans la réponse');
      const brut = atob(b64);
      const octets = new Uint8Array(brut.length);
      for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
      return { octets, type: 'image/png' };
    } catch (e) {
      derniere = `${derniere} ; openai: ${(e as Error).message}`;
      console.error(derniere);
    }
  }
  return { erreur: derniere };
}

Deno.serve(compter('legion_portrait', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' }, 503);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { entreprise_id?: string; agent_id?: string; limite?: number; refaire?: boolean; action?: string; envie?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if (!corps.entreprise_id) return json({ erreur: 'Entreprise manquante.' }, 400);
  const limite = Math.min(Math.max(Number(corps.limite) || 1, 1), LIMITE_MAX);

  // Le serveur lui-même (24/09): un agent qui vient d'être engagé se fait
  // sa photo, et un agent qui en a envie en change depuis la conversation.
  const parServeur = auth === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
  if (parServeur && !corps.agent_id) return json({ erreur: 'Agent manquant.' }, 400);
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, parServeur ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: entreprise } = await personne
    .from('legion_entreprises').select('id, nom').eq('id', corps.entreprise_id).maybeSingle();
  const envie = String(corps.envie || '').trim().slice(0, 600);
  if (!entreprise) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);

  // Alléger les portraits déjà faits (aucun modèle appelé, rien ne se paie).
  if (corps.action === 'compresser') {
    const service0 = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: lourds } = await service0.from('legion_agents').select('id, avatar_url, apparence').eq('entreprise_id', entreprise.id)
      .eq('apparence->>famille', 'photo').is('apparence->>mini', null).limit(40);
    let faits = 0;
    for (const a of (lourds || []).slice(0, 8) as Array<{ id: string; avatar_url: string | null; apparence: Record<string, unknown> | null }>) {
      const source = String(a.apparence?.url || a.avatar_url || '');
      if (!source.startsWith('http')) continue;
      const r = await fetch(source);
      if (!r.ok) continue;
      const mini = await miniature(new Uint8Array(await r.arrayBuffer()));
      if (!mini) continue;
      const chemin = `${entreprise.id}/portraits/${a.id}-${Date.now()}-256.jpg`;
      const { error: e1 } = await service0.storage.from('legion').upload(chemin, mini, { contentType: 'image/jpeg', upsert: true });
      if (e1) continue;
      const url = service0.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
      const { error: e2 } = await service0.from('legion_agents').update({ avatar_url: url, apparence: { ...(a.apparence || {}), url: source, mini: url } }).eq('id', a.id);
      if (!e2) faits += 1;
    }
    return json({ faits, restants: Math.max(0, (lourds || []).length - faits) });
  }

  // Le plafond du mois (compteur de dépense): au-delà, on ne rappelle plus Gemini.
  pourEntreprise(entreprise.id);
  {
    const p = await plafondAtteint(entreprise.id);
    if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € dépensés sur ${p.plafond} €. Tu peux le monter sur l'accueil de Léo.` });
  }

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } });

  let q = service.from('legion_agents')
    .select('id, nom, poste, departement, mandat, personnalite, apparence')
    .eq('entreprise_id', entreprise.id).is('user_id', null);
  // Claude n'est pas pris dans la tournée générale; mais Beau peut lui
  // demander SA photo, comme à n'importe quel agent (22/09: « je veux une
  // vraie photo, pas l'icône du marteau »).
  if (corps.agent_id) q = q.eq('id', corps.agent_id);
  // Une photo par agent, jamais deux: ce qui est payé n'est pas repayé.
  else q = q.neq('moteur', 'claude-code').or('apparence->>famille.is.null,apparence->>famille.neq.photo');
  const { data: agents, error } = await q.order('ordre').limit(limite);
  if (error) return json({ erreur: error.message }, 500);
  if (!agents || agents.length === 0) return json({ faits: 0, restants: 0, message: 'Tout le monde a déjà sa photo.' });

  let faits = 0;
  const rates: string[] = [];
  let pourquoi = '';

  for (let i = 0; i < agents.length; i += EN_PARALLELE) {
    await Promise.all(agents.slice(i, i + EN_PARALLELE).map(async (a) => {
      // Une photo par jour au plus quand l'agent en change lui-même (ce qui
      // se paie ne se repaie pas toutes les heures).
      const deja = (a.apparence as { change_le?: string } | null)?.change_le;
      if (envie && deja === new Date().toISOString().slice(0, 10)) { rates.push(a.nom); pourquoi = pourquoi || 'une nouvelle photo par jour au plus'; return; }
      const description = envie || await demanderTexte(apiKey, consigneDescription(a as Agent, entreprise.nom));
      if (!description) { rates.push(a.nom); pourquoi = pourquoi || 'le modèle n’a pas décrit le visage'; return; }

      const img = await fabriquerImage(apiKey, consignePhoto(description));
      if ('erreur' in img) { rates.push(a.nom); pourquoi = pourquoi || img.erreur; return; }

      const ext = img.type.includes('jpeg') ? 'jpg' : 'png';
      const chemin = `${entreprise.id}/portraits/${a.id}-${Date.now()}.${ext}`;
      const { error: errDepot } = await service.storage.from('legion')
        .upload(chemin, img.octets, { contentType: img.type, upsert: true });
      if (errDepot) { rates.push(a.nom); pourquoi = pourquoi || errDepot.message; return; }

      const url = service.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
      // La miniature, servie partout ; l'original reste pour la photo en grand.
      let mini: string | null = null;
      const petite = await miniature(img.octets);
      if (petite) {
        const cheminMini = chemin.replace(/\.(png|jpg)$/, '-256.jpg');
        const { error: errMini } = await service.storage.from('legion').upload(cheminMini, petite, { contentType: 'image/jpeg', upsert: true });
        if (!errMini) mini = service.storage.from('legion').getPublicUrl(cheminMini).data.publicUrl;
      }
      const apparence = { ...(a.apparence as Record<string, unknown> || {}), famille: 'photo', description, url, ...(mini ? { mini } : {}), ...(envie ? { change_le: new Date().toISOString().slice(0, 10) } : {}) };
      const { error: errMaj } = await service.from('legion_agents')
        .update({ avatar_url: mini || url, apparence, choisi_par_lui: true }).eq('id', a.id);
      if (errMaj) { rates.push(a.nom); pourquoi = pourquoi || errMaj.message; return; }
      faits += 1;
    }));
  }

  const { count: restants } = await service.from('legion_agents')
    .select('id', { count: 'exact', head: true })
    .eq('entreprise_id', entreprise.id).is('user_id', null).neq('moteur', 'claude-code')
    .or('apparence->>famille.is.null,apparence->>famille.neq.photo');

  return json({ faits, restants: restants ?? 0, rates, ...(faits === 0 && pourquoi ? { pourquoi } : {}) });
}));
