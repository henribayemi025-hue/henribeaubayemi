-- 0202 — La Finia commune, V0 (Beau, 24/09, 22 h : « oui Finia commune »,
-- « oui Accounting », apprendre des conversations des gens : oui, « les
-- utilisateurs choisissent s'ils veulent », « tout ça sera dans la politique
-- de confidentialité » ; puis 22 h 15 : le réglage est ALLUMÉ par défaut,
-- à condition que ce soit dit clairement et qu'on puisse refuser d'un geste).
--
-- Une seule Finia pour toutes les applications Finjaro, qui apprend de
-- l'usage réel, avec la même boucle que « Léo apprend tout seul » (0198) :
-- rien de ce qu'elle apprend ne sert avant le « Confirmer » d'un humain.
--
--   1. ia_consentements : l'accord de chaque personne (une ligne par compte).
--      Sans ligne, ou tant que la personne n'a pas VU la phrase qui
--      l'explique (informe_le), rien n'est gardé. Refuser efface ce qui a
--      été gardé d'elle (voir ia_consentement_regler).
--   2. ia_pays_accord_explicite : les pays où l'on demande un « oui » avant
--      de garder quoi que ce soit (éteint par défaut). VIDE aujourd'hui, par
--      décision de Beau ; y ajouter un code pays (« FR », « GB »…) suffit à
--      passer ce pays en accord explicite, sans code ni déploiement.
--   3. ia_apprentissage : les échanges UTILES gardés, anonymes — une question
--      restée sans réponse, une correction de la personne, un pouce vers le
--      bas. Nettoyés AVANT d'être rangés (e-mails, téléphones, adresses,
--      noms, numéros de commande). Aucun user_id : une empreinte de la
--      semaine, qui ne sert qu'à compter les personnes distinctes. Gardés 12
--      mois au plus (tâche quotidienne plus bas).
--   4. ia_savoirs_communs : ce que Finia sait, validé par un humain. Lu par
--      Finia de la place de marché (finou-chat) et, demain, par celle
--      d'Accounting (contrat : docs/FINIA-COMMUNE.md).
--
-- NOMS : la base est PARTAGÉE avec Finjaro Accounting, qui possède les
-- tables finia_* (finia_workspaces, finia_members, finia_events). Rien ici ne
-- commence par « finia_ » : tout est en « ia_ », comme ia_traces (0167),
-- qui est à la place de marché. Aucune table d'Accounting n'est lue ni
-- écrite par cette migration.
--
-- Additive : 4 tables neuves, des fonctions neuves, deux tâches planifiées
-- neuves, un nom de plus dans la liste d'ai_usage. Rien n'est retiré ni
-- renommé. Les comptes de test (profiles.is_test) et l'équipe (is_admin)
-- sont exclus par compte_reel() (0120), la définition commune.

-- ——— 1. L'accord ———
create table if not exists public.ia_consentements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- null = la personne n'a rien choisi : la règle par défaut s'applique
  -- (allumé, sauf pays à accord explicite). true / false = son choix.
  apprentissage boolean,
  -- La première fois qu'on lui a MONTRÉ la phrase qui explique (bulle de
  -- Finia). Tant que c'est vide, rien n'est gardé, même par défaut.
  informe_le timestamptz,
  change_le timestamptz,
  -- L'application où elle a choisi en dernier (marketplace, accounting…).
  app text,
  created_at timestamptz not null default now()
);
comment on table public.ia_consentements is 'Finia commune (0202) : l''accord de chaque personne pour que ses échanges, anonymisés, aident Finia à s''améliorer. Commun à toutes les applications Finjaro. Écrit seulement par les fonctions ia_consentement_*.';
alter table public.ia_consentements enable row level security;
drop policy if exists ia_consentements_lire on public.ia_consentements;
create policy ia_consentements_lire on public.ia_consentements for select using (user_id = auth.uid());
grant select on public.ia_consentements to authenticated;

