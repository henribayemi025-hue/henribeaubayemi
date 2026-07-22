-- Finjaro — security hardening after advisor review.

-- 1) Trigger/helper SECURITY DEFINER functions should not be directly callable
--    by clients. owns_shop / in_conversation stay executable (used inside RLS).
revoke execute on function public.notify(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.refresh_shop_verified(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.on_chat_message() from public, anon, authenticated;
revoke execute on function public.on_order_created() from public, anon, authenticated;
revoke execute on function public.on_order_status() from public, anon, authenticated;
revoke execute on function public.on_reel_created() from public, anon, authenticated;
revoke execute on function public.on_review() from public, anon, authenticated;
revoke execute on function public.on_product_change() from public, anon, authenticated;
revoke execute on function public.on_shop_update() from public, anon, authenticated;
revoke execute on function public.on_follow_change() from public, anon, authenticated;
revoke execute on function public.on_report() from public, anon, authenticated;
revoke execute on function public.on_listing_created() from public, anon, authenticated;
revoke execute on function public.on_vendor_app_status() from public, anon, authenticated;

-- 2) profiles carries semi-private fields (phone). Restrict reads to signed-in
--    users instead of the world. Public catalogue pages read `shops`, not
--    `profiles`, so anonymous browsing is unaffected.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
