-- Trouvé en audit du 08/09 : la migration 0036 avait ajouté `for_role` aux
-- données de la notification "nouveau message" pour que la cloche sache
-- vers quel écran renvoyer (notificationHref lit déjà `d.for_role` — voir
-- useNotifications.jsx). La réécriture du trigger par 0072 (ajout du
-- push/e-mail) a recopié le `notify()` d'origine sans ce champ. Le PUSH,
-- lui, a toujours calculé la bonne URL séparément (case sender_role...) —
-- seule la cloche in-app pointait mal, systématiquement vers /chat/:id même
-- pour une vendeuse.
create or replace function public.on_chat_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare conv record; recipient uuid; shop_name text; sender_label text; recipient_role text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), vendor_unread = vendor_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'Finjaro');
    recipient_role := 'vendor';
  else
    recipient := conv.buyer_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), buyer_unread = buyer_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'La boutique');
    recipient_role := 'buyer';
  end if;
  if recipient is not null and recipient <> new.sender_id then
    perform public.notify(recipient, 'new_message', 'Nouveau message',
      coalesce(new.body, 'Nouveau message'), jsonb_build_object('conversation_id', new.conversation_id, 'shop', shop_name, 'for_role', recipient_role));
    perform public.push_notify(
      recipient, 'Nouveau message — ' || sender_label, coalesce(new.body, '📷 Photo'),
      case when new.sender_role = 'buyer' then '/vendor/messages/' || new.conversation_id
           else '/chat/' || new.conversation_id end,
      'msg-' || new.conversation_id
    );
  end if;
  return new;
end;
$function$;
