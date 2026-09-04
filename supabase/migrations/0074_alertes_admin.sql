-- Beau : « les tickets Finia n'arrivent que comme badge dans l'admin ».
-- Vérifié, et c'est pire que ça sur le second canal.
--
-- DEUX TROUS DISTINCTS :
--
-- 1. support_tickets (demandes d'aide remontées par Finia) — la fonction
--    edge `finou-chat` écrivait bien une ligne dans `notifications` pour
--    chaque admin, donc la cloche s'allumait. Mais aucun push, aucun
--    e-mail : il faut déjà être DANS la console d'administration pour voir
--    qu'on a quelque chose à y voir. Beau n'y va pas tous les jours.
--
-- 2. demandes_acheteurs (formulaire « réponse sous 24 h » affiché sur les
--    recherches vides, migration 0069) — RIEN. Ni cloche, ni push, ni
--    e-mail, et surtout aucun écran pour les lire : la table n'est citée
--    nulle part ailleurs que dans le formulaire qui la remplit. Une
--    acheteuse laisse son numéro en lisant « on vous répond sous 24 h », et
--    la demande tombe dans un tiroir que personne n'ouvre. La promesse est
--    donc intenable — c'est le trou le plus coûteux des deux, parce qu'il
--    concerne quelqu'un qui voulait acheter.
--
-- CORRECTIF. Un trigger SQL sur chacune des deux tables, qui prévient tous
-- les admins par les trois canaux à la fois. Le trigger, plutôt qu'un appel
-- dans la fonction edge : il se déclenche quelle que soit la façon dont la
-- ligne arrive (Finia, formulaire, insertion à la main), et il ne peut pas
-- être oublié en ajoutant un jour un autre point d'entrée.
--
-- L'écran de lecture des demandes est ajouté dans le même commit
-- (src/screens/admin/AdminDemandes.jsx) : prévenir de quelque chose qu'on ne
-- peut pas ouvrir ne servirait à rien.

-- La console d'administration vit sur SON PROPRE domaine (Worker
-- `finjaro-admin`, wrangler.admin.toml) : un lien relatif dans une push ou
-- un e-mail ouvrirait finjaro.net, où la page n'existe pas. On stocke donc
-- l'adresse complète en configuration plutôt que de la coder en dur — le
-- jour où `admin.finjaro.net` sera branché, c'est une ligne à changer, pas
-- une migration.
insert into public.app_config (key, value)
values ('admin_base_url', to_jsonb('https://finjaro-admin.finjaro.workers.dev'::text))
on conflict (key) do nothing;

-- Prévient TOUS les administrateurs, par les trois canaux.
-- Même précaution que push_notify (0072) : ne doit jamais faire échouer
-- l'insertion d'origine. Un ticket enregistré sans alerte reste meilleur
-- qu'un ticket perdu.
create or replace function public.alert_admins(
  p_type text, p_title text, p_body text, p_path text, p_tag text default null, p_data jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare admin_url text; cible text; a record;
begin
  select value #>> '{}' into admin_url from public.app_config where key = 'admin_base_url';
  -- URL absolue : send-push la reprend telle quelle dès qu'elle commence par
  -- « http » (sinon il préfixe finjaro.net, le mauvais domaine ici).
  cible := coalesce(nullif(admin_url, ''), '') || p_path;

  for a in select id from public.profiles where is_admin = true loop
    perform public.notify(a.id, p_type, p_title, p_body, p_data);
    perform public.push_notify(a.id, p_title, p_body, cible, p_tag);
  end loop;
exception when others then
  null;
end;
$$;

-- ---- 1. demande d'aide remontée par Finia ---------------------------------
create or replace function public.on_support_ticket()
returns trigger language plpgsql security definer set search_path = public as $$
declare titre text;
begin
  titre := case new.gravite
    when 'urgent' then 'Urgent — ' || new.sujet
    when 'bug'    then 'Bug signalé — ' || new.sujet
    else 'Demande d''aide — ' || new.sujet
  end;
  perform public.alert_admins(
    'support', titre, left(new.resume, 300), '/?s=support',
    'ticket-' || new.id,
    jsonb_build_object('ticket_id', new.id, 'gravite', new.gravite)
  );
  return new;
end;
$$;

drop trigger if exists trg_support_ticket on public.support_tickets;
create trigger trg_support_ticket
  after insert on public.support_tickets
  for each row execute function public.on_support_ticket();

-- ---- 2. demande d'un acheteur sur une recherche vide -----------------------
create or replace function public.on_demande_acheteur()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Le CONTACT est mis dans le corps de l'alerte, pas seulement le sujet :
  -- c'est la seule information qui permet d'agir tout de suite, et la
  -- promesse affichée à l'acheteuse est « sous 24 h ». La faire chercher
  -- dans un écran ferait perdre l'essentiel du délai.
  perform public.alert_admins(
    'demande_acheteur',
    'Recherche sans résultat — ' || left(coalesce(new.recherche, '?'), 80),
    coalesce(new.contact, 'sans contact')
      || coalesce(' — ' || nullif(left(new.details, 200), ''), ''),
    '/?s=demandes',
    'demande-' || new.id,
    jsonb_build_object('demande_id', new.id, 'recherche', new.recherche, 'contact', new.contact)
  );
  return new;
end;
$$;

drop trigger if exists trg_demande_acheteur on public.demandes_acheteurs;
create trigger trg_demande_acheteur
  after insert on public.demandes_acheteurs
  for each row execute function public.on_demande_acheteur();

-- Rien à changer côté droits d'accès : 0069 autorise déjà l'insertion
-- anonyme, la lecture par l'administration et la mise à jour du statut.
-- Ce qui manquait n'était pas la permission de lire, c'était un écran pour
-- le faire — ajouté dans le même commit.
