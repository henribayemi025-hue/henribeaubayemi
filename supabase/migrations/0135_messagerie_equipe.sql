-- La messagerie de l'équipe Finjaro.
--
-- Beau, 22/09: « je veux une équipe permanente. Chacun a un nom, chacun a un
-- poste vraiment prédéfini. Une messagerie que je peux avoir sur mon
-- téléphone, où je vois comment vous interagissez, et dès qu'il y a une
-- notification je peux envoyer un message. »
--
-- Et le reproche qui va avec, qui est juste: « il n'y a personne qui me
-- demande où est-ce que tu en es avec le marketing. Il n'y a aucune idée
-- innovante depuis que je travaille avec toi. »
--
-- Pourquoi cette table plutôt que nos canaux actuels:
--
--   - Alpha et Claudinette se parlent aujourd'hui par des messages privés
--     entre sessions. Beau ne les voit JAMAIS. Il ne sait donc pas ce qui se
--     décide entre nous, ni ce sur quoi on avance.
--   - Les Claude de Chrome écrivent dans l'issue GitHub #16, qui est
--     PUBLIQUE: aucune donnée personnelle ne peut y passer, et elle n'envoie
--     aucune notification à Beau.
--
-- Ici: tout le monde écrit au même endroit, Beau lit et répond depuis son
-- téléphone, et il est prévenu. C'est ce qui manquait.
--
-- ⚠️ Ces tables sont RÉSERVÉES À L'ÉQUIPE. Elles ne contiennent pas de
-- données de vendeuses ni d'acheteuses, et aucune vendeuse n'y a accès: la
-- règle de lecture exige `is_admin()`.
--
-- Additif: aucune table existante touchée.

-- ---------------------------------------------------------------------------
-- 1. Qui est dans l'équipe
-- ---------------------------------------------------------------------------
-- Une ligne par agent. `cle` est ce qu'un agent écrit dans ses messages pour
-- s'identifier — c'est stable, alors que le nom affiché peut changer: Beau a
-- dit « tu les renommes si tu veux, c'est ton équipe ».
create table if not exists public.team_agents (
  cle text primary key,
  nom text not null,
  poste text not null,
  -- Ce que cet agent doit faire SANS QU'ON LE LUI DEMANDE. C'est le cœur de
  -- la demande de Beau: il ne veut pas des exécutants, il veut des gens qui
  -- viennent lui proposer quelque chose.
  mandat text not null,
  emoji text,
  -- La couleur de la pastille dans la messagerie.
  couleur text not null default '#C25E38',
  -- Le compte humain, s'il y en a un (Beau). Un agent IA n'en a pas.
  user_id uuid references auth.users(id) on delete set null,
  actif boolean not null default true,
  ordre integer not null default 100,
  created_at timestamptz not null default now()
);

comment on table public.team_agents is
  'L''équipe Finjaro: qui en fait partie, à quel poste, et ce qu''il doit faire de lui-même.';

-- ---------------------------------------------------------------------------
-- 2. Les salons
-- ---------------------------------------------------------------------------
create table if not exists public.team_channels (
  cle text primary key,
  nom text not null,
  a_quoi_ca_sert text not null,
  emoji text,
  ordre integer not null default 100,
  created_at timestamptz not null default now()
);

comment on table public.team_channels is
  'Les salons de l''équipe. Un sujet par salon, pour que Beau trouve sans chercher.';

-- ---------------------------------------------------------------------------
-- 3. Les messages
-- ---------------------------------------------------------------------------
create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  canal text not null references public.team_channels(cle) on delete cascade,
  -- Qui parle. `auteur` est la clé d'un agent; `user_id` est rempli quand
  -- c'est un humain qui écrit depuis le téléphone.
  auteur text not null references public.team_agents(cle),
  user_id uuid references auth.users(id) on delete set null,
  texte text not null check (btrim(texte) <> ''),
  -- `genre` sert à l'affichage et au tri de l'attention:
  --   info      — je te dis ce que j'ai fait, tu n'as rien à faire
  --   question  — j'attends ta réponse pour continuer
  --   decision  — il faut que tu tranches
  --   proposition — j'ai une idée, voilà pourquoi
  -- C'est la reprise exacte de ce qui marche déjà dans la salle commune.
  genre text not null default 'info'
    check (genre in ('info', 'question', 'decision', 'proposition')),
  -- Une question ou une décision reste OUVERTE tant que personne n'a répondu.
  -- C'est ce qui permet à l'écran de montrer « 2 choses attendent Beau »
  -- plutôt que de noyer l'important dans le flux.
  repondu_le timestamptz,
  repond_a uuid references public.team_messages(id) on delete set null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists team_messages_canal_idx on public.team_messages(canal, created_at desc);
