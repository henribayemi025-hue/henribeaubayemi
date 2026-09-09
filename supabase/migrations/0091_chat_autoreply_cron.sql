-- Finia Premium — le cron qui repère les conversations à relancer et
-- déclenche l'agent (supabase/functions/chat-autoreply). Même patron que
-- lancer_inspection_contenus() (migration 0056) : le cron ne peut pas
-- appeler Gemini lui-même (HTTP), il réveille la fonction edge avec le
-- jeton partagé, elle fait le travail.
create or replace function public.conversations_a_relancer_ia(p_seuil_heures int default 2, p_limite int default 20)
returns table(conversation_id uuid, shop_id uuid, buyer_id uuid, owner_id uuid, shop_name text)
language sql
security definer
set search_path to 'public'
as $$
  select c.id, c.shop_id, c.buyer_id, s.owner_id, s.name
  from conversations c
  join shops s on s.id = c.shop_id
  join lateral (
    select sender_role, created_at from chat_messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  where s.premium_until > now()
    and lm.sender_role = 'buyer'
    and lm.created_at < now() - (p_seuil_heures || ' hours')::interval
  order by lm.created_at asc
  limit p_limite;
$$;

comment on function public.conversations_a_relancer_ia(int, int) is
  'Conversations dont le dernier message (acheteuse) attend une réponse depuis plus de p_seuil_heures, sur une boutique Finia Premium active. Après une réponse auto, le dernier message devient sender_role=vendor: ne matche plus tant que l''acheteuse n''écrit pas de nouveau.';

revoke execute on function public.conversations_a_relancer_ia(int, int) from anon, authenticated;

create or replace function public.lancer_chat_autoreply()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'chat_autoreply';
  if jeton is null then
    raise notice 'jeton chat_autoreply absent, agent non lance';
    return;
  end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/chat-autoreply',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.lancer_chat_autoreply() from anon, authenticated;

-- Toutes les 15 minutes : assez réactif pour un seuil de 2h d'attente,
-- assez espacé pour ne jamais peser sur le budget IA (aucun coût si aucune
-- conversation ne correspond, ce qui sera le cas la quasi-totalité du
-- temps tant que peu de boutiques sont premium).
select cron.schedule(
  'finjaro-chat-autoreply',
  '*/15 * * * *',
  $$select public.lancer_chat_autoreply()$$
);
