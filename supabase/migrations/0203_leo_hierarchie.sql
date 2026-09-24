-- 0203 — Léo, une entreprise vivante : le chef direct et le grade de chaque
-- agent (Beau, 24/09 : « je veux une vraie entreprise, avec des managers,
-- des subordonnés, des stagiaires, des alternants » ; « oui pour les
-- colonnes », 25/09).
--
-- ADDITIVE : deux colonnes nouvelles, vides par défaut, un index, une
-- vérification. Aucune donnée existante n'est modifiée. Seule la table des
-- agents de Léo est touchée ; Finjaro Accounting ne la lit pas.

alter table public.legion_agents add column if not exists chef_id uuid references public.legion_agents(id) on delete set null;
alter table public.legion_agents add column if not exists grade text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'legion_agents_grade_check') then
    alter table public.legion_agents add constraint legion_agents_grade_check
      check (grade is null or grade in ('direction', 'manager', 'confirme', 'junior', 'alternant', 'stagiaire'));
  end if;
end $$;

create index if not exists legion_agents_chef_idx on public.legion_agents (chef_id);

-- Un chef est un agent de la MÊME entreprise, et personne n'est son propre chef.
create or replace function public.legion_agents_chef_valide() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.chef_id is not null and (new.chef_id = new.id or not exists (
    select 1 from public.legion_agents c where c.id = new.chef_id and c.entreprise_id = new.entreprise_id
  )) then
    raise exception 'Le chef doit être un autre agent de la même entreprise.';
  end if;
  return new;
end $$;

drop trigger if exists legion_agents_chef_valide on public.legion_agents;
create trigger legion_agents_chef_valide before insert or update of chef_id on public.legion_agents
  for each row execute function public.legion_agents_chef_valide();

comment on column public.legion_agents.chef_id is 'Chef direct (un autre agent de la même entreprise) — 0203';
comment on column public.legion_agents.grade is 'direction | manager | confirme | junior | alternant | stagiaire — 0203';
