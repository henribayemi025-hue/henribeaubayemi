// LEGION — le banc d'essai des moteurs (24/09). Beau : « on teste Kimi avant
// d'avancer ». Une même question, posée à plusieurs moteurs l'un après
// l'autre, avec pour chacun la réponse, le temps et le coût — pour choisir
// lequel passe en premier sur des faits, pas sur une impression.
//
// Une seule porte : le jeton « legion_banc » de app_secrets (service
// seulement). Aucune donnée d'entreprise n'est lue ni écrite ; le coût est
// compté comme les autres (ai_usage, fonction « legion_banc »).

import { cleOpenAI, clesPresentes, compter, coutEnCours } from '../_shared/cout.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generer } from '../_shared/moteur.ts';
import { transcrire } from '../_shared/relais.ts';

const SCHEMA = { type: 'OBJECT', properties: { texte: { type: 'STRING' } }, required: ['texte'] };

Deno.serve(compter('legion_banc', async (req: Request) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const jeton = req.headers.get('x-finjaro-token');
  const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_banc').maybeSingle();
  if (!jeton || !sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);

  let corps: { consigne?: string; moteurs?: string[]; diagnostic?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  // Quelles clés sont posées (le NOM et la famille reconnue à la forme,
  // jamais la valeur), et quels modèles la clé OpenAI ouvre (24/09).
  if (corps.diagnostic === 'cles') {
    let modelesOpenAI: string[] | string = 'pas de clé OpenAI';
    const cle = cleOpenAI();
    if (cle) {
      try {
        const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${cle}` }, signal: AbortSignal.timeout(15_000) });
        modelesOpenAI = r.ok ? ((await r.json()).data || []).map((m: { id: string }) => m.id).filter((x: string) => /gpt|o\d|transcribe|whisper|tts|image/.test(x)).sort() : `HTTP ${r.status}`;
      } catch (e) { modelesOpenAI = (e as Error).message; }
    }
    return json({ ok: true, cles: clesPresentes(), modelesOpenAI });
  }
  // L'écoute des vocaux par OpenAI (le relais quand Google tombe) : OpenAI
  // dit une phrase, puis la transcrit — sans aucun vrai vocal de personne.
  if (corps.diagnostic === 'voix') {
    const cle = cleOpenAI();
    if (!cle) return json({ ok: false, erreur: 'pas de clé OpenAI' });
    const phrase = 'Bonjour Finia, je cherche une robe rouge pour un mariage samedi.';
    const tts = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: phrase, response_format: 'mp3' }), signal: AbortSignal.timeout(30_000) });
    if (!tts.ok) return json({ ok: false, etape: 'voix', erreur: `HTTP ${tts.status} ${(await tts.text()).slice(0, 200)}` });
    const octets = new Uint8Array(await tts.arrayBuffer());
    const t = await transcrire({ mime: 'audio/mpeg', donnees: octets }, { fn: 'legion_banc' });
    return json({ ok: !('erreur' in t), phrase, octets: octets.length, ...t });
  }
  const consigne = String(corps.consigne || '').slice(0, 12_000);
  const liste = (corps.moteurs || []).filter((m) => /^(ds|km|an|oa):|^gemini/.test(m)).slice(0, 4);
  if (!consigne || !liste.length) return json({ erreur: 'consigne et moteurs requis' }, 400);

  const resultats = [];
  for (const m of liste) {
    const avant = coutEnCours(); const t0 = Date.now();
    // Un seul moteur, sans relève : on veut mesurer celui-là.
    const r = await generer(Deno.env.get('GEMINI_API_KEY') || '', consigne, SCHEMA, { temperature: 0.7, maxSortie: 8192, reflexion: 2048, delaiMs: 60_000, modeles: [m], sansSecours: true });
    resultats.push({ moteur: m, ms: Date.now() - t0, cout_eur: Number((coutEnCours() - avant).toFixed(6)), ...('erreur' in r ? { erreur: r.erreur } : { texte: r.obj.texte }) });
  }
  return json({ ok: true, resultats });
}));
