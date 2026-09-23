-- Notre propre matière pour entraîner, un jour, notre propre IA.
--
-- Beau, 23/09: « on continue avec Gemini, mais pendant ce temps on
-- entraîne, pour qu'à long terme on utilise notre propre IA au lieu de
-- dépendre de Gemini ». Ce qui nous appartient et que Gemini n'a pas, ce
-- sont les DÉCISIONS HUMAINES: tel livrable validé, tel autre renvoyé avec
-- une remarque. On garde donc, pour chaque texte écrit par un agent, la
-- consigne complète, le texte rendu, le modèle, et — quand quelqu'un tranche
-- sur le tableau des tâches — le verdict et la remarque.
--
-- Deux garde-fous:
-- 1. CONSENTEMENT. Rien n'est gardé pour une entreprise qui n'a pas dit
--    oui (legion_entreprises.entrainement, faux par défaut). Finjaro — celle
--    de Beau — dit oui, sur sa parole du 23/09.
-- 2. USAGE. Garder n'est pas entraîner. Avant d'entraîner quoi que ce soit,
--    on relit les conditions de Google sur l'usage des réponses de Gemini
--    (elles restreignent le développement de modèles concurrents): la
--    matière sûre, ce sont les consignes, les verdicts et les remarques.
--
-- Additive: une colonne, une table, une fonction. La table n'est lisible
-- par personne depuis l'application (aucune règle d'accès): seules les
-- fonctions du serveur y écrivent.

alter table public.legion_entreprises add column if not exists entrainement boolean not null default false;
comment on column public.legion_entreprises.entrainement is
  'Oui = les textes des agents et les verdicts humains sont gardés dans ia_traces pour entraîner un jour un modèle à nous.';
update public.legion_entreprises set entrainement = true where id = '44bb201b-6787-4de0-8f7f-f9145d5c03e7';

create table if not exists public.ia_traces (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.legion_entreprises(id) on delete cascade,
  message_id uuid references public.legion_messages(id) on delete set null,
  fonction text not null,            -- ex. legion_travail:livrable, legion_travail:plan, legion_repondre
  modele text,
  consigne text not null,            -- ce qu'on a donné au modèle
  sortie text not null,              -- ce qu'il a rendu (tel que publié)
  verdict text check (verdict is null or verdict in ('valide', 'renvoye')),
  remarque text,                     -- la remarque humaine d'un renvoi
  juge_par uuid references auth.users(id) on delete set null,
  juge_le timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ia_traces_message on public.ia_traces (message_id);
create index if not exists ia_traces_entreprise on public.ia_traces (entreprise_id, created_at desc);
alter table public.ia_traces enable row level security;
-- Aucune règle: ni lecture ni écriture depuis l'application.

-- Le verdict d'un humain sur le livrable d'une tâche (bouton Valider ou
-- Renvoyer du tableau des tâches). Seul un membre de l'entreprise juge.
create or replace function public.ia_juger(p_tache uuid, p_verdict text, p_remarque text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_entreprise uuid; v_message uuid;
begin
  if p_verdict not in ('valide', 'renvoye') then raise exception 'Verdict inconnu.'; end if;
  select entreprise_id into v_entreprise from public.legion_messages where id = p_tache;
  if v_entreprise is null or not public.legion_est_membre(v_entreprise) then return; end if;
  select id into v_message from public.legion_messages
   where entreprise_id = v_entreprise and meta->'livrable'->>'tache_id' = p_tache::text
   order by created_at desc limit 1;
  if v_message is null then return; end if;
  update public.ia_traces
     set verdict = p_verdict, remarque = nullif(trim(coalesce(p_remarque, '')), ''), juge_par = auth.uid(), juge_le = now()
   where message_id = v_message;
end $$;
revoke all on function public.ia_juger(uuid, text, text) from public, anon;
grant execute on function public.ia_juger(uuid, text, text) to authenticated;
