-- Compteur de likes tenu par la base, comme l'est déjà celui des commentaires
-- (trg_reel_comment) et celui des abonnés (trg_follow_change).
--
-- Avant: le client lisait le compteur affiché, ajoutait ou retirait 1, et
-- réécrivait le total. Deux personnes qui likent en même temps s'écrasaient
-- donc mutuellement, et l'erreur d'écriture n'était pas vérifiée. Le compteur
-- avait déjà dérivé en production (un reel affichait 0 like alors qu'il y en
-- avait 1 dans reel_likes).
create or replace function public.on_reel_like_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    update public.reels set likes = likes + 1 where id = new.reel_id;
  elsif tg_op = 'DELETE' then
    update public.reels set likes = greatest(likes - 1, 0) where id = old.reel_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_reel_like_change on public.reel_likes;
create trigger trg_reel_like_change
  after insert or delete on public.reel_likes
  for each row execute function public.on_reel_like_change();

-- Remise à plat des compteurs déjà faux.
update public.reels r
   set likes = (select count(*) from public.reel_likes rl where rl.reel_id = r.id)
 where r.likes is distinct from (select count(*) from public.reel_likes rl where rl.reel_id = r.id);
