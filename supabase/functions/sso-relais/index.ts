// LE RELAIS DE CONNEXION ENTRE LES APPLICATIONS FINJARO (point 47, 0173).
//
// Une seule fonction, deux gestes:
//   { action: 'creer', cible }   — appelée par l'application de départ AVEC la
//                                  session de la personne: rend un code à usage
//                                  unique, valable 60 secondes.
//   { action: 'echanger', code } — appelée par l'application d'arrivée, sans
//                                  session: rend les jetons d'une session pour
//                                  cette personne. Le code est brûlé.
//
// La session d'arrivée est fabriquée côté serveur: lien magique généré par
// l'administration (aucun e-mail n'est envoyé), puis vérifié ici même. Le
// Site URL et les Redirect URLs de Supabase ne servent pas et ne bougent pas
// (règle du CLAUDE.md). Un compte sans adresse e-mail (inscrit par
// téléphone) ne peut pas être relayé: l'application d'arrivée montre alors
// sa connexion habituelle — rien de pire qu'avant.
//
// Fonction commune à toutes les applications (un seul projet Supabase):
// Accounting l'appelle aussi. Plan relu par Claudinette: docs/CONNEXION-UNIQUE.md.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PROD_HOST = 'finjaro.net';
const DUREE_MS = 60_000;

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

function codeAleatoire(): string {
  const octets = new Uint8Array(24);
  crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  let corps: { action?: string; cible?: string; code?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // ------------------------------------------------------------------ créer
  if (corps.action === 'creer') {
    const auth = req.headers.get('Authorization') || '';
    const moi = createClient(url, anonKey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user } } = await moi.auth.getUser();
    if (!user) return json({ erreur: 'Connexion requise.' }, 401);
    if (!user.email) return json({ erreur: 'sans_email' }, 409);
    const code = codeAleatoire();
    const cible = String(corps.cible || '').slice(0, 40) || null;
    const expire_le = new Date(Date.now() + DUREE_MS).toISOString();
    const { error } = await service.from('sso_relais').insert({ code, user_id: user.id, cible, expire_le });
    if (error) { console.error('creer:', error.message); return json({ erreur: 'Relais indisponible.' }, 500); }
    return json({ code, expire_le });
  }

  // --------------------------------------------------------------- échanger
  if (corps.action === 'echanger') {
    const code = String(corps.code || '');
    if (!/^[0-9a-f]{48}$/.test(code)) return json({ erreur: 'code_invalide' }, 400);
    const maintenant = new Date().toISOString();
    // Brûlé et lu d'un seul geste: deux échanges simultanés du même code, un
    // seul passe.
    const { data: lignes, error } = await service
      .from('sso_relais')
      .update({ utilise_le: maintenant })
      .eq('code', code)
      .is('utilise_le', null)
      .gt('expire_le', maintenant)
      .select('user_id');
    if (error) { console.error('echanger:', error.message); return json({ erreur: 'Relais indisponible.' }, 500); }
    if (!lignes || lignes.length === 0) return json({ erreur: 'code_invalide' }, 410);
    const userId = lignes[0].user_id as string;

    const { data: compte } = await service.auth.admin.getUserById(userId);
    const email = compte?.user?.email;
    if (!email) return json({ erreur: 'sans_email' }, 409);

    const { data: lien, error: eLien } = await service.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = lien?.properties?.hashed_token;
    if (eLien || !tokenHash) { console.error('generateLink:', eLien?.message); return json({ erreur: 'Relais indisponible.' }, 500); }

    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess, error: eOtp } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
    const session = sess?.session;
    if (eOtp || !session) { console.error('verifyOtp:', eOtp?.message); return json({ erreur: 'Relais indisponible.' }, 500); }
    return json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      user: { id: userId, email },
    });
  }

  return json({ erreur: 'Demande incomplète.' }, 400);
});
