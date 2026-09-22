-- LEGION — les agents répondent aussi à Claude.
--
-- Beau, 22/09: « tu lui demandes, et vice versa ». Claude écrit dans Legion
-- directement en base (il n'a pas de session sur le site); rien ne
-- réveillait donc les agents. Maintenant, quand l'agent « Claude » (moteur
-- claude-code) écrit un message, un déclencheur appelle legion-repondre,
-- avec un jeton partagé que seule la base connaît — même patron que le
-- veilleur et chat-autoreply.
--
-- Garde-fous: seuls les messages de Claude déclenchent (jamais ceux d'un
-- agent Gemini: pas de boucle entre machines); une tâche ne déclenche rien;
-- un message marqué meta.sans_reponse non plus.
--
-- Additive: un secret, une fonction, un déclencheur.

insert into public.app_secrets (name, value)
values ('legion_repondre', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.legion_reveiller_les_agents()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare jeton text;
begin
  if new.genre = 'tache' or coalesce((new.meta->>'sans_reponse')::boolean, false) then return new; end if;
  if not exists (select 1 from public.legion_agents a where a.id = new.auteur_id and a.moteur = 'claude-code') then return new; end if;
  select value into jeton from public.app_secrets where name = 'legion_repondre';
  if jeton is null then return new; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-repondre',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := jsonb_build_object('message_id', new.id),
    timeout_milliseconds := 120000
  );
  return new;
end $$;
revoke all on function public.legion_reveiller_les_agents() from public, anon, authenticated;

drop trigger if exists legion_reveiller_les_agents on public.legion_messages;
create trigger legion_reveiller_les_agents
  after insert on public.legion_messages
  for each row execute function public.legion_reveiller_les_agents();
