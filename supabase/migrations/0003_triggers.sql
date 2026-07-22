-- Finjaro — business-logic triggers (all SECURITY DEFINER).

-- Insert a notification row (used by the triggers below and readable by the owner).
create or replace function public.notify(uid uuid, ntype text, ntitle text, nbody text, ndata jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, data)
  values (uid, ntype, ntitle, nbody, coalesce(ndata, '{}'::jsonb));
$$;

-- Verified badge: id verified + phone confirmed + >=1 product + avatar uploaded.
create or replace function public.refresh_shop_verified(sid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare has_product boolean;
begin
  select exists(select 1 from public.products where shop_id = sid) into has_product;
  update public.shops
    set is_verified = (id_verified and phone_confirmed and avatar_url is not null and has_product)
    where id = sid;
end;
$$;

-- ---- chat: maintain conversation + notify recipient ------------------------
create or replace function public.on_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare conv record; recipient uuid; shop_name text;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select name into shop_name from public.shops where id = conv.shop_id;
  if new.sender_role = 'buyer' then
    select owner_id into recipient from public.shops where id = conv.shop_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), vendor_unread = vendor_unread + 1
      where id = new.conversation_id;
  else
    recipient := conv.buyer_id;
    update public.conversations
      set last_message = coalesce(new.body, '📷'), last_message_at = now(), buyer_unread = buyer_unread + 1
      where id = new.conversation_id;
  end if;
  if recipient is not null and recipient <> new.sender_id then
    perform public.notify(recipient, 'new_message', 'Nouveau message',
      coalesce(new.body, 'Nouveau message'), jsonb_build_object('conversation_id', new.conversation_id, 'shop', shop_name));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_chat_message on public.chat_messages;
create trigger trg_chat_message after insert on public.chat_messages
  for each row execute function public.on_chat_message();

