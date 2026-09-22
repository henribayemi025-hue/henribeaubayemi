-- LEGION — une entreprise d'agents, pour n'importe qui.
--
-- Beau, 22/09: « je ne sais pas si tu fais pour Finjaro ou pour l'app. Ce que
-- je vais utiliser, c'est ce que tout le monde utilisera. » Puis: « je valide
-- Legion ».
--
-- Donc les tables `team_*` posées ce matin — l'équipe de Finjaro — étaient un
-- prototype à un seul locataire: un salon s'appelle « direction » et il n'y en
-- a qu'un. Pour que quelqu'un d'autre crée SON entreprise, il faut que tout
-- appartienne à une entreprise. C'est ce que fait cette migration.
--
-- Finjaro est le client zéro: son équipe est recopiée ici comme première
-- entreprise. Les tables `team_*` restent (additif), elles ne servent plus.
--
-- Additif: aucune table existante touchée.

-- ---------------------------------------------------------------------------
-- 1. L'entreprise, et qui en fait partie
-- ---------------------------------------------------------------------------
create table if not exists public.legion_entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (btrim(nom) <> ''),
  -- Le modèle choisi au départ (studio_modeles.cle), et la taille réglée.
  modele text references public.studio_modeles(cle),
  taille text not null default 'startup'
    check (taille in ('cocon', 'startup', 'scaleup', 'megacorp')),
  -- Le projet: ce sur quoi l'entreprise travaille. C'est ce que les agents
  -- lisent en premier.
  projet text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.legion_membres (
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'membre' check (role in ('proprietaire', 'membre')),
  created_at timestamptz not null default now(),
  primary key (entreprise_id, user_id)
);

-- Appelée dans les règles d'accès: reste exécutable par `authenticated`, et
-- c'est voulu (leçon de la migration 0134).
create or replace function public.legion_est_membre(p_entreprise uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.legion_membres m
     where m.entreprise_id = p_entreprise and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Les agents d'une entreprise — humanisés
-- ---------------------------------------------------------------------------
create table if not exists public.legion_agents (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  -- Une clé courte et stable par entreprise: `alpha`, `vigie`… c'est ce que
  -- les agents écrivent dans leurs messages.
  cle text not null,
  nom text not null,
  poste text not null,
  departement text,
  mandat text not null,
  -- Le visage: une adresse d'image. DiceBear pour commencer (gratuit, sans
  -- compte), une photo choisie ensuite.
  avatar_url text,
  emoji text,
  couleur text not null default '#C25E38',
  -- Une personnalité en une phrase: Beau veut des agents « humanisés ».
  personnalite text,
  -- L'agent du catalogue qui le fait tourner (studio_catalogue.cle), s'il y
  -- en a un. Son texte est téléchargé à l'installation, pas stocké ici.
  catalogue_cle text,
  est_directeur boolean not null default false,
  -- Le compte humain, s'il y en a un (le fondateur). Un agent IA n'en a pas.
  user_id uuid references auth.users(id) on delete set null,
  actif boolean not null default true,
  ordre integer not null default 100,
  created_at timestamptz not null default now(),
  unique (entreprise_id, cle)
);

create index if not exists legion_agents_entreprise_idx on public.legion_agents (entreprise_id, ordre);

-- ---------------------------------------------------------------------------
-- 3. Les salons et les messages
-- ---------------------------------------------------------------------------
create table if not exists public.legion_canaux (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  cle text not null,
  nom text not null,
  a_quoi_ca_sert text,
  emoji text,
  -- Conversation privée entre deux agents: leurs clés, triées.
  prive_entre text[],
  ordre integer not null default 100,
  created_at timestamptz not null default now(),
  unique (entreprise_id, cle)
);

