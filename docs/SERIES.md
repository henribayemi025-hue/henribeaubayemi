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

## Style télénovela / micro-drama (idée de Beau, 17/11)

Épisodes verticaux de 1 à 2 min, gros plans sur les visages, zooms brusques au moment des révélations, coup de musique, trahisons et secrets, chaque épisode finit sur un suspense. Histoire candidate : la romance stagiaire / patron marié (titre et fin à décider par Beau).

## « Ce que sa femme ne sait pas » — choisi par Beau le 17/11

Style télénovela vertical. Titre 2, fin 2 (le retournement : l'épouse savait tout depuis le début et avait fait embaucher la stagiaire pour obtenir des preuves, divorcer et garder l'entreprise).

Personnages (noms provisoires, à confirmer par Beau)
- Naomi, 24 ans, stagiaire brillante, sans argent, six mois de contrat.
- Laurent, 45 ans, directeur de l'entreprise, marié, charmeur, sûr de lui.
- Victoria, 42 ans, son épouse, élégante, calme, actionnaire principale (l'entreprise vient de son père).
- Sandra, responsable des ressources humaines, discrète.

Plan en 10 épisodes de 1 à 1 min 30 (chaque fin = suspense)
1. Le premier jour. Naomi arrive, Laurent la remarque. Indice caché : sur le dossier d'embauche, la signature « V. ». Fin : Laurent lui dit « Restez ce soir, j'ai besoin de vous. »
2. La soirée de travail. Rapprochement, premier baiser dans le bureau vide. Fin : une lumière s'éteint au bout du couloir — quelqu'un était là.
3. Victoria au bureau. Elle invite Naomi à déjeuner, aimable. Fin : « Mon mari vous apprécie beaucoup. »
4. Le secret. Hôtel, messages cachés, mensonges. Indice : Sandra envoie un message à un contact nommé « V ». Fin : le téléphone de Laurent sonne, « Victoria », en pleine nuit.
5. Le cadeau. Laurent offre un collier à Naomi. Fin : Victoria porte le même au dîner de l'entreprise.
6. La peur. Naomi croit que Victoria sait. Laurent la rassure : « Elle ne sait rien. » Fin : Victoria, seule, regarde des photos de Naomi et Laurent… et sourit.
7. La promesse. Laurent promet de quitter sa femme à la fin du stage. Fin : Naomi découvre qu'elle n'est pas la première stagiaire.
8. Le doute. Naomi fouille, trouve le dossier d'embauche, la signature « V. Laurent-… ». Fin : « C'est elle qui m'a choisie ? »
9. Le pot de départ. Tout le bureau réuni, Victoria prend la parole. Fin : elle projette les photos.
10. Le retournement. Victoria explique calmement : elle savait depuis le premier jour, elle a recruté Naomi pour avoir les preuves. Divorce, l'entreprise reste à elle, Laurent sort avec un carton. Dernier plan : Victoria tend une carte à Naomi — « Vous êtes douée. Je vous embauche. » Noir.

Règle : c'est une histoire, sans morale ni avertissement (Beau, 13/11).

### Épisode 1 — « Le premier jour » (≈ 70 s, 9 plans, vertical 9:16)

Règle audio : vidéo sans paroles, voix enregistrées à part ; quand quelqu'un parle, on voit son dos, ses mains ou l'autre personnage qui écoute (jamais la bouche).

1. (6 s) Matin, tour de verre d'une grande ville. Naomi, tailleur simple, badge « STAGIAIRE » à la main, lève les yeux vers l'immeuble. Musique douce, cœur qui bat.
   Voix intérieure de Naomi : « Six mois. Six mois pour changer ma vie. »
2. (7 s) Hall d'accueil. Sandra (RH) lui tend un dossier, sourire poli. Gros plan sur le dossier : la signature « V. » en bas de la page (indice, une seconde, on ne s'y arrête pas).
   Sandra (de dos) : « Bienvenue, Naomi. Vous commencez au dernier étage. »
