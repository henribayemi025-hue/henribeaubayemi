-- Photos et vocaux des conversations : dossier « chat » PRIVÉ (audit C-3, lot 1).
--
-- Avant : dossier public, et la règle finjaro_public_read laissait même un
-- visiteur sans compte LISTER le dossier d'une personne et demander un lien
-- signé. Mesuré le 01/10 : photo et vocal ouverts sans compte (200), 6
-- fichiers listés dans le dossier d'un compte.
--
-- Après : seuls les deux participants de la conversation où le fichier a été
-- envoyé, la personne qui l'a déposé, et l'équipe Finjaro (is_admin) peuvent
-- le lire. Le site les ouvre par lien signé d'une heure (src/lib/fichierPrive.js).
--
-- Les messages gardent le CHEMIN du fichier (vérifié : aucune adresse
-- complète en base), donc aucune donnée à réécrire.

update storage.buckets set public = false where id = 'chat';

-- La lecture publique ne garde que ce qui est fait pour être vu de tous.
drop policy if exists finjaro_public_read on storage.objects;
create policy finjaro_public_read on storage.objects for select to public
  using (bucket_id = any (array['products', 'shops', 'reels', 'listings']));

-- Qui peut lire un fichier de conversation. SECURITY DEFINER : la règle de
-- stockage ne dépend pas des règles des tables de messages, et la fonction
-- ne répond que pour la personne connectée (auth.uid()).
create or replace function public.peut_lire_fichier_chat(p_chemin text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    split_part(p_chemin, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.chat_messages m
      join public.conversations c on c.id = m.conversation_id
      left join public.shops s on s.id = c.shop_id
      where (m.image_url = p_chemin or m.audio_url = p_chemin)
        and (c.buyer_id = auth.uid() or s.owner_id = auth.uid())
    )
    or exists (
      select 1
      from public.direct_messages d
      join public.direct_conversations dc on dc.id = d.conversation_id
      where (d.image_url = p_chemin or d.audio_url = p_chemin)
        and auth.uid() in (dc.user_a_id, dc.user_b_id)
    )
    or public.is_admin()
  );
$$;

revoke all on function public.peut_lire_fichier_chat(text) from public, anon;
grant execute on function public.peut_lire_fichier_chat(text) to authenticated;

drop policy if exists chat_lecture_participants on storage.objects;
create policy chat_lecture_participants on storage.objects for select to authenticated
  using (bucket_id = 'chat' and public.peut_lire_fichier_chat(name));
