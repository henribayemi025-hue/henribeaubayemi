import { supabase } from '../../../lib/supabase';

// L'adresse du Worker de l'atelier (finjaro-atelier), séparé du site.
// VITE_ATELIER_URL la remplace au moment de la construction si besoin.
export const ATELIER_URL = (import.meta.env.VITE_ATELIER_URL || 'https://finjaro-atelier.finjaro.workers.dev').replace(/\/$/, '');

// V0 : l'atelier est réservé au propriétaire de l'entreprise Finjaro dans
// Léo. Le Worker le vérifie de son côté ; ici, on ne montre simplement pas
// l'entrée aux autres.
export const ATELIER_ENTREPRISE = '44bb201b-6787-4de0-8f7f-f9145d5c03e7';

export class ErreurAtelier extends Error {
  constructor(message, statut) {
    super(message);
    this.statut = statut;
  }
}

async function jeton() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// Un appel au Worker, avec le jeton de la session Supabase.
export async function appel(chemin, { methode = 'GET', corps, brut = false, signal } = {}) {
  const j = await jeton();
  if (!j) throw new ErreurAtelier('Connecte-toi à Léo.', 401);
  let r;
  try {
    r = await fetch(`${ATELIER_URL}/api${chemin}`, {
      method: methode,
      headers: { Authorization: `Bearer ${j}`, ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ErreurAtelier('hors_ligne', 0);
  }
  if (brut && r.ok) return r;
  const texte = await r.text();
  let donnees = null;
  try { donnees = texte ? JSON.parse(texte) : null; } catch { /* réponse non JSON */ }
  if (!r.ok) throw new ErreurAtelier(donnees?.erreur || `Erreur ${r.status}`, r.status);
  return donnees;
}
