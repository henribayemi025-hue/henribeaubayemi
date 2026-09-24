// LEGION — la veille et les tickets, chaque heure (idées 36 et 161 des 200,
// 24/09). Aucun modèle n'est appelé ici : rien ne se paie.
//
//   * La veille RSS : chaque flux branché est lu ; les articles jamais vus
//     sont déposés en une seule liste (titre, lien, source) dans le salon
//     choisi, au nom de l'agent de veille (sinon du responsable). Cinq
//     articles au plus par passage : une veille, pas un déluge.
//   * Les tickets GitHub : quand l'option est cochée, un ticket NOUVEAU sur
//     le dépôt branché ouvre une réunion dans le salon choisi (fonction
//     legion-reunion, porte « Legion ») — un seul par passage. Au premier
//     passage on ne fait que noter le dernier ticket : les anciens n'ouvrent
//     rien.
//
// Porte unique : la tâche planifiée (jeton « legion_flux »). Un membre peut
// aussi demander un passage tout de suite pour SON entreprise.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type Service = any;
type Connecteur = { id: string; entreprise_id: string; type: string; config: Record<string, unknown> };
type Article = { titre: string; lien: string; date: string | null; id: string; source: string };

const PROD_HOST = 'finjaro.net';
function cors(origin: string | null): Record<string, string> {
  let ok = false;
  try { const h = new URL(origin || '').hostname; ok = h === 'localhost' || h === PROD_HOST || h.endsWith(`.${PROD_HOST}`) || h.endsWith('.workers.dev') || h.endsWith('.pages.dev'); } catch { ok = false; }
  return { 'Access-Control-Allow-Origin': ok ? origin! : `https://${PROD_HOST}`, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
}

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const decoder = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const champ = (bloc: string, nom: string) => { const m = new RegExp(`<${nom}[^>]*>([\\s\\S]*?)</${nom}>`, 'i').exec(bloc); return m ? decoder(m[1]) : ''; };

// RSS 2.0 (<item>) et Atom (<entry>), sans dépendance.
export function lireFlux(xml: string, source: string): Article[] {
  const nomFlux = champ(xml.split(/<item|<entry/i)[0], 'title') || source;
  const blocs = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi), ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  return blocs.slice(0, 20).map((b) => {
    const lienAtom = /<link[^>]*href="([^"]+)"/i.exec(b)?.[1] || '';
    const lien = champ(b, 'link') || lienAtom;
    const titre = champ(b, 'title');
    const id = champ(b, 'guid') || champ(b, 'id') || lien || titre;
    const date = champ(b, 'pubDate') || champ(b, 'updated') || champ(b, 'published') || null;
    return { titre: titre.slice(0, 200), lien: lien.slice(0, 500), date, id: id.slice(0, 300), source: nomFlux.slice(0, 80) };
  }).filter((a) => a.titre && /^https?:\/\//.test(a.lien));
}

async function salonPour(service: Service, c: Connecteur): Promise<string | null> {
  const { data } = await service.from('legion_canaux').select('id, nom, cle, prive_entre, ordre').eq('entreprise_id', c.entreprise_id).order('ordre');
  const publics = (data || []).filter((x: { prive_entre: string[] | null }) => !x.prive_entre?.length);
  const choisi = publics.find((x: { id: string }) => x.id === c.config?.salon_id)
    || publics.find((x: { nom: string; cle: string }) => sansAccent(x.nom) === 'direction' || x.cle === 'direction') || publics[0];
  return choisi?.id || null;
}

async function veille(service: Service, c: Connecteur): Promise<string> {
  const flux = (Array.isArray(c.config?.flux) ? c.config.flux : []) as string[];
  const vus = new Set((Array.isArray(c.config?.vus) ? c.config.vus : []) as string[]);
  const premier = !Array.isArray(c.config?.vus);
  const nouveaux: Article[] = [];
  const erreurs: string[] = [];
  for (const url of flux.slice(0, 5)) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Legion-Finjaro (veille)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(12_000) });
      if (!r.ok) { erreurs.push(`${url}: HTTP ${r.status}`); continue; }
      const xml = (await r.text()).slice(0, 2_000_000);
      for (const a of lireFlux(xml, new URL(url).hostname)) if (!vus.has(a.id)) nouveaux.push(a);
    } catch (e) { erreurs.push(`${url}: ${(e as Error).message}`); }
  }
  const tous = [...vus, ...nouveaux.map((a) => a.id)].slice(-300);
  // Premier passage : on note ce qui existe déjà, on ne dépose que les 3 plus récents.
  const aDeposer = (premier ? nouveaux.slice(0, 3) : nouveaux).slice(0, 5);
  await service.from('legion_connecteurs').update({ config: { ...c.config, vus: tous, lu_le: new Date().toISOString(), erreurs: erreurs.slice(0, 5) } }).eq('id', c.id);
  if (!aDeposer.length) return `veille: rien de nouveau${erreurs.length ? ` (${erreurs.length} flux en erreur)` : ''}`;
  const canal = await salonPour(service, c);
  if (!canal) return 'veille: pas de salon';
  const { data: agents } = await service.from('legion_agents').select('id, nom, poste, mandat, est_directeur, actif, user_id, moteur').eq('entreprise_id', c.entreprise_id).is('user_id', null).order('ordre');
  const libres = ((agents || []) as Array<{ id: string; poste: string; mandat: string | null; est_directeur: boolean; actif: boolean; moteur: string }>).filter((a) => a.moteur !== 'claude-code');
  const veilleur = libres.find((a) => a.actif && /veille|intelligence|march|marketing|communication|strat/i.test(sansAccent(`${a.poste} ${a.mandat || ''}`)))
    || libres.find((a) => a.actif && a.est_directeur) || libres[0];
  if (!veilleur) return 'veille: aucun agent';
  const { data: ent } = await service.from('legion_entreprises').select('langue').eq('id', c.entreprise_id).maybeSingle();
  const en = ent?.langue === 'en';
  const texte = `📡 ${en ? `Watch — ${aDeposer.length} new article(s)` : `Veille — ${aDeposer.length} nouvel(s) article(s)`}\n${aDeposer.map((a) => `- [${a.titre}](${a.lien}) — ${a.source}${a.date ? ` (${String(new Date(a.date).toISOString()).slice(0, 10)})` : ''}`).join('\n')}`;
  await service.from('legion_messages').insert({
    entreprise_id: c.entreprise_id, canal_id: canal, auteur_id: veilleur.id, user_id: null, texte, genre: 'info',
    meta: { sans_reponse: true, veille: { articles: aDeposer.length }, sources: aDeposer.map((a) => ({ titre: a.titre, url: a.lien })) },
  });
  return `veille: ${aDeposer.length} article(s) déposé(s)`;
}

