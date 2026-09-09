-- Stories pour les boutiques — Beau: « la possibilité de poster les stories
-- des boutiques, et dans le chat tu peux voir direct le story d'une
-- boutique, comme dans WhatsApp ».
--
-- Éphémère par construction (24h), comme WhatsApp/Instagram: une story n'est
-- pas un contenu de catalogue, elle expire d'elle-même — pas de champ
-- "masqué" à gérer, juste un filtre sur expires_at.
create table public.shop_stories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  media_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index shop_stories_shop_active_idx on public.shop_stories (shop_id, expires_at);

alter table public.shop_stories enable row level security;

-- Visible par tout le monde tant que la boutique est active et la story pas
-- expirée — même règle de visibilité publique que les articles et les reels.
create policy shop_stories_read on public.shop_stories
  for select
  using (
    expires_at > now()
    and exists (select 1 from public.shops s where s.id = shop_id and s.status = 'active')
  );

-- Seule la propriétaire de la boutique poste ou retire SES stories.
create policy shop_stories_insert on public.shop_stories
  for insert
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

create policy shop_stories_delete on public.shop_stories
  for delete
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Le ménage: une story expirée n'apparaît déjà plus nulle part (RLS ci-
-- dessus), mais la ligne ET la photo dans le stockage traîneraient sinon
-- indéfiniment. Deux jours de marge après l'expiration avant suppression
-- réelle — le temps que quelqu'un dise "où est passée ma story" si jamais.
create or replace function public.nettoyer_stories_expirees()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
    where bucket_id = 'shops'
      and name in (
        select media_url from public.shop_stories
        where expires_at < now() - interval '2 days'
      );
  delete from public.shop_stories where expires_at < now() - interval '2 days';
end;
$$;

revoke execute on function public.nettoyer_stories_expirees() from anon, authenticated;

select cron.schedule(
  'finjaro-nettoyer-stories',
  '0 4 * * *',
  $$select public.nettoyer_stories_expirees()$$
);
