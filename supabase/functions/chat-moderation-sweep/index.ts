// Modération de texte dans les messages (insultes/spam) — voir migration
// 0096 pour le raisonnement complet.
//
// Différence essentielle avec moderation-sweep (produits/vidéos/boutiques):
// un message privé n'est JAMAIS masqué ni son auteur suspendu ici, même en
// cas d'abus manifeste. On se contente de signaler (severity='review',
// target_type='chat_message') pour une décision humaine dans la console
// d'administration — une conversation commerciale vive n'est pas un abus, et
// un faux positif ne doit jamais coûter un compte tout seul.
//
// Même patron d'authentification que moderation-sweep / chat-autoreply:
// jeton partagé dans app_secrets, présenté en en-tête x-finjaro-token,
// verify_jwt=false requis sur cette fonction.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
};

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const BUDGET_EUR = 20;
const CALL_COST_EUR = 0.0006;
// Un premier passage sans repère ne doit JAMAIS relire tout l'historique des
// conversations privées d'un coup — on ne surveille qu'à partir de
// maintenant, jamais rétroactivement.
const WATERMARK_KEY = 'chat_moderation_watermark';
const MAX_PAR_PASSAGE = 200;

type Json = Record<string, unknown>;

const INSTRUCTION = `Tu surveilles les messages échangés entre acheteuses et boutiques sur la
marketplace Finjaro, pour repérer l'abus et le spam — PAS pour juger la qualité de la
conversation commerciale.

Pour CHAQUE message, réponds avec un verdict parmi trois:

"ok" — cas normal, la très grande majorité: question, négociation de prix, réclamation
posée fermement, désaccord, refus, message familier ou maladroit. Un ton vif ou une
cliente mécontente ne sont PAS un abus. Dans le doute, réponds "ok".

"abus" — UNIQUEMENT: insulte directe, menace, harcèlement répété, propos haineux
(racisme, sexisme...), contenu à caractère sexuel non sollicité envoyé à l'autre personne.

"spam" — UNIQUEMENT: lien publicitaire non sollicité sans rapport avec la conversation,
message manifestement envoyé en masse (copié-collé promotionnel), tentative d'arnaque
ou de paiement hors plateforme suspecte (pas une simple mention de WhatsApp/Mobile Money,
déjà normale sur cette marketplace).

Réponds UNIQUEMENT par un tableau JSON, un objet par message, dans l'ordre reçu, sans
texte autour et sans balises de code:
[{"id":"<id reçu>","verdict":"ok|abus|spam","raison":"<une phrase en français, vide si ok>"}]`;

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

// deno-lint-ignore no-explicit-any
async function isOverBudget(sb: any): Promise<boolean> {
  const { data } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
  const total = (data ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
  return total >= BUDGET_EUR;
}

async function classify(apiKey: string, items: Array<{ id: string; texte: string }>): Promise<Json[]> {
  const payload = items.map((i) => `id=${i.id} :: ${i.texte}`).join('\n');
  for (const model of MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: payload }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
      if (!resp.ok) continue;
      const data = (await resp.json()) as Json;
      const txt = ((data.candidates as Json[])?.[0]?.content as Json)?.parts as Json[];
      const raw = String(txt?.[0]?.text ?? '').trim();
      if (!raw) continue;
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* modèle suivant */
    }
  }
  throw new Error('aucun modèle disponible');
}

