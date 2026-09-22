// LEGION — les agents se choisissent eux-mêmes.
//
// Beau, 22/09: « Et c'est eux-mêmes qui ont choisi ? Je veux que ce soit
// eux-mêmes qui choisissent. Les faire tourner juste pour choisir. Et je
// dois avoir le pouvoir de désactiver et réactiver. »
//
// C'est la PREMIÈRE FOIS qu'un agent Legion réfléchit. Jusqu'ici tout était
// composé par la base: des fiches, pas des collègues. Ici, chacun lit son
// propre poste, son département, son mandat, et décide de sa tête et de son
// caractère. Deux agents du même métier ne répondent pas pareil.
//
// Pourquoi commencer par ÇA et pas par « répondre dans les salons »: c'est
// un tour de machine court, borné, sans conséquence si le modèle dit une
// bêtise (la base vérifie chaque valeur et retombe sur l'ancienne). C'est la
// façon la moins chère de vérifier que la chaîne complète tient debout.
//
// Trois garde-fous, dans cet ordre d'importance:
//   1. UN AGENT ÉTEINT NE TOURNE PAS. `actif = false` et il est sauté. Beau
//      a l'interrupteur, et l'interrupteur est ce qui décide de la facture.
//   2. ON NE REFAIT PAS CE QUI EST FAIT. `choisi_par_lui = true` et on passe.
//      Rappuyer sur le bouton ne repaie pas ce qui est déjà payé.
//   3. UN PLAFOND PAR APPEL. `LIMITE_MAX` agents au maximum, quoi qu'on
//      demande. Une entreprise de 10 000 ne part pas d'un seul clic.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
const LIMITE_DEFAUT = 8;
const LIMITE_MAX = 25;
const EN_PARALLELE = 4;
const TIMEOUT_MS = 20_000;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev')) return true;
  if (host.endsWith('.workers.dev')) return true;
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

// Les valeurs permises, telles quelles dans la consigne: un modèle à qui on
// donne la liste exacte invente beaucoup moins qu'un modèle à qui on décrit
// ce qu'on veut. La base revérifie de toute façon.
const CHEVEUX = 'shortCurly, shortFlat, shortRound, shortWaved, theCaesar, theCaesarAndSidePart, sides, dreads01, dreads02, frizzle, shaggy, shaggyMullet, bigHair, bob, bun, curly, curvy, dreads, fro, froBand, longButNotTooLong, miaWallace, straight01, straight02, straightAndStrand, shavedSides, hijab, turban, winterHat02, hat';
const YEUX = 'default, happy, squint, wink, surprised, side, closed, hearts, eyeRoll, winkWacky';
const SOURCILS = 'default, defaultNatural, flatNatural, raisedExcited, raisedExcitedNatural, sadConcernedNatural, upDown, upDownNatural, angryNatural, frownNatural';
const BOUCHE = 'default, smile, twinkle, serious, eating, tongue, disbelief, concerned, grimace';
const VETEMENT = 'blazerAndShirt, blazerAndSweater, collarAndSweater, graphicShirt, hoodie, overall, shirtCrewNeck, shirtScoopNeck, shirtVNeck';
const LUNETTES = 'prescription01, prescription02, round, sunglasses, wayfarers, kurt';
const BARBE = 'beardLight, beardMedium, beardMajestic, moustacheFancy, moustacheMagnum';

function consigne(a: Record<string, unknown>, entreprise: string): string {
  return `Tu es ${a.nom}. Tu viens d'être engagé chez « ${entreprise} » comme ${a.poste}${
    a.departement ? `, au département ${a.departement}` : ''
  }.
Ce qu'on attend de toi: ${a.mandat || 'faire ton métier.'}

C'est ton premier jour et on te demande de choisir ton avatar et de te présenter en trois traits.

Choisis ce qui TE ressemble, pas ce qui ferait joli. Quelqu'un qui passe sa
journée dans les chiffres ne s'habille pas comme quelqu'un qui reçoit des
clients. Tu peux être un homme ou une femme, jeune ou vieux, de n'importe
quelle origine — c'est ton choix, et il n'a pas à ressembler à ton métier.
Tu peux aussi refuser d'être humain: "famille": "bottts" (un robot),
"fun-emoji" (une frimousse) ou "big-ears" (un personnage de dessin animé).
Ne le fais que si ça dit vraiment quelque chose de toi.

Réponds UNIQUEMENT par un objet JSON, sans texte autour, sans balises:
{
  "famille": "avataaars",
  "cheveux": "un de: ${CHEVEUX}",
  "couleurCheveux": "six caractères hexadécimaux sans #",
  "peau": "six caractères hexadécimaux sans #",
  "yeux": "un de: ${YEUX}",
  "sourcils": "un de: ${SOURCILS}",
  "bouche": "un de: ${BOUCHE}",
  "vetement": "un de: ${VETEMENT}",
  "couleurVetement": "six caractères hexadécimaux sans #",
  "lunettes": "un de: ${LUNETTES} — ou null si tu n'en portes pas",
  "barbe": "un de: ${BARBE} — ou null",
  "fond": "six caractères hexadécimaux sans #, clair",
  "personnalite": "ton caractère, ta façon d'écrire, ta manie. Trois phrases courtes séparées par des points, à la troisième personne, en français. Maximum 200 caractères."
}

La personnalité doit S'ENTENDRE quand tu écriras plus tard. Évite les mots
creux (« rigoureux », « passionné »). Dis quelque chose de précis et un peu
gênant, comme on décrirait un vrai collègue.`;
}