create index if not exists team_messages_ouverts_idx on public.team_messages(genre, repondu_le)
  where repondu_le is null;

comment on table public.team_messages is
  'Les messages de l''équipe. Beau les lit sur son téléphone et répond ici.';

-- ---------------------------------------------------------------------------
-- 4. Qui a le droit de lire
-- ---------------------------------------------------------------------------
-- Personne d'autre que l'équipe. Une vendeuse connectée ne doit rien voir de
-- tout ça: on y parle de concurrence, de chiffres et de décisions internes.
alter table public.team_agents   enable row level security;
alter table public.team_channels enable row level security;
alter table public.team_messages enable row level security;

drop policy if exists team_agents_select on public.team_agents;
create policy team_agents_select on public.team_agents
  for select using (public.is_admin());

drop policy if exists team_channels_select on public.team_channels;
create policy team_channels_select on public.team_channels
  for select using (public.is_admin());

drop policy if exists team_messages_select on public.team_messages;
create policy team_messages_select on public.team_messages
  for select using (public.is_admin());

-- Beau écrit depuis son téléphone. Il écrit SOUS SA PROPRE IDENTITÉ: on ne
-- peut pas publier un message en se faisant passer pour un agent.
drop policy if exists team_messages_insert on public.team_messages;
create policy team_messages_insert on public.team_messages
  for insert with check (
    public.is_admin()
    and user_id = auth.uid()
    and exists (
      select 1 from public.team_agents a
       where a.cle = auteur and a.user_id = auth.uid()
    )
  );

-- Marquer une question comme répondue. Réservé aussi à l'équipe.
drop policy if exists team_messages_update on public.team_messages;
create policy team_messages_update on public.team_messages
  for update using (public.is_admin()) with check (public.is_admin());

-- Les agents IA, eux, écrivent avec la clé de service, qui passe au-dessus de
-- ces règles. C'est voulu: ils n'ont pas de compte et ne peuvent pas se
-- connecter.

-- ---------------------------------------------------------------------------
-- 5. Beau est prévenu quand quelque chose l'attend
-- ---------------------------------------------------------------------------
-- Une messagerie qu'il faut penser à ouvrir ne sert à rien. Mais on ne le
-- réveille PAS pour tout: seulement pour ce qui attend une réponse de lui, ou
-- pour une proposition. Une information ne sonne pas.
create or replace function public.team_prevenir_beau()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  destinataire uuid;
  qui text;
  salon text;
begin
  if new.genre not in ('question', 'decision', 'proposition') then
    return new;
  end if;
  -- Ne pas se notifier soi-même quand c'est Beau qui écrit.
  if new.user_id is not null then
    return new;
  end if;

  select a.nom into qui from public.team_agents a where a.cle = new.auteur;
  select c.nom into salon from public.team_channels c where c.cle = new.canal;

  for destinataire in
    select p.id from public.profiles p where p.is_admin = true
  loop
    perform public.push_notify(
      destinataire,
      coalesce(qui, new.auteur) || ' · ' || coalesce(salon, new.canal),
      left(new.texte, 140),
      '/equipe?canal=' || new.canal,
      'equipe-' || new.canal
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_team_prevenir_beau on public.team_messages;
create trigger trg_team_prevenir_beau
  after insert on public.team_messages
  for each row execute function public.team_prevenir_beau();

-- Appelée par un déclencheur, jamais par l'application. `public` détient
-- `execute` par défaut: il faut le lui retirer À LUI d'abord, sinon `anon` et
-- `authenticated` le gardent par héritage. (Leçon de la migration 0133.)
revoke execute on function public.team_prevenir_beau() from public;
revoke execute on function public.team_prevenir_beau() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Les salons de départ
-- ---------------------------------------------------------------------------
insert into public.team_channels (cle, nom, a_quoi_ca_sert, emoji, ordre) values
  ('direction',   'Direction',   'Ce qui attend une décision de Beau. Rien d''autre.', '🎯', 10),
  ('concurrence', 'Concurrence', 'Ce que les autres ont et qu''on n''a pas.', '🔭', 20),
  ('marketing',   'Marketing',   'Acquisition, prospection, ce qui fait venir les gens.', '📣', 30),
  ('produit',     'Produit',     'Ce qu''on construit, et ce qui est en ligne.', '🛠️', 40),
  ('qualite',     'Qualité',     'Les défauts trouvés, et ce qu''on a promis sans le tenir.', '🔍', 50)
on conflict (cle) do nothing;
