-- Badge "répond vite": calculé, jamais inventé (voir CLAUDE.md §3). On
-- mesure le vrai temps de réponse d'une boutique à partir de chat_messages,
-- et on recalcule régulièrement via pg_cron — pas un chiffre figé au moment
-- de la certification.

alter table public.shops add column avg_response_minutes numeric;
alter table public.shops add column responds_fast boolean not null default false;

create or replace function public.recompute_shop_response_times()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Table temporaire: une CTE ne survit pas d'un UPDATE au suivant, alors
  -- que les deux ont besoin des mêmes statistiques calculées une seule fois.
  create temp table _shop_response_stats on commit drop as
  with paired as (
    -- Pour chaque message vendeur, le délai depuis le message acheteuse
    -- juste avant lui dans la même conversation (LAG = "réponse à quoi ?").
    select
      c.shop_id,
      m.created_at - lag(m.created_at) over (partition by m.conversation_id order by m.created_at) as delay,
      lag(m.sender_role) over (partition by m.conversation_id order by m.created_at) as prev_role
    from public.chat_messages m
    join public.conversations c on c.id = m.conversation_id
    where m.created_at > now() - interval '30 days'
  ),
  responses as (
    select shop_id, extract(epoch from delay) / 60.0 as minutes
    from paired
    where prev_role = 'buyer'
      -- Une conversation reprise après des semaines de silence ne doit pas
      -- fausser la moyenne d'une boutique par ailleurs réactive.
      and delay < interval '48 hours'
  )
  select shop_id, avg(minutes) as avg_minutes, count(*) as n
  from responses
  group by shop_id;

  update public.shops s
  set avg_response_minutes = st.avg_minutes,
      responds_fast = (st.n >= 5 and st.avg_minutes <= 60)
  from _shop_response_stats st
  where st.shop_id = s.id;

  -- Une boutique sans historique récent (ou qui n'a plus assez de réponses
  -- pour un calcul fiable) perd le badge plutôt que de le garder par défaut.
  update public.shops s
  set avg_response_minutes = null,
      responds_fast = false
  where s.id not in (select shop_id from _shop_response_stats)
    and (s.responds_fast or s.avg_response_minutes is not null);
end;
$$;

select cron.schedule(
  'finjaro-shop-response-times',
  '*/30 * * * *',
  $$select public.recompute_shop_response_times()$$
);
