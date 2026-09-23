-- 0177 — Missions d'agents (intérim, renfort d'un service, expert) et
-- droits par agent.
--
-- Beau, 23/09 : « des agents IA par service : vous avez 20 personnes à tel
-- service, on vous envoie les agents qui font ceci et ceci » ; « une boîte
-- d'intérim » ; « un agent expert en audit : on le branche au truc de
-- l'entreprise et il fait — agent intérim ». L'étude (docs/LEGION-INTERIM-
-- ETUDE.md) dit ce qu'il faut : une fiche de mission (objectif, périmètre,
-- ce qu'il ne fait jamais, à qui passer la main), une date de fin avec
-- extinction automatique, et des droits par agent.
--
-- Tout est AJOUTÉ (colonnes nullables ou avec valeur par défaut) : rien de
-- ce qui existe ne change de sens.

alter table public.legion_agents
  -- Ce que l'agent ne fait JAMAIS, relu avant chaque réponse (E3).
  add column if not exists jamais text,
  -- Ce qu'il a le droit de lire parmi ce que l'entreprise a branché (E4) :
  -- 'mesures', 'boutique', 'web', 'github', 'documents'. Vide = tout.
  add column if not exists peut_lire text[],
  -- La fiche de mission : { objectif, perimetre, relais_humain, debut, type }.
  add column if not exists mission jsonb,
  -- Le jour où la mission s'arrête : l'agent s'éteint seul le lendemain matin.
  add column if not exists fin_mission date,
  add column if not exists interim boolean not null default false;

-- Chaque matin : les intérimaires dont la mission est finie s'éteignent, et
-- le disent dans le salon de leur service (ou en Direction). Pour garder un
-- agent, on le rallume et on repousse la date dans sa fiche.
create or replace function public.legion_fin_des_missions()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  n integer := 0;
  a record;
  salon uuid;
  anglais boolean;
begin
  for a in
    select * from public.legion_agents
    where interim and actif and fin_mission is not null and fin_mission < current_date and user_id is null
  loop
    update public.legion_agents set actif = false where id = a.id;
    select c.id into salon
    from public.legion_canaux c
    where c.entreprise_id = a.entreprise_id
      and coalesce(array_length(c.prive_entre, 1), 0) = 0
      and (lower(c.nom) = lower(coalesce(a.departement, '')) or lower(c.nom) = 'direction')
    order by (lower(c.nom) = lower(coalesce(a.departement, ''))) desc
    limit 1;
    select coalesce(e.langue, 'fr') = 'en' into anglais from public.legion_entreprises e where e.id = a.entreprise_id;
    if salon is not null then
      insert into public.legion_messages (entreprise_id, canal_id, auteur_id, user_id, texte, genre, meta)
      values (
        a.entreprise_id, salon, a.id, null,
        case when anglais
          then 'My mission ended on ' || to_char(a.fin_mission, 'DD/MM') || ': I am switching off. My deliverables stay on the task board. To keep me, switch me back on and move the date in my profile.'
          else 'Ma mission s''est terminée le ' || to_char(a.fin_mission, 'DD/MM') || ' : je m''éteins. Mes livrables restent au tableau. Pour me garder, rallume-moi et repousse la date dans ma fiche.'
        end,
        'info',
        jsonb_build_object('sans_reponse', true, 'fin_mission', true)
      );
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.legion_fin_des_missions() from public, anon, authenticated;

select cron.schedule('legion-fin-des-missions', '5 5 * * *', 'select public.legion_fin_des_missions()');

-- La fonction qui propose les agents d'un renfort compte son coût.
alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array[
  'finou_chat', 'miroir_ia',
  'legion_repondre', 'legion_competences', 'legion_portrait', 'legion_se_choisir', 'legion_veilleur',
  'legion_travail', 'legion_modele', 'traduire_fiche',
  'legion_reunion', 'legion_renfort',
  'vendor_copilot', 'chat-autoreply', 'troc_eval', 'chat_moderation_sweep', 'finou_vision', 'kyc_ocr'
]));
