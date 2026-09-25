// LA VOIX DES PERSONNAGES DU MONDE 3D (Beau, 25/09 : « la voix de la
// réceptionniste est robotique, pas une voix Fish ; on a payé hier »).
// Le navigateur envoie une phrase courte ; on la fait dire par Fish Audio et
// on rend le son (mp3). La clé reste ici, jamais dans le navigateur.
// Membres d'une entreprise seulement, 300 caractères au plus par phrase.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const PROD_HOST = 'finjaro.net';
function cors(origin: string | null): Record<string, string> {
  let ok = false;
  try {
    const h = new URL(origin || '').hostname;
    ok = h === 'localhost' || h === '127.0.0.1' || h === PROD_HOST || h.endsWith(`.${PROD_HOST}`) || h.endsWith('.workers.dev') || h.endsWith('.pages.dev');
  } catch { /* refusé */ }
  return {
    'Access-Control-Allow-Origin': ok ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Voix par défaut (bibliothèque publique Fish, voix génériques — jamais l'imitation
// d'une personne réelle) ; réglables sans toucher au code : FISH_VOIX_FR / FISH_VOIX_EN.
const VOIX = { fr: 'a288bdc744da4ad194921adad6863175' /* « Clémence », narratrice */, en: '933563129e564b19a115bedd57b7406a' /* « Sarah » */ };
const voixDe = (langue: string) => (langue === 'en' ? Deno.env.get('FISH_VOIX_EN') || VOIX.en : Deno.env.get('FISH_VOIX_FR') || VOIX.fr);

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: u } = await service.auth.getUser(jwt);
  if (!u?.user) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { entreprise_id?: string; texte?: string; langue?: string; voix?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const entrepriseId = String(corps.entreprise_id || '');
  if (!/^[0-9a-f-]{36}$/.test(entrepriseId)) return json({ erreur: 'Entreprise manquante.' }, 400);
  const { data: membre } = await service.from('legion_membres').select('role').eq('entreprise_id', entrepriseId).eq('user_id', u.user.id).maybeSingle();
  if (!membre) return json({ erreur: 'Pas membre de cette entreprise.' }, 403);

  const texte = String(corps.texte || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (texte.length < 2) return json({ erreur: 'Rien à dire.' }, 400);
  const cle = (Deno.env.get('FISH_AUDIO_API_KEY') || '').trim();
  if (!cle) return json({ erreur: 'Voix Fish non configurée.' }, 503);

  const voix = /^[0-9a-f]{32}$/.test(String(corps.voix || '')) ? String(corps.voix) : voixDe(corps.langue === 'en' ? 'en' : 'fr');
  const r = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json', model: 's1' },
    body: JSON.stringify({ text: texte, format: 'mp3', mp3_bitrate: 64, latency: 'balanced', ...(voix ? { reference_id: voix } : {}) }),
  });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 200);
    // La clé ne ressort jamais ; seul le code d'erreur de Fish est rendu.
    return json({ erreur: `Fish a refusé (${r.status}).`, detail: r.status === 401 || r.status === 402 ? detail : undefined }, 502);
  }
  return new Response(r.body, { headers: { ...h, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' } });
});