create table if not exists public.legion_messages (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  canal_id uuid not null references public.legion_canaux(id) on delete cascade,
  auteur_id uuid not null references public.legion_agents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  texte text not null check (btrim(texte) <> ''),
  genre text not null default 'info'
    check (genre in ('info', 'question', 'decision', 'proposition', 'tache', 'reunion')),
  repondu_le timestamptz,
  assigne_a uuid references public.legion_agents(id),
  echeance timestamptz,
  termine_le timestamptz,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists legion_messages_canal_idx on public.legion_messages (canal_id, created_at desc);
create index if not exists legion_messages_ouverts_idx on public.legion_messages (entreprise_id, genre, repondu_le)
  where repondu_le is null;

create table if not exists public.legion_reactions (
  message_id uuid not null references public.legion_messages(id) on delete cascade,
  auteur_id uuid not null references public.legion_agents(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, auteur_id, emoji)
);

-- ---------------------------------------------------------------------------
-- 4. Qui a le droit de quoi: les membres de l'entreprise, et personne d'autre
-- ---------------------------------------------------------------------------
alter table public.legion_entreprises enable row level security;
alter table public.legion_membres     enable row level security;
alter table public.legion_agents      enable row level security;
alter table public.legion_canaux      enable row level security;
alter table public.legion_messages    enable row level security;
alter table public.legion_reactions   enable row level security;

drop policy if exists legion_entreprises_select on public.legion_entreprises;
create policy legion_entreprises_select on public.legion_entreprises
  for select using (public.legion_est_membre(id) or owner_id = auth.uid());
drop policy if exists legion_entreprises_insert on public.legion_entreprises;
create policy legion_entreprises_insert on public.legion_entreprises
  for insert with check (owner_id = auth.uid());
drop policy if exists legion_entreprises_update on public.legion_entreprises;
create policy legion_entreprises_update on public.legion_entreprises
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists legion_membres_select on public.legion_membres;
create policy legion_membres_select on public.legion_membres
  for select using (public.legion_est_membre(entreprise_id));

drop policy if exists legion_agents_select on public.legion_agents;
create policy legion_agents_select on public.legion_agents
  for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_agents_write on public.legion_agents;
create policy legion_agents_write on public.legion_agents
  for all using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

drop policy if exists legion_canaux_select on public.legion_canaux;
create policy legion_canaux_select on public.legion_canaux
  for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_canaux_write on public.legion_canaux;
create policy legion_canaux_write on public.legion_canaux
  for all using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

drop policy if exists legion_messages_select on public.legion_messages;
create policy legion_messages_select on public.legion_messages
  for select using (public.legion_est_membre(entreprise_id));
-- Un humain écrit sous SA propre identité: l'agent qu'il signe doit lui
-- appartenir. On ne se fait pas passer pour un agent.
drop policy if exists legion_messages_insert on public.legion_messages;
create policy legion_messages_insert on public.legion_messages
  for insert with check (
    public.legion_est_membre(entreprise_id)
    and user_id = auth.uid()
    and exists (select 1 from public.legion_agents a where a.id = auteur_id and a.user_id = auth.uid())
  );
drop policy if exists legion_messages_update on public.legion_messages;
create policy legion_messages_update on public.legion_messages
  for update using (public.legion_est_membre(entreprise_id)) with check (public.legion_est_membre(entreprise_id));

drop policy if exists legion_reactions_select on public.legion_reactions;
create policy legion_reactions_select on public.legion_reactions
  for select using (exists (select 1 from public.legion_messages m where m.id = message_id and public.legion_est_membre(m.entreprise_id)));
drop policy if exists legion_reactions_write on public.legion_reactions;
create policy legion_reactions_write on public.legion_reactions
  for all using (exists (select 1 from public.legion_agents a where a.id = auteur_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.legion_agents a where a.id = auteur_id and a.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Le propriétaire est membre, sans rien faire
-- ---------------------------------------------------------------------------
create or replace function public.legion_inscrire_proprietaire()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.legion_membres (entreprise_id, user_id, role)
  values (new.id, new.owner_id, 'proprietaire')
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists trg_legion_inscrire_proprietaire on public.legion_entreprises;
create trigger trg_legion_inscrire_proprietaire
  after insert on public.legion_entreprises
  for each row execute function public.legion_inscrire_proprietaire();
revoke execute on function public.legion_inscrire_proprietaire() from public;
revoke execute on function public.legion_inscrire_proprietaire() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Le téléphone sonne pour ce qui attend le propriétaire
-- ---------------------------------------------------------------------------
create or replace function public.legion_prevenir()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  qui text; salon text; proprio uuid; sonne boolean;
begin
  sonne := new.genre in ('question', 'decision', 'proposition', 'reunion')
        or (new.genre = 'tache' and new.assigne_a is not null
            and exists (select 1 from public.legion_agents a where a.id = new.assigne_a and a.user_id is not null));
  if not sonne or new.user_id is not null then return new; end if;

  select a.nom into qui from public.legion_agents a where a.id = new.auteur_id;
  select c.nom into salon from public.legion_canaux c where c.id = new.canal_id;
  select e.owner_id into proprio from public.legion_entreprises e where e.id = new.entreprise_id;

  perform public.push_notify(
    proprio,
    coalesce(qui, '?') || ' - ' || coalesce(salon, '?'),
    left(new.texte, 140),
    '/legion/' || new.entreprise_id || '?canal=' || new.canal_id,
    'legion-' || new.canal_id
  );
  return new;
end;
$$;
drop trigger if exists trg_legion_prevenir on public.legion_messages;
create trigger trg_legion_prevenir
  after insert on public.legion_messages
  for each row execute function public.legion_prevenir();
revoke execute on function public.legion_prevenir() from public;
revoke execute on function public.legion_prevenir() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Créer une entreprise depuis un modèle — l'organigramme se déploie
-- ---------------------------------------------------------------------------
-- C'est LE geste de Legion: on choisit un modèle, on règle la taille, on
-- nomme, et l'équipe apparaît, chacun avec un nom, un visage, un poste, un
-- mandat, et l'agent du catalogue qui le fait tourner.
create or replace function public.legion_creer_entreprise(
  p_nom text, p_modele text, p_taille text, p_projet text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  eid uuid;
  rang int := 0;
  p record;
  prenoms text[] := array['Amara','Nadia','Kofi','Léa','Yannick','Sarah','Malik','Inès','Tomas','Aïcha',
                          'Jules','Fatou','Elias','Chloé','Rayan','Nora','Idris','Maya','Samuel','Zoé',
                          'Omar','Lina','Noah','Adaeze','Ismaël','Salomé','Kwame','Élise','Bilal','Awa'];
  couleurs text[] := array['#C25E38','#2A9D8F','#6366F1','#E09F3E','#8B5CF6','#38BDF8','#FB7185','#34D399'];
  tailles text[] := array['cocon','startup','scaleup','megacorp'];
  niveau int;
  prenom text;
  cle text;
begin
  if auth.uid() is null then raise exception 'Il faut être connecté.'; end if;
  if p_taille is null or not (p_taille = any(tailles)) then p_taille := 'startup'; end if;
  niveau := array_position(tailles, p_taille);

  insert into public.legion_entreprises (nom, modele, taille, projet, owner_id)
  values (btrim(p_nom), p_modele, p_taille, p_projet, auth.uid())
  returning id into eid;

  -- Le fondateur, sous son propre nom: c'est lui qui parle depuis le téléphone.
  insert into public.legion_agents (entreprise_id, cle, nom, poste, mandat, emoji, couleur, user_id, ordre)
  values (eid, 'fondateur', coalesce((select name from public.profiles where id = auth.uid()), 'Toi'),
          'Fondateur', 'Tranche. Rien ne se fait contre.', '👑', '#E09F3E', auth.uid(), 1);

  -- Les postes du modèle, jusqu'à la taille choisie.
  for p in
    select * from public.studio_modele_postes
     where modele = p_modele
       and array_position(tailles, des_la_taille) <= niveau
     order by ordre
  loop
    rang := rang + 1;
    prenom := prenoms[1 + (rang * 7 + length(p.poste)) % array_length(prenoms, 1)];
    cle := left(regexp_replace(lower(translate(p.poste, 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc')), '[^a-z0-9]+', '-', 'g'), 40);
    -- Deux postes au même nom dans un modèle: on numérote.
    if exists (select 1 from public.legion_agents where entreprise_id = eid and legion_agents.cle = cle) then
      cle := cle || '-' || rang;
    end if;
    insert into public.legion_agents
      (entreprise_id, cle, nom, poste, departement, mandat, avatar_url, couleur,
       catalogue_cle, est_directeur, actif, ordre)
    values
      (eid, cle, prenom, p.poste, p.departement, p.mandat,
       'https://api.dicebear.com/9.x/notionists/svg?seed=' || eid::text || '-' || cle,
       couleurs[1 + rang % array_length(couleurs, 1)],
       p.agent_cle, p.est_directeur,
       -- Un poste « à écrire » existe mais dort: on le dit, on ne fait pas semblant.
       not p.a_ecrire,
       10 + p.ordre);
  end loop;

  -- Les salons de départ: un par département, plus la direction.
  insert into public.legion_canaux (entreprise_id, cle, nom, a_quoi_ca_sert, emoji, ordre)
  values (eid, 'direction', 'Direction', 'Ce qui attend une décision du fondateur.', '🎯', 1);
  insert into public.legion_canaux (entreprise_id, cle, nom, a_quoi_ca_sert, emoji, ordre)
  select eid, left(regexp_replace(lower(translate(d.departement, 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc')), '[^a-z0-9]+', '-', 'g'), 40),
         d.departement, 'Le travail du département ' || d.departement || '.', '💬', 10 + row_number() over ()
    from (select distinct departement from public.legion_agents where entreprise_id = eid and departement is not null and departement <> 'Direction') d
  on conflict do nothing;

  -- Le premier message: le directeur de mission se présente et demande le projet.
  insert into public.legion_messages (entreprise_id, canal_id, auteur_id, texte, genre)
  select eid, c.id, a.id,
         'Bonjour. Je suis ' || a.nom || ', ' || lower(a.poste) || '. L''équipe est en place — ' ||
         (select count(*) from public.legion_agents where entreprise_id = eid and user_id is null and actif) ||
         ' personnes en service' ||
         case when (select count(*) from public.legion_agents where entreprise_id = eid and not actif) > 0
              then ', et ' || (select count(*) from public.legion_agents where entreprise_id = eid and not actif) || ' postes encore à pourvoir'
              else '' end ||
         '. Dis-nous en une phrase ce que tu veux obtenir cette semaine, et on se répartit le travail.',
         'question'
    from public.legion_canaux c
    join public.legion_agents a on a.entreprise_id = eid and a.est_directeur and a.user_id is null
   where c.entreprise_id = eid and c.cle = 'direction'
   order by a.ordre limit 1;

  return eid;
end;
$$;

-- Appelée par l'application, pour un compte connecté. `public` retiré d'abord
-- (leçon de la migration 0133), puis accordé à `authenticated` seulement.
revoke execute on function public.legion_creer_entreprise(text, text, text, text) from public;
revoke execute on function public.legion_creer_entreprise(text, text, text, text) from anon;
grant execute on function public.legion_creer_entreprise(text, text, text, text) to authenticated;
