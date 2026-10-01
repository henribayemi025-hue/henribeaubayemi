-- Fichiers des entreprises de Léo : dossier PRIVÉ « legion-prive » (audit C-2, lot 1).
--
-- Avant : documents, vocaux, photos et pièces jointes des salons, et ce que
-- les agents produisent (tableurs, fiches, visuels) allaient dans « legion »,
-- dossier PUBLIC : qui obtenait le lien lisait le fichier, sans compte et pour
-- toujours. « legion » reste public pour les seuls portraits des agents.
--
-- Après : un dossier privé, rangé par entreprise (<entreprise_id>/...). Seuls
-- ses membres le lisent et y déposent ; les fonctions passent par la clé de
-- service ; le site ouvre les fichiers par lien signé d'une heure.
-- Vaut pour TOUTES les entreprises de Léo, pas seulement Finjaro.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'legion-prive', 'legion-prive', false, file_size_limit, allowed_mime_types
from storage.buckets where id = 'legion'
on conflict (id) do update set public = false;

drop policy if exists legion_prive_lecture_membres on storage.objects;
create policy legion_prive_lecture_membres on storage.objects for select to authenticated
  using (
    bucket_id = 'legion-prive'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.legion_est_membre(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists legion_prive_depot_membres on storage.objects;
create policy legion_prive_depot_membres on storage.objects for insert to authenticated
  with check (
    bucket_id = 'legion-prive'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.legion_est_membre(((storage.foldername(name))[1])::uuid)
  );
