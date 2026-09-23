-- LEGION — ce que les agents entendent et lisent (23/09).
--
-- 1. Les vocaux partent désormais en WAV (le format que le modèle comprend à
--    coup sûr; un vocal WebM arrivait chez l'agent sans être entendu).
-- 2. Beau, 23/09: « connecter mes agents avec Excel », « capable d'ouvrir
--    Excel et de le modifier ». Un salon accepte les fichiers Excel et CSV,
--    que les agents lisent et rendent modifiés.
-- On AJOUTE des types permis au dossier `legion`; aucun n'est retiré.
update storage.buckets
   set allowed_mime_types = (
     select array_agg(distinct t) from unnest(coalesce(allowed_mime_types, '{}') || array[
       'audio/wav', 'audio/x-wav', 'audio/wave',
       'text/csv', 'text/plain',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/vnd.ms-excel'
     ]) as t)
 where id = 'legion';
