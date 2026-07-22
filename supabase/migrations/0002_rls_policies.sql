-- Finjaro — Row-Level Security policies.

-- Access helpers (SECURITY DEFINER to avoid RLS recursion).
create or replace function public.owns_shop(sid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.shops where id = sid and owner_id = auth.uid());
$$;

create or replace function public.in_conversation(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid
      and (c.buyer_id = auth.uid()
        or exists (select 1 from public.shops s where s.id = c.shop_id and s.owner_id = auth.uid()))
  );
$$;

grant execute on function public.owns_shop(uuid) to anon, authenticated;
grant execute on function public.in_conversation(uuid) to anon, authenticated;

-- Enable RLS on every marketplace table.
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reels enable row level security;
alter table public.reel_likes enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.vendor_applications enable row level security;
alter table public.shop_follows enable row level security;
alter table public.near_you_listings enable row level security;
alter table public.notifications enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- shops ---------------------------------------------------------------------
drop policy if exists shops_read on public.shops;
create policy shops_read on public.shops for select using (status = 'active' or owner_id = auth.uid());
drop policy if exists shops_insert on public.shops;
create policy shops_insert on public.shops for insert with check (owner_id = auth.uid());
drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops for update using (owner_id = auth.uid());
drop policy if exists shops_delete on public.shops;
create policy shops_delete on public.shops for delete using (owner_id = auth.uid());

-- products ------------------------------------------------------------------
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (is_active = true or public.owns_shop(shop_id));
drop policy if exists products_write on public.products;
create policy products_write on public.products for all using (public.owns_shop(shop_id)) with check (public.owns_shop(shop_id));

-- orders --------------------------------------------------------------------
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select using (buyer_id = auth.uid() or public.owns_shop(shop_id));
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert with check (buyer_id = auth.uid());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update using (buyer_id = auth.uid() or public.owns_shop(shop_id));

-- order_items ---------------------------------------------------------------
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.owns_shop(o.shop_id)))
);
drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
);

-- conversations -------------------------------------------------------------
drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations for select using (buyer_id = auth.uid() or public.owns_shop(shop_id));
drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert with check (buyer_id = auth.uid());
drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update using (buyer_id = auth.uid() or public.owns_shop(shop_id));

-- chat_messages -------------------------------------------------------------
drop policy if exists chat_read on public.chat_messages;
create policy chat_read on public.chat_messages for select using (public.in_conversation(conversation_id));
drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages for insert with check (public.in_conversation(conversation_id) and sender_id = auth.uid());

-- reels ---------------------------------------------------------------------
drop policy if exists reels_read on public.reels;
create policy reels_read on public.reels for select using (true);
drop policy if exists reels_write on public.reels;
create policy reels_write on public.reels for all using (public.owns_shop(shop_id)) with check (public.owns_shop(shop_id));

-- reel_likes ----------------------------------------------------------------
drop policy if exists reel_likes_read on public.reel_likes;
create policy reel_likes_read on public.reel_likes for select using (true);
drop policy if exists reel_likes_insert on public.reel_likes;
create policy reel_likes_insert on public.reel_likes for insert with check (user_id = auth.uid());
drop policy if exists reel_likes_delete on public.reel_likes;
create policy reel_likes_delete on public.reel_likes for delete using (user_id = auth.uid());

-- reviews -------------------------------------------------------------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert with check (buyer_id = auth.uid());

-- reports -------------------------------------------------------------------
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select using (reporter_id = auth.uid());
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());

-- vendor_applications -------------------------------------------------------
drop policy if exists vendor_apps_read on public.vendor_applications;
create policy vendor_apps_read on public.vendor_applications for select using (user_id = auth.uid());
drop policy if exists vendor_apps_insert on public.vendor_applications;
create policy vendor_apps_insert on public.vendor_applications for insert with check (user_id = auth.uid());
drop policy if exists vendor_apps_update on public.vendor_applications;
create policy vendor_apps_update on public.vendor_applications for update using (user_id = auth.uid());

-- shop_follows --------------------------------------------------------------
drop policy if exists follows_read on public.shop_follows;
create policy follows_read on public.shop_follows for select using (true);
drop policy if exists follows_insert on public.shop_follows;
create policy follows_insert on public.shop_follows for insert with check (follower_id = auth.uid());
drop policy if exists follows_delete on public.shop_follows;
create policy follows_delete on public.shop_follows for delete using (follower_id = auth.uid());

-- near_you_listings ---------------------------------------------------------
drop policy if exists listings_read on public.near_you_listings;
create policy listings_read on public.near_you_listings for select using (true);
drop policy if exists listings_insert on public.near_you_listings;
create policy listings_insert on public.near_you_listings for insert with check (user_id = auth.uid());
drop policy if exists listings_update on public.near_you_listings;
create policy listings_update on public.near_you_listings for update using (user_id = auth.uid());
drop policy if exists listings_delete on public.near_you_listings;
create policy listings_delete on public.near_you_listings for delete using (user_id = auth.uid());

-- notifications -------------------------------------------------------------
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select using (user_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update using (user_id = auth.uid());
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert with check (user_id = auth.uid());

-- push_subscriptions (pre-existing table, reused) ---------------------------
drop policy if exists push_sub_read on public.push_subscriptions;
create policy push_sub_read on public.push_subscriptions for select using (user_id = auth.uid());
drop policy if exists push_sub_insert on public.push_subscriptions;
create policy push_sub_insert on public.push_subscriptions for insert with check (user_id = auth.uid());
drop policy if exists push_sub_delete on public.push_subscriptions;
create policy push_sub_delete on public.push_subscriptions for delete using (user_id = auth.uid());