-- ---- order created: notify vendor ------------------------------------------
create or replace function public.on_order_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.shops where id = new.shop_id;
  if owner is not null then
    perform public.notify(owner, 'order_received', 'Nouvelle commande',
      'Tu as reçu une nouvelle commande.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_order_created on public.orders;
create trigger trg_order_created after insert on public.orders
  for each row execute function public.on_order_created();

-- ---- order status change: notify buyer; unlock review on receipt -----------
create or replace function public.on_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.notify(new.buyer_id, 'order_confirmed', 'Commande confirmée',
        'Ta commande a été confirmée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
    elsif new.status = 'shipped' then
      perform public.notify(new.buyer_id, 'order_shipped', 'Commande envoyée',
        'Ta commande a été envoyée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
    elsif new.status = 'delivered' then
      perform public.notify(new.buyer_id, 'order_delivered', 'Commande livrée',
        'Ta commande a été livrée.', jsonb_build_object('order_id', new.id, 'order_no', new.order_no));
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
drop trigger if exists trg_order_status on public.orders;
create trigger trg_order_status after update on public.orders
  for each row execute function public.on_order_status();

-- ---- reel created: notify followers ----------------------------------------
create or replace function public.on_reel_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare shop_name text;
begin
  select name into shop_name from public.shops where id = new.shop_id;
  insert into public.notifications (user_id, type, title, body, data)
  select f.follower_id, 'new_reel', 'Nouveau reel',
    coalesce(shop_name, 'Une boutique') || ' a publié un nouveau reel.',
    jsonb_build_object('reel_id', new.id, 'shop_id', new.shop_id)
  from public.shop_follows f where f.shop_id = new.shop_id;
  return new;
end;
$$;
drop trigger if exists trg_reel_created on public.reels;
create trigger trg_reel_created after insert on public.reels
  for each row execute function public.on_reel_created();

-- ---- review insert: recompute shop rating + refresh verified ---------------
create or replace function public.on_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.shops s set
    rating = (select round(avg(rating)::numeric, 1) from public.reviews where shop_id = new.shop_id),
    reviews_count = (select count(*) from public.reviews where shop_id = new.shop_id)
    where s.id = new.shop_id;
  return new;
end;
$$;
drop trigger if exists trg_review on public.reviews;
create trigger trg_review after insert on public.reviews
  for each row execute function public.on_review();

-- ---- product change: refresh verified badge --------------------------------
create or replace function public.on_product_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_shop_verified(coalesce(new.shop_id, old.shop_id));
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_product_change on public.products;
create trigger trg_product_change after insert or delete on public.products
  for each row execute function public.on_product_change();

-- ---- shop update: refresh verified badge -----------------------------------
create or replace function public.on_shop_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.avatar_url is distinct from old.avatar_url
     or new.id_verified is distinct from old.id_verified
     or new.phone_confirmed is distinct from old.phone_confirmed then
    perform public.refresh_shop_verified(new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_shop_update on public.shops;
create trigger trg_shop_update after update on public.shops
  for each row execute function public.on_shop_update();

-- ---- follows: maintain followers_count -------------------------------------
create or replace function public.on_follow_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.shops set followers_count = followers_count + 1 where id = new.shop_id;
  elsif tg_op = 'DELETE' then
    update public.shops set followers_count = greatest(followers_count - 1, 0) where id = old.shop_id;
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_follow_change on public.shop_follows;
create trigger trg_follow_change after insert or delete on public.shop_follows
  for each row execute function public.on_follow_change();

-- ---- reports: 3 reports -> auto-suspend ------------------------------------
create or replace function public.on_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt integer;
begin
  select count(*) into cnt from public.reports where target_type = new.target_type and target_id = new.target_id;
  if new.target_type = 'shop' then
    update public.shops set report_count = cnt, status = case when cnt >= 3 then 'suspended' else status end
      where id = new.target_id;
  else
    update public.profiles set report_count = cnt, is_suspended = case when cnt >= 3 then true else is_suspended end
      where id = new.target_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_report on public.reports;
create trigger trg_report after insert on public.reports
  for each row execute function public.on_report();

-- ---- near_you listing: notify users in the same country --------------------
create or replace function public.on_listing_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.country is not null then
    insert into public.notifications (user_id, type, title, body, data)
    select p.id, 'new_listing', 'Nouvelle annonce',
      'Une nouvelle annonce a été publiée près de chez toi.',
      jsonb_build_object('listing_id', new.id, 'country', new.country)
    from public.profiles p
    where p.country = new.country and p.id <> new.user_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_listing_created on public.near_you_listings;
create trigger trg_listing_created after insert on public.near_you_listings
  for each row execute function public.on_listing_created();

-- ---- vendor application approval/rejection ---------------------------------
create or replace function public.on_vendor_app_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_slug text; existing uuid; new_shop uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select id into existing from public.shops where owner_id = new.user_id limit 1;
    if existing is null then
      new_slug := regexp_replace(lower(new.shop_name), '[^a-z0-9]+', '-', 'g')
                  || '-' || substr(md5(random()::text), 1, 5);
      insert into public.shops (owner_id, slug, name, bio, banner_url, avatar_url, whatsapp,
                                country, city, categories, id_verified, phone_confirmed, status)
      values (new.user_id, new_slug, new.shop_name, new.description, new.banner_url, new.avatar_url,
              coalesce(new.whatsapp, new.phone), new.country, new.city, new.categories, true, true, 'active')
      returning id into new_shop;
      perform public.refresh_shop_verified(new_shop);
    else
      update public.shops set id_verified = true, phone_confirmed = true where id = existing;
      perform public.refresh_shop_verified(existing);
    end if;
    update public.profiles set is_vendor = true where id = new.user_id;
    perform public.notify(new.user_id, 'shop_approved', 'Boutique validée',
      'Ta boutique a été validée par Finjaro !', jsonb_build_object('application_id', new.id));
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    perform public.notify(new.user_id, 'shop_rejected', 'Demande refusée',
      coalesce(new.rejection_reason, 'Ta demande a été refusée.'), jsonb_build_object('application_id', new.id));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_vendor_app_status on public.vendor_applications;
create trigger trg_vendor_app_status after update on public.vendor_applications
  for each row execute function public.on_vendor_app_status();

-- Realtime for live chat / inbox / feed.
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.chat_messages'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.conversations'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.orders'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when others then null; end;
end $$;
