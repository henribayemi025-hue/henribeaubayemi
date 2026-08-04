-- « Prix sur demande », activable article par article par la vendeuse.
--
-- Décision de Beau (04/08): il a versé 63 articles pour la boutique de sa
-- tante sans connaître ses prix. À 0 FCFA ils s'affichaient « 0 FCFA » —
-- lisible comme gratuit — et restaient commandables tels quels. Plutôt que
-- d'inventer des prix à sa place, la fiche annonce qu'il faut demander, et
-- l'achat direct laisse place à un message vers la boutique.
--
-- L'app avait déjà cette notion, mais figée par CATÉGORIE (immobilier,
-- véhicules: QUOTE_ONLY_CATEGORIES). Elle devient un choix de la vendeuse,
-- sur n'importe quel article.
--
-- Additif: `false` partout, donc aucun article existant ne change de
-- comportement.
alter table public.products
  add column if not exists price_on_request boolean not null default false;