3. (7 s) Ascenseur. Naomi seule, se regarde dans le miroir, respire. Les portes s'ouvrent sur un open space lumineux.
4. (8 s) Le bureau de direction, porte vitrée. Laurent, costume sombre, au téléphone, tourné vers la fenêtre. Il se retourne, la voit. Ralenti léger. Coup de musique.
5. (7 s) Gros plan sur les yeux de Laurent, puis sur Naomi qui baisse les siens. Les mains de Laurent posent son téléphone.
   Laurent (hors champ) : « C'est vous, la stagiaire dont tout le monde parle ? »
6. (8 s) Réunion d'équipe. Naomi corrige un chiffre sur l'écran ; tout le monde se tourne vers elle. Laurent, au fond, sourit à moitié.
   Naomi (de dos, face à l'écran) : « Excusez-moi… le total est faux. »
7. (7 s) Fin de journée. Les bureaux se vident. Naomi range ses affaires. Sur le bureau de Laurent, une photo de mariage : Laurent et Victoria. Naomi la remarque.
8. (8 s) Victoria, seule dans une voiture noire garée devant l'immeuble, regarde les fenêtres du dernier étage. Elle raccroche un téléphone. Visage calme, impossible à lire.
9. (9 s) Naomi enfile son manteau. Une main se pose sur la porte : Laurent, derrière elle.
   Laurent (hors champ, voix basse) : « Restez ce soir. J'ai besoin de vous. »
   Gros plan sur le visage de Naomi. Coup de musique. Noir. Titre : « Ce que sa femme ne sait pas ». Texte : « Épisode 2 bientôt ».

Coût estimé : ≈ 67 s de vidéo × 916 ≈ 61 000 crédits + voix et images ≈ 3 000.

### Retour de Beau sur la v1 (17/11) — À RESPECTER pour la suite

- La v1 de 61 s n'est PAS l'épisode 1 : c'est la **bande-annonce**. On la garde comme bande-annonce, en changeant les voix, puis on la publie.
- **Voix** : celles de la v1 sont « horribles », trop IA (voix anglaises de Runway qui parlent français). Il faut des voix françaises naturelles, avec émotion. À tester : voix natives françaises d'ElevenLabs (bibliothèque ou voix conçues) une fois la facture réglée.
- **Pas de précipitation** : la série peut faire 30 épisodes. Chaque épisode doit être consistant et suivi : les scènes s'enchaînent, on voit les actions se faire (elle marche, ouvre la porte, monte), personne n'apparaît ni ne disparaît d'un plan à l'autre « comme de la sorcellerie ».
- **Piment, comme dans les novelas** : scènes chaudes et sensuelles (lui torse nu, elle très séduisante, tension physique), suggérées, sans nudité.
- **Épisode 1 voulu par Beau** :
  1. Le matin : Naomi en retard, elle court dans les transports, le métro, la foule.
  2. Elle arrive à la tour, voix intérieure : « Mon premier jour… je suis tellement excitée ! »
  3. L'ascenseur, elle se trompe d'étage et de bureau : elle entre par erreur dans le bureau du patron.
  4. Laurent : « C'est votre bureau, ici ? » Elle, confuse : non. Il appelle quelqu'un pour la guider.
  5. La réunion avec les investisseurs : Naomi doit y présenter un petit point dès son premier jour. Elle le présente très bien. Les regards entre eux, l'alchimie monte.
  6. Dans son propre bureau : elle voit la photo — il est marié, il a des enfants.
  7. Le soir, pressée de partir, elle fait tomber quelque chose ; ils se baissent en même temps pour le ramasser, leurs regards se croisent. Suspense.
- Ensuite : les autres épisodes, la suite de Jane Eyre, les autres vidéos.

### Épisode 1 « Le premier jour » — version longue (17/11, d'après Beau)

≈ 2 min, 22 plans, scènes enchaînées (chaque action se voit : elle court, ouvre, entre). Voix ajoutées à la fin (ElevenLabs, voix françaises naturelles).

A. Le réveil — A1 Le réveil sonne, Naomi se redresse d'un bond (« Non, non, non… pas aujourd'hui ! »). A2 Elle s'habille en vitesse, attrape son sac, claque la porte.
B. Laurent, le même matin (piment) — B1 Grand appartement, Laurent torse nu devant le miroir, il enfile sa chemise blanche, alliance au doigt.
C. Le métro — C1 Naomi dévale l'escalier du métro, se glisse entre les portes qui se ferment. C2 Dans la rame bondée, elle regarde l'heure : 8 h 52.
D. La tour — D1 Elle sort en courant, lève les yeux vers la tour, sourire (« Mon premier jour… je suis tellement excitée ! »). D2 Elle passe les portiques avec son badge.
E. L'erreur — E1 Ascenseur : elle appuie sur un bouton, arrange ses cheveux dans le miroir. E2 Couloir du dernier étage, elle lit les portes, ouvre une grande porte.
F. Le mauvais bureau — F1 Elle entre ; Laurent lève les yeux de son bureau. (« Je peux vous aider ? » — « Pardon… je cherche le service finances. ») F2 Gros plans, gêne et sourires. (« C'est votre bureau, ici ? » — « Non… je crois que je me suis trompée. ») F3 Il décroche son téléphone en la regardant (« Sandra ? Votre nouvelle stagiaire s'est perdue… chez moi. »). F4 Sandra vient la chercher ; Laurent la regarde partir.
G. La réunion des investisseurs — G1 Salle vitrée, investisseurs assis ; Naomi entre avec son ordinateur. G2 Elle présente avec assurance (« Si on regroupe les livraisons, on économise douze pour cent dès ce trimestre. »). G3 Les investisseurs approuvent ; un investisseur : « Qui est cette jeune femme ? » ; Laurent et Naomi échangent un regard.
H. La photo — H1 Fin d'après-midi, elle frappe au bureau vide de Laurent pour déposer un dossier, entre. H2 Sur le bureau : photo de Laurent, Victoria et leurs deux enfants (« Marié… deux enfants. Évidemment. »).
I. Le soir — I1 Les bureaux se vident, elle se dépêche. I2 Dans le hall, son dossier lui échappe, les feuilles s'éparpillent. I3 Ils s'accroupissent en même temps, leurs mains se touchent, leurs visages tout près (« Vous partez déjà ? »). I4 Le téléphone de Laurent vibre : « Victoria ». Il ne décroche pas. Noir. « À suivre… »

