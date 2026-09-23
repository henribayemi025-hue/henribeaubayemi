// LEGION — renforcer un service, ou prendre un expert pour une mission (23/09).
//
// Beau, 23/09 : « des agents IA par service : vous avez 20 personnes à tel
// service, on vous envoie les agents qui font ceci et ceci » ; « une boîte
// d'intérim » ; « un agent expert en audit : si quelqu'un veut, on le branche
// au truc de l'entreprise et il fait — agent intérim ».
//
// Cette fonction PROPOSE, elle n'engage personne : le membre décrit son
// service (ou choisit un expert), le modèle propose les agents qui prennent
// le travail répétitif, chacun avec sa fiche de mission (objectif, ce qu'il
// prend, ce qu'il ne fait JAMAIS, à qui il passe la main). L'écran les
// montre ; c'est le membre qui coche et engage. Voir docs/LEGION-INTERIM-ETUDE.md.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteurs } from '../_shared/moteur.ts';

const PROD_HOST = 'finjaro.net';
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

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    lecture: { type: 'STRING' },
    agents: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nom: { type: 'STRING' },
          poste: { type: 'STRING' },
          mandat: { type: 'STRING' },
          personnalite: { type: 'STRING' },
          prend: { type: 'ARRAY', items: { type: 'STRING' } },
          jamais: { type: 'STRING' },
          relais_humain: { type: 'STRING' },
          premieres_taches: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['nom', 'poste', 'mandat', 'personnalite', 'prend', 'jamais', 'relais_humain', 'premieres_taches'],
      },
    },
    reste_humain: { type: 'STRING' },
  },
  required: ['lecture', 'agents', 'reste_humain'],
};

