-- PROPOSITION — NON APPLIQUÉE EN PRODUCTION. Essai sur le projet de test : voir la fin du fichier. Écrite le 12/10/2026.
-- Réunion du 10/10 (Beau et son collaborateur) : « la synchronisation marche du stock Finjaro vers
-- Accounting, pas l'inverse ; il faut pouvoir envoyer un article du stock comptable vers la
-- place de marché ». Reprend le commentaire n° 6 du document de cadrage (« il faut le faire »).
--
-- Touche la base COMMUNE aux deux applications (colonne ajoutée à `products`, nouvelle fonction
-- lue par Accounting) : elle ne part qu'avec le mot de Beau, et Claudinette est prévenue avant.
-- Migration ADDITIVE : une colonne nullable, un index, une fonction. Rien n'est supprimé ni renommé.
--
-- POURQUOI UNE FONCTION APPELÉE PAR ACCOUNTING, ET PAS UNE LECTURE DU SERVEUR
-- Accounting enregistre des ÉVÉNEMENTS (finia_events : product.save, sale.record…) et recalcule
-- l'état (stock, prix) dans l'appareil. Le cliché `finia_workspaces.data` existe mais, mesuré le
-- 12/10, il est vide de produits (snapshot_seq = 0) pour les espaces réels : le serveur ne connaît
-- donc pas le stock courant. C'est l'application d'Accounting qui envoie l'article à publier,
-- avec son stock du moment.
--
-- RÈGLES TENUES
--  * le prix est CONVERTI dans l'unité de stockage (price_fcfa) mais le prix saisi et sa devise sont
--    gardés (prix_saisi, devise_saisie) : la boutique relit son prix dans SA monnaie ;
--  * aucune photo n'est inventée ni prise sur le web : on ne reprend que ce que la personne a elle-même
--    téléversé (chemin de stockage fourni par Accounting) ;
--  * un article n'est publié qu'une fois (index unique boutique + référence) : rejouer met à jour.

alter table public.products add column if not exists accounting_ref text;
comment on column public.products.accounting_ref is
  'Identifiant de l''article dans Finjaro Accounting, quand il a été publié depuis le stock comptable (flux inverse, réunion du 10/10).';
create unique index if not exists products_shop_accounting_ref_uniq
  on public.products (shop_id, accounting_ref) where accounting_ref is not null;

-- p_article attendu : { "ref": "<id de l'article dans Accounting>", "name": "...", "description": "...",
--   "price_minor": 1000, "currency": "EUR", "stock": 4, "image_path": "<chemin déjà téléversé>" }
-- price_minor est en plus petite unité de la devise de l'espace (100 = 1,00 EUR ; 1 = 1 XAF).
create or replace function public.finia_publier_article(p_workspace uuid, p_article jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner    uuid;
  v_shop     uuid;
  v_devise   text := upper(coalesce(p_article->>'currency', ''));
  v_fx       record;
  v_minor    numeric := (p_article->>'price_minor')::numeric;
  v_fcfa     integer;
  v_id       uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;

  select w.owner_id into v_owner from finia_workspaces w where w.id = p_workspace;
  -- Version 1 : la propriétaire de l'espace seulement (les rôles gérant/caissier viendront après
  -- décision de Beau ; finia_members est vide à ce jour).
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Seule la propriétaire de l''espace peut publier un article.';
  end if;

  -- Même règle que la liaison commande -> vente (0127) : la boutique est celle de la même personne.
  select s.id into v_shop from shops s where s.owner_id = v_owner and s.status = 'active' order by s.created_at limit 1;
  if v_shop is null then raise exception 'Aucune boutique active pour cette personne.'; end if;

  if coalesce(trim(p_article->>'ref'), '') = '' or coalesce(trim(p_article->>'name'), '') = '' then
    raise exception 'Référence et nom obligatoires.';
  end if;
  if v_devise = 'FCFA' then v_devise := 'XAF'; end if;
  select * into v_fx from finia_fx_rates where currency = v_devise;
  if v_fx.currency is null or v_minor is null or v_minor < 0 then
    raise exception 'Prix ou devise invalide (%).', v_devise;
  end if;

  -- finia_fx_rates.rate = unités de la devise pour 1 FCFA ; minor = plus petite unité (100 pour l'euro).
  v_fcfa := round(v_minor / (v_fx.rate * v_fx.minor));

  insert into products (shop_id, name, description, price_fcfa, prix_saisi, devise_saisie, stock, images, is_active, accounting_ref)
  values (
    v_shop, trim(p_article->>'name'), nullif(trim(coalesce(p_article->>'description', '')), ''),
    v_fcfa, v_minor / v_fx.minor, v_devise, greatest(coalesce((p_article->>'stock')::int, 0), 0),
    case when coalesce(p_article->>'image_path', '') <> '' then array[p_article->>'image_path'] else '{}'::text[] end,
    true, trim(p_article->>'ref')
  )
  on conflict (shop_id, accounting_ref) where accounting_ref is not null do update
    set name = excluded.name, description = excluded.description, price_fcfa = excluded.price_fcfa,
        prix_saisi = excluded.prix_saisi, devise_saisie = excluded.devise_saisie, stock = excluded.stock
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function public.finia_publier_article(uuid, jsonb) from public, anon;
grant execute on function public.finia_publier_article(uuid, jsonb) to authenticated;

-- ESSAYÉ le 12/10/2026 sur le projet de TEST (qiyvoaljqmbfldephobp), dans une transaction annulée :
--   * 10,00 EUR (price_minor = 1000) -> price_fcfa = 6562 ; prix_saisi = 10 ; devise_saisie = 'EUR'   OK
--   * le MÊME appel deux fois -> le même identifiant, une seule ligne dans products                     OK
--   * le stock est mis à jour au second appel (4 puis 3)                                                OK
--   * un appel par quelqu'un qui n'est pas la propriétaire -> refusé                                    OK
-- (La base de test était en retard : les colonnes prix_saisi et devise_saisie y ont été ajoutées pour
--  l'essai, comme en production. Non essayé : le cas « pas de boutique active » et une devise inconnue.)
-- Pas encore fait côté Accounting : l'appel de cette fonction (bouton « Publier sur Finjaro ») et
-- l'affichage « publié » — c'est le travail de Claudinette, après le mot de Beau.
