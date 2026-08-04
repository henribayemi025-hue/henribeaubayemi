-- Une notification "nouveau message" ne dit pas si son destinataire la reçoit
-- en tant qu'acheteuse (elle doit aller dans /chat/:id) ou en tant que
-- boutique (elle doit aller dans /vendor/messages/:id). Le trigger connaît
-- déjà la réponse (c'est justement ce qui détermine QUI est `recipient`) —
-- on la transmet simplement dans `data` pour que le client n'ait pas à
-- deviner ni à faire une requête supplémentaire au clic.
create or replace function public.on_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare conv record; recipient uuid; shop_name text; recipient_role text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    recipient_role := 'vendor';
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), vendor_unread = vendor_unread + 1
      where id = new.conversation_id;
  else
    recipient := conv.buyer_id;
    recipient_role := 'buyer';
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), buyer_unread = buyer_unread + 1
      where id = new.conversation_id;
  end if;
  if recipient is not null and recipient <> new.sender_id then
    perform public.notify(recipient, 'new_message', 'Nouveau message',
      coalesce(new.body, 'Nouveau message'),
      jsonb_build_object('conversation_id', new.conversation_id, 'shop', shop_name, 'for_role', recipient_role));
  end if;
  return new;
end;
$$;
