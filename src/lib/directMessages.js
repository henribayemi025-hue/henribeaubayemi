import { supabase } from './supabase';

// Messagerie personne-à-personne — voir migration 0099. Toute la logique
// "suivre pour écrire" / "un seul message tant que non accepté" vit côté
// base (fonctions SECURITY DEFINER): ces wrappers ne font que relayer
// l'erreur telle quelle, jamais réinventer la règle côté client.

export async function searchPeople(query) {
  const { data, error } = await supabase.rpc('search_people', { p_query: query });
  if (error) throw error;
  return data || [];
}

export async function getPublicProfile(userId) {
  const { data, error } = await supabase.rpc('get_public_profile', { p_id: userId });
  if (error) throw error;
  return data?.[0] || null;
}

// Hydrate une liste de conversations avec le nom/avatar de chaque
// interlocuteur en UN aller-retour plutôt qu'un par ligne.
export async function getPublicProfiles(userIds) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.rpc('get_public_profiles', { p_ids: userIds });
  if (error) throw error;
  return data || [];
}

export async function followUser(myUserId, userId) {
  const { error } = await supabase.from('user_follows').insert({ follower_id: myUserId, followed_id: userId });
  if (error) throw error;
}

export async function unfollowUser(myUserId, userId) {
  const { error } = await supabase.from('user_follows').delete().eq('follower_id', myUserId).eq('followed_id', userId);
  if (error) throw error;
}

// Lève 'must_follow' | 'blocked' | 'cannot_message_self' — voir directChatErrorKey().
export async function startDirectConversation(otherUserId) {
  const { data, error } = await supabase.rpc('start_direct_conversation', { p_other_id: otherUserId });
  if (error) throw error;
  return data;
}

// Lève 'request_pending' si l'initiatrice a déjà envoyé son unique message
// d'attente, ou 'blocked'.
export async function sendDirectMessage(conversationId, body, imageUrl = null) {
  const { data, error } = await supabase.rpc('send_direct_message', {
    p_conversation_id: conversationId,
    p_body: body,
    p_image_url: imageUrl,
  });
  if (error) throw error;
  return data;
}

export async function markDirectConversationRead(conversationId) {
  const { error } = await supabase.rpc('mark_direct_conversation_read', { p_conversation_id: conversationId });
  if (error) throw error;
}

// Les erreurs RPC arrivent en `error.message` sous la forme brute levée par
// `raise exception` (ex: "must_follow"). On les traduit en clé i18n plutôt
// que d'afficher le texte technique tel quel.
const KNOWN_ERRORS = ['must_follow', 'blocked', 'cannot_message_self', 'request_pending', 'empty_message', 'not_in_conversation'];
export function directErrorKey(error) {
  const msg = String(error?.message || '');
  const known = KNOWN_ERRORS.find((k) => msg.includes(k));
  return known ? `dm.error.${known}` : 'errors.generic';
}
