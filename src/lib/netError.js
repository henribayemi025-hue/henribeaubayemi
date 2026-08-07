// Traduction des pannes réseau en français.
//
// Quand la connexion tombe, `supabase-js` (comme `fetch`) remonte des messages
// bruts en anglais: « Failed to fetch », « NetworkError when attempting to
// fetch resource », « Load failed » sur Safari/iOS. C'est ce dernier que les
// utilisatrices voyaient à l'inscription et rapportaient comme « load fail ».
//
// La traduction `errors.network` existait déjà en FR et EN mais n'était
// branchée qu'à un seul endroit de l'app. Ce helper sert à la brancher
// partout où une action utilisateur peut échouer faute de réseau.
const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,          // Safari / iOS — le « load fail » rapporté
  /network request failed/i,
  /fetch failed/i,
  /err_internet_disconnected/i,
  /timeout/i,
];

export function isNetworkError(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (e?.name === 'AbortError' || e?.name === 'TypeError') return true;
  const msg = e?.message || String(e || '');
  return NETWORK_PATTERNS.some((re) => re.test(msg));
}

// Renvoie le message à afficher: `errors.network` si c'est une panne réseau,
// sinon le message d'origine (ou `errors.generic` s'il n'y en a pas).
export function networkMessage(e, t) {
  if (isNetworkError(e)) return t('errors.network');
  return e?.message || t('errors.generic');
}
