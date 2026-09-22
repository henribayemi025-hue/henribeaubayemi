// LEGION — un modèle d'entreprise pour n'importe quel secteur, à la demande.
//
// Beau, 22/09: « comment c'est juste les 7 ici ? Je t'ai dit qu'il y a des
// milliers de services, plusieurs secteurs… » Sept modèles écrits à la main
// ne feront jamais une place de marché mondiale. Ici, on décrit un secteur
// (« opérateur télécom », « clinique privée », « salon de coiffure ») et
// Gemini Pro écrit l'organigramme complet: les départements, les métiers
// avec leur mandat, qui est directeur, à partir de quelle taille chaque
// poste s'ouvre, et le poids de chacun dans l'effectif. Le modèle entre dans
// le catalogue (studio_modeles + studio_modele_postes) comme les autres, et
// la fondation d'une entreprise (legion_fonder) s'en sert tel quel.
//
// Deux portes: une personne connectée (trois modèles par jour, le coût),
// ou le jeton de la base pour remplir le catalogue en série.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini } from '../_shared/cout.ts';

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const MODELES = ['gemini-3.1-pro-preview', 'gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-2.5-flash'];
const TAILLES = ['cocon', 'startup', 'scaleup', 'megacorp'];
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    nom: { type: 'STRING' },
    emoji: { type: 'STRING' },
    promesse: { type: 'STRING' },
    niveau: { type: 'STRING' },
    concept: { type: 'STRING' },
    effectifs: { type: 'STRING' },
    postes: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      departement: { type: 'STRING' }, poste: { type: 'STRING' }, mandat: { type: 'STRING' },
      des_la_taille: { type: 'STRING', enum: TAILLES }, est_directeur: { type: 'BOOLEAN' }, poids: { type: 'INTEGER' },
    }, required: ['departement', 'poste', 'mandat', 'des_la_taille', 'est_directeur', 'poids'] } },
  },
  required: ['nom', 'emoji', 'promesse', 'niveau', 'concept', 'effectifs', 'postes'],
};

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = (s: string) => sansAccent(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function invite(secteur: string) {
  return `Tu écris l'organigramme type d'une entreprise du secteur suivant, pour un logiciel où chaque poste devient un agent avec un mandat: « ${secteur} ».

Écris en français. Sois précis et concret, comme quelqu'un qui a travaillé dans ce secteur: les vrais métiers, les vrais départements, pas des généralités. Aucun nom de marque.

"nom": le nom du modèle, court (« Opérateur télécom », « Clinique privée », « Salon de coiffure »).
"emoji": un seul emoji qui l'évoque.
"promesse": une phrase (≤ 110 signes) qui dit ce que cette entreprise fait, à la manière de « Marketing, contenu, ventes: ce qui fait venir les clients et les garde. »
"niveau": le type d'organisation en deux à quatre mots (« Opérateur télécom national »).
"concept": 500 à 800 signes: ce que vend cette entreprise, comment elle est organisée, qui décide, comment le travail circule entre les départements. À la manière de « Un cabinet vend du jugement. Une question de direction, une équipe de mission… ».
"effectifs": une ligne sur les tailles typiques, avec des ordres de grandeur réalistes (« Boutique: 5 à 30. Régional: 100 à 500. Mondial: plusieurs dizaines de milliers. »).
"postes": 45 à 80 postes, groupés par département (8 à 14 départements, dans l'ordre logique: la direction d'abord, puis le cœur du métier, puis les fonctions support). Pour chaque poste:
  - "departement": le nom du département (le même libellé exact pour tous les postes du département);
  - "poste": l'intitulé (unique dans le modèle);
  - "mandat": une phrase de 60 à 160 signes, à l'impératif ou au présent, qui dit ce dont ce poste répond — concret, mesurable quand c'est possible;
  - "des_la_taille": à partir de quelle taille d'entreprise le poste existe: "cocon" (moins de 10 personnes: seuls les postes indispensables), "startup" (10 à 50), "scaleup" (50 à 500), "megacorp" (plus de 500);
  - "est_directeur": true pour UN seul poste par département, celui qui le dirige;
  - "poids": 1 à 8 — combien de personnes ce poste représente en proportion dans une grande entreprise (8 pour les métiers de masse: vendeurs, agents, opérateurs; 1 pour un poste unique).
Le premier département est « Direction » avec le dirigeant (est_directeur true, des_la_taille "cocon").`;
}

Deno.serve(compter('legion_modele', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  let corps: { secteur?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  const secteur = String(corps.secteur || '').trim().slice(0, 160);
  if (secteur.length < 3) return json({ erreur: 'Décris le secteur en quelques mots.' }, 400);

  // Qui demande: la base (jeton), ou une personne connectée (limitée).
  const jeton = req.headers.get('x-finjaro-token');
  let par: string | null = null;
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_travail').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user } } = await personne.auth.getUser();
    if (!user) return json({ erreur: 'Il faut être connecté.' }, 401);
    par = user.id;
    const { count } = await service.from('studio_modeles').select('cle', { count: 'exact', head: true })
      .eq('cree_par', user.id).gte('created_at', new Date(Date.now() - 86_400_000).toISOString());
    if ((count ?? 0) >= 3) return json({ erreur: 'Trois nouveaux modèles par jour, pas plus: reviens demain.' }, 429);
  }

  // Déjà au catalogue ? On le rend tel quel plutôt que d'en écrire un second.
  const cle0 = slug(secteur);
  const { data: existant } = await service.from('studio_modeles').select('cle, nom').or(`cle.eq.${cle0},nom.ilike.${secteur.replace(/[%,]/g, ' ')}`).maybeSingle();
  if (existant) return json({ ok: true, deja: true, cle: existant.cle, nom: existant.nom });

  let obj: Record<string, unknown> | null = null; let modele = '';
  let derniere = 'aucun modèle joignable';
  for (const m of MODELES) {
    try {
      const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: invite(secteur) }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 16384, thinkingConfig: { thinkingBudget: 2048 }, responseMimeType: 'application/json', responseSchema: SCHEMA } }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!resp.ok) { derniere = `${m}: HTTP ${resp.status} ${(await resp.text()).slice(0, 160)}`; console.error(derniere); continue; }
      const body = await resp.json();
      const txt = body?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!txt) { derniere = `${m}: réponse vide`; continue; }
      try { obj = JSON.parse(txt); modele = m; break; } catch { derniere = `${m}: JSON illisible`; }
    } catch (e) { derniere = `${m}: ${(e as Error).message}`; console.error(derniere); }
  }
  if (!obj) return json({ erreur: derniere });

  const postes = (Array.isArray(obj.postes) ? obj.postes : []) as Array<{ departement: string; poste: string; mandat: string; des_la_taille: string; est_directeur: boolean; poids: number }>;
  if (postes.length < 20) return json({ erreur: `Modèle trop maigre (${postes.length} postes): réessaie en précisant le secteur.` });

  // Un seul directeur par département; une clé unique; un ordre stable.
  const vus = new Set<string>(); const dirigeants = new Set<string>();
  const propres = postes.filter((p) => p.poste && p.departement && p.mandat).map((p) => {
    const dept = String(p.departement).trim().slice(0, 60);
    let dir = !!p.est_directeur && !dirigeants.has(sansAccent(dept));
    if (dir) dirigeants.add(sansAccent(dept));
    return { dept, poste: String(p.poste).trim().slice(0, 80), mandat: String(p.mandat).trim().slice(0, 300),
      taille: TAILLES.includes(p.des_la_taille) ? p.des_la_taille : 'scaleup', dir, poids: Math.min(8, Math.max(1, Number(p.poids) || 1)) };
  }).filter((p) => { const k = sansAccent(p.poste); if (vus.has(k)) return false; vus.add(k); return true; });

  let cle = cle0 || slug(String(obj.nom)); if (!cle) cle = `modele-${Date.now().toString(36)}`;
  const { data: doublon } = await service.from('studio_modeles').select('cle').eq('cle', cle).maybeSingle();
  if (doublon) cle = `${cle}-${Date.now().toString(36).slice(-4)}`;
  const { data: dernier } = await service.from('studio_modeles').select('ordre').order('ordre', { ascending: false }).limit(1).maybeSingle();

  const { error: e1 } = await service.from('studio_modeles').insert({
    cle, nom: String(obj.nom).slice(0, 80), emoji: String(obj.emoji || '🏢').slice(0, 8), promesse: String(obj.promesse).slice(0, 200),
    niveau: String(obj.niveau).slice(0, 80), taille_defaut: 'startup', ordre: (dernier?.ordre ?? 100) + 10, actif: true,
    concept: String(obj.concept).slice(0, 1500), effectifs: String(obj.effectifs).slice(0, 400), cree_par: par, secteur_demande: secteur,
  });
  if (e1) return json({ erreur: e1.message });
  const { error: e2 } = await service.from('studio_modele_postes').insert(propres.map((p, i) => ({
    modele: cle, departement: p.dept, poste: p.poste, mandat: p.mandat, des_la_taille: p.taille, est_directeur: p.dir, poids: p.poids, ordre: i + 1, a_ecrire: false, agent_cle: null,
  })));
  if (e2) return json({ erreur: e2.message });
  console.log(`modèle ${cle}: ${propres.length} postes, ${dirigeants.size} départements (${modele})`);
  return json({ ok: true, cle, nom: obj.nom, postes: propres.length, departements: dirigeants.size, modele });
}));
