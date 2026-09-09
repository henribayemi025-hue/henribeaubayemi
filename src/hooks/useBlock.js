import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Bloquer/débloquer l'autre partie d'une conversation.
//
// La messagerie relie une PERSONNE à une BOUTIQUE, donc le blocage a deux
// sens (voir migration 0047): l'acheteuse bloque la boutique (`shopId`), la
// vendeuse bloque l'acheteuse (`userId`). On en passe exactement un.
//
// Le blocage est appliqué EN BASE par un déclencheur sur chat_messages:
// cacher les messages côté écran ne ferait qu'une illusion, la personne
// bloquée pourrait continuer à écrire.
//
// Extrait de BlockButton pour que le bouton ET l'entrée du menu ⋮ du chat
// partagent exactement la même logique, au lieu de la réécrire deux fois.
export function useBlock({ shopId = null, userId = null, onChange } = {}) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const column = shopId ? 'shop_id' : 'blocked_user_id';
  const value = shopId || userId;

  useEffect(() => {
    if (!user || !value) return undefined;
    let alive = true;
    supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq(column, value)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setBlocked(!!data);
        onChange?.(!!data);
      });
    return () => { alive = false; };
    // onChange est recréé à chaque rendu du parent: l'inclure relancerait la
    // requête en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, value, column]);

  async function toggle() {
    if (!user || !value) return { error: null, blocked };
    setBusy(true);
    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocker_id', user.id).eq(column, value)
      : await supabase.from('blocks').insert({ blocker_id: user.id, [column]: value });
    setBusy(false);
    if (error) return { error, blocked };
    const next = !blocked;
    setBlocked(next);
    onChange?.(next);
    return { error: null, blocked: next };
  }

  return { blocked, busy, toggle, disponible: !!user && !!value };
}
