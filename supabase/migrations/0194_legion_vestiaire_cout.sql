-- 0194 — Le vestiaire compte son coût (24/09).
--
-- Beau, 24/09 : « Déposer une ressource » — Mentor lit un lien ou un texte,
-- en fait une fiche et propose des compétences (fonction legion-vestiaire).
-- Chaque fiche est écrite par un modèle : son coût doit entrer dans
-- ai_usage, sinon le plafond du mois de l'entreprise ne le voit pas. Or
-- ai_usage n'accepte que les noms de fonctions d'une liste (ai_usage_fn_check).
-- On AJOUTE « legion_vestiaire » à cette liste — et « legion_banc », le banc
-- d'essai des moteurs du 24/09, qui compte déjà son coût sous ce nom mais
-- n'y figurait pas (ses lignes étaient refusées).
--
-- Additive : aucun nom n'est retiré. La liste est RELUE en base plutôt que
-- recopiée d'une migration précédente, pour ne rien perdre de ce qui aurait
-- été ajouté ailleurs (la table est partagée avec Finia et la place de
-- marché). Rien ne change pour les autres applications du projet.

do $$
declare
  v_def text;
  v_noms text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
    from pg_constraint c
   where c.conrelid = 'public.ai_usage'::regclass and c.conname = 'ai_usage_fn_check';
  -- Pas de liste du tout : rien à élargir.
  if v_def is null then return; end if;

  select array(
    select distinct n from (
      select (regexp_matches(v_def, '''([^'']+)''', 'g'))[1] as n
      union all select 'legion_vestiaire'
      union all select 'legion_banc'
    ) x order by n
  ) into v_noms;

  alter table public.ai_usage drop constraint ai_usage_fn_check;
  execute format('alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (%L::text[]))', v_noms);
end $$;
