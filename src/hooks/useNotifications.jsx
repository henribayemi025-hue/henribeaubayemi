import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const PAGE_SIZE = 30;

// La clochette de notifications: le SEUL canal qui marche pour TOUT le
// monde, quel que soit le téléphone ou les permissions accordées.
//
// Un push navigateur exige une permission explicite, et sur iPhone ne
// fonctionne carrément pas tant que l'app n'a pas été ajoutée à l'écran
// d'accueil (restriction Apple, pas la nôtre). Un e-mail suppose d'en avoir
// un — faux pour tout compte créé par SMS. La table `public.notifications`,
// elle, existe pour CHAQUE compte et se remplit déjà via des triggers SQL
// (nouveau message, commande, statut, boutique validée…) — il ne manquait
// que cet écran pour la lire.
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    const [{ data: rows }, { count }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, title, body, data, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
    ]);
    setItems(rows || []);
    setUnreadCount(count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Live: une nouvelle ligne insérée par un trigger (message, commande…)
  // apparaît sans que la personne ait besoin de recharger la page.
  useEffect(() => {
    if (!user) return undefined;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new, ...prev].slice(0, PAGE_SIZE));
          setUnreadCount((n) => n + 1);
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = useCallback(
    async (id) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((n) => Math.max(0, n - 1));
      await supabase.from('notifications').update({ read: true }).eq('id', id).eq('read', false);
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  }, [user, unreadCount]);

  return { items, unreadCount, loading, markRead, markAllRead, refresh: load };
}

// Où amener la personne quand elle touche une notification — chaque type
// sait quelle route lui correspond, `new_message` se dédouble via
// `for_role` (voir migration notify_message_recipient_role).
export function notificationHref(n) {
  const d = n.data || {};
  switch (n.type) {
    case 'new_message':
      return d.for_role === 'vendor' ? `/vendor/messages/${d.conversation_id}` : `/chat/${d.conversation_id}`;
    case 'order_received':
      return '/vendor/orders';
    case 'order_confirmed':
    case 'order_shipped':
    case 'order_delivered':
    case 'review_unlocked':
      return '/profile/orders';
    case 'shop_approved':
      return '/switch/to-vendor';
    case 'shop_rejected':
      return '/become-vendor';
    case 'new_reel':
      return '/fin';
    case 'new_listing':
      return '/services';
    default:
      return null;
  }
}
