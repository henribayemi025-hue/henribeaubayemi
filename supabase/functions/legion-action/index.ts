// LEGION — le bouton « Confirmer ».
//
// Beau: « Alpha, déconnecte Finia… il doit pouvoir le faire ». Un agent peut
// PROPOSER une action dans sa réponse (legion-repondre la range dans
// meta.action, statut « a_confirmer »). Rien ne s'exécute avant que le
// fondateur ait cliqué « Confirmer » — c'est ici, avec SON jeton: il faut
// être membre de l'entreprise pour confirmer.
//
// Les actions de cette première version restent à l'intérieur de Legion:
// allumer ou éteindre un agent, retenir une règle, équiper une compétence.
//
// « activer_competence » (0198, Beau 24/09 : « les agents doivent pouvoir
// s'auto-entraîner ») : une compétence qu'un agent a écrite lui-même, qui a
// réussi l'examen de Rigo (legion-examen). Mentor la présente avec deux
// boutons. « Confirmer » l'allume ; « Écarter » (décision « refuser ») la
// laisse éteinte, marquée « ecartee », avec la raison donnée (rien n'est
// supprimé). C'est le SEUL chemin qui allume une compétence écrite par un
// agent : il faut le jeton d'un humain membre de l'entreprise. La même
// décision peut se prendre depuis la fiche de l'agent (corps
// { competence_id, decision }) : la carte du salon suit alors aussi.

import { createClient } from 'jsr:@supabase/supabase-js@2';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

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

// deno-lint-ignore no-explicit-any
type Service = any;

// Allumer ou écarter une compétence écrite par un agent (0198). Seulement si
// elle est de CETTE entreprise, écrite par un agent, et qu'elle attend une
// décision ; une compétence déjà écartée ne se rallume pas par ce chemin.
async function deciderCompetence(service: Service, entrepriseId: string, competenceId: string, decision: 'confirmer' | 'refuser', userId: string, raison?: string): Promise<{ statut: string; resultat: string }> {
  if (!competenceId) return { statut: 'echec', resultat: 'Compétence non précisée.' };
  const { data: c } = await service.from('legion_competences').select('id, nom, agent_id, actif, etat, ajoutee_par')
    .eq('id', competenceId).eq('entreprise_id', entrepriseId).maybeSingle();
  if (!c || c.ajoutee_par !== 'agent' || !c.etat) return { statut: 'echec', resultat: 'Compétence introuvable dans cette entreprise.' };
  const { data: a } = await service.from('legion_agents').select('nom').eq('id', c.agent_id).maybeSingle();
  const qui = a?.nom || 'L’agent';
  const maintenant = new Date().toISOString();
  if (decision === 'refuser') {
    if (c.actif) return { statut: 'echec', resultat: `« ${c.nom} » est déjà active : retire-la depuis la fiche de ${qui}.` };
    if (c.etat === 'ecartee') return { statut: 'refusee', resultat: `« ${c.nom} » était déjà écartée.` };
    const pourquoi = String(raison || '').trim().slice(0, 400);
    const { error } = await service.from('legion_competences').update({ etat: 'ecartee', etat_le: maintenant, decide_par: userId, etat_raison: pourquoi || 'Écartée par le fondateur.' }).eq('id', c.id);
    return error ? { statut: 'echec', resultat: error.message } : { statut: 'refusee', resultat: `Écartée${pourquoi ? ` : ${pourquoi}` : ''}. ${qui} ne s’en servira pas.` };
  }
  if (c.actif) return { statut: 'faite', resultat: `« ${c.nom} » est déjà active.` };
  if (c.etat !== 'a_valider') return { statut: 'echec', resultat: c.etat === 'ecartee' ? `« ${c.nom} » a été écartée.` : `« ${c.nom} » n’a pas (encore) réussi l’examen.` };
  const { error } = await service.from('legion_competences').update({ actif: true, etat: 'active', etat_le: maintenant, decide_par: userId, etat_raison: null }).eq('id', c.id);
  return error ? { statut: 'echec', resultat: error.message } : { statut: 'faite', resultat: `${qui} se sert maintenant de « ${c.nom} ».` };
}

