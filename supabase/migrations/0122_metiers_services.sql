-- Les métiers de l'onglet Services, complétés.
--
-- Beau (10/09) a dicté la liste des métiers qu'il veut voir: technicien,
-- produits capillaires, élevage, médecin, nutritionniste, formateur,
-- enseignant, maison et bâtiment, designer graphique, community manager,
-- créateur de contenu, vidéaste, makeup artist, studio shooting, artiste,
-- peintre, écrivain, pâtisserie, événementiel, communication et marketing,
-- informatique et numérique, musique et instruments, transport et livraison,
-- comptable, voyage et tourisme, cours de langues, loisirs sport et
-- divertissement, photos vidéo et médias, services spécialisés, réparation
-- et maintenance électronique — « etc, complète vraiment ».
--
-- Ceux qui existaient déjà gardent leur id (pâtisserie, événementiel,
-- marketing, informatique, transport, photo/vidéo…), parfois avec un libellé
-- réaligné sur ses mots. Les autres deviennent des TÊTES de service à part
-- entière: c'est ce que la vendeuse coche sur sa boutique et ce que la
-- cliente choisit dans le sélecteur — un métier enfant serait invisible des
-- deux côtés.
--
-- Additif: aucune suppression, aucun renommage d'id. Après cette migration,
-- régénérer l'arbre client: node scripts/gen-categories.mjs categories.json

insert into public.categories (id, parent_id, kind, label_fr, label_en, sort_order) values
  ('technicien',              null, 'SERVICE', 'Technicien',                              'Technician',                        46),
  ('reparation_electronique', null, 'SERVICE', 'Réparation & Maintenance électronique',   'Electronics repair & maintenance',  47),
  ('soins_capillaires',       null, 'SERVICE', 'Produits & Soins capillaires',            'Hair products & care',              48),
  ('elevage_agriculture',     null, 'SERVICE', 'Élevage & Agriculture',                   'Farming & Livestock',               49),
  ('medecin',                 null, 'SERVICE', 'Médecin & Consultations',                 'Doctor & Consultations',            50),
  ('nutritionniste',          null, 'SERVICE', 'Nutritionniste & Diététique',             'Nutritionist & Dietetics',          51),
  ('formateur',               null, 'SERVICE', 'Formateur & Coaching',                    'Trainer & Coaching',                52),
  ('enseignant',              null, 'SERVICE', 'Enseignant & Soutien scolaire',           'Teacher & Tutoring',                53),
  ('cours_langues',           null, 'SERVICE', 'Cours de langues',                        'Language lessons',                  54),
  ('design_graphique',        null, 'SERVICE', 'Designer graphique',                      'Graphic designer',                  55),
  ('community_manager',       null, 'SERVICE', 'Community manager',                       'Community manager',                 56),
  ('createur_contenu',        null, 'SERVICE', 'Créateur de contenu',                     'Content creator',                   57),
  ('videaste',                null, 'SERVICE', 'Vidéaste',                                'Videographer',                      58),
  ('studio_shooting',         null, 'SERVICE', 'Studio & Shooting photo',                 'Photo studio & shoots',             59),
  ('makeup_artist',           null, 'SERVICE', 'Makeup artist',                           'Makeup artist',                     60),
  ('artiste',                 null, 'SERVICE', 'Artiste & Spectacle',                     'Artist & Performance',              61),
  ('peintre',                 null, 'SERVICE', 'Peintre & Décoration murale',             'Painter & Wall decoration',         62),
  ('ecrivain',                null, 'SERVICE', 'Écrivain & Rédaction',                    'Writer & Copywriting',              63),
  ('musicien_dj',             null, 'SERVICE', 'Musicien, DJ & Sono',                     'Musician, DJ & Sound',              64),
  ('comptable',               null, 'SERVICE', 'Comptable & Gestion',                     'Accountant & Bookkeeping',          65),
  ('voyage_tourisme',         null, 'SERVICE', 'Voyage & Tourisme',                       'Travel & Tourism',                  66),
  ('loisirs_sport',           null, 'SERVICE', 'Loisirs, Sport & Divertissement',         'Leisure, Sports & Entertainment',   67),
  ('massage_bienetre',        null, 'SERVICE', 'Massage & Bien-être',                     'Massage & Wellness',                68),
  ('pressing_blanchisserie',  null, 'SERVICE', 'Pressing & Blanchisserie',                'Laundry & Dry cleaning',            69),
  ('jardinage',               null, 'SERVICE', 'Jardinage & Espaces verts',               'Gardening & Landscaping',           70),
  ('imprimerie',              null, 'SERVICE', 'Imprimerie & Impression',                 'Printing',                          71),
  ('services_specialises',    null, 'SERVICE', 'Services spécialisés',                    'Specialised services',              72)
on conflict (id) do nothing;

-- Libellés réalignés sur les mots de Beau (ids inchangés).
update public.categories set label_fr = 'Maison, Bâtiment & BTP',    label_en = 'Home, Building & Construction' where id = 'btp_bricolage';
update public.categories set label_fr = 'Informatique & Numérique',  label_en = 'IT & Digital'                  where id = 'informatique_digital';
update public.categories set label_fr = 'Photo, Vidéo & Médias',     label_en = 'Photo, Video & Media'          where id = 'photo_video';
update public.categories set label_fr = 'Communication & Marketing', label_en = 'Communication & Marketing'     where id = 'marketing_com';
update public.categories set label_fr = 'Pâtisserie & Gâteaux',      label_en = 'Pastry & Cakes'                where id = 'patisserie_service';
update public.categories set label_fr = 'Événementiel',              label_en = 'Events'                        where id = 'evenementiel_service';
