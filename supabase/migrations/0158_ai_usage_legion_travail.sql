-- Le compteur de dépense accepte la journée de travail des agents.
--
-- La contrainte ai_usage_fn_check (0152) liste les fonctions autorisées;
-- legion-travail (0154) n'y était pas: ses appels Gemini étaient rejetés
-- en silence et n'entraient pas dans « Ce que Legion coûte ce mois-ci ».
-- Trouvé le 22/09 au soir: deux journées complètes, zéro ligne comptée.

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check
  check (fn = any (array['finou_chat', 'miroir_ia', 'legion_repondre', 'legion_competences', 'legion_portrait',
                         'legion_se_choisir', 'legion_veilleur', 'legion_travail']));
