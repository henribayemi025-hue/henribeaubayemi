-- Place de marché : la vendeuse garde un article « sur demande » EXPRÈS
-- (carte « Articles sans prix », 25/09). Rigo : un « sur demande » choisi
-- exprès n'est pas un oubli, la carte ne doit plus le lui présenter.
-- Additif : une colonne, rien d'autre ; les règles d'accès existantes des
-- articles (la vendeuse modifie les siens) s'appliquent.

alter table public.products add column if not exists sur_demande_voulu_le timestamptz;
comment on column public.products.sur_demande_voulu_le is 'La vendeuse a confirmé garder le prix « sur demande » (carte Articles sans prix) ; null = pas encore confirmé.';
