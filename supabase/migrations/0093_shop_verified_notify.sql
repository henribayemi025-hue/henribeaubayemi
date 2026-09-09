-- Beau, en testant l'admin: « quand je certifie une boutique, le gars doit
-- recevoir une notif que sa boutique a été certifiée » — vérifié: accorder le
-- badge (AdminShops.jsx) ne fait qu'un update() nu, aucune notification.
create or replace function public.on_shop_verified_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_verified and not old.is_verified then
    perform public.notify(new.owner_id, 'shop_verified', 'Boutique certifiée !',
      'Ta boutique "' || new.name || '" est maintenant certifiée sur Finjaro.',
      jsonb_build_object('shop_id', new.id));
    perform public.push_notify(
      new.owner_id, 'Boutique certifiée !',
      'Ta boutique "' || new.name || '" est maintenant certifiée sur Finjaro.',
      '/vendor/shop', 'shop-verified-' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_shop_verified_change on public.shops;
create trigger trg_shop_verified_change
  after update of is_verified on public.shops
  for each row execute function public.on_shop_verified_change();
