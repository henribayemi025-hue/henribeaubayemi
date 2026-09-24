// LA FINIA COMMUNE — la boucle de la semaine (0202, Beau 24/09 : « oui Finia
// commune », « que Finia apprenne des conversations des gens »).
//
// Même esprit que « Léo apprend tout seul » (0198, docs/vestiaire/26) :
// quelque chose PROPOSE, un humain DÉCIDE. Rien de ce qui est écrit ici ne
// sert à Finia avant le « Confirmer » d'un membre de l'entreprise Finjaro de
// Léo (legion-action, action « activer_savoir »).
//
//   1. Le lundi à 7 h UTC (tâche cron de 0202, jeton « finia_apprentissage »),
//      ou à la main par un membre de l'entreprise Finjaro (pour essayer) :
//      on lit les échanges gardés et pas encore traités (ia_apprentissage :
//      anonymes, déjà nettoyés, de personnes qui ne l'ont pas refusé).
//   2. Le moteur commun (moteursSimples : l'IA choisie par l'entreprise,
//      jamais un modèle en dur) propose au plus 5 savoirs nouveaux, ou la
//      correction d'un savoir existant.
//   3. Chaque proposition est relue ICI, sans modèle : aucune trace de
//      donnée personnelle (même nettoyage que la base), aucun nombre qui ne
//      vienne des échanges (CLAUDE.md §3), jamais « diaspora » (§1). Ce qui
//      échoue est écarté, et dit dans le journal.
//   4. Ce qui passe entre dans ia_savoirs_communs, ÉTEINT (« propose »), et
//      Mentor (sinon Rigo, sinon la Direction) le présente dans le salon « À
//      valider » (sinon Direction) avec « Confirmer » / « Écarter ».
//
// Le nombre d'échanges affiché à côté d'une proposition est COMPTÉ ici (les
// numéros d'échanges cités par le modèle et qui existent vraiment), jamais
// recopié du modèle.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, coutEnCours, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteursSimples } from '../_shared/moteur.ts';
import { contientDonneePerso, nettoyer, nombres } from '../_shared/apprentissage.ts';

const PROD_HOST = 'finjaro.net';
const PLATEFORME = '44bb201b-6787-4de0-8f7f-f9145d5c03e7'; // l'entreprise Finjaro dans Léo
const MAX_LIGNES = 150;          // échanges lus d'un coup (la consigne reste lisible)
const MAX_PROPOSITIONS = 5;      // par semaine : Beau n'a pas à trier une pile
const LONGUEUR_SAVOIR = 600;     // ce que Finia lit vraiment d'un savoir (savoirsPour)

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// deno-lint-ignore no-explicit-any
type Service = any;
type Ligne = { id: string; app: string; genre: string; question: string | null; reponse: string | null; correction: string | null; langue: string | null };
type Savoir = { id: string; titre: string; texte: string; etat: string; portee: string };
type Proposition = { titre?: string; texte?: string; langue?: string; portee?: string; exemples?: number[]; pourquoi?: string; a_verifier?: string; remplace?: string };

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const GENRES: Record<string, string> = { sans_reponse: 'Finia n’a pas su répondre', correction: 'la personne a corrigé Finia', pouce_bas: 'pouce vers le bas' };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    propositions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          titre: { type: 'STRING' },
          texte: { type: 'STRING' },
          langue: { type: 'STRING' },
          portee: { type: 'STRING' },
          exemples: { type: 'ARRAY', items: { type: 'INTEGER' } },
          pourquoi: { type: 'STRING' },
          a_verifier: { type: 'STRING' },
          remplace: { type: 'STRING' },
        },
        required: ['titre', 'texte', 'exemples', 'pourquoi'],
      },
    },
  },
  required: ['propositions'],
};