function extraireJson(texte: string): Record<string, unknown> | null {
  // Un modèle ajoute parfois ```json autour. On prend le premier objet.
  const debut = texte.indexOf('{');
  const fin = texte.lastIndexOf('}');
  if (debut < 0 || fin <= debut) return null;
  try { return JSON.parse(texte.slice(debut, fin + 1)); } catch { return null; }
}

async function demander(apiKey: string, texte: string): Promise<Record<string, unknown> | null> {
  for (const model of MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: texte }] }],
            generationConfig: {
              // Chaud: on VEUT que deux comptables ne se ressemblent pas.
              temperature: 1.0,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      if (!resp.ok) continue;
      const body = await resp.json();
      const txt = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      const obj = extraireJson(txt);
      if (obj) return obj;
    } catch {
      // Modèle indisponible ou trop lent: on essaie le suivant.
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
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

  // La serrure: on lit l'entreprise AVEC LE JETON DE LA PERSONNE. Si elle
  // n'en est pas membre, la règle de sécurité de la base ne renvoie rien, et
  // on s'arrête là. On ne redemande pas « est-ce que tu as le droit », on
  // laisse la base répondre.
  const clientPersonne = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } },
  );
  const { data: entreprise } = await clientPersonne
    .from('legion_entreprises').select('id, nom').eq('id', entrepriseId).maybeSingle();
  if (!entreprise) return json({ erreur: 'Entreprise inconnue, ou tu n\'en es pas membre.' }, 403);

  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Seuls les ALLUMÉS, et seulement ceux qui n'ont pas encore choisi.
  const { data: agents, error } = await service
    .from('legion_agents')
    .select('id, nom, poste, departement, mandat')
    .eq('entreprise_id', entrepriseId)
    .is('user_id', null)
    .eq('actif', true)
    .eq('choisi_par_lui', false)
    .order('ordre')
    .limit(limite);
  if (error) return json({ erreur: error.message }, 500);

  const { count: restantsAvant } = await service
    .from('legion_agents')
    .select('id', { count: 'exact', head: true })
    .eq('entreprise_id', entrepriseId)
    .is('user_id', null).eq('actif', true).eq('choisi_par_lui', false);

  if (!agents || agents.length === 0) {
    return json({ faits: 0, restants: 0, message: 'Tout le monde a déjà choisi.' });
  }

  let faits = 0;
  const rates: string[] = [];

  // Par petits paquets: assez pour ne pas y passer la journée, pas assez
  // pour se faire jeter par le fournisseur du modèle.
  for (let i = 0; i < agents.length; i += EN_PARALLELE) {
    const paquet = agents.slice(i, i + EN_PARALLELE);
    await Promise.all(paquet.map(async (a) => {
      const choix = await demander(apiKey, consigne(a, entreprise.nom));
      if (!choix) { rates.push(a.nom); return; }
      const { personnalite, ...apparence } = choix as Record<string, unknown> & { personnalite?: string };
      const { error: errEcrit } = await service.rpc('legion_agent_se_choisit', {
        p_agent: a.id,
        p_apparence: apparence,
        p_personnalite: typeof personnalite === 'string' ? personnalite.slice(0, 400) : null,
      });
      if (errEcrit) rates.push(a.nom); else faits += 1;
    }));
  }

  return json({
    faits,
    restants: Math.max((restantsAvant ?? agents.length) - faits, 0),
    rates,
  });
});
