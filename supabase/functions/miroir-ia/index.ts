// Finjaro — Mirror AI / essayage virtuel. Cache la clé Gemini, jamais visible
// côté client. La photo envoyée n'est PAS stockée (aucune écriture Storage) —
// elle transite juste vers Gemini et repart, RGPD-friendly par défaut.
// Une limite quotidienne par utilisateur est appliquée CÔTÉ SERVEUR (via la
// table events) car Gemini facture à l'image — impossible à contourner depuis
// le client, contrairement à une limite purement front-end.
//
// Budget safety net: shares one Gemini API key/project with finou-chat. See
// finou-chat/index.ts for the full rationale — same mechanism here so an
// image-generation spike can't blow the monthly budget either.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODEL = 'gemini-2.5-flash-image';
const DAILY_LIMIT = 5;
const BUDGET_EUR = 20;
const MIRROR_CALL_COST_EUR = 0.02; // conservative estimate — image generation costs more than a text turn
const ADMIN_USER_ID = 'bffb724f-6652-4240-a6f7-6904369a1fd4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

async function isOverBudget(sb: ReturnType<typeof admin>): Promise<boolean> {
  const { data } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
  const total = (data ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
  if (total < BUDGET_EUR) return false;

  const monthKey = monthStartIso().slice(0, 7);
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'ai_budget_alert_sent').maybeSingle();
  if (cfg?.value !== monthKey) {
    sb.from('app_config').upsert({ key: 'ai_budget_alert_sent', value: monthKey, updated_at: new Date().toISOString() }).then(() => {}, () => {});
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        user_id: ADMIN_USER_ID,
        title: 'Finjaro — budget IA atteint',
        body: `Finou Chou et Miroir AI sont en pause ce mois-ci (limite ${BUDGET_EUR}€ atteinte).`,
      }),
    }).catch(() => {});
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
    }

    const sb = admin();
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'mirror_try')
      .gte('created_at', since.toISOString());
    if ((count || 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'daily_limit_reached', limit: DAILY_LIMIT }),
        { status: 429, headers: cors }
      );
    }

    if (await isOverBudget(sb)) {
      return new Response(
        JSON.stringify({ error: 'budget_paused' }),
        { status: 503, headers: cors }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY manquant dans les secrets' }), { status: 500, headers: cors });
    }

    const { selfieBase64, prompt } = await req.json();
    if (!selfieBase64 || !prompt) {
      return new Response(JSON.stringify({ error: 'selfieBase64 et prompt requis' }), { status: 400, headers: cors });
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Essayage virtuel : montre la personne sur cette photo portant ${prompt}. Garde le visage, la pose et la morphologie identiques, change seulement la tenue/le look décrit.` },
              { inline_data: { mime_type: 'image/jpeg', data: selfieBase64 } },
            ],
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Erreur Gemini' }), { status: resp.status, headers: cors });
    }
    const imgPart = data.candidates?.[0]?.content?.parts?.find((p: { inline_data?: unknown }) => p.inline_data);
    if (!imgPart) {
      // Log the full response so we can see the REAL reason next time (e.g.
      // a safety-filter refusal or finishReason) instead of guessing blind.
      console.error('miroir-ia: no image part', JSON.stringify(data).slice(0, 2000));
      const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
      const finishReason = data.candidates?.[0]?.finishReason;
      return new Response(
        JSON.stringify({
          error: 'Aucune image générée — reformulez votre description',
          detail: textPart || finishReason || undefined,
        }),
        { status: 502, headers: cors }
      );
    }

    // Best-effort: count this successful generation toward the daily quota
    // and the monthly budget estimate.
    sb.from('events').insert({ user_id: user.id, type: 'mirror_try', meta: {} }).then(() => {}, () => {});
    sb.from('ai_usage').insert({ fn: 'miroir_ia', cost_eur: MIRROR_CALL_COST_EUR }).then(() => {}, () => {});

    return new Response(
      JSON.stringify({ image: imgPart.inline_data.data, mimeType: imgPart.inline_data.mime_type || 'image/png' }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
