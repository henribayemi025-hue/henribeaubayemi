-- Inviter d'autres personnes dans une entreprise Legion (plan complet, B7).
--
-- Beau: « plusieurs humains peuvent travailler dessus, sur le même truc. »
-- La table des membres existait, l'invitation non. Désormais le
-- propriétaire crée un lien (valable 7 jours, une seule personne); celui
-- qui l'ouvre se connecte — ou crée son compte —, voit qui l'invite et où,
-- et rejoint: il devient membre, apparaît dans l'équipe sous son nom, lit
-- les salons et parle aux agents comme le fondateur.
--
-- Ce que ça n'ouvre pas: un membre invité ne peut pas inviter à son tour
-- ni régler le plafond (réservé au propriétaire). Additive: une table,
-- trois fonctions.

create table if not exists public.legion_invitations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  jeton text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  cree_par uuid not null references auth.users(id) on delete cascade,
  expire_le timestamptz not null default now() + interval '7 days',
  utilisee_par uuid references auth.users(id) on delete set null,
  utilisee_le timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists legion_invitations_entreprise on public.legion_invitations (entreprise_id, created_at desc);

alter table public.legion_invitations enable row level security;
drop policy if exists "legion_invitations lecture" on public.legion_invitations;
create policy "legion_invitations lecture" on public.legion_invitations
  for select using (public.legion_est_membre(entreprise_id));
-- Pas d'écriture directe: les trois fonctions ci-dessous.

-- Le propriétaire crée un lien.
create or replace function public.legion_inviter(p_entreprise uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_jeton text;
begin
  if not exists (
    select 1 from public.legion_entreprises e where e.id = p_entreprise and e.owner_id = auth.uid()
    union all
    select 1 from public.legion_membres m where m.entreprise_id = p_entreprise and m.user_id = auth.uid() and m.role = 'proprietaire'
  ) then
    raise exception 'Seul le propriétaire invite.';
  end if;
  if (select count(*) from public.legion_invitations i where i.cree_par = auth.uid() and i.created_at > now() - interval '1 day') >= 30 then
    raise exception 'Trente invitations par jour, pas plus.';
  end if;
  insert into public.legion_invitations (entreprise_id, cree_par) values (p_entreprise, auth.uid())
  returning jeton into v_jeton;
  return v_jeton;
end $$;
revoke all on function public.legion_inviter(uuid) from public, anon;
grant execute on function public.legion_inviter(uuid) to authenticated;

-- Ce que voit la personne invitée avant d'accepter: où, et de la part de qui.
create or replace function public.legion_apercu_invitation(p_jeton text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'entreprise', e.nom,
    'entreprise_id', e.id,
    'invite_par', coalesce(p.name, 'Quelqu''un'),
    'valide', i.utilisee_le is null and i.expire_le > now(),
    'deja_membre', exists (select 1 from public.legion_membres m where m.entreprise_id = e.id and m.user_id = auth.uid())
  )
  from public.legion_invitations i
  join public.legion_entreprises e on e.id = i.entreprise_id
  left join public.profiles p on p.id = i.cree_par
  where i.jeton = p_jeton;
$$;
revoke all on function public.legion_apercu_invitation(text) from public, anon;
grant execute on function public.legion_apercu_invitation(text) to authenticated;

-- Rejoindre: membre, et une place dans l'équipe sous son nom.
create or replace function public.legion_rejoindre(p_jeton text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_inv record;
  v_nom text;
  v_cle text;
begin
  if auth.uid() is null then raise exception 'Il faut être connecté.'; end if;
  select * into v_inv from public.legion_invitations where jeton = p_jeton for update;
  if v_inv.id is null then raise exception 'Invitation inconnue.'; end if;
  if exists (select 1 from public.legion_membres m where m.entreprise_id = v_inv.entreprise_id and m.user_id = auth.uid()) then
    return v_inv.entreprise_id;
  end if;
  if v_inv.utilisee_le is not null then raise exception 'Cette invitation a déjà servi.'; end if;
  if v_inv.expire_le < now() then raise exception 'Cette invitation a expiré.'; end if;

  insert into public.legion_membres (entreprise_id, user_id, role) values (v_inv.entreprise_id, auth.uid(), 'membre')
  on conflict do nothing;

  select coalesce(nullif(trim(name), ''), 'Invité') into v_nom from public.profiles where id = auth.uid();
  v_cle := 'humain-' || left(replace(auth.uid()::text, '-', ''), 8);
  if not exists (select 1 from public.legion_agents a where a.entreprise_id = v_inv.entreprise_id and a.user_id = auth.uid()) then
    insert into public.legion_agents (entreprise_id, cle, nom, poste, mandat, emoji, couleur, user_id, actif, ordre)
    values (v_inv.entreprise_id, v_cle, coalesce(v_nom, 'Invité'), 'Membre de l''équipe', 'Travaille avec l''équipe.', '🙂', '#2A9D8F', auth.uid(), true, 2);
  end if;

  update public.legion_invitations set utilisee_par = auth.uid(), utilisee_le = now() where id = v_inv.id;
  return v_inv.entreprise_id;
end $$;
revoke all on function public.legion_rejoindre(text) from public, anon;
grant execute on function public.legion_rejoindre(text) to authenticated;
