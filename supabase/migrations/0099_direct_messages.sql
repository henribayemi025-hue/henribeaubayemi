-- Messagerie personne-à-personne — Beau: « comme sur TikTok: si la personne
-- ne me suit pas en retour, je peux envoyer un seul message; si elle
-- répond, on peut parler; si on se suit tous les deux, on peut s'écrire
-- normalement ». Le suivi (user_follows) est NOUVEAU: jusqu'ici on ne
-- suivait que des BOUTIQUES (shop_follows), jamais un compte.
--
-- Le garde-fou anti-spam n'est PAS optionnel côté client: toute la logique
-- "un seul message tant que non accepté" vit dans send_direct_message()
-- (SECURITY DEFINER) — un appel direct à la table serait de toute façon
-- refusé, aucune policy INSERT n'existe pour les comptes normaux.

-- 1. Suivre une PERSONNE (distinct de shop_follows, qui reste pour les
-- boutiques) -----------------------------------------------------------
create table public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self check (follower_id <> followed_id)
);

alter table public.user_follows enable row level security;

-- On voit qui on suit et qui nous suit — pas le graphe des autres comptes.
create policy user_follows_select on public.user_follows
  for select using (follower_id = auth.uid() or followed_id = auth.uid());

create policy user_follows_insert on public.user_follows
  for insert with check (follower_id = auth.uid());

create policy user_follows_delete on public.user_follows
  for delete using (follower_id = auth.uid());

-- 2. Conversations et messages personne-à-personne -----------------------
-- Une seule ligne par paire, ordre canonique (a < b) pour ne jamais créer
-- deux fils entre les deux mêmes comptes.
create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  initiator_id uuid not null references auth.users(id) on delete cascade,
  -- false = "demande" : seul l'initiateur peut avoir écrit, un seul message.
  -- true = conversation normale (suivi mutuel dès le départ, OU l'autre a
  -- répondu une fois, ce qui vaut acceptation).
  unlocked boolean not null default false,
  last_message text,
  last_message_at timestamptz not null default now(),
  a_unread int not null default 0,
  b_unread int not null default 0,
  created_at timestamptz not null default now(),
  constraint direct_conversations_order check (user_a_id < user_b_id),
  constraint direct_conversations_uniq unique (user_a_id, user_b_id)
);

alter table public.direct_conversations enable row level security;

create policy direct_conversations_select on public.direct_conversations
  for select using (auth.uid() in (user_a_id, user_b_id));

-- Pas de policy INSERT/UPDATE pour les comptes normaux: tout passe par
-- start_direct_conversation() / send_direct_message() /
-- mark_direct_conversation_read() (SECURITY DEFINER), qui appliquent les
-- règles ci-dessus — sinon "suivre pour écrire" se contournerait d'un
-- simple appel direct à la table.

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  image_url text,
  status text not null default 'delivered',
  created_at timestamptz not null default now(),
  constraint direct_messages_has_content check (body is not null or image_url is not null)
);

create index direct_messages_conv_idx on public.direct_messages (conversation_id, created_at);

alter table public.direct_messages enable row level security;

create policy direct_messages_select on public.direct_messages
  for select using (
    exists (
      select 1 from public.direct_conversations c
      where c.id = conversation_id and auth.uid() in (c.user_a_id, c.user_b_id)
    )
  );

alter publication supabase_realtime add table public.direct_messages;

-- 3. Bookkeeping automatique + notification à chaque message inséré ------
-- Même partage des responsabilités que chat_messages (migration 0003):
-- send_direct_message() décide SI le message peut partir, ce déclencheur
-- s'occupe de ce qui doit TOUJOURS suivre un envoi.
create or replace function public.on_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv public.direct_conversations%rowtype;
  recipient uuid;
  sender_name text;
  preview text;
begin
  select * into conv from public.direct_conversations where id = new.conversation_id;
  recipient := case when conv.user_a_id = new.sender_id then conv.user_b_id else conv.user_a_id end;
  preview := coalesce(new.body, '📷');

  update public.direct_conversations dc
    set last_message = preview,
        last_message_at = new.created_at,
        a_unread = case when dc.user_a_id = recipient then dc.a_unread + 1 else dc.a_unread end,
        b_unread = case when dc.user_b_id = recipient then dc.b_unread + 1 else dc.b_unread end
    where dc.id = new.conversation_id;

  select name into sender_name from public.profiles where id = new.sender_id;

  perform public.notify(
    recipient, 'new_direct_message', coalesce(sender_name, 'Nouveau message'), preview,
    jsonb_build_object('conversation_id', new.conversation_id)
  );
  perform public.push_notify(
    recipient, coalesce(sender_name, 'Finjaro'), preview,
    '/profile/messages/' || new.conversation_id, 'dm-' || new.conversation_id
  );

  return new;
end;
$$;

create trigger trg_on_direct_message
  after insert on public.direct_messages
  for each row execute function public.on_direct_message();

-- 4. Le blocage existant (migration 0047, blocked_user_id) s'applique ici
-- aussi: vérifié dans send_direct_message(), jamais seulement côté client.

