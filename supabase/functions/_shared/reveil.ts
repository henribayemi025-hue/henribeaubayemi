// Le réveil libre d'un agent (lot 2.3, 25/09).
//
// Beau : « pas d'heures fixes ; chaque agent sent quand travailler, a son
// agenda, décide lui-même, parfois soudainement — humanisé ». Toutes les
// quinze minutes, chaque agent passe par ici et décide seul : il travaille,
// il attend, il fait une pause, sa journée est finie, il dort. La décision
// est PURE (rien n'est lu ni écrit) : les mêmes entrées donnent toujours la
// même réponse, ce qui se teste (reveil.test.ts) et s'explique au fondateur
// en une phrase.
//
// Le rythme propre de chaque agent se tire de son identifiant (stable) et de
// sa personnalité : un « matinal » commence vers 6 h, un « couche-tard »
// finit vers 22 h ; les autres entre les deux. Les garde-fous restent ceux
// de la base : jamais deux livrables à moins de deux heures sauf urgence,
// le plafond de dépense, pas plus de neuf agents en même temps.

export type TacheReveil = { id: string; priorite?: string | null; created_at: string; assigne_a?: string | null; livre_le?: string | null };
export type AgentReveil = { id: string; nom?: string; personnalite?: string | null; est_directeur?: boolean; dernier_livrable_le?: string | null };
export type ContexteReveil = {
  heure_locale: number;            // 0–23, à l'heure de l'entreprise
  jour: number;                    // 0 = dimanche … 6 = samedi
  taches: TacheReveil[];           // les tâches ouvertes de l'entreprise
  reunions_a_venir?: string[];     // ISO, dans les prochaines heures
  depense_mois_eur?: number;
  plafond_mois_eur?: number | null;
  agents_deja_au_travail?: number;
};
export type Decision = { travaille: boolean; etat: 'travaille' | 'attend' | 'pause' | 'fin_de_journee' | 'dort'; raison: string };

export const MAX_AU_TRAVAIL = 9;
const DEUX_HEURES = 2 * 3_600_000;
const QUARANTE_CINQ_MIN = 45 * 60_000;

// Un nombre stable entre 0 et 1, tiré d'une chaîne (l'identifiant de l'agent,
// éventuellement l'heure) : le « hasard » d'un agent est le même à chaque
// réveil, donc reproductible et testable.
export function graine(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i += 1) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10_000) / 10_000;
}

// Ses heures : [début, fin[ à l'heure locale. Matinal : 6–15 ; couche-tard :
// 13–22 ; sinon un début entre 7 et 10 tiré de son identifiant, neuf heures
// de journée. Les directeurs commencent une heure plus tôt.
export function heuresDe(a: AgentReveil): { debut: number; fin: number; style: string } {
  const p = (a.personnalite || '').toLowerCase();
  if (/matinal|aube|t[oô]t le matin|lève-t[oô]t|early bird|early riser|morning person/.test(p)) return { debut: 6, fin: 15, style: 'matinal' };
  if (/couche-tard|nuit|tard le soir|noctambule|night owl|late night|late at night/.test(p)) return { debut: 13, fin: 22, style: 'tardif' };
  const debut = 7 + Math.floor(graine(a.id) * 4) - (a.est_directeur ? 1 : 0); // 6 à 10
  return { debut, fin: debut + 9, style: 'ordinaire' };
}

const urgente = (t: TacheReveil) => t.priorite === 'urgente';
const haute = (t: TacheReveil) => t.priorite === 'haute';
const age = (t: TacheReveil, maintenant: Date) => maintenant.getTime() - Date.parse(t.created_at);

