import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Resolves the current user's vendor state: application status + owned shop.
// Returns { status: 'none'|'pending'|'approved'|'rejected', shop, application }.
export function useVendorStatus() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, status: 'none', shop: null, application: null });

  const load = useCallback(async () => {
    if (!user) {
      setState({ loading: false, status: 'none', shop: null, application: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const [{ data: shop }, { data: apps }] = await Promise.all([
      supabase.from('shops').select('*').eq('owner_id', user.id).maybeSingle(),
      supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);
    const application = apps?.[0] || null;
    let status = 'none';
    if (shop) status = 'approved';
    else if (application) status = application.status;
    setState({ loading: false, status, shop, application });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
