// Finjaro — KYC OCR assisté (pilier 3, capacité 13). Lit une pièce d'identité
// du bucket PRIVÉ `ids` et en extrait les champs par Structured Output strict
// (type de pièce, lisibilité, nom, dates). C'est une AIDE à la vérification
// pour l'admin — la fonction ne prend JAMAIS de décision: elle n'écrit aucun
// statut, ne valide ni ne rejette personne. L'humain compare et tranche.
//
// ACCÈS: admin uniquement (profiles.is_admin), vérifié côté serveur — le
// bucket `ids` est privé et contient les pièces de toutes les candidates;
// aucune vendeuse ne doit pouvoir lire la pièce d'une autre via cette
// fonction. Lecture du fichier via le client service-role (le bucket n'a pas
// d'URL publique, c'est voulu).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUDGET_EUR = 20;
const OCR_CALL_COST_EUR = 0.002;
const MAX_IMG_BYTES = 8_000_000;

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
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

function monthStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    // Admin only — vérifié en base, pas sur la foi du client.
    const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    if (!profile?.is_admin) return json({ error: 'forbidden' }, 403);

    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `kyc_ocr:u:${user.id}`,
      p_limit: 30,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { data: usage } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
    const totalEur = (usage ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
    if (totalEur >= BUDGET_EUR) return json({ error: 'budget_exceeded' }, 503);

    const { image_path } = await req.json();
    if (!image_path || typeof image_path !== 'string' || image_path.includes('..')) {
      return json({ error: 'missing_image' }, 400);
    }

    // Bucket privé: téléchargement via service-role, jamais d'URL publique.
    const { data: file, error: dlErr } = await sb.storage.from('ids').download(image_path);
    if (dlErr || !file) return json({ error: 'image_not_found' }, 400);
    const buf = await file.arrayBuffer();
    if (buf.byteLength > MAX_IMG_BYTES) return json({ error: 'image_too_large' }, 400);
    const mime = file.type || 'image/jpeg';

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: mime, data: b64(buf) } },
              {
                text:
                  `Lis cette pièce d'identité. Extrais UNIQUEMENT ce qui est réellement lisible ` +
                  `sur l'image — champ vide si illisible ou absent, n'invente rien. ` +
                  `Dates au format AAAA-MM-JJ si lisibles, sinon vide.`,
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              required: ['type_piece', 'lisible'],
              properties: {
                type_piece: { type: 'STRING', enum: ['cni', 'passeport', 'sejour', 'permis', 'autre'] },
                lisible: { type: 'BOOLEAN' },
                nom: { type: 'STRING' },
                prenom: { type: 'STRING' },
                date_naissance: { type: 'STRING' },
                date_expiration: { type: 'STRING' },
                remarques: { type: 'STRING' },
              },
            },
          },
        }),
      },
    );
    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text());
      return json({ error: 'gemini_error' }, 502);
    }
    const data = await res.json();
    const text =
      (data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || '').trim();
    try {
      const parsed = JSON.parse(text);
      sb.from('ai_usage').insert({ fn: 'kyc_ocr', cost_eur: OCR_CALL_COST_EUR }).then(() => {}, () => {});
      return json(parsed);
    } catch {
      return json({ error: 'bad_ai_response' }, 502);
    }
  } catch (err) {
    console.error('kyc-ocr exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
