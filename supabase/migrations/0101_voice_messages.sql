-- Messages vocaux — Beau: « tu peux pas aussi mettre les vocaux ? ».
-- Additif pur: une colonne de plus sur les deux tables de messages, même
-- bucket de stockage ('chat') que les photos, mêmes policies déjà en place.
alter table public.chat_messages add column audio_url text;
alter table public.direct_messages add column audio_url text;

comment on column public.chat_messages.audio_url is
  'Chemin dans le bucket de stockage "chat" — un message vocal, comme image_url pour une photo.';
comment on column public.direct_messages.audio_url is
  'Chemin dans le bucket de stockage "chat" — un message vocal, comme image_url pour une photo.';
