-- Finjaro — Supabase Storage buckets + policies.
-- Public buckets for user media (unguessable UUID paths); private bucket for ID docs.

insert into storage.buckets (id, name, public)
values
  ('products', 'products', true),
  ('shops', 'shops', true),
  ('reels', 'reels', true),
  ('listings', 'listings', true),
  ('chat', 'chat', true),
  ('ids', 'ids', false)
on conflict (id) do nothing;

-- Public read on public buckets.
drop policy if exists finjaro_public_read on storage.objects;
create policy finjaro_public_read on storage.objects for select
  using (bucket_id in ('products','shops','reels','listings','chat'));

-- Authenticated users can upload to the public media buckets.
drop policy if exists finjaro_authed_upload on storage.objects;
create policy finjaro_authed_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('products','shops','reels','listings','chat'));

-- Owners manage (update/delete) their own uploaded objects.
drop policy if exists finjaro_owner_update on storage.objects;
create policy finjaro_owner_update on storage.objects for update to authenticated
  using (owner = auth.uid());
drop policy if exists finjaro_owner_delete on storage.objects;
create policy finjaro_owner_delete on storage.objects for delete to authenticated
  using (owner = auth.uid());

-- Private ID documents: only the uploader can read/write.
drop policy if exists finjaro_ids_rw on storage.objects;
create policy finjaro_ids_rw on storage.objects for all to authenticated
  using (bucket_id = 'ids' and owner = auth.uid())
  with check (bucket_id = 'ids' and owner = auth.uid());
