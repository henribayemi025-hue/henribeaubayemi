// LEGION — la formation des agents : remplir la mémoire de NOTRE IA.
//
// Beau, 29/09 : « je t'ai dit de former les agents… notre propre IA ». Les
// réponses apprises (0217) ne se remplissaient qu'avec les 👍 : zéro le
// premier jour, donc notre IA ne répondait jamais à la place d'un moteur.
//
// Ici, un modèle fort sert de professeur (DeepSeek d'abord, dans l'ordre de
// moteur.ts — autorisé par ses conditions) : pour chaque agent allumé, il
// rédige les réponses aux questions de base (salut, « comment tu vas »,
// « qui es-tu », « comment tu peux m'aider »…), dans SA personnalité et selon
// la charte. Elles entrent dans legion_reponses_apprises (source
// 'formation') : la prochaine fois, notre IA répond seule, tout de suite,
// sans moteur et sans rien payer.
//
// Garde-fous : uniquement des réponses INTEMPORELLES (ni tâche en cours, ni
// chiffre, ni date, ni promesse) — ce qui dépend du moment passe toujours par
// un moteur (legion-repondre, DU_MOMENT). Un 👎 sur une réponse resservie
// l'oublie, comme pour les autres. Chaque entreprise est formée pour elle-même.
//
// Appelée par le serveur (lancer_legion_former, chaque matin : les agents
// engagés la veille sont formés à leur tour), avec le jeton interne.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CHARTE } from '../_shared/charte.ts';
import { compter, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteursSimples } from '../_shared/moteur.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const QUESTIONS = [
  'bonjour', 'salut', 'bonsoir', 'comment tu vas ?', 'ça va ?', 'merci', 'merci beaucoup',
  'qui es-tu ?', 'tu fais quoi ?', "c'est quoi ton rôle ?", 'comment tu peux m\'aider ?', 'tu es une IA ?',
  'au revoir', 'bonne nuit', 'bonne journée',
  'hello', 'how are you?', 'thank you', 'who are you?',
];
const DEJA_FORME = 10; // au-delà, l'agent est considéré comme formé

// LA VOIX (0220, Beau 29/09 : « comme les humains, lancer des blagues, troller »).
// Quelques répliques types, dans des situations qui montrent le caractère ;
// legion-repondre les montre à l'agent comme exemples de SA façon de parler.
const SITUATIONS = [
  'quelqu\'un arrive en mode copain, très familier (« wesh », « frérot », argot)',
  'une question de travail sérieuse et polie, sur ton métier',
  'quelqu\'un te taquine ou te lance une petite pique pour rire',
  'quelqu\'un est agacé parce que quelque chose ne marche pas',
  'quelqu\'un partage une bonne nouvelle',
];
const SCHEMA_VOIX = {
  type: 'OBJECT',
  properties: { voix: { type: 'ARRAY', items: { type: 'OBJECT', properties: { on_lui_dit: { type: 'STRING' }, il_repond: { type: 'STRING' } }, required: ['on_lui_dit', 'il_repond'] } } },
  required: ['voix'],
};
function consigneVoix(a: Agent, entreprise: { nom: string; projet: string | null }): string {
  return `${CHARTE}
Tu es ${a.nom}, ${a.poste}${a.departement ? ` (département ${a.departement})` : ''} chez « ${entreprise.nom} ».
Ton mandat : ${a.mandat || 'faire ton métier.'}
Ta personnalité : ${a.personnalite || 'Direct, précis, chaleureux.'}

Écris ta VOIX : pour chacune de ces situations, invente ce qu'on te dit (« on_lui_dit », une phrase naturelle, comme un vrai message) et ce que TU réponds (« il_repond »), exactement comme tu parlerais :
${SITUATIONS.map((x, i) => `${i + 1}. ${x}`).join('\n')}

Règles :
- tu parles comme une vraie personne sur une messagerie : phrases courtes, tutoiement, un emoji quand il vient tout seul, de l'humour ;
- tu CALQUES le ton de l'autre : familier avec le familier, posé avec le sérieux ; à une taquinerie tu réponds du tac au tac, avec une petite vanne gentille (jamais blessante) ;
- ta personnalité doit se reconnaître : une manie, une expression à toi, ton humour à toi ;
- aucun tic d'IA (« crucial », « essentiel », « n'hésite pas », « absolument », « en effet », résumé final, proposition d'aide finale) ;
- aucun chiffre, aucune date, aucun fait inventé sur l'entreprise ; une à trois phrases par réponse.`;
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    reponses: { type: 'ARRAY', items: { type: 'OBJECT', properties: { question: { type: 'STRING' }, reponse: { type: 'STRING' } }, required: ['question', 'reponse'] } },
  },
  required: ['reponses'],
};

