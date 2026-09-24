// LEGION — les agents construisent eux-mêmes leur bitmoji.
//
// Beau, 22/09: « j'ai cliqué sur "let them choose", ça ne fait pas changer.
// Je veux vraiment que chacun construise son bitmoji. »
//
// Il avait raison: la première version n'a RIEN écrit. Mesuré dans les
// journaux — la fonction a bien tourné, bien lu les agents, et n'a produit
// aucune écriture. Deux fautes, corrigées ici:
//
//   1. LA DEMANDE ÉTAIT TROP COMPLIQUÉE POUR LE MODÈLE. On lui donnait
//      treize champs à remplir en lui demandant « réponds uniquement par un
//      objet JSON », et on espérait. Sur les modèles qui réfléchissent
//      (2.5 et au-delà), les jetons de réflexion se prennent sur le budget
//      de sortie: la réflexion mangeait tout et la réponse revenait vide.
//      C'est le même défaut qui avait fait répondre « je n'ai pas bien
//      compris » à Finia — il est documenté dans finou-chat, et je l'ai
//      quand même refait.
//      Maintenant: un SCHÉMA DE RÉPONSE (le modèle ne peut plus sortir du
//      cadre ni inventer une valeur), la réflexion coupée (choisir une
//      coiffure ne demande pas de raisonner), et un budget de sortie doublé.
//
//   2. ÇA NE TOURNAIT QUE SUR LES AGENTS ALLUMÉS. Quatre sur vingt. Beau en
//      attendait vingt, et il a raison: AVOIR UN VISAGE N'EST PAS
//      TRAVAILLER. L'interrupteur décide de qui travaille, pas de qui a une
//      tête. Tout le monde choisit la sienne, allumé ou non.
//
// Et on ne sera plus aveugle: quand un agent échoue, la raison remonte à
// l'écran au lieu de disparaître.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
const LIMITE_DEFAUT = 25;
const LIMITE_MAX = 40;
const EN_PARALLELE = 5;
const TIMEOUT_MS = 20_000;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev') || host.endsWith('.workers.dev')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const CHEVEUX = ['shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'theCaesar', 'theCaesarAndSidePart',
  'sides', 'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 'bigHair', 'bob', 'bun',
  'curly', 'curvy', 'dreads', 'fro', 'froBand', 'longButNotTooLong', 'miaWallace', 'straight01',
  'straight02', 'straightAndStrand', 'shavedSides', 'hijab', 'turban', 'winterHat02', 'hat'];
const YEUX = ['default', 'happy', 'squint', 'wink', 'surprised', 'side', 'closed', 'hearts', 'eyeRoll', 'winkWacky'];
const SOURCILS = ['default', 'defaultNatural', 'flatNatural', 'raisedExcited', 'raisedExcitedNatural',
  'sadConcernedNatural', 'upDown', 'upDownNatural', 'angryNatural', 'frownNatural'];
const BOUCHE = ['default', 'smile', 'twinkle', 'serious', 'eating', 'tongue', 'disbelief', 'concerned', 'grimace'];
const VETEMENT = ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie',
  'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'];
