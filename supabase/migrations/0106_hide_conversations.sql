-- Beau: « il ya pas eu delete UNE conversation » / « ou supprimer;er ou
-- archiver ». Une conversation relie deux parties (acheteuse+boutique, ou
-- deux personnes) — la supprimer pour de vrai effacerait aussi les messages
-- de l'autre côté, qui n'a rien demandé. On masque donc côté appelant
-- seulement (comme WhatsApp "supprimer la discussion" côté soi), et un
-- nouveau message de l'autre partie la refait réapparaître automatiquement:
-- un message reçu ne doit jamais disparaître silencieusement.

alter table public.conversations
  add column if not exists buyer_hidden boolean not null default false,
  add column if not exists vendor_hidden boolean not null default false;

alter table public.direct_conversations
  add column if not exists a_hidden boolean not null default false,
  add column if not exists b_hidden boolean not null default false;

-- on_chat_message(): reste identique, on ajoute juste la réapparition
-- automatique côté destinataire quand un nouveau message arrive.
create or replace function public.on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  conv record; recipient uuid; shop_name text; sender_label text; recipient_role text; preview text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  preview := coalesce(new.body, case when new.audio_url is not null then '🎤' else '📷' end);

  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    update public.conversations
      set last_message = preview, last_message_at = now(), vendor_unread = vendor_unread + 1, vendor_hidden = false
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'Finjaro');
    recipient_role := 'vendor';
  else
    recipient := conv.buyer_id;
    update public.conversations
      set last_message = preview, last_message_at = now(), buyer_unread = buyer_unread + 1, buyer_hidden = false
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
$function$;

-- on_direct_message(): idem, réapparition automatique côté destinataire.
create or replace function public.on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
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
        b_unread = case when dc.user_b_id = recipient then dc.b_unread + 1 else dc.b_unread end,
        a_hidden = case when dc.user_a_id = recipient then false else dc.a_hidden end,
        b_hidden = case when dc.user_b_id = recipient then false else dc.b_hidden end
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
$function$;

-- Messagerie personnelle: pas de policy UPDATE côté client sur
-- direct_conversations (contrairement à conversations), donc une RPC comme
-- pour mark_direct_conversation_read.
create or replace function public.hide_direct_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare me uuid := auth.uid();
begin
  update public.direct_conversations dc
    set a_hidden = case when dc.user_a_id = me then true else dc.a_hidden end,
        b_hidden = case when dc.user_b_id = me then true else dc.b_hidden end
    where dc.id = p_conversation_id and me in (dc.user_a_id, dc.user_b_id);
end;
$function$;

grant execute on function public.hide_direct_conversation(uuid) to authenticated;
