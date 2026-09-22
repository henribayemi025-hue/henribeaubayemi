-- La mémoire des salons: les longs fils se compactent.
--
-- Beau, 22/09: « il doit aussi avoir la limite, genre compacter les
-- messages quand c'est trop long ». Un agent relisait les 20 derniers
-- messages d'un salon: au-delà, il oubliait. Désormais, chaque matin
-- (legion-travail), ce qui précède les 20 derniers messages d'un salon de
-- plus de 40 messages est résumé — décisions, chiffres, qui fait quoi,
-- questions ouvertes — et le résumé est relu avant chaque réponse, comme
-- une mémoire de réunion. Le fil complet reste visible pour les humains.
-- Additive: trois colonnes.

alter table public.legion_canaux add column if not exists resume text;
alter table public.legion_canaux add column if not exists resume_jusqua timestamptz;
alter table public.legion_canaux add column if not exists resume_le timestamptz;
