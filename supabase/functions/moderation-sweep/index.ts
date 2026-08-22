// L'inspection quotidienne des contenus.
//
// Beau: « Finia qui passe chaque matin pour vérifier les contenus, me
// signaler et bloquer les contenus mauvais — sex toys, pédo, trucs
// trafiqués, bref les trucs mauvais dans les parties de vendeurs etc ».
//
// Jusqu'ici la modération était purement RÉACTIVE: la file ne se remplissait
// que si quelqu'un cliquait « signaler ». Zéro signalement reçu à ce jour —
// ce qui ne prouve pas que le catalogue est propre, seulement que personne
// n'a cliqué. Un contenu illégal pouvait rester en ligne indéfiniment avec le
// nom de Finjaro dessus, et c'est aussi ce que les magasins d'applications
// reprochent en premier.
//
// TROIS ENDROITS, parce que retirer un article ne sert à rien si la même
// chose reste visible en vidéo dans le fil ou écrite dans la description de
// la boutique: les articles, les vidéos, les boutiques.
//
// DEUX NIVEAUX, jamais confondus:
//
//   BLOQUER — illégal ou intolérable, sans discussion possible: contenus
//   pédocriminels, êtres humains, drogues, armes, papiers officiels,
//   médicaments sur ordonnance, espèces protégées, contrefaçons annoncées
//   comme telles. Le contenu sort de la vue IMMÉDIATEMENT, avant même que
//   Beau ouvre l'application.
//
//   SIGNALER — douteux ou hors positionnement, mais pas illégal: articles
//   pour adultes, contenu choquant, article dont on ne comprend pas ce qui
//   est vendu. Rien n'est retiré: Beau tranche.
//
// Rien n'est jamais SUPPRIMÉ. Un contenu bloqué est masqué et horodaté, avec
// la raison en clair — pour que l'erreur de la machine se répare d'un clic,
// et que la vendeuse puisse recevoir une explication.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
};

type Json = Record<string, unknown>;

const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];

const INSTRUCTION = `Tu inspectes les contenus d'une place de marché grand public (Finjaro):
des annonces d'articles, des légendes de vidéos, des descriptions de boutiques.
Pour CHAQUE contenu, tu réponds avec un verdict parmi trois.

"ok" — contenu ordinaire et légal. C'est le cas de la très grande majorité:
vêtements, chaussures, cosmétiques, cheveux et perruques, nourriture,
décoration, électronique, matériel de chantier, outils, meubles, services.
Dans le doute sur un objet banal, réponds "ok".

"block" — à retirer de la vue immédiatement. UNIQUEMENT pour:
- tout contenu impliquant des mineurs de façon sexuelle;
- vente d'êtres humains, travail forcé, adoption, organes;
- drogues, stupéfiants, substances illicites;
- armes à feu, munitions, explosifs, armes blanches de combat;
- papiers officiels: passeports, visas, diplômes, permis, cartes d'identité;
- médicaments sur ordonnance, produits d'avortement, injections médicales;
- espèces protégées, ivoire, écailles, peaux d'animaux sauvages;
- comptes piratés, cartes bancaires, données volées, argent contrefait;
- contrefaçons ANNONCÉES comme telles ("première copie", "réplique AAA").

"review" — douteux, à faire trancher par un humain:
- articles à caractère sexuel ou pour adultes;
- contenu violent ou choquant;
- vente de comptes ou d'abonnements à un service (streaming, IPTV, logiciel);
- promesses médicales ou miraculeuses (guérison, blanchiment agressif);
- annonce visiblement opaque qui semble CACHER un produit interdit: mots
  codés, « produit spécial », « écrivez-moi en privé pour savoir ».

ATTENTION aux faux positifs, ils coûtent cher à une vendeuse honnête:
- « Gant anti-coupure », « lunette de sécurité », « couteau de cuisine »,
  « machette agricole » = matériel de travail ordinaire = "ok".
- Un parfum de marque ou un sac de marque SANS mention de copie = "ok".
- « Lingerie », « nuisette », « sous-vêtement » = vêtement ordinaire = "ok".
- Les compléments alimentaires et cosmétiques courants = "ok".

TU N'ES PAS CORRECTEUR. Une faute d'orthographe, un titre coupé, une
description vide, des caractères mal affichés, une annonce mal écrite ou peu
détaillée: réponds "ok". Ce sont des défauts de rédaction, pas des contenus
mauvais, et les signaler noierait les vrais problèmes sous du bruit. Ne
réponds autre chose que "ok" que si le CONTENU lui-même pose problème.

Réponds UNIQUEMENT par un tableau JSON, un objet par contenu, dans l'ordre
reçu, sans texte autour et sans balises de code:
[{"id":"<id reçu>","verdict":"ok|block|review","raison":"<une phrase en français, vide si ok>"}]`;

