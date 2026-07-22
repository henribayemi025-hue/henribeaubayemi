import { supabase } from './supabase';

// Invisible event tracking for a future recommendation algorithm.
// Fire-and-forget: never awaited, never surfaces an error to the user. A failed
// insert (e.g. table not yet migrated) is silently ignored.
export function track(type, targetId = null, meta = {}) {
  try {
    supabase
      .from('events')
      .insert({ type, target_id: targetId != null ? String(targetId) : null, meta })
      .then(
        () => {},
        () => {}
      );
  } catch {
    /* tracking must never break the UX */
  }
}
