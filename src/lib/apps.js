import { supabase } from './supabase';

// L'environnement Finjaro: plusieurs applications, un seul compte.
// La liste de référence vit dans la table `finjaro_apps` (migration 0117) —
// ajouter une application ou corriger son adresse ne demande donc aucun
// déploiement, et toutes les applications Finjaro affichent la même liste.
//
// Celle-ci n'est qu'un filet: le sélecteur doit s'ouvrir instantanément, y
// compris hors ligne et avant la toute première lecture de la table.
export const APPS_FALLBACK = [
  {
    key: 'marketplace',
    name: 'Finjaro',
    tagline: 'La place de marché: acheter, vendre, se faire livrer.',
    url: 'https://finjaro.net',
    emoji: '🛍️',
    accent: 'teal',
    audience: 'tous',
    sort_order: 10,
  },
  {
    key: 'accounting',
    name: 'Finjaro Accounting',
    tagline: 'Caisse, stock, factures et comptabilité pour ta boutique.',
    url: 'https://automatisation-des-candidatures.finjaro.workers.dev',
    emoji: '📒',
    accent: 'brass',
    audience: 'tous',
    sort_order: 20,
  },
];

const CACHE_KEY = 'finjaro:apps:v1';

export function appsFromCache() {
  try {
    const brut = localStorage.getItem(CACHE_KEY);
    const liste = brut ? JSON.parse(brut) : null;
    if (Array.isArray(liste) && liste.length > 0) return liste;
  } catch {
    /* stockage refusé (navigation privée): on garde le filet */
  }
  return APPS_FALLBACK;
}

export async function fetchApps() {
  const { data, error } = await supabase
    .from('finjaro_apps')
    .select('key, name, tagline, url, emoji, accent, audience, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return appsFromCache();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* sans importance: la liste vient d'être lue */
  }
  return data;
}

// Qui voit quoi. La console d'administration ne doit même pas se deviner
// depuis un compte ordinaire (c'est la règle déjà appliquée au Profil).
export function visibleApps(apps, { isAdmin = false, isVendor = false } = {}) {
  return (apps || []).filter((a) => {
    if (a.audience === 'admin') return isAdmin;
    if (a.audience === 'vendeuse') return isVendor || isAdmin;
    return true;
  });
}

// Tailwind ne peut pas fabriquer une classe à partir d'une valeur lue en
// base: la correspondance est donc explicite, et une couleur inconnue
// retombe sur la couleur maison.
export const ACCENT_CLASS = {
  teal: 'bg-teal/10 text-teal',
  brass: 'bg-brass/15 text-brass',
  ink: 'bg-ink/10 text-ink',
};

export function accentClass(accent) {
  return ACCENT_CLASS[accent] || ACCENT_CLASS.teal;
}