const LUNETTES = ['aucune', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers', 'kurt'];
const BARBE = ['aucune', 'beardLight', 'beardMedium', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum'];
const FAMILLES = ['avataaars', 'bottts', 'fun-emoji', 'big-ears'];
const PEAUX = ['614335', '8d5524', 'ae5d29', 'c68642', 'd08b5b', 'e0ac69', 'edb98a', 'f1c27d', 'ffdbb4'];
const CHEVEUX_COULEUR = ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'e8e1e1', 'ecdcbf', 'f59797'];
const VET_COULEUR = ['262e33', '3c4f5c', '65c9ff', '5199e4', '25557c', '929598', 'a7ffc4', 'b1e2ff', 'ff5c5c',
  'ff488e', 'ffafb9', 'ffffb1', 'e6e6e6', 'ff7a00', '2a9d8f', 'c25e38'];
const FONDS = ['ffe9e0', 'e6f4f1', 'ece9fb', 'fdf3e0', 'f3eaff', 'e3f4fd', 'ffe9ef', 'e6f8f0', 'f7f2ea'];

// Le schéma: le modèle ne peut PAS sortir de ces valeurs. C'est ce qui
// remplace « réponds uniquement par un objet JSON » et l'espoir qui allait
// avec.
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    famille: { type: 'STRING', enum: FAMILLES },
    cheveux: { type: 'STRING', enum: CHEVEUX },
    couleurCheveux: { type: 'STRING', enum: CHEVEUX_COULEUR },
    peau: { type: 'STRING', enum: PEAUX },
    yeux: { type: 'STRING', enum: YEUX },
    sourcils: { type: 'STRING', enum: SOURCILS },
    bouche: { type: 'STRING', enum: BOUCHE },
    vetement: { type: 'STRING', enum: VETEMENT },
    couleurVetement: { type: 'STRING', enum: VET_COULEUR },
    lunettes: { type: 'STRING', enum: LUNETTES },
    barbe: { type: 'STRING', enum: BARBE },
    fond: { type: 'STRING', enum: FONDS },
    personnalite: { type: 'STRING' },
  },
  required: ['famille', 'cheveux', 'couleurCheveux', 'peau', 'yeux', 'sourcils', 'bouche',
    'vetement', 'couleurVetement', 'lunettes', 'barbe', 'fond', 'personnalite'],
};

function consigne(a: Record<string, unknown>, entreprise: string): string {
  return `Tu es ${a.nom}. Tu viens d'être engagé chez « ${entreprise} » comme ${a.poste}${
    a.departement ? `, au département ${a.departement}` : ''
  }. Ce qu'on attend de toi: ${a.mandat || 'faire ton métier.'}

C'est ton premier jour. Construis ton avatar et présente-toi en trois traits.

Choisis ce qui TE ressemble, pas ce qui ferait joli. Tu peux être un homme ou
une femme, jeune ou vieux, de n'importe quelle origine — c'est ton choix, et
il n'a pas à ressembler à ton métier. « lunettes » et « barbe » valent
"aucune" si tu n'en portes pas.

Tu peux refuser d'être humain: famille = "bottts" (un robot), "fun-emoji"
(une frimousse) ou "big-ears" (un personnage de dessin animé). Ne le fais que
si ça dit vraiment quelque chose de toi; sinon garde "avataaars".

"personnalite": ton caractère, ta façon d'écrire, ta manie. Trois phrases
courtes séparées par des points, à la troisième personne, en français, 200
caractères au plus. Elle doit S'ENTENDRE quand tu écriras plus tard. Évite
les mots creux (« rigoureux », « passionné »): dis quelque chose de précis et
un peu gênant, comme on décrirait un vrai collègue.`;
}

type Resultat = { obj: Record<string, unknown>; modele: string } | { erreur: string };

async function demander(apiKey: string, texte: string): Promise<Resultat> {
  let derniere = 'aucun modèle joignable';
  for (const model of MODELS) {
    try {
      const resp = await gemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: texte }] }],
            generationConfig: {
              // Chaud: on VEUT que deux comptables ne se ressemblent pas.
              temperature: 1.0,
              // Doublé, et la réflexion coupée: choisir une coiffure ne
              // demande pas de raisonner, et sur les modèles 2.5 la
              // réflexion se paie sur CE budget — c'est ce qui vidait la
              // réponse.
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingBudget: 0 },
              responseMimeType: 'application/json',
              responseSchema: SCHEMA,
            },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      if (!resp.ok) {
        const t = await resp.text();
        derniere = `${model}: HTTP ${resp.status} ${t.slice(0, 160)}`;
        console.error(derniere);
        continue;
      }
      const body = await resp.json();
      const fin = body?.candidates?.[0]?.finishReason;
      const txt = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!txt) {
        derniere = `${model}: réponse vide (finishReason=${fin})`;
        console.error(derniere, JSON.stringify(body).slice(0, 400));
        continue;
      }
      try {
        return { obj: JSON.parse(txt), modele: model };
      } catch {
        derniere = `${model}: JSON illisible — ${txt.slice(0, 160)}`;
        console.error(derniere);
      }
    } catch (e) {
      derniere = `${model}: ${(e as Error).message}`;
      console.error(derniere);
    }
  }
  return { erreur: derniere };
}

