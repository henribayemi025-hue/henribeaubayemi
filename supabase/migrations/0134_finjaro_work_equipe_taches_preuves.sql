-- Finjaro Work — l'équipe d'une boutique, ses tâches, et la PREUVE.
--
-- Décidé par Beau le 22/09, après une recherche sur ce qui existe. Le marché
-- des « ton business dans WhatsApp » est plein (41Plus, Selloops, Kipa,
-- Queek, VONO, Ovira…). Ce qui n'existe pas, c'est l'équipe: Teams coûte
-- 6 000 à 10 000 FCFA par personne et par mois, demande un ordinateur et une
-- formation. Personne ne le prend.
--
-- Le manque, dit par ceux qui le vivent: « WhatsApp donne la sensation de
-- diriger sans la substance. Un message envoyé n'est pas une tâche assignée.
-- Une photo reçue n'est pas un travail vérifié. » Un responsable passe 2 h 18
-- par jour à courir après des confirmations dans des groupes.
--
-- Donc: WhatsApp reste pour PARLER. Finjaro Work est ce qui PROUVE.
--
--   une tâche assignée → quelqu'un la fait → une preuve datée et située
--   → le registre, qui reste quand la personne part.
--
-- Trois tables, rien de plus pour commencer. Additif: aucune table existante
-- n'est touchée, aucune colonne supprimée ou renommée.
--
-- ⚠️ Ce ne sont PAS les tables d'Accounting. `finia_workspaces` et
-- `finia_members` appartiennent à l'autre application et ne se mélangent pas
-- avec celles-ci (règle du CLAUDE.md partagé). Une équipe Work est attachée à
-- une BOUTIQUE de la place de marché.

-- ---------------------------------------------------------------------------
-- 1. Qui travaille dans une boutique
-- ---------------------------------------------------------------------------
create table if not exists public.work_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- `owner` est la personne à qui appartient la boutique; `manager` peut
  -- assigner; `staff` exécute et fournit la preuve.
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists work_members_shop_idx on public.work_members(shop_id);
create index if not exists work_members_user_idx on public.work_members(user_id);

comment on table public.work_members is
  'Finjaro Work: qui travaille dans une boutique, et à quel titre. Distinct de finia_members, qui appartient à Accounting.';

-- ---------------------------------------------------------------------------
-- 2. Les tâches
-- ---------------------------------------------------------------------------
create table if not exists public.work_tasks (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  details text,
  -- Une tâche sans personne n'est pas une tâche, c'est un souhait. On
  -- l'autorise quand même à la création rapide, mais l'écran la réclame.
  assignee_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create index if not exists work_tasks_shop_idx on public.work_tasks(shop_id, status, due_at);
create index if not exists work_tasks_assignee_idx on public.work_tasks(assignee_id, status);

comment on table public.work_tasks is
  'Finjaro Work: une tâche assignée à quelqu''un, avec une échéance et un statut.';

-- ---------------------------------------------------------------------------
-- 3. La preuve — le cœur du produit
-- ---------------------------------------------------------------------------
-- Une photo sans métadonnées n'est pas une preuve, ce sont des pixels. Elle
-- montre une activité, pas une exécution. On garde donc l'heure d'écriture
-- côté SERVEUR (`created_at`, jamais fournie par le téléphone) et, quand le
-- navigateur l'accorde, la position.
--
-- Une preuve ne se modifie pas et ne se supprime pas: c'est ce qui la rend
-- utile le jour où quelqu'un conteste. Les règles d'accès plus bas
-- n'accordent aucun `update` ni `delete`, à personne.
create table if not exists public.work_proofs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.work_tasks(id) on delete cascade,
  by_user uuid not null references auth.users(id),
  photo_url text,
  note text,
  lat double precision,
  lng double precision,
  -- Ce que le téléphone a dit de sa propre position: utile, pas fiable.
  accuracy_m double precision,
  created_at timestamptz not null default now(),
  -- Une preuve vide ne prouve rien.
  check (photo_url is not null or btrim(coalesce(note, '')) <> '')
);

create index if not exists work_proofs_task_idx on public.work_proofs(task_id, created_at);

comment on table public.work_proofs is
  'Finjaro Work: la preuve d''une tâche faite — photo, mot, heure du SERVEUR et position si accordée. Ne se modifie jamais.';

