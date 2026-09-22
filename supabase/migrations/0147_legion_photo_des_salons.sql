-- LEGION — une photo pour un salon.
--
-- Beau, 22/09: « une photo de profil pour la Direction, et moi aussi je
-- dois pouvoir mettre une photo si je veux ». Sa photo à lui va dans sa
-- propre fiche (legion_agents.avatar_url, qui existe déjà); celle d'un
-- salon manquait. Le fichier va dans le rangement `legion`, sous le dossier
-- de l'entreprise, comme les photos du chat.
--
-- Additive: une colonne. Rien de retiré.

alter table public.legion_canaux add column if not exists image_url text;
