-- Messages vocaux (migration 0101) rejetés en réalité: le bucket 'chat'
-- n'acceptait que des images (migration 0088) — Beau, en testant: « mime
-- type audio/webm is not supported ». Additif: on ÉLARGIT la liste, jamais
-- on ne retire les types image déjà autorisés.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/avif','image/gif',
  -- webm/opus (Chrome/Android), mp4/aac (Safari/iOS), ogg (Firefox) —
  -- les trois familles que MediaRecorder produit selon le navigateur.
  'audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/aac'
]
where id = 'chat';
