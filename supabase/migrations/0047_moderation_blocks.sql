-- Modération: signaler un contenu précis, et bloquer quelqu'un.
--
-- Exigé par la règle 1.2 de l'App Store, qui impose à toute app publiant du
-- contenu d'utilisateurs: un moyen de signaler ce contenu, et un moyen de
-- BLOQUER une personne abusive. Finjaro ne savait signaler qu'une boutique
-- entière, et ne savait pas bloquer — c'est le motif de rejet le plus courant
-- pour une place de marché dotée d'une messagerie.

-- 1. Élargir ce qu'on peut signaler ---------------------------------------
-- Jusqu'ici: 'shop' ou 'user' seulement. On ajoute les contenus eux-mêmes,
-- pour qu'une acheteuse puisse viser l'article ou la vidéo qui pose problème
-- plutôt que de dénoncer toute la boutique.
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('shop', 'user', 'product', 'reel', 'reel_comment'));

-- La suspension automatique au bout de 3 signalements ne vaut QUE pour une
-- boutique ou une personne. Avant, la branche « sinon » retombait sur
-- profiles pour n'importe quel type: signaler un article revenait à chercher
-- un profil portant l'identifiant de l'article. Ça ne trouvait rien, donc
-- rien ne cassait — mais un jour quelqu'un aurait cherché longtemps pourquoi
-- un compteur ne bougeait pas. On rend les deux cas explicites.
create or replace function public.on_report()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare cnt integer;
begin
  select count(*) into cnt
    from public.reports
    where target_type = new.target_type and target_id = new.target_id;

  if new.target_type = 'shop' then
    update public.shops
      set report_count = cnt,
          status = case when cnt >= 3 then 'suspended' else status end
      where id = new.target_id;
  elsif new.target_type = 'user' then
    update public.profiles
      set report_count = cnt,
          is_suspended = case when cnt >= 3 then true else is_suspended end
      where id = new.target_id;
  end if;
  -- Les signalements de contenu (article, vidéo, commentaire) sont traités à
  -- la main depuis la console d'administration: suspendre une boutique parce
  -- qu'une de ses photos déplaît à trois personnes serait disproportionné.
  return new;
end;
$$;

-- 2. Blocage ---------------------------------------------------------------
-- Deux sens, parce que la messagerie relie une PERSONNE à une BOUTIQUE:
--   • une acheteuse bloque une boutique      -> shop_id renseigné
--   • une vendeuse bloque une acheteuse      -> blocked_user_id renseigné
-- Exactement une des deux colonnes est remplie.
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  blocked_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_one_target check (num_nonnulls(shop_id, blocked_user_id) = 1)
);

create unique index if not exists blocks_shop_uniq
  on public.blocks (blocker_id, shop_id) where shop_id is not null;
create unique index if not exists blocks_user_uniq
  on public.blocks (blocker_id, blocked_user_id) where blocked_user_id is not null;

alter table public.blocks enable row level security;

-- On ne voit, ne pose et ne retire que SES PROPRES blocages: la personne
-- bloquée ne doit pas pouvoir lire qu'elle l'est.
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select using (blocker_id = auth.uid());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
  for insert with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks
  for delete using (blocker_id = auth.uid());

-- 3. Faire respecter le blocage en base -------------------------------------
-- Masquer les messages côté application ne suffirait pas: il faut que la
-- personne bloquée ne PUISSE PLUS écrire, sinon « bloquer » ne veut rien dire
-- dès que quelqu'un contourne l'interface.
--
-- Le déclencheur porte sur `chat_messages` et NON sur `messages`: cette
-- dernière est une table héritée que l'application n'écrit plus. Posé au
-- mauvais endroit, le garde-fou n'aurait jamais bloqué le moindre message
-- tout en donnant l'illusion du contraire.
create or replace function public.reject_blocked_chat_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  conv record;
  owner uuid;
begin
  select c.buyer_id, c.shop_id into conv
    from public.conversations c where c.id = new.conversation_id;
  if conv is null then
    return new;
  end if;
  select s.owner_id into owner from public.shops s where s.id = conv.shop_id;

  -- Un blocage dans l'un ou l'autre sens ferme la conversation pour LES DEUX:
  -- laisser la personne bloquée continuer à recevoir des réponses lui
  -- signalerait qu'elle a été bloquée, et laisser l'autre écrire dans le vide
  -- n'aurait aucun sens.
  if exists (select 1 from public.blocks b
             where b.blocker_id = conv.buyer_id and b.shop_id = conv.shop_id)
     or exists (select 1 from public.blocks b
                where b.blocker_id = owner and b.blocked_user_id = conv.buyer_id) then
    raise exception 'conversation bloquee' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reject_blocked_chat_message on public.chat_messages;
create trigger trg_reject_blocked_chat_message
  before insert on public.chat_messages
  for each row execute function public.reject_blocked_chat_message();
