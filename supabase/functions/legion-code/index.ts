// LEGION — un agent qui code lui-même (Beau, 29/09 : « Ada doit pouvoir
// pousser sur GitHub, faire tout ce que tu fais… et les agents des autres
// utilisateurs aussi » ; « je voulais que ce soit comme Codex »).
//
// Le chemin : dans le salon, l'agent PROPOSE une tâche de code (action
// « modifier_code », valeur = ce qu'il faut faire). Rien ne part avant que le
// patron touche « Confirmer » ; legion-action nous appelle alors, avec le
// jeton du serveur. Ici, comme Codex :
//   1. on lit l'arborescence du dépôt branché (application GitHub « Finjaro
//      Atelier », jeton d'installation d'une heure) ;
//   2. le modèle choisit les fichiers utiles, on les lit EN ENTIER ;
//   3. le modèle écrit les fichiers modifiés (contenu complet, rien d'écrasé
//      à l'aveugle) ;
//   4. on pousse sur une branche « leo/… » et on ouvre une demande de fusion ;
//   5. l'agent poste le lien dans le salon.
// La branche principale n'est jamais touchée : fusionner, et donc mettre en
// ligne, reste la décision du patron. Vaut pour toutes les entreprises de
// Léo, chacune sur SON dépôt.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CHARTE } from '../_shared/charte.ts';
import { compter, pourEntreprise } from '../_shared/cout.ts';
import { jetonInstallation } from '../_shared/github-app.ts';
import { generer, moteurs, moteursSimples } from '../_shared/moteur.ts';

