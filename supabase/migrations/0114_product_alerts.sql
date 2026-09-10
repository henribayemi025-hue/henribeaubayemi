-- « Me prévenir » sur un article: retour en stock, remise en ligne ou
-- baisse de prix. Ce que font Amazon (« Prévenez-moi ») et Vinted, et
-- qu'aucune boutique WhatsApp ne peut offrir: la cliente part, l'article
-- la rappelle tout seul. Une alerte est à usage unique — elle s'efface
-- une fois envoyée, la cliente peut la remettre.
create table if not exists public.product_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price_fcfa_at integer,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists product_alerts_product_idx on public.product_alerts(product_id);

alter table public.product_alerts enable row level security;
drop policy if exists product_alerts_select_own on public.product_alerts;
drop policy if exists product_alerts_insert_own on public.product_alerts;
drop policy if exists product_alerts_delete_own on public.product_alerts;
create policy product_alerts_select_own on public.product_alerts for select using (auth.uid() = user_id);
create policy product_alerts_insert_own on public.product_alerts for insert with check (auth.uid() = user_id);
create policy product_alerts_delete_own on public.product_alerts for delete using (auth.uid() = user_id);

create or replace function public.product_alerts_fire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  titre text;
  corps text;
  motif text;
  retour boolean;
  baisse boolean;
begin
  retour := (coalesce(old.stock, 0) <= 0 and coalesce(new.stock, 0) > 0)
         or (old.is_active is distinct from true and new.is_active is true);
  baisse := new.price_fcfa is not null and old.price_fcfa is not null
        and new.price_fcfa < old.price_fcfa
        and new.is_active is true and coalesce(new.stock, 0) > 0;
  if (not retour and not baisse) or new.moderation_hidden_at is not null then
    return new;
  end if;

  for a in select pa.id, pa.user_id from public.product_alerts pa where pa.product_id = new.id loop
    if retour then
      titre := new.name || ' est de retour';
      corps := 'L''article que tu attendais est à nouveau disponible. Premier arrivé, premier servi.';
      motif := 'retour';
    else
      titre := 'Le prix de ' || new.name || ' a baissé';
      corps := 'Baisse de ' || round((old.price_fcfa - new.price_fcfa) * 100.0 / old.price_fcfa)
               || ' % sur l''article que tu surveilles.';
      motif := 'baisse';
    end if;
    perform public.notify(a.user_id, 'product_alert', titre, corps,
      jsonb_build_object('product_id', new.id, 'motif', motif));
    perform public.push_notify(a.user_id, titre, corps, '/product/' || new.id, 'product-alert-' || new.id);
    delete from public.product_alerts where id = a.id;
  end loop;
  return new;
exception when others then
  -- Jamais bloquer la vendeuse qui modifie son article à cause d'une alerte.
  return new;
end;
$$;

drop trigger if exists product_alerts_fire on public.products;
create trigger product_alerts_fire
after update of stock, is_active, price_fcfa on public.products
for each row execute function public.product_alerts_fire();