create table if not exists public.ia_pays_accord_explicite (
  pays text primary key,           -- code ISO à deux lettres, en majuscules
  note text,
  created_at timestamptz not null default now()
);
comment on table public.ia_pays_accord_explicite is 'Finia commune (0202) : pays où l''apprentissage est ÉTEINT par défaut (il faut un « oui »). Vide par décision de Beau (24/09) ; prévu pour l''Union européenne et le Royaume-Uni si besoin.';
alter table public.ia_pays_accord_explicite enable row level security;
-- Aucune politique : seules les fonctions (security definer) la lisent.

-- ——— 2. Ce qui est gardé ———
create table if not exists public.ia_apprentissage (
  id uuid primary key default gen_random_uuid(),
  app text not null check (app in ('marketplace', 'accounting', 'leo')),
  genre text not null check (genre in ('sans_reponse', 'correction', 'pouce_bas')),
  question text,                   -- ce que la personne a demandé (nettoyé)
  reponse text,                    -- ce que Finia a répondu (nettoyé)
  correction text,                 -- ce que la personne a répondu à Finia (nettoyé)
  langue text,                     -- fr, en…
  ecran text,                      -- le chemin de l'écran, sans paramètre
  -- Empreinte de LA SEMAINE (sel secret + compte + semaine) : compte les
  -- personnes distinctes d'une semaine, ne relie pas deux semaines, ne se
  -- retourne pas en compte. Jamais d'user_id en clair.
  empreinte text not null,
  traite_le timestamptz,           -- lu par la boucle de la semaine (finia-apprentissage)
  created_at timestamptz not null default now()
);
comment on table public.ia_apprentissage is 'Finia commune (0202) : échanges utiles à l''apprentissage, anonymisés, de personnes qui ne l''ont pas refusé. Aucun user_id. Effacés après 12 mois. Écrits seulement par ia_apprendre().';
create index if not exists ia_apprentissage_date on public.ia_apprentissage (created_at desc);
create index if not exists ia_apprentissage_empreinte on public.ia_apprentissage (empreinte);
create index if not exists ia_apprentissage_a_traiter on public.ia_apprentissage (created_at) where traite_le is null;
alter table public.ia_apprentissage enable row level security;
-- Aucune politique : ni lecture ni écriture depuis un navigateur. L'écriture
-- passe par ia_apprendre(), la lecture par la clé de service (la boucle) et
-- par ia_questions_frequentes() (les agents de Léo).

