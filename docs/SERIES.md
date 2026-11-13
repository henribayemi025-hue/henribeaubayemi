# Mini-séries IA — plan (Beau, 13/11)

Chaîne de films en plusieurs épisodes (nom : « Fin TV », à confirmer : Finjaro TV ?). Rien n'est produit ni publié. Les nombres d'épisodes sont des PROPOSITIONS, pas des mesures.

## Ordre décidé par Beau
1. **Jane Eyre** (Brontë, 1847, domaine public) — dans l'époque.
2. **Film de romance de Beau** (titre à trouver) — voir ci-dessous.
3. **Oliver Twist** (Dickens, 1838, domaine public) — dans l'époque.
4. **La fille trop petite** — voir `docs/A-FAIRE.md`.
5. **Orgueil et Préjugés** (Austen, 1813, domaine public) — dans l'époque.
6. **La double face de Beau** — seulement quand la chaîne aura de l'audience (« quand le compte sera high »).

## Film 2 — la romance (idée de Beau)
Une jeune diplômée décroche un poste dans une grande entreprise. Le matin, en retard, elle renverse un homme à vélo et lui parle mal. Au travail : c'est le patron. Histoire d'amour forte entre la stagiaire et lui, qui est marié. Ils perdent leurs repères. Il essaie de gérer les deux femmes ; elle se retrouve mêlée au chagrin de l'épouse (mère, avec un mari infidèle). Il découvre une troisième femme, lâche les deux, dont celle qui disait être son équilibre. Déchirement final. **Fin non décidée** (à choisir avec Beau). Titre à trouver.

## Méthode proposée (une idée par ligne)
- Personnages fixes par film : un visuel de référence par personnage, réutilisé à chaque épisode.
- Épisodes de 15 s en vertical, accroche à la fin de chacun.
- Un épisode par jour au plus, sur les moteurs gratuits tant que le crédit ElevenLabs est épuisé (≈ 700 restants le 13/11, aucune recharge).
- Aucune photo prise sur le web ; aucun chiffre inventé dans les textes d'accompagnement.
- La fille trop petite : une histoire, racontée telle quelle (Beau, 13/11). Aucune précaution ajoutée.
- La romance : c'est une histoire, aucun message à passer (Beau, 13/11). Rien à ajouter.

## Prochaines étapes
1. Beau confirme le nom de la chaîne et lance la suite (il passe sur Fable 5.2).
2. Pour chaque film : synopsis en épisodes, puis le nombre d'épisodes que ça prend.
3. Premier film : Jane Eyre — découpage, personnages, premier épisode.
4. Moteurs gratuits d'image et de vidéo : lesquels tiennent le rythme (voir `docs/moteurs-gratuits.md`).

## Jane Eyre — découpage proposé (13/11, à valider par Beau)
10 épisodes d'environ 1 minute (≈ 10 minutes au total), un par jour, accroche à la fin de chacun.
1. Gateshead : l'orpheline maltraitée, la chambre rouge.
2. Lowood : l'école dure, l'amie Helen Burns.
3. Départ de Lowood, arrivée à Thornfield.
4. Rencontre avec M. Rochester (le cheval, la chute).
5. Les rires étranges la nuit, l'incendie.
6. Rochester et Jane se rapprochent ; la demande en mariage.
7. Le mariage interrompu : la femme cachée au grenier.
8. La fuite de Jane, seule sur la lande.
9. Recueillie à Moor House ; l'héritage ; la proposition de St John.
10. L'appel entendu dans la nuit, le retour : Thornfield en ruines, les retrouvailles.
Le nombre est une proposition : 8 serait plus serré, 12 plus fidèle. Le coût en crédits dépend du moteur choisi (non mesuré).

## Jane Eyre — épisode 2 « Lowood » : scénario prêt (13/11, pas encore généré)
Environ 60 s, vertical, même méthode que l'épisode 1 (5 scènes de 12 s, narratrice, musique, sous-titres). Les répliques d'enfant restent courtes ou passent par la narratrice : la voix d'enfant générée s'est révélée mal articulée dans l'épisode 1.
1. **Le réveil.** Jane ouvre les yeux dans son lit, Bessie à son chevet, une bougie. Narratrice : « Je me suis réveillée dans mon lit. Quelque chose en moi avait changé. »
2. **Le verdict.** Salon. Mrs Reed assise ; un homme en noir, très grand, M. Brocklehurst, regarde Jane de haut. Brocklehurst : « Cette enfant ira à Lowood. On y apprend l'humilité. » Mrs Reed : « Emmenez-la. »
3. **Le départ.** Aube glacée, une diligence devant le manoir. Jane monte seule, une petite malle. Bessie la serre dans ses bras : « Adieu, mademoiselle Jane. » Personne d'autre à la porte.
4. **Lowood.** Un bâtiment gris sous la neige. Un réfectoire immense, des rangées de fillettes en robe brune, du porridge brûlé, le froid. Narratrice : « Quatre-vingts filles. Un seul feu. »
5. **Helen.** Dans la cour, une fille plus âgée lit, assise sur un banc de pierre, et lève les yeux en souriant : « Je m'appelle Helen. » Jane s'assoit à côté d'elle. Narratrice : « Pour la première fois, quelqu'un me regardait sans mépris. » Carton « À suivre… ».
Coût attendu : ≈ 55 000 à 68 000 crédits (5 scènes + reprises éventuelles), d'après l'épisode 1.

