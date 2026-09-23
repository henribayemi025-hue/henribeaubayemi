// TRADUIRE UNE FICHE ARTICLE — une fois par langue, puis gardée (0171).
//
// Finjaro est une place de marché mondiale: une fiche écrite en français
// doit se lire en anglais chez une acheteuse anglophone, et inversement.
// La traduction se fait ici, côté serveur (la clé Gemini ne sort jamais),
// avec le modèle Flash, et se range dans product_traductions: la deuxième
// personne qui ouvre la fiche ne coûte rien. Une fiche déjà dans la langue
// demandée est rangée telle quelle (langue_source = langue), pour ne pas
// redemander à chaque ouverture.
//
// Ouverte sans compte (une acheteuse n'est pas forcément connectée), mais
// seulement pour un article en ligne, et seulement vers fr ou en.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, gemini } from '../_shared/cout.ts';

const MODELES = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const PROD_HOST = 'finjaro.net';
function origineAutorisee(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const h = new URL(origin).hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === PROD_HOST || h.endsWith(`.${PROD_HOST}`) || h.endsWith('.pages.dev') || h.endsWith('.workers.dev');
  } catch { return false; }
}
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origineAutorisee(origin) ? origin! : `https://${PROD_HOST}`,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const SCHEMA = {
  type: 'OBJECT',
  properties: { langue_source: { type: 'STRING' }, name: { type: 'STRING' }, description: { type: 'STRING' } },
  required: ['langue_source', 'name', 'description'],
};

Deno.serve(compter('traduire_fiche', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  let corps: { product_id?: string; langue?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  const productId = String(corps.product_id || '');
  const langue = String(corps.langue || '').slice(0, 2).toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(productId) || !['fr', 'en'].includes(langue)) return json({ erreur: 'Demande incomplète.' }, 400);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: deja } = await service.from('product_traductions').select('langue_source, name, description').eq('product_id', productId).eq('langue', langue).maybeSingle();
  if (deja) return json({ ...deja, langue, en_cache: true });

  const { data: p } = await service.from('products').select('id, name, description, is_active').eq('id', productId).maybeSingle();
  if (!p || !p.is_active) return json({ erreur: 'Article introuvable.' }, 404);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' }, 500);

  const cible = langue === 'fr' ? 'français' : 'anglais';
  const texte = `Voici la fiche d'un article d'une place de marché. Dis d'abord dans quelle langue elle est écrite ("fr" ou "en"; "autre" sinon). Puis rends son titre et sa description en ${cible}, fidèlement, sans rien ajouter ni retirer (pas de prix, pas de commentaire); si la fiche est déjà en ${cible}, rends-la telle quelle. Garde les retours à la ligne.
TITRE: ${String(p.name || '').slice(0, 300)}
DESCRIPTION: ${String(p.description || '').slice(0, 3000)}`;

  for (const model of MODELES) {
    try {
      const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: texte }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: SCHEMA } }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!resp.ok) { console.error(`${model}: HTTP ${resp.status}`); continue; }
      const body = await resp.json();
      const txt = body?.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text ?? '').join('') ?? '';
      const obj = JSON.parse(txt);
      const name = String(obj.name || '').replace(/\\n/g, '\n').trim().slice(0, 300);
      const description = String(obj.description || '').replace(/\\n/g, '\n').trim().slice(0, 4000) || null;
      const langueSource = ['fr', 'en'].includes(String(obj.langue_source)) ? String(obj.langue_source) : 'autre';
      if (!name) continue;
      const ligne = { product_id: productId, langue, langue_source: langueSource, name, description };
      await service.from('product_traductions').upsert(ligne);
      return json({ ...ligne, en_cache: false });
    } catch (e) { console.error(`${model}: ${(e as Error).message}`); }
  }
  return json({ erreur: 'Traduction impossible pour le moment.' }, 502);
}));
