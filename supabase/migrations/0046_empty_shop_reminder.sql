-- Rappel Finia "ajoute tes articles" pour les boutiques inscrites qui n'ont
-- jamais publié le moindre article — exclut automatiquement les
-- prestataires de SERVICE (leur activité ne se vend pas comme un article
-- au catalogue, ça n'a jamais eu de sens de les relancer là-dessus).
--
-- Contrairement aux relances de commande (migration 0045), pas d'action
-- automatique en bout de course: juste UN rappel, une fois, jamais répété.
-- Rien à annuler ici, une boutique vide ne nuit à personne — un rappel
-- suffit, pas besoin d'escalade.
alter table public.shops
  add column if not exists empty_catalog_reminded_at timestamptz;

comment on column public.shops.empty_catalog_reminded_at is
  'Horodatage du rappel Finia "ajoute tes articles", envoyé une seule fois. NULL = jamais envoyé.';

create or replace function public.remind_empty_shops()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select s.id, s.name, s.owner_id
    from public.shops s
    where s.status = 'active'
      and s.created_at < now() - interval '2 days'
      and s.empty_catalog_reminded_at is null
      and not exists (select 1 from public.products p where p.shop_id = s.id)
      -- Exclu UNIQUEMENT si la boutique est un pur prestataire de service
      -- (au moins une catégorie SERVICE, aucune catégorie PRODUCT). Une
      -- boutique mixte, sans catégorie, ou en PRODUIT reste éligible.
      and not (
        exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'SERVICE')
        and not exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'PRODUCT')
      )
  loop
    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', 'Finia — ajoute tes premiers articles',
        'body', 'Ta boutique "' || r.name || '" est prête mais encore vide. Ajoute tes articles pour que les clientes puissent te trouver !',
        'url', '/vendor/products/bulk',
        'tag', 'empty-shop-' || r.id
      )
    );
    update public.shops set empty_catalog_reminded_at = now() where id = r.id;
  end loop;
end;
$function$;

-- Même cadence que les relances de commande — pas besoin d'un job séparé.
select cron.schedule(
  'finjaro-empty-shop-reminders',
  '0 */6 * * *',
  $$select public.remind_empty_shops()$$
);
