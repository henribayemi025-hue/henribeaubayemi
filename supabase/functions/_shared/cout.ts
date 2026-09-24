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

type Suivi = { eur: number; fn: string; entreprise: string | null; moteur?: string | null; modele?: string | null; modeleAgent?: string | null };
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
  // Le plafond de dépenses de Google atteint (nuit du 24/09 : tout s'est
  // arrêté en silence) : Beau est prévenu une fois par jour.
  if (r.status === 429) {
    try {
      const t = await r.clone().text();
      if (/spending cap/i.test(t)) await signalerCoupure('Google (Gemini)', 'le plafond de dépenses du projet est atteint', 'https://ai.studio/spend');
    } catch { /* l'alerte ne doit jamais casser l'appel */ }
  }
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
    db.from('legion_entreprises').select('plafond_mois_eur, moteur, modele').eq('id', entrepriseId).maybeSingle(),
    db.from('ai_usage').select('cost_eur').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()),
  ]);
  const depense = (lignes || []).reduce((t: number, l: { cost_eur: number }) => t + Number(l.cost_eur), 0);
  const plafond = e?.plafond_mois_eur != null ? Number(e.plafond_mois_eur) : null;
  // L'IA choisie par l'entreprise (0192), lue en même temps que le plafond:
  // toutes les fonctions le lisent avant de faire parler un agent.
  const s = suivi.getStore();
  if (s) { s.moteur = e?.moteur || 'auto'; s.modele = e?.modele || null; }
  if (plafond != null && plafond > 0 && depense >= plafond * 0.8) await signalerSeuil(entrepriseId, depense, plafond);
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
  const enfant: Suivi = { eur: 0, fn: parent.fn, entreprise: parent.entreprise, moteur: parent.moteur, modele: parent.modele, modeleAgent: parent.modeleAgent };
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

// L'IA choisie par l'entreprise pour laquelle on travaille (0192).
export function moteurChoisi(): string {
  return suivi.getStore()?.moteur || 'auto';
}
// Le modèle précis choisi : celui de l'agent qui parle (0197), sinon celui
// de l'équipe (0193), sinon null pour Auto.
export function modeleChoisi(): string | null {
  const s = suivi.getStore();
  return s?.modeleAgent || s?.modele || null;
}
// L'agent qui va parler (0197) : son modèle passe avant celui de l'équipe.
// À appeler avant chaque génération faite pour un agent précis.
export function pourAgent(modele: string | null | undefined) {
  const s = suivi.getStore();
  if (s) s.modeleAgent = modele || null;
}

// Un coût connu autrement que par la réponse de Gemini (les vecteurs de
// recherche ne rendent pas toujours leurs jetons, 23/09): ajouté à la main.
export function ajouterCout(eur: number) {
  const s = suivi.getStore();
  if (s && Number.isFinite(eur) && eur > 0) s.eur += eur;
}

// ——— Les alertes (proposition 4 de Beau, 24/09, reprise de Jarvis : « un
// budget qui ne coupe jamais en silence ») ———
//
// 1. Un FOURNISSEUR coupe (plafond de Google, solde DeepSeek ou Kimi épuisé) :
//    ce sont les clés de Finjaro, donc c'est Beau qu'on prévient — dans le
//    salon Direction de l'entreprise Finjaro de Léo, une fois par jour et par
//    fournisseur.
// 2. Une entreprise atteint 80 % de SON plafond du mois : elle est prévenue
//    dans son salon Direction, une fois par mois.
// Le dédoublonnage passe par legion_cache (plusieurs instances tournent).
const PLATEFORME = '44bb201b-6787-4de0-8f7f-f9145d5c03e7'; // l'entreprise Finjaro dans Léo
const dejaDit = new Set<string>();

async function uneFois(cle: string, jours: number): Promise<boolean> {
  if (dejaDit.has(cle)) return false;
  dejaDit.add(cle);
  const db = service();
  const { data } = await db.from('legion_cache').select('cle').eq('cle', cle).maybeSingle();
  if (data) return false;
  const { error } = await db.from('legion_cache').insert({ cle, fonction: 'alerte', valeur: {}, expire_le: new Date(Date.now() + jours * 86_400_000).toISOString() });
  return !error;
}

async function direDansDirection(entrepriseId: string, texte: string, meta: Record<string, unknown>) {
  const db = service();
  const [{ data: salons }, { data: agents }] = await Promise.all([
    db.from('legion_canaux').select('id, nom, prive_entre').eq('entreprise_id', entrepriseId).order('ordre'),
    db.from('legion_agents').select('id, nom, est_directeur, actif').eq('entreprise_id', entrepriseId).is('user_id', null).neq('moteur', 'claude-code').order('ordre'),
  ]);
  const publics = (salons || []).filter((c: { prive_entre: string[] | null }) => !c.prive_entre?.length);
  const salon = publics.find((c: { nom: string }) => /direction/i.test(c.nom)) || publics[0];
  const auteur = (agents || []).find((a: { nom: string; actif: boolean }) => a.actif && /orchestre/i.test(a.nom))
    || (agents || []).find((a: { est_directeur: boolean; actif: boolean }) => a.est_directeur && a.actif) || (agents || [])[0];
  if (!salon || !auteur) return;
  const { error } = await db.from('legion_messages').insert({
    entreprise_id: entrepriseId, canal_id: salon.id, auteur_id: auteur.id, user_id: null, texte, genre: 'info',
    meta: { par_ia: true, sans_reponse: true, ...meta },
  });
  if (error) console.error('alerte:', error.message);
}

export async function signalerCoupure(fournisseur: string, raison: string, lien: string) {
  try {
    const jour = new Date().toISOString().slice(0, 10);
    if (!(await uneFois(`alerte:coupure:${fournisseur}:${jour}`, 2))) return;
    await direDansDirection(PLATEFORME,
      `⚠️ ${fournisseur} a coupé : ${raison}.\n\nLes agents continuent avec les autres moteurs quand il y en a (DeepSeek d'abord). Ce qui dépend encore de lui peut s'arrêter : chez Google, les photos des agents, la mémoire, la recherche dans les documents et sur Internet.\n\nPour relever : ${lien}`,
      { alerte: { type: 'coupure', fournisseur } });
  } catch (e) { console.error('alerte coupure:', (e as Error).message); }
}

async function signalerSeuil(entrepriseId: string, depense: number, plafond: number) {
  try {
    const mois = new Date().toISOString().slice(0, 7);
    if (!(await uneFois(`alerte:seuil80:${entrepriseId}:${mois}`, 40))) return;
    const pct = Math.round((depense / plafond) * 100);
    await direDansDirection(entrepriseId,
      `La dépense de l'équipe ce mois-ci atteint ${pct} % du plafond (${depense.toFixed(2)} € sur ${plafond} €). Au plafond, les agents s'arrêtent jusqu'au mois suivant. Tu peux le relever dans « Ce que Léo coûte », ou choisir un modèle moins cher.`,
      { alerte: { type: 'seuil', pct } });
  } catch (e) { console.error('alerte seuil:', (e as Error).message); }
}
