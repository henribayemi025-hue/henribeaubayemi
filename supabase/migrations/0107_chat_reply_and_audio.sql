-- Chat façon WhatsApp (Beau: « fais comme dans WhatsApp »).
--
-- 1. Répondre à un message (citation). Le geste attendu est le glissement
--    latéral sur une bulle; il faut donc mémoriser À QUEL message on répond.
--    on delete set null: supprimer un message ne doit pas effacer les
--    réponses qu'il a suscitées — la citation devient juste "message
--    supprimé".
-- 2. Durée du vocal. Un fichier WebM produit par le navigateur n'a PAS de
--    durée dans son en-tête (c'est un flux): le lecteur natif tourne
--    indéfiniment sans jamais démarrer — exactement ce que Beau a vu. On
--    enregistre donc la durée mesurée pendant l'enregistrement, et le
--    lecteur maison l'affiche sans rien attendre du fichier.
-- 3. Supprimer SON message: l'appui long propose "Supprimer", il faut une
--    policy pour que ce soit possible (il n'y en avait aucune).

alter table public.chat_messages
  add column if not exists reply_to_id uuid references public.chat_messages(id) on delete set null,
  add column if not exists audio_seconds int;

alter table public.direct_messages
  add column if not exists reply_to_id uuid references public.direct_messages(id) on delete set null,
  add column if not exists audio_seconds int;

drop policy if exists chat_delete_own on public.chat_messages;
create policy chat_delete_own on public.chat_messages
  for delete using (sender_id = (select auth.uid()));

drop policy if exists direct_messages_delete_own on public.direct_messages;
create policy direct_messages_delete_own on public.direct_messages
  for delete using (sender_id = (select auth.uid()));

-- send_direct_message porte maintenant la citation et la durée du vocal.
-- L'ancienne signature à 4 arguments est supprimée: deux surcharges avec les
-- mêmes premiers paramètres rendraient l'appel ambigu côté PostgREST.
create or replace function public.send_direct_message(
  p_conversation_id uuid,
  p_body text,
  p_image_url text default null,
  p_audio_url text default null,
  p_reply_to_id uuid default null,
  p_audio_seconds int default null
)
returns public.direct_messages
language plpgsql
security definer
set search_path = public
as $function$
declare
  me uuid := auth.uid();
  conv public.direct_conversations%rowtype;
  other uuid;
  deja_envoyes int;
  msg public.direct_messages%rowtype;
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if coalesce(btrim(p_body), '') = '' and p_image_url is null and p_audio_url is null then
    raise exception 'empty_message';
  end if;

  select * into conv from public.direct_conversations where id = p_conversation_id for update;
  if not found or me not in (conv.user_a_id, conv.user_b_id) then
    raise exception 'not_in_conversation';
  end if;

  other := case when conv.user_a_id = me then conv.user_b_id else conv.user_a_id end;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_user_id = other)
       or (blocker_id = other and blocked_user_id = me)
  ) then
    raise exception 'blocked';
  end if;

  if not conv.unlocked then
    if me = conv.initiator_id then
      select count(*) into deja_envoyes from public.direct_messages
        where conversation_id = p_conversation_id and sender_id = me;
      if deja_envoyes >= 1 then
        raise exception 'request_pending';
      end if;
    else
      update public.direct_conversations set unlocked = true where id = p_conversation_id;
    end if;
  end if;

  -- La citation doit appartenir à CETTE conversation: sinon on pourrait citer
  -- (et donc afficher un extrait) d'un message d'un fil auquel on n'a pas accès.
  if p_reply_to_id is not null and not exists (
    select 1 from public.direct_messages
    where id = p_reply_to_id and conversation_id = p_conversation_id
  ) then
    p_reply_to_id := null;
  end if;

  insert into public.direct_messages (conversation_id, sender_id, body, image_url, audio_url, reply_to_id, audio_seconds)
  values (p_conversation_id, me, nullif(btrim(p_body), ''), p_image_url, p_audio_url, p_reply_to_id, p_audio_seconds)
  returning * into msg;

  return msg;
end;
$function$;

drop function if exists public.send_direct_message(uuid, text, text, text);

grant execute on function public.send_direct_message(uuid, text, text, text, uuid, int) to authenticated;
