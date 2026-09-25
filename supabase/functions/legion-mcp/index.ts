// LEGION PARLE MCP — brancher Claude, ChatGPT, Claude Code, n'importe quel
// assistant (point 24 de Beau, 23/09: « brancher Claude, Astra, ses propres
// outils »).
//
// Protocole MCP « Streamable HTTP », version 2025-06-18, réduit à ce qui
// sert: initialize, ping, tools/list, tools/call. Pas de flux SSE (GET →
// 405): chaque appel est une requête POST JSON-RPC et une réponse.
//
// LA CLÉ: un jeton personnel (0174), créé dans « Connecteurs → Mon
// assistant », montré une fois. Deux façons de le présenter, parce que les
// clients ne se ressemblent pas:
//   - dans l'adresse:   …/functions/v1/legion-mcp/lg_xxxxxxxx   (Claude.ai,
//     ChatGPT: « connecteur sans authentification »)
//   - dans l'en-tête:   Authorization: Bearer lg_xxxxxxxx      (Claude Code,
//     mcp-remote)
// Le jeton désigne UNE personne; chaque outil vérifie qu'elle est membre de
// l'entreprise visée (legion_membres). L'assistant ne voit et ne fait que ce
// qu'elle pourrait voir et faire elle-même dans Legion.
//
// LES OUTILS. Lecture: mes_entreprises, agents, salons, messages, taches,
// feuille_de_route. Écriture, bornée: ecrire (un message dans un salon, au
// nom de la personne — les agents répondent comme à elle), creer_tache,
// cocher_feuille. Rien de destructif, rien sur les réglages, rien sur les
// jetons ni les connecteurs.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

type Json = Record<string, unknown>;
const VERSION_PROTOCOLE = '2025-06-18';