const DEPOT_OK = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const GH = (jeton: string) => ({ Authorization: `Bearer ${jeton}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Leo-Finjaro' });
// Ce qui ne se lit pas (lourd, généré, binaire) : jamais proposé au modèle.
const IGNORE = /(^|\/)(node_modules|dist|build|\.next|coverage|vendor|\.git)\/|\.(png|jpe?g|gif|webp|avif|ico|mp4|webm|mp3|wav|pdf|zip|woff2?|ttf|otf|lock)$|package-lock\.json$|pnpm-lock\.yaml$|yarn\.lock$/i;
// Jamais écrits par un agent : la base de données et les fonctions serveur.
// Chez Finjaro, une fusion sur staging DÉPLOIE les fonctions edge, communes à
// la production et à Finjaro Accounting (CLAUDE.md §4 et §8) ; une migration
// touche une base partagée. Lus, oui ; modifiés, jamais par ce chemin.
const INTERDIT_EN_ECRITURE = /^supabase\/(functions|migrations)\/|^\.github\//;
const MAX_FICHIERS = 6;
const MAX_OCTETS = 60_000; // par fichier lu

const SCHEMA_CHOIX = {
  type: 'OBJECT',
  properties: { fichiers: { type: 'ARRAY', items: { type: 'STRING' } }, nouveaux: { type: 'ARRAY', items: { type: 'STRING' } }, raison: { type: 'STRING' } },
  required: ['fichiers', 'raison'],
};
const SCHEMA_CODE = {
  type: 'OBJECT',
  properties: {
    fichiers: { type: 'ARRAY', items: { type: 'OBJECT', properties: { chemin: { type: 'STRING' }, contenu: { type: 'STRING' } }, required: ['chemin', 'contenu'] } },
    message: { type: 'STRING' },
    resume: { type: 'STRING' },
    impossible: { type: 'STRING' },
  },
  required: ['fichiers', 'message', 'resume'],
};

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

Deno.serve(compter('legion_code', async (req: Request) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) return json({ erreur: 'non autorisé' }, 401);
  const apiKey = Deno.env.get('GEMINI_API_KEY') || '';

  let corps: { entreprise_id?: string; message_id?: string; agent_id?: string; consigne?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const consigne = String(corps.consigne || '').trim().slice(0, 2000);
  if (!corps.entreprise_id || !corps.message_id || !corps.agent_id || consigne.length < 5) return json({ erreur: 'Demande incomplète.' }, 400);
  pourEntreprise(corps.entreprise_id);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: msg } = await service.from('legion_messages').select('id, canal_id, meta').eq('id', corps.message_id).eq('entreprise_id', corps.entreprise_id).maybeSingle();
  if (!msg) return json({ erreur: 'Message inconnu.' }, 404);
  const action = ((msg.meta || {}) as { action?: Record<string, unknown> }).action || {};
  const finir = async (statut: string, resultat: string, texteAgent?: string, extra: Record<string, unknown> = {}) => {
    await service.from('legion_messages').update({ meta: { ...(msg.meta as Record<string, unknown>), action: { ...action, statut, resultat, le: new Date().toISOString(), ...extra } } }).eq('id', msg.id);
    if (texteAgent) {
      await service.from('legion_messages').insert({
        entreprise_id: corps.entreprise_id, canal_id: msg.canal_id, auteur_id: corps.agent_id, texte: texteAgent,
        meta: { par_ia: true, reponse_a_id: msg.id, code: { consigne, ...extra } },
      });
    }
    return json({ statut, resultat, ...extra });
  };

  // Le dépôt branché par l'application (pas l'ancien jeton en lecture seule).
  const { data: c } = await service.from('legion_connecteurs').select('config').eq('entreprise_id', corps.entreprise_id).eq('type', 'github').eq('actif', true).maybeSingle();
  const installation = c?.config?.installation_id;
  const depot = String(c?.config?.depot || '');
  if (!installation || !DEPOT_OK.test(depot)) return finir('echec', "GitHub n'est pas branché avec l'écriture : Connecteurs → « Se connecter avec GitHub ».", 'Je ne peux pas encore écrire dans le dépôt : il faut brancher GitHub avec l\'écriture (Connecteurs → « Se connecter avec GitHub »). 🔌');

  const { data: agent } = await service.from('legion_agents').select('nom, poste, personnalite').eq('id', corps.agent_id).maybeSingle();

  try {
    const jeton = await jetonInstallation(installation);
    const api = (chemin: string, init?: RequestInit) => fetch(`https://api.github.com/repos/${depot}${chemin ? `/${chemin}` : ''}`, { ...init, headers: { ...GH(jeton), 'Content-Type': 'application/json' } });
    // Pas de « / » final : GitHub répond 404 à …/repos/x/y/ (vu le 29/09).
    const infos = await api('');
    if (!infos.ok) return finir('echec', `Dépôt inaccessible (${infos.status}).`);
    // La base : « staging » quand le dépôt en a une (la branche de travail),
    // sinon la branche par défaut. Vu le 29/09 : chez Finjaro, la branche par
    // défaut EST la production (finjaro.net) — on ne part jamais d'elle quand
    // une branche de travail existe, et la demande de fusion vise staging.
    const parDefaut = String((await infos.json()).default_branch || 'main');
    const principale = (await api('git/ref/heads/staging')).ok ? 'staging' : parDefaut;

    // 1. L'arborescence.
    const arbre = await api(`git/trees/${principale}?recursive=1`);
    if (!arbre.ok) return finir('echec', `Arborescence illisible (${arbre.status}).`);
    const tout = ((await arbre.json()).tree || []) as Array<{ path: string; type: string; size?: number }>;
    const chemins = tout.filter((x) => x.type === 'blob' && !IGNORE.test(x.path) && (x.size ?? 0) < 300_000).map((x) => x.path);
    const existe = new Set(chemins);

    // 2. Les fichiers utiles.
    const choix = await generer(apiKey, `${CHARTE}
Tu es ${agent?.nom || 'un agent'}, ${agent?.poste || 'développeur'}. On te confie une tâche de code sur le dépôt « ${depot} » :
« ${consigne} »

Voici les fichiers du dépôt (un par ligne) :
${chemins.slice(0, 3000).join('\n')}

Choisis les fichiers qu'il faut LIRE pour faire la tâche correctement (au plus ${MAX_FICHIERS}, les plus utiles d'abord) dans "fichiers", en recopiant les chemins exactement. Si la tâche demande de créer des fichiers, mets leurs chemins dans "nouveaux". Explique ton choix en une phrase dans "raison".`, SCHEMA_CHOIX, { temperature: 0.2, reflexion: 1024, delaiMs: 45_000, maxSortie: 2000, modeles: moteursSimples() });
    if ('erreur' in choix) return finir('echec', `Choix des fichiers impossible (${choix.erreur.slice(0, 120)}).`);
    const aLire = ((choix.obj.fichiers || []) as string[]).map(String).filter((p) => existe.has(p)).slice(0, MAX_FICHIERS);
    const nouveaux = ((choix.obj.nouveaux || []) as string[]).map((p) => String(p).replace(/^\/+/, '').replace(/\.\.+/g, '')).filter((p) => p && !existe.has(p) && !IGNORE.test(p)).slice(0, 4);
    if (!aLire.length && !nouveaux.length) return finir('echec', 'Aucun fichier du dépôt ne correspond à la tâche.', `Je n'ai trouvé aucun fichier du dépôt qui corresponde à « ${consigne.slice(0, 120)} ». Tu peux me dire où ça se trouve ? 🤔`);
    const lus: Array<{ chemin: string; contenu: string }> = [];
    for (const p of aLire) {
      const r = await fetch(`https://api.github.com/repos/${depot}/contents/${p.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(principale)}`, { headers: { ...GH(jeton), Accept: 'application/vnd.github.raw' } });
      if (!r.ok) continue;
      const t = await r.text();
      if (t.length <= MAX_OCTETS) lus.push({ chemin: p, contenu: t });
    }

    // 3. Le changement, fichiers complets.
    const code = await generer(apiKey, `${CHARTE}
Tu es ${agent?.nom || 'un agent'}, ${agent?.poste || 'développeur'}${agent?.personnalite ? ` (${agent.personnalite})` : ''}. Tâche de code sur « ${depot} » :
« ${consigne} »

LES FICHIERS ACTUELS (contenu complet) :
${lus.map((f) => `===== ${f.chemin} =====\n${f.contenu}`).join('\n\n')}
${nouveaux.length ? `\nFICHIERS À CRÉER : ${nouveaux.join(', ')}\n` : ''}
Fais la tâche comme un bon développeur :
- rends dans "fichiers" CHAQUE fichier modifié ou créé avec son contenu COMPLET (jamais un extrait, jamais « … reste inchangé ») ; ne rends pas un fichier que tu ne changes pas ;
- change le moins possible, garde le style, les noms et la langue du code existant ;
- aucun secret, aucune clé, aucune donnée personnelle dans le code ;
- ne modifie JAMAIS un fichier sous supabase/functions, supabase/migrations ou .github (base et serveur partagés) : s'il le faut, dis-le dans "impossible" ;
- "message" : le message de commit, court, au présent ;
- "resume" : ce que tu as changé, en deux ou trois phrases simples pour le patron (qui ne code pas), avec ta personnalité ;
- si la tâche est impossible ou trop floue avec ces fichiers, rends "fichiers": [] et explique pourquoi dans "impossible".`, SCHEMA_CODE, { temperature: 0.2, reflexion: 4096, delaiMs: 90_000, maxSortie: 32_000, modeles: moteurs() });
    if ('erreur' in code) return finir('echec', `Écriture du code impossible (${code.erreur.slice(0, 120)}).`);
    const permis = new Set([...lus.map((f) => f.chemin), ...nouveaux].filter((p) => !INTERDIT_EN_ECRITURE.test(p)));
    const fichiers = ((code.obj.fichiers || []) as Array<{ chemin?: string; contenu?: string }>)
      .map((f) => ({ chemin: String(f.chemin || '').replace(/^\/+/, ''), contenu: String(f.contenu ?? '') }))
      .filter((f) => permis.has(f.chemin) && f.contenu.trim().length > 0 && !/(\.\.\.|…)\s*(reste|rest of|inchang|unchanged)/i.test(f.contenu));
    if (!fichiers.length) {
      const pourquoi = String(code.obj.impossible || 'aucun fichier modifié').slice(0, 400);
      return finir('echec', `Rien envoyé : ${pourquoi}`, `Je n'ai rien envoyé : ${pourquoi}`);
    }

    // 4. La branche leo/… et la demande de fusion.
    const branche = `leo/${slug(consigne) || 'tache'}-${Date.now().toString(36).slice(-4)}`;
    const ref = await api(`git/ref/heads/${principale}`);
    if (!ref.ok) return finir('echec', 'Branche principale introuvable.');
    const parent = String((await ref.json()).object.sha);
    const commitParent = await (await api(`git/commits/${parent}`)).json();
    const nouvelArbre = await api('git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commitParent.tree.sha, tree: fichiers.map((f) => ({ path: f.chemin, mode: '100644', type: 'blob', content: f.contenu })) }) });
    if (!nouvelArbre.ok) return finir('echec', `GitHub refuse les fichiers (${nouvelArbre.status}).`);
    const message = `${String(code.obj.message || consigne).trim().slice(0, 200)}\n\nÉcrit par ${agent?.nom || 'un agent'} dans Léo, après « Confirmer ».`;
    const commit = await api('git/commits', { method: 'POST', body: JSON.stringify({ message, tree: (await nouvelArbre.json()).sha, parents: [parent] }) });
    if (!commit.ok) return finir('echec', `GitHub refuse l'envoi (${commit.status}).`);
    const sha = String((await commit.json()).sha);
    const creee = await api('git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branche}`, sha }) });
    if (!creee.ok) return finir('echec', `GitHub refuse la branche (${creee.status}).`);
    const pr = await api('pulls', { method: 'POST', body: JSON.stringify({ title: String(code.obj.message || consigne).split('\n')[0].slice(0, 200), head: branche, base: principale, body: `${String(code.obj.resume || '')}\n\nTâche : ${consigne}\n\n— écrit par ${agent?.nom || 'un agent'} dans Léo, après « Confirmer ». Base : ${principale}. Rien n'est en ligne tant que cette demande n'est pas fusionnée.` }) });
    const fusion = (await pr.json().catch(() => ({}))).html_url || null;
    const resume = String(code.obj.resume || '').trim().slice(0, 1200);
    return finir('faite', `Envoyé sur ${branche}${fusion ? ' (demande de fusion ouverte)' : ''}.`,
      `C'est poussé ✅ (c'est un essai : parti de « ${principale} », rien n'est en ligne)\n\n${resume}\n\n- Branche : ${branche}\n- Fichiers : ${fichiers.map((f) => f.chemin).join(', ')}\n${fusion ? `- Demande de fusion : ${fusion}\n` : ''}\nRien n'est en ligne tant que tu ne fusionnes pas.`,
      { depot, branche, fusion, fichiers: fichiers.map((f) => f.chemin) });
  } catch (e) {
    return finir('echec', `Erreur : ${(e as Error).message.slice(0, 200)}`);
  }
}));
