-- Des modèles d'entreprise pour n'importe quel secteur (fonction legion-modele).
--
-- Beau, 22/09: « comment c'est juste les 7 ici ? il y a des milliers de
-- services ». Le catalogue s'écrit désormais à la demande: qui l'a demandé,
-- avec quels mots, et le compteur de dépense le compte.

alter table public.studio_modeles add column if not exists cree_par uuid references auth.users(id) on delete set null;
alter table public.studio_modeles add column if not exists secteur_demande text;

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check
  check (fn = any (array['finou_chat', 'miroir_ia', 'legion_repondre', 'legion_competences', 'legion_portrait',
                         'legion_se_choisir', 'legion_veilleur', 'legion_travail', 'legion_modele']));

-- Remplir le catalogue en série, depuis la base (jeton legion_travail).
create or replace function public.legion_generer_modele(p_secteur text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_travail';
  if jeton is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-modele',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := jsonb_build_object('secteur', p_secteur),
    timeout_milliseconds := 150000
  );
end $$;
revoke all on function public.legion_generer_modele(text) from public, anon, authenticated;
