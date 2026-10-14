-- APPLIQUÉE EN PRODUCTION le 14/10/2026 (ordre de Beau : « tout Google Chat »). Essayée d'abord sur la base de test dans une
-- transaction annulée : 25 cas de droits (étranger à l'espace, usurpation, faux message système, fil croisé, rôle, anonyme…)
-- et le compte des non lus. Aucune discussion n'existe encore en production : rien ne change tant que l'écran n'est pas posé.
-- Discussion « façon Google Chat » d'Accounting : base de données, jalon 0.
-- Écrite le 14/10/2026. Décidée par Beau le 14/10 : « je veux vraiment façon Google Chat, tout Google Chat »
-- (la conclusion de la réunion du 13/10, « chat simple », est écartée pour la Discussion).
--
-- ⚠️ Touche la base COMMUNE aux deux applications : uniquement des CRÉATIONS (5 tables préfixées `finia_chat_`,
-- des fonctions). Rien n'est supprimé ni renommé. Les tables ne se mélangent pas : la place de marché ne lit
-- ni n'écrit aucune de ces tables. Claudinette (Accounting) construit l'écran par-dessus.
--
-- POURQUOI DES TABLES À PART ET PAS LE JOURNAL `finia_events`
-- Le journal d'Accounting est lu par TOUS les membres d'un espace : un message « privé » qu'on y écrirait
-- serait lisible par n'importe quel membre. Dans Google Chat, une discussion à deux ne se lit qu'à deux.
-- Ici chaque ligne n'est visible que par les personnes de l'espace de discussion (RLS), et les créations
-- passent par des fonctions qui contrôlent que tout le monde appartient bien à l'espace de travail.
-- Les canaux déjà existants (Général, projets) ne sont pas migrés : ils restent dans le journal, l'écran
-- affichera les deux listes ensemble.
--
-- LE MODÈLE (le vocabulaire de Google Chat)
--  * espace de discussion (`finia_chat_spaces`) : `dm` = à deux ; `group` = discussion de groupe ;
--    `space` = un « Espace » nommé (projet, département) ;
--  * `finia_chat_members` : qui y est, ce qu'il a lu (accusé de lecture), favori, sourdine ;
--  * `finia_chat_messages` : un message ; `parent_id` renseigné = réponse dans un fil ; `kind` text / call /
--    task / system ; `mentions` = les personnes citées avec @ ;
--  * `finia_chat_reactions` : emoji par personne ;  `finia_chat_pins` : messages épinglés.
-- Les personnes sont identifiées par leur `user_id` : un membre invité qui ne s'est jamais connecté n'a pas
-- encore de `user_id` et n'apparaît pas dans l'annuaire (l'écran le montre « pas encore connecté »).
-- Vie privée : l'annuaire ne donne JAMAIS l'adresse e-mail, seulement un nom.

-- ─── Tables ───────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.finia_chat_spaces (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finia_workspaces(id) on delete cascade,
  kind         text not null check (kind in ('dm', 'group', 'space')),
  name         text check (name is null or char_length(name) between 1 and 80),
  description  text check (description is null or char_length(description) <= 500),
  dm_key       text,
  history_on   boolean not null default true,
  created_by   uuid not null,
  created_at   timestamptz not null default now(),
  archived_at  timestamptz,
  check ((kind = 'dm') = (dm_key is not null))
);
create unique index if not exists finia_chat_spaces_dm_uniq on public.finia_chat_spaces (workspace_id, dm_key) where kind = 'dm';
create index if not exists finia_chat_spaces_ws on public.finia_chat_spaces (workspace_id);

create table if not exists public.finia_chat_members (
  space_id     uuid not null references public.finia_chat_spaces(id) on delete cascade,
  user_id      uuid not null,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  starred      boolean not null default false,
  muted        boolean not null default false,
  primary key (space_id, user_id)
);
create index if not exists finia_chat_members_user on public.finia_chat_members (user_id);

create table if not exists public.finia_chat_messages (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.finia_chat_spaces(id) on delete cascade,
  user_id    uuid not null,
  body       text not null check (char_length(body) between 1 and 4000),
  parent_id  uuid references public.finia_chat_messages(id) on delete cascade,
  kind       text not null default 'text' check (kind in ('text', 'call', 'task', 'system')),
  meta       jsonb not null default '{}'::jsonb,
  mentions   uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  edited_at  timestamptz,
  deleted_at timestamptz
);
create index if not exists finia_chat_messages_space on public.finia_chat_messages (space_id, created_at desc);
create index if not exists finia_chat_messages_parent on public.finia_chat_messages (parent_id) where parent_id is not null;
create index if not exists finia_chat_messages_fts on public.finia_chat_messages using gin (to_tsvector('simple', body)) where deleted_at is null;

create table if not exists public.finia_chat_reactions (
  message_id uuid not null references public.finia_chat_messages(id) on delete cascade,
  user_id    uuid not null,
  emoji      text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.finia_chat_pins (
  space_id   uuid not null references public.finia_chat_spaces(id) on delete cascade,
  message_id uuid not null references public.finia_chat_messages(id) on delete cascade,
  pinned_by  uuid not null,
  created_at timestamptz not null default now(),
  primary key (space_id, message_id)
);

-- ─── Fonctions d'aide (security definer : elles lisent les tables sans repasser par les règles) ──────
create or replace function public.finia_chat_dans(p_space uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from finia_chat_members m where m.space_id = p_space and m.user_id = auth.uid());
$$;

create or replace function public.finia_chat_proprietaire(p_space uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from finia_chat_members m where m.space_id = p_space and m.user_id = auth.uid() and m.role = 'owner');
$$;

create or replace function public.finia_chat_message_visible(p_message uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from finia_chat_messages x
    join finia_chat_members m on m.space_id = x.space_id and m.user_id = auth.uid()
    where x.id = p_message
  );
$$;

-- ─── Droits : rien pour anon ; pour les personnes connectées, seulement ce qui est écrit ici ─────────
revoke all on public.finia_chat_spaces, public.finia_chat_members, public.finia_chat_messages,
              public.finia_chat_reactions, public.finia_chat_pins from public, anon, authenticated;
revoke all on function public.finia_chat_dans(uuid), public.finia_chat_proprietaire(uuid), public.finia_chat_message_visible(uuid) from public, anon;
grant execute on function public.finia_chat_dans(uuid), public.finia_chat_proprietaire(uuid), public.finia_chat_message_visible(uuid) to authenticated;

grant select on public.finia_chat_spaces, public.finia_chat_members, public.finia_chat_messages,
                public.finia_chat_reactions, public.finia_chat_pins to authenticated;
grant update (name, description, history_on, archived_at) on public.finia_chat_spaces to authenticated;
grant update (last_read_at, starred, muted) on public.finia_chat_members to authenticated;
grant delete on public.finia_chat_members to authenticated;                 -- quitter une discussion
grant insert (space_id, user_id, body, parent_id, kind, meta, mentions) on public.finia_chat_messages to authenticated;
grant update (body, edited_at, deleted_at) on public.finia_chat_messages to authenticated;
grant insert (message_id, user_id, emoji) on public.finia_chat_reactions to authenticated;
grant delete on public.finia_chat_reactions to authenticated;
grant insert (space_id, message_id, pinned_by) on public.finia_chat_pins to authenticated;
grant delete on public.finia_chat_pins to authenticated;

alter table public.finia_chat_spaces    enable row level security;
alter table public.finia_chat_members   enable row level security;
alter table public.finia_chat_messages  enable row level security;
alter table public.finia_chat_reactions enable row level security;
alter table public.finia_chat_pins      enable row level security;

drop policy if exists finia_chat_spaces_select on public.finia_chat_spaces;
create policy finia_chat_spaces_select on public.finia_chat_spaces for select to authenticated using (public.finia_chat_dans(id));
drop policy if exists finia_chat_spaces_update on public.finia_chat_spaces;
create policy finia_chat_spaces_update on public.finia_chat_spaces for update to authenticated
  using (kind <> 'dm' and public.finia_chat_proprietaire(id)) with check (kind <> 'dm' and public.finia_chat_proprietaire(id));

drop policy if exists finia_chat_members_select on public.finia_chat_members;
create policy finia_chat_members_select on public.finia_chat_members for select to authenticated using (public.finia_chat_dans(space_id));
drop policy if exists finia_chat_members_update on public.finia_chat_members;
create policy finia_chat_members_update on public.finia_chat_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists finia_chat_members_delete on public.finia_chat_members;
create policy finia_chat_members_delete on public.finia_chat_members for delete to authenticated using (user_id = auth.uid());

drop policy if exists finia_chat_messages_select on public.finia_chat_messages;
create policy finia_chat_messages_select on public.finia_chat_messages for select to authenticated using (public.finia_chat_dans(space_id));
drop policy if exists finia_chat_messages_insert on public.finia_chat_messages;
create policy finia_chat_messages_insert on public.finia_chat_messages for insert to authenticated
  with check (user_id = auth.uid() and kind in ('text', 'call', 'task') and public.finia_chat_dans(space_id));
drop policy if exists finia_chat_messages_update on public.finia_chat_messages;
create policy finia_chat_messages_update on public.finia_chat_messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists finia_chat_reactions_select on public.finia_chat_reactions;
create policy finia_chat_reactions_select on public.finia_chat_reactions for select to authenticated using (public.finia_chat_message_visible(message_id));
drop policy if exists finia_chat_reactions_insert on public.finia_chat_reactions;
create policy finia_chat_reactions_insert on public.finia_chat_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.finia_chat_message_visible(message_id));
drop policy if exists finia_chat_reactions_delete on public.finia_chat_reactions;
create policy finia_chat_reactions_delete on public.finia_chat_reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists finia_chat_pins_select on public.finia_chat_pins;
create policy finia_chat_pins_select on public.finia_chat_pins for select to authenticated using (public.finia_chat_dans(space_id));
drop policy if exists finia_chat_pins_insert on public.finia_chat_pins;
create policy finia_chat_pins_insert on public.finia_chat_pins for insert to authenticated
  with check (pinned_by = auth.uid() and public.finia_chat_dans(space_id));
drop policy if exists finia_chat_pins_delete on public.finia_chat_pins;
create policy finia_chat_pins_delete on public.finia_chat_pins for delete to authenticated using (public.finia_chat_dans(space_id));

-- Une réponse doit appartenir au même espace que le message auquel elle répond, et un fil n'a qu'un niveau.
create or replace function public.finia_chat_messages_garde()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from finia_chat_messages p where p.id = new.parent_id and p.space_id = new.space_id and p.parent_id is null
  ) then
    raise exception 'La réponse doit citer un message de la même discussion.';
  end if;
  return new;
end;
$$;
drop trigger if exists finia_chat_messages_garde on public.finia_chat_messages;
create trigger finia_chat_messages_garde before insert on public.finia_chat_messages
  for each row execute function public.finia_chat_messages_garde();

-- ─── Fonctions appelées par l'écran ───────────────────────────────────────────────────────────────────
-- Annuaire : les personnes de l'espace de travail qui ont un compte (la propriétaire et les membres actifs
-- déjà connectés). Jamais d'adresse e-mail.
create or replace function public.finia_chat_annuaire(p_workspace uuid)
returns table (user_id uuid, nom text, role text)
language plpgsql stable security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null or not finia_is_member(p_workspace) then
    raise exception 'Réservé aux membres de l''espace.';
  end if;
  return query
    select w.owner_id,
           coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)),
           'owner'::text
      from finia_workspaces w join auth.users u on u.id = w.owner_id
     where w.id = p_workspace
    union all
    select m.user_id,
           coalesce(nullif(trim(m.display_name), ''), nullif(trim(u.raw_user_meta_data->>'full_name'), ''), nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)),
           m.role
      from finia_members m join auth.users u on u.id = m.user_id
     where m.workspace_id = p_workspace and m.status = 'active' and m.user_id is not null
       and m.user_id <> (select w2.owner_id from finia_workspaces w2 where w2.id = p_workspace);
