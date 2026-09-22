-- ai_usage accepte les fonctions de Legion.
--
-- Le compteur de dépense (0150) notait chaque appel de Legion dans ai_usage,
-- mais la table n'acceptait que deux noms (finou_chat, miroir_ia): chaque
-- ligne était refusée, en silence. Trouvé au premier vrai essai (22/09).
-- On ÉLARGIT la liste — rien de ce qui était accepté ne cesse de l'être.

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array[
  'finou_chat', 'miroir_ia',
  'legion_repondre', 'legion_competences', 'legion_portrait', 'legion_se_choisir', 'legion_veilleur'
]));
