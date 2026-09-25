// Le ciel de la Ville (Beau, 25/09) : « si c'est le matin dans mon pays, ça
// met le jour, le ciel avec la température… il fait chaud : pense à boire de
// l'eau ». L'heure et la météo réelles de là où se trouve la personne.
//
// Où ? Le fuseau horaire du téléphone (« Africa/Douala » → Douala), jamais la
// langue du système (un téléphone réglé en fr-FR n'est pas à Paris), et la
// personne peut choisir sa ville. Rien n'est demandé au GPS.
// Météo : Open-Meteo (sans clé ; données CC BY 4.0). Gardée 30 min dans le
// navigateur : une personne = au plus deux appels par heure.

const CLE = 'leo:ciel-2'; // -2 : l'ancienne réserve pouvait garder des °F hors des États-Unis
const CLE_VILLE = 'leo:ciel-ville';
const TRENTE_MIN = 30 * 60 * 1000;

export function villeDuFuseau(tz) {
  const s = String(tz || '');
  if (!s.includes('/') || /^(Etc|UTC|GMT)/.test(s)) return null;
  return s.split('/').pop().replace(/_/g, ' ') || null;
}

// Heure locale renvoyée sans décalage (« 2026-09-25T06:09 ») → instant réel.
export function instantLocal(texte, decalageSecondes) {
  const t = Date.parse(`${texte}Z`);
  return Number.isFinite(t) ? t - (decalageSecondes || 0) * 1000 : null;
}

// nuit | aube | jour | couchant. Sans lever ni coucher connus : 6 h et 18 h
// à l'horloge du téléphone.
export function phaseDuJour(maintenant, lever, coucher) {
  let l = lever, c = coucher;
  if (l == null || c == null) {
    const d = new Date(maintenant);
    l = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6).getTime();
    c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18).getTime();
  }
  const M = 60_000;
  if (maintenant >= l - 40 * M && maintenant < l + 50 * M) return 'aube';
  if (maintenant >= c - 70 * M && maintenant < c + 30 * M) return 'couchant';
  if (maintenant >= l + 50 * M && maintenant < c - 70 * M) return 'jour';
  return 'nuit';
}

// Codes WMO → ce qu'on dessine.
export function genreMeteo(code) {
  const c = Number(code);
  if (!Number.isFinite(c)) return null;
  if (c === 0 || c === 1) return 'clair';
  if (c === 2) return 'nuages';
  if (c === 3) return 'couvert';
  if (c === 45 || c === 48) return 'brouillard';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'neige';
  if (c >= 95) return 'orage';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'pluie';
  return 'nuages';
}

// Fahrenheit seulement là où on compte en Fahrenheit.
export function uniteTemperature(tz, langue) {
  const us = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise|Juneau|Adak|Nome|Sitka|Yakutat|Menominee|Metlakatla|North_Dakota)|Pacific\/Honolulu|US\/)/;
  // Le lieu décide, pas la langue : un téléphone réglé en anglais américain à Paris affiche des °C.
  void langue;
  return us.test(String(tz || '')) ? 'fahrenheit' : 'celsius';
}

export const ilFaitChaud = (temperature, unite) => temperature != null && (unite === 'fahrenheit' ? temperature >= 86 : temperature >= 30);

function lire(cle) { try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch { return null; } }
function ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } }

export function villeChoisie() { return lire(CLE_VILLE); }

async function chercherVille(nom, langue) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nom)}&count=1&language=${langue === 'en' ? 'en' : 'fr'}`);
  const j = await r.json();
  const v = j?.results?.[0];
  return v ? { nom: v.name, lat: v.latitude, lon: v.longitude, tz: v.timezone } : null;
}

// → { ville, temperature, unite, genre, lever, coucher } ou null.
export async function chargerCiel({ ville: demandee, langue = 'fr', forcer = false } = {}) {
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
  const choisie = demandee || villeChoisie()?.nom || villeDuFuseau(tz);
  if (!choisie) return null;
  const garde = lire(CLE);
  if (!forcer && garde && garde.demande === choisie && Date.now() - garde.le < TRENTE_MIN) return garde.ciel;
  const lieu = villeChoisie()?.nom === choisie ? villeChoisie() : garde?.demande === choisie && garde.lieu ? garde.lieu : await chercherVille(choisie, langue);
  if (!lieu) return null;
  if (demandee) ecrire(CLE_VILLE, lieu);
  const unite = uniteTemperature(lieu.tz || tz, typeof navigator !== 'undefined' ? navigator.language : '');
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lieu.lat}&longitude=${lieu.lon}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1${unite === 'fahrenheit' ? '&temperature_unit=fahrenheit' : ''}`);
  const j = await r.json();
  if (!j?.current) return null;
  const decalage = j.utc_offset_seconds || 0;
  const ciel = {
    ville: lieu.nom,
    temperature: Math.round(j.current.temperature_2m),
    unite,
    genre: genreMeteo(j.current.weather_code),
    lever: instantLocal(j.daily?.sunrise?.[0], decalage),
    coucher: instantLocal(j.daily?.sunset?.[0], decalage),
  };
  ecrire(CLE, { demande: choisie, le: Date.now(), lieu, ciel });
  return ciel;
}

// Les couleurs du ciel, de haut en bas.
export function couleursCiel(phase, genre) {
  const gris = genre === 'couvert' || genre === 'pluie' || genre === 'orage' || genre === 'brouillard' || genre === 'neige';
  if (phase === 'jour') return gris ? ['#5E6B7D', '#8793A3', '#AEB7C2'] : ['#2F6FB0', '#6FA9DA', '#BFDDF0'];
  if (phase === 'aube') return gris ? ['#3A4254', '#7D7A86', '#B8A99E'] : ['#253A66', '#D98E73', '#F6D2A2'];
  if (phase === 'couchant') return gris ? ['#2C3345', '#6E5F66', '#A07F74'] : ['#1D2A57', '#C4583A', '#F2AE62'];
  return ['#080E1F', '#101A34', '#1A2340'];
}
