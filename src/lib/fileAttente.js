import { supabase } from './supabase';
import { isNetworkError } from './netError';

// Hors ligne — l'ÉCRITURE (plan complet, D; règle dans IDEES-FINJARO §10).
//
// « Hors ligne on AJOUTE, on ne MODIFIE pas. » Deux lignes de budget écrites
// sans réseau sont deux lignes: on les envoie toutes les deux et c'est fini.
// Une modification, elle, pourrait en contredire une autre — on ne la met
// jamais en file.
//
// Ce qui entre ici: un AJOUT dans une table listée ci-dessous. L'identifiant
// est posé par le téléphone au moment du geste: si l'envoi part deux fois
// (réseau qui revient puis retombe), la base refuse le doublon (23505) et on
// le compte comme envoyé. L'heure aussi est celle du geste, pas celle de
// l'envoi: « qui a payé quand » reste vrai.
//
// La file vit dans le navigateur (localStorage): elle est à CET appareil, et
// c'est dit à l'écran (« 3 en attente d'envoi »). Une file invisible qui
// échoue en silence serait pire que pas de hors ligne du tout.

const CLE = 'finjaro_file_attente_v1';
const TABLES = new Set(['budget_entries', 'space_tx']);
const EVENEMENT = 'finjaro-file-attente';

function lire() {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; }
}
function ecrire(file) {
  try { localStorage.setItem(CLE, JSON.stringify(file)); } catch { /* stockage plein ou bloqué */ }
  try { window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: file.length })); } catch { /* très vieux navigateur */ }
}

// Un vrai UUID v4: la colonne `id` est de type uuid. crypto.randomUUID
// manque dans plusieurs navigateurs intégrés (voir lib/uid.js).
function uuid() {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch { /* repli */ }
  const o = new Uint8Array(16);
  try { crypto.getRandomValues(o); } catch { for (let i = 0; i < 16; i += 1) o[i] = Math.floor(Math.random() * 256); }
  o[6] = (o[6] & 0x0f) | 0x40; o[8] = (o[8] & 0x3f) | 0x80;
  const h = [...o].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function enAttente(table) {
  return lire().filter((x) => !table || x.table === table);
}

// Ajouter une ligne. Rend { enFile: true } si elle attend le réseau; lève
// l'erreur si la base l'a refusée pour une autre raison (à afficher).
export async function ajouter(table, ligne) {
  if (!TABLES.has(table)) throw new Error(`fileAttente: ${table} n'est pas un ajout sûr hors ligne`);
  const complete = { id: uuid(), created_at: new Date().toISOString(), ...ligne };
  const mettreEnFile = () => { ecrire([...lire(), { table, ligne: complete }]); return { enFile: true, ligne: complete }; };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return mettreEnFile();
  try {
    const { error } = await supabase.from(table).insert(complete);
    if (!error) return { enFile: false, ligne: complete };
    if (isNetworkError(error)) return mettreEnFile();
    throw error;
  } catch (e) {
    if (isNetworkError(e)) return mettreEnFile();
    throw e;
  }
}

// Envoyer ce qui attend, dans l'ordre des gestes. S'arrête au premier souci
// de réseau (on réessaiera); une ligne que la base REFUSE (droits, valeur
// invalide) sort de la file, et on le signale: la garder bloquerait tout.
let enCours = false;
export async function envoyer() {
  if (enCours) return { envoyees: 0, refusees: [] };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { envoyees: 0, refusees: [] };
  enCours = true;
  let envoyees = 0;
  const refusees = [];
  try {
    for (const x of lire()) {
      let resultat = 'ok';
      try {
        const { error } = await supabase.from(x.table).insert(x.ligne);
        if (error && error.code !== '23505') resultat = isNetworkError(error) ? 'reseau' : 'refus';
      } catch (e) { resultat = isNetworkError(e) ? 'reseau' : 'refus'; }
      if (resultat === 'reseau') break;
      if (resultat === 'refus') refusees.push(x); else envoyees += 1;
      ecrire(lire().filter((y) => y.ligne.id !== x.ligne.id));
    }
  } finally { enCours = false; }
  return { envoyees, refusees };
}

export function ecouterFile(rappel) {
  const f = () => rappel(lire().length);
  window.addEventListener(EVENEMENT, f);
  window.addEventListener('storage', f);
  return () => { window.removeEventListener(EVENEMENT, f); window.removeEventListener('storage', f); };
}
