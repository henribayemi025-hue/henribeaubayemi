-- LEGION / Léo — « Léo apprend tout seul », avec le contrôle du fondateur
-- (Beau, 24/09 : « les agents doivent pouvoir s'auto-entraîner » ; modèle :
-- Hermes Agent, docs/vestiaire/26).
--
-- La boucle :
--   1. après une tâche DIFFICILE (débloquée, renvoyée ou contestée puis
--      livrée, ou menée avec 4 vérifications et recherches ou plus), l'agent
--      écrit sa propre compétence en 5 parties (legion-travail). Elle arrive
--      ÉTEINTE (actif = false), état « a_examiner » ;
--   2. Rigo la fait passer l'examen (legion-examen, 0195), après une
--      vérification de sûreté (aucune règle de Finjaro contournée) ;
--   3. examen réussi : état « a_valider », et un message à boutons dans le
--      salon « À valider » (ou Direction). Seul un humain membre de
--      l'entreprise l'active, par « Confirmer » (legion-action). « Écarter »
--      la laisse éteinte, marquée « ecartee ». Examen raté : « a_revoir »,
--      éteinte, sans déranger personne.
--
-- Additive : des colonnes nouvelles, toutes vides pour les compétences qui
-- existent déjà (l'état ne concerne que celles qu'un agent a écrites) ; la
-- fonction de la tâche du lundi est remplacée pour aussi se réveiller quand
-- une proposition attend. Rien n'est retiré, rien n'est renommé. À appliquer
-- APRÈS 0195 (elle touche legion_examens).

alter table public.legion_competences add column if not exists etat text;
alter table public.legion_competences add column if not exists etat_le timestamptz;
alter table public.legion_competences add column if not exists etat_raison text;
alter table public.legion_competences add column if not exists decide_par uuid;
alter table public.legion_competences add column if not exists appris_de jsonb;

do $$ begin
  alter table public.legion_competences add constraint legion_competences_etat_check
    check (etat is null or etat in ('a_examiner', 'a_valider', 'a_revoir', 'active', 'ecartee'));
exception when duplicate_object then null; end $$;

comment on column public.legion_competences.etat is 'Compétence écrite par un agent (0198) : a_examiner → a_valider ou a_revoir → active (Confirmer d''un membre) ou ecartee. Vide pour les autres.';
comment on column public.legion_competences.etat_le is 'Date du dernier changement d''état (0198).';
comment on column public.legion_competences.etat_raison is 'Pourquoi elle est à revoir ou écartée (0198).';
comment on column public.legion_competences.decide_par is 'Le membre qui l''a activée ou écartée (0198).';
comment on column public.legion_competences.appris_de is 'La tâche d''où elle vient : tache_id, tache, livrable_id, pourquoi (0198).';

create index if not exists legion_competences_etat on public.legion_competences (entreprise_id, etat) where etat is not null;

-- Le résultat de la vérification de sûreté, gardé avec l'examen.
alter table public.legion_examens add column if not exists surete jsonb;
comment on column public.legion_examens.surete is 'Vérification de sûreté d''une compétence écrite par un agent : { sure, probleme, modele } (0198).';

-- La tâche planifiée du lundi (0195) se réveille aussi quand une compétence
-- écrite par un agent attend (elle est éteinte : l'ancienne condition « une
-- compétence active » ne la voyait pas), et pour le point de la semaine de
-- Mentor. Même corps que 0195, seule la condition change.
create or replace function public.lancer_legion_examen()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare jeton text;
begin
  select value into jeton from public.app_secrets where name = 'legion_examen';
  if jeton is null then return; end if;
  -- Rien à examiner ni à raconter nulle part : on n'appelle rien.
  if not exists (select 1 from public.legion_competences where actif or etat is not null) then return; end if;
  perform net.http_post(
    url := 'https://bokwivwizghdlaedczbw.supabase.co/functions/v1/legion-examen',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3dpdndpemdoZGxhZWRjemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjI5NjIsImV4cCI6MjA5NzMzODk2Mn0.U9-CH5yUyBw9KoP11OG2LjiB37MQp7WlvBwCHQquiH0',
      'x-finjaro-token', jeton),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.lancer_legion_examen() from public, anon, authenticated;