Deno.serve(compter('legion_se_choisir', async (req: Request) => {
  const cors = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' }, 503);

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { entreprise_id?: string; limite?: number };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const entrepriseId = corps.entreprise_id;
  if (!entrepriseId) return json({ erreur: 'Entreprise manquante.' }, 400);

  const limite = Math.min(Math.max(Number(corps.limite) || LIMITE_DEFAUT, 1), LIMITE_MAX);

  // La serrure: on lit l'entreprise AVEC LE JETON DE LA PERSONNE. Pas
  // membre, la base ne renvoie rien, on s'arrête.
  const clientPersonne = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } },
  );
  const { data: entreprise } = await clientPersonne
    .from('legion_entreprises').select('id, nom').eq('id', entrepriseId).maybeSingle();
  if (!entreprise) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);

  // Le plafond du mois (compteur de dépense): au-delà, on ne rappelle plus Gemini.
  pourEntreprise(entreprise.id);
  {
    const p = await plafondAtteint(entreprise.id);
    if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € dépensés sur ${p.plafond} €. Tu peux le monter sur l'accueil de Léo.` });
  }

  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // TOUT LE MONDE, allumé ou non. Avoir un visage n'est pas travailler.
  const { data: agents, error } = await service
    .from('legion_agents')
    .select('id, nom, poste, departement, mandat')
    .eq('entreprise_id', entrepriseId)
    .is('user_id', null).neq('moteur', 'claude-code')
    .eq('choisi_par_lui', false)
    .order('ordre')
    .limit(limite);
  if (error) return json({ erreur: error.message }, 500);

  const { count: restantsAvant } = await service
    .from('legion_agents')
    .select('id', { count: 'exact', head: true })
    .eq('entreprise_id', entrepriseId)
    .is('user_id', null).neq('moteur', 'claude-code').eq('choisi_par_lui', false);

  if (!agents || agents.length === 0) {
    return json({ faits: 0, restants: 0, message: 'Tout le monde a déjà choisi.' });
  }

  let faits = 0;
  const rates: string[] = [];
  let pourquoi = '';

  for (let i = 0; i < agents.length; i += EN_PARALLELE) {
    const paquet = agents.slice(i, i + EN_PARALLELE);
    await Promise.all(paquet.map(async (a) => {
      const r = await demander(apiKey, consigne(a, entreprise.nom));
      if ('erreur' in r) { rates.push(a.nom as string); pourquoi = pourquoi || r.erreur; return; }
      const { personnalite, ...brut } = r.obj as Record<string, unknown> & { personnalite?: string };
      // « aucune » est la façon dont le modèle dit « je n'en porte pas »:
      // la base attend null.
      const apparence: Record<string, unknown> = { ...brut };
      if (apparence.lunettes === 'aucune') apparence.lunettes = null;
      if (apparence.barbe === 'aucune') apparence.barbe = null;
      const { error: errEcrit } = await service.rpc('legion_agent_se_choisit', {
        p_agent: a.id,
        p_apparence: apparence,
        p_personnalite: typeof personnalite === 'string' ? personnalite.slice(0, 400) : null,
      });
      if (errEcrit) { rates.push(a.nom as string); pourquoi = pourquoi || errEcrit.message; }
      else faits += 1;
    }));
  }

  return json({
    faits,
    restants: Math.max((restantsAvant ?? agents.length) - faits, 0),
    rates,
    // La raison remonte à l'écran: on ne veut plus d'un bouton qui ne fait
    // rien sans dire pourquoi.
    ...(faits === 0 && pourquoi ? { pourquoi } : {}),
  });
}));
