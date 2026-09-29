-- LE CRÉDIT OFFERT, PREMIUM ET « NOUS CONTACTER » (Beau, 29/09).
--
-- Vu le 29/09 : seule Finjaro avait un plafond ; les autres entreprises de
-- Léo dépensaient sans limite sur les clés de Beau (PJ Hôtel : 100 agents au
-- travail pour un compte venu deux fois). Beau : « si quelqu'un n'a plus de
-- crédit, qu'il passe au premium ; dès que quelqu'un clique sur premium je
-- suis au courant » ; « et aussi un moyen de nous contacter » ; crédit offert
-- choisi : 2 € par mois ; alerte par e-mail.
--
-- Additif :
-- - legion_entreprises.credit_offert_eur (2 € par défaut) : ce que Finjaro
--   offre chaque mois ; atteint, les agents s'arrêtent, sauf Premium ;
-- - legion_entreprises.premium : accordé par l'équipe seulement (jamais par
--   le patron de l'entreprise lui-même : voir le garde-fou) ;
-- - legion_entreprises.en_pause : le travail automatique des agents est
--   suspendu (les réponses dans les salons continuent) ;
-- - legion_demandes : « Passer à Premium » et « Nous contacter », lues par
--   l'équipe, qui est prévenue par e-mail (fonction leo-contact).
-- Rien de supprimé ni de renommé. Propre à Léo : Finjaro Accounting n'y touche pas.

alter table public.legion_entreprises add column if not exists credit_offert_eur numeric not null default 2;
alter table public.legion_entreprises add column if not exists premium boolean not null default false;
alter table public.legion_entreprises add column if not exists en_pause boolean not null default false;

-- Le garde-fou : le patron d'une entreprise peut régler son plafond à lui,
-- pas s'offrir du crédit ni le Premium. Seuls le serveur (service_role) et
-- l'équipe (is_admin) les changent.
create or replace function public.legion_garde_credit()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- Sans « security definer » : current_user est le rôle de l'appelant.
  -- Seuls les rôles de l'application (authenticated, anon) sont bridés.
  if current_user not in ('authenticated', 'anon') or public.is_admin() then return new; end if;
  if new.premium is distinct from old.premium or new.credit_offert_eur is distinct from old.credit_offert_eur then
    raise exception 'Le crédit offert et le Premium se règlent avec l''équipe Finjaro.';
  end if;
  return new;
end $function$;
drop trigger if exists legion_garde_credit on public.legion_entreprises;
create trigger legion_garde_credit before update on public.legion_entreprises
  for each row execute function public.legion_garde_credit();

create table if not exists public.legion_demandes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.legion_entreprises(id) on delete set null,
  user_id uuid not null default auth.uid(),
  genre text not null check (genre in ('premium', 'contact')),
  message text,
  traitee boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.legion_demandes enable row level security;
drop policy if exists legion_demandes_select on public.legion_demandes;
create policy legion_demandes_select on public.legion_demandes
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists legion_demandes_insert on public.legion_demandes;
create policy legion_demandes_insert on public.legion_demandes
  for insert with check (user_id = auth.uid() and (entreprise_id is null or public.legion_est_membre(entreprise_id) or exists (select 1 from public.legion_entreprises e where e.id = entreprise_id and e.owner_id = auth.uid())));
drop policy if exists legion_demandes_update on public.legion_demandes;
create policy legion_demandes_update on public.legion_demandes
  for update using (public.is_admin());

-- Les entreprises de Beau paient avec ses clés : Premium. Ses entreprises de
-- test sont mises en pause (décision de Beau, 29/09).
update public.legion_entreprises set premium = true
  where id in ('44bb201b-6787-4de0-8f7f-f9145d5c03e7', '6174d0bd-ac10-490e-9a08-8388bfe3e82c');
update public.legion_entreprises set en_pause = true
  where id in ('c29ddf31-1944-49de-9f18-206d4d47bba8', '76e27452-b934-4f1f-849b-8e550bfbf23b',
               '2efc7e79-b8af-4c8a-8df2-cb6ef931609c', '4199812c-725d-4b4a-8e25-089bad08db0a');
