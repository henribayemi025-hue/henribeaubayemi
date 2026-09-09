-- Complément à 0099: la liste des conversations personnelles a besoin du
-- nom + avatar de PLUSIEURS interlocuteurs d'un coup — appeler
-- get_public_profile() une fois par ligne serait un aller-retour par
-- conversation. Même périmètre de données que get_public_profile: id,
-- nom, avatar, jamais plus.
create or replace function public.get_public_profiles(p_ids uuid[])
returns table(id uuid, name text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.avatar_url
  from public.profiles p
  where p.id = any(p_ids) and not coalesce(p.is_suspended, false);
$$;

revoke all on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
