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

// Ce qu'a coûté jusqu'ici le travail en cours (la requête, ou la part
// ouverte par aPart): noté sur chaque message d'agent (meta.cout_eur, 24/09),
// pour que le tableau de bord dise ce que coûte CHAQUE agent.
export function coutEnCours(): number {
  return suivi.getStore()?.eur ?? 0;
}

// Un travail dont on veut le coût à lui seul, même quand plusieurs tournent
// en même temps (legion-travail livre trois agents à la fois): un compteur à
// part, reversé ensuite dans celui de la requête — rien n'est compté deux
// fois, rien n'est perdu.
export async function aPart<T>(travail: () => Promise<T>): Promise<T> {
  const parent = suivi.getStore();
  if (!parent) return travail();
  const enfant: Suivi = { eur: 0, fn: parent.fn, entreprise: parent.entreprise };
  try {
    return await suivi.run(enfant, travail);
  } finally {
    parent.eur += enfant.eur;
    if (enfant.entreprise && !parent.entreprise) parent.entreprise = enfant.entreprise;
  }
}

// Le budget du mois d'UN agent (0184, idée 115 des 200): vide = pas de
// budget. Atteint, l'agent ne répond plus, ne livre plus, ne prend plus la
// parole en réunion jusqu'au mois suivant — comme le plafond de l'entreprise.
export async function budgetAgentAtteint(agent: { id: string; plafond_mois_eur?: number | string | null }): Promise<boolean> {
  if (agent.plafond_mois_eur == null) return false;
  const { data, error } = await service().rpc('legion_depense_agent', { p_agent: agent.id });
  if (error) { console.error('budget agent:', error.message); return false; }
  return Number(data || 0) >= Number(agent.plafond_mois_eur);
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
        // Supabase ne lève pas: l'échec revient dans { error }. On le dit.
        const { error } = await service().from('ai_usage').insert({ fn: s.fn, cost_eur: Number(s.eur.toFixed(6)), entreprise_id: s.entreprise });
        if (error) console.error('ai_usage:', error.message);
      }
    }
  });
}

// Le travail qui continue APRÈS la réponse (EdgeRuntime.waitUntil). compter()
// écrit sa ligne au moment où la réponse part: ce qui se dépense ensuite
// serait perdu. Ici, un compteur à part, écrit quand le travail finit.
// Première utilisatrice: legion-reunion (23/09), dont chaque prise de parole
// répond tout de suite puis parle en arrière-plan.
export function enFond(fn: string, entreprise: string | null, travail: () => Promise<void>): Promise<void> {
  return suivi.run({ eur: 0, fn, entreprise }, async () => {
    try {
      await travail();
    } catch (e) {
      console.error(`${fn}:`, (e as Error).message);
    } finally {
      const s = suivi.getStore();
      if (s && s.eur > 0) {
        const { error } = await service().from('ai_usage').insert({ fn: s.fn, cost_eur: Number(s.eur.toFixed(6)), entreprise_id: s.entreprise });
        if (error) console.error('ai_usage:', error.message);
      }
    }
  });
}

// Un coût connu autrement que par la réponse de Gemini (les vecteurs de
// recherche ne rendent pas toujours leurs jetons, 23/09): ajouté à la main.
export function ajouterCout(eur: number) {
  const s = suivi.getStore();
  if (s && Number.isFinite(eur) && eur > 0) s.eur += eur;
}