async function classify(apiKey: string, items: Array<{ id: string; texte: string }>) {
  const payload = items.map((i) => `id=${i.id} :: ${i.texte}`).join('\n');
  let lastErr = '';
  for (const model of MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          // Un appel qui traîne emporterait toute l'inspection avec lui: la
          // fonction a une limite de temps, et elle est tuée sans rien
          // écrire. Mieux vaut perdre un paquet et garder les autres.
          signal: AbortSignal.timeout(45000),
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: payload }] }],
            generationConfig: {
              // Une inspection doit être RÉPÉTABLE: le même article relu
              // demain doit donner le même verdict.
              temperature: 0,
              maxOutputTokens: 4096,
              thinkingConfig: { thinkingBudget: 512 },
              responseMimeType: 'application/json',
            },
          }),
        },
      );
      if (!resp.ok) { lastErr = `${model}: ${resp.status}`; continue; }
      const data = (await resp.json()) as Json;
      const txt = ((data.candidates as Json[])?.[0]?.content as Json)?.parts as Json[];
      const raw = String(txt?.[0]?.text ?? '').trim();
      if (!raw) { lastErr = `${model}: réponse vide`; continue; }
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
      if (Array.isArray(parsed)) return parsed;
      lastErr = `${model}: format inattendu`;
    } catch (e) {
      lastErr = `${model}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  throw new Error(lastErr || 'aucun modèle disponible');
}

function texte(parts: Array<unknown>) {
  return parts.filter(Boolean).join(' | ').slice(0, 400);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const db = createClient(url, key);

  // Seule la tâche planifiée peut déclencher une inspection. Sans ce
  // verrou, n'importe qui connaissant l'adresse pourrait la relancer en
  // boucle — et chaque passage coûte des appels à Gemini. Le jeton vit dans
  // `app_secrets`, table sans aucune règle d'accès: invisible depuis le
  // navigateur, lisible seulement par la clé de service.
  const { data: attendu } = await db
    .from('app_secrets').select('value').eq('name', 'moderation_sweep').maybeSingle();
  if (!attendu?.value || req.headers.get('x-finjaro-token') !== attendu.value) {
    return new Response(JSON.stringify({ error: 'non autorisé' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY manquante' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const debut = new Date().toISOString();
  const { data: run } = await db.from('moderation_runs').insert({}).select('id').single();
  const runId = run?.id as string | undefined;

  try {
    // On ne relit que ce qui est NOUVEAU depuis la dernière inspection
    // réussie — sinon le catalogue entier repasserait chaque matin, pour un
    // coût qui grandit avec lui. Au tout premier passage, on prend tout.
    const { data: last } = await db
      .from('moderation_runs')
      .select('watermark')
      .not('finished_at', 'is', null)
      .is('error', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const depuis = last?.watermark ?? '1970-01-01T00:00:00Z';

    // Du plus ancien au plus récent, et non l'inverse: si le plafond est
    // atteint, ce qui reste est le PLUS RÉCENT, et le repère (`watermark`)
    // s'arrête juste avant. Trié à l'envers, un premier passage sur 359
    // articles en aurait relu 200 puis aurait posé le repère à aujourd'hui —
    // les 159 plus anciens n'auraient jamais été inspectés, en silence.
    const MAX = { products: 200, reels: 100, shops: 100 };
    const [produits, videos, boutiques] = await Promise.all([
      db.from('products')
        .select('id, name, description, category, created_at, shops(name)')
        .gte('created_at', depuis).is('moderation_hidden_at', null)
        .order('created_at', { ascending: true }).limit(MAX.products),
      db.from('reels')
        .select('id, caption, category, created_at, shops(name)')
        .gte('created_at', depuis).is('moderation_hidden_at', null)
        .order('created_at', { ascending: true }).limit(MAX.reels),
      db.from('shops')
        .select('id, name, bio, created_at')
        .gte('created_at', depuis).is('moderation_hidden_at', null)
        .order('created_at', { ascending: true }).limit(MAX.shops),
    ]);

    // Jusqu'où cette inspection a réellement vu. Une table qui a rendu
    // exactement son plafond en a probablement laissé derrière: le repère
    // s'arrête à sa dernière ligne lue, et le passage suivant reprend là.
    // On garde le plus petit des trois — mieux vaut relire deux fois que
    // sauter une fois.
    function couvertJusqua(rows: Json[] | null, plafond: number) {
      const n = rows?.length ?? 0;
      if (n < plafond) return debut;
      return String(rows![n - 1].created_at);
    }
    const watermark = [
      couvertJusqua(produits.data as Json[], MAX.products),
      couvertJusqua(videos.data as Json[], MAX.reels),
      couvertJusqua(boutiques.data as Json[], MAX.shops),
    ].sort()[0];

    // Un seul tas: le modèle n'a pas besoin de savoir de quelle table vient
    // quoi, et un seul appel coûte moins que trois.
    const cibles = new Map<string, { type: string; nom: string }>();
    const items: Array<{ id: string; texte: string }> = [];

    for (const p of (produits.data ?? []) as Json[]) {
      cibles.set(String(p.id), { type: 'product', nom: String(p.name ?? '') });
      items.push({
        id: String(p.id),
        texte: texte(['ARTICLE:', p.name, p.description, `rayon: ${p.category}`, `boutique: ${(p.shops as Json)?.name ?? ''}`]),
      });
    }
    for (const r of (videos.data ?? []) as Json[]) {
      cibles.set(String(r.id), { type: 'reel', nom: String(r.caption ?? '') });
      items.push({
        id: String(r.id),
        texte: texte(['VIDÉO:', r.caption, `rayon: ${r.category}`, `boutique: ${(r.shops as Json)?.name ?? ''}`]),
      });
    }
    for (const s of (boutiques.data ?? []) as Json[]) {
      cibles.set(String(s.id), { type: 'shop', nom: String(s.name ?? '') });
      items.push({ id: String(s.id), texte: texte(['BOUTIQUE:', s.name, s.bio]) });
    }

    let bloques = 0;
    let signales = 0;
    let lotRate = false;

    // Par paquets de 40: assez pour rester économique, assez petit pour
    // qu'un paquet fautif ne fasse pas perdre toute l'inspection.
    //
    // EN PARALLÈLE, et ce n'est pas un raffinement: à la file, le premier
    // passage sur 406 contenus faisait onze appels de dix secondes chacun et
    // la fonction se faisait couper par la limite de temps avant d'écrire
    // quoi que ce soit. Rien n'était inspecté, rien n'était enregistré, et
    // l'inspection recommençait à zéro le lendemain — indéfiniment.
    const lots: Array<Array<{ id: string; texte: string }>> = [];
    for (let i = 0; i < items.length; i += 40) lots.push(items.slice(i, i + 40));

    const resultats = await Promise.allSettled(lots.map((lot) => classify(apiKey, lot)));

    for (const r of resultats) {
      if (r.status === 'rejected') {
        // Un paquet raté n'arrête pas les autres, mais il interdit d'avancer
        // le repère: sinon ces contenus-là seraient réputés inspectés alors
        // que personne ne les a lus, et ils ne repasseraient plus jamais.
        lotRate = true;
        continue;
      }
      const verdicts = r.value as Json[];
      for (const v of verdicts) {
        const id = String(v.id ?? '');
        const verdict = String(v.verdict ?? 'ok');
        const raison = String(v.raison ?? '').slice(0, 500);
        const cible = cibles.get(id);
        if (!cible || verdict === 'ok') continue;

        if (verdict === 'block') {
          // Retiré de la vue TOUT DE SUITE, jamais supprimé.
          const marque = { moderation_hidden_at: new Date().toISOString(), moderation_reason: raison };
          if (cible.type === 'product') {
            await db.from('products').update({ ...marque, is_active: false }).eq('id', id);
          } else if (cible.type === 'reel') {
            // `reels` n'a pas de `is_active`: c'est l'horodatage lui-même qui
            // sort la vidéo du fil (le fil filtre dessus).
            await db.from('reels').update(marque).eq('id', id);
          } else {
            await db.from('shops').update({ ...marque, status: 'suspended' }).eq('id', id);
          }
          bloques++;
        } else {
          signales++;
        }

        // Ne pas empiler dix fois le même constat sur le même contenu si
        // l'inspection y repasse: un constat déjà en attente suffit. L'index
        // unique partiel posé en 0054 reste le garde-fou en base.
        const { data: deja } = await db.from('reports')
          .select('id')
          .is('reporter_id', null)
          .eq('target_type', cible.type)
          .eq('target_id', id)
          .eq('status', 'pending')
          .maybeSingle();
        if (deja) continue;

        await db.from('reports').insert({
          reporter_id: null,
          source: 'auto',
          target_type: cible.type,
          target_id: id,
          reason: verdict === 'block' ? 'contenu_interdit' : 'a_verifier',
          severity: verdict === 'block' ? 'block' : 'review',
          detail: `${cible.nom} — ${raison}`,
          status: 'pending',
        });
      }
    }

    await db.from('moderation_runs').update({
      finished_at: new Date().toISOString(),
      watermark: lotRate ? depuis : watermark,
      checked_count: items.length,
      blocked_count: bloques,
      flagged_count: signales,
    }).eq('id', runId!);

    // Beau n'est prévenu QUE s'il y a quelque chose à faire. Une inspection
    // qui ne trouve rien ne doit pas produire de message: c'est le cas normal
    // et le plus fréquent, exactement comme la surveillance du stockage.
    if (bloques + signales > 0) {
      const { data: admins } = await db.from('profiles').select('id').eq('is_admin', true);
      for (const a of admins ?? []) {
        // Pas de lien cliquable ici, et c'est volontaire: la console
        // d'administration est un autre site (wrangler.admin.toml), qu'un
        // lien depuis l'application acheteuse ne peut pas atteindre. Le
        // message doit donc se suffire à lui-même.
        await db.from('notifications').insert({
          user_id: (a as Json).id,
          type: 'moderation',
          title: bloques > 0 ? `${bloques} contenu(s) retiré(s)` : `${signales} contenu(s) à vérifier`,
          body: `Inspection du matin: ${items.length} contenu(s) relu(s), ${bloques} bloqué(s), ${signales} à vérifier. À traiter dans la console d'administration, onglet Modération.`,
          data: { checked: items.length, blocked: bloques, flagged: signales },
        });
      }
    }

    return new Response(
      JSON.stringify({ checked: items.length, blocked: bloques, flagged: signales }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (runId) {
      await db.from('moderation_runs')
        .update({ finished_at: new Date().toISOString(), error: msg })
        .eq('id', runId);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