function consigne(lignes: Ligne[], existants: Savoir[]): string {
  const bloc = lignes.map((l, i) => [
    `#${i + 1} [${GENRES[l.genre] || l.genre} · ${l.langue || '?'} · ${l.app}]`,
    l.question ? `  Question : ${l.question}` : '',
    l.reponse ? `  Réponse de Finia : ${l.reponse.slice(0, 600)}` : '',
    l.correction ? `  Ce que la personne a répondu : ${l.correction}` : '',
  ].filter(Boolean).join('\n')).join('\n');
  const deja = existants.length
    ? existants.map((s) => `- [${s.etat}] « ${s.titre} » (${s.portee}) : ${s.texte.slice(0, 200)}`).join('\n')
    : '(aucun pour l’instant)';
  return `Tu aides l'équipe de Finjaro à améliorer Finia, l'assistante de ses applications (la place de marché finjaro.net, Finjaro Accounting pour tenir ses comptes, et Léo). Finjaro est une place de marché MONDIALE : n'enferme jamais Finjaro dans un pays, ne suppose aucune monnaie par défaut, n'emploie jamais le mot « diaspora ».

Voici des échanges de la semaine, ANONYMES et déjà nettoyés (les marques comme [nom], [téléphone], [adresse] remplacent des données personnelles : ne cherche jamais à les deviner) :
${bloc}

Ce que Finia sait déjà (savoirs actifs ou déjà proposés) :
${deja}

Propose au plus ${MAX_PROPOSITIONS} SAVOIRS : des consignes courtes, vraies et réutilisables, qui aideraient Finia à mieux répondre la prochaine fois. Pour chacune :
- titre : 3 à 8 mots ;
- texte : ${LONGUEUR_SAVOIR} caractères au plus, écrit pour Finia (« Quand on te demande…, … ») ;
- langue : « fr », « en » ou « toutes » ;
- portee : « marketplace », « accounting », « leo » ou « toutes » selon l'application concernée ;
- exemples : les numéros (#) des échanges d'où elle vient, seulement ceux qui existent ;
- pourquoi : en une phrase, ce que ça corrige ;
- a_verifier : ce que l'équipe doit vérifier ou compléter avant de confirmer (vide si rien) ;
- remplace : le titre EXACT d'un savoir existant que celui-ci corrige, sinon vide.

Règles strictes :
1. N'écris que ce que les échanges ou les savoirs existants permettent d'affirmer. Tu ne connais pas l'application mieux qu'eux : si la bonne réponse n'y est pas, le savoir dit comment se conduire (par exemple dire honnêtement qu'on ne sait pas et transmettre à l'équipe), et a_verifier dit ce que l'équipe doit compléter.
2. AUCUN chiffre, prix, délai, pourcentage ou date qui ne figure pas dans les échanges. Aucune promesse.
3. AUCUNE donnée personnelle : ni nom, ni téléphone, ni e-mail, ni adresse, ni numéro de commande, ni nom de boutique.
4. Ne répète pas un savoir existant. Un seul échange isolé et banal ne mérite pas de savoir : mieux vaut aucune proposition qu'une proposition faible.
5. Si rien ne mérite d'être appris, rends une liste vide.`;
}

// Qui présente, et où : même règle que les compétences apprises (legion-examen).
type Voix = { id: string; nom: string; poste: string; actif: boolean; est_directeur?: boolean };
async function voixEtSalon(service: Service): Promise<{ auteur: Voix | null; canal: string | null }> {
  const [{ data: ag }, { data: salons }] = await Promise.all([
    service.from('legion_agents').select('id, nom, poste, actif, est_directeur').eq('entreprise_id', PLATEFORME).is('user_id', null).neq('moteur', 'claude-code').order('ordre'),
    service.from('legion_canaux').select('id, nom, cle, prive_entre').eq('entreprise_id', PLATEFORME).order('ordre').order('created_at'),
  ]);
  const agents = (ag || []) as Voix[];
  const estMentor = (a: Voix) => sansAccent(a.nom).split(/\s+/)[0] === 'mentor' || /formation|competence/.test(sansAccent(a.poste || ''));
  const estRigo = (a: Voix) => sansAccent(a.nom).split(/\s+/)[0] === 'rigo' || /ameliorations? continues?/.test(sansAccent(a.poste || ''));
  const auteur = agents.find((a) => a.actif && estMentor(a)) || agents.find((a) => a.actif && estRigo(a))
    || agents.find(estMentor) || agents.find(estRigo) || agents.find((a) => a.actif && a.est_directeur) || agents.find((a) => a.actif) || null;
  const publics = (salons || []).filter((c: { prive_entre: string[] | null }) => !(Array.isArray(c.prive_entre) && c.prive_entre.length));
  const aValider = publics.find((c: { nom: string; cle: string }) => sansAccent(c.nom) === 'a valider' || c.cle === 'a-valider');
  const direction = publics.find((c: { nom: string; cle: string }) => sansAccent(c.nom) === 'direction' || sansAccent(c.cle || '') === 'direction');
  return { auteur, canal: aValider?.id || direction?.id || publics[0]?.id || null };
}

