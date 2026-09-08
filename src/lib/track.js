import { supabase } from './supabase';

const ANON_ID_KEY = 'finjaro-anon-id';

// Un identifiant stable par navigateur pour les visites anonymes. Sans lui,
// une "visite" en base ne dit jamais si c'est la même personne qui revient
// ou cent personnes différentes qui passent une fois chacune — trouvé le
// 08/09 en cherchant à répondre à Beau sur son propre trafic. localStorage
// (pas sessionStorage): il survit à la fermeture de l'onglet, pour que
// deux visites du même appareil à deux jours d'écart partagent le même id.
// Une fenêtre privée ou un autre navigateur en aura un différent — ça
// SOUS-compte les revisites, ça n'en invente jamais.
function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null; // stockage indisponible (navigation privée) — pas bloquant
  }
}

// Invisible event tracking for a future recommendation algorithm.
// Fire-and-forget: never awaited, never surfaces an error to the user. A failed
// insert (e.g. table not yet migrated) is silently ignored.
export function track(type, targetId = null, meta = {}) {
  try {
    const anonId = getAnonId();
    supabase
      .from('events')
      .insert({
        type,
        target_id: targetId != null ? String(targetId) : null,
        meta: anonId ? { anon_id: anonId, ...meta } : meta,
      })
      .then(
        () => {},
        () => {}
      );
  } catch {
    /* tracking must never break the UX */
  }
}