Deno.serve(compter('legion_renfort', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { entreprise_id?: string; mode?: string; departement?: string; description?: string; expert?: string; objectif?: string; fin_mission?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const mode = corps.mode === 'expert' ? 'expert' : 'renfort';
  const description = String(corps.description || '').trim().slice(0, 2000);
  const objectif = String(corps.objectif || '').trim().slice(0, 1200);
  if (!corps.entreprise_id) return json({ erreur: 'Entreprise manquante.' }, 400);
  if (mode === 'renfort' && description.length < 10) return json({ erreur: 'Décris le service en une ou deux phrases : combien de personnes, ce qu\'elles font.' }, 400);
  if (mode === 'expert' && (!corps.expert || objectif.length < 10)) return json({ erreur: 'Choisis un expert et décris la mission.' }, 400);

  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: entreprise } = await personne.from('legion_entreprises').select('id, nom, projet, langue, formule').eq('id', corps.entreprise_id).maybeSingle();
  if (!entreprise) return json({ erreur: 'Entreprise inconnue, ou tu n\'en es pas membre.' }, 403);
  const { data: equipe } = await personne.from('legion_agents').select('nom, poste, departement').eq('entreprise_id', entreprise.id).is('user_id', null);

  pourEntreprise(entreprise.id);
  const p = await plafondAtteint(entreprise.id);
  if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € dépensés sur ${p.plafond} €.` });

  const anglais = entreprise.langue === 'en';
  // Ce que peut VRAIMENT un agent de Legion (premier essai, 23/09: « se
  // connecter à WhatsApp », « programmer l'envoi des relances » — il ne sait
  // rien faire de tout ça).
  const pouvoirs = `CE QU'UN AGENT DE LEGION PEUT VRAIMENT FAIRE: lire ce que l'entreprise lui donne (messages du salon, fichiers Excel/CSV/PDF déposés, chiffres branchés), analyser, écrire, préparer (réponses types, brouillons, procédures, tableaux, listes à valider), poser des questions, et rendre ses livrables au tableau des tâches. Il n'envoie RIEN lui-même, ne se connecte à aucun outil, n'automatise rien, ne paie rien: un humain valide et envoie. Écris donc "prend" comme ce qu'il PRÉPARE ou ANALYSE (« prépare les réponses aux questions fréquentes », pas « répond sur WhatsApp »), et "premieres_taches" comme des livrables écrits qu'il peut rendre seul la première semaine.`;
  const noms = (equipe || []).map((a: { nom: string }) => a.nom);
  const contexte = `L'entreprise « ${entreprise.nom} »${entreprise.projet ? ` : ${String(entreprise.projet).slice(0, 1200)}` : ''}.
Son équipe d'agents aujourd'hui : ${(equipe || []).map((a: { nom: string; poste: string; departement: string | null }) => `${a.nom} (${a.poste}${a.departement ? `, ${a.departement}` : ''})`).join(' ; ') || 'personne encore'}.`;

  const consigne = mode === 'renfort'
    ? `${contexte}

Le membre veut RENFORCER un service${corps.departement ? ` (« ${String(corps.departement).slice(0, 80)} »)` : ''}. Voici ce qu'il en dit :
« ${description} »

Tu es un consultant en organisation qui connaît le travail réel de ce service. Propose 2 à 5 agents IA qui prennent le travail RÉPÉTITIF et à faible risque de ce service, pour que les humains gardent le complexe, le sensible et le relationnel (leçon de Klarna : l'IA prend le courant, l'humain le difficile).
Pour chaque agent :
- "nom" : un prénom et un nom crédibles, variés, qui ne sont pas déjà dans l'équipe (${noms.join(', ') || 'aucun'}) ;
- "poste" : l'intitulé précis ;
- "mandat" : ce dont il répond, concret, en une ou deux phrases ;
- "personnalite" : en une phrase, sa façon de travailler et de parler ;
- "prend" : 3 à 6 tâches précises qu'il prend dans ce service ;
- "jamais" : ce qu'il ne fait JAMAIS (au moins : promettre un remboursement, un prix ou un délai que l'entreprise n'a pas fixés ; décider à la place d'un humain sur l'argent, le juridique ou une personne ; envoyer quoi que ce soit sans validation) ;
- "relais_humain" : quand et à qui il passe la main (le cas, et le rôle humain) ;
- "premieres_taches" : 1 à 3 premières tâches concrètes pour sa première semaine.
"lecture" : en deux ou trois phrases, ce que tu as compris du service et de sa charge.
"reste_humain" : en une ou deux phrases, ce qui doit rester aux humains et pourquoi.
${pouvoirs}
Aucun chiffre inventé (pas de « 40 % de temps gagné »). Écris en ${anglais ? 'anglais' : 'français'}.`
    : `${contexte}

Le membre veut un EXPERT pour une mission : « ${String(corps.expert).slice(0, 120)} ». La mission :
« ${objectif} »
${corps.fin_mission ? `Fin de mission prévue : ${String(corps.fin_mission).slice(0, 10)}.` : ''}

Propose UN agent expert, comme un intérimaire qu'un cabinet enverrait : ses méthodes, ses repères et ses livrables sont ceux d'un vrai professionnel du métier.
- "nom" : un prénom et un nom crédibles, qui ne sont pas déjà dans l'équipe (${noms.join(', ') || 'aucun'}) ;
- "poste" : l'intitulé précis de l'expert ;
- "mandat" : l'objectif de la mission et le livrable final attendu, en deux phrases ;
- "personnalite" : en une phrase ;
- "prend" : les 3 à 6 étapes de sa méthode pour cette mission ;
- "jamais" : ce qu'il ne fait JAMAIS (au moins : signer ou certifier quoi que ce soit — un agent n'a aucune qualité légale ; donner un avis qui remplace celui d'un professionnel habilité quand la loi l'exige ; inventer un chiffre) ;
- "relais_humain" : quand il passe la main à un humain, et à qui ;
- "premieres_taches" : 2 à 4 premières tâches concrètes.
"lecture" : en deux phrases, ce que tu as compris de la mission.
"reste_humain" : ce qui reste à un humain habilité (expert-comptable, avocat, commissaire aux comptes…), si c'est le cas.
${pouvoirs}
Aucun chiffre inventé. Écris en ${anglais ? 'anglais' : 'français'}.`;

  const gratuite = entreprise.formule === 'gratuite';
  // Tous les moteurs, Flash en dernier recours (23/09: un soir de saturation
  // chez Google, trois moteurs sur trois ont répondu « 503 »). 35 s chacun au
  // plus: une saturation répond en une seconde.
  const r = await generer(apiKey, consigne, SCHEMA, { temperature: 0.6, reflexion: 2048, delaiMs: 35_000, maxSortie: 8192, modeles: gratuite ? ['gemini-2.5-flash', 'gemini-3.5-flash'] : moteurs() });
  if ('erreur' in r) {
    console.error('renfort:', r.erreur);
    const sature = /503|UNAVAILABLE|high demand|429|RESOURCE_EXHAUSTED/i.test(r.erreur);
    return json({ erreur: sature
      ? (anglais ? 'Google\'s models are overloaded right now. Try again in a minute.' : 'Les modèles de Google sont saturés en ce moment. Réessaie dans une minute.')
      : (anglais ? 'No proposal this time. Try again.' : 'Pas de proposition cette fois. Réessaie.') });
  }
  const agents = (Array.isArray(r.obj.agents) ? r.obj.agents : []).slice(0, mode === 'expert' ? 1 : 5)
    .map((a: Record<string, unknown>) => ({
      nom: String(a.nom || '').slice(0, 60), poste: String(a.poste || '').slice(0, 120), mandat: String(a.mandat || '').slice(0, 600),
      personnalite: String(a.personnalite || '').slice(0, 300), prend: (Array.isArray(a.prend) ? a.prend : []).map(String).slice(0, 6),
      jamais: String(a.jamais || '').slice(0, 800), relais_humain: String(a.relais_humain || '').slice(0, 400),
      premieres_taches: (Array.isArray(a.premieres_taches) ? a.premieres_taches : []).map(String).slice(0, 4),
    }))
    .filter((a: { nom: string; poste: string }) => a.nom && a.poste && !noms.some((n: string) => n.toLowerCase() === a.nom.toLowerCase()));
  return json({ ok: true, mode, lecture: String(r.obj.lecture || ''), reste_humain: String(r.obj.reste_humain || ''), agents, modele: r.modele });
}));
