-- Finjaro — performance RLS: `auth.uid()` évalué une fois par requête au lieu
-- d'une fois par LIGNE.
--
-- CONTEXTE
-- Chaque règle RLS ci-dessous appelait `auth.uid()` en clair dans son USING/
-- WITH CHECK. PostgreSQL ne met en cache le résultat d'une fonction que si
-- elle est enveloppée dans un sous-select — sinon il la ré-exécute pour
-- CHAQUE ligne examinée par la requête. Avec 114 articles ça ne se voit pas;
-- avec des milliers de lignes et du trafic réel, ça devient le principal coût
-- CPU des lectures (`orders_read`, `products` via les fonctions imbriquées,
-- etc.). C'est le point noté dans MIGRATION_NOTES.md: « à faire avant du vrai
-- trafic ».
--
-- CORRECTIF
-- `auth.uid()` -> `(select auth.uid())` dans chaque USING/WITH CHECK. Le
-- comportement de sécurité est STRICTEMENT identique — seule change la façon
-- dont Postgres planifie l'appel (initplan mis en cache une fois, au lieu
-- d'un appel par ligne). Aucune donnée accessible avant ne devient
-- inaccessible, et inversement.
--
-- PÉRIMÈTRE
-- Ce projet Supabase héberge AUSSI les tables d'une autre application
-- (accounts, boutiques, budget_entries, njangis, projects, shared_spaces,
-- space_*, produits, directory_listings…) — voir MIGRATION_NOTES.md §2.
-- Cette migration ne touche QUE les tables de Finjaro. Les fonctions
-- `owns_shop()`, `is_admin()`, `in_conversation()` sont déjà STABLE et déjà
-- planifiées correctement par Postgres — elles ne sont pas modifiées ici,
-- seuls les appels bruts à `auth.uid()` le sont.

alter policy chat_insert on public.chat_messages
  with check (in_conversation(conversation_id) and (sender_id = (select auth.uid())));

alter policy commentaires_delete on public.commentaires
  using (((select auth.uid()) is not null) and (auteur = ((select auth.uid()))::text));
alter policy commentaires_insert on public.commentaires
  with check ((select auth.uid()) is not null);

alter policy conversations_insert on public.conversations
  with check (buyer_id = (select auth.uid()));
alter policy conversations_read on public.conversations
  using ((buyer_id = (select auth.uid())) or owns_shop(shop_id));
alter policy conversations_update on public.conversations
  using ((buyer_id = (select auth.uid())) or owns_shop(shop_id));

alter policy demandes_insert on public.demandes_service
  with check (acheteur_id = (select auth.uid()));
alter policy demandes_update on public.demandes_service
  using (acheteur_id = (select auth.uid()));

alter policy events_insert on public.events
  with check ((user_id is null) or (user_id = (select auth.uid())));
alter policy events_read on public.events
  using ((select auth.uid()) = user_id);

alter policy follows_delete on public.follows
  using (follower_id = (select auth.uid()));
alter policy follows_insert on public.follows
  with check (follower_id = (select auth.uid()));

alter policy messages_insert on public.messages
  with check (acheteur_id = (select auth.uid()));
alter policy messages_read on public.messages
  using (acheteur_id = (select auth.uid()));

alter policy listings_delete on public.near_you_listings
  using (user_id = (select auth.uid()));
alter policy listings_insert on public.near_you_listings
  with check (user_id = (select auth.uid()));
alter policy listings_update on public.near_you_listings
  using (user_id = (select auth.uid()));

alter policy notifications_insert on public.notifications
  with check (user_id = (select auth.uid()));
alter policy notifications_read on public.notifications
  using (user_id = (select auth.uid()));
alter policy notifications_update on public.notifications
  using (user_id = (select auth.uid()));

alter policy offres_insert on public.offres_service
  with check ((select auth.uid()) is not null);

alter policy order_items_insert on public.order_items
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.buyer_id = (select auth.uid())
  ));
alter policy order_items_read on public.order_items
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.buyer_id = (select auth.uid()) or owns_shop(o.shop_id))
  ));

alter policy orders_insert on public.orders
  with check (buyer_id = (select auth.uid()));
alter policy orders_read on public.orders
  using ((buyer_id = (select auth.uid())) or owns_shop(shop_id) or is_admin());
alter policy orders_update on public.orders
  using ((buyer_id = (select auth.uid())) or owns_shop(shop_id));

alter policy "own profile" on public.profiles
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy profiles_insert on public.profiles
  with check (id = (select auth.uid()));
alter policy profiles_update on public.profiles
  using (id = (select auth.uid()));

alter policy push_sub_delete on public.push_subscriptions
  using (user_id = (select auth.uid()));
alter policy push_sub_insert on public.push_subscriptions
  with check (user_id = (select auth.uid()));
alter policy push_sub_read on public.push_subscriptions
  using (user_id = (select auth.uid()));

alter policy reel_comments_insert on public.reel_comments
  with check (user_id = (select auth.uid()));

alter policy reel_likes_delete on public.reel_likes
  using (user_id = (select auth.uid()));
alter policy reel_likes_insert on public.reel_likes
  with check (user_id = (select auth.uid()));

alter policy reports_insert on public.reports
  with check (reporter_id = (select auth.uid()));
alter policy reports_read on public.reports
  using (reporter_id = (select auth.uid()));

alter policy reviews_insert on public.reviews
  with check (buyer_id = (select auth.uid()));

alter policy follows_delete on public.shop_follows
  using (follower_id = (select auth.uid()));
alter policy follows_insert on public.shop_follows
  with check (follower_id = (select auth.uid()));

alter policy shops_delete on public.shops
  using (owner_id = (select auth.uid()));
alter policy shops_insert on public.shops
  with check (owner_id = (select auth.uid()));
alter policy shops_read on public.shops
  using ((status = 'active'::text) or (owner_id = (select auth.uid())));
alter policy shops_update on public.shops
  using (owner_id = (select auth.uid()));

alter policy vendor_apps_insert on public.vendor_applications
  with check (user_id = (select auth.uid()));
alter policy vendor_apps_read on public.vendor_applications
  using (user_id = (select auth.uid()));
alter policy vendor_apps_update on public.vendor_applications
  using (user_id = (select auth.uid()));
