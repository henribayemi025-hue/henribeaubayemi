-- LEGION — le premier connecteur : les chiffres de Finjaro, en lecture seule.
--
-- Beau, 22/09 : « il faut connecter les agents à Supabase et tout ». Et
-- plus tôt : « tu dis : regarde combien de personnes ont fait ça, il doit
-- pouvoir le faire ». Jusqu'ici les agents n'avaient aucun outil : à
-- « combien de visites ? », Alpha répondait « je demande à Boussole ».
--
-- Un CONNECTEUR, c'est ce qu'une entreprise branche pour que ses agents
-- voient quelque chose. C'est le mécanisme qu'une entreprise cliente
-- utilisera pour ses propres données ; celui-ci est le premier, et il est
-- réservé à l'équipe Finjaro : il montre les chiffres de la plateforme.
--
-- Ce qui est garanti :
--   - lecture seule, et seulement des COMPTES (aucun nom, aucun e-mail,
--     aucun téléphone ne sort d'ici) ;
--   - comptes de test exclus partout (compte_reel) ;
--   - la fonction de mesure ne s'appelle que côté serveur (service_role),
--     depuis legion-repondre, pour une entreprise qui a le connecteur ;
--   - seul un administrateur Finjaro peut brancher ce connecteur.
--
-- Additive : une table, deux fonctions. Rien de retiré.

create table if not exists public.legion_connecteurs (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  type text not null check (type in ('finjaro-mesures')),
  actif boolean not null default true,
  branche_par uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (entreprise_id, type)
);

alter table public.legion_connecteurs enable row level security;

drop policy if exists "legion_connecteurs lecture membres" on public.legion_connecteurs;
create policy "legion_connecteurs lecture membres" on public.legion_connecteurs
  for select using (public.legion_est_membre(entreprise_id));
-- Pas de policy d'écriture : on branche et on débranche par la fonction
-- ci-dessous, qui vérifie qui demande.

create or replace function public.legion_brancher_mesures_finjaro(p_entreprise uuid, p_actif boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.legion_est_membre(p_entreprise) then
    raise exception 'Pas membre de cette entreprise.';
  end if;
  if not coalesce((select is_admin from public.profiles where id = auth.uid()), false) then
    raise exception 'Réservé à l''équipe Finjaro.';
  end if;
  insert into public.legion_connecteurs (entreprise_id, type, actif, branche_par)
  values (p_entreprise, 'finjaro-mesures', p_actif, auth.uid())
  on conflict (entreprise_id, type) do update set actif = excluded.actif, branche_par = excluded.branche_par;
end $$;

revoke all on function public.legion_brancher_mesures_finjaro(uuid, boolean) from public, anon;
grant execute on function public.legion_brancher_mesures_finjaro(uuid, boolean) to authenticated;

-- Les chiffres. Une « personne » qui visite = un navigateur (identifiant
-- anonyme stable, ou le compte s'il est connecté) : ça sous-compte ceux qui
-- changent d'appareil, ça n'en invente jamais.
create or replace function public.legion_mesures_finjaro()
returns jsonb language sql stable security definer set search_path = public as $$
  with ev as (
    select type, created_at, coalesce(user_id::text, meta->>'anon_id') as qui
      from public.events
     where created_at > now() - interval '30 days'
       and (user_id is null or public.compte_reel(user_id))
  ),
  jours as (
    select to_char(d::date, 'DD/MM') as jour,
           (select count(distinct qui) from ev where type = 'visit' and created_at::date = d::date) as personnes
      from generate_series((now() - interval '6 days')::date, now()::date, interval '1 day') d
  )
  select jsonb_build_object(
    'mesure_le', to_char(now() at time zone 'UTC', 'DD/MM/YYYY HH24:MI "UTC"'),
    'visites_personnes', jsonb_build_object(
      'aujourdhui', (select count(distinct qui) from ev where type = 'visit' and created_at::date = now()::date),
      '7_jours', (select count(distinct qui) from ev where type = 'visit' and created_at > now() - interval '7 days'),
      '30_jours', (select count(distinct qui) from ev where type = 'visit'),
      'par_jour_7_derniers', (select jsonb_agg(jsonb_build_object('jour', jour, 'personnes', personnes)) from jours)
    ),
    'fiches_article_vues_7_jours', (select count(*) from ev where type = 'product_view' and created_at > now() - interval '7 days'),
    'boutiques_vues_7_jours', (select count(*) from ev where type = 'shop_view' and created_at > now() - interval '7 days'),
    'recherches_7_jours', (select count(*) from ev where type = 'search' and created_at > now() - interval '7 days'),
    'contacts_vendeuse_7_jours', (select count(*) from ev where type in ('whatsapp_click', 'phone_click', 'contact_intent') and created_at > now() - interval '7 days'),
    'ajouts_panier_7_jours', (select count(*) from ev where type = 'cart_add' and created_at > now() - interval '7 days'),
    'comptes', jsonb_build_object(
      'total', (select count(*) from public.profiles p where public.compte_reel(p.id)),
      'crees_7_jours', (select count(*) from public.profiles p where public.compte_reel(p.id) and p.created_at > now() - interval '7 days')
    ),
    'boutiques', jsonb_build_object(
      'total', (select count(*) from public.shops s where public.compte_reel(s.owner_id) and s.moderation_hidden_at is null),
      'avec_au_moins_un_article', (select count(distinct s.id) from public.shops s join public.products p on p.shop_id = s.id
                                    where p.is_active and s.moderation_hidden_at is null and public.compte_reel(s.owner_id)),
      'creees_7_jours', (select count(*) from public.shops s where public.compte_reel(s.owner_id) and s.created_at > now() - interval '7 days')
    ),
    'articles_en_ligne', (select count(*) from public.products p join public.shops s on s.id = p.shop_id
                           where p.is_active and p.moderation_hidden_at is null and public.compte_reel(s.owner_id)),
    'commandes', jsonb_build_object(
      'total', (select count(*) from public.orders o where o.buyer_id is null or public.compte_reel(o.buyer_id)),
      '7_jours', (select count(*) from public.orders o where (o.buyer_id is null or public.compte_reel(o.buyer_id)) and o.created_at > now() - interval '7 days'),
      'en_attente_de_la_vendeuse', (select count(*) from public.orders o where o.status = 'new' and (o.buyer_id is null or public.compte_reel(o.buyer_id)))
    )
  );
$$;

revoke all on function public.legion_mesures_finjaro() from public, anon, authenticated;
grant execute on function public.legion_mesures_finjaro() to service_role;
