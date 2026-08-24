// Un identifiant unique pour nommer un fichier envoyé.
//
// `crypto.randomUUID()` n'existe PAS partout: il faut Safari 15.4 (mars 2022),
// Chrome 92, Firefox 95 — et il manque dans plusieurs navigateurs intégrés,
// notamment celui de WhatsApp et de Facebook, par lesquels une bonne partie
// des vendeuses ouvrent Finjaro.
//
// Or il était appelé dans TOUS les chemins d'envoi de l'application: photos
// d'article, ajout en masse, boutique, vidéos, messagerie. Quand il manque,
// l'appel lève une exception AVANT le moindre octet envoyé — et comme
// l'erreur était avalée, la personne ne lisait que « les photos n'ont pas pu
// être envoyées », sans jamais savoir pourquoi. Une vendeuse inscrite le
// 07/08 n'avait toujours, dix-sept jours plus tard, réussi aucun envoi.
//
// Le repli tire de vrais octets aléatoires quand c'est possible; `Math.random`
// n'est là que pour les navigateurs qui n'ont même pas `getRandomValues`.
// L'identifiant ne sert qu'à ne pas écraser un fichier voisin: il n'a besoin
// d'être ni secret ni conforme à la norme UUID.
export function uid() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const o = crypto.getRandomValues(new Uint8Array(16));
      // Version 4 et variante, pour rester lisible comme un UUID.
      o[6] = (o[6] & 0x0f) | 0x40;
      o[8] = (o[8] & 0x3f) | 0x80;
      const h = [...o].map((b) => b.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
  } catch { /* on retombe sur le dernier repli */ }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}
