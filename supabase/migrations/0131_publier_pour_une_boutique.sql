-- Publier un article à la place d'une vendeuse, depuis la console.
--
-- Pourquoi: 19 des 60 boutiques actives n'ont JAMAIS publié un article. Elles
-- se sont inscrites et se sont arrêtées là. Une boutique vide n'apparaît dans
-- aucune recherche — elle ne peut donc rien rapporter à personne, et la
-- vendeuse conclut que Finjaro ne sert à rien.
--
-- Une vendeuse envoie ses photos sur WhatsApp et attend. Aujourd'hui personne
-- ne peut les mettre en ligne pour elle: `products` n'a pas de règle
-- d'insertion pour l'équipe (seulement lecture, modification et suppression),
-- et l'écran n'existe pas.
--
-- Pourquoi une fonction et pas une règle d'insertion pour les admins: une
-- règle ouvrirait l'insertion à tout ce qui passe par l'API avec un compte
-- d'équipe. La fonction, elle, ne fait qu'une chose, vérifie qui appelle, et
-- refuse une boutique inexistante ou fermée.
--
-- Ce qu'elle n'autorise pas: modifier un article existant (`admin_write`
-- existe déjà pour ça) et toucher à quoi que ce soit d'autre.
--
-- Additive: une seule fonction créée.

create or replace function public.admin_publier_article(
  p_shop_id          uuid,
  p_name             text,
  p_price_fcfa       integer default 0,
  p_category         text default null,
  p_images           text[] default '{}',
  p_description      text default null,
  p_stock            integer default 1,
  p_price_on_request boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id     uuid;
  v_statut text;
begin
  if not is_admin() then
    raise exception 'not_admin' using errcode = 'P0001';
  end if;

  select status into v_statut from shops where id = p_shop_id;
  if v_statut is null then
    raise exception 'shop_not_found' using errcode = 'P0001';
  end if;
  if v_statut <> 'active' then
    raise exception 'shop_unavailable' using errcode = 'P0001';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'name_required' using errcode = 'P0001';
  end if;

  -- Un article sans prix ET sans « prix sur demande » serait affiché à 0, donc
  -- gratuit. C'est l'erreur qu'on vient de corriger côté panier; on ne la
  -- réintroduit pas par la console.
  if not p_price_on_request and coalesce(p_price_fcfa, 0) <= 0 then
    raise exception 'price_required' using errcode = 'P0001';
  end if;

  insert into products (
    shop_id, name, price_fcfa, description, category, images, stock,
    price_on_request, is_active, published_at
  ) values (
    p_shop_id, btrim(p_name),
    case when p_price_on_request then 0 else p_price_fcfa end,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_category, coalesce(p_images, '{}'), greatest(0, coalesce(p_stock, 1)),
    p_price_on_request, true, now()
  )
  returning id into v_id;

  return v_id;
end;
$function$;

grant execute on function public.admin_publier_article(uuid, text, integer, text, text[], text, integer, boolean) to authenticated;
