// Messages d'erreur en français — et surtout, ne JAMAIS accuser le réseau
// quand ce n'est pas lui.
//
// Cas réel du 10/08: Beau s'inscrit avec un numéro déjà enregistré depuis le
// 1er août. Supabase répond « 422 User already registered » — une réponse
// parfaitement reçue, donc pas la moindre panne de connexion. L'application
// affichait pourtant « Problème de connexion. Vérifie ta connexion internet. »
// La personne vérifie son wifi, recommence, échoue encore, et abandonne sans
// jamais apprendre qu'elle a déjà un compte.
//
// Un message d'erreur qui se trompe de coupable est pire que pas de message:
// il envoie chercher la solution du mauvais côté.

const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,          // Safari / iOS — le « load fail » rapporté
  /network request failed/i,
  /fetch failed/i,
  /err_internet_disconnected/i,
  /network timeout/i,      // « timeout » SEUL matchait des erreurs serveur
];

// Codes d'erreur renvoyés par Supabase Auth (champ `code` depuis
// supabase-js v2). Ils sont stables et sans ambiguïté — bien plus fiables que
// de lire le texte anglais, qui change d'une version à l'autre.
const AUTH_CODE_KEYS = {
  user_already_exists: 'errors.auth.alreadyRegistered',
  email_exists: 'errors.auth.alreadyRegistered',
  phone_exists: 'errors.auth.alreadyRegistered',
  invalid_credentials: 'errors.auth.invalidCredentials',
  weak_password: 'errors.auth.weakPassword',
  over_request_rate_limit: 'errors.auth.tooManyAttempts',
  over_sms_send_rate_limit: 'errors.auth.tooManyAttempts',
  otp_expired: 'errors.auth.otpExpired',
  email_not_confirmed: 'errors.auth.notConfirmed',
  phone_not_confirmed: 'errors.auth.notConfirmed',
  signup_disabled: 'errors.auth.signupDisabled',
  validation_failed: 'errors.auth.validationFailed',
};

// Repli sur le texte quand le code manque (vieux clients, erreurs non typées).
const AUTH_TEXT_KEYS = [
  [/already registered|already exists|user already/i, 'errors.auth.alreadyRegistered'],
  [/invalid login credentials/i, 'errors.auth.invalidCredentials'],
  [/password should be at least|weak password/i, 'errors.auth.weakPassword'],
  [/rate limit|too many requests/i, 'errors.auth.tooManyAttempts'],
  [/token has expired|otp.*(expired|invalid)/i, 'errors.auth.otpExpired'],
  [/not confirmed/i, 'errors.auth.notConfirmed'],
];

export function isNetworkError(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  // `TypeError` TOUT COURT accusait le réseau pour n'importe quel bug de notre
  // propre code (lire une propriété de `undefined` en est un). On exige
  // maintenant que le message ressemble VRAIMENT à une panne réseau — c'est le
  // cas de tous les TypeError que `fetch` produit réellement.
  if (e?.name === 'AbortError') return true;
  const msg = e?.message || String(e || '');
  return NETWORK_PATTERNS.some((re) => re.test(msg));
}

// Renvoie le message à afficher, dans l'ordre du plus sûr au moins sûr:
// 1) un code d'erreur Supabase connu, 2) le texte reconnu, 3) le réseau —
// seulement s'il est vraiment en cause, 4) le message d'origine.
export function networkMessage(e, t) {
  const code = e?.code || e?.error_code;
  if (code && AUTH_CODE_KEYS[code]) return t(AUTH_CODE_KEYS[code]);

  const msg = e?.message || String(e || '');
  for (const [re, key] of AUTH_TEXT_KEYS) {
    if (re.test(msg)) return t(key);
  }

  if (isNetworkError(e)) return t('errors.network');
  return msg || t('errors.generic');
}
