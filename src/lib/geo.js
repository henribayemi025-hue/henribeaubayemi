// Geolocation helpers for the "Près de vous" GPS search.

// Ask the browser for the user's position. Resolves { lat, lng } or null
// (never rejects — a denied/unavailable location just falls back to country).
export function getPosition() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

// Variante qui distingue POURQUOI ça a échoué (permission refusée, position
// indisponible, délai dépassé, navigateur sans géoloc) — getPosition() avale
// tout en un simple null. Beau: "j'ai appuyé, ça dit un truc sur la
// localisation, le bouton est resté normal" — sans savoir laquelle de ces
// causes, impossible de dire à la vendeuse quoi faire ensuite (réessayer ?
// changer un réglage ? saisir la position à la main ?).
export function getPositionWithReason() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({ pos: null, reason: 'unsupported' });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ pos: { lat: pos.coords.latitude, lng: pos.coords.longitude }, reason: null }),
      (err) => {
        const reason =
          err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        resolve({ pos: null, reason });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

// Great-circle distance in km between two {lat,lng} points (haversine).
export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}
