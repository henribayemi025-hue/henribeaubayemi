-- BRANCHER SON ASSISTANT SUR LEGION (point 24 de Beau, 23/09): « brancher
-- Claude, Astra, ses propres outils ». Legion parle le protocole MCP
-- (fonction edge legion-mcp): un assistant (Claude, ChatGPT, Claude Code…)
-- lit les salons, les tâches, la feuille de route de l'entreprise, et peut
-- écrire dans un salon ou créer une tâche — au nom de la personne, avec ses
-- droits à elle, jamais plus.
--
-- La clé: un jeton personnel, montré une seule fois à la création, rangé
-- ici HACHÉ (sha256). Le jeton en clair n'est jamais en base. Révocable
-- d'un geste. Additif: une table, deux fonctions.

-- pgcrypto vit dans le schéma `extensions` (Supabase): on qualifie, parce que
-- les fonctions ci-dessous fixent search_path = public.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.legion_jetons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null default 'Mon assistant',
  hache text not null unique,
  cree_le timestamptz not null default now(),
  dernier_usage_le timestamptz,
  revoque_le timestamptz
);
comment on table public.legion_jetons is 'Jetons personnels pour brancher un assistant (MCP) sur Legion. Hachés; le clair n''est montré qu''une fois.';
alter table public.legion_jetons enable row level security;
drop policy if exists "jetons: les miens" on public.legion_jetons;
create policy "jetons: les miens" on public.legion_jetons for select using (user_id = auth.uid());
-- Ni insert ni update depuis l'application: les deux fonctions ci-dessous.

-- Crée un jeton et le rend EN CLAIR, une seule fois.
create or replace function public.legion_creer_jeton(p_nom text default 'Mon assistant')
returns text
language plpgsql security definer set search_path = public
as $$
declare v_clair text; v_actifs int;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select count(*) into v_actifs from legion_jetons where user_id = auth.uid() and revoque_le is null;
  if v_actifs >= 5 then raise exception 'trop_de_jetons' using errcode = 'P0001'; end if;
  v_clair := 'lg_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into legion_jetons (user_id, nom, hache)
  values (auth.uid(), left(coalesce(nullif(trim(p_nom), ''), 'Mon assistant'), 60), encode(extensions.digest(v_clair, 'sha256'), 'hex'));
  return v_clair;
end $$;
revoke all on function public.legion_creer_jeton(text) from public;
grant execute on function public.legion_creer_jeton(text) to authenticated;

create or replace function public.legion_revoquer_jeton(p_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update legion_jetons set revoque_le = now() where id = p_id and user_id = auth.uid() and revoque_le is null;
$$;
revoke all on function public.legion_revoquer_jeton(uuid) from public;
grant execute on function public.legion_revoquer_jeton(uuid) to authenticated;

-- Le serveur (service_role) retrouve la personne derrière un jeton, et note
-- l'usage. Rien pour l'application.
create or replace function public.legion_jeton_user(p_clair text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_user uuid;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id, user_id into v_id, v_user from legion_jetons
   where hache = encode(extensions.digest(p_clair, 'sha256'), 'hex') and revoque_le is null;
  if v_id is null then return null; end if;
  update legion_jetons set dernier_usage_le = now() where id = v_id;
  return v_user;
end $$;
revoke all on function public.legion_jeton_user(text) from public;
grant execute on function public.legion_jeton_user(text) to service_role;
