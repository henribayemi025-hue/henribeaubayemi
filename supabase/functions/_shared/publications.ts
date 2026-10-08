// LEO — l'équipe réseaux sociaux (08/10). Ce que l'agent écrit pour la
// mission « Semaine de publications », remis en lignes propres pour la table
// legion_publications (0240). Aucun accès réseau ici : tout se teste.
//
// Beau, 08/10 : « ce n'est pas pour nous, c'est pour toute personne ». Rien
// n'est propre à Finjaro, sauf une chose : chez Finjaro, un brief vidéo part à
// Claude, qui produit la vidéo et la soumet à Beau. Ailleurs, c'est un brief à
// filmer — les agents ne savent pas encore fabriquer de vidéo (aucune API).

export const CLE_MISSION_RESEAUX = 'reseaux-sociaux';

// Les entreprises dont les briefs vidéo arrivent à Claude (celle de Beau).
export const PRODUCTION_CLAUDE = new Set(['44bb201b-6787-4de0-8f7f-f9145d5c03e7']);

export const SCHEMA_PUBLICATION = {
  type: 'OBJECT',
  properties: {
    jour: { type: 'INTEGER' },
    plateforme: { type: 'STRING' },
    format: { type: 'STRING', enum: ['video_courte', 'carrousel', 'image', 'texte', 'statut'] },
    accroche: { type: 'STRING' },
    legende: { type: 'STRING' },
    visuel: { type: 'STRING' },
    appel_action: { type: 'STRING' },
    pourquoi: { type: 'STRING' },
    video: {
      type: 'OBJECT',
      properties: {
        duree_s: { type: 'INTEGER' },
        voix_off: { type: 'STRING' },
        musique: { type: 'STRING' },
        plans: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { secondes: { type: 'STRING' }, image: { type: 'STRING' }, texte_ecran: { type: 'STRING' } },
            required: ['secondes', 'image'],
          },
        },
      },
    },
  },
  required: ['jour', 'plateforme', 'format', 'accroche', 'legende', 'visuel', 'appel_action', 'pourquoi'],
};

export type Plan = { secondes: string; image: string; texte_ecran?: string };
export type Video = { duree_s?: number; voix_off?: string; musique?: string; plans: Plan[] };
export type LignePublication = {
  entreprise_id: string;
  tache_id: string | null;
  livrable_id: string | null;
  auteur_id: string | null;
  semaine: string;
  jour: number;
  plateforme: string;
  format: string;
  accroche: string;
  legende: string;
  visuel: string | null;
  appel_action: string | null;
  pourquoi: string | null;
  video: Video | null;
  statut: 'proposee';
  video_statut: 'aucune' | 'brief' | 'a_produire';
};

// Le lundi de la semaine de `d` (UTC), en AAAA-MM-JJ. Une mission posée un
// dimanche prépare la semaine qui commence le lendemain.
export function lundiDe(d: Date = new Date()): string {
  const j = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const jour = j.getUTCDay(); // 0 = dimanche
  j.setUTCDate(j.getUTCDate() + (jour === 0 ? 1 : 1 - jour));
  return j.toISOString().slice(0, 10);
}

const FORMATS = new Set(['video_courte', 'carrousel', 'image', 'texte', 'statut']);
function format(f: unknown): string {
  const s = String(f || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  if (FORMATS.has(s)) return s;
  if (/vid|reel|short|tiktok/.test(s)) return 'video_courte';
  if (/carrou|carous/.test(s)) return 'carrousel';
  if (/statu|story|storie/.test(s)) return 'statut';
  if (/image|photo|visuel|post/.test(s)) return 'image';
  return 'texte';
}

const coupe = (v: unknown, max: number) => {
  const s = String(v ?? '').replace(/\s+\n/g, '\n').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};
const ouNul = (v: unknown, max: number) => { const s = coupe(v, max); return s ? s : null; };

function video(v: unknown): Video | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const plans = (Array.isArray(o.plans) ? o.plans : [])
    .map((p) => (p && typeof p === 'object' ? p as Record<string, unknown> : null))
    .filter((p): p is Record<string, unknown> => !!p && String(p.image || '').trim().length > 2)
    .slice(0, 12)
    .map((p) => ({ secondes: coupe(p.secondes, 20) || '?', image: coupe(p.image, 300), ...(String(p.texte_ecran || '').trim() ? { texte_ecran: coupe(p.texte_ecran, 120) } : {}) }));
  if (!plans.length) return null;
  const duree = Number(o.duree_s);
  return {
    ...(Number.isFinite(duree) && duree > 0 ? { duree_s: Math.min(180, Math.round(duree)) } : {}),
    ...(String(o.voix_off || '').trim() ? { voix_off: coupe(o.voix_off, 1200) } : {}),
    ...(String(o.musique || '').trim() ? { musique: coupe(o.musique, 200) } : {}),
    plans,
  };
}

