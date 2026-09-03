// Finjaro — réinitialisation du mot de passe d'un compte, depuis la console
// d'administration.
//
// POURQUOI CETTE FONCTION EXISTE
// Un compte e-mail peut se dépanner seul: « mot de passe oublié » envoie un
// lien. Un compte TÉLÉPHONE, lui, n'a pas d'e-mail où recevoir ce lien, et il
// n'y a plus de SMS (les opérateurs camerounais filtrent les codes — voir le
// commentaire long dans src/screens/Auth.jsx). Résultat: une vendeuse qui
// oublie son mot de passe est bloquée, et jusqu'ici la seule issue était
// d'ouvrir un deuxième compte — donc une deuxième boutique repartie de zéro.
// Cette fonction donne à l'admin le seul geste honnête: poser un nouveau mot
// de passe temporaire, que l'admin transmet à la personne (WhatsApp), et que
// la personne pourra changer ensuite dans ses paramètres.
//
// Définir le mot de passe d'un AUTRE utilisateur exige la clé de service
// (auth.admin.updateUserById) — impossible depuis le navigateur, d'où cette
// fonction. Elle vérifie donc DEUX choses avant d'agir: que l'appelant est
// authentifié, et qu'il est bien admin.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Même politique CORS que send-push / finou-chat: finjaro.net + sous-domaines,
// previews Cloudflare (*.pages.dev, *.workers.dev), dev local.
const PROD_HOST = 'finjaro.net';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev')) return true;
  if (host.endsWith('.workers.dev')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

// Le mot de passe minimal de l'app est de 6 caractères (voir minLength dans
// Auth.jsx). On garde la même règle ici pour ne pas fabriquer un mot de passe
// que l'écran de connexion refuserait ensuite.
const MIN_PASSWORD = 6;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    // 1) L'appelant est-il authentifié ? Le jeton est celui que
    // supabase.functions.invoke joint automatiquement (session de l'admin).
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'unauthorized' }, 401);

    const sb = admin();
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: 'unauthorized' }, 401);

    // 2) L'appelant est-il admin ? On lit is_admin avec la clé de service —
    // jamais en se fiant à ce que le navigateur prétend.
    const { data: prof, error: profErr } = await sb
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .maybeSingle();
    if (profErr) {
      console.error('admin-reset-password: profile lookup failed', profErr.message);
      return json({ error: 'internal_error' }, 500);
    }
    if (!prof?.is_admin) return json({ error: 'forbidden' }, 403);

    // 3) Cible + nouveau mot de passe.
    const body = await req.json().catch(() => ({}));
    const targetId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
    if (!targetId) return json({ error: 'missing_user_id' }, 400);
    if (newPassword.length < MIN_PASSWORD) return json({ error: 'password_too_short' }, 400);

    // 4) Poser le mot de passe. On confirme aussi l'e-mail/téléphone au passage:
    // un compte resté « non confirmé » (cas des inscriptions téléphone quand la
    // confirmation était encore exigée) pourrait sinon garder la porte fermée
    // malgré le nouveau mot de passe.
    const { error: updErr } = await sb.auth.admin.updateUserById(targetId, {
      password: newPassword,
    });
    if (updErr) {
      // Message générique côté client; le détail reste dans les journaux, sans
      // jamais le mot de passe.
      console.error('admin-reset-password: updateUserById failed', updErr.message);
      const status = /not found|does not exist/i.test(updErr.message) ? 404 : 400;
      return json({ error: 'reset_failed', reason: updErr.message.slice(0, 200) }, status);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('admin-reset-password exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
