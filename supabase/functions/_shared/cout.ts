// LEGION — ce que coûte chaque appel à Gemini, noté et plafonné.
//
// Beau, 22/09, devant 42 € de facture qu'il n'attendait pas (des vidéos
// Veo): « je savais pas que ça pouvait être aussi cher ». Legion n'appelle
// pas Veo, mais il fait beaucoup d'appels: on les COMPTE, par entreprise,
// dans public.ai_usage (la même table que Finia), et on s'arrête net quand
// le plafond du mois que Beau a fixé est atteint.
//
// Le coût est une ESTIMATION faite à partir des jetons que Google renvoie
// dans chaque réponse (usageMetadata) et de ses prix publics en dollars,
// convertis en euros. La vraie facture reste celle d'AI Studio.

import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const USD_EN_EUR = 0.92;
// Prix publics par million de jetons (en dollars): entrée, sortie (la
// réflexion compte comme de la sortie).
const PRIX: Array<[RegExp, number, number]> = [
  [/flash-image/, 0.30, 30],   // images: ~1 290 jetons de sortie par image, soit ~0,039 $
  [/pro/, 1.25, 10],
  [/flash/, 0.30, 2.50],
];

type Suivi = { eur: number; fn: string; entreprise: string | null };
const suivi = new AsyncLocalStorage<Suivi>();

function estimer(url: string, corps: { usageMetadata?: Record<string, number> }): number {
  const u = corps?.usageMetadata;
  if (!u) return 0;
  const p = PRIX.find(([re]) => re.test(url));
  if (!p) return 0;
  const entree = u.promptTokenCount ?? 0;
  const sortie = (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0);
  return ((entree * p[1] + sortie * p[2]) / 1_000_000) * USD_EN_EUR;
}

// À la place de fetch() pour chaque appel à Gemini: même réponse, et le
// coût s'ajoute au compteur de la requête en cours.
export async function gemini(url: string, init: RequestInit): Promise<Response> {
  const r = await fetch(url, init);
  if (r.ok) {
    try {
      const s = suivi.getStore();
      if (s) s.eur += estimer(url, await r.clone().json());
    } catch { /* le compteur ne doit jamais casser l'appel */ }
  }
  return r;
}

// L'entreprise pour qui on travaille (pour que le coût lui soit compté).
export function pourEntreprise(id: string | null) {
  const s = suivi.getStore();
  if (s) s.entreprise = id;
}

const service = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

// Le plafond: la somme du mois en cours pour cette entreprise, comparée à
// legion_entreprises.plafond_mois_eur (vide = pas de plafond).
export async function plafondAtteint(entrepriseId: string): Promise<{ atteint: boolean; depense: number; plafond: number | null }> {
  const db = service();
  const debut = new Date(); debut.setUTCDate(1); debut.setUTCHours(0, 0, 0, 0);
  const [{ data: e }, { data: lignes }] = await Promise.all([
    db.from('legion_entreprises').select('plafond_mois_eur').eq('id', entrepriseId).maybeSingle(),
    db.from('ai_usage').select('cost_eur').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()),
  ]);
  const depense = (lignes || []).reduce((t: number, l: { cost_eur: number }) => t + Number(l.cost_eur), 0);
  const plafond = e?.plafond_mois_eur != null ? Number(e.plafond_mois_eur) : null;
  return { atteint: plafond != null && depense >= plafond, depense, plafond };
}

// Enrobe le serveur d'une fonction: un compteur par requête, et à la fin
// une ligne dans ai_usage si quelque chose a été dépensé.
export function compter(fn: string, traiter: (req: Request) => Promise<Response>) {
  return (req: Request) => suivi.run({ eur: 0, fn, entreprise: null }, async () => {
    try {
      return await traiter(req);
    } finally {
      const s = suivi.getStore();
      if (s && s.eur > 0) {
        await service().from('ai_usage').insert({ fn: s.fn, cost_eur: Number(s.eur.toFixed(6)), entreprise_id: s.entreprise })
          .then(() => {}, (e: unknown) => console.error('ai_usage:', e));
      }
    }
  });
}
