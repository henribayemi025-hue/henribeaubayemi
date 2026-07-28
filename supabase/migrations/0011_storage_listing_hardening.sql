-- Le bucket `photos` (hérité, inutilisé par Finjaro) exposait une policy SELECT
-- large sur storage.objects: n'importe qui pouvait LISTER tous les fichiers.
-- Un bucket public sert ses objets via /object/public/ sans cette policy, donc
-- la retirer casse l'énumération sans casser l'affichage des images.
drop policy if exists "Lecture publique photos" on storage.objects;
