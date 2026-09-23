-- LEGION — le rapport du soir, le résumé de la semaine, le rapport de
-- transparence du mois (fonction legion-rapport, 23/09).
--
-- Additive: un jeton pour la tâche planifiée, une fonction qui la lance, deux
-- tâches cron, et le nom de la fonction dans la liste des coûts.

insert into public.app_secrets (name, value)
values ('legion_rapport', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_legion_rapport(p_mode text default 'soir')
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_rapport';
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-rapport',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := jsonb_build_object('mode', coalesce(p_mode, 'soir')),
    timeout_milliseconds := 300000
  );
end $$;
revoke all on function public.lancer_legion_rapport(text) from public, anon, authenticated;

-- 17 h UTC: 19 h à Paris l'été, 18 h à Douala. Le vendredi, la fonction fait
-- d'elle-même le résumé de la semaine. Le 1er du mois à 6 h 15 UTC, le rapport
-- de transparence du mois écoulé.
select cron.unschedule('legion-rapport-soir') where exists (select 1 from cron.job where jobname = 'legion-rapport-soir');
select cron.unschedule('legion-rapport-mois') where exists (select 1 from cron.job where jobname = 'legion-rapport-mois');
select cron.schedule('legion-rapport-soir', '0 17 * * *', $$select public.lancer_legion_rapport('soir')$$);
select cron.schedule('legion-rapport-mois', '15 6 1 * *', $$select public.lancer_legion_rapport('mois')$$);

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array[
  'finou_chat', 'miroir_ia',
  'legion_repondre', 'legion_competences', 'legion_portrait', 'legion_se_choisir', 'legion_veilleur',
  'legion_travail', 'legion_modele', 'traduire_fiche',
  'legion_reunion', 'legion_renfort', 'legion_documents', 'legion_rapport',
  'vendor_copilot', 'chat-autoreply', 'troc_eval', 'chat_moderation_sweep', 'finou_vision', 'kyc_ocr'
]));
