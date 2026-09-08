-- Trouvé en audit du 08/09 : aucun bucket public n'avait de restriction de
-- type de fichier (allowed_mime_types). Le chemin d'upload est déjà limité
-- au dossier de l'utilisatrice elle-même (policy finjaro_authed_upload,
-- storage.foldername(name)[1] = auth.uid()) — ça, ce n'était PAS une faille
-- malgré ce que l'audit initial pensait — mais rien n'empêchait un compte
-- de déposer n'importe quel type de fichier (un SVG avec script embarqué,
-- par exemple) dans SON propre dossier d'un bucket public. Impact limité
-- (sous-domaine Supabase Storage, pas finjaro.net) mais coût de correction
-- nul : on restreint aux types réellement utilisés par bucket, mesurés en
-- base avant d'écrire cette migration.
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif']
  where id in ('products', 'shops', 'listings', 'ids', 'chat');

update storage.buckets set allowed_mime_types = array['video/mp4','video/quicktime','video/webm']
  where id = 'reels';

-- `photos` mélange déjà les deux (constaté en base : image/jpeg ET video/mp4).
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/quicktime']
  where id = 'photos';
