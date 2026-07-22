import { supabase } from './supabase';

// Get the existing buyer<->shop conversation or create one. Returns the id.
export async function getOrCreateConversation(buyerId, shopId, productId = null) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('shop_id', shopId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, shop_id: shopId, product_id: productId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
