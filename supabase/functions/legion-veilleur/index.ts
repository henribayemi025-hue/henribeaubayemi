// LEGION — le veilleur: chaque matin, de nouvelles compétences depuis GitHub.
//
// Beau, 22/09: « un agent qui part chaque jour sur le net, sur GitHub, il
// prend des skills, des dépôts, pour s'améliorer constamment ».
// Voir docs/LEGION-COMPETENCES.md (étape C).
//
// Un passage:
//   1. chercher sur GitHub les dépôts de compétences (fiches SKILL.md);
//   2. écarter ce qui n'est pas sous licence libre, et ce qu'on a déjà lu;
//   3. lire les fiches des dépôts retenus et les ajouter au catalogue, avec
//      leur source et leur licence;
//   4. pour chaque entreprise, proposer les nouvelles fiches qui servent à
//      SES agents — un message dans Direction, avec un bouton « Équiper ».
//   5. tout noter dans legion_veilles, y compris ce qui a échoué.
//
// Appelé par le cron seulement (jeton partagé dans app_secrets). Sans jeton
// GitHub, l'API publique limite le nombre d'appels: on reste donc petit
// (quelques dépôts par jour), et un GITHUB_TOKEN dans les secrets des
// fonctions, s'il est ajouté un jour, est utilisé tout seul.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const RECHERCHES = ['topic:claude-skills', 'topic:agent-skills', 'topic:claude-code-skills'];
const DEPOTS_PAR_JOUR = 4;
const FICHES_PAR_DEPOT = 25;
const LICENCES_LIBRES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', 'Unlicense'];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

function github(chemin: string) {
  const jeton = Deno.env.get('GITHUB_TOKEN');
  return fetch(`https://api.github.com${chemin}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'finjaro-legion-veilleur', ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    signal: AbortSignal.timeout(20_000),
  });
}

// L'en-tête d'une fiche SKILL.md: « name: … » et « description: … ».
function entete(texte: string): { nom: string | null; description: string | null } {
  const m = texte.match(/^---\s*\n([\s\S]*?)\n---/);
  const bloc = m ? m[1] : '';
  const champ = (k: string) => {
    const r = bloc.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return r ? r[1].trim().replace(/^["']|["']$/g, '') : null;
  };
  return { nom: champ('name'), description: champ('description') };
}

type Nouvelle = { cle: string; nom: string; description: string; source_repo: string };

async function proposer(apiKey: string, agents: Array<{ id: string; nom: string; poste: string; mandat: string | null }>, entreprise: string, nouvelles: Nouvelle[]) {
  const invite = `Tu es le veilleur de l'entreprise « ${entreprise} ». Ce matin, tu as trouvé ces nouvelles fiches de savoir-faire (clé | nom | description):
${nouvelles.map((n) => `${n.cle} | ${n.nom} | ${n.description.slice(0, 160)}`).join('\n')}

Les agents de l'entreprise:
${agents.map((a) => `- ${a.nom}: ${a.poste}${a.mandat ? ` — ${a.mandat.slice(0, 120)}` : ''}`).join('\n')}

Propose au plus 3 fiches qui serviraient VRAIMENT à un agent précis, cette semaine. Si aucune ne sert, ne propose rien: c'est le cas normal.
Pour chacune: la clé EXACTE, le nom EXACT de l'agent, et en une phrase courte en français, à quoi elle lui servira.`;
  const schema = { type: 'OBJECT', properties: { propositions: { type: 'ARRAY', items: { type: 'OBJECT',
    properties: { cle: { type: 'STRING' }, agent: { type: 'STRING' }, pourquoi: { type: 'STRING' } }, required: ['cle', 'agent', 'pourquoi'] } } }, required: ['propositions'] };
  for (const model of MODELS) {
    try {
      const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: invite }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: schema } }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!r.ok) continue;
      const b = await r.json();
      const obj = JSON.parse(b?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '{}');
      if (Array.isArray(obj.propositions)) return obj.propositions.slice(0, 3) as Array<{ cle: string; agent: string; pourquoi: string }>;
    } catch { /* modèle suivant */ }
  }
  return [];
}

