-- « Une suggestion » (Beau, 29/09 : « que les gens ajoutent des suggestions »)
-- rejoint « Passer à Premium » et « Nous contacter » dans legion_demandes.
-- Additif : la liste des genres permis s'élargit, rien n'est retiré.
alter table public.legion_demandes drop constraint if exists legion_demandes_genre_check;
alter table public.legion_demandes add constraint legion_demandes_genre_check
  check (genre in ('premium', 'contact', 'suggestion'));
