-- Le rapport du soir (legion-rapport) fait sonner le téléphone du fondateur
-- quand il arrive seul. Pas quand on vient de le demander: on est déjà dans
-- l'application. Le reste de legion_prevenir est inchangé.
create or replace function public.legion_prevenir()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  qui text; salon text; proprio uuid; sonne boolean;
begin
  sonne := new.genre in ('question', 'decision', 'proposition', 'reunion')
        or (new.genre = 'tache' and new.assigne_a is not null
            and exists (select 1 from public.legion_agents a where a.id = new.assigne_a and a.user_id is not null))
        or (new.genre = 'info' and new.meta ? 'rapport'
            and not coalesce((new.meta->'rapport'->>'demande')::boolean, false));
  if not sonne or new.user_id is not null then return new; end if;

  select a.nom into qui from public.legion_agents a where a.id = new.auteur_id;
  select c.nom into salon from public.legion_canaux c where c.id = new.canal_id;
  select e.owner_id into proprio from public.legion_entreprises e where e.id = new.entreprise_id;

  perform public.push_notify(
    proprio,
    coalesce(qui, '?') || ' - ' || coalesce(salon, '?'),
    left(new.texte, 140),
    '/legion/' || new.entreprise_id || '?canal=' || new.canal_id,
    'legion-' || new.canal_id
  );
  return new;
end;
$$;