async function tickets(service: Service, c: Connecteur): Promise<string> {
  const depot = String(c.config?.depot || '');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(depot)) return 'tickets: pas de dépôt';
  const { data: jeton } = await service.rpc('legion_jeton_github', { p_entreprise: c.entreprise_id });
  const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'Legion-Finjaro' };
  if (jeton) h.Authorization = `Bearer ${jeton}`;
  const r = await fetch(`https://api.github.com/repos/${depot}/issues?state=open&sort=created&direction=desc&per_page=10`, { headers: h, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) return `tickets: GitHub ${r.status}`;
  const liste = ((await r.json()) as Array<{ number: number; title: string; body: string | null; html_url: string; pull_request?: unknown; user?: { login?: string } }>).filter((x) => !x.pull_request);
  const dernier = Number(c.config?.dernier_ticket || 0);
  const plusHaut = Math.max(dernier, ...liste.map((x) => x.number));
  if (!c.config?.dernier_ticket) {
    await service.from('legion_connecteurs').update({ config: { ...c.config, dernier_ticket: plusHaut || 0 } }).eq('id', c.id);
    return `tickets: premier passage, dernier ticket noté (#${plusHaut || 0})`;
  }
  const neuf = liste.filter((x) => x.number > dernier).sort((a, b) => a.number - b.number)[0];
  if (!neuf) return 'tickets: rien de nouveau';
  const canal = await salonPour(service, c);
  if (!canal) return 'tickets: pas de salon';
  const { data: ent } = await service.from('legion_entreprises').select('langue').eq('id', c.entreprise_id).maybeSingle();
  const en = ent?.langue === 'en';
  const corps = String(neuf.body || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  const sujet = en
    ? `New ticket #${neuf.number} on ${depot}: « ${neuf.title} »${corps ? ` — ${corps}` : ''} (${neuf.html_url}). What is it, how serious, who takes it, what do we answer?`
    : `Nouveau ticket #${neuf.number} sur ${depot} : « ${neuf.title} »${corps ? ` — ${corps}` : ''} (${neuf.html_url}). De quoi s'agit-il, quelle gravité, qui le prend, que répond-on ?`;
  const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_reunion').maybeSingle();
  const rep = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-reunion`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`, 'x-finjaro-token': sec?.value || '' },
    body: JSON.stringify({ canal_id: canal, sujet }),
  }).then((x) => x.json()).catch((e) => ({ erreur: (e as Error).message }));
  // Le ticket est noté comme traité même si la réunion n'a pas pu s'ouvrir
  // (une réunion déjà en cours) : le suivant attendra le prochain passage.
  await service.from('legion_connecteurs').update({ config: { ...c.config, dernier_ticket: neuf.number } }).eq('id', c.id);
  return rep?.ok ? `tickets: réunion ouverte pour #${neuf.number}` : `tickets: #${neuf.number} — ${rep?.erreur || 'réunion impossible'}`;
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  let corps: { entreprise_id?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }

  let filtre: string | null = null;
  const jeton = req.headers.get('x-finjaro-token');
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_flux').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
    filtre = corps.entreprise_id || null;
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth || !corps.entreprise_id) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: e } = await personne.from('legion_entreprises').select('id').eq('id', corps.entreprise_id).maybeSingle();
    if (!e) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);
    filtre = e.id;
  }
  let q = service.from('legion_connecteurs').select('id, entreprise_id, type, config').eq('actif', true).in('type', ['rss', 'github']);
  if (filtre) q = q.eq('entreprise_id', filtre);
  const { data } = await q;
  const journal: string[] = [];
  for (const c of (data || []) as Connecteur[]) {
    try {
      if (c.type === 'rss') journal.push(`${c.entreprise_id} ${await veille(service, c)}`);
      else if (c.config?.reunion_sur_ticket) journal.push(`${c.entreprise_id} ${await tickets(service, c)}`);
    } catch (e) { journal.push(`${c.entreprise_id} ${c.type}: ${(e as Error).message}`); }
  }
  return json({ ok: true, journal });
});
