import { supabase } from './supabase';
import { categoryQueryIds } from './categories';

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
  // Une tête de catégorie du pivot inclut ses enfants hérités (ex:
  // beaute_cosmetiques couvre aussi parfums/beaute/cheveux) — c'est ce qui
  // garantit qu'aucun produit existant ne disparaît avec le pivot.
  const { data, error } = await supabase
    .from('products')
    // `shops!inner` et pas `shops` : la règle d'accès de `products` ne regarde
    // que `is_active` et le compte de test, PAS l'état de la boutique. Un
    // article d'une boutique suspendue reste donc lisible, et sans jointure
    // stricte il s'affichait avec une boutique vide — cliquable vers une fiche
    // qui n'existe plus. Mesuré le 28/09 : un article dans ce cas.
    .select('id, name, price_fcfa, compare_at_price_fcfa, images, video_url, price_on_request, category, stock, shop_id, shops!inner(name)')
    .in('category', categoryQueryIds(categoryId))
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
