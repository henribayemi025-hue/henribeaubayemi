-- LEGION — la sécurité (idées 48, 104, 109 et 117 des 200, 24/09).
--
-- 1. LE JOURNAL INALTÉRABLE ET SIGNÉ des décisions : chaque décision, compte
--    rendu, livrable et action confirmée y laisse une ligne — son empreinte
--    (sha256 du contenu au moment où il est écrit), une signature (HMAC avec
--    une clé qui ne quitte jamais le serveur : la preuve que Legion l'a
--    produit) et un maillon de chaîne (chaque ligne contient l'empreinte de
--    la précédente). Aucune ligne ne se modifie ni ne s'efface : un
--    déclencheur refuse, même pour les fonctions du serveur. Seul un
--    administrateur de la base pourrait lever cette protection — et la
--    chaîne le révélerait. « Vérifier » recalcule tout, et dit aussi si un
--    message a été modifié après coup.
-- 2. LES RÔLES : propriétaire, membre, et « lecteur » (il lit tout, n'écrit
--    rien : ni message, ni agent). Le propriétaire les change.
-- 3. LES JETONS QUI EXPIRENT : un jeton d'assistant (MCP) peut porter une
--    date de fin ; passé cette date, le serveur ne le reconnaît plus. Et un
--    geste pour le remplacer (révoquer + recréer).
--
-- Additive : une table, des fonctions, une colonne ; les règles d'écriture
-- des messages et des agents demandent désormais un rôle qui écrit (tous
-- les membres actuels l'ont).

-- ——— 1. Le journal ———
insert into public.app_secrets (name, value)
values ('legion_signature', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create table if not exists public.legion_journal (
  id bigserial primary key,
  entreprise_id uuid not null,
  message_id uuid not null,
  auteur_id uuid,
  genre text not null check (genre in ('decision', 'compte_rendu', 'livrable', 'action')),
  empreinte text not null,
  signature text not null,
  precedent text,
  chaine text not null,
  created_at timestamptz not null default now()
);
create index if not exists legion_journal_entreprise on public.legion_journal (entreprise_id, id);
alter table public.legion_journal enable row level security;
drop policy if exists legion_journal_lire on public.legion_journal;
create policy legion_journal_lire on public.legion_journal for select using (public.legion_est_membre(entreprise_id));

create or replace function public.legion_journal_intouchable()
returns trigger language plpgsql as $$
begin
  raise exception 'Le journal de Legion ne se modifie pas et ne s''efface pas.';
end $$;
drop trigger if exists legion_journal_intouchable on public.legion_journal;
create trigger legion_journal_intouchable before update or delete on public.legion_journal
  for each row execute function public.legion_journal_intouchable();

-- L'empreinte d'un message : ce qui ne doit plus changer.
create or replace function public.legion_empreinte(p_id uuid, p_auteur uuid, p_genre text, p_texte text, p_cree timestamptz, p_extra text default '')
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(p_id::text || '|' || coalesce(p_auteur::text, '') || '|' || coalesce(p_genre, '') || '|' || coalesce(p_texte, '') || '|' || to_char(p_cree at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|' || coalesce(p_extra, ''), 'sha256'), 'hex');
$$;

create or replace function public.legion_journal_ajouter(p_entreprise uuid, p_message uuid, p_auteur uuid, p_genre text, p_empreinte text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_cle text; v_prec text; v_quand timestamptz := clock_timestamp();
begin
  perform pg_advisory_xact_lock(hashtext('legion_journal:' || p_entreprise::text));
  select value into v_cle from public.app_secrets where name = 'legion_signature';
  select chaine into v_prec from public.legion_journal where entreprise_id = p_entreprise order by id desc limit 1;
  insert into public.legion_journal (entreprise_id, message_id, auteur_id, genre, empreinte, signature, precedent, chaine, created_at)
  values (p_entreprise, p_message, p_auteur, p_genre, p_empreinte,
          encode(extensions.hmac(p_empreinte, coalesce(v_cle, ''), 'sha256'), 'hex'),
          v_prec,
          encode(extensions.digest(coalesce(v_prec, '') || p_empreinte || to_char(v_quand at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), 'sha256'), 'hex'),
          v_quand);
end $$;
revoke all on function public.legion_journal_ajouter(uuid, uuid, uuid, text, text) from public, anon, authenticated;

create or replace function public.legion_journaliser()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_genre text;
begin
  if tg_op = 'INSERT' then
    v_genre := case
      when new.meta->'reunion'->>'fin' = 'true' and new.genre = 'decision' then 'compte_rendu'
      when new.genre = 'decision' then 'decision'
      when new.meta ? 'livrable' then 'livrable'
      else null end;
    if v_genre is not null then
      perform public.legion_journal_ajouter(new.entreprise_id, new.id, new.auteur_id, v_genre,
        public.legion_empreinte(new.id, new.auteur_id, new.genre, new.texte, new.created_at));
    end if;
  elsif tg_op = 'UPDATE' then
    -- Une action proposée par un agent, confirmée ou refusée par un humain.
    if coalesce(new.meta->'action'->>'statut', '') in ('faite', 'refusee')
       and coalesce(old.meta->'action'->>'statut', '') is distinct from coalesce(new.meta->'action'->>'statut', '') then
      perform public.legion_journal_ajouter(new.entreprise_id, new.id, new.auteur_id, 'action',
        public.legion_empreinte(new.id, new.auteur_id, 'action', new.meta->>'action', new.created_at));
    end if;
  end if;
  return new;
exception when others then
  -- Le journal ne doit jamais empêcher un message de partir.
  raise warning 'journal: %', sqlerrm;
  return new;
end $$;
drop trigger if exists legion_journaliser on public.legion_messages;
create trigger legion_journaliser after insert or update on public.legion_messages
  for each row execute function public.legion_journaliser();

-- Vérifier le journal d'une entreprise : la chaîne, les signatures, et les
-- messages modifiés après coup.
create or replace function public.legion_verifier_journal(p_entreprise uuid)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare r record; v_cle text; v_prec text := null; v_n int := 0; v_rupture bigint := null; v_signature bigint := null;
        v_modifies jsonb := '[]'::jsonb; v_disparus jsonb := '[]'::jsonb; m record; v_emp text;
begin
  if not public.legion_est_membre(p_entreprise) then return null; end if;
  select value into v_cle from public.app_secrets where name = 'legion_signature';
  for r in select * from public.legion_journal where entreprise_id = p_entreprise order by id loop
    v_n := v_n + 1;
    if v_rupture is null and (r.precedent is distinct from v_prec
       or r.chaine <> encode(extensions.digest(coalesce(r.precedent, '') || r.empreinte || to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), 'sha256'), 'hex')) then
      v_rupture := r.id;
    end if;
    if v_signature is null and r.signature <> encode(extensions.hmac(r.empreinte, coalesce(v_cle, ''), 'sha256'), 'hex') then
      v_signature := r.id;
    end if;
    select id, auteur_id, genre, texte, created_at, meta into m from public.legion_messages where id = r.message_id;
    if m.id is null then
      v_disparus := v_disparus || to_jsonb(r.message_id);
    else
      v_emp := case when r.genre = 'action'
        then public.legion_empreinte(m.id, m.auteur_id, 'action', m.meta->>'action', m.created_at)
        else public.legion_empreinte(m.id, m.auteur_id, m.genre, m.texte, m.created_at) end;
      -- Pour une action, seule compte la dernière ligne du journal (le statut peut passer de proposé à fait).
      if v_emp <> r.empreinte and (r.genre <> 'action' or not exists (select 1 from public.legion_journal j2 where j2.message_id = r.message_id and j2.id > r.id)) then
        v_modifies := v_modifies || to_jsonb(r.message_id);
      end if;
    end if;
    v_prec := r.chaine;
  end loop;
  return jsonb_build_object('entrees', v_n, 'chaine_intacte', v_rupture is null, 'rupture_id', v_rupture,
    'signatures_ok', v_signature is null, 'modifies', v_modifies, 'disparus', v_disparus, 'derniere', v_prec);
end $$;
revoke all on function public.legion_verifier_journal(uuid) from public, anon;
grant execute on function public.legion_verifier_journal(uuid) to authenticated;

-- ——— 2. Les rôles ———
alter table public.legion_membres drop constraint if exists legion_membres_role_check;
alter table public.legion_membres add constraint legion_membres_role_check check (role in ('proprietaire', 'membre', 'lecteur'));

create or replace function public.legion_peut_agir(p_entreprise uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.legion_membres m where m.entreprise_id = p_entreprise and m.user_id = auth.uid() and m.role <> 'lecteur');
$$;

drop policy if exists legion_messages_insert on public.legion_messages;
create policy legion_messages_insert on public.legion_messages for insert with check (
  public.legion_peut_agir(entreprise_id) and user_id = auth.uid()
  and exists (select 1 from public.legion_agents a where a.id = legion_messages.auteur_id and a.user_id = auth.uid())
);
drop policy if exists legion_messages_update on public.legion_messages;
create policy legion_messages_update on public.legion_messages for update
  using (public.legion_peut_agir(entreprise_id)) with check (public.legion_peut_agir(entreprise_id));
drop policy if exists legion_agents_write on public.legion_agents;
create policy legion_agents_write on public.legion_agents for all
  using (public.legion_peut_agir(entreprise_id)) with check (public.legion_peut_agir(entreprise_id));

-- Les membres et leur rôle (le nom affiché vient de leur place d'agent humain).
create or replace function public.legion_membres_liste(p_entreprise uuid)
returns table (user_id uuid, role text, nom text, depuis timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, coalesce((select a.nom from public.legion_agents a where a.entreprise_id = m.entreprise_id and a.user_id = m.user_id limit 1), '—'), m.created_at
    from public.legion_membres m
   where m.entreprise_id = p_entreprise and public.legion_est_membre(p_entreprise)
   order by (m.role = 'proprietaire') desc, m.created_at;
$$;
revoke all on function public.legion_membres_liste(uuid) from public, anon;
grant execute on function public.legion_membres_liste(uuid) to authenticated;

create or replace function public.legion_changer_role(p_entreprise uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.legion_entreprises e where e.id = p_entreprise and e.owner_id = auth.uid()) then
    raise exception 'Seul le propriétaire change les rôles.';
  end if;
  if p_role not in ('membre', 'lecteur') then raise exception 'Rôle inconnu.'; end if;
  if p_user = auth.uid() then raise exception 'Le propriétaire garde son rôle.'; end if;
  update public.legion_membres set role = p_role where entreprise_id = p_entreprise and user_id = p_user and role <> 'proprietaire';
end $$;
revoke all on function public.legion_changer_role(uuid, uuid, text) from public, anon;
grant execute on function public.legion_changer_role(uuid, uuid, text) to authenticated;

-- ——— 3. Les jetons qui expirent ———
alter table public.legion_jetons add column if not exists expire_le timestamptz;

create or replace function public.legion_creer_jeton_expirant(p_nom text default 'Mon assistant', p_jours integer default 90)
returns text language plpgsql security definer set search_path = public as $$
declare v_clair text; v_actifs int;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select count(*) into v_actifs from legion_jetons where user_id = auth.uid() and revoque_le is null and (expire_le is null or expire_le > now());
  if v_actifs >= 5 then raise exception 'trop_de_jetons' using errcode = 'P0001'; end if;
  v_clair := 'lg_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into legion_jetons (user_id, nom, hache, expire_le)
  values (auth.uid(), left(coalesce(nullif(trim(p_nom), ''), 'Mon assistant'), 60), encode(extensions.digest(v_clair, 'sha256'), 'hex'),
          case when coalesce(p_jours, 0) > 0 then now() + make_interval(days => least(p_jours, 730)) else null end);
  return v_clair;
end $$;
revoke all on function public.legion_creer_jeton_expirant(text, integer) from public;
grant execute on function public.legion_creer_jeton_expirant(text, integer) to authenticated;

-- Remplacer un jeton : l'ancien est révoqué, un nouveau (même nom, même durée) naît.
create or replace function public.legion_remplacer_jeton(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare j record; v_jours int;
begin
  select * into j from legion_jetons where id = p_id and user_id = auth.uid() and revoque_le is null;
  if j.id is null then raise exception 'Jeton inconnu.'; end if;
  update legion_jetons set revoque_le = now() where id = j.id;
  v_jours := case when j.expire_le is null then 0 else greatest(1, extract(day from (j.expire_le - j.cree_le))::int) end;
  return public.legion_creer_jeton_expirant(j.nom, v_jours);
end $$;
revoke all on function public.legion_remplacer_jeton(uuid) from public;
grant execute on function public.legion_remplacer_jeton(uuid) to authenticated;

create or replace function public.legion_jeton_user(p_clair text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_user uuid;
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id, user_id into v_id, v_user from legion_jetons
   where hache = encode(extensions.digest(p_clair, 'sha256'), 'hex') and revoque_le is null
     and (expire_le is null or expire_le > now());
  if v_id is null then return null; end if;
  update legion_jetons set dernier_usage_le = now() where id = v_id;
  return v_user;
end $$;
revoke all on function public.legion_jeton_user(text) from public;
grant execute on function public.legion_jeton_user(text) to service_role;