export function decideReveil(a: AgentReveil, c: ContexteReveil, maintenant: Date): Decision {
  const miennes = c.taches.filter((t) => t.assigne_a === a.id && !t.livre_le);
  const { debut, fin, style } = heuresDe(a);
  const h = ((c.heure_locale % 24) + 24) % 24;
  const dansSesHeures = h >= debut && h < fin;
  const plusUrgente = miennes.find(urgente) || miennes.find(haute);

  if (!miennes.length) {
    if (h < debut || h >= fin) return { travaille: false, etat: h >= 23 || h < 6 ? 'dort' : 'fin_de_journee', raison: 'Rien à faire, en dehors de ses heures.' };
    return { travaille: false, etat: 'attend', raison: 'Aucune tâche ouverte : disponible.' };
  }
  // Le plafond de dépense reste la barrière, même pour l'urgent.
  if (c.plafond_mois_eur != null && c.plafond_mois_eur > 0 && (c.depense_mois_eur || 0) >= c.plafond_mois_eur) {
    return { travaille: false, etat: 'attend', raison: 'Plafond du mois atteint : attend qu\'il soit relevé.' };
  }
  // Pas plus de neuf en même temps : les autres attendent leur tour.
  if ((c.agents_deja_au_travail || 0) >= MAX_AU_TRAVAIL && !plusUrgente) {
    return { travaille: false, etat: 'attend', raison: 'Neuf collègues déjà au travail : attend son tour.' };
  }
  // Jamais deux livrables à moins de deux heures (45 minutes si urgent).
  const depuis = a.dernier_livrable_le ? maintenant.getTime() - Date.parse(a.dernier_livrable_le) : Infinity;
  if (depuis < (plusUrgente && urgente(plusUrgente) ? QUARANTE_CINQ_MIN : DEUX_HEURES)) {
    return { travaille: false, etat: 'pause', raison: `Vient de rendre un livrable (il y a ${Math.max(1, Math.round(depuis / 60_000))} min) : souffle.` };
  }
  // Une réunion dans le quart d'heure : on n'ouvre pas un chantier.
  const reunionProche = (c.reunions_a_venir || []).some((iso) => { const d = Date.parse(iso) - maintenant.getTime(); return d >= 0 && d < 15 * 60_000; });
  if (reunionProche && !plusUrgente) return { travaille: false, etat: 'attend', raison: 'Réunion dans un quart d\'heure : attend.' };
  // Le dimanche, seulement l'urgent.
  if (c.jour === 0 && !(plusUrgente && urgente(plusUrgente))) return { travaille: false, etat: 'fin_de_journee', raison: 'Dimanche : seul l\'urgent le réveille.' };
  // L'urgent le réveille à toute heure ; le haut, jusqu'à 23 h.
  if (plusUrgente && urgente(plusUrgente)) return { travaille: true, etat: 'travaille', raison: 'Une tâche urgente : il s\'y met tout de suite.' };
  if (plusUrgente && haute(plusUrgente) && h >= 6 && h < 23) return { travaille: true, etat: 'travaille', raison: 'Une tâche prioritaire : il s\'y met.' };
  if (dansSesHeures) {
    const laPlusVieille = Math.max(...miennes.map((t) => age(t, maintenant)));
    return { travaille: true, etat: 'travaille', raison: laPlusVieille > 24 * 3_600_000 ? 'Une tâche attend depuis plus d\'un jour : il s\'y met.' : `Dans ses heures (${style}, ${debut} h–${fin} h) : il prend sa tâche.` };
  }
  // Hors de ses heures : une tâche de plus de douze heures peut le réveiller —
  // une chance sur dix, tirée de son identifiant et de l'heure, donc reproductible.
  const vieille = miennes.some((t) => age(t, maintenant) > 12 * 3_600_000);
  if (vieille && h >= 6 && h < 23 && graine(`${a.id}:${maintenant.toISOString().slice(0, 13)}`) < 0.1) {
    return { travaille: true, etat: 'travaille', raison: 'Hors de ses heures, mais une tâche traîne depuis douze heures : il s\'y met soudainement.' };
  }
  return { travaille: false, etat: h >= 23 || h < 6 ? 'dort' : 'fin_de_journee', raison: `Hors de ses heures (${debut} h–${fin} h) : reprend demain.` };
}

// Le décalage horaire (heures) d'un marché — code pays ISO à deux lettres —
// par rapport à UTC, sans l'heure d'été : assez pour savoir si c'est le
// matin ou la nuit chez eux. Inconnu ou vide → UTC.
const FUSEAUX: Record<string, number> = {
  CM: 1, GA: 1, CG: 1, CD: 1, TD: 1, CF: 1, NG: 1, BJ: 1, NE: 1, DZ: 1, TN: 1, AO: 1,
  SN: 0, CI: 0, ML: 0, BF: 0, GH: 0, GN: 0, TG: 0, MA: 0, MR: 0, LR: 0, SL: 0, GM: 0, PT: 0, GB: 0, IE: 0, IS: 0,
  FR: 1, BE: 1, CH: 1, DE: 1, ES: 1, IT: 1, NL: 1, LU: 1, AT: 1, PL: 1, SE: 1, NO: 1, DK: 1, CZ: 1, HU: 1,
  GR: 2, RO: 2, FI: 2, EG: 2, ZA: 2, RW: 2, BI: 2, ZM: 2, ZW: 2, MZ: 2, IL: 2, LB: 2, UA: 2,
  KE: 3, TZ: 3, UG: 3, ET: 3, MG: 3, SA: 3, TR: 3, QA: 3, RU: 3, AE: 4, MU: 4, PK: 5, IN: 5.5, BD: 6, TH: 7, VN: 7, ID: 7,
  CN: 8, SG: 8, MY: 8, PH: 8, HK: 8, AU: 10, JP: 9, KR: 9, NZ: 12,
  BR: -3, AR: -3, CL: -4, CA: -5, US: -5, MX: -6, CO: -5, PE: -5, HT: -5, DO: -4, GP: -4, MQ: -4,
};
export function fuseauDe(marche: string | null | undefined): number {
  const code = String(marche || '').trim().toUpperCase().slice(0, 2);
  return FUSEAUX[code] ?? 0;
}
export function heureLocale(maintenant: Date, marche: string | null | undefined): { heure: number; jour: number } {
  const local = new Date(maintenant.getTime() + fuseauDe(marche) * 3_600_000);
  return { heure: local.getUTCHours(), jour: local.getUTCDay() };
}
