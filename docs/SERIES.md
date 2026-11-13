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