// « activer_savoir » (0202, la Finia commune, Beau 24/09) : un savoir que la
// boucle de la semaine (finia-apprentissage) a tiré de ce que les gens ont
// demandé à Finia. Il sert à TOUTES les Finia (place de marché, demain
// Accounting) : seul un membre de l'entreprise Finjaro de Léo peut le
// confirmer, jamais celui d'une autre entreprise. « Écarter » le laisse
// éteint, marqué « ecarte », avec la raison (rien n'est supprimé).
const PLATEFORME = '44bb201b-6787-4de0-8f7f-f9145d5c03e7'; // l'entreprise Finjaro dans Léo
async function deciderSavoir(service: Service, entrepriseId: string, savoirId: string, decision: 'confirmer' | 'refuser', userId: string, raison?: string): Promise<{ statut: string; resultat: string }> {
  if (entrepriseId !== PLATEFORME) return { statut: 'echec', resultat: 'Seule l’équipe Finjaro valide le savoir de Finia.' };
  if (!savoirId) return { statut: 'echec', resultat: 'Savoir non précisé.' };
  const { data: s } = await service.from('ia_savoirs_communs').select('id, titre, etat, actif, remplace').eq('id', savoirId).maybeSingle();
  if (!s) return { statut: 'echec', resultat: 'Savoir introuvable.' };
  const maintenant = new Date().toISOString();
  if (decision === 'refuser') {
    if (s.actif) return { statut: 'echec', resultat: `« ${s.titre} » est déjà actif.` };
    if (s.etat === 'ecarte') return { statut: 'refusee', resultat: `« ${s.titre} » était déjà écarté.` };
    const pourquoi = String(raison || '').trim().slice(0, 400);
    const { error } = await service.from('ia_savoirs_communs').update({ etat: 'ecarte', raison: pourquoi || 'Écarté par l’équipe.', valide_par: userId, valide_le: maintenant }).eq('id', s.id).eq('actif', false);
    return error ? { statut: 'echec', resultat: error.message } : { statut: 'refusee', resultat: `Écarté${pourquoi ? ` : ${pourquoi}` : ''}. Finia ne s’en servira pas.` };
  }
  if (s.actif) return { statut: 'faite', resultat: `« ${s.titre} » est déjà actif.` };
  if (s.etat !== 'propose') return { statut: 'echec', resultat: `« ${s.titre} » a été ${s.etat === 'ecarte' ? 'écarté' : 'retiré'}.` };
  const { error } = await service.from('ia_savoirs_communs').update({ actif: true, etat: 'actif', valide_par: userId, valide_le: maintenant, raison: null }).eq('id', s.id).eq('etat', 'propose');
  if (error) return { statut: 'echec', resultat: error.message };
  // Une correction d'un savoir déjà actif : l'ancien est retiré (pas supprimé).
  if (s.remplace) {
    await service.from('ia_savoirs_communs').update({ actif: false, etat: 'retire', raison: `Remplacé par « ${s.titre} ».` }).eq('id', s.remplace).neq('id', s.id);
  }
  return { statut: 'faite', resultat: `Finia sait maintenant « ${s.titre} » (dans 5 minutes au plus)${s.remplace ? ', à la place de l’ancien savoir' : ''}.` };
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { message_id?: string; competence_id?: string; decision?: 'confirmer' | 'refuser'; raison?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if ((!corps.message_id && !corps.competence_id) || !['confirmer', 'refuser'].includes(String(corps.decision))) return json({ erreur: 'Demande incomplète.' }, 400);

  // Lu avec le jeton de la personne: si elle n'est pas membre, rien ne revient.
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await personne.auth.getUser();
  if (!user) return json({ erreur: 'Il faut être connecté.' }, 401);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Depuis la fiche de l'agent : la compétence, lue avec le jeton du membre.
  if (!corps.message_id && corps.competence_id) {
    const { data: comp } = await personne.from('legion_competences').select('id, entreprise_id').eq('id', corps.competence_id).maybeSingle();
    if (!comp) return json({ erreur: "Compétence inconnue, ou tu n'es pas membre." }, 403);
    const r = await deciderCompetence(service, comp.entreprise_id, comp.id, corps.decision!, user.id, corps.raison);
    // La carte du salon qui la proposait suit la décision.
    if (r.statut !== 'echec') {
      const { data: cartes } = await service.from('legion_messages').select('id, meta').eq('entreprise_id', comp.entreprise_id)
        .eq('meta->apprise->>competence_id', comp.id).limit(5);
      for (const m of (cartes || []) as Array<{ id: string; meta: Record<string, unknown> & { action?: Record<string, unknown> } }>) {
        if (m.meta?.action?.statut !== 'a_confirmer') continue;
        await service.from('legion_messages').update({
          meta: { ...m.meta, action: { ...m.meta.action, statut: r.statut, resultat: r.resultat, par: user.id, le: new Date().toISOString() } },
          repondu_le: new Date().toISOString(),
        }).eq('id', m.id);
      }
    }
    return json(r);
  }

  const { data: msg } = await personne.from('legion_messages').select('id, entreprise_id, auteur_id, meta').eq('id', corps.message_id).maybeSingle();
  if (!msg) return json({ erreur: "Message inconnu, ou tu n'es pas membre." }, 403);
  const action = (msg.meta as { action?: Record<string, string> } | null)?.action;
  if (!action || action.statut !== 'a_confirmer') return json({ erreur: 'Rien à confirmer ici (déjà fait ou refusé).' }, 409);

  const marquer = async (statut: string, resultat: string) => {
    await service.from('legion_messages').update({
      meta: { ...(msg.meta as Record<string, unknown>), action: { ...action, statut, resultat, par: user.id, le: new Date().toISOString() } },
      // Une compétence à valider est une question posée au fondateur : une
      // fois tranchée, elle ne compte plus parmi ce qui l'attend.
      ...((action.type === 'activer_competence' || action.type === 'activer_savoir') && statut !== 'echec' ? { repondu_le: new Date().toISOString() } : {}),
    }).eq('id', msg.id);
    return json({ statut, resultat });
  };

  if (action.type === 'activer_competence') {
    const r = await deciderCompetence(service, msg.entreprise_id, String(action.competence_id || ''), corps.decision!, user.id, corps.raison);
    return marquer(r.statut, r.resultat);
  }

  if (action.type === 'activer_savoir') {
    const r = await deciderSavoir(service, msg.entreprise_id, String(action.savoir_id || ''), corps.decision!, user.id, corps.raison);
    return marquer(r.statut, r.resultat);
  }

  if (corps.decision === 'refuser') return marquer('refusee', 'Refusé par le fondateur.');

  // L'agent visé doit être de CETTE entreprise.
  const agentDeLaMaison = async () => {
    if (!action.agent_id) return null;
    const { data } = await service.from('legion_agents').select('id, nom').eq('id', action.agent_id).eq('entreprise_id', msg.entreprise_id).maybeSingle();
    return data;
  };

  switch (action.type) {
    case 'allumer_agent':
    case 'eteindre_agent': {
      const a = await agentDeLaMaison();
      if (!a) return marquer('echec', 'Agent introuvable dans cette entreprise.');
      const actif = action.type === 'allumer_agent';
      const { error } = await service.from('legion_agents').update({ actif }).eq('id', a.id);
      return error ? marquer('echec', error.message) : marquer('faite', `${a.nom} est ${actif ? 'allumé' : 'éteint'}.`);
    }
    case 'retenir_regle': {
      const regle = String(action.valeur || '').trim();
      if (regle.length < 3) return marquer('echec', 'Règle vide.');
      const { error } = await service.from('legion_memoire').insert({ entreprise_id: msg.entreprise_id, regle, source: 'main', message_id: msg.id, cree_par: user.id });
      return error ? marquer('echec', error.message) : marquer('faite', 'Règle retenue pour toute l’équipe.');
    }
    case 'equiper_competence': {
      const a = await agentDeLaMaison();
      if (!a) return marquer('echec', 'Agent introuvable dans cette entreprise.');
      // Même chemin que le bouton « Équiper » (lecture de la fiche à sa source, licence vérifiée).
      const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-competences`, {
        method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_ANON_KEY')! },
        body: JSON.stringify({ action: 'equiper', entreprise_id: msg.entreprise_id, agent_id: a.id, catalogue_cle: action.valeur }),
      });
      const b = await r.json().catch(() => ({}));
      return b?.ok ? marquer('faite', `${a.nom} est équipé.`) : marquer('echec', b?.erreur || `HTTP ${r.status}`);
    }
    case 'engager_agent': {
      // Un responsable a proposé une fiche (idée 3 des 200, 24/09) :
      // « Prénom Nom | Poste | Département | Ce qu'il fera ». Le fondateur a
      // confirmé : l'agent rejoint l'équipe, allumé, supervisé.
      const [nom, poste, dep, mandat] = String(action.valeur || '').split('|').map((x) => x.trim());
      if (!nom || !poste) return marquer('echec', 'Fiche incomplète (il faut au moins un nom et un poste).');
      const [{ data: agents }, { data: salons }, { data: auteur }] = await Promise.all([
        service.from('legion_agents').select('cle').eq('entreprise_id', msg.entreprise_id),
        service.from('legion_canaux').select('nom, prive_entre').eq('entreprise_id', msg.entreprise_id),
        service.from('legion_agents').select('nom, departement').eq('id', msg.auteur_id).maybeSingle(),
      ]);
      const sans = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      // Un département qui existe; sinon celui du responsable qui propose.
      const departement = (salons || []).find((s: { nom: string; prive_entre: string[] | null }) => !s.prive_entre?.length && sans(s.nom) === sans(dep || ''))?.nom || auteur?.departement || null;
      const base = sans(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent';
      const pris = new Set((agents || []).map((x: { cle: string }) => x.cle));
      let cle = base; for (let i = 2; pris.has(cle); i += 1) cle = `${base}-${i}`;
      const { data: neuf, error } = await service.from('legion_agents').insert({
        entreprise_id: msg.entreprise_id, cle, nom: nom.slice(0, 80), poste: poste.slice(0, 120), departement,
        mandat: (mandat || poste).slice(0, 600), actif: true, ordre: 850, autonomie: 'supervise',
        mission: { type: 'engage', par: auteur?.nom || null, debut: new Date().toISOString().slice(0, 10) },
      }).select('id').single();
      if (error) return marquer('echec', error.message);
      // Sa photo, il la choisit lui-même en arrivant (Beau, 24/09: Ada était
      // restée sans visage). En fond: le clic « Confirmer » n'attend pas.
      const photo = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-portrait`, {
        method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entreprise_id: msg.entreprise_id, agent_id: neuf.id }), signal: AbortSignal.timeout(120_000),
      }).catch((e) => console.error('portrait:', (e as Error).message));
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(photo);
      return marquer('faite', `${nom} rejoint l'équipe${departement ? ` (${departement})` : ''}, allumé et supervisé. Il choisit sa photo.`);
    }
    default:
      return marquer('echec', 'Action inconnue.');
  }
});