-- ---------------------------------------------------------------------------
-- 4. Qui a le droit de quoi
-- ---------------------------------------------------------------------------
-- ⚠️ Ces deux fonctions sont appelées DANS les expressions de policies. Une
-- expression de policy s'évalue avec les droits de l'appelant: leur retirer
-- `execute` couperait chacun de ses propres données en croyant le protéger.
-- Elles restent donc ouvertes à `authenticated`, et c'est voulu — elles ne
-- disent à l'appelant que ce qui le concerne lui. (Leçon du 22/09, trouvée
-- par la session Accounting.)
create or replace function public.work_role(p_shop_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.shops s where s.id = p_shop_id and s.owner_id = auth.uid()) then 'owner'
    else (select m.role from public.work_members m
           where m.shop_id = p_shop_id and m.user_id = auth.uid())
  end;
$$;

create or replace function public.work_is_member(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.work_role(p_shop_id) is not null;
$$;

create or replace function public.work_peut_assigner(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.work_role(p_shop_id) in ('owner', 'manager');
$$;

alter table public.work_members enable row level security;
alter table public.work_tasks   enable row level security;
alter table public.work_proofs  enable row level security;

-- L'équipe se voit elle-même. Seul qui peut assigner peut ajouter ou retirer.
drop policy if exists work_members_select on public.work_members;
create policy work_members_select on public.work_members
  for select using (public.work_is_member(shop_id));

drop policy if exists work_members_insert on public.work_members;
create policy work_members_insert on public.work_members
  for insert with check (public.work_peut_assigner(shop_id));

drop policy if exists work_members_delete on public.work_members;
create policy work_members_delete on public.work_members
  for delete using (public.work_peut_assigner(shop_id));

-- Les tâches: toute l'équipe les voit — une équipe qui ne voit pas ce que
-- font les autres retombe sur le groupe WhatsApp.
drop policy if exists work_tasks_select on public.work_tasks;
create policy work_tasks_select on public.work_tasks
  for select using (public.work_is_member(shop_id));

drop policy if exists work_tasks_insert on public.work_tasks;
create policy work_tasks_insert on public.work_tasks
  for insert with check (public.work_peut_assigner(shop_id) and created_by = auth.uid());

-- Qui assigne modifie tout; la personne assignée ne peut qu'avancer SA tâche.
drop policy if exists work_tasks_update on public.work_tasks;
create policy work_tasks_update on public.work_tasks
  for update using (public.work_peut_assigner(shop_id) or assignee_id = auth.uid())
  with check (public.work_peut_assigner(shop_id) or assignee_id = auth.uid());

drop policy if exists work_tasks_delete on public.work_tasks;
create policy work_tasks_delete on public.work_tasks
  for delete using (public.work_peut_assigner(shop_id));

-- La preuve: l'équipe la lit, la personne concernée la pose. Aucune règle
-- d'écriture après coup — pas de update, pas de delete, pour personne.
drop policy if exists work_proofs_select on public.work_proofs;
create policy work_proofs_select on public.work_proofs
  for select using (exists (
    select 1 from public.work_tasks t
     where t.id = task_id and public.work_is_member(t.shop_id)
  ));

drop policy if exists work_proofs_insert on public.work_proofs;
create policy work_proofs_insert on public.work_proofs
  for insert with check (
    by_user = auth.uid()
    and exists (
      select 1 from public.work_tasks t
       where t.id = task_id
         and (t.assignee_id = auth.uid() or public.work_peut_assigner(t.shop_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 5. `done_at` est posé par le SERVEUR
-- ---------------------------------------------------------------------------
-- Sinon la date de fin est celle que le téléphone veut bien annoncer, et le
-- registre ne vaut plus rien.
create or replace function public.work_marquer_fin()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.done_at := now();
  elsif new.status <> 'done' then
    new.done_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_work_marquer_fin on public.work_tasks;
create trigger trg_work_marquer_fin
  before update on public.work_tasks
  for each row execute function public.work_marquer_fin();

-- ---------------------------------------------------------------------------
-- 6. Le propriétaire d'une boutique est membre de son équipe, sans rien faire
-- ---------------------------------------------------------------------------
insert into public.work_members (shop_id, user_id, role)
select s.id, s.owner_id, 'owner'
from public.shops s
where s.owner_id is not null
on conflict (shop_id, user_id) do nothing;

create or replace function public.work_inscrire_proprietaire()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.work_members (shop_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (shop_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_work_inscrire_proprietaire on public.shops;
create trigger trg_work_inscrire_proprietaire
  after insert on public.shops
  for each row execute function public.work_inscrire_proprietaire();
