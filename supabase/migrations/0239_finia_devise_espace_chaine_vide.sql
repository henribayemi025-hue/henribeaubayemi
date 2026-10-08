-- Liaison commande → vente : la devise d'un espace Accounting se lit même
-- quand son instantané porte une chaîne vide.
--
-- ⚠️ PAS ENCORE POSÉE EN PRODUCTION. Essayée et vérifiée sur le projet de test
-- `qiyvoaljqmbfldephobp` le 08/10 (espace de la gérante, instantané à '' :
-- avant → '', après → 'USD' ; commande FJ-… livrée → vente écrite). Elle touche
-- les DEUX applications : la fonction lit `finia_workspaces` et `finia_events`,
-- qui appartiennent à Accounting, pour le compte du déclencheur sur `orders`,
-- qui appartient à la place de marché. Beau doit dire oui avant qu'elle parte
-- en production. Demandée par Claudinette (Accounting) le 08/10, choix (b).
--
-- Le défaut, mesuré en production le 08/10 (lecture seule) : les trois espaces
-- réels ont bien une devise, posée à l'installation par un événement
-- `company.update` (XAF, XAF, EUR). Mais leur instantané
-- `finia_workspaces.data` porte `company.currency = ''` (chaîne vide, pas
-- null) : l'espace est créé avec un état vide avant l'installation, et
-- l'instantané n'est réécrit qu'au compactage, tous les 300 événements.
-- `coalesce` s'arrête sur la chaîne vide et ne lit jamais les événements :
-- `finia_devise_espace` renvoyait '' pour les trois, et la première commande
-- livrée aurait été notée `devise_de_l_espace_inconnue` sans créer de vente.
--
-- La correction : une chaîne vide (ou des blancs) vaut « pas de devise », dans
-- l'instantané comme dans les événements. La devise reste celle que la
-- vendeuse a choisie dans SA comptabilité ; rien n'est déduit de la boutique.
--
-- Additive : remplace le corps d'une fonction, aucune table touchée.

create or replace function public.finia_devise_espace(ws uuid)
returns text
language sql stable security definer
set search_path to 'public'
as $$
  select upper(coalesce(
    nullif(trim(w.data -> 'company' ->> 'currency'), ''),
    (select nullif(trim(e.payload -> 'patch' ->> 'currency'), '')
       from finia_events e
      where e.workspace_id = ws and e.type = 'company.update'
        and e.payload -> 'patch' ? 'currency'
        and nullif(trim(e.payload -> 'patch' ->> 'currency'), '') is not null
      order by e.seq desc limit 1),
    ''
  ))
  from (select 1) x
  left join finia_workspaces w on w.id = ws;
$$;
