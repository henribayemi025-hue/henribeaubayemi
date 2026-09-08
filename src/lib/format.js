// La console admin est un déploiement Cloudflare Worker à part
// (admin.finjaro.net) dont le routeur ne connaît que l'accueil et l'auth —
// un lien relatif comme /boutique/slug y retombe silencieusement sur le
// tableau de bord au lieu d'ouvrir la fiche. Trouvé en audit du 08/09.
export const SITE_URL = 'https://finjaro.net';

// Relative/short timestamp formatting for chat, inbox, orders.
export function timeAgo(iso, locale = 'fr') {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  const hr = Math.round(diff / 3600000);
  const day = Math.round(diff / 86400000);
  const fr = locale === 'fr';
  if (min < 1) return fr ? "à l'instant" : 'just now';
  if (min < 60) return `${min} min`;
  if (hr < 24) return fr ? `il y a ${hr} h` : `${hr}h ago`;
  if (day < 7) return fr ? `il y a ${day} j` : `${day}d ago`;
  return new Date(iso).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
}

export function clockTime(iso, locale = 'fr') {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
