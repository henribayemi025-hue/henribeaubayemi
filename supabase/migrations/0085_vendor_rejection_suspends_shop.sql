-- Trouvé en audit du 08/09 : depuis que la candidature ne conditionne plus
-- la création de la boutique (elle est active dès l'inscription,
-- BecomeVendor.jsx), "refuser" une candidature n'avait plus AUCUN effet
-- réel — juste une notification. La boutique restait active et continuait
-- de vendre normalement, y compris après un refus pour pièce d'identité
-- invalide.
--
-- Corrigé : le refus suspend désormais la boutique existante. Le reste de
-- la fonction (branche "approved") est recopié à l'identique.
create or replace function public.on_vendor_app_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare new_slug text; existing uuid; new_shop uuid;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select id into existing from public.shops where owner_id = new.user_id limit 1;
    if existing is null then
      new_slug := regexp_replace(lower(new.shop_name), '[^a-z0-9]+', '-', 'g')
                  || '-' || substr(md5(random()::text), 1, 5);
      insert into public.shops (owner_id, slug, name, bio, banner_url, avatar_url, whatsapp,
                                country, city, categories, id_verified, phone_confirmed, status)
      values (new.user_id, new_slug, new.shop_name, new.description, new.banner_url, new.avatar_url,
              coalesce(new.whatsapp, new.phone), new.country, new.city, new.categories, true, true, 'active')
      returning id into new_shop;
      perform public.refresh_shop_verified(new_shop);
    else
      -- status n'est PAS touché ici : 'suspended' peut aussi venir d'un
      -- blocage de modération (contenu signalé 3 fois, 0047/0055) sans
      -- rapport avec cette candidature — une approbation ne doit jamais
      -- lever silencieusement un blocage pour une tout autre raison.
      update public.shops set id_verified = true, phone_confirmed = true where id = existing;
      perform public.refresh_shop_verified(existing);
    end if;
    update public.profiles set is_vendor = true where id = new.user_id;
    perform public.notify(new.user_id, 'shop_approved', 'Boutique validée',
      'Ta boutique a été validée par Finjaro !', jsonb_build_object('application_id', new.id));
    perform public.push_notify(new.user_id, 'Boutique validée', 'Ta boutique a été validée par Finjaro !', '/vendor', 'shop-approved-' || new.id);
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    update public.shops set status = 'suspended' where owner_id = new.user_id;
    perform public.notify(new.user_id, 'shop_rejected', 'Demande refusée',
      coalesce(new.rejection_reason, 'Ta demande a été refusée.'), jsonb_build_object('application_id', new.id));
    perform public.push_notify(new.user_id, 'Demande refusée',
      coalesce(new.rejection_reason, 'Ta demande a été refusée.'), '/vendor', 'shop-rejected-' || new.id);
  end if;
  return new;
end;
$function$;

comment on function public.on_vendor_app_status() is
  'Approbation: certifie la boutique existante (id_verified/phone_confirmed), ne touche jamais son statut. Refus: SUSPEND la boutique existante (corrigé le 08/09 — refuser une candidature n''avait plus aucun effet depuis que la boutique se crée dès l''inscription). Les deux issues sont notifiées en cloche ET en push/e-mail (audit notifications du 08/09).';
