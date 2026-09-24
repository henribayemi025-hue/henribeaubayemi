-- 0201 — L'atelier (0200) : la fonction qui protège le journal fixe son
-- search_path, comme le demande l'analyseur de sécurité de Supabase
-- (avertissement « function_search_path_mutable », vu le 24/09 au soir).
-- Additive : un réglage de fonction, rien d'autre.
alter function public.atelier_journal_intouchable() set search_path = public;
