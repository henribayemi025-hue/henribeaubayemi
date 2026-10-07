-- La part de Finjaro Learn dans l'IA gratuite de Cloudflare.
--
-- Beau, 07/10 : « partout il doit y avoir les chaînes : Cloudflare gratuit,
-- Google gratuit, ensuite les modèles augmentent comme avec Léo ». Le prof de
-- Learn (learn-tutor) ne passait que par la clé Gemini payante, à sec : la
-- question de Beau est restée sans réponse (502, 07/10 11h58 UTC).
--
-- On ajoute une part « learn » de 600 neurones par jour (une quinzaine de
-- réponses du prof). Les parts de Léo (6 000) et de Finia (2 000) ne bougent
-- pas. Le compteur commun (ia_gratuite_reserver, 8 000) reste la vraie limite
-- et empêche toujours de dépasser la part gratuite de Cloudflare : rien n'est
-- facturé, quoi qu'il arrive.
--
-- Additif : seule la table des plafonds par application gagne une ligne.

create or replace function public.ia_gratuite_plafond_app(p_app text)
returns integer
language sql
immutable
set search_path to ''
as $$ select case p_app when 'leo' then 6000 when 'finia' then 2000 when 'learn' then 600 else 0 end; $$;

revoke all on function public.ia_gratuite_plafond_app(text) from public, anon, authenticated;
grant execute on function public.ia_gratuite_plafond_app(text) to service_role;
