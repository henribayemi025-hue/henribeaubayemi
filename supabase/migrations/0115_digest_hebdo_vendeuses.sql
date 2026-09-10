-- Bilan hebdomadaire à chaque vendeuse, lundi 8 h (heure de Douala, 7 h UTC):
-- commandes de la semaine, commandes en attente, conversations restées
-- sans réponse, article le plus vu. Shopify envoie ce mail chaque semaine;
-- ici il arrive en push et dans la cloche, et mène au tableau de bord.
-- Aucun montant dans le texte: la vendeuse lit ses chiffres dans SA devise
-- sur son tableau de bord (CLAUDE.md §2), pas en FCFA brut dans une
-- notification.
create or replace function public.digest_hebdo_vendeuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  lignes text[];
  corps text;
  titre text;
  semaine text := to_char(now(), 'IYYY-IW');
begin
  for r in
    select s.id, s.name, s.owner_id,
      (select count(*) from public.orders o
        where o.shop_id = s.id and o.created_at > now() - interval '7 days' and o.status <> 'cancelled') as commandes,
      (select count(*) from public.orders o where o.shop_id = s.id and o.status = 'new') as en_attente,
      (select count(*) from public.conversations c
         join lateral (
           select m.sender_role from public.chat_messages m
           where m.conversation_id = c.id order by m.created_at desc limit 1
         ) lm on true
       where c.shop_id = s.id and lm.sender_role = 'buyer'
         and c.last_message_at > now() - interval '30 days') as sans_reponse,
      (select count(*) from public.products p where p.shop_id = s.id and p.is_active) as articles,
      (select p.name from public.products p
        where p.shop_id = s.id and p.is_active order by p.views desc nulls last limit 1) as top_article
    from public.shops s
    where s.status = 'active' and s.owner_id is not null
  loop
    lignes := '{}'::text[];
    if r.commandes > 0 then
      lignes := lignes || (r.commandes || ' commande' || case when r.commandes > 1 then 's' else '' end || ' cette semaine');
    end if;
    if r.en_attente > 0 then
      lignes := lignes || (r.en_attente || ' commande' || case when r.en_attente > 1 then 's' else '' end || ' en attente de ta réponse');
    end if;
    if r.sans_reponse > 0 then
      lignes := lignes || (r.sans_reponse || ' conversation' || case when r.sans_reponse > 1 then 's' else '' end || ' sans réponse');
    end if;
    if r.top_article is not null then
      lignes := lignes || ('Article le plus vu : ' || r.top_article);
    end if;

    if r.articles = 0 then
      -- Déjà couvert par finjaro-empty-shop-reminders: pas de doublon.
      continue;
    elsif cardinality(lignes) = 0 then
      titre := r.name || ' : semaine calme';
      corps := 'Aucune commande ni message cette semaine. Une story ou un nouvel article remet ta boutique en avant.';
    else
      titre := r.name || ' : ton bilan de la semaine';
      corps := array_to_string(lignes, ' · ') || '.';
    end if;

    perform public.notify(r.owner_id, 'vendor_digest', titre, corps,
      jsonb_build_object('shop_id', r.id, 'commandes', r.commandes, 'en_attente', r.en_attente,
                         'sans_reponse', r.sans_reponse, 'semaine', semaine));
    perform public.push_notify(r.owner_id, titre, corps, '/vendor', 'vendor-digest-' || r.id || '-' || semaine);
  end loop;
end;
$$;

revoke execute on function public.digest_hebdo_vendeuses() from anon, authenticated;

select cron.schedule(
  'finjaro-digest-vendeuses',
  '0 7 * * 1',
  $$select public.digest_hebdo_vendeuses()$$
);