-- ——— 3. Le savoir commun ———
create table if not exists public.ia_savoirs_communs (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  texte text not null,
  langue text not null default 'toutes' check (langue in ('fr', 'en', 'toutes')),
  portee text not null default 'toutes' check (portee in ('marketplace', 'accounting', 'leo', 'toutes')),
  source text not null default 'equipe' check (source in ('apprentissage', 'equipe')),
  -- propose → actif (Confirmer d'un humain) ou ecarte ; actif → retire.
  etat text not null default 'propose' check (etat in ('propose', 'actif', 'ecarte', 'retire')),
  actif boolean not null default false,
  -- Combien d'échanges gardés l'ont inspiré : un nombre COMPTÉ, pas écrit par un modèle.
  exemples integer not null default 0,
  pourquoi text,                   -- ce que la proposition corrige, en une phrase
  a_verifier text,                 -- ce que l'humain doit vérifier avant de confirmer
  remplace uuid references public.ia_savoirs_communs(id), -- le savoir actif qu'il corrige (retiré au Confirmer)
  raison text,                     -- pourquoi elle a été écartée ou retirée
  propose_par text,                -- 'finia-apprentissage' ou le nom de l'équipe
  valide_par uuid,
  valide_le timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.ia_savoirs_communs is 'Finia commune (0202) : ce que Finia sait, validé par un humain. Portée : marketplace, accounting, leo ou toutes. Seuls les savoirs actifs sont lisibles hors de la clé de service.';
create index if not exists ia_savoirs_communs_actifs on public.ia_savoirs_communs (portee) where actif;
alter table public.ia_savoirs_communs enable row level security;
-- Un savoir actif ne contient aucune donnée personnelle (vérifié avant
-- proposition, puis par l'humain qui confirme) : toutes les Finia le lisent,
-- y compris celle d'Accounting, qui n'a pas de fonction serveur.
drop policy if exists ia_savoirs_communs_lire on public.ia_savoirs_communs;
create policy ia_savoirs_communs_lire on public.ia_savoirs_communs for select using (actif);
grant select on public.ia_savoirs_communs to anon, authenticated;

-- ——— 4. Le sel de l'empreinte et le jeton de la boucle ———
insert into public.app_secrets (name, value)
values ('ia_apprentissage_sel', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;
insert into public.app_secrets (name, value)
values ('finia_apprentissage', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

-- L'empreinte d'une personne pour une semaine donnée (lundi de la semaine).
create or replace function public.ia_empreinte(p_uid uuid, p_semaine date)
returns text
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select encode(extensions.digest(s.value || ':' || p_uid::text || ':' || to_char(date_trunc('week', p_semaine::timestamp), 'IYYY-IW'), 'sha256'), 'hex')
    from public.app_secrets s where s.name = 'ia_apprentissage_sel';
$$;
revoke all on function public.ia_empreinte(uuid, date) from public, anon, authenticated;

-- ——— 5. Le nettoyage, dans la base ———
-- Même règle quelle que soit l'application qui envoie : ce qui arrive ici
-- est nettoyé ICI, pas seulement « si l'appelant y a pensé ». Filet large :
-- mieux vaut un mot utile masqué qu'une donnée personnelle gardée.
create or replace function public.ia_nettoyer(p_texte text, p_uid uuid default null)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  t text := coalesce(p_texte, '');
  nom text;
  morceau text;
begin
  if t = '' then return null; end if;
  -- Adresses e-mail et liens.
  t := regexp_replace(t, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[e-mail]', 'g');
  t := regexp_replace(t, 'https?://[^[:space:]]+', '[lien]', 'gi');
  t := regexp_replace(t, 'www\.[^[:space:]]+', '[lien]', 'gi');
  -- Identifiants techniques (numéros de commande de la base, entre autres).
  t := regexp_replace(t, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '[numéro]', 'g');
  -- Numéros de commande annoncés comme tels.
  t := regexp_replace(t, '((commande|order|cmd)[[:space:]]*(n°|no\.?|num[ée]ro|number|#)?[[:space:]]*:?[[:space:]]*)#?[A-Za-z0-9-]*[0-9][A-Za-z0-9-]*', '\1[numéro de commande]', 'gi');
  t := regexp_replace(t, '#[[:space:]]?[A-Za-z0-9-]*[0-9][A-Za-z0-9-]*', '[numéro]', 'g');
  -- Téléphones : 8 chiffres ou plus, avec ou sans espaces, points, tirets.
  -- « 1 500 000 » (7 chiffres) reste un prix ; au-delà, on masque.
  t := regexp_replace(t, '\+?[0-9](?:[[:space:].()-]*[0-9]){7,}', '[téléphone]', 'g');
  -- Autres suites longues de chiffres (comptes, pièces, références).
  t := regexp_replace(t, '[0-9]{6,}', '[numéro]', 'g');
  -- Adresses : « 12 rue … », « BP 123 », « avenue … ».
  t := regexp_replace(t, '[0-9]{1,4}[[:space:]]*(bis|ter)?,?[[:space:]]+(rue|avenue|av\.|boulevard|bd|chemin|all[ée]e|impasse|place|route|quai|street|st\.|road|rd\.|lane|drive|avenue)[[:space:]]+[^,.;!?\n]{2,40}', '[adresse]', 'gi');
  t := regexp_replace(t, '(^|[^[:alnum:]])(rue|avenue|boulevard|impasse|street|road)[[:space:]]+[^,.;!?\n]{2,40}', '\1[adresse]', 'gi');
  t := regexp_replace(t, '(B\.?P\.?|P\.?O\.? ?Box)[[:space:]]*[0-9]+', '[adresse]', 'gi');
  -- Noms : après une présentation ou une civilité.
  t := regexp_replace(t, '(je m''appelle|je m’appelle|mon nom est|mon nom c''est|mon nom c’est|my name is|call me|appelez-moi|appelle-moi|moi c''est|moi c’est)[[:space:]]+[^[:space:],.;!?]+([[:space:]]+[[:upper:]][^[:space:],.;!?]*)?', '\1 [nom]', 'gi');
  t := regexp_replace(t, '(^|[^[:alnum:]])(M\.|Mr\.?|Mrs\.?|Ms\.?|Mme|Mlle|Madame|Monsieur|Dr\.?)[[:space:]]+[[:upper:]][[:alnum:]''’-]+', '\1\2 [nom]', 'g');
  t := regexp_replace(t, '@[A-Za-z0-9_.]{2,}', '[pseudo]', 'g');
  -- Le nom du compte lui-même, partout où il apparaît (Finia dit souvent
  -- « Salut Marie ») : chaque morceau de 3 lettres ou plus.
  if p_uid is not null then
    select name into nom from public.profiles where id = p_uid;
    if nom is not null then
      foreach morceau in array regexp_split_to_array(trim(nom), '[[:space:]]+') loop
        if char_length(morceau) >= 3 then
          t := regexp_replace(t, '(^|[^[:alnum:]])' || regexp_replace(morceau, '([.*+?^${}()|\[\]\\])', '\\\1', 'g') || '($|[^[:alnum:]])', '\1[nom]\2', 'gi');
        end if;
      end loop;
    end if;
  end if;
  return nullif(trim(t), '');
end $$;
revoke all on function public.ia_nettoyer(text, uuid) from public, anon, authenticated;

-- ——— 6. Les fonctions de l'accord ———
-- Garde-t-on quelque chose de cette personne ? Compte réel (ni test, ni
-- équipe), et : son choix s'il en a fait un ; sinon allumé par défaut, mais
-- seulement si elle a vu la phrase, et hors pays à accord explicite.
create or replace function public.ia_apprentissage_permis(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce((
    select case
      when not public.compte_reel(p.id) then false
      when c.apprentissage is not null then c.apprentissage
      when c.informe_le is null then false
      when exists (select 1 from public.ia_pays_accord_explicite x where x.pays = upper(trim(coalesce(p.country, '')))) then false
      else true
    end
    from public.profiles p
    left join public.ia_consentements c on c.user_id = p.id
    where p.id = p_uid
  ), false);
$$;
revoke all on function public.ia_apprentissage_permis(uuid) from public, anon, authenticated;

-- Ce que l'écran doit montrer : le réglage, et s'il faut encore dire la
-- phrase (ou poser la question, dans un pays à accord explicite).
create or replace function public.ia_consentement_etat()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  uid uuid := auth.uid();
  c public.ia_consentements;
  v_pays text;
  explicite boolean;
begin
  if uid is null then return jsonb_build_object('connecte', false); end if;
  select * into c from public.ia_consentements where user_id = uid;
  select upper(trim(coalesce(country, ''))) into v_pays from public.profiles where id = uid;
  explicite := exists (select 1 from public.ia_pays_accord_explicite x where x.pays = v_pays);
  return jsonb_build_object(
    'connecte', true,
    'choix', c.apprentissage,                        -- null : rien choisi
    'informe', c.informe_le is not null,
    'accord_explicite', explicite,                   -- il faut un « oui »
    'par_defaut', not explicite,                     -- ce que vaut « rien choisi »
    'permis', public.ia_apprentissage_permis(uid),   -- ce qui s'applique vraiment
    'compte_reel', public.compte_reel(uid)
  );
end $$;
revoke all on function public.ia_consentement_etat() from public, anon;
grant execute on function public.ia_consentement_etat() to authenticated;

-- La phrase a été montrée (bulle de Finia, ou l'écran équivalent d'une
-- autre application).
create or replace function public.ia_consentement_informer(p_app text default 'marketplace')
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.ia_consentements (user_id, informe_le, app)
  values (auth.uid(), now(), left(coalesce(p_app, 'marketplace'), 20))
  on conflict (user_id) do update set informe_le = coalesce(public.ia_consentements.informe_le, now());
end $$;
revoke all on function public.ia_consentement_informer(text) from public, anon;
grant execute on function public.ia_consentement_informer(text) to authenticated;

-- Le réglage. Refuser efface aussi ce qui a déjà été gardé d'elle : les
-- empreintes de chaque semaine des 12 derniers mois sont recalculées et les
-- lignes correspondantes supprimées. Rend le nombre de lignes effacées.
create or replace function public.ia_consentement_regler(p_oui boolean, p_app text default 'marketplace')
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid := auth.uid();
  n integer := 0;
begin
  if uid is null or p_oui is null then return 0; end if;
  insert into public.ia_consentements (user_id, apprentissage, informe_le, change_le, app)
  values (uid, p_oui, now(), now(), left(coalesce(p_app, 'marketplace'), 20))
  on conflict (user_id) do update set apprentissage = p_oui, change_le = now(),
    informe_le = coalesce(public.ia_consentements.informe_le, now()), app = excluded.app;
  if not p_oui then
    delete from public.ia_apprentissage a
     where a.empreinte in (
       select public.ia_empreinte(uid, (current_date - (7 * k))::date) from generate_series(0, 54) as k
     );
    get diagnostics n = row_count;
  end if;
  return n;
end $$;
revoke all on function public.ia_consentement_regler(boolean, text) from public, anon;
grant execute on function public.ia_consentement_regler(boolean, text) to authenticated;

-- ——— 7. Garder un échange ———
-- Appelée avec le jeton de la PERSONNE (auth.uid()) : par finou-chat pour une
-- question sans réponse ou une correction, par la bulle pour un pouce vers le
-- bas, et demain par Accounting. Ne garde rien si la personne ne l'a pas
-- permis. Rend true si l'échange est gardé.
create or replace function public.ia_apprendre(
  p_app text,
  p_genre text,
  p_question text,
  p_reponse text default null,
  p_correction text default null,
  p_langue text default null,
  p_ecran text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid := auth.uid();
  emp text;
  n integer;
begin
  if uid is null then return false; end if;                        -- invités : jamais
  if p_app not in ('marketplace', 'accounting', 'leo') then return false; end if;
  if p_genre not in ('sans_reponse', 'correction', 'pouce_bas') then return false; end if;
  if coalesce(trim(p_question), '') = '' and coalesce(trim(p_reponse), '') = '' then return false; end if;
  if not public.ia_apprentissage_permis(uid) then return false; end if;
  emp := public.ia_empreinte(uid, current_date);
  if emp is null then return false; end if;                        -- pas de sel : rien
  -- Au plus 30 échanges par personne et par jour : un filet contre le
  -- remplissage, pas une limite qu'une vraie personne atteint.
  select count(*) into n from public.ia_apprentissage
   where empreinte = emp and created_at > now() - interval '1 day';
  if n >= 30 then return false; end if;
  insert into public.ia_apprentissage (app, genre, question, reponse, correction, langue, ecran, empreinte)
  values (
    p_app, p_genre,
    left(public.ia_nettoyer(left(p_question, 1500), uid), 1000),
    left(public.ia_nettoyer(left(p_reponse, 2500), uid), 1500),
    left(public.ia_nettoyer(left(p_correction, 1500), uid), 1000),
    left(lower(split_part(coalesce(p_langue, ''), '-', 1)), 5),
    -- Le chemin seulement : pas de paramètre ni d'identifiant.
    left(regexp_replace(split_part(split_part(coalesce(p_ecran, ''), '?', 1), '#', 1), '[0-9a-fA-F-]{8,}', ':id', 'g'), 80),
    emp
  );
  return true;
end $$;
revoke all on function public.ia_apprendre(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.ia_apprendre(text, text, text, text, text, text, text) to authenticated;

-- ——— 8. Les questions fréquentes, pour les agents de Léo ———
-- Anonymes : un nombre (échanges, personnes distinctes de la semaine) et des
-- exemples déjà nettoyés. Appelée par la clé de service seulement (outil
-- « questions_finia » de _shared/enquete.ts). 7 jours au plus : l'empreinte
-- change chaque semaine, au-delà on compterait deux fois la même personne.
create or replace function public.ia_questions_frequentes(p_jours integer default 7, p_app text default null)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with lignes as (
    select * from public.ia_apprentissage
     where created_at > now() - make_interval(days => greatest(1, least(coalesce(p_jours, 7), 7)))
       and (p_app is null or app = p_app)
  )
  select jsonb_build_object(
    'jours', greatest(1, least(coalesce(p_jours, 7), 7)),
    'echanges', (select count(*) from lignes),
    'personnes', (select count(distinct empreinte) from lignes),
    'par_genre', coalesce((select jsonb_object_agg(genre, n) from (select genre, count(*) n from lignes group by genre) g), '{}'::jsonb),
    'par_langue', coalesce((select jsonb_object_agg(coalesce(nullif(langue, ''), '?'), n) from (select langue, count(*) n from lignes group by langue) l), '{}'::jsonb),
    'exemples', coalesce((select jsonb_agg(jsonb_build_object('genre', genre, 'app', app, 'langue', langue, 'question', left(question, 300), 'correction', left(correction, 200)) order by created_at desc)
                            from (select * from lignes where question is not null order by created_at desc limit 12) e), '[]'::jsonb),
    'note', 'Échanges anonymisés de personnes qui ne l''ont pas refusé ; comptes de test et équipe exclus. Rien de ceci n''est une donnée personnelle.'
  );
$$;
revoke all on function public.ia_questions_frequentes(integer, text) from public, anon, authenticated;

-- ——— 9. Les tâches planifiées ———
-- Chaque nuit : ce qui a plus de 12 mois est effacé.
select cron.unschedule('ia-apprentissage-purge') where exists (select 1 from cron.job where jobname = 'ia-apprentissage-purge');
select cron.schedule('ia-apprentissage-purge', '17 3 * * *', $$delete from public.ia_apprentissage where created_at < now() - interval '12 months'$$);

-- Chaque lundi à 7 h UTC : la boucle de la semaine (finia-apprentissage).
-- Rien de gardé cette semaine : on n'appelle rien.
create or replace function public.lancer_finia_apprentissage()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'finia_apprentissage';
  if jeton is null then return; end if;
  if not exists (select 1 from public.ia_apprentissage where traite_le is null) then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/finia-apprentissage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.lancer_finia_apprentissage() from public, anon, authenticated;

select cron.unschedule('finia-apprentissage') where exists (select 1 from cron.job where jobname = 'finia-apprentissage');
select cron.schedule('finia-apprentissage', '0 7 * * 1', $$select public.lancer_finia_apprentissage()$$);

-- ——— 10. Le coût de la boucle dans ai_usage ———
-- On AJOUTE « finia_apprentissage » à la liste telle qu'elle est en base au
-- moment d'appliquer (même méthode que 0194/0195) : rien de ce qu'une autre
-- migration ou une autre application y a mis n'est perdu.
do $$
declare
  v_def text;
  v_noms text[];
begin
  select pg_get_constraintdef(oid) into v_def
    from pg_constraint
   where conname = 'ai_usage_fn_check' and conrelid = 'public.ai_usage'::regclass;
  if v_def is null then return; end if;
  select array_agg(m[1]) into v_noms from regexp_matches(v_def, '''([^'']+)''', 'g') as m;
  if array_length(v_noms, 1) = 1 and left(v_noms[1], 1) = '{' then v_noms := v_noms[1]::text[]; end if;
  if v_noms is null or 'finia_apprentissage' = any (v_noms) then return; end if;
  v_noms := v_noms || 'finia_apprentissage'::text;
  alter table public.ai_usage drop constraint ai_usage_fn_check;
  execute 'alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array['
    || (select string_agg(quote_literal(n), ', ') from unnest(v_noms) as n) || ']))';
end $$;
