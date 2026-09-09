alter table public.profiles add column finia_memory text;

comment on column public.profiles.finia_memory is
  'Mémoire courte que Finia tient à jour sur cette personne (quelques lignes: ce qu''elle vend/cherche, sa langue/son ton, sa ville). Écrite par l''outil update_memory de finou-chat, jamais par l''utilisateur directement.';
