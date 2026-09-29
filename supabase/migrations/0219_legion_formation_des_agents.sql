-- LA FORMATION DES AGENTS — la mémoire de notre IA se remplit sans attendre
-- les 👍 (Beau, 29/09 : « je t'ai dit de former les agents… notre propre
-- IA »). Voir supabase/functions/legion-former.
--
-- Additif :
-- - legion_reponses_apprises.source : 'pouce' (validée d'un 👍, comme avant)
--   ou 'formation' (rédigée par le professeur, DeepSeek) ;
-- - message_id devient facultatif : une réponse de formation ne vient pas
--   d'un message du salon (la contrainte d'unicité reste pour les 👍) ;
-- - lancer_legion_former() : appelle la formation avec le jeton interne,
--   chaque matin à 04:50 UTC, pour les agents engagés la veille.
-- Rien de supprimé ni de renommé. Propre à Léo.

alter table public.legion_reponses_apprises
  add column if not exists source text not null default 'pouce';
alter table public.legion_reponses_apprises
  alter column message_id drop not null;

create or replace function public.lancer_legion_former()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_travail';
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-former',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end $function$;
revoke execute on function public.lancer_legion_former() from public, anon, authenticated;

select cron.schedule('legion-former', '50 4 * * *', 'select public.lancer_legion_former()');
