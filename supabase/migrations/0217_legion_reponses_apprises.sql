-- LES RÉPONSES APPRISES — la première brique de « notre IA » (Beau, 29/09 :
-- « si tu avais déjà entraîné ça, il pouvait déjà au moins répondre à
-- certains messages »). Ce matin-là, tous les moteurs étaient coupés
-- (plafond Google, DeepSeek et OpenAI sans crédit) : l'équipe entière était
-- muette, même pour un « bonjour » auquel elle avait déjà bien répondu cent
-- fois.
--
-- Principe : quand une PERSONNE met 👍 sous la réponse d'un agent, le couple
-- (question, réponse) est retenu. La prochaine fois que la même question
-- (ou presque) arrive à CE MÊME agent, dans CETTE MÊME entreprise, il reprend
-- la réponse validée tout de suite, sans appeler aucun moteur : gratuit,
-- immédiat, et ça marche même quand tous les fournisseurs sont en panne.
--
-- Garde-fous :
-- - Seul un humain valide (un agent qui met 👍 ne compte pas).
-- - Une entreprise n'apprend que pour elle-même : rien ne passe d'une
--   entreprise à l'autre (c'est pourquoi aucun accord d'entraînement n'est
--   demandé : ses propres réponses lui reviennent).
-- - Seulement les réponses simples : ni tâche, ni action, ni livrable, et une
--   question courte. La fonction legion-repondre ne s'en sert que sur sa voie
--   rapide, qui écarte déjà tout ce qui dépend d'un chiffre ou du moment.
-- - 👍 retiré (plus aucun 👍 humain) ou 👎 humain : la réponse est oubliée.
--
-- Additif : une table et deux déclencheurs nouveaux, rien de modifié.
-- Propre à Léo ; Finjaro Accounting n'utilise pas ces tables.

create table if not exists public.legion_reponses_apprises (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  agent_id uuid not null references public.legion_agents(id) on delete cascade,
  question text not null,
  reponse text not null,
  message_id uuid not null unique references public.legion_messages(id) on delete cascade,
  valide_par uuid references public.legion_agents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists legion_reponses_apprises_agent on public.legion_reponses_apprises (entreprise_id, agent_id, created_at desc);

alter table public.legion_reponses_apprises enable row level security;
drop policy if exists legion_reponses_apprises_lecture on public.legion_reponses_apprises;
create policy legion_reponses_apprises_lecture on public.legion_reponses_apprises
  for select using (public.legion_est_membre(entreprise_id));
drop policy if exists legion_reponses_apprises_oubli on public.legion_reponses_apprises;
create policy legion_reponses_apprises_oubli on public.legion_reponses_apprises
  for delete using (public.legion_est_membre(entreprise_id));
-- Pas d'écriture directe : seuls les déclencheurs ci-dessous ajoutent.

create or replace function public.legion_apprendre_reaction()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  m record;
  q record;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  -- Seul un humain enseigne.
  if not exists (select 1 from legion_agents a where a.id = r.auteur_id and a.user_id is not null) then
    return null;
  end if;
  select id, entreprise_id, auteur_id, texte, genre, meta into m from legion_messages where id = r.message_id;
  if m.id is null then return null; end if;

  if tg_op = 'INSERT' and r.emoji = '👍' then
    if coalesce((m.meta->>'par_ia')::boolean, false) is not true
      or m.meta ? 'action' or m.meta ? 'livrable' or m.meta ? 'plan'
      or coalesce(m.genre, 'info') = 'tache'
      or not (m.meta ? 'reponse_a_id') then
      return null;
    end if;
    select id, texte into q from legion_messages where id = (m.meta->>'reponse_a_id')::uuid;
    if q.id is null or length(trim(coalesce(q.texte, ''))) not between 1 and 200 or length(trim(coalesce(m.texte, ''))) = 0 then
      return null;
    end if;
    insert into legion_reponses_apprises (entreprise_id, agent_id, question, reponse, message_id, valide_par)
    values (m.entreprise_id, m.auteur_id, trim(q.texte), m.texte, m.id, r.auteur_id)
    on conflict (message_id) do nothing;
  elsif tg_op = 'INSERT' and r.emoji = '👎' then
    -- 👎 sur la réponse d'origine, ou sur une réponse qui a resservi une réponse apprise.
    delete from legion_reponses_apprises
    where message_id = m.id
       or (m.meta ? 'appris' and id::text = m.meta->>'appris');
  elsif tg_op = 'DELETE' and r.emoji = '👍' then
    if not exists (
      select 1 from legion_reactions x join legion_agents a on a.id = x.auteur_id
      where x.message_id = m.id and x.emoji = '👍' and a.user_id is not null
    ) then
      delete from legion_reponses_apprises where message_id = m.id;
    end if;
  end if;
  return null;
end;
$function$;
revoke execute on function public.legion_apprendre_reaction() from public, anon, authenticated;

drop trigger if exists legion_apprendre_reaction on public.legion_reactions;
create trigger legion_apprendre_reaction
  after insert or delete on public.legion_reactions
  for each row execute function public.legion_apprendre_reaction();

-- La seule réponse déjà validée avant ce jour (un 👍 humain) est reprise.
insert into public.legion_reponses_apprises (entreprise_id, agent_id, question, reponse, message_id, valide_par)
select m.entreprise_id, m.auteur_id, trim(q.texte), m.texte, m.id, x.auteur_id
from public.legion_reactions x
join public.legion_agents a on a.id = x.auteur_id and a.user_id is not null
join public.legion_messages m on m.id = x.message_id
join public.legion_messages q on q.id = (m.meta->>'reponse_a_id')::uuid
where x.emoji = '👍'
  and coalesce((m.meta->>'par_ia')::boolean, false)
  and not (m.meta ? 'action' or m.meta ? 'livrable' or m.meta ? 'plan')
  and coalesce(m.genre, 'info') <> 'tache'
  and length(trim(coalesce(q.texte, ''))) between 1 and 200
on conflict (message_id) do nothing;
