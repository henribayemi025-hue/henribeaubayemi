// D'OÙ VIENNENT LES VISITEURS (Beau, 02/10 : « il faut qu'on cherche les
// clients »). Sur 3 000 personnes en 30 jours, presque toutes « directes » :
// un lien ouvert depuis WhatsApp ou TikTok n'envoie pas de site d'origine.
// Les liens qu'on partage portent donc une étiquette — ?src=whatsapp,
// ?src=statut, ?src=tiktok, ou les utm_* classiques — retenue pour la visite
// puis jointe à chaque événement (visite, fiche vue, panier, commande).
// Rien de personnel : un mot court, choisi par nous.

const CLE_PREMIERE = 'finjaro-origine';
const CLE_SESSION = 'finjaro-origine-session';
const TRENTE_JOURS = 30 * 86_400_000;

const propre = (v) => {
  const s = String(v || '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return s || null;
};

export function lireOrigine(search = '') {
  const p = new URLSearchParams(search);
  const src = propre(p.get('src') || p.get('utm_source'));
  if (!src) return null;
  const o = { src };
  const medium = propre(p.get('utm_medium'));
  const campagne = propre(p.get('utm_campaign'));
  if (medium) o.medium = medium;
  if (campagne) o.campagne = campagne;
  return o;
}

// À l'arrivée : l'étiquette du lien vaut pour la visite (dernier lien
// cliqué) ; la toute première est gardée 30 jours, pour qu'une commande
// passée trois jours plus tard soit encore rattachée au canal qui a amené
// la personne.
export function retenirOrigine(search = typeof window !== 'undefined' ? window.location.search : '', maintenant = Date.now()) {
  const o = lireOrigine(search);
  if (!o) return origine(maintenant);
  try { sessionStorage.setItem(CLE_SESSION, JSON.stringify(o)); } catch { /* stockage indisponible */ }
  try {
    const avant = JSON.parse(localStorage.getItem(CLE_PREMIERE) || 'null');
    if (!avant || !(maintenant - Number(avant.le) < TRENTE_JOURS)) localStorage.setItem(CLE_PREMIERE, JSON.stringify({ ...o, le: maintenant }));
  } catch { /* stockage indisponible */ }
  return o;
}

// L'origine à joindre aux événements : celle de la visite, sinon la première
// des 30 derniers jours, sinon rien.
export function origine(maintenant = Date.now()) {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLE_SESSION) || 'null');
    if (s?.src) return s;
  } catch { /* stockage indisponible */ }
  try {
    const p = JSON.parse(localStorage.getItem(CLE_PREMIERE) || 'null');
    if (p?.src && maintenant - Number(p.le) < TRENTE_JOURS) {
      const { le: _le, ...o } = p;
      return { ...o, premiere: true };
    }
  } catch { /* stockage indisponible */ }
  return null;
}

// Ajoute l'étiquette à un lien qu'on partage (statut WhatsApp, partage de
// boutique), sans abîmer un lien qui en porte déjà une.
export function avecOrigine(url, src) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('src') && !u.searchParams.has('utm_source')) u.searchParams.set('src', propre(src) || 'partage');
    return u.toString();
  } catch {
    return url;
  }
}
