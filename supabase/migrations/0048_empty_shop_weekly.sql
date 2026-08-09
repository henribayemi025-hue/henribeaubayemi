-- Le rappel « ajoute tes articles » passe d'UN envoi unique à un rappel
-- HEBDOMADAIRE — décision de Beau: 8 boutiques sur 22 se sont inscrites puis
-- se sont arrêtées sans rien publier, et un seul rappel ne suffisait
-- visiblement pas à les faire revenir.
--
-- MAIS il s'arrête au bout de QUATRE rappels, soit environ un mois. Relancer
-- indéfiniment quelqu'un qui ne répond pas n'est pas de la persévérance,
-- c'est du harcèlement: la personne finit par couper ses notifications — et
-- elle les coupe pour TOUT, y compris pour la commande qu'elle recevra un
-- jour. On perd alors bien plus qu'on ne gagne.
--
-- Le texte change à chaque envoi. Quatre fois le même message se lit comme un
-- robot cassé; quatre messages différents se lisent comme quelqu'un qui
-- s'intéresse vraiment. Et le dernier ANNONCE qu'il est le dernier: c'est
-- honnête, et c'est souvent celui qui fait revenir les gens.

alter table public.shops
  add column if not exists empty_catalog_reminders_sent smallint not null default 0;

comment on column public.shops.empty_catalog_reminders_sent is
  'Nombre de rappels « ajoute tes articles » déjà envoyés. S''arrête à 4.';

-- Les boutiques déjà relancées une fois par l'ancienne version comptent pour 1:
-- sans ce rattrapage, elles repartiraient à zéro et recevraient quatre rappels
-- de plus que les autres.
update public.shops
  set empty_catalog_reminders_sent = 1
  where empty_catalog_reminded_at is not null
    and empty_catalog_reminders_sent = 0;

create or replace function public.remind_empty_shops()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_url text;
  r record;
  msg_title text;
  msg_body text;
begin
  select value #>> '{}' into base_url from public.app_config where key = 'functions_base_url';
  if base_url is null or base_url = '' then
    return;
  end if;

  for r in
    select s.id, s.name, s.owner_id, s.empty_catalog_reminders_sent as sent
    from public.shops s
    where s.status = 'active'
      and s.created_at < now() - interval '2 days'
      -- Le premier rappel part comme avant; les suivants attendent 7 jours.
      and (s.empty_catalog_reminded_at is null
           or s.empty_catalog_reminded_at < now() - interval '7 days')
      and s.empty_catalog_reminders_sent < 4
      and not exists (select 1 from public.products p where p.shop_id = s.id)
      -- Exclu UNIQUEMENT si la boutique est un pur prestataire de service
      -- (au moins une catégorie SERVICE, aucune catégorie PRODUCT). Une
      -- boutique mixte, sans catégorie, ou en PRODUIT reste éligible.
      and not (
        exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'SERVICE')
        and not exists (select 1 from public.categories c where c.id = any(s.categories) and c.kind = 'PRODUCT')
      )
  loop
    -- Une raison DIFFÉRENTE de revenir à chaque fois, plutôt que la même
    -- phrase répétée: on lève un obstacle nouveau à chaque rappel.
    if r.sent = 0 then
      msg_title := 'Finia — ajoute tes premiers articles';
      msg_body := 'Ta boutique "' || r.name || '" est prête mais encore vide. Ajoute tes articles pour que les clientes puissent te trouver !';
    elsif r.sent = 1 then
      msg_title := 'Finia — ta boutique n''apparaît pas encore';
      msg_body := 'Sans article, "' || r.name || '" ne remonte pas dans les recherches. Trois photos suffisent pour démarrer.';
    elsif r.sent = 2 then
      msg_title := 'Finia — je peux t''aider à publier';
      msg_body := 'Pas le temps de tout saisir ? Envoie-moi une photo de ton article, je rédige la fiche pour toi.';
    else
      -- Le dernier le dit. Quelqu'un qui sait qu'on le laisse tranquille
      -- garde une bonne image de Finjaro — et revient parfois de lui-même.
      msg_title := 'Finia — dernier rappel';
      msg_body := 'Ta boutique "' || r.name || '" t''attend quand tu veux. On ne te relancera plus, mais elle reste ouverte.';
    end if;

    perform net.http_post(
      url := base_url || '/send-push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', r.owner_id,
        'title', msg_title,
        'body', msg_body,
        'url', '/vendor/products/bulk',
        -- Le rang dans le tag: sans lui, le téléphone remplacerait
        -- silencieusement le rappel précédent par le nouveau et la personne
        -- n'en verrait jamais qu'un seul.
        'tag', 'empty-shop-' || r.id || '-' || r.sent
      )
    );

    update public.shops
      set empty_catalog_reminded_at = now(),
          empty_catalog_reminders_sent = empty_catalog_reminders_sent + 1
      where id = r.id;
  end loop;
end;
$function$;