-- 5. Démarrer une conversation: il FAUT suivre la personne (règle de Beau).
create or replace function public.start_direct_conversation(p_other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv_id uuid;
  i_follow boolean;
  they_follow boolean;
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if p_other_id = me then raise exception 'cannot_message_self'; end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_user_id = p_other_id)
       or (blocker_id = p_other_id and blocked_user_id = me)
  ) then
    raise exception 'blocked';
  end if;

  select exists(select 1 from public.user_follows where follower_id = me and followed_id = p_other_id) into i_follow;
  if not i_follow then
    raise exception 'must_follow';
  end if;
  select exists(select 1 from public.user_follows where follower_id = p_other_id and followed_id = me) into they_follow;

  a := least(me, p_other_id);
  b := greatest(me, p_other_id);

  select id into conv_id from public.direct_conversations where user_a_id = a and user_b_id = b;
  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.direct_conversations (user_a_id, user_b_id, initiator_id, unlocked)
  values (a, b, me, they_follow)
  returning id into conv_id;

  return conv_id;
end;
$$;

revoke all on function public.start_direct_conversation(uuid) from public;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

-- 6. Envoyer un message: applique "une seule tant que non accepté".
create or replace function public.send_direct_message(p_conversation_id uuid, p_body text, p_image_url text default null)
returns public.direct_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv public.direct_conversations%rowtype;
  other uuid;
  deja_envoyes int;
  msg public.direct_messages%rowtype;
begin
  if me is null then raise exception 'unauthenticated'; end if;
  if coalesce(btrim(p_body), '') = '' and p_image_url is null then
    raise exception 'empty_message';
  end if;

  -- Verrou de ligne: deux envois simultanés de l'initiateur ne doivent
  -- jamais passer tous les deux le compte "0 message déjà envoyé".
  select * into conv from public.direct_conversations where id = p_conversation_id for update;
  if not found or me not in (conv.user_a_id, conv.user_b_id) then
    raise exception 'not_in_conversation';
  end if;

  other := case when conv.user_a_id = me then conv.user_b_id else conv.user_a_id end;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_user_id = other)
       or (blocker_id = other and blocked_user_id = me)
  ) then
    raise exception 'blocked';
  end if;

  if not conv.unlocked then
    if me = conv.initiator_id then
      select count(*) into deja_envoyes from public.direct_messages
        where conversation_id = p_conversation_id and sender_id = me;
      if deja_envoyes >= 1 then
        raise exception 'request_pending';
      end if;
    else
      -- La destinataire répond à la demande: ça vaut acceptation, pour de
      -- bon — la conversation reste ouverte même si le suivi change après.
      update public.direct_conversations set unlocked = true where id = p_conversation_id;
    end if;
  end if;

  insert into public.direct_messages (conversation_id, sender_id, body, image_url)
  values (p_conversation_id, me, nullif(btrim(p_body), ''), p_image_url)
  returning * into msg;

  return msg;
end;
$$;

revoke all on function public.send_direct_message(uuid, text, text) from public;
grant execute on function public.send_direct_message(uuid, text, text) to authenticated;

-- 7. Marquer lu (compteur + accusé de lecture) — même esprit que la lecture
-- du chat boutique (migration 0094), en une seule fonction ici plutôt
-- qu'une policy UPDATE ouverte sur les deux tables.
create or replace function public.mark_direct_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  update public.direct_conversations dc
    set a_unread = case when dc.user_a_id = me then 0 else dc.a_unread end,
        b_unread = case when dc.user_b_id = me then 0 else dc.b_unread end
    where dc.id = p_conversation_id and me in (dc.user_a_id, dc.user_b_id);

  update public.direct_messages
    set status = 'read'
    where conversation_id = p_conversation_id
      and sender_id <> me
      and status <> 'read';
end;
$$;

revoke all on function public.mark_direct_conversation_read(uuid) from public;
grant execute on function public.mark_direct_conversation_read(uuid) to authenticated;

-- 8. Trouver des personnes à suivre, sans ouvrir tout le carnet d'adresses.
-- `profiles` reste verrouillé (une seule ligne visible: la sienne, migration
-- 0078) — ces deux fonctions ne renvoient QUE nom + avatar + compteurs
-- publics, jamais téléphone/adresse/e-mail/ville.
create or replace function public.search_people(p_query text)
returns table(id uuid, name text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.avatar_url
  from public.profiles p
  where p.id <> auth.uid()
    and not coalesce(p.is_suspended, false)
    and p.name is not null
    and length(btrim(p_query)) >= 2
    and p.name ilike '%' || btrim(p_query) || '%'
  order by p.name
  limit 20;
$$;

revoke all on function public.search_people(text) from public;
grant execute on function public.search_people(text) to authenticated;

create or replace function public.get_public_profile(p_id uuid)
returns table(
  id uuid, name text, avatar_url text,
  followers_count bigint, following_count bigint,
  i_follow boolean, follows_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.name, p.avatar_url,
    (select count(*) from public.user_follows where followed_id = p.id) as followers_count,
    (select count(*) from public.user_follows where follower_id = p.id) as following_count,
    exists(select 1 from public.user_follows where follower_id = auth.uid() and followed_id = p.id) as i_follow,
    exists(select 1 from public.user_follows where follower_id = p.id and followed_id = auth.uid()) as follows_me
  from public.profiles p
  where p.id = p_id and not coalesce(p.is_suspended, false);
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to authenticated;
