-- Modération de texte dans les messages (insultes/spam) — Beau, liste du
-- 08/09. Contrairement à l'inspection du matin (produits/vidéos/boutiques,
-- migration 0053+), qui peut BLOQUER un contenu public illégal, un message
-- privé n'est jamais masqué ni son auteur suspendu automatiquement ici: on
-- se contente de SIGNALER à Beau, comme n'importe quel signalement "douteux"
-- (severity='review'). Deux raisons:
--   - une conversation commerciale peut être vive sans être abusive, et un
--     faux positif ne doit jamais suspendre un compte tout seul;
--   - `on_report()` (migration 0047) suspend automatiquement après 3
--     signalements sur un même 'user' — brancher la détection automatique
--     là-dessus ferait courir ce risque à chaque faux positif répété.
-- target_type='chat_message' n'est traité par AUCUNE branche de on_report():
-- le signalement atterrit dans la console d'administration pour une vraie
-- décision humaine, sans toucher au compteur de suspension.
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('shop', 'user', 'product', 'reel', 'reel_comment', 'chat_message'));

-- Même patron que chat_autoreply (migration 0091): jeton dédié, distinct de
-- tous les autres — une fuite de l'un ne compromet pas les autres.
insert into public.app_secrets (name, value)
values ('chat_moderation_sweep', encode(gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.lancer_chat_moderation()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'chat_moderation_sweep';
  if jeton is null then
    raise notice 'jeton chat_moderation_sweep absent, inspection non lancée';
    return;
  end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/chat-moderation-sweep',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.lancer_chat_moderation() from anon, authenticated;

-- Toutes les 15 minutes, comme chat_autoreply: assez réactif pour un abus en
-- cours, sans coût tant qu'il n'y a rien de nouveau à relire (watermark).
select cron.schedule(
  'finjaro-chat-moderation',
  '*/15 * * * *',
  $$select public.lancer_chat_moderation()$$
);
