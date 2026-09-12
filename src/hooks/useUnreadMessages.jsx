import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Le compte de messages en attente, sur l'onglet Messages.
//
// Beau (11/09): « elle m'envoie les messages, je reçois pas la
// notification ». Les notifications étaient bien créées en base — quatre
// d'Astrid ce soir-là — mais rien ne les montrait: la barre d'onglets
// n'affichait aucune pastille, et son téléphone n'est abonné à aucune
// notification poussée. Une pastille ne dépend, elle, d'aucune permission:
// elle marche dès l'ouverture de l'application.
//
// Les DEUX boîtes comptent: une boutique qui écrit et une personne qui
// écrit attendent autant l'une que l'autre une réponse.
export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const [boutiques, gens] = await Promise.all([
        supabase
          .from('conversations')
          .select('buyer_unread, buyer_hidden')
          .eq('buyer_id', user.id),
        supabase
          .from('direct_conversations')
          .select('user_a_id, a_unread, b_unread, a_hidden, b_hidden')
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
      ]);
      const nB = (boutiques.data || [])
        .filter((c) => !c.buyer_hidden)
        .reduce((n, c) => n + (c.buyer_unread || 0), 0);
      const nP = (gens.data || []).reduce((n, c) => {
        const moiA = c.user_a_id === user.id;
        if (moiA ? c.a_hidden : c.b_hidden) return n;
        return n + ((moiA ? c.a_unread : c.b_unread) || 0);
      }, 0);
      setCount(nB + nP);
    } catch {
      /* un compteur indisponible ne doit rien casser: on garde la valeur */
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;
    const canal = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, refresh)
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [user, refresh]);

  return count;
}
