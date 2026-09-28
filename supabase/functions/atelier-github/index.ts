// GITHUB POUR TOUS — chaque entreprise de Léo branche SON GitHub, en un clic.
//
// Beau, 25/09 : « chaque utilisateur connecte SON GitHub, ses dépôts, et les
// agents travaillent directement dedans, comme Claude le fait ». Puis, le
// 28/09 : « fais les trucs GitHub ». L'application GitHub « Finjaro Atelier »
// existait depuis le 24/09, avec son adresse de retour réglée sur CETTE
// fonction… qui n'avait jamais été écrite. Quiconque cliquait « installer »
// revenait dans le vide.
//
// Ce que fait la fonction, et rien d'autre :
//
//   GET (GitHub nous renvoie la personne après l'installation) : on vérifie le
//     « state » signé (quelle entreprise, quelle personne, 30 minutes), on
//     échange le code contre un jeton de la PERSONNE, et on ne garde
//     l'installation que si GitHub confirme que cette personne y a accès —
//     sinon n'importe qui pourrait se greffer sur l'installation d'un autre en
//     devinant son numéro. On range le numéro d'installation (pas de jeton : il
//     se refabrique à chaque usage, pour une heure) et la liste des dépôts.
//
//   POST, avec la session Léo :
//     « lien »     → l'adresse d'installation GitHub, avec le state signé ;
//     « depots »   → les dépôts que l'installation permet ;
//     « choisir »  → le dépôt que les agents lisent ;
//     « envoyer »  → les fichiers de l'atelier sur une branche `leo/…`, JAMAIS
//                    sur la branche principale ; appelé seulement après le
//                    bouton « Confirmer » ; en option, une demande de fusion.
//
// Chaque entreprise y a droit, pas seulement Finjaro (règle de Beau, 25/09 :
// « tout ce qu'on développe, c'est pour tout le monde »).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { clePriveeGithub, GITHUB_CLIENT_ID, jetonApplication, jetonInstallation } from '../_shared/github-app.ts';