type Agent = { id: string; nom: string; poste: string; departement: string | null; mandat: string | null; personnalite: string | null; voix?: unknown };

function consigne(a: Agent, entreprise: { nom: string; projet: string | null }): string {
  return `${CHARTE}
Tu es ${a.nom}, ${a.poste}${a.departement ? ` (département ${a.departement})` : ''} chez « ${entreprise.nom} ».
${entreprise.projet ? `Le projet de l'entreprise : ${String(entreprise.projet).slice(0, 1500)}\n` : ''}Ton mandat : ${a.mandat || 'faire ton métier.'}
Ta personnalité : ${a.personnalite || 'Direct, précis, chaleureux.'}

On prépare tes réponses aux questions de base, celles qu'on te pose sans cesse. Pour CHACUNE des questions ci-dessous, écris la réponse que TU donnerais, avec ta façon de parler :
${QUESTIONS.map((q) => `- ${q}`).join('\n')}

Règles :
- une à trois phrases, vivantes, humaines, dans la langue de la question (français ou anglais) ;
- INTEMPORELLE : elle doit rester vraie dans un mois. Donc aucune tâche en cours, aucun chiffre, aucune date, aucune promesse, aucun « aujourd'hui », aucun nom de collègue ;
- « qui es-tu », « ton rôle », « comment tu peux m'aider » : ton métier et ce que tu apportes à l'entreprise, concrètement ;
- « tu es une IA ? » : oui, dit franchement et avec ta personnalité ;
- « comment tu vas », « ça va » : réponds comme un collègue chaleureux (« ça va bien, merci ! et toi ? »), jamais « je n'ai pas d'émotions » ni « je suis un programme » — c'est froid et hors sujet ;
- tutoie la personne, comme le reste de l'équipe ;
- écris comme une vraie personne sur une messagerie : un emoji quand il vient naturellement (😊 🙌 👋), de l'enthousiasme, de l'humour selon ta personnalité ;
- recopie la question exactement dans "question".`;
}

Deno.serve(compter('legion_former', async (req: Request) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const jeton = req.headers.get('x-finjaro-token');
  const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_travail').maybeSingle();
  if (!jeton || !sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
  const apiKey = Deno.env.get('GEMINI_API_KEY') || '';

  let corps: { entreprise_id?: string; limite?: number } = {};
  try { corps = await req.json(); } catch { /* corps vide : toutes les entreprises */ }
  // Cinq agents par passage (le temps d'une fonction est compté) ; s'il en reste,
  // le passage suivant se lance tout seul.
  const limite = Math.min(Math.max(Number(corps.limite) || 5, 1), 10);

  // Les agents allumés (pas les humains, pas Claude) qui ne sont pas encore formés.
  let q = service.from('legion_agents').select('id, entreprise_id, nom, poste, departement, mandat, personnalite, voix')
    .is('user_id', null).eq('actif', true).neq('moteur', 'claude-code');
  if (corps.entreprise_id) q = q.eq('entreprise_id', corps.entreprise_id);
  const { data: agents } = await q.limit(400);
  const { data: formes } = await service.from('legion_reponses_apprises').select('agent_id').eq('source', 'formation');
  const nb = new Map<string, number>();
  for (const f of (formes || []) as { agent_id: string }[]) nb.set(f.agent_id, (nb.get(f.agent_id) ?? 0) + 1);
  const tous = ((agents || []) as (Agent & { entreprise_id: string })[]).filter((a) => (nb.get(a.id) ?? 0) < DEJA_FORME);
  const aFormer = tous.slice(0, limite);

  const entreprises = new Map<string, { nom: string; projet: string | null }>();
  const resultats: Array<{ agent: string; ajoutees: number; erreur?: string }> = [];
  for (const a of aFormer) {
    if (!entreprises.has(a.entreprise_id)) {
      const { data: e } = await service.from('legion_entreprises').select('nom, projet').eq('id', a.entreprise_id).maybeSingle();
      entreprises.set(a.entreprise_id, { nom: e?.nom || 'l’entreprise', projet: e?.projet || null });
    }
    pourEntreprise(a.entreprise_id);
    const r = await generer(apiKey, consigne(a, entreprises.get(a.entreprise_id)!), SCHEMA, { temperature: 0.8, reflexion: 1024, delaiMs: 60_000, maxSortie: 6000, modeles: moteursSimples() });
    if ('erreur' in r) { resultats.push({ agent: a.nom, ajoutees: 0, erreur: r.erreur.slice(0, 120) }); continue; }
    const connues = new Set(QUESTIONS.map((x) => x.toLowerCase()));
    const lignes = ((r.obj.reponses || []) as { question?: string; reponse?: string }[])
      .map((x) => ({ question: String(x.question || '').trim(), reponse: String(x.reponse || '').trim() }))
      .filter((x) => connues.has(x.question.toLowerCase()) && x.reponse.length >= 2 && x.reponse.length <= 600
        // Rien qui dépende du moment ni aucun chiffre : la réponse doit rester vraie.
        && !/\d/.test(x.reponse) && !/aujourd|en ce moment|actuellement|cette semaine|ce matin|ce soir|demain|hier|je travaille sur|je suis sur|pas d'émotion|je suis un programme|don't (experience|have) feelings/i.test(x.reponse))
      .map((x) => ({ entreprise_id: a.entreprise_id, agent_id: a.id, question: x.question, reponse: x.reponse, source: 'formation' }));
    if (!lignes.length) { resultats.push({ agent: a.nom, ajoutees: 0, erreur: 'aucune réponse retenue' }); continue; }
    const { error } = await service.from('legion_reponses_apprises').insert(lignes);
    resultats.push({ agent: a.nom, ajoutees: error ? 0 : lignes.length, ...(error ? { erreur: error.message } : {}) });
  }
  // La voix (0220) : les agents qui n'en ont pas encore, cinq par passage.
  const sansVoix = ((agents || []) as (Agent & { entreprise_id: string })[]).filter((a) => !a.voix);
  let voixFaites = 0;
  for (const a of sansVoix.slice(0, limite)) {
    if (!entreprises.has(a.entreprise_id)) {
      const { data: e } = await service.from('legion_entreprises').select('nom, projet').eq('id', a.entreprise_id).maybeSingle();
      entreprises.set(a.entreprise_id, { nom: e?.nom || 'l’entreprise', projet: e?.projet || null });
    }
    pourEntreprise(a.entreprise_id);
    const r = await generer(apiKey, consigneVoix(a, entreprises.get(a.entreprise_id)!), SCHEMA_VOIX, { temperature: 0.9, reflexion: 1024, delaiMs: 60_000, maxSortie: 3000, modeles: moteursSimples() });
    if ('erreur' in r) continue;
    const voix = ((r.obj.voix || []) as { on_lui_dit?: string; il_repond?: string }[])
      .map((v) => ({ on_lui_dit: String(v.on_lui_dit || '').trim().slice(0, 200), il_repond: String(v.il_repond || '').trim().slice(0, 400) }))
      .filter((v) => v.on_lui_dit && v.il_repond && !/\d/.test(v.il_repond) && !/crucial|essentiel|n'hésite pas|absolument/i.test(v.il_repond));
    if (voix.length < 3) continue;
    const { error } = await service.from('legion_agents').update({ voix }).eq('id', a.id);
    if (!error) voixFaites += 1;
  }

  // La suite, s'il reste des agents à former (et si ce passage a avancé).
  const restants = tous.length - aFormer.length + Math.max(0, sansVoix.length - limite);
  if (restants > 0 && (resultats.some((x) => x.ajoutees > 0) || voixFaites > 0)) {
    const suite = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-former`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-finjaro-token': jeton },
      body: JSON.stringify({ ...(corps.entreprise_id ? { entreprise_id: corps.entreprise_id } : {}), limite }),
    }).catch((e) => console.error('suite:', (e as Error).message));
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(suite);
  }
  return json({ formes: resultats.length, voix: voixFaites, restants, resultats });
}));
