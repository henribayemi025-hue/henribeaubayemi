-- Finjaro — make Storage write policies robust.
-- Every client upload writes to a `<auth.uid()>/…` folder (products, shops,
-- reels, listings, chat, ids). Enforce ownership via the path prefix rather
-- than storage.objects.owner, which can be unset during the INSERT check.

drop policy if exists finjaro_authed_upload on storage.objects;
drop policy if exists finjaro_owner_update on storage.objects;
drop policy if exists finjaro_owner_delete on storage.objects;
drop policy if exists finjaro_ids_rw on storage.objects;

-- Uploads to public media buckets, restricted to the user's own folder.
create policy finjaro_authed_upload on storage.objects for insert to authenticated
  with check (
    bucket_id in ('products','shops','reels','listings','chat')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners manage their own objects across all Finjaro buckets (by path prefix).
create policy finjaro_owner_update on storage.objects for update to authenticated
  using (
    bucket_id in ('products','shops','reels','listings','chat','ids')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy finjaro_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id in ('products','shops','reels','listings','chat','ids')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Private ID documents: upload + read restricted to the owner's folder.
create policy finjaro_ids_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ids' and (storage.foldername(name))[1] = auth.uid()::text);
create policy finjaro_ids_read on storage.objects for select to authenticated
  using (bucket_id = 'ids' and (storage.foldername(name))[1] = auth.uid()::text);
