// Les liens qu'un agent cite sans les avoir ouverts (09/10) : Radar a livré une liste
// d'événements avec une adresse Eventbrite finissant par « 123456789 », jamais lue.
// Règle de la maison : aucun lien qu'on n'a pas lu. Le livrable n'est pas bloqué, mais
// chaque lien non ouvert pendant le travail est signalé sous le texte, pour la relecture.
const URL_RE = /https?:\/\/[^\s)\]>"'«»<]+/g;
// Nos propres adresses ne demandent pas d'être « ouvertes » pour être citées.
const MAISON = /(^|\.)finjaro\.(net|workers\.dev)$/;

export function cleLien(u: string): string {
  try {
    const x = new URL(u.replace(/[.,;:!?*]+$/, ''));
    return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch { return ''; }
}

export function liensDuTexte(texte: string): string[] {
  return [...new Set((String(texte || '').match(URL_RE) || []).map((u) => u.replace(/[.,;:!?*]+$/, '')))];
}

// `vus` : les adresses des pages trouvées ou ouvertes (sources de la recherche, résultats
// de lire_page et de chercher_web, tels quels : les adresses y sont retrouvées).
export function liensNonOuverts(texte: string, vus: string[]): string[] {
  const connus = new Set<string>();
  for (const v of vus) for (const u of liensDuTexte(v)) { const k = cleLien(u); if (k) connus.add(k); }
  const hotes = new Set([...connus].map((k) => k.split('/')[0]));
  return liensDuTexte(texte).filter((u) => {
    const k = cleLien(u);
    if (!k) return false;
    const [hote, ...chemin] = k.split('/');
    if (MAISON.test(hote)) return false;
    if (connus.has(k)) return false;
    // La page d'accueil d'un site dont on a lu une page : admise.
    if (!chemin.join('/') && hotes.has(hote)) return false;
    return true;
  });
}
