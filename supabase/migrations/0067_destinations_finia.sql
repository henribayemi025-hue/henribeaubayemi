-- La liste unique des endroits que Finia peut proposer d'ouvrir.
--
-- Le bug du 31/08: Beau demande « Parrainage » à Finia — elle repond qu'elle
-- « n'a pas d'outil pour ca » alors que la fonction existe depuis des jours.
-- Cause reelle: tout ce que Finia sait de l'app est du texte ecrit A LA MAIN
-- dans son prompt. Ajouter une fonctionnalite ne la lui apprend JAMAIS
-- automatiquement — quelqu'un doit penser a aller lui ecrire une phrase.
--
-- Beau: « il doit etre surpuissant, monstrueux [...] tu clique directement
-- tu arrives ou tu veux ».
--
-- Cette table remplace « ecrire une phrase a la main a chaque fois » par
-- « ajouter une ligne ». Elle est lue a la fois par le prompt (finou-chat)
-- ET par le bouton cote client (FinouAction): les deux lisent la MEME
-- source, donc rien ne peut plus diverger comme hier. Elle COMPLETE les
-- actions existantes (login, sell, share_shop, delete_product, vendor_space,
-- referral) — celles-la ont une logique propre (partage natif, choix dans
-- une liste...) et restent codees a la main; celle-ci couvre tout le reste,
-- les endroits qui ne sont qu'une simple navigation.
create table if not exists public.assistant_destinations (
  id                  text primary key,
  route               text not null,
  -- Ce que Finia lit pour savoir que l'endroit existe et en parler.
  description         text not null,
  -- Le texte du bouton. Court: c'est un bouton, pas une phrase.
  libelle_bouton      text not null,
  audience            text not null default 'tous' check (audience in ('acheteur', 'vendeur', 'tous')),
  necessite_connexion boolean not null default true,
  necessite_boutique  boolean not null default false,
  actif               boolean not null default true,
  created_at          timestamptz not null default now()
);

alter table public.assistant_destinations enable row level security;

-- Public en lecture: aucune donnee sensible, seulement des chemins d'ecran.
-- Le prompt de Finia (cote serveur) ET le client en ont besoin, y compris
-- pour un visiteur non connecte qui demande "comment s'inscrire".
create policy assistant_destinations_lecture on public.assistant_destinations
  for select using (true);

create policy assistant_destinations_admin_ecrit on public.assistant_destinations
  for all using (public.is_admin()) with check (public.is_admin());

-- Les premiers endroits qu'elle ignorait ou ne pouvait jamais atteindre
-- d'un clic malgre les demandes reelles constatees dans les conversations.
insert into public.assistant_destinations (id, route, description, libelle_bouton, audience, necessite_connexion, necessite_boutique) values
  ('mes_commandes', '/profile/orders', 'Ses commandes passees en tant qu''acheteuse: statut, suivi.', 'Voir mes commandes', 'acheteur', true, false),
  ('mes_favoris', '/profile/favorites', 'Les articles qu''elle a mis en favori.', 'Voir mes favoris', 'acheteur', true, false),
  ('aide', '/profile/help', 'Ecrire a l''equipe Finjaro pour un probleme que Finia ne peut pas resoudre elle-meme.', 'Contacter Finjaro', 'tous', false, false),
  ('parametres_langue_devise', '/profile/settings', 'Changer la langue de l''application ou la devise affichee.', 'Ouvrir les reglages', 'tous', true, false),
  ('supprimer_compte', '/suppression-compte', 'Supprimer definitivement son compte Finjaro.', 'Supprimer mon compte', 'tous', false, false),
  ('mes_favoris_boutiques', '/boutiques', 'Parcourir toutes les boutiques de Finjaro.', 'Voir les boutiques', 'tous', false, false)
on conflict (id) do nothing;