/**
 * Les publications rendues par l'agent → lignes à insérer. Une publication sans
 * accroche ou sans légende est laissée de côté ; sept au plus ; un jour hors de
 * 1 à 7 prend la place libre suivante. Une vidéo sans plan devient une image
 * (rien à filmer).
 */
export function normaliserPublications(brut: unknown, ctx: { entrepriseId: string; tacheId?: string | null; livrableId?: string | null; auteurId?: string | null; maintenant?: Date }): LignePublication[] {
  const liste = Array.isArray(brut) ? brut : [];
  const semaine = lundiDe(ctx.maintenant ?? new Date());
  const pris = new Set<number>();
  const lignes: LignePublication[] = [];
  for (const x of liste) {
    if (lignes.length >= 7) break;
    if (!x || typeof x !== 'object') continue;
    const p = x as Record<string, unknown>;
    const accroche = coupe(p.accroche, 400);
    const legende = coupe(p.legende, 3000);
    if (accroche.length < 3 || legende.length < 3) continue;
    let jour = Math.round(Number(p.jour));
    if (!(jour >= 1 && jour <= 7) || pris.has(jour)) jour = [1, 2, 3, 4, 5, 6, 7].find((j) => !pris.has(j)) ?? 7;
    pris.add(jour);
    let f = format(p.format);
    const v = f === 'video_courte' ? video(p.video) : null;
    if (f === 'video_courte' && !v) f = 'image';
    lignes.push({
      entreprise_id: ctx.entrepriseId,
      tache_id: ctx.tacheId ?? null,
      livrable_id: ctx.livrableId ?? null,
      auteur_id: ctx.auteurId ?? null,
      semaine,
      jour,
      plateforme: coupe(p.plateforme, 40) || 'Instagram',
      format: f,
      accroche,
      legende,
      visuel: ouNul(p.visuel, 1500),
      appel_action: ouNul(p.appel_action, 300),
      pourquoi: ouNul(p.pourquoi, 600),
      video: v,
      statut: 'proposee',
      video_statut: v ? (PRODUCTION_CLAUDE.has(ctx.entrepriseId) ? 'a_produire' : 'brief') : 'aucune',
    });
  }
  return lignes.sort((a, b) => a.jour - b.jour);
}

// La ligne ajoutée au livrable : ce qui attend une décision humaine.
export function resumePublications(lignes: LignePublication[], anglais = false): string {
  if (!lignes.length) return '';
  const videos = lignes.filter((l) => l.video).length;
  const claude = lignes.some((l) => l.video_statut === 'a_produire');
  if (anglais) {
    return `**${lignes.length} posts are waiting for your approval** in Leo, under « Social media » on the home page. Nothing is published without you.${videos ? ` ${videos} video brief${videos > 1 ? 's' : ''}${claude ? ', sent to Claude for production' : ', ready to film'}.` : ''}`;
  }
  return `**${lignes.length} publication${lignes.length > 1 ? 's' : ''} attend${lignes.length > 1 ? 'ent' : ''} votre accord** dans Léo, rubrique « Réseaux sociaux » de l'accueil. Rien n'est publié sans vous.${videos ? ` ${videos} brief${videos > 1 ? 's' : ''} vidéo${claude ? ', transmis à Claude pour la production' : ', prêt' + (videos > 1 ? 's' : '') + ' à filmer'}.` : ''}`;
}
