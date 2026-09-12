// Finia Premium — l'agent qui répond à la place d'une vendeuse abonnée
// quand elle laisse un message client sans réponse trop longtemps.
//
// Décidé par Beau le 08/09 : activation manuelle (elle paie 5000 FCFA/mois
// par Mobile Money, il active depuis l'admin — voir shops.premium_until),
// envoi automatique DIRECT (pas un brouillon à valider — sinon ça ne la
// soulage pas si elle n'ouvre pas l'app), déclenché après 2h sans réponse,
// TOUJOURS marqué clairement comme automatique (chat_messages.auto_reply)
// pour que l'acheteuse ne confonde jamais avec la vendeuse elle-même.
//
// Appelée uniquement par le cron SQL lancer_chat_autoreply() (pg_net, sans
// JWT) — même patron que moderation-sweep : jeton partagé dans
// app_secrets, lu ici en en-tête x-finjaro-token. verify_jwt=false requis
// sur cette fonction.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
};

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const BUDGET_EUR = 20;
const CALL_COST_EUR = 0.0008;
const GEMINI_TIMEOUT_MS = 20_000;
// Pas plus de deux heures d'attente avant que Finia prenne le relais — en
// dessous, une vendeuse qui répond normalement se ferait doubler pour rien.
const SEUIL_HEURES = 2;
// Plafond par passage: en cas d'incident (beaucoup de boutiques premium,
// beaucoup de messages en attente d'un coup), on ne vide jamais tout le
// budget IA du mois en un seul passage de cron.
const MAX_PAR_PASSAGE = 20;

type Json = Record<string, unknown>;

const INSTRUCTION = `Tu es l'assistante automatique d'une boutique sur la place de marché Finjaro.
La vendeuse n'a pas répondu depuis plus de deux heures — tu réponds à sa place, EN SON NOM, à
partir UNIQUEMENT des articles listés ci-dessous et de la conversation. Style: court (2-3
phrases maximum), chaleureux, en français.

INTERDITS ABSOLUS, parce que tu engages la vendeuse sans qu'elle ait rien validé:
- N'invente JAMAIS un prix, un stock, une couleur/taille, un délai de livraison ou une politique
  qui n'est pas donné explicitement ci-dessous.
- Ne promets JAMAIS de remise, de geste commercial, d'annulation ou de remboursement.
- Ne confirme JAMAIS une commande, un rendez-vous ou un envoi — seule la vendeuse le fait.
- Si la question sort de ce que tu sais (négociation de prix, réclamation, problème avec une
  commande déjà passée, question très spécifique), ne réponds PAS au fond: dis simplement que
  la vendeuse va revenir vers elle dès que possible.

Réponds UNIQUEMENT par le texte du message à envoyer, sans guillemets, sans préfixe, sans balise.`;

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

async function genererReponse(apiKey: string, catalogue: string, historique: string): Promise<string | null> {
  const contenu = `ARTICLES DE LA BOUTIQUE (les seuls dont tu peux parler):\n${catalogue}\n\nCONVERSATION (la dernière ligne est la question à laquelle répondre):\n${historique}`;
  for (const model of MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: contenu }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
          }),
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      );
      if (!resp.ok) continue;
      const data = (await resp.json()) as Json;
      const txt = ((data.candidates as Json[])?.[0]?.content as Json)?.parts as Json[];
      const raw = String(txt?.[0]?.text ?? '').trim();
      if (raw) return raw.slice(0, 600);
    } catch {
      /* modèle suivant */
    }
  }
  return null;
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

  // Même verrou que moderation-sweep: seul le cron connaît ce jeton.
  const verdict = await verifierJeton(db, 'chat_autoreply', req.headers.get('x-finjaro-token'));
  if (!verdict.ok) return json({ error: verdict.error }, verdict.status);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'GEMINI_API_KEY manquante' }, 500);

  try {
    // Conversations dont le TOUT DERNIER message vient de l'acheteuse,
    // vieux de plus de SEUIL_HEURES, sur une boutique premium active. Après
    // une réponse auto, le dernier message devient sender_role='vendor':
    // la même conversation ne peut plus matcher tant que l'acheteuse n'a
    // pas écrit de nouveau — pas besoin d'un autre garde-fou anti-boucle.
    const { data: candidates, error: errCand } = await db.rpc('conversations_a_relancer_ia', {
      p_seuil_heures: SEUIL_HEURES,
      p_limite: MAX_PAR_PASSAGE,
    });
    if (errCand) return json({ error: errCand.message }, 500);
    if (!candidates || candidates.length === 0) return json({ traitees: 0 });

    let traitees = 0;
    let ignoreesBudget = 0;

    for (const conv of candidates as Json[]) {
      if (await isOverBudget(db)) { ignoreesBudget++; continue; }

      const shopId = conv.shop_id as string;
      const conversationId = conv.conversation_id as string;
      const ownerId = conv.owner_id as string;

      const [{ data: produits }, { data: messages }] = await Promise.all([
        db.from('products')
          .select('name, price_fcfa, stock, description')
          .eq('shop_id', shopId).eq('is_active', true)
          .order('created_at', { ascending: false }).limit(40),
        db.from('chat_messages')
          .select('sender_role, body, image_url')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false }).limit(10),
      ]);

      if (!produits || produits.length === 0) continue; // rien à répondre à partir de rien

      const catalogue = produits
        .map((p: Json) => `- ${p.name}: ${p.price_fcfa} FCFA, stock ${p.stock}${p.description ? ` — ${String(p.description).slice(0, 140)}` : ''}`)
        .join('\n');
      const historique = (messages as Json[] ?? [])
        .reverse()
        .map((m) => `${m.sender_role === 'buyer' ? 'Cliente' : 'Boutique'}: ${m.body || (m.image_url ? '[photo]' : '')}`)
        .join('\n');

      const reponse = await genererReponse(apiKey, catalogue, historique);
      if (!reponse) continue;

      const { error: errInsert } = await db.from('chat_messages').insert({
        conversation_id: conversationId,
        sender_id: ownerId,
        sender_role: 'vendor',
        body: reponse,
        auto_reply: true,
      });
      if (errInsert) continue;

      await db.from('ai_usage').insert({ fn: 'chat-autoreply', cost_eur: CALL_COST_EUR });
      traitees++;

      // La vendeuse reste au courant de ce qui part en son nom — elle peut
      // reprendre la conversation à tout moment.
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({
          user_id: ownerId,
          title: `Finia a répondu à ta place`,
          body: reponse.slice(0, 140),
          url: `/vendor/messages/${conversationId}`,
          tag: `autoreply-${conversationId}`,
        }),
      }).catch(() => {});
    }

    return json({ traitees, ignorees_budget: ignoreesBudget, total: (candidates as Json[]).length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
