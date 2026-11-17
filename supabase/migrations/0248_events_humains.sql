-- 0248 — events_humains : le trafic SANS les robots (Beau, 16/11 : « écarte les
-- robots du comptage »). ADDITIF : une vue, aucune table ni colonne touchée.
-- Les tables d'Accounting (finia_*) et auth.users ne sont pas concernées.
--
-- Un visiteur est écarté quand :
--   1. une de ses lignes porte meta.robot = true (marque posée à l'arrivée
--      depuis le 16/11 : réseau d'un hébergeur, voir src/worker.js), OU
--   2. (historique, avant la marque) sa visite vient des États-Unis, il n'a
--      fait AUCUN geste (intro fermée, cookies, clic article, recherche,
--      WhatsApp, panier…) et n'est pas connecté. Mesuré le 15/11 : 23 des
--      3 489 visiteurs américains avaient fait un geste. Cette règle sous-compte
--      donc quelques vrais Américains passifs ; elle ne fabrique pas de visiteurs.
create or replace view public.events_humains as
with par_visiteur as (
  select
    meta->>'anon_id' as anon_id,
    bool_or(meta->>'robot' = 'true') as marque,
    bool_or(meta->>'pays' = 'US') as americain,
    bool_or(
      type in ('intro_closed','cookie_answer','product_click','search','reel_view',
               'cart_add','checkout_start','order_placed','whatsapp_click',
               'share_shop','contact_intent')
      or user_id is not null
    ) as geste
  from public.events
  where meta->>'anon_id' is not null
  group by 1
)
select e.*
from public.events e
left join par_visiteur v on v.anon_id = e.meta->>'anon_id'
where v.anon_id is null
   or not (coalesce(v.marque, false) or (coalesce(v.americain, false) and not coalesce(v.geste, false)));

-- Mêmes droits que la table : la vue ne contourne pas les règles de lecture.
alter view public.events_humains set (security_invoker = true);
revoke all on public.events_humains from anon, authenticated;
grant select on public.events_humains to service_role;
