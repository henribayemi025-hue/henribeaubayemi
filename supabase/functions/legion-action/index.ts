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

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { message_id?: string; decision?: 'confirmer' | 'refuser' };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  if (!corps.message_id || !['confirmer', 'refuser'].includes(String(corps.decision))) return json({ erreur: 'Demande incomplète.' }, 400);

  // Lu avec le jeton de la personne: si elle n'est pas membre, rien ne revient.
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await personne.auth.getUser();
  const { data: msg } = await personne.from('legion_messages').select('id, entreprise_id, auteur_id, meta').eq('id', corps.message_id).maybeSingle();
  if (!msg || !user) return json({ erreur: "Message inconnu, ou tu n'es pas membre." }, 403);
  const action = (msg.meta as { action?: Record<string, string> } | null)?.action;
  if (!action || action.statut !== 'a_confirmer') return json({ erreur: 'Rien à confirmer ici (déjà fait ou refusé).' }, 409);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const marquer = async (statut: string, resultat: string) => {
    await service.from('legion_messages').update({
      meta: { ...(msg.meta as Record<string, unknown>), action: { ...action, statut, resultat, par: user.id, le: new Date().toISOString() } },
    }).eq('id', msg.id);
    return json({ statut, resultat });
  };

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
      const { error } = await service.from('legion_agents').insert({
        entreprise_id: msg.entreprise_id, cle, nom: nom.slice(0, 80), poste: poste.slice(0, 120), departement,
        mandat: (mandat || poste).slice(0, 600), actif: true, ordre: 850, autonomie: 'supervise',
        mission: { type: 'engage', par: auteur?.nom || null, debut: new Date().toISOString().slice(0, 10) },
      });
      return error ? marquer('echec', error.message) : marquer('faite', `${nom} rejoint l'équipe${departement ? ` (${departement})` : ''}, allumé et supervisé.`);
    }
    default:
      return marquer('echec', 'Action inconnue.');
  }
});
