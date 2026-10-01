// Le statut WhatsApp du jour d'une vendeuse (idée 1 du 01/10).
//
// Constat du 29/09 (comptes de test exclus) : 216 personnes sont passées sur
// Finjaro sans compte, 25 ont ouvert un article, aucune n'a commandé. Les
// acheteuses qui commandent viennent du réseau de la vendeuse, pas de nous.
// D'où une image prête à poster en statut : trois de SES articles, avec leur
// prix dans la monnaie de SA boutique (CLAUDE.md §2), et le lien de sa
// boutique.
//
// Tout est dessiné dans le navigateur, sur un canevas 1080 × 1920 (le format
// d'un statut) : rien en base, rien envoyé par Finjaro. C'est la vendeuse qui
// partage, de son téléphone.

import { storageUrl } from './supabase';
import { currencyForCountry, formatPrice } from './currency';

export const LARGEUR = 1080;
export const HAUTEUR = 1920;

const CREME = '#FAF6F0';
const ENCRE = '#171B26';
const TERRACOTTA = '#C25E38';
const LAITON = '#E09F3E';
const GRIS = '#6B6F7A';

// Trois articles qui changent chaque jour : on tourne dans les douze plus
// récents qui ont une photo, en commençant à un rang qui dépend de la date.
// Deux jours de suite ne donnent pas la même image, sans tirage au hasard
// (la même vendeuse revoit la même image si elle rouvre l'écran le même jour).
export function choisirArticles(articles, date = new Date()) {
  const avecPhoto = (articles || []).filter((a) => a?.images?.[0]).slice(0, 12);
  if (avecPhoto.length <= 3) return avecPhoto;
  const jour = Math.floor(date.getTime() / 864e5);
  const depart = (jour * 3) % avecPhoto.length;
  return [0, 1, 2].map((i) => avecPhoto[(depart + i) % avecPhoto.length]);
}

// Le prix tel que la vendeuse l'a saisi : dans la monnaie de sa boutique.
// Sans pays connu, on n'invente pas de monnaie (CLAUDE.md §1) : pas de prix.
export function prixAffiche(article, pays, langue = 'fr') {
  if (!article || article.price_on_request || !article.price_fcfa) return null;
  if (!pays) return null;
  return formatPrice(article.price_fcfa, currencyForCountry(pays), langue);
}

export function lienBoutique(slug) {
  return `finjaro.net/boutique/${slug}`;
}

function chargerImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    // En production les photos passent par /img (même origine) ; ailleurs
    // Supabase répond avec CORS ouvert. Sans ça le canevas serait « sali »
    // et toBlob échouerait.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Recadre l'image pour remplir le cadre, centrée — comme object-fit: cover.
function dessinerCouvrant(ctx, img, x, y, l, h) {
  const r = Math.max(l / img.width, h / img.height);
  const sl = l / r;
  const sh = h / r;
  ctx.drawImage(img, (img.width - sl) / 2, (img.height - sh) / 2, sl, sh, x, y, l, h);
}

function arrondi(ctx, x, y, l, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

// Coupe un texte trop long avec « … » pour qu'il tienne dans `max` pixels.
function tronquer(ctx, texte, max) {
  if (ctx.measureText(texte).width <= max) return texte;
  let t = texte;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

/**
 * Dessine le statut et renvoie un Blob PNG.
 * `textes` vient de i18n (titre, invitation, prixSurDemande), pour que l'image
 * parle la langue de la vendeuse.
 */
export async function dessinerStatut({ shop, articles, langue = 'fr', textes }) {
  const canvas = document.createElement('canvas');
  canvas.width = LARGEUR;
  canvas.height = HAUTEUR;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = CREME;
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

  // Filet laiton en double, le cadre « vintage » de la marque.
  ctx.strokeStyle = LAITON;
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, LARGEUR - 72, HAUTEUR - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 54, LARGEUR - 108, HAUTEUR - 108);

  // En-tête : le nom de la boutique en grand titre, la ligne du jour dessous.
  ctx.textAlign = 'center';
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(textes.titre.toUpperCase(), LARGEUR / 2, 170);
  ctx.fillStyle = ENCRE;
  ctx.font = `700 84px ${SERIF}`;
  ctx.fillText(tronquer(ctx, shop.name || '', LARGEUR - 200), LARGEUR / 2, 270);

  const images = await Promise.all(articles.map((a) => chargerImage(storageUrl('products', a.images?.[0]))));

  // Une grande photo, puis deux côte à côte : l'œil a un point d'entrée.
  const marge = 100;
  const cadres = [
    { x: marge, y: 330, l: LARGEUR - 2 * marge, h: 720 },
    { x: marge, y: 1110, l: (LARGEUR - 2 * marge - 30) / 2, h: 470 },
    { x: marge + (LARGEUR - 2 * marge - 30) / 2 + 30, y: 1110, l: (LARGEUR - 2 * marge - 30) / 2, h: 470 },
  ];
  articles.forEach((a, i) => {
    const c = cadres[i];
    if (!c) return;
    ctx.save();
    arrondi(ctx, c.x, c.y, c.l, c.h, 28);
    ctx.clip();
    ctx.fillStyle = '#EDE6DA';
    ctx.fillRect(c.x, c.y, c.l, c.h);
    if (images[i]) dessinerCouvrant(ctx, images[i], c.x, c.y, c.l, c.h);
    ctx.restore();

    // L'étiquette de prix, posée sur la photo, en bas à gauche.
    const prix = prixAffiche(a, shop.country, langue) || (a.price_on_request ? textes.prixSurDemande : null);
    ctx.textAlign = 'left';
    ctx.font = `600 ${i === 0 ? 30 : 26}px ${SANS}`;
    const nom = tronquer(ctx, a.name || '', c.l - 84);
    ctx.font = `700 ${i === 0 ? 44 : 34}px ${SANS}`;
    const largeurPrix = prix ? ctx.measureText(prix).width : 0;
    ctx.font = `600 ${i === 0 ? 30 : 26}px ${SANS}`;
    const largeurNom = ctx.measureText(nom).width;
    const lEtiq = Math.min(c.l - 40, Math.max(largeurNom, largeurPrix) + 44);
    const hEtiq = prix ? (i === 0 ? 120 : 100) : (i === 0 ? 70 : 60);
    const ex = c.x + 20;
    const ey = c.y + c.h - hEtiq - 20;
    ctx.fillStyle = 'rgba(250, 246, 240, 0.94)';
    arrondi(ctx, ex, ey, lEtiq, hEtiq, 18);
    ctx.fill();
    ctx.fillStyle = ENCRE;
    ctx.fillText(nom, ex + 22, ey + (i === 0 ? 46 : 40));
    if (prix) {
      ctx.fillStyle = TERRACOTTA;
      ctx.font = `700 ${i === 0 ? 44 : 34}px ${SANS}`;
      ctx.fillText(prix, ex + 22, ey + (i === 0 ? 100 : 82));
    }
  });

  // Pied : l'invitation et le lien, à recopier ou à toucher.
  ctx.textAlign = 'center';
  ctx.fillStyle = ENCRE;
  ctx.font = `700 52px ${SERIF}`;
  ctx.fillText(textes.invitation, LARGEUR / 2, 1690);
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText(tronquer(ctx, lienBoutique(shop.slug), LARGEUR - 200), LARGEUR / 2, 1760);
  ctx.fillStyle = GRIS;
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText('Finjaro', LARGEUR / 2, 1820);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
