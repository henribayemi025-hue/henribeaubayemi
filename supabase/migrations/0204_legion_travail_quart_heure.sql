-- Léo : le travail urgent n'attend plus le passage suivant (Beau, 25/09 :
-- « c'est toi qui relances ; ils ne doivent pas être bloqués »).
--
-- Jusqu'ici l'équipe passait trois fois par jour (6 h 30, 10 h 30, 14 h 30
-- UTC) : une tâche urgente donnée le soir attendait le lendemain matin. Toutes
-- les 15 minutes, legion-travail reçoit maintenant { urgences: true } : seuls
-- les agents qui ont une tâche urgente ou haute pas encore rendue travaillent
-- (pas de plan, pas d'initiative, trois essais au plus par tâche). Une
-- entreprise sans tâche pressée ne coûte rien.
--
-- Additif : une fonction et une tâche cron, rien d'autre.

create or replace function public.lancer_legion_urgences()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare jeton text; cle text;
begin
  -- Rien à faire : on n'appelle même pas la fonction.
  if not exists (
    select 1 from public.legion_messages
    where genre = 'tache' and termine_le is null
      and meta->>'priorite' in ('urgente', 'haute')
      and coalesce(meta->>'statut', '') not in ('fait', 'revue')
      and meta->>'livre_le' is null
      and coalesce((meta->>'essais')::int, 0) < 3
      and created_at > now() - interval '30 days'
  ) then return; end if;
  select value into jeton from public.app_secrets where name = 'legion_travail';
  if jeton is null then return; end if;
  -- La clé publique du projet est reprise de lancer_legion_travail (déjà en
  -- base) : aucune clé n'est recopiée dans ce fichier.
  select substring(pg_get_functiondef('public.lancer_legion_travail()'::regprocedure) from 'Bearer ([A-Za-z0-9._-]+)') into cle;
  if cle is null then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-travail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cle,
      'x-finjaro-token', jeton),
    body := '{"urgences": true}'::jsonb,
    timeout_milliseconds := 300000
  );
end $$;
revoke all on function public.lancer_legion_urgences() from public, anon, authenticated;

select cron.schedule('legion-travail-urgences', '*/15 * * * *', 'select public.lancer_legion_urgences()');
