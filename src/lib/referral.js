import { supabase } from './supabase';

const KEY = 'finjaro:ref';

// Le code de parrainage vu dans l'adresse (`/auth?ref=XXXX`).
//
// Il voyage normalement dans les métadonnées de `signUp` — mais Google et
// Apple passent par OAuth, qui n'a pas de métadonnées: la personne arrivait
// par le lien de sa marraine et le parrainage disparaissait en route, sans
// que personne ne s'en aperçoive. Sur 55 comptes, le programme n'a jamais
// enregistré un seul filleul.
//
// On garde donc le code de côté avant de partir chez Google, et on le
// réclame au retour. Rien n'est décidé ici: c'est `claim_referral` en base
// qui vérifie (case encore vide, compte créé il y a moins de dix minutes,
// jamais son propre code).
export function souvenirCode(code) {
  if (!code) return;
  try { localStorage.setItem(KEY, code); } catch { /* navigation privée */ }
}

export async function reclamerParrainage() {
  let code = null;
  try { code = localStorage.getItem(KEY); } catch { return; }
  if (!code) return;
  try {
    await supabase.rpc('claim_referral', { p_code: code });
  } finally {
    // Une seule tentative, quoi qu'il arrive: un code qui ne passe pas
    // (compte déjà parrainé, trop tard, code inconnu) ne doit pas être
    // rejoué à chaque ouverture de l'application.
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }
}
