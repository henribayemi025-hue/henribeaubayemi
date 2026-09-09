import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Stories actives d'UNE boutique (déjà filtrées par la policy RLS: pas
// besoin de vérifier expires_at nous-mêmes, la base ne renvoie que le
// vivant). Utilisé à la fois pour l'anneau "story en cours" et le lecteur
// plein écran.
export function useShopStories(shopId) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(!!shopId);

  const load = useCallback(async () => {
    if (!shopId) {
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('shop_stories')
      .select('id, media_url, caption, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });
    setStories(data || []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stories, loading, reload: load };
}
