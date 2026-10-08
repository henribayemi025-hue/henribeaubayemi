// « Ma semaine de publications » d'une vendeuse (Beau, 08/10 : l'équipe
// réseaux sociaux, « pour toute personne »). La version Léo fait écrire les
// publications par un agent ; ici, pas d'IA : sept publications prêtes, une
// par jour, faites avec SES articles, SES prix dans la monnaie de SA boutique
// (CLAUDE.md §2) et le lien de sa boutique. Elles changent chaque semaine.
//
// Rien n'est publié par Finjaro et rien n'est enregistré : c'est la vendeuse
// qui partage, de son téléphone. Aucun chiffre, aucun avis, aucune promesse
// de livraison ou de stock n'est écrit à sa place.

import { storageUrl } from './supabase';
import {
  CREME, ENCRE, TERRACOTTA, LAITON, GRIS, SERIF, SANS,
  chargerImage, dessinerCouvrant, arrondi, tronquer, prixAffiche, lienBoutique,
} from './statutDuJour';

// Le format des publications de fil (Instagram, Facebook) : 4:5.
export const LARGEUR_PUB = 1080;
export const HAUTEUR_PUB = 1350;

// Un thème par jour, du lundi au dimanche.
export const THEMES = ['nouveaute', 'coupDeCoeur', 'question', 'detail', 'weekend', 'commander', 'rappel'];

// Le numéro de la semaine depuis l'origine : change chaque lundi, sans hasard.
export function numeroDeSemaine(date = new Date()) {
  const jours = Math.floor(date.getTime() / 864e5);
  return Math.floor((jours + 3) / 7); // le 1er janvier 1970 était un jeudi
}

/**
 * Les sept publications de la semaine : un article avec photo par jour, pris
 * dans ses vingt plus récents en tournant d'une semaine à l'autre. Avec moins
 * de sept articles, ils reviennent dans l'ordre. Sans article photographié,
 * rien.
 */
export function planDeLaSemaine(articles, date = new Date()) {
  const avecPhoto = (articles || []).filter((a) => a?.images?.[0]).slice(0, 20);
  if (!avecPhoto.length) return [];
  const depart = (numeroDeSemaine(date) * 7) % avecPhoto.length;
  return THEMES.map((theme, i) => ({ jour: i + 1, theme, article: avecPhoto[(depart + i) % avecPhoto.length] }));
}

/** Le texte à coller sous la publication, dans la langue de la vendeuse. */
export function texteDuJour(item, { shop, langue = 'fr', lien, t }) {
  const prix = prixAffiche(item.article, shop?.country, langue);
  return t(`semaine.textes.${item.theme}`, {
    article: item.article?.name || '',
    boutique: shop?.name || '',
    prix: prix ? ` — ${prix}` : '',
    lien,
  });
}

/** L'idée de vidéo de la semaine : quatre plans à filmer au téléphone. */
export function ideeVideo(plan, t) {
  const article = plan[0]?.article?.name || '';
  return ['plan1', 'plan2', 'plan3', 'plan4'].map((cle, i) => ({
    secondes: ['0–3 s', '3–8 s', '8–12 s', '12–15 s'][i],
    texte: t(`semaine.video.${cle}`, { article }),
  }));
}

/**
 * L'image du jour (PNG 1080 × 1350) : le nom de la boutique, le thème, la
 * photo de l'article, son nom et son prix, le lien. `textes.theme` est le titre
 * du thème dans la langue de la vendeuse.
 */
export async function dessinerPublication({ shop, item, langue = 'fr', textes }) {
  const canvas = document.createElement('canvas');
  canvas.width = LARGEUR_PUB;
  canvas.height = HAUTEUR_PUB;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = CREME;
  ctx.fillRect(0, 0, LARGEUR_PUB, HAUTEUR_PUB);
  ctx.strokeStyle = LAITON;
  ctx.lineWidth = 6;
  ctx.strokeRect(32, 32, LARGEUR_PUB - 64, HAUTEUR_PUB - 64);
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, LARGEUR_PUB - 96, HAUTEUR_PUB - 96);

  ctx.textAlign = 'center';
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText(tronquer(ctx, (textes.theme || '').toUpperCase(), LARGEUR_PUB - 200), LARGEUR_PUB / 2, 132);
  ctx.fillStyle = ENCRE;
  ctx.font = `700 64px ${SERIF}`;
  ctx.fillText(tronquer(ctx, shop?.name || '', LARGEUR_PUB - 200), LARGEUR_PUB / 2, 212);

  const cadre = { x: 96, y: 262, l: LARGEUR_PUB - 192, h: 790 };
  const img = await chargerImage(storageUrl('products', item.article?.images?.[0]));
  ctx.save();
  arrondi(ctx, cadre.x, cadre.y, cadre.l, cadre.h, 28);
  ctx.clip();
  ctx.fillStyle = '#EDE6DA';
  ctx.fillRect(cadre.x, cadre.y, cadre.l, cadre.h);
  if (img) dessinerCouvrant(ctx, img, cadre.x, cadre.y, cadre.l, cadre.h);
  ctx.restore();

  // Le nom et le prix sous la photo, centrés.
  const prix = prixAffiche(item.article, shop?.country, langue) || (item.article?.price_on_request ? textes.prixSurDemande : null);
  ctx.fillStyle = ENCRE;
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(tronquer(ctx, item.article?.name || '', LARGEUR_PUB - 220), LARGEUR_PUB / 2, 1118);
  if (prix) {
    ctx.fillStyle = TERRACOTTA;
    ctx.font = `700 52px ${SANS}`;
    ctx.fillText(tronquer(ctx, prix, LARGEUR_PUB - 220), LARGEUR_PUB / 2, 1188);
  }
  ctx.fillStyle = GRIS;
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText(tronquer(ctx, lienBoutique(shop?.slug || ''), LARGEUR_PUB - 220), LARGEUR_PUB / 2, prix ? 1252 : 1200);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