end;
$function$;

-- Créer une discussion : à deux (dm, rejouable : renvoie l'existante), de groupe, ou un Espace nommé.
create or replace function public.finia_chat_creer(p_workspace uuid, p_kind text, p_membres uuid[], p_nom text default null)
returns uuid
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_moi    uuid := auth.uid();
  v_tous   uuid[];
  v_n      integer;
  v_valides integer;
  v_key    text;
  v_id     uuid;
  v_nom    text := nullif(trim(coalesce(p_nom, '')), '');
begin
  if v_moi is null then raise exception 'Connexion requise.'; end if;
  if not finia_is_member(p_workspace) then raise exception 'Réservé aux membres de l''espace.'; end if;
  if p_kind not in ('dm', 'group', 'space') then raise exception 'Type de discussion inconnu.'; end if;

  select array_agg(distinct x) into v_tous from unnest(coalesce(p_membres, '{}') || v_moi) x;
  v_n := coalesce(array_length(v_tous, 1), 0);

  select count(*) into v_valides from finia_chat_annuaire(p_workspace) a where a.user_id = any (v_tous);
  if v_valides <> v_n then raise exception 'Une personne n''appartient pas à cet espace ou ne s''est pas encore connectée.'; end if;

  if p_kind = 'dm' then
    if v_n <> 2 then raise exception 'Une discussion à deux compte deux personnes.'; end if;
    v_key := (select string_agg(x::text, ':' order by x) from unnest(v_tous) x);
    select s.id into v_id from finia_chat_spaces s where s.workspace_id = p_workspace and s.kind = 'dm' and s.dm_key = v_key;
    if v_id is not null then return v_id; end if;
  elsif p_kind = 'group' then
    if v_n < 3 or v_n > 50 then raise exception 'Une discussion de groupe compte de 3 à 50 personnes.'; end if;
  else
    if v_nom is null then raise exception 'Un Espace a besoin d''un nom.'; end if;
    if v_n > 200 then raise exception 'Deux cents personnes au plus.'; end if;
  end if;

  insert into finia_chat_spaces (workspace_id, kind, name, dm_key, created_by)
  values (p_workspace, p_kind, case when p_kind = 'dm' then null else v_nom end, v_key, v_moi)
  returning id into v_id;

  insert into finia_chat_members (space_id, user_id, role)
  select v_id, x, case when x = v_moi then 'owner' else 'member' end from unnest(v_tous) x;
  return v_id;
end;
$function$;

-- Ajouter des personnes à un groupe ou à un Espace (réservé à son propriétaire).
create or replace function public.finia_chat_ajouter(p_space uuid, p_membres uuid[])
returns integer
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_ws uuid; v_kind text; v_n integer; v_valides integer; v_total integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select s.workspace_id, s.kind into v_ws, v_kind from finia_chat_spaces s where s.id = p_space;
  if v_ws is null or not finia_chat_proprietaire(p_space) then raise exception 'Réservé à la personne qui a créé la discussion.'; end if;
  if v_kind = 'dm' then raise exception 'On n''ajoute personne à une discussion à deux : créez un groupe.'; end if;
  v_n := coalesce(array_length(p_membres, 1), 0);
  select count(*) into v_valides from finia_chat_annuaire(v_ws) a where a.user_id = any (p_membres);
  if v_n = 0 or v_valides <> (select count(distinct x) from unnest(p_membres) x) then
    raise exception 'Une personne n''appartient pas à cet espace ou ne s''est pas encore connectée.';
  end if;
  select count(*) into v_total from finia_chat_members where space_id = p_space;
  if v_total + v_n > 200 then raise exception 'Deux cents personnes au plus.'; end if;
  insert into finia_chat_members (space_id, user_id) select p_space, x from unnest(p_membres) x on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$function$;

-- Lancer un appel : un message « appel » avec un lien de salle de réunion que personne ne peut deviner
-- (aucun serveur à nous, aucune clé, aucun compte). Les participants cliquent et rejoignent.
create or replace function public.finia_chat_appeler(p_space uuid, p_video boolean default true)
returns uuid
language plpgsql security definer set search_path to 'public' as $function$
declare v_id uuid; v_url text;
begin
  if auth.uid() is null or not finia_chat_dans(p_space) then raise exception 'Réservé aux personnes de la discussion.'; end if;
  v_url := 'https://meet.jit.si/finjaro-' || replace(gen_random_uuid()::text, '-', '');
  if not p_video then v_url := v_url || '#config.startWithVideoMuted=true'; end if;
  insert into finia_chat_messages (space_id, user_id, body, kind, meta)
  values (p_space, auth.uid(), case when p_video then 'Appel vidéo' else 'Appel vocal' end, 'call', jsonb_build_object('url', v_url, 'video', p_video))
  returning id into v_id;
  return v_id;
end;
$function$;

-- La liste de gauche : mes discussions, le dernier message, ce que je n'ai pas lu (accusé de lecture).
create or replace function public.finia_chat_resume(p_workspace uuid)
returns table (space_id uuid, kind text, name text, starred boolean, muted boolean, non_lus integer,
               dernier_at timestamptz, dernier_apercu text, membres jsonb)
language plpgsql stable security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null or not finia_is_member(p_workspace) then raise exception 'Réservé aux membres de l''espace.'; end if;
  return query
    select s.id, s.kind, s.name, me.starred, me.muted,
           (select count(*)::integer from finia_chat_messages x
             where x.space_id = s.id and x.deleted_at is null and x.parent_id is null
               and x.user_id <> auth.uid() and x.created_at > me.last_read_at),
           l.created_at,
           left(l.body, 120),
           (select coalesce(jsonb_agg(m.user_id), '[]'::jsonb) from finia_chat_members m where m.space_id = s.id)
      from finia_chat_spaces s
      join finia_chat_members me on me.space_id = s.id and me.user_id = auth.uid()
      left join lateral (
        select x.created_at, x.body from finia_chat_messages x
         where x.space_id = s.id and x.deleted_at is null and x.parent_id is null
         order by x.created_at desc limit 1
      ) l on true
     where s.workspace_id = p_workspace and s.archived_at is null
     order by coalesce(l.created_at, s.created_at) desc;
end;
$function$;

revoke all on function public.finia_chat_annuaire(uuid), public.finia_chat_creer(uuid, text, uuid[], text),
  public.finia_chat_ajouter(uuid, uuid[]), public.finia_chat_appeler(uuid, boolean), public.finia_chat_resume(uuid) from public, anon;
grant execute on function public.finia_chat_annuaire(uuid), public.finia_chat_creer(uuid, text, uuid[], text),
  public.finia_chat_ajouter(uuid, uuid[]), public.finia_chat_appeler(uuid, boolean), public.finia_chat_resume(uuid) to authenticated;
-- Les fonctions du déclencheur ne s'appellent pas à la main.
revoke execute on function public.finia_chat_messages_garde() from public, anon, authenticated;

-- Temps réel : les nouveaux messages, réactions, épingles et accusés arrivent sans recharger.
do $$
declare t text;
begin
  foreach t in array array['finia_chat_messages', 'finia_chat_reactions', 'finia_chat_pins', 'finia_chat_members'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;   -- publication absente ou table déjà ajoutée : sans importance ici
    end;
  end loop;
end $$;
