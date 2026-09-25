-- « voir_ecran » des agents (25/09) : le Worker de l'atelier ouvre une page
-- publique dans un vrai navigateur quand une fonction Supabase le lui
-- demande avec le jeton du travail des agents. Le Worker n'a ni ce jeton ni
-- la clé de service : il demande seulement à la base « ce jeton est-il le
-- bon ? ». Réponse oui / non, rien d'autre ne sort. Additif.

create or replace function public.legion_jeton_travail_valide(p_jeton text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(length(p_jeton) >= 32 and exists (
    select 1 from public.app_secrets where name = 'legion_travail' and value = p_jeton
  ), false);
$$;

revoke all on function public.legion_jeton_travail_valide(text) from public;
grant execute on function public.legion_jeton_travail_valide(text) to anon, authenticated;