const entetes = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const reponse = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: entetes });
const rpcOk = (id: unknown, result: unknown) => reponse({ jsonrpc: '2.0', id: id ?? null, result });
const rpcErreur = (id: unknown, code: number, message: string, s = 200) => reponse({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, s);

// ----------------------------------------------------------------- outils
const OUTILS = [
  { name: 'mes_entreprises', description: "Les entreprises Léo de la personne (nom, rôle, langue). À appeler d'abord: les autres outils veulent un entreprise_id.", inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'agents', description: "L'équipe d'une entreprise: agents avec nom, poste, département, allumé ou non.", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' } }, required: ['entreprise_id'] } },
  { name: 'salons', description: "Les salons (canaux) d'une entreprise que la personne voit, avec leur rôle.", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' } }, required: ['entreprise_id'] } },
  { name: 'messages', description: 'Les derniers messages d’un salon (auteur, date, genre, texte), du plus récent au plus ancien.', inputSchema: { type: 'object', properties: { canal_id: { type: 'string' }, limite: { type: 'integer', minimum: 1, maximum: 100 } }, required: ['canal_id'] } },
  { name: 'taches', description: "Les tâches du tableau d'une entreprise (titre, statut, priorité, à qui, échéance).", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' }, statut: { type: 'string', enum: ['a_faire', 'en_cours', 'valide', 'renvoye', 'termine'] } }, required: ['entreprise_id'] } },
  { name: 'feuille_de_route', description: "La feuille de route de l'entreprise: trimestre, mois, semaine, jour, lignes récurrentes; ce qui est fait et commenté.", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' }, horizon: { type: 'string', enum: ['trimestre', 'mois', 'semaine', 'jour', 'recurrent'] } }, required: ['entreprise_id'] } },
  { name: 'ecrire', description: "Écrit un message dans un salon, AU NOM de la personne (comme si elle le tapait dans Léo). Les agents du salon répondent. À n'utiliser que quand elle l'a demandé.", inputSchema: { type: 'object', properties: { canal_id: { type: 'string' }, texte: { type: 'string', minLength: 1, maxLength: 4000 } }, required: ['canal_id', 'texte'] } },
  { name: 'creer_tache', description: "Ajoute une tâche au tableau d'une entreprise, dans un salon, confiée à un agent (par son nom) ou à personne.", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' }, canal_id: { type: 'string' }, titre: { type: 'string', minLength: 3, maxLength: 200 }, agent: { type: 'string', description: "Le nom de l'agent (facultatif)" }, priorite: { type: 'string', enum: ['haute', 'normale', 'basse'] } }, required: ['entreprise_id', 'canal_id', 'titre'] } },
  { name: 'taches_ordinateur', description: "Les tâches que l'entreprise a confiées à « mon ordinateur » : ce que l'assistant branché sur l'ordinateur de la personne (Claude dans Chrome, Claude pour ordinateur) doit faire à l'écran, sous ses yeux. Les plus urgentes d'abord.", inputSchema: { type: 'object', properties: { entreprise_id: { type: 'string' } }, required: ['entreprise_id'] } },
  { name: 'prendre_tache_ordinateur', description: "Annonce qu'on commence une tâche « mon ordinateur » (elle passe « en cours » dans Léo, et l'immeuble montre l'ordinateur au travail). À appeler juste avant de la faire.", inputSchema: { type: 'object', properties: { tache_id: { type: 'string' } }, required: ['tache_id'] } },
  { name: 'rendre_tache_ordinateur', description: "Rend une tâche « mon ordinateur » : le compte rendu (ce qui a été fait à l'écran, ce qui a été vu, ce qui reste), écrit dans le salon de la tâche, qui passe « à revoir ». « bloque » si elle n'a pas pu être faite, avec la raison.", inputSchema: { type: 'object', properties: { tache_id: { type: 'string' }, compte_rendu: { type: 'string', minLength: 3, maxLength: 8000 }, bloque: { type: 'boolean' } }, required: ['tache_id', 'compte_rendu'] } },
  { name: 'cocher_feuille', description: 'Marque une ligne de la feuille de route comme faite, avec un commentaire facultatif.', inputSchema: { type: 'object', properties: { ligne_id: { type: 'string' }, commentaire: { type: 'string', maxLength: 1000 } }, required: ['ligne_id'] } },
];

function texte(x: unknown): Json { return { content: [{ type: 'text', text: typeof x === 'string' ? x : JSON.stringify(x, null, 1) }] }; }
function refus(msg: string): Json { return { content: [{ type: 'text', text: msg }], isError: true }; }

async function membre(service: SupabaseClient, userId: string, entrepriseId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/.test(entrepriseId)) return false;
  const { data } = await service.from('legion_membres').select('user_id').eq('entreprise_id', entrepriseId).eq('user_id', userId).maybeSingle();
  return !!data;
}
// Le canal → son entreprise, et la personne y est-elle membre ? Rend aussi
// son propre agent (auteur des messages qu'elle écrit).
async function acces(service: SupabaseClient, userId: string, canalId: string) {
  if (!/^[0-9a-f-]{36}$/.test(canalId)) return null;
  const { data: canal } = await service.from('legion_canaux').select('id, entreprise_id, nom, prive_entre').eq('id', canalId).maybeSingle();
  if (!canal || !(await membre(service, userId, canal.entreprise_id))) return null;
  const { data: moi } = await service.from('legion_agents').select('id, cle, nom').eq('entreprise_id', canal.entreprise_id).eq('user_id', userId).maybeSingle();
  const prive = Array.isArray(canal.prive_entre) && canal.prive_entre.length > 0;
  if (prive && !(moi && canal.prive_entre.includes(moi.cle))) return null;
  return { canal, moi };
}

async function executer(service: SupabaseClient, userId: string, nom: string, args: Json): Promise<Json> {
  const s = (k: string) => String(args[k] ?? '');
  switch (nom) {
    case 'mes_entreprises': {
      const { data } = await service.from('legion_membres').select('role, legion_entreprises(id, nom, langue, modele)').eq('user_id', userId);
      return texte((data ?? []).map((m: Json) => ({ ...(m.legion_entreprises as Json), role: m.role })));
    }
    case 'agents': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      const { data } = await service.from('legion_agents').select('id, nom, poste, departement, actif, user_id').eq('entreprise_id', s('entreprise_id')).order('ordre');
      return texte((data ?? []).map((a: Json) => ({ id: a.id, nom: a.nom, poste: a.poste, departement: a.departement, allume: a.actif, humain: !!a.user_id })));
    }
    case 'salons': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      const { data: moi } = await service.from('legion_agents').select('cle').eq('entreprise_id', s('entreprise_id')).eq('user_id', userId).maybeSingle();
      const { data } = await service.from('legion_canaux').select('id, nom, a_quoi_ca_sert, emoji, prive_entre').eq('entreprise_id', s('entreprise_id')).order('ordre');
      const visibles = (data ?? []).filter((c: Json) => !Array.isArray(c.prive_entre) || c.prive_entre.length === 0 || (moi && (c.prive_entre as string[]).includes(moi.cle)));
      return texte(visibles.map((c: Json) => ({ id: c.id, nom: c.nom, role: c.a_quoi_ca_sert, prive: Array.isArray(c.prive_entre) && c.prive_entre.length > 0 })));
    }
    case 'messages': {
      const a = await acces(service, userId, s('canal_id'));
      if (!a) return refus('Salon introuvable, ou pas accessible.');
      const limite = Math.min(100, Math.max(1, Number(args.limite) || 30));
      const { data } = await service.from('legion_messages').select('id, texte, genre, created_at, assigne_a, meta, legion_agents!legion_messages_auteur_id_fkey(nom)').eq('canal_id', a.canal.id).order('created_at', { ascending: false }).limit(limite);
      return texte((data ?? []).map((m: Json) => ({ id: m.id, quand: m.created_at, auteur: (m.legion_agents as Json | null)?.nom ?? '—', genre: m.genre, texte: m.texte, statut: (m.meta as Json | null)?.statut })));
    }
    case 'taches': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      let q = service.from('legion_messages').select('id, texte, echeance, termine_le, created_at, meta, canal_id, assigne:legion_agents!legion_messages_assigne_a_fkey(nom)').eq('entreprise_id', s('entreprise_id')).eq('genre', 'tache').order('created_at', { ascending: false }).limit(100);
      if (args.statut) q = q.contains('meta', { statut: s('statut') });
      const { data } = await q;
      return texte((data ?? []).map((m: Json) => ({ id: m.id, titre: m.texte, statut: (m.meta as Json | null)?.statut ?? 'a_faire', priorite: (m.meta as Json | null)?.priorite, a: (m.assigne as Json | null)?.nom ?? null, echeance: m.echeance, termine_le: m.termine_le, canal_id: m.canal_id })));
    }
    case 'feuille_de_route': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      let q = service.from('legion_feuille').select('id, horizon, debut, fin, titre, detail, recurrence, fait, fait_le, commentaire, ordre, responsable:legion_agents!legion_feuille_responsable_fkey(nom)').eq('entreprise_id', s('entreprise_id')).order('debut').order('ordre').limit(300);
      if (args.horizon) q = q.eq('horizon', s('horizon'));
      else q = q.gte('debut', new Date(Date.now() - 14 * 86400e3).toISOString().slice(0, 10));
      const { data } = await q;
      return texte((data ?? []).map((l: Json) => ({ id: l.id, horizon: l.horizon, debut: l.debut, titre: l.titre, detail: l.detail || undefined, responsable: (l.responsable as Json | null)?.nom ?? null, recurrence: l.recurrence || undefined, fait: l.fait, commentaire: l.commentaire || undefined })));
    }
    case 'ecrire': {
      const a = await acces(service, userId, s('canal_id'));
      if (!a) return refus('Salon introuvable, ou pas accessible.');
      if (!a.moi) return refus("La personne n'a pas d'agent dans cette entreprise: elle ne peut pas y écrire.");
      const contenu = s('texte').trim().slice(0, 4000);
      if (!contenu) return refus('Texte vide.');
      const { data: ligne, error } = await service.from('legion_messages').insert({ entreprise_id: a.canal.entreprise_id, canal_id: a.canal.id, auteur_id: a.moi.id, user_id: userId, texte: contenu, genre: 'info', meta: { par: 'assistant' } }).select('id').single();
      if (error || !ligne) return refus('Message non envoyé: ' + (error?.message ?? 'inconnu'));
      // Les agents répondent comme à un message tapé dans Legion.
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-repondre`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }, body: JSON.stringify({ message_id: ligne.id }) }).catch(() => {});
      return texte({ envoye: true, message_id: ligne.id, salon: a.canal.nom });
    }
    case 'creer_tache': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      const a = await acces(service, userId, s('canal_id'));
      if (!a || a.canal.entreprise_id !== s('entreprise_id')) return refus("Salon introuvable dans cette entreprise.");
      if (!a.moi) return refus("La personne n'a pas d'agent dans cette entreprise.");
      let assigne: string | null = null;
      if (args.agent) {
        const { data: ag } = await service.from('legion_agents').select('id, nom, user_id').eq('entreprise_id', s('entreprise_id')).ilike('nom', s('agent').trim()).maybeSingle();
        if (!ag) return refus(`Aucun agent nommé « ${s('agent')} ».`);
        if (ag.user_id) return refus('Une tâche se confie à un agent, pas à une personne.');
        assigne = ag.id;
      }
      const priorite = ['haute', 'normale', 'basse'].includes(s('priorite')) ? s('priorite') : 'normale';
      const { data: ligne, error } = await service.from('legion_messages').insert({ entreprise_id: s('entreprise_id'), canal_id: a.canal.id, auteur_id: a.moi.id, user_id: userId, texte: s('titre').trim().slice(0, 200), genre: 'tache', assigne_a: assigne, meta: { statut: 'a_faire', priorite, par: 'assistant' } }).select('id').single();
      if (error || !ligne) return refus('Tâche non créée: ' + (error?.message ?? 'inconnu'));
      return texte({ creee: true, tache_id: ligne.id });
    }
    // « MON ORDINATEUR » (Beau, 25/09 : « les agents prennent possession de ton
    // ordinateur »). Jamais en cachette : c'est l'assistant que la personne a
    // elle-même branché sur SON ordinateur qui prend la tâche, écran visible,
    // et qui peut s'arrêter à tout moment. Les agents de Léo ne prennent
    // jamais ces tâches (legion-travail).
    case 'taches_ordinateur': {
      if (!(await membre(service, userId, s('entreprise_id')))) return refus("Pas membre de cette entreprise.");
      const { data } = await service.from('legion_messages').select('id, texte, created_at, meta, canal_id').eq('entreprise_id', s('entreprise_id')).eq('genre', 'tache').contains('meta', { ordinateur: true }).is('termine_le', null).order('created_at').limit(50);
      const rang = (m: Json) => ({ urgente: 0, haute: 1 } as Record<string, number>)[String((m.meta as Json | null)?.priorite || '')] ?? 2;
      const ouvertes = (data ?? []).filter((m: Json) => ['a_faire', 'en_cours', 'renvoye', undefined].includes((m.meta as Json | null)?.statut as string | undefined)).sort((a: Json, b: Json) => rang(a) - rang(b));
      return texte({
        regles: "Fais seulement ce que la tâche décrit, à l'écran de la personne. Avant tout envoi à quelqu'un, paiement, achat, suppression, publication ou changement de mot de passe : demande-lui d'abord. Rends toujours un compte rendu (rendre_tache_ordinateur), même si tu es bloqué.",
        taches: ouvertes.map((m: Json) => ({ id: m.id, titre: m.texte, priorite: (m.meta as Json | null)?.priorite ?? 'normale', statut: (m.meta as Json | null)?.statut ?? 'a_faire', remarque: (m.meta as Json | null)?.remarque, depuis: m.created_at })),
      });
    }
    case 'prendre_tache_ordinateur':
    case 'rendre_tache_ordinateur': {
      if (!/^[0-9a-f-]{36}$/.test(s('tache_id'))) return refus('Tâche introuvable.');
      const { data: t } = await service.from('legion_messages').select('id, entreprise_id, canal_id, texte, meta, genre').eq('id', s('tache_id')).maybeSingle();
      if (!t || t.genre !== 'tache' || !(t.meta as Json | null)?.ordinateur) return refus("Ce n'est pas une tâche « mon ordinateur ».");
      const a = await acces(service, userId, t.canal_id);
      if (!a || !a.moi) return refus('Tâche pas accessible.');
      const maintenant = new Date().toISOString();
      if (nom === 'prendre_tache_ordinateur') {
        await service.from('legion_messages').update({ meta: { ...(t.meta as Json), statut: 'en_cours', travaille_depuis: maintenant, pris_par_ordinateur: maintenant } }).eq('id', t.id);
        return texte({ pris: true, titre: t.texte });
      }
      const bloque = args.bloque === true;
      const cr = s('compte_rendu').trim().slice(0, 8000);
      const { data: ligne, error } = await service.from('legion_messages').insert({
        entreprise_id: t.entreprise_id, canal_id: t.canal_id, auteur_id: a.moi.id, user_id: userId, genre: 'info',
        texte: `🖥 **Mon ordinateur — ${String(t.texte).slice(0, 150)}**\n\n${cr}`,
        meta: { par: 'ordinateur', livrable: { tache_id: t.id, tache: t.texte, statut: bloque ? 'bloque' : 'termine' }, sans_reponse: true },
      }).select('id').single();
      if (error || !ligne) return refus('Compte rendu non écrit : ' + (error?.message ?? 'inconnu'));
      await service.from('legion_messages').update({ meta: { ...(t.meta as Json), statut: bloque ? 'a_faire' : 'revue', livre_le: maintenant, ...(bloque ? { bloque: cr.slice(0, 300) } : {}) } }).eq('id', t.id);
      return texte({ rendu: true, statut: bloque ? 'bloqué (reste à faire)' : 'à revoir par la personne', message_id: ligne.id });
    }
    case 'cocher_feuille': {
      if (!/^[0-9a-f-]{36}$/.test(s('ligne_id'))) return refus('Ligne introuvable.');
      const { data: l } = await service.from('legion_feuille').select('id, entreprise_id, titre').eq('id', s('ligne_id')).maybeSingle();
      if (!l || !(await membre(service, userId, l.entreprise_id))) return refus('Ligne introuvable, ou pas accessible.');
      const { error } = await service.from('legion_feuille').update({ fait: true, fait_le: new Date().toISOString(), ...(args.commentaire ? { commentaire: s('commentaire').slice(0, 1000) } : {}) }).eq('id', l.id);
      if (error) return refus('Non cochée: ' + error.message);
      return texte({ fait: true, titre: l.titre });
    }
    default:
      return refus(`Outil inconnu: ${nom}`);
  }
}

// ---------------------------------------------------------------- serveur
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: entetes });
  if (req.method !== 'POST') return reponse({ erreur: 'Serveur MCP Léo: POST seulement.' }, 405);

  // Le jeton: dans l'adresse (…/legion-mcp/lg_…) ou dans l'en-tête.
  const chemin = new URL(req.url).pathname;
  const dansAdresse = chemin.match(/\/legion-mcp\/(lg_[0-9a-f]{48})\/?$/)?.[1];
  const dansEntete = (req.headers.get('Authorization') || '').match(/^Bearer\s+(lg_[0-9a-f]{48})$/i)?.[1];
  const jeton = dansAdresse || dansEntete;

  let corps: Json = {};
  try { corps = await req.json(); } catch { return rpcErreur(null, -32700, 'JSON illisible.', 400); }
  const id = corps.id;
  const methode = String(corps.method || '');

  if (!jeton) return rpcErreur(id, -32001, 'Jeton manquant: …/legion-mcp/<jeton> ou Authorization: Bearer <jeton>.', 401);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: userId, error: eJeton } = await service.rpc('legion_jeton_user', { p_clair: jeton });
  if (eJeton || !userId) return rpcErreur(id, -32001, 'Jeton inconnu ou révoqué.', 401);

  switch (methode) {
    case 'initialize':
      return rpcOk(id, { protocolVersion: VERSION_PROTOCOLE, capabilities: { tools: {} }, serverInfo: { name: 'Léo (Finjaro)', version: '1.0' }, instructions: "Léo: l'entreprise de la personne, avec ses agents IA. Commence par mes_entreprises. N'écris dans un salon (ecrire) que si elle l'a demandé: les agents répondent au nom de l'entreprise. Si tu tournes sur l'ordinateur de la personne (navigateur, bureau), taches_ordinateur donne ce que l'entreprise te confie : prends-en une (prendre_tache_ordinateur), fais-la sous ses yeux, rends-la (rendre_tache_ordinateur). Demande-lui avant tout envoi, paiement, suppression ou publication." });
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return new Response(null, { status: 202, headers: entetes });
    case 'ping':
      return rpcOk(id, {});
    case 'tools/list':
      return rpcOk(id, { tools: OUTILS });
    case 'tools/call': {
      const params = (corps.params ?? {}) as Json;
      const nom = String(params.name || '');
      const args = (params.arguments ?? {}) as Json;
      if (!OUTILS.some((o) => o.name === nom)) return rpcErreur(id, -32602, `Outil inconnu: ${nom}`);
      try {
        return rpcOk(id, await executer(service, String(userId), nom, args));
      } catch (e) {
        console.error(nom, (e as Error).message);
        return rpcOk(id, refus('Erreur pendant l’outil: ' + (e as Error).message));
      }
    }
    default:
      return rpcErreur(id, -32601, `Méthode inconnue: ${methode}`);
  }
});
