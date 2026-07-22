-- Finjaro — Maintenance Cycle 2: real comments on reels.
-- Idempotent. Apply in the Supabase SQL editor (project `finjaro`) — or it is
-- applied directly by tooling. Requires 0007 (events table) to be applied first.

create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists reel_comments_reel_idx on public.reel_comments(reel_id);

-- Named FK to profiles so PostgREST can embed the author's name.
alter table public.reel_comments drop constraint if exists reel_comments_profile_fk;
alter table public.reel_comments
  add constraint reel_comments_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.reel_comments enable row level security;
drop policy if exists reel_comments_read on public.reel_comments;
create policy reel_comments_read on public.reel_comments for select using (true);
drop policy if exists reel_comments_insert on public.reel_comments;
create policy reel_comments_insert on public.reel_comments for insert with check (user_id = auth.uid());

-- Keep reels.comments in sync.
create or replace function public.on_reel_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.reels set comments = comments + 1 where id = new.reel_id;
  return new;
end;
$$;
revoke execute on function public.on_reel_comment() from public, anon, authenticated;
drop trigger if exists trg_reel_comment on public.reel_comments;
create trigger trg_reel_comment after insert on public.reel_comments
  for each row execute function public.on_reel_comment();

-- Allow the 'comment' event type for tracking (extends 0007's events check).
do $$
declare c text;
begin
  select conname into c from pg_constraint
    where conrelid = 'public.events'::regclass and contype = 'c' limit 1;
  if c is not null then execute format('alter table public.events drop constraint %I', c); end if;
end $$;
alter table public.events add constraint events_type_check
  check (type in ('product_view','shop_view','category_view','product_click','follow','search','comment'));
