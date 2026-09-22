-- La vendeuse est prévenue quand un de ses articles entre dans un panier.
--
-- Beau, 22/09 au soir: « dès que quelqu'un mettait quelque chose au panier,
-- la vendeuse était au courant… là, la personne n'a même pas été signalée,
-- ni par Finjaro, ni par mail, ni par WhatsApp. Rien. » Vérifié: rien ne le
-- faisait. Le panier vit dans le navigateur de l'acheteur (localStorage) et
-- la seule trace côté serveur est l'événement `cart_add` de `events`, que
-- personne ne lisait — six ajouts depuis le 1er septembre, dans cinq
-- boutiques, et aucune vendeuse au courant.
--
-- Désormais, à chaque `cart_add`, la propriétaire de la boutique reçoit la
-- cloche in-app, le push et l'e-mail (push_notify → send-push, les trois
-- canaux) : « Quelqu'un vient de mettre « X » dans son panier ». On ne peut
-- pas lui dire qui — la plupart des acheteurs n'ont pas de compte — mais
-- elle sait que son article plaît, et qu'il faut que le prix, le stock et
-- les photos soient impeccables ce soir-là.
--
-- Garde-fous:
--   - pas d'alerte quand c'est la vendeuse elle-même qui teste son article;
--   - pas plus d'une alerte par article et par heure (un acheteur qui
--     hésite entre deux tailles ne fait pas sonner trois fois);
--   - le déclencheur n'échoue jamais: un tracking ne casse pas l'ajout.
-- Additive: une fonction, un déclencheur.

create or replace function public.alerter_vendeuse_ajout_panier()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_produit record;
begin
  if new.type <> 'cart_add' or new.target_id is null then return new; end if;

  select p.id, p.name, s.owner_id, s.name as boutique
    into v_produit
  from public.products p join public.shops s on s.id = p.shop_id
  where p.id::text = new.target_id;
  if v_produit.owner_id is null then return new; end if;

  -- La vendeuse qui essaie sa propre boutique ne s'alerte pas elle-même.
  if new.user_id is not null and new.user_id = v_produit.owner_id then return new; end if;

  -- Une alerte par article et par heure, pas plus.
  if exists (
    select 1 from public.notifications n
    where n.user_id = v_produit.owner_id and n.type = 'cart_added'
      and n.data->>'product_id' = v_produit.id::text
      and n.created_at > now() - interval '1 hour'
  ) then return new; end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_produit.owner_id, 'cart_added',
    'Ton article plaît',
    'Quelqu''un vient de mettre « ' || v_produit.name || ' » dans son panier. Vérifie que le prix, le stock et les photos sont à jour : la commande peut suivre.',
    jsonb_build_object('product_id', v_produit.id, 'product_name', v_produit.name)
  );

  perform public.push_notify(
    v_produit.owner_id,
    'Ton article plaît',
    'Quelqu''un vient de mettre « ' || v_produit.name || ' » dans son panier.',
    '/vendor/products/' || v_produit.id::text,
    'cart-added-' || v_produit.id::text
  );
  return new;
exception when others then
  return new; -- un tracking ne doit jamais empêcher l'ajout au panier
end $$;

revoke all on function public.alerter_vendeuse_ajout_panier() from public, anon, authenticated;

drop trigger if exists events_alerte_ajout_panier on public.events;
create trigger events_alerte_ajout_panier
  after insert on public.events
  for each row when (new.type = 'cart_add')
  execute function public.alerter_vendeuse_ajout_panier();
