import { supabase } from './supabase';

// Même idée que homeCache, mais par catégorie. Sans cela, chaque aller-retour
// vers une catégorie relançait la requête ET revidait la grille en squelette —
// alors que la donnée n'avait pas changé. On sert donc immédiatement le contenu
// déjà connu, et on rafraîchit en arrière-plan.
//
// Le cache vit le temps de l'onglet (Map en mémoire, pas de persistance): assez
// pour rendre la navigation instantanée, trop court pour afficher un catalogue
// périmé à quelqu'un qui revient plus tard.
const cache = new Map();
const inFlight = new Map();

export function getCachedCategory(categoryId) {
  return cache.get(categoryId) ?? null;
}

async function fetchCategory(categoryId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price_fcfa, images, category, stock, shop_id, shops(name)')
    .eq('category', categoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p) => ({ ...p, shop_name: p.shops?.name }));
}

export function loadCategory(categoryId) {
  const running = inFlight.get(categoryId);
  if (running) return running; // déduplique deux montages rapprochés

  const promise = fetchCategory(categoryId)
    .then((rows) => {
      cache.set(categoryId, rows);
      return rows;
    })
    .finally(() => inFlight.delete(categoryId));

  inFlight.set(categoryId, promise);
  return promise;
}