const PROD_HOST = 'finjaro.net';
const DEPOT_OK = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function origineAutorisee(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  return host.endsWith('.workers.dev') || host.endsWith('.pages.dev');
}
function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origineAutorisee(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

const GH = (jeton: string) => ({ Authorization: `Bearer ${jeton}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'finjaro-atelier' });

// --- Le « state » signé : qui revient de GitHub, pour quelle entreprise. ---
const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
async function hmac(texte: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! + ':atelier-github'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(texte)));
  return b64url(String.fromCharCode(...sig));
}
type Etat = { e: string; u: string; r: string; x: number };
async function signer(etat: Etat): Promise<string> {
  const corps = b64url(JSON.stringify(etat));
  return `${corps}.${await hmac(corps)}`;
}
async function lireEtat(state: string | null): Promise<Etat | null> {
  if (!state || !state.includes('.')) return null;
  const [corps, sig] = state.split('.');
  if (sig !== await hmac(corps)) return null;
  try {
    const e = JSON.parse(deb64url(corps)) as Etat;
    return e.x > Date.now() ? e : null;
  } catch { return null; }
}

// --- Les jetons de l'application. ---
let slugEnCache: string | null = null;
async function jwtApp(): Promise<string> {
  const cle = clePriveeGithub();
  if (!cle) throw new Error("clé de l'application GitHub absente (secret GITHUB_APP_PRIVATE_KEY)");
  return jetonApplication(cle.pem);
}
async function slugApp(): Promise<string> {
  if (slugEnCache) return slugEnCache;
  const r = await fetch('https://api.github.com/app', { headers: GH(await jwtApp()) });
  if (!r.ok) throw new Error(`GitHub refuse la clé de l'application (${r.status})`);
  slugEnCache = String((await r.json()).slug || '');
  return slugEnCache;
}
async function depotsInstallation(jeton: string): Promise<string[]> {
  const noms: string[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const r = await fetch(`https://api.github.com/installation/repositories?per_page=100&page=${page}`, { headers: GH(jeton) });
    if (!r.ok) break;
    const j = await r.json();
    for (const x of j.repositories || []) noms.push(String(x.full_name));
    if ((j.repositories || []).length < 100) break;
  }
  return noms;
}

function retourPropre(adresse: string, params: Record<string, string>): string {
  let u: URL;
  try { u = new URL(adresse); } catch { u = new URL(`https://${PROD_HOST}/legion`); }
  if (!origineAutorisee(u.origin)) u = new URL(`https://${PROD_HOST}/legion`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // ============ Le retour de GitHub (navigateur de la personne). ============
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const etat = await lireEtat(url.searchParams.get('state'));
    if (!etat) {
      return new Response('Lien expiré ou invalide. Reviens dans Léo et clique à nouveau « Se connecter avec GitHub ».', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const aller = (params: Record<string, string>) => Response.redirect(retourPropre(etat.r, params), 302);
    try {
      const code = url.searchParams.get('code');
      if (!code) return aller({ github: 'annule' });
      const secret = Deno.env.get('GITHUB_APP_CLIENT_SECRET');
      if (!secret) return aller({ github: 'erreur', raison: 'secret OAuth absent' });
      // Le code → un jeton de la PERSONNE (il ne sert qu'ici, jamais gardé).
      const t = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: secret, code }),
      });
      const jt = await t.json().catch(() => ({}));
      if (!jt.access_token) return aller({ github: 'erreur', raison: String(jt.error_description || jt.error || 'code refusé par GitHub').slice(0, 120) });
      // Les installations de NOTRE application auxquelles cette personne a accès.
      const i = await fetch('https://api.github.com/user/installations?per_page=100', { headers: GH(jt.access_token) });
      const installations = i.ok ? ((await i.json()).installations || []) as Array<{ id: number; account?: { login?: string } }> : [];
      const demande = Number(url.searchParams.get('installation_id') || 0);
      const choisie = demande ? installations.find((x) => x.id === demande) : installations[0];
      if (!choisie) return aller({ github: 'erreur', raison: demande ? "cette installation n'est pas à toi" : "l'application n'est installée sur aucun de tes comptes" });
      const depots = await depotsInstallation(await jetonInstallation(choisie.id));
      const { data: avant } = await service.from('legion_connecteurs').select('config').eq('entreprise_id', etat.e).eq('type', 'github').maybeSingle();
      const depotAvant = String(avant?.config?.depot || '');
      const config = {
        ...(avant?.config || {}),
        installation_id: choisie.id,
        compte: choisie.account?.login || null,
        depots: depots.slice(0, 100),
        depot: depots.includes(depotAvant) ? depotAvant : (depots[0] || depotAvant),
        via_app: true,
      };
      const { error } = await service.from('legion_connecteurs').upsert(
        { entreprise_id: etat.e, type: 'github', actif: true, branche_par: etat.u, config },
        { onConflict: 'entreprise_id,type' },
      );
      if (error) return aller({ github: 'erreur', raison: error.message.slice(0, 120) });
      return aller({ github: 'ok', depots: String(depots.length) });
    } catch (e) {
      return aller({ github: 'erreur', raison: (e as Error).message.slice(0, 120) });
    }
  }

  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  // ============ Les actions depuis Léo (session obligatoire). ============
  const auth = req.headers.get('Authorization') || '';
  const { data: qui } = await service.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!qui?.user) return json({ erreur: 'Il faut être connecté.' }, 401);
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });

  let corps: { action?: string; entreprise_id?: string; retour?: string; depot?: string; branche?: string; message?: string; fichiers?: Array<{ chemin?: string; contenu?: string }>; demande_fusion?: boolean; titre?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const entreprise = String(corps.entreprise_id || '');
  if (!entreprise) return json({ erreur: 'Entreprise manquante.' }, 400);
  const { data: membre } = await personne.rpc('legion_est_membre', { p_entreprise: entreprise });
  if (!membre) return json({ erreur: 'Tu n’es pas membre de cette entreprise.' }, 403);

  try {
    if (corps.action === 'lien') {
      const retour = String(corps.retour || `https://${PROD_HOST}/legion/${entreprise}`);
      const state = await signer({ e: entreprise, u: qui.user.id, r: retour, x: Date.now() + 30 * 60_000 });
      const slug = await slugApp();
      return json({
        installer: `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`,
        // Déjà installée : on se reconnecte simplement (GitHub renvoie ici aussi).
        reconnecter: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&state=${encodeURIComponent(state)}`,
      });
    }

    const { data: c } = await service.from('legion_connecteurs').select('config').eq('entreprise_id', entreprise).eq('type', 'github').eq('actif', true).maybeSingle();
    const installation = c?.config?.installation_id;
    if (!installation) return json({ erreur: "GitHub n'est pas branché par l'application : clique « Se connecter avec GitHub »." }, 400);
    const jeton = await jetonInstallation(installation);

    if (corps.action === 'depots') {
      const depots = await depotsInstallation(jeton);
      await service.from('legion_connecteurs').update({ config: { ...c!.config, depots: depots.slice(0, 100) } }).eq('entreprise_id', entreprise).eq('type', 'github');
      return json({ depots, depot: c!.config.depot || null, compte: c!.config.compte || null });
    }

    if (corps.action === 'choisir') {
      const depot = String(corps.depot || '');
      const depots = await depotsInstallation(jeton);
      if (!depots.includes(depot)) return json({ erreur: "Ce dépôt n'est pas ouvert à l'application : ajoute-le sur GitHub (Paramètres › Applications › Finjaro Atelier)." }, 400);
      await service.from('legion_connecteurs').update({ config: { ...c!.config, depot, depots: depots.slice(0, 100) } }).eq('entreprise_id', entreprise).eq('type', 'github');
      return json({ ok: true, depot });
    }

    if (corps.action === 'envoyer') {
      const depot = String(corps.depot || c!.config.depot || '');
      if (!DEPOT_OK.test(depot)) return json({ erreur: 'Choisis d’abord un dépôt.' }, 400);
      const fichiers = (corps.fichiers || [])
        .map((f) => ({ chemin: String(f.chemin || '').replace(/^\/+/, '').replace(/\.\.+/g, '').slice(0, 300), contenu: String(f.contenu ?? '') }))
        .filter((f) => f.chemin && !f.chemin.startsWith('.git/'));
      if (!fichiers.length) return json({ erreur: 'Aucun fichier à envoyer.' }, 400);
      if (fichiers.length > 300 || fichiers.reduce((n, f) => n + f.contenu.length, 0) > 4_000_000) return json({ erreur: 'Trop gros pour un envoi (300 fichiers, 4 Mo au plus).' }, 400);
      // Toujours une branche à part, jamais la principale (plan du 24/09).
      const propre = String(corps.branche || '').toLowerCase().replace(/^leo\//, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9/_-]+/g, '-').replace(/-+/g, '-').replace(/^[-/]+|[-/]+$/g, '').slice(0, 60);
      const branche = `leo/${propre || `envoi-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`}`;
      const api = (chemin: string, init?: RequestInit) => fetch(`https://api.github.com/repos/${depot}/${chemin}`, { ...init, headers: { ...GH(jeton), 'Content-Type': 'application/json' } });
      const infos = await api('');
      if (!infos.ok) return json({ erreur: `Dépôt inaccessible (${infos.status}).` }, 400);
      const principale = String((await infos.json()).default_branch || 'main');
      // Le point de départ : la branche leo/… si elle existe déjà, sinon la principale.
      let ref = await api(`git/ref/heads/${branche}`);
      const existe = ref.ok;
      if (!existe) ref = await api(`git/ref/heads/${principale}`);
      if (!ref.ok) return json({ erreur: 'Dépôt vide : fais un premier envoi sur GitHub, puis réessaie.' }, 400);
      const parent = String((await ref.json()).object.sha);
      const commitParent = await (await api(`git/commits/${parent}`)).json();
      // Les fichiers → un arbre posé sur celui du parent (le reste du dépôt reste intact).
      const arbre = await api('git/trees', { method: 'POST', body: JSON.stringify({
        base_tree: commitParent.tree.sha,
        tree: fichiers.map((f) => ({ path: f.chemin, mode: '100644', type: 'blob', content: f.contenu })),
      }) });
      if (!arbre.ok) return json({ erreur: `GitHub refuse les fichiers (${arbre.status}).` }, 400);
      const message = (String(corps.message || '').trim() || 'Envoi depuis l’atelier de Léo').slice(0, 2000);
      const commit = await api('git/commits', { method: 'POST', body: JSON.stringify({ message, tree: (await arbre.json()).sha, parents: [parent] }) });
      if (!commit.ok) return json({ erreur: `GitHub refuse l'envoi (${commit.status}).` }, 400);
      const sha = String((await commit.json()).sha);
      const maj = existe
        ? await api(`git/refs/heads/${branche}`, { method: 'PATCH', body: JSON.stringify({ sha }) })
        : await api('git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branche}`, sha }) });
      if (!maj.ok) return json({ erreur: `GitHub refuse la branche (${maj.status}).` }, 400);
      let fusion: string | null = null;
      if (corps.demande_fusion) {
        const pr = await api('pulls', { method: 'POST', body: JSON.stringify({ title: (corps.titre || message.split('\n')[0]).slice(0, 200), head: branche, base: principale, body: `${message}\n\n— envoyé depuis l'atelier de Léo, après « Confirmer ».` }) });
        const jp = await pr.json().catch(() => ({}));
        fusion = jp.html_url || null;
        if (!pr.ok && !fusion) {
          // Déjà une demande ouverte pour cette branche : on la retrouve.
          const ouvertes = await (await api(`pulls?head=${depot.split('/')[0]}:${branche}&state=open`)).json().catch(() => []);
          fusion = Array.isArray(ouvertes) && ouvertes[0]?.html_url ? ouvertes[0].html_url : null;
        }
      }
      return json({ ok: true, depot, branche, commit: sha, fichiers: fichiers.length, voir: `https://github.com/${depot}/tree/${branche}`, fusion });
    }

    return json({ erreur: 'Action inconnue.' }, 400);
  } catch (e) {
    return json({ erreur: (e as Error).message.slice(0, 300) }, 500);
  }
});