Deno.serve(compter('legion_veilleur', async (req: Request) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Le verrou: seul le cron connaît ce jeton.
  const { data: s } = await db.from('app_secrets').select('value').eq('name', 'legion_veilleur').maybeSingle();
  if (!s?.value) return json({ erreur: 'secret indisponible' }, 503);
  if (req.headers.get('x-finjaro-token') !== s.value) return json({ erreur: 'non autorisé' }, 401);

  const erreurs: string[] = [];
  let vus = 0, retenus = 0, ajoutees = 0, propositionsFaites = 0;
  const nouvelles: Nouvelle[] = [];

  // 1-2. Chercher, écarter ce qui est déjà lu ou pas libre.
  const { data: dejaCat } = await db.from('studio_catalogue').select('source_repo, cle');
  const reposConnus = new Set((dejaCat || []).map((x) => x.source_repo));
  const clesConnues = new Set((dejaCat || []).map((x) => x.cle));
  const { data: dejaVus } = await db.from('legion_veille_depots').select('depot');
  const vusAvant = new Set((dejaVus || []).map((x) => x.depot));

  const candidats = new Map<string, { licence: string | null; branche: string; etoiles: number }>();
  for (const q of RECHERCHES) {
    const r = await github(`/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=15`);
    if (!r.ok) { erreurs.push(`recherche ${q}: HTTP ${r.status}`); continue; }
    const b = await r.json();
    for (const it of b.items || []) {
      if (!it.full_name || candidats.has(it.full_name)) continue;
      candidats.set(it.full_name, { licence: it.license?.spdx_id ?? null, branche: it.default_branch || 'main', etoiles: it.stargazers_count || 0 });
    }
  }

  // Les plus suivis d'abord (étoiles): à défaut de mieux, c'est le signe
  // que d'autres s'en servent.
  const aLire: Array<[string, { licence: string | null; branche: string }]> = [];
  for (const [depot, info] of [...candidats].sort((a, b) => b[1].etoiles - a[1].etoiles)) {
    if (reposConnus.has(depot) || vusAvant.has(depot)) continue;
    vus += 1;
    if (!info.licence || !LICENCES_LIBRES.includes(info.licence)) {
      await db.from('legion_veille_depots').upsert({ depot, licence: info.licence, retenu: false, raison: 'licence non libre ou absente' });
      continue;
    }
    if (aLire.length < DEPOTS_PAR_JOUR) aLire.push([depot, info]);
  }

  // 3. Lire les fiches des dépôts retenus.
  for (const [depot, info] of aLire) {
    const r = await github(`/repos/${depot}/git/trees/${encodeURIComponent(info.branche)}?recursive=1`);
    if (!r.ok) { erreurs.push(`arbre ${depot}: HTTP ${r.status}`); continue; }
    const arbre = await r.json();
    const chemins: string[] = (arbre.tree || []).filter((n: { type: string; path: string }) => n.type === 'blob' && /(^|\/)SKILL\.md$/i.test(n.path))
      .map((n: { path: string }) => n.path).slice(0, FICHES_PAR_DEPOT);
    let fiches = 0;
    for (const chemin of chemins) {
      try {
        const f = await fetch(`https://raw.githubusercontent.com/${depot}/${info.branche}/${chemin}`, { signal: AbortSignal.timeout(15_000) });
        if (!f.ok) continue;
        const texte = await f.text();
        const { nom, description } = entete(texte);
        const nomFiche = nom || chemin.split('/').slice(-2, -1)[0] || depot.split('/')[1];
        let cle = slug(nomFiche);
        if (!cle) continue;
        if (clesConnues.has(cle)) cle = slug(`${depot.split('/')[0]}-${nomFiche}`);
        if (clesConnues.has(cle)) continue;
        const { error } = await db.from('studio_catalogue').insert({
          cle, source_repo: depot, source_chemin: chemin, nom: nomFiche, genre: 'skill',
          // Une fiche rangée à la racine du dépôt n'a pas de dossier parent:
          // sa catégorie est alors le nom du dépôt (la colonne est obligatoire).
          description: (description || '').slice(0, 1000), categorie: chemin.split('/').slice(-3, -2)[0] || depot.split('/')[1],
          licence: info.licence, modele: '', taille: texte.length,
        });
        if (error) { erreurs.push(`${depot}/${chemin}: ${error.message}`); continue; }
        clesConnues.add(cle); fiches += 1; ajoutees += 1;
        nouvelles.push({ cle, nom: nomFiche, description: description || '', source_repo: depot });
      } catch (e) { erreurs.push(`${depot}/${chemin}: ${(e as Error).message}`); }
    }
    if (fiches) retenus += 1;
    await db.from('legion_veille_depots').upsert({ depot, licence: info.licence, retenu: fiches > 0, fiches, raison: fiches ? null : 'aucune fiche SKILL.md lisible' });
  }

  // 4. Proposer, entreprise par entreprise.
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (apiKey && nouvelles.length) {
    const { data: entreprises } = await db.from('legion_entreprises').select('id, nom');
    for (const e of entreprises || []) {
      const { data: agents } = await db.from('legion_agents').select('id, nom, poste, mandat, departement, est_directeur')
        .eq('entreprise_id', e.id).is('user_id', null).eq('actif', true).neq('moteur', 'claude-code');
      if (!agents?.length) continue;
      const props = await proposer(apiKey, agents, e.nom, nouvelles);
      const valides = props.map((p) => ({ p, a: agents.find((x) => x.nom === p.agent), n: nouvelles.find((x) => x.cle === p.cle) }))
        .filter((x) => x.a && x.n);
      if (!valides.length) continue;
      const { data: direction } = await db.from('legion_canaux').select('id').eq('entreprise_id', e.id).ilike('nom', 'direction').is('prive_entre', null).maybeSingle();
      const auteur = agents.find((a) => a.est_directeur && /direction/i.test(a.departement || '')) || agents.find((a) => a.est_directeur) || agents[0];
      if (!direction) continue;
      const depots = [...new Set(nouvelles.map((n) => n.source_repo))];
      const { error } = await db.from('legion_messages').insert({
        entreprise_id: e.id, canal_id: direction.id, auteur_id: auteur.id, user_id: null, genre: 'proposition',
        texte: `🔭 Le veilleur a lu ${nouvelles.length} nouvelle${nouvelles.length > 1 ? 's' : ''} fiche${nouvelles.length > 1 ? 's' : ''} de savoir-faire sur GitHub ce matin (${depots.join(', ')}, sous licence libre). Celles qui nous serviraient :\n${valides.map((x) => `• ${x.n!.nom} pour ${x.a!.nom} — ${x.p.pourquoi}`).join('\n')}`,
        meta: { par: 'veilleur', par_ia: true, propositions: valides.map((x) => ({ agent_id: x.a!.id, agent: x.a!.nom, cle: x.n!.cle, nom: x.n!.nom })) },
      });
      if (error) erreurs.push(`message ${e.nom}: ${error.message}`); else propositionsFaites += valides.length;
    }
  }

  // 5. Le journal.
  await db.from('legion_veilles').insert({ depots_vus: vus, depots_retenus: retenus, fiches_ajoutees: ajoutees, propositions: propositionsFaites, erreurs });
  return json({ depots_vus: vus, depots_retenus: retenus, fiches_ajoutees: ajoutees, propositions: propositionsFaites, erreurs });
}));