// La relecture sans modèle. Rend la raison du refus, ou null si la
// proposition peut être montrée.
function relire(p: Proposition, sources: string, existants: Savoir[]): string | null {
  const titre = String(p.titre || '').trim();
  const texte = String(p.texte || '').trim();
  if (titre.length < 3 || texte.length < 10) return 'vide';
  const tout = `${titre} ${texte} ${p.pourquoi || ''} ${p.a_verifier || ''}`;
  if (contientDonneePerso(tout)) return 'contient une donnée personnelle';
  if (/diaspora/i.test(tout)) return 'emploie « diaspora »';
  const permis = new Set(nombres(sources));
  const inventes = nombres(`${titre} ${texte}`).filter((n) => !permis.has(n));
  if (inventes.length) return `nombre absent des échanges (${inventes.slice(0, 3).join(', ')})`;
  if (existants.some((s) => sansAccent(s.titre) === sansAccent(titre) && s.etat !== 'ecarte')) return 'déjà connu';
  return null;
}

Deno.serve(compter('finia_apprentissage', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Deux portes : la tâche du lundi (jeton), ou un membre de l'entreprise
  // Finjaro de Léo (son jeton de connexion), pour essayer sans attendre.
  const jeton = req.headers.get('x-finjaro-token');
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'finia_apprentissage').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user } } = await personne.auth.getUser();
    const { data: e } = user ? await personne.from('legion_entreprises').select('id').eq('id', PLATEFORME).maybeSingle() : { data: null };
    if (!user || !e) return json({ erreur: 'Réservé à l’équipe Finjaro.' }, 403);
  }

  // Le coût est celui de l'entreprise Finjaro, sous son plafond du mois.
  pourEntreprise(PLATEFORME);
  const p = await plafondAtteint(PLATEFORME);
  if (p.atteint) return json({ ok: false, journal: ['plafond du mois atteint'] });

  const { data: l0, error: errL } = await service.from('ia_apprentissage').select('id, app, genre, question, reponse, correction, langue')
    .is('traite_le', null).order('created_at', { ascending: false }).limit(MAX_LIGNES);
  if (errL) return json({ erreur: errL.message }, 500);
  const lignes = (l0 || []) as Ligne[];
  if (!lignes.length) return json({ ok: true, journal: ['rien de gardé cette semaine : rien à proposer'] });

  const { data: s0 } = await service.from('ia_savoirs_communs').select('id, titre, texte, etat, portee').in('etat', ['actif', 'propose', 'ecarte']).order('created_at', { ascending: false }).limit(80);
  const existants = (s0 || []) as Savoir[];

  const apiKey = Deno.env.get('GEMINI_API_KEY') || '';
  const r = await generer(apiKey, consigne(lignes, existants.filter((s) => s.etat !== 'ecarte')), SCHEMA, { modeles: moteursSimples(), temperature: 0.3, maxSortie: 4000, reflexion: 2048, delaiMs: 90_000 });
  // Modèle muet : les échanges restent « à traiter », repris la semaine suivante.
  if ('erreur' in r) return json({ ok: false, journal: [`moteur : ${r.erreur}`] });

  const journal: string[] = [`${lignes.length} échanges lus (${r.modele})`];
  const brut = (Array.isArray(r.obj.propositions) ? r.obj.propositions : []) as Proposition[];
  const retenues: Array<{ p: Proposition; n: number; remplace: string | null }> = [];
  for (const prop of brut.slice(0, MAX_PROPOSITIONS)) {
    // Les échanges cités qui existent vraiment : c'est d'eux que viennent
    // le compte affiché et les nombres permis.
    const cites = [...new Set((Array.isArray(prop.exemples) ? prop.exemples : []).map(Number))].filter((i) => Number.isInteger(i) && i >= 1 && i <= lignes.length);
    if (!cites.length) { journal.push(`« ${prop.titre} » écarté : aucun échange réel cité`); continue; }
    const sources = cites.map((i) => { const l = lignes[i - 1]; return `${l.question || ''} ${l.reponse || ''} ${l.correction || ''}`; }).join(' ')
      + ' ' + existants.filter((s) => s.etat === 'actif').map((s) => s.texte).join(' ');
    const refus = relire(prop, sources, existants);
    if (refus) { journal.push(`« ${prop.titre} » écarté : ${refus}`); continue; }
    const vise = String(prop.remplace || '').trim();
    const remplace = vise ? existants.find((s) => s.etat === 'actif' && sansAccent(s.titre) === sansAccent(vise))?.id || null : null;
    retenues.push({ p: prop, n: cites.length, remplace });
  }

  const { auteur, canal } = await voixEtSalon(service);
  const { data: ent } = await service.from('legion_entreprises').select('langue').eq('id', PLATEFORME).maybeSingle();
  const en = ent?.langue === 'en';
  for (const { p: prop, n, remplace } of retenues) {
    const langue = ['fr', 'en', 'toutes'].includes(String(prop.langue)) ? String(prop.langue) : 'toutes';
    const portee = ['marketplace', 'accounting', 'leo', 'toutes'].includes(String(prop.portee)) ? String(prop.portee) : 'marketplace';
    const ligne = {
      titre: nettoyer(String(prop.titre)).slice(0, 120),
      texte: nettoyer(String(prop.texte)).slice(0, LONGUEUR_SAVOIR),
      langue, portee, source: 'apprentissage', etat: 'propose', actif: false, exemples: n,
      pourquoi: prop.pourquoi ? nettoyer(String(prop.pourquoi)).slice(0, 400) : null,
      a_verifier: prop.a_verifier ? nettoyer(String(prop.a_verifier)).slice(0, 400) || null : null,
      remplace, propose_par: 'finia-apprentissage',
    };
    const { data: neuf, error } = await service.from('ia_savoirs_communs').insert(ligne).select('id').single();
    if (error) { journal.push(`« ${ligne.titre} » : ${error.message}`); continue; }
    journal.push(`« ${ligne.titre} » proposé (${n} échange${n > 1 ? 's' : ''})`);
    if (!auteur || !canal) continue;
    const ou = { marketplace: en ? 'the marketplace' : 'la place de marché', accounting: 'Finjaro Accounting', leo: 'Léo', toutes: en ? 'every app' : 'toutes les applications' }[portee];
    const texte = en
      ? `Finia could learn something this week, from ${n} anonymous exchange${n > 1 ? 's' : ''} (people who did not opt out; no name, no contact kept).\n\n**« ${ligne.titre} »** — for ${ou}\n\n${ligne.texte}\n\n${ligne.pourquoi ? `Why: ${ligne.pourquoi}\n\n` : ''}${ligne.a_verifier ? `To check before confirming: ${ligne.a_verifier}\n\n` : ''}${remplace ? 'It replaces a knowledge item Finia already uses.\n\n' : ''}Finia does not use it until you tap « Confirm ». « Set aside » keeps it off.`
      : `Finia pourrait apprendre quelque chose cette semaine, à partir de ${n} échange${n > 1 ? 's' : ''} anonyme${n > 1 ? 's' : ''} (de personnes qui ne l'ont pas refusé ; aucun nom ni coordonnée gardés).\n\n**« ${ligne.titre} »** — pour ${ou}\n\n${ligne.texte}\n\n${ligne.pourquoi ? `Pourquoi : ${ligne.pourquoi}\n\n` : ''}${ligne.a_verifier ? `À vérifier avant de confirmer : ${ligne.a_verifier}\n\n` : ''}${remplace ? 'Il remplace un savoir que Finia utilise déjà.\n\n' : ''}Finia ne s'en sert pas tant que tu ne touches pas « Confirmer ». « Écarter » le laisse éteint.`;
    const { error: errM } = await service.from('legion_messages').insert({
      entreprise_id: PLATEFORME, canal_id: canal, auteur_id: auteur.id, user_id: null, genre: 'question', texte: texte.slice(0, 5000),
      meta: {
        sans_reponse: true, cout_eur: Number(coutEnCours().toFixed(6)),
        savoir: { savoir_id: neuf.id, exemples: n },
        action: { type: 'activer_savoir', savoir_id: neuf.id, valeur: ligne.titre, statut: 'a_confirmer' },
      },
    });
    if (errM) journal.push(`message : ${errM.message}`);
  }
  if (retenues.length && (!auteur || !canal)) journal.push('aucun agent ni salon dans l’entreprise Finjaro : propositions gardées sans message');

  // Lus, même sans proposition : on ne les relit pas la semaine prochaine.
  const { error: errT } = await service.from('ia_apprentissage').update({ traite_le: new Date().toISOString() }).in('id', lignes.map((l) => l.id));
  if (errT) journal.push(`marquage : ${errT.message}`);
  return json({ ok: true, proposes: retenues.length, journal });
}));