### Épisode 1 — version de Beau (17/11, dictée) — REMPLACE les versions précédentes

Règles : peu de scènes mais vraiment intéressantes (« même une infime partie, qu'elle soit vraiment intéressante ») ; les personnages parlent à l'écran, les lèvres bougent (synchronisation labiale) ; pas de saut d'un moment à l'autre ; la bande-annonce sera faite à la fin, comme la somme des 8 épisodes.

1. La cuisine, le matin. Victoria, assise, se confie à son amie (nom à choisir) : il a tellement changé, rien n'est plus pareil, il n'est plus attentionné ; il y a des rumeurs au bureau, il coucherait avec toutes les stagiaires, toutes les nouvelles ; « je n'en peux plus ». L'amie : il ne faut pas croire tout ce qu'on dit… mais c'est vrai que certaines choses sont différentes. Victoria : « D'accord. »
2. Laurent descend l'escalier : « Bonne journée » à sa femme. Il croise le regard de l'amie : regard amoureux, elle aussi. Victoria : « C'est quoi, ça ? » L'amie : « Non, rien, rien, rien. » Laurent monte en voiture et part.
3. Naomi se lève : « Il faut que je parte… aujourd'hui, je ne peux pas être en retard. C'est mon premier jour. » Le métro.
4. L'accueil : la réceptionniste lui remet son badge (« Bienvenue parmi nous »). Sa manager descend la chercher, la présente à l'équipe.
5. « Et je vais te présenter… » Naomi se retourne et voit Laurent. Son cœur s'emballe : comme il est beau. Il la regarde. La manager : « Je te présente le directeur, Laurent. » Il la regarde dans les yeux ; la tension monte… fin de l'épisode 1.

### Épisode 2 — dicté par Beau (17/11)

Nouveaux personnages : le frère de Laurent ; la secrétaire de Laurent.
1. Bureau de Laurent. Assis dans son fauteuil, il lance une balle de tennis contre le mur, distrait. Son frère lui parle ; Laurent ne répond pas, il pense à Naomi. Le frère : « Mais où t'as la tête aujourd'hui ? C'est la nouvelle, c'est ça ? J'ai vu comment tu la regardais. Laurent, n'oublie pas que t'as déjà trop fait souffrir Victoria avec tes bêtises. » Laurent : « T'inquiète, t'inquiète… je gère. » Le frère sort.
2. Laurent demande à sa secrétaire d'appeler Naomi dans son bureau. La secrétaire sait déjà comment ça va finir. Devant la porte, elle arrête la main de Naomi : « Fais attention. Ne t'embarque pas là-dedans. » Naomi la regarde : « Celle-ci, elle me veut quoi ? » Elle entre en souriant.
3. Laurent : « Alors, ta première journée ? » Pendant qu'elle raconte, il se lève, tourne autour d'elle, la regarde d'un regard de prédateur (référence de Beau : la série « The Polygamist »).
4. Naomi voit le cadre de sa femme et de ses enfants sur le bureau : « C'est ta femme ? » Laurent : « Pfff… je ne peux pas vraiment le dire. On est en instance de divorce. » Naomi sourit, son humeur revient.
Durée estimée : ≈ 2 min. Fin à renforcer d'un suspense (proposé à Beau).

### Changement d'histoire (Beau, 17/11) — remplace la « fin 2 »

- Victoria N'A PAS fait embaucher Naomi : ce retournement est abandonné.
- La secrétaire de Laurent (nom provisoire Josiane) a été folle amoureuse de lui. Il l'a utilisée, puis a continué à faire venir des filles dans son bureau. Un jour, la voyant parler avec un nouvel employé, il a renvoyé ce dernier et l'a menacée : « Tu n'es rien. Tu es à moi et à personne d'autre. » Blessée, elle a payé des gens pour le frapper.
- Fin de l'épisode 2 : Naomi sort du bureau en souriant ; la secrétaire décroche : « Bonjour… J'ai changé d'avis. Je maintiens le plan pour ce soir. »

### Épisode 3 — dicté par Beau (17/11)

1. Le soir, Laurent rentre ; des hommes l'encerclent et le frappent. Il se retrouve à l'hôpital ; sa femme est là.
2. Le lendemain, Naomi arrive au bureau : Laurent n'est pas là. « Il s'est fait taper. » — « Par qui ? Mon Dieu… » Inquiète, elle part ; les collègues la regardent (« T'es qui, toi, pour y aller ? Sa femme est déjà là-bas. ») ; elle répond qu'elle veut juste se rassurer.
3. À l'hôpital, elle tombe sur Victoria : « Bonjour, je viens voir Laurent. » Victoria : « T'es qui, toi ? T'es malade ? Il ne veut voir personne. » Naomi insiste ; le ton monte.
4. Laurent, de son lit : « Laisse-la entrer… t'inquiète. Victoria, ne crie pas, tu me fais mal à la tête. »
5. Naomi entre, lui touche la main ; Victoria regarde comment ils se parlent. Naomi : « Je n'allais pas supporter… j'avais trop mal. » Victoria explose : « Tu vas sortir d'ici ! » Naomi sort en murmurant : « Je le comprends… elle est trop toxique, cette femme. »
6. Victoria : « Qu'est-ce que tu me veux, Laurent ? Je n'en peux plus. » Laurent : « Arrête de bavarder, tu me fais mal à la tête. » Victoria s'assoit par terre dans le couloir de l'hôpital, désespérée, enlève sa perruque et pleure. Fin.

### Autocritique après retour d'une spectatrice (17/11) — défauts à corriger
1. Géographie qui saute : dans l'ép. 2 scène 1, Marc est debout à la fenêtre sur le plan large, puis penché sur le bureau en gros plan, puis sort d'un autre endroit. Sur le plan large, Marc tient lui aussi une balle.
2. Monologue figé : la tirade de Marc (8 s) est un seul plan fixe, sans plan de réaction de Laurent.
3. Plans parlants trop statiques (OmniHuman) : caméra fixe, corps immobile, même cadrage ; on sent la machine.
4. Coupes au métronome (5 s), peu de plans de réaction, peu de plans larges pour situer.
5. Son trop propre : voix sans réverbération de la pièce, peu de bruitages (balle, pas, porte).
6. Sous-titres trop longs (3 lignes) et trop petits pour un téléphone.
Méthode corrigée : plan au sol de chaque scène avant de générer (qui est où), plans de réaction intercalés pendant les tirades, plans larges de rappel, bruitages, sous-titres 2 lignes max en gros.
