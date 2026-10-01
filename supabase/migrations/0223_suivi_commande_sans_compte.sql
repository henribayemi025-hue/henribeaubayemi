-- « Ma commande » : l'acheteuse sans compte suit sa demande (Beau, 01/10 :
-- « commence à coder tout ce que tu dois coder dans le plan », idée 3 du
-- 01/10).
--
-- Depuis 0156, une personne sans compte laisse un prénom et un WhatsApp, et
-- sa demande arrive chez la vendeuse. Ensuite, plus rien de son côté : elle
-- ne sait pas si la boutique l'a vue, acceptée, envoyée. Elle n'a aucune
-- raison de revenir, et la vendeuse n'est pas poussée à répondre.
--
-- Cette fonction rend le suivi d'UNE demande sans compte à qui connaît son
-- identifiant (un uuid tiré au hasard, impossible à deviner) : c'est le lien
-- que la vendeuse envoie elle-même sur WhatsApp, et que l'acheteuse garde
-- sur son téléphone. Aucune colonne ajoutée : l'uuid de la commande sert de
-- jeton.
--
-- Ce qui sort : le numéro de commande, l'étape et ses dates, le nom et
-- l'adresse publique de la boutique, les articles et le total. Ce qui ne
-- sort JAMAIS : le numéro de téléphone, l'adresse, l'identifiant du
-- navigateur. Le prénom seul, pour « Bonjour Awa ».
--
-- Réservée aux commandes SANS compte : une acheteuse avec compte a déjà
-- « Mes commandes », derrière sa connexion.
--
-- Additive : une fonction s'ajoute, rien n'est modifié. Propre à la place
-- de marché : Finjaro Accounting ne lit ni n'appelle `orders`.

create or replace function public.suivi_commande(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_no', o.order_no,
    'status', o.status,
    'delivery_method', o.delivery_method,
    'created_at', o.created_at,
    'priced_at', o.priced_at,
    'confirmed_at', o.confirmed_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
    'cancelled_at', o.cancelled_at,
    'cancel_reason', o.cancel_reason,
    'total_fcfa', o.total_fcfa,
    'prenom', split_part(trim(coalesce(o.buyer_name, '')), ' ', 1),
    'shop', jsonb_build_object(
      'name', s.name,
      'slug', s.slug,
      'country', s.country,
      'city', s.city,
      'avatar_url', s.avatar_url
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name,
        'qty', i.qty,
        'price_fcfa', i.price_fcfa,
        'price_pending', i.price_pending,
        'product_id', i.product_id
      ) order by i.id)
      from order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from orders o
  join shops s on s.id = o.shop_id
  where o.id = p_id
    and o.buyer_id is null;
$$;

revoke all on function public.suivi_commande(uuid) from public;
grant execute on function public.suivi_commande(uuid) to anon, authenticated;
