-- Rapport hebdomadaire « ce que les gens cherchent et ne trouvent pas ».
--
-- C'est le seul endroit de Finjaro où la donnée dit QUI recruter. Une
-- recherche sans résultat, c'est une cliente venue avec une intention
-- d'achat précise, à qui on n'a rien eu à vendre — et personne ne le voyait.
--
-- La lecture se fait sur events.meta->>'n' = 0. Les recherches enregistrées
-- avant l'ajout de ce compteur n'ont pas de `n`: elles sont donc ignorées
-- plutôt que comptées comme des échecs, ce qui gonflerait le rapport de
-- demandes qui ont peut-être très bien abouti.

-- L'identifiant de Beau vivait uniquement en dur dans le code des fonctions
-- edge; le SQL n'y avait pas accès. Il rejoint app_config, comme l'URL des
-- fonctions — un seul endroit à changer si le compte admin change un jour.
insert into public.app_config (key, value)
  values ('admin_user_id', to_jsonb('bffb724f-6652-4240-a6f7-6904369a1fd4'::text))
  on conflict (key) do nothing;

create or replace function public.report_unmet_demand()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  admin_id uuid;
  lignes text;
  total int;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  select value #>> '{}' into admin_id from public.app_config where key = 'admin_user_id';
  if base_url is null or base_url = '' or admin_id is null then
    return;
  end if;

  -- Une même personne qui retape trois fois « perruque » en cherchant compte
  -- pour UNE demande, pas trois: sinon un seul utilisateur tenace ferait
  -- passer son besoin pour une tendance de marché.
  with echecs as (
    select
      lower(btrim(e.meta->>'q')) as terme,
      coalesce(e.user_id::text, 'anon-' || e.id::text) as qui
    from public.events e
    where e.type = 'search'
      and e.created_at > now() - interval '7 days'
      and (e.meta->>'n') is not null
      and (e.meta->>'n')::int = 0
      and length(btrim(coalesce(e.meta->>'q', ''))) between 3 and 40
  ),
  classement as (
    select terme, count(distinct qui) as personnes
    from echecs
    group by terme
    order by personnes desc, terme
    limit 8
  )
  select
    string_agg(terme || ' (' || personnes || ')', ', ' order by personnes desc, terme),
    sum(personnes)
  into lignes, total
  from classement;

  -- Rien à signaler: on se tait. Une alerte hebdomadaire qui dit « rien »
  -- finit par ne plus être lue du tout, et le jour où elle dit quelque chose
  -- d'important, elle passe inaperçue.
  if lignes is null or total is null or total = 0 then
    return;
  end if;

  perform net.http_post(
    url := base_url || '/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', admin_id,
      'title', 'Finjaro — ' || total || ' recherches sans résultat',
      'body', 'Cette semaine: ' || lignes || '. Ce sont des vendeuses à recruter.',
      'url', '/admin',
      'tag', 'unmet-demand-' || to_char(now(), 'IYYY-IW')
    )
  );
end;
$function$;

revoke execute on function public.report_unmet_demand() from anon, authenticated;

-- Lundi 8h UTC (9h à Douala): la semaine écoulée est complète, et le rapport
-- arrive quand on peut encore agir dessus dans la semaine qui commence.
select cron.schedule(
  'finjaro-unmet-demand',
  '0 8 * * 1',
  $$select public.report_unmet_demand();$$
);
