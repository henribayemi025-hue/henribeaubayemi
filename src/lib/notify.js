import { supabase } from './supabase';

// Fire-and-forget wrapper around the send-push edge function.
// Never throws into the UI — push delivery is best-effort.
export async function pushNotify(payload) {
  try {
    await supabase.functions.invoke('send-push', { body: payload });
  } catch (e) {
    // Best-effort: in-app notifications are persisted by DB triggers regardless.
    // eslint-disable-next-line no-console
    console.debug('[Finjaro] push notify skipped', e?.message);
  }
}
