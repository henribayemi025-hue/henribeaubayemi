-- « les gens se plaignent d'avoir pas reçu de messages ou notifications »
-- (Beau, 04/09).
--
-- DIAGNOSTIC. Deux canaux existaient déjà et fonctionnent bien:
--   1. La cloche in-app (table `notifications`) — remplie par des triggers
--      SQL fiables, pour CHAQUE compte, sans permission à demander.
--   2. Push navigateur + e-mail (fonction edge `send-push`) — VAPID et
--      Resend sont bien configurés côté serveur.
--
-- Le trou: pour les DEUX événements les plus importants — nouveau message
-- et nouvelle commande — le push/e-mail n'était déclenché QUE depuis le
-- navigateur de la personne qui vient d'agir (VendorChat.jsx `deliver()`,
-- CheckoutCOD.jsx `notifyOwner()`, VendorOrders.jsx `transition()`), APRÈS
-- coup, en fire-and-forget. Si son onglet se ferme, sa connexion coupe une
-- seconde après l'envoi, ou l'appareil est un peu lent — rien ne part.
-- L'écriture en base (le message, la commande) réussit quand même, donc
-- rien ne semblait cassé... jusqu'à ce que le destinataire dise qu'il n'a
-- rien reçu.
--
-- Les rappels automatiques de commandes en attente (0045_order_followups)
-- utilisent déjà le bon patron: net.http_post vers /send-push, DEPUIS LE
-- SERVEUR, indépendamment de qui a son navigateur ouvert. On applique le
-- même patron aux deux événements en temps réel.
--
-- Une fois cette migration en place, les appels client équivalents
-- deviennent redondants (double notification) et sont retirés côté React
-- dans le même commit.

-- Envoi push+e-mail depuis un trigger. Ne DOIT jamais faire échouer
-- l'opération d'origine (envoi d'un message, création d'une commande) si
-- l'infra de notification a un souci — d'où le bloc exception.
create or replace function public.push_notify(
  p_user_id uuid, p_title text, p_body text, p_url text, p_tag text default null
) returns void language plpgsql security definer set search_path = public as $$
declare base_url text;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' or p_user_id is null then
    return;
  end if;
  perform net.http_post(
    url := base_url || '/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('user_id', p_user_id, 'title', p_title, 'body', p_body, 'url', p_url, 'tag', p_tag)
  );
exception when others then
  null; -- best-effort: la cloche in-app (deja ecrite) reste la source de verite
end;
$$;

-- ---- chat: push+e-mail server-side, en plus de la cloche existante --------
create or replace function public.on_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare conv record; recipient uuid; shop_name text; sender_label text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), vendor_unread = vendor_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'Finjaro');
  else
    recipient := conv.buyer_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), buyer_unread = buyer_unread + 1
      where id = new.conversation_id;
    sender_label := coalesce(shop_name, 'La boutique');
  end if;
  if recipient is not null and recipient <> new.sender_id then
    perform public.notify(recipient, 'new_message', 'Nouveau message',
      coalesce(new.body, 'Nouveau message'), jsonb_build_object('conversation_id', new.conversation_id, 'shop', shop_name));
    perform public.push_notify(
      recipient, 'Nouveau message — ' || sender_label, coalesce(new.body, '📷 Photo'),
      case when new.sender_role = 'buyer' then '/vendor/messages/' || new.conversation_id
           else '/chat/' || new.conversation_id end,
      'msg-' || new.conversation_id
    );
  end if;
  return new;
end;
$$;

-- ---- order created: push+e-mail server-side --------------------------------
create or replace function public.on_order_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.shops where id = new.shop_id;
  if owner is not null then
    perform public.notify(owner, 'order_received', 'Nouvelle commande',
      'Tu as reçu une nouvelle commande.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
    perform public.push_notify(
      owner, 'Nouvelle commande', 'Commande #' || new.order_no || ' reçue — réponds vite pour rassurer ta cliente.',
      '/vendor/orders', 'order-' || new.id
    );
  end if;
  return new;
end;
$$;

-- ---- order status change: push+e-mail server-side ---------------------------
create or replace function public.on_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare push_title text; push_body text;
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.notify(new.buyer_id, 'order_confirmed', 'Commande confirmée',
        'Ta commande a été confirmée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande confirmée'; push_body := 'Ta commande #' || new.order_no || ' a été confirmée.';
    elsif new.status = 'shipped' then
      perform public.notify(new.buyer_id, 'order_shipped', 'Commande envoyée',
        'Ta commande a été envoyée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande envoyée'; push_body := 'Ta commande #' || new.order_no || ' est en route.';
    elsif new.status = 'delivered' then
      perform public.notify(new.buyer_id, 'order_delivered', 'Commande livrée',
        'Ta commande a été livrée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande livrée'; push_body := 'Ta commande #' || new.order_no || ' est arrivée.';
    elsif new.status = 'cancelled' then
      -- Annulation MANUELLE par la vendeuse (refus ou annulation apres
      -- confirmation). N'avait jusqu'ici ni cloche ni push cote acheteuse —
      -- seul le job automatique de commandes bloquees (0045) le faisait.
      perform public.notify(new.buyer_id, 'order_cancelled', 'Commande annulée',
        coalesce('Motif : ' || new.cancel_reason, 'Ta commande a été annulée par la vendeuse.'),
        jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
      push_title := 'Commande annulée';
      push_body := coalesce('Commande #' || new.order_no || ' annulée : ' || new.cancel_reason,
                             'Ta commande #' || new.order_no || ' a été annulée par la vendeuse.');
    end if;
    if push_title is not null then
      perform public.push_notify(new.buyer_id, push_title, push_body, '/profile/orders', 'order-status-' || new.id);
    end if;
  end if;
  -- Review unlocks when the buyer confirms receipt.
  if new.buyer_received = true and old.buyer_received = false then
    update public.orders set status = 'delivered' where id = new.id and status <> 'delivered';
    perform public.notify(new.buyer_id, 'review_unlocked', 'Avis débloqué',
      'Tu peux maintenant laisser un avis.', jsonb_build_object('order_id', new.id, 'shop_id', new.shop_id));
  end if;
  return new;
end;
$$;
