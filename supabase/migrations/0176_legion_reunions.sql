-- 0176 — Les réunions d'agents (legion-reunion), et des coûts perdus.
--
-- 1. Beau, 23/09 : « faire communiquer et disputer les agents » ; « ils vont
--    faire des réunions… on va voir comment ils sont en train de le faire ».
--    La fonction legion-reunion fait parler les participants tour à tour
--    (positions, puis débat contradictoire), puis le président rédige le
--    compte rendu, les tâches et ce que le fondateur doit trancher. Chaque
--    prise de parole est un appel séparé, qui lance le suivant : les
--    messages arrivent un par un, en direct, dans le salon.
--    → son nom est ajouté à la liste des fonctions qui comptent leur coût,
--      et un jeton partagé lui permet de s'appeler elle-même.
--
-- 2. Trouvé en ajoutant ce nom (23/09) : six fonctions de la place de marché
--    écrivent leur coût sous un nom que la contrainte refusait — l'insertion
--    échouait en silence, et leur dépense n'entrait jamais dans le plafond
--    du mois. Même défaut que celui corrigé pour Legion en 0152. Leurs noms
--    exacts, tels qu'écrits dans leur code :
--      vendor-copilot → 'vendor_copilot'        chat-autoreply → 'chat-autoreply'
--      troc-eval      → 'troc_eval'             chat-moderation-sweep → 'chat_moderation_sweep'
--      finou-vision   → 'finou_vision'          kyc-ocr        → 'kyc_ocr'
--
-- On ÉLARGIT la liste : rien de ce qui était accepté ne cesse de l'être.

alter table public.ai_usage drop constraint if exists ai_usage_fn_check;
alter table public.ai_usage add constraint ai_usage_fn_check check (fn = any (array[
  'finou_chat', 'miroir_ia',
  'legion_repondre', 'legion_competences', 'legion_portrait', 'legion_se_choisir', 'legion_veilleur',
  'legion_travail', 'legion_modele', 'traduire_fiche',
  'legion_reunion',
  'vendor_copilot', 'chat-autoreply', 'troc_eval', 'chat_moderation_sweep', 'finou_vision', 'kyc_ocr'
]));

-- Le jeton avec lequel la réunion passe d'une prise de parole à la
-- suivante (même mécanique que legion_travail et legion_repondre). Tiré au
-- hasard ici : il n'apparaît nulle part dans le dépôt.
insert into public.app_secrets (name, value)
values ('legion_reunion', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;