## Règle audio (Beau, 13/11 soir) — à appliquer dès l'épisode 2
Problème constaté : les voix générées avec la vidéo sont parfois incohérentes (voix qui change, bouche qui ne parle pas vraiment, mots mal articulés). Ce n'est pas « pro ».
1. **Vidéo sans dialogue.** Les scènes sont générées pour l'image seulement (pas de réplique dans le prompt, audio d'ambiance seulement).
2. **Voix séparées, une par personnage, toujours la même** (liste de voix ElevenLabs choisie une fois pour la série), générées à part, contrôlées par transcription avant montage.
3. **Pas de bouche visible pendant une réplique** : le personnage est de dos, hors champ, en gros plan sur les yeux ou les mains, ou c'est la narratrice. Une voix d'enfant générée n'est pas fiable : Jane enfant ne parle presque pas, la narratrice (Jane adulte) parle à sa place.
4. **Sous-titres sur chaque réplique** (déjà fait).
5. **Contrôle avant d'envoyer** : transcription locale de toute la piste ; toute phrase mal comprise est refaite ou retirée.

## Réduire le coût (Beau, 13/11 : « ça coûte près de 15 € pour une histoire et demie »)
Mesure : l'épisode 1 a coûté ≈ 68 700 crédits ElevenLabs, soit environ 83 % de la recharge de 15 €.
Pistes, à tester dès que les connecteurs reviennent (chiffrer avec `estimate_only`, gratuit) :
1. **Images fixes animées** pour les plans calmes : une image coûte ≈ 190 crédits contre ≈ 11 000 pour un plan vidéo de 12 s ; mouvement de caméra et effet de profondeur faits au montage (gratuit).
2. **Vidéo seulement pour les moments forts**, plans de 4 à 6 s au lieu de 12 s.
3. **Comparer les modèles vidéo** disponibles chez ElevenLabs (autres que Seedance Mini) au même prix par seconde.
4. **Autres connecteurs de la session** (Figma, Canva) : ils proposent de la génération d'images/vidéos sur leurs propres crédits ; prix non vérifié, à essayer quand ils se reconnectent.
5. Aucun moteur de vidéo local gratuit : le serveur de la session n'a pas de carte graphique (non vérifié en détail).

## Jane Eyre — plan révisé (13/11 soir) : 12 épisodes, pas 10
Beau : « je sens que ça va dépasser 6 épisodes ». Oui : les 3 premiers ne couvrent que l'enfance. Coût mesuré avec la méthode « voix à part » : ≈ 40 000 crédits par épisode de 45 s (épisode 2).
- Faits : 1 La chambre rouge · 2 Lowood · 3 Helen (version courte, 3 scènes ; il manque « la nuit » et « huit ans plus tard »).
- À faire : 4 Thornfield (l'arrivée, Mrs Fairfax, Adèle, un rire dans le couloir) · 5 L'inconnu sur la route (le cheval, la chute, Rochester) · 6 Le feu (les rires la nuit, le lit en flammes) · 7 Les invités (Blanche Ingram, la bohémienne, Mason blessé) · 8 La demande (le verger, l'orage, le marronnier fendu) · 9 Le mariage interrompu (la femme du grenier) · 10 La fuite (la lande, Moor House) · 11 L'héritage (St John, « Jane ! Jane ! Jane ! ») · 12 Le retour (Thornfield en ruines, Ferndean).
- Reste : 9 épisodes ≈ 360 000 crédits, plus ≈ 18 300 pour finir l'épisode 3.

### Épisode 4 « Thornfield » — scénario prêt (pas généré : 65 crédits restants le 13/11)
Jane adulte = image de référence `hjGfiY7vYhY5wUd5pEWu` (flow lksM34VyejCb2L89t7P9). Vidéo sans réplique, voix à part.
1. **Huit ans plus tard** (scène déjà écrite, nœud `NQybEb7g2i8knMx9kJ9o`) : Jane à la fenêtre, la lettre, le départ. Narratrice : « Huit ans ont passé. J'avais dix-huit ans, et je voulais voir le monde. » (voix déjà enregistrée).
2. **La route de nuit** : une voiture sur la lande, une lanterne ; un grand manoir sombre aux créneaux. Narratrice : « On m'attendait dans une maison appelée Thornfield. »
3. **Mrs Fairfax** : une vieille dame douce en bonnet, un petit salon chaleureux, un feu, un chat. Mrs Fairfax (voix hors champ, sur le visage de Jane) : « Vous devez être gelée. Approchez du feu. »
4. **Adèle** : au matin, une petite fille en robe claire danse dans la galerie ; Jane lui tend un livre. Narratrice : « Mon élève s'appelait Adèle. Le maître, lui, n'était jamais là. »
5. **Le rire** : Jane seule dans le couloir du troisième étage, une porte fermée au fond ; elle s'arrête net, tourne la tête. Narratrice : « C'est là que j'ai entendu rire pour la première fois. Un rire qui n'avait rien de joyeux. » Carton « À suivre… ».