// Le jeton partagé, lu avec une deuxième chance.
//
// Beau (12/09), en cherchant pourquoi il n'avait pas été prévenu d'un
// message: une fois sur deux environ, ce passage rendait « non autorisé »
// (401) alors que le cron envoyait le BON jeton — vérifié en rejouant
// l'appel à la main avec exactement le même. La cause n'est pas le jeton
// mais la lecture: au démarrage à froid, la requête vers app_secrets
// échoue parfois, `attendu` vaut null, et le code concluait « ce n'est pas
// le bon appelant ». Le passage était donc sauté en silence.
//
// Deux corrections: on réessaie une fois, et on ne dit plus « non
// autorisé » quand on n'a tout simplement PAS PU lire le secret — c'est un
// 503, une panne passagère, pas un intrus. Les deux se distinguent enfin
// dans les journaux.
async function verifierJeton(
  db: ReturnType<typeof admin>,
  nomSecret: string,
  recu: string | null
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  let attendu: string | null = null;
  let echecLecture: unknown = null;
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await db.from('app_secrets').select('value').eq('name', nomSecret).maybeSingle();
    if (!error && data?.value) {
      attendu = data.value;
      break;
    }
    echecLecture = error ?? 'secret introuvable';
    if (essai === 0) await new Promise((r) => setTimeout(r, 250));
  }
  if (!attendu) {
    console.error(`secret ${nomSecret} illisible, passage abandonné:`, echecLecture);
    return { ok: false, status: 503, error: 'secret indisponible' };
  }
  if (recu !== attendu) return { ok: false, status: 401, error: 'non autorisé' };
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const db = admin();
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const verdict = await verifierJeton(db, 'chat_moderation_sweep', req.headers.get('x-finjaro-token'));
  if (!verdict.ok) return json({ error: verdict.error }, verdict.status);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'GEMINI_API_KEY manquante' }, 500);

  if (await isOverBudget(db)) return json({ traitees: 0, ignore: 'budget' });

  try {
    const { data: cfg } = await db.from('app_config').select('value').eq('key', WATERMARK_KEY).maybeSingle();
    const debut = new Date().toISOString();
    const depuis = (cfg?.value as string) || new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: messages, error: errMsg } = await db
      .from('chat_messages')
      .select('id, sender_id, sender_role, body, created_at')
      .gt('created_at', depuis)
      .not('body', 'is', null)
      .order('created_at', { ascending: true })
      .limit(MAX_PAR_PASSAGE);
    if (errMsg) return json({ error: errMsg.message }, 500);

    const items = (messages ?? [])
      .filter((m: Json) => String(m.body ?? '').trim().length > 0)
      .map((m: Json) => ({ id: String(m.id), texte: String(m.body).slice(0, 500) }));

    // Si ce passage a rendu tout le plafond, d'autres messages plus récents
    // attendent probablement derrière: le repère s'arrête au dernier lu au
    // lieu de sauter par-dessus (même garde-fou que moderation-sweep).
    const watermark = messages && messages.length === MAX_PAR_PASSAGE
      ? String((messages[messages.length - 1] as Json).created_at)
      : debut;

    if (items.length === 0) {
      await db.from('app_config').upsert({ key: WATERMARK_KEY, value: watermark, updated_at: debut });
      return json({ traitees: 0 });
    }

    const parId = new Map((messages ?? []).map((m: Json) => [String(m.id), m]));
    let abus = 0;
    let spam = 0;

    const lots: Array<Array<{ id: string; texte: string }>> = [];
    for (let i = 0; i < items.length; i += 40) lots.push(items.slice(i, i + 40));
    const resultats = await Promise.allSettled(lots.map((lot) => classify(apiKey, lot)));

    let unLotAEchoue = false;
    for (const r of resultats) {
      if (r.status === 'rejected') { unLotAEchoue = true; continue; }
      for (const v of r.value) {
        const verdict = String(v.verdict ?? 'ok');
        if (verdict === 'ok') continue;
        const id = String(v.id ?? '');
        const msg = parId.get(id) as Json | undefined;
        if (!msg) continue;
        const raison = String(v.raison ?? '').slice(0, 300);

        if (verdict === 'abus') abus++; else if (verdict === 'spam') spam++; else continue;

        const { data: deja } = await db.from('reports')
          .select('id').is('reporter_id', null)
          .eq('target_type', 'chat_message').eq('target_id', id)
          .eq('status', 'pending').maybeSingle();
        if (deja) continue;

        await db.from('reports').insert({
          reporter_id: null,
          source: 'auto',
          target_type: 'chat_message',
          target_id: id,
          reason: verdict === 'abus' ? 'langage_abusif' : 'spam',
          severity: 'review',
          detail: `${msg.sender_role === 'buyer' ? 'Cliente' : 'Boutique'}: "${String(msg.body).slice(0, 300)}" — ${raison}`,
          status: 'pending',
        });
      }
    }

    // Un lot raté ne doit pas faire avancer le repère au-delà de ce qui a
    // vraiment été relu — mêmes garde-fous que moderation-sweep.
    await db.from('app_config').upsert({ key: WATERMARK_KEY, value: unLotAEchoue ? depuis : watermark, updated_at: debut });

    if (abus + spam > 0) {
      db.from('ai_usage').insert({ fn: 'chat_moderation_sweep', cost_eur: CALL_COST_EUR * lots.length }).then(() => {}, () => {});
      const { data: admins } = await db.from('profiles').select('id').eq('is_admin', true);
      for (const a of admins ?? []) {
        await db.from('notifications').insert({
          user_id: (a as Json).id,
          type: 'moderation',
          title: `${abus + spam} message(s) signalé(s) dans le chat`,
          body: `${abus} abus, ${spam} spam détectés dans les conversations. À traiter dans la console d'administration, onglet Modération.`,
          data: { abus, spam },
        });
      }
    } else {
      db.from('ai_usage').insert({ fn: 'chat_moderation_sweep', cost_eur: CALL_COST_EUR * lots.length }).then(() => {}, () => {});
    }

    return json({ traitees: items.length, abus, spam });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
