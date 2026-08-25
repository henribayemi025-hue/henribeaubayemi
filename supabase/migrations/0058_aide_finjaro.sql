-- Écrire à Finjaro, depuis Finjaro.
--
-- Beau: « les personnes peuvent écrire à Finjaro via notre chat, comme celle
-- qui m'a écrit hier par mail. C'est Finia qui répond. Si elle voit que c'est
-- chaud, elle nous contacte. Si elle peut gérer, elle gère. Si elle voit que
-- c'est une erreur technique, elle nous le dit. »
--
-- Ce qui a rendu ça nécessaire, le 24/08: une vendeuse a écrit par e-mail
-- « je n'arrive pas à télécharger les photos ». Il a fallu fouiller la base
-- pour découvrir qu'elle n'avait rien envoyé depuis DIX-SEPT jours. Et le
-- jour même, une autre vendeuse avait 18 articles invisibles depuis douze
-- jours sans avoir jamais écrit — parce qu'elle ignorait qu'il y avait un
-- problème.
--
-- La leçon n'est pas « il faut un chat »: c'est qu'un message d'aide sans
-- CONTEXTE TECHNIQUE ne sert presque à rien. `contexte` est donc la colonne
-- qui compte: navigateur, écran, version, dernière erreur. C'est ce qui
-- transforme trois jours d'enquête en trois minutes.
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: quelqu'un peut avoir un souci AVANT d'avoir un compte, et c'est
  -- précisément le moment où on a le plus besoin de le savoir.
  user_id uuid references public.profiles(id) on delete set null,
  sujet text not null,
  resume text not null,
  gravite text not null default 'question'
    check (gravite in ('question', 'bug', 'urgent')),
  statut text not null default 'ouvert'
    check (statut in ('ouvert', 'repondu', 'clos')),
  contexte jsonb not null default '{}'::jsonb,
  reponse text,
  created_at timestamptz not null default now(),
  repondu_le timestamptz,
  repondu_par uuid references public.profiles(id) on delete set null
);

comment on table public.support_tickets is
  'Demandes d''aide remontées par Finia quand elle ne sait pas répondre ou qu''elle repère un bug.';
comment on column public.support_tickets.contexte is
  'Navigateur, écran, version, dernière erreur — ce qui permet de diagnostiquer sans interroger la personne.';

create index if not exists support_tickets_ouverts_idx
  on public.support_tickets (created_at desc) where statut = 'ouvert';
create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

-- Personne n'écrit ici depuis le navigateur: c'est la fonction edge (clé de
-- service) qui crée le ticket, après que Finia l'a décidé. Sinon n'importe
-- qui pourrait noyer la file.
drop policy if exists support_tickets_lecture on public.support_tickets;
create policy support_tickets_lecture on public.support_tickets
  for select using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

drop policy if exists support_tickets_admin_update on public.support_tickets;
create policy support_tickets_admin_update on public.support_tickets
  for update using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );
