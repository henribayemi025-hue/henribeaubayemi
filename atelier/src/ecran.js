// « voir_ecran » : ouvrir une page PUBLIQUE dans un vrai navigateur
// (Cloudflare Browser Rendering) et rendre ce qu'une personne y VOIT — le
// texte affiché après le JavaScript, et une capture.
//
// Rigo, 25/09 : « une porte dont la preuve est l'écran à son adresse, je ne
// peux pas la tenir ». Le site est une application : sans navigateur, une
// lecture de la page ne rend qu'une coquille vide. Pour tous les agents de
// toutes les entreprises de Léo (pages publiques seulement : pas de compte,
// pas de mot de passe, rien de saisi, aucun clic).

import puppeteer from '@cloudflare/puppeteer';

const INTERDITS = [/^localhost$/i, /\.local$/i, /\.internal$/i, /^metadata\./i, /^finjaro-atelier\./i];
export const LARGEURS = { telephone: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 }, ordinateur: { width: 1440, height: 900 } };

export function ecranPermis(brut) {
  let u;
  try { u = new URL(String(brut || '').trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
  const h = u.hostname;
  if (/^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.')) return null;
  if (INTERDITS.some((r) => r.test(h))) return null;
  return u;
}

export async function voirEcran(env, brut, largeur = 'telephone') {
  const u = ecranPermis(brut);
  if (!u) return { erreur: 'adresse refusée : une page publique en https, sans adresse IP ni réseau interne' };
  if (!env.BROWSER) return { erreur: 'le navigateur n\'est pas branché sur ce Worker' };
  const vue = LARGEURS[largeur] || LARGEURS.telephone;
  const navigateur = await puppeteer.launch(env.BROWSER);
  try {
    const page = await navigateur.newPage();
    await page.setViewport(vue);
    // Le site Finjaro : pas d'écrans d'accueil ni de bandeau cookies devant la page.
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('finjaro:intro-seen', '1'); localStorage.setItem('finjaro:cookies', 'refuse'); } catch { /* rien */ }
    });
    const reponse = await page.goto(u.toString(), { waitUntil: 'networkidle0', timeout: 25_000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1200));
    const finale = page.url();
    if (!ecranPermis(finale)) return { erreur: 'la page a renvoyé vers une adresse refusée' };
    const titre = await page.title();
    const texte = String(await page.evaluate(() => document.body?.innerText || '')).replace(/\n{3,}/g, '\n\n').trim();
    const capture = await page.screenshot({ type: 'jpeg', quality: 55, encoding: 'base64' });
    return {
      adresse: finale, statut: reponse?.status() ?? null, largeur: `${vue.width} px`, titre,
      vu_le: new Date().toISOString(), longueur: texte.length, texte: texte.slice(0, 12_000), capture_jpeg_base64: capture,
    };
  } finally {
    await navigateur.close().catch(() => {});
  }
}
