-- Complément à 0101: un message vocal seul (ni texte ni photo) doit pouvoir
-- exister, et send_direct_message() doit accepter/relayer l'audio.
alter table public.direct_messages drop constraint direct_messages_has_content;
alter table public.direct_messages add constraint direct_messages_has_content
  check (body is not null or image_url is not null or audio_url is not null);

create or replace function public.send_direct_message(
  p_conversation_id uuid, p_body text, p_image_url text default null, p_audio_url text default null
)
returns public.direct_messages
language plpgsql
security definer
set search_path = public
as $$
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

  insert into public.direct_messages (conversation_id, sender_id, body, image_url, audio_url)
  values (p_conversation_id, me, nullif(btrim(p_body), ''), p_image_url, p_audio_url)
  returning * into msg;

  return msg;
end;
$$;

revoke all on function public.send_direct_message(uuid, text, text, text) from public;
grant execute on function public.send_direct_message(uuid, text, text, text) to authenticated;

-- L'ancienne signature à 3 arguments (sans audio) doit disparaître: sinon
-- PostgREST hésite entre les deux surcharges et l'appel RPC échoue avec une
-- erreur d'ambiguïté ("could not choose the best candidate function").
drop function if exists public.send_direct_message(uuid, text, text);

-- Aperçu de fil: un vocal reçoit son propre texte, comme la photo ('📷').
create or replace function public.on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv public.direct_conversations%rowtype;
  recipient uuid;
  sender_name text;
  preview text;
begin
  select * into conv from public.direct_conversations where id = new.conversation_id;
  recipient := case when conv.user_a_id = new.sender_id then conv.user_b_id else conv.user_a_id end;
  preview := coalesce(new.body, case when new.audio_url is not null then '🎤' else '📷' end);

  update public.direct_conversations dc
    set last_message = preview,
        last_message_at = new.created_at,
        a_unread = case when dc.user_a_id = recipient then dc.a_unread + 1 else dc.a_unread end,
        b_unread = case when dc.user_b_id = recipient then dc.b_unread + 1 else dc.b_unread end
    where dc.id = new.conversation_id;

  select name into sender_name from public.profiles where id = new.sender_id;

  perform public.notify(
    recipient, 'new_direct_message', coalesce(sender_name, 'Nouveau message'), preview,
    jsonb_build_object('conversation_id', new.conversation_id)
  );
  perform public.push_notify(
    recipient, coalesce(sender_name, 'Finjaro'), preview,
    '/profile/messages/' || new.conversation_id, 'dm-' || new.conversation_id
  );

  return new;
end;
$$;

-- Même chose côté chat boutique: '🎤' plutôt que '📷' quand le message n'a
-- qu'un vocal — copie EXACTE de la définition actuelle de on_chat_message()
-- (relue en base avant d'écrire ceci), seul `preview` est nouveau.
create or replace function public.on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record; recipient uuid; shop_name text; sender_label text; recipient_role text; preview text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  preview := coalesce(new.body, case when new.audio_url is not null then '🎤' else '📷' end);

  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    update public.conversations
      set last_message = preview, last_message_at = now(), vendor_unread = vendor_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'Finjaro');
    recipient_role := 'vendor';
  else
    recipient := conv.buyer_id;
    update public.conversations
      set last_message = preview, last_message_at = now(), buyer_unread = buyer_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'La boutique');
    recipient_role := 'buyer';
  end if;
  if recipient is not null and recipient <> new.sender_id then
    perform public.notify(recipient, 'new_message', 'Nouveau message',
      coalesce(new.body, preview), jsonb_build_object('conversation_id', new.conversation_id, 'shop', shop_name, 'for_role', recipient_role));
    perform public.push_notify(
      recipient, 'Nouveau message — ' || sender_label, preview,
      case when new.sender_role = 'buyer' then '/vendor/messages/' || new.conversation_id
           else '/chat/' || new.conversation_id end,
      'msg-' || new.conversation_id
    );
  end if;
  return new;
end;
$$;
