-- Trouvé en audit du 08/09 : quand une vendeuse répond à une relance
-- (Relance.jsx), rien ne prévient Beau — ni cloche, ni push, ni e-mail. Il
-- ne le découvre qu'en rouvrant l'onglet « répondu » d'AdminRelances à la
-- main. Or 0065_relances.sql dit explicitement que le but de la
-- fonctionnalité est que Beau « sache qui a répondu ».
create or replace function public.on_relance_reponse()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare nom text;
begin
  if new.reponse is distinct from old.reponse and new.reponse is not null then
    select coalesce(p.name, 'Une vendeuse') into nom from public.profiles p where p.id = new.user_id;
    perform public.alert_admins(
      'relance_reponse',
      nom || ' a répondu à une relance',
      new.reponse,
      '/?s=relances',
      'relance-reponse-' || new.id
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_relance_reponse on public.relances;
create trigger trg_relance_reponse
  after update on public.relances
  for each row execute function public.on_relance_reponse();
