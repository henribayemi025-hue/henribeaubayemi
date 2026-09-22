// Le clavier d'emojis.
//
// Beau, 22/09: « même les emojis, tu n'as pas ajouté les emojis dans le truc.
// Tu me mets les emojis là-bas en bas. Ce n'est pas comme dans WhatsApp, ou
// avec le clavier, ou avec les stickers. C'est vraiment déplorable. »
//
// Il avait raison: il n'y avait que CINQ emojis, figés, sous les messages —
// pas de clavier, pas de recherche, rien à mettre DANS le texte.
//
// Pourquoi une liste écrite ici plutôt qu'une bibliothèque: les grandes
// bibliothèques d'emojis pèsent plusieurs centaines de kilo-octets et se
// chargent depuis le web. Legion doit marcher hors ligne (c'est une règle du
// projet) et sur un téléphone qui n'a pas la 4G. Une liste choisie à la main
// tient dans quelques kilo-octets et se cherche en français.
//
// Chaque ligne: l'emoji, puis les mots qui le trouvent.

export const CATEGORIES = [
  { cle: 'recents', nom: 'Récents', emoji: '🕘' },
  { cle: 'smileys', nom: 'Smileys', emoji: '😀' },
  { cle: 'gens', nom: 'Gens', emoji: '👋' },
  { cle: 'animaux', nom: 'Animaux', emoji: '🐻' },
  { cle: 'nourriture', nom: 'Nourriture', emoji: '🍎' },
  { cle: 'activites', nom: 'Activités', emoji: '⚽' },
  { cle: 'voyage', nom: 'Voyage', emoji: '✈️' },
  { cle: 'objets', nom: 'Objets', emoji: '💡' },
  { cle: 'symboles', nom: 'Symboles', emoji: '❤️' },
  { cle: 'drapeaux', nom: 'Drapeaux', emoji: '🏳️' },
];

const D = {
  smileys: `😀 sourire content
😃 sourire joie
😄 sourire heureux
😁 sourire dents
😆 rire fort
😅 rire sueur gêné
🤣 rire terre mort
😂 rire pleure larmes
🙂 sourire léger
🙃 envers tête
😉 clin oeil
😊 sourire timide gentil
😇 ange auréole sage
🥰 amoureux coeurs
😍 amoureux yeux coeur
🤩 étoiles admire wow
😘 bisou baiser
😗 bisou
😚 bisou yeux fermés
😋 délicieux langue miam
😛 langue
😜 langue clin fou
🤪 fou dingue
😝 langue yeux fermés
🤑 argent dollars riche
🤗 câlin serrer
🤭 oups main bouche
🤫 chut silence
🤔 réfléchir penser doute
🤐 bouche cousue secret
🤨 sourcil sceptique
😐 neutre plat
😑 sans expression
😶 sans bouche muet
😏 malin sourire coin
😒 pas content blasé
🙄 yeux ciel agacé
😬 grimace gêné
🤥 mensonge pinocchio
😌 soulagé calme
😔 triste pensif
😪 fatigué sommeil
🤤 bave
😴 dort ronfle
😷 masque malade
🤒 fièvre thermomètre
🤕 blessé bandage
🤢 dégoût nausée
🤮 vomit
🤧 éternue rhume
🥵 chaud chaleur
🥶 froid gelé
🥴 étourdi ivre
😵 ko étourdi
🤯 explose tête choc
🤠 cowboy chapeau
🥳 fête anniversaire
😎 lunettes cool soleil
🤓 lunettes intello
🧐 monocle examine
😕 confus
😟 inquiet
🙁 triste léger
😮 surpris bouche ouverte
😯 étonné
😲 choqué
😳 rouge gêné honte
🥺 supplie pitié yeux
😦 inquiet bouche
😧 angoissé
😨 peur
😰 peur sueur
😥 déçu triste
😢 pleure larme
😭 pleure fort sanglot
😱 crie peur
😖 souffre
😣 persévère
😞 déçu
😓 sueur froide
😩 fatigué las
😫 épuisé
🥱 bâille ennui
😤 énervé vapeur
😡 colère rouge
😠 fâché colère
🤬 jure insulte
😈 diable malin
👿 diable colère
💀 crâne mort
☠️ tête mort danger
💩 caca
🤡 clown
👹 ogre
👺 monstre
👻 fantôme
👽 alien extraterrestre
🤖 robot machine
😺 chat sourire
😸 chat joie
😹 chat rire
😻 chat amoureux
😽 chat bisou
🙀 chat peur
😿 chat pleure
😾 chat fâché`,

  gens: `👋 salut bonjour au revoir main
🤚 main levée
✋ main stop
🖐️ main doigts
🖖 vulcain salut
👌 ok parfait
🤌 doigts italien
🤏 petit pincé
✌️ victoire paix
🤞 doigts croisés chance
🤟 amour signe
🤘 rock cornes
🤙 appelle téléphone
👈 gauche doigt
👉 droite doigt
👆 haut doigt
👇 bas doigt
☝️ index haut
👍 pouce bien ok super
👎 pouce bas pas bien
✊ poing
👊 poing coup
🤛 poing gauche
🤜 poing droite
👏 applaudir bravo
🙌 bras levés youpi
👐 mains ouvertes
🤲 mains paume prière
🤝 poignée main accord deal
🙏 prière merci s'il te plaît
✍️ écrit stylo
💅 ongles vernis
🤳 selfie
💪 muscle force bras
🦾 bras robot
🦿 jambe robot
🦵 jambe
🦶 pied
👂 oreille écoute
👃 nez
🧠 cerveau réfléchir
🦷 dent
🦴 os
👀 yeux regarde
👁️ oeil
👅 langue
👄 bouche lèvres
👶 bébé
🧒 enfant
👦 garçon
👧 fille
🧑 personne
👨 homme
👩 femme
🧔 barbe
👱 blond
🧓 vieux âgé
👴 grand-père
👵 grand-mère
🙍 mécontent
🙎 boude
🙅 non interdit refuse
🙆 oui ok bras
💁 information accueil
🙋 lève main question
🧏 sourd
🙇 s'incline pardon respect
🤦 facepalme désespoir
🤷 épaules sais pas
👮 policier police
🕵️ détective espion enquête
💂 garde
👷 ouvrier chantier casque
🤴 prince
👸 princesse
👳 turban
👲 casquette
🧕 foulard
🤵 costume marié
👰 mariée
🤰 enceinte
🤱 allaite
👼 ange bébé
🎅 père noël
🧑‍🎄 noël
🦸 super héros
🦹 méchant vilain
🧙 magicien sorcier
🧚 fée
🧛 vampire
🧜 sirène
🧝 elfe
🧞 génie
🧟 zombie
💆 massage
💇 coiffeur cheveux
🚶 marche
🧍 debout
🧎 genoux
🏃 court course
💃 danse femme
🕺 danse homme
👯 danse oreilles lapin
🧖 sauna hammam
🧗 escalade grimpe
🤺 escrime
🏇 cheval course
⛷️ ski
🏂 snowboard
🏌️ golf
🏄 surf
🚣 rame barque
🏊 nage piscine
⛹️ basket ballon
🏋️ musculation haltère
🚴 vélo
🚵 vtt montagne
🤸 gymnastique roue
🤼 lutte
🤽 water polo
🤾 handball
🤹 jongle
🧘 yoga médite calme
🛀 bain
🛌 lit dort
👭 deux femmes
👫 couple
👬 deux hommes
💏 baiser couple
💑 couple coeur
👪 famille
🗣️ parle voix
👤 silhouette personne
👥 deux personnes
🫂 câlin deux`,

  animaux: `🐶 chien chiot
🐱 chat chaton
🐭 souris
🐹 hamster
🐰 lapin
🦊 renard
🐻 ours
🐼 panda
🐨 koala
🐯 tigre
🦁 lion
🐮 vache
🐷 cochon porc
🐸 grenouille
🐵 singe
🙈 singe yeux voit pas
🙉 singe oreilles entend pas
🙊 singe bouche dit pas
🐒 singe
🐔 poule
🐧 pingouin manchot
🐦 oiseau
🐤 poussin
🦆 canard
🦅 aigle
🦉 hibou chouette
🦇 chauve souris
🐺 loup
🐗 sanglier
🐴 cheval
🦄 licorne
🐝 abeille
🐛 chenille
🦋 papillon
🐌 escargot
🐞 coccinelle
🐜 fourmi
🦗 criquet grillon
🕷️ araignée
🦂 scorpion
🐢 tortue
🐍 serpent
🦎 lézard
🦖 dinosaure
🐙 pieuvre poulpe
🦑 calamar
🦐 crevette
🦀 crabe
🐡 poisson
🐠 poisson tropical
🐟 poisson
🐬 dauphin
🐳 baleine
🦈 requin
🐊 crocodile
🐅 tigre
🐆 léopard
🦓 zèbre
🦍 gorille
🐘 éléphant
🦏 rhinocéros
🐪 chameau
🦒 girafe
🦘 kangourou
🐃 buffle
🐄 vache
🐎 cheval galop
🐖 cochon
🐏 bélier
🐑 mouton
🐐 chèvre
🦌 cerf
🐕 chien
🐩 caniche
🦮 chien guide
🐈 chat
🐓 coq
🦃 dinde
🦚 paon
🦜 perroquet
🦢 cygne
🦩 flamant rose
🕊️ colombe paix
🐇 lapin
🦝 raton laveur
🦨 mouffette
🦡 blaireau
🐁 souris
🐀 rat
🐿️ écureuil
🦔 hérisson
🐾 pattes empreintes
🐲 dragon
🌵 cactus
🎄 sapin noël
🌲 arbre
🌳 arbre
🌴 palmier
🌱 pousse plante
🌿 herbe feuille
☘️ trèfle
🍀 trèfle quatre chance
🍁 érable feuille
🍂 feuilles automne
🍃 feuille vent
🍄 champignon
🌾 blé épi
💐 bouquet fleurs
🌷 tulipe
🌹 rose
🌺 hibiscus
🌸 cerisier fleur
🌼 marguerite
🌻 tournesol`,

  nourriture: `🍏 pomme verte
🍎 pomme
🍐 poire
🍊 orange mandarine
🍋 citron
🍌 banane
🍉 pastèque
🍇 raisin
🍓 fraise
🫐 myrtille
🍈 melon
🍒 cerise
🍑 pêche
🥭 mangue
🍍 ananas
🥥 coco noix
🥝 kiwi
🍅 tomate
🍆 aubergine
🥑 avocat
🥦 brocoli
🥬 salade
🥒 concombre
🌶️ piment
🌽 maïs
🥕 carotte
🧄 ail
🧅 oignon
🥔 pomme terre
🍠 patate douce
🥐 croissant
🥯 bagel
🍞 pain
🥖 baguette
🥨 bretzel
🧀 fromage
🥚 oeuf
🍳 oeuf plat
🧈 beurre
🥞 crêpes pancake
🧇 gaufre
🥓 bacon lard
🥩 viande steak
🍗 poulet cuisse
🍖 viande os
🌭 hot dog
🍔 burger hamburger
🍟 frites
🍕 pizza
🥪 sandwich
🥙 galette kebab
🧆 falafel
🌮 taco
🌯 burrito
🥗 salade
🥘 plat mijoté
🍲 soupe marmite
🍛 riz curry
🍜 nouilles ramen
🍝 pâtes spaghetti
🍠 patate
🍢 brochette
🍣 sushi
🍤 crevette frite
🍥 poisson gâteau
🥮 lune gâteau
🍡 boulettes
🥟 raviolis
🍚 riz
🍘 cracker riz
🍙 boulette riz
🥫 conserve boîte
🍯 miel
🥛 lait
🍼 biberon
☕ café thé chaud
🍵 thé vert
🧃 jus boîte
🥤 soda gobelet
🍶 saké
🍺 bière
🍻 bières santé trinque
🥂 champagne trinque fête
🍷 vin
🥃 whisky
🍸 cocktail
🍹 cocktail tropical
🍾 bouteille fête
🧊 glaçon
🍦 glace cornet
🍧 glace pilée
🍨 glace coupe
🍩 donut beignet
🍪 biscuit cookie
🎂 gâteau anniversaire
🍰 part gâteau
🧁 cupcake
🥧 tarte
🍫 chocolat
🍬 bonbon
🍭 sucette
🍮 flan
🍿 popcorn
🧂 sel
🥄 cuillère
🍴 couverts fourchette
🍽️ assiette repas
🥢 baguettes`,

  activites: `⚽ football ballon
🏀 basket
🏈 football américain
⚾ baseball
🥎 softball
🎾 tennis
🏐 volley
🏉 rugby
🥏 frisbee
🎱 billard
🪀 yoyo
🏓 ping pong
🏸 badminton
🥅 but cage
⛳ golf
🪁 cerf volant
🏹 arc flèche
🎣 pêche
🤿 plongée
🥊 boxe gant
🥋 judo karaté
🎽 course maillot
🛹 skate
🛼 roller
🛷 luge
⛸️ patin glace
🥌 curling
🎿 ski
⛷️ skieur
🏂 snowboard
🏋️ haltère muscu
🤼 lutte
🤸 gym
⛹️ basket joue
🤺 escrime
🏇 hippisme
🧘 yoga
🏄 surfeur
🏊 nageur
🤽 water polo
🚣 aviron
🧗 escalade
🚵 vtt
🚴 cycliste
🏆 trophée coupe gagné
🥇 or premier médaille
🥈 argent deuxième
🥉 bronze troisième
🏅 médaille
🎖️ médaille militaire
🏵️ rosette
🎗️ ruban
🎫 ticket billet
🎟️ billets
🎪 cirque chapiteau
🤹 jongleur
🎭 théâtre masques
🎨 peinture art palette
🎬 cinéma clap film
🎤 micro chante karaoké
🎧 casque musique écoute
🎼 partition musique
🎹 piano clavier
🥁 batterie tambour
🎷 saxophone
🎺 trompette
🎸 guitare
🪕 banjo
🎻 violon
🎲 dé jeu hasard
♟️ échecs pion
🎯 cible fléchette objectif
🎳 bowling
🎮 jeu vidéo manette
🕹️ joystick borne
🎰 machine sous casino
🧩 puzzle pièce
🧸 ours peluche
🪅 piñata
🎈 ballon fête
🎉 fête cotillon bravo
🎊 confettis fête
🎃 halloween citrouille
🎁 cadeau
🎀 noeud ruban
🎏 carpe banderole
🎐 clochette vent
🎑 lune contemple
🧧 enveloppe rouge argent`,

  voyage: `🚗 voiture auto
🚕 taxi
🚙 suv 4x4
🚌 bus
🚎 trolley
🏎️ course formule
🚓 police voiture
🚑 ambulance
🚒 pompier camion
🚐 minibus
🛻 pick up
🚚 camion livraison
🚛 semi remorque
🚜 tracteur
🏍️ moto
🛵 scooter
🚲 vélo
🛴 trottinette
🛺 tuktuk
🚨 gyrophare urgence
🚔 police
🚍 bus arrive
🚘 voiture arrive
🚖 taxi arrive
🚡 téléphérique
🚠 télécabine
🚟 monorail suspendu
🚃 wagon
🚋 tram
🚞 train montagne
🚝 monorail
🚄 tgv train rapide
🚅 shinkansen
🚈 train léger
🚂 locomotive vapeur
🚆 train
🚇 métro
🚊 tramway
🚉 gare
✈️ avion vol voyage
🛫 décollage
🛬 atterrissage
🛩️ petit avion
💺 siège place
🚁 hélicoptère
🚟 suspendu
🛰️ satellite
🚀 fusée décollage lancement
🛸 soucoupe ovni
🛶 canoë pagaie
⛵ voilier bateau
🚤 hors bord vedette
🛥️ bateau moteur
🛳️ paquebot
⛴️ ferry
🚢 navire bateau
⚓ ancre
⛽ essence station
🚧 travaux barrière
🚦 feu tricolore
🚥 feu horizontal
🗺️ carte monde
🗿 statue moai
🗽 liberté statue
🗼 tour tokyo
🏰 château
🏯 château japon
🏟️ stade
🎡 grande roue
🎢 montagnes russes
🎠 carrousel manège
⛲ fontaine
⛱️ parasol plage
🏖️ plage
🏝️ île déserte
🏜️ désert
🌋 volcan
⛰️ montagne
🏔️ montagne neige
🗻 fuji
🏕️ camping tente
⛺ tente
🏠 maison
🏡 maison jardin
🏘️ maisons quartier
🏚️ maison abandonnée
🏗️ construction grue
🏭 usine
🏢 bureau immeuble
🏬 grand magasin
🏣 poste japon
🏤 poste
🏥 hôpital
🏦 banque
🏨 hôtel
🏩 hôtel amour
🏪 supérette
🏫 école
🏛️ classique colonnes
⛪ église
🕌 mosquée
🕍 synagogue
🛕 temple
🕋 kaaba
⛩️ torii
🌁 brume ville
🌃 nuit ville
🏙️ ville gratte-ciel
🌄 aube montagne
🌅 lever soleil
🌆 crépuscule ville
🌇 coucher soleil
🌉 pont nuit
🌌 voie lactée étoiles`,

  objets: `⌚ montre
📱 téléphone portable
📲 téléphone flèche
💻 ordinateur portable
⌨️ clavier
🖥️ ordinateur bureau
🖨️ imprimante
🖱️ souris
💽 disque
💾 disquette sauvegarde
💿 cd
📀 dvd
🧮 boulier calcul
🎥 caméra film
📷 appareil photo
📸 photo flash
📹 caméscope
📼 cassette vidéo
🔍 loupe cherche recherche
🔎 loupe droite
🕯️ bougie
💡 ampoule idée
🔦 lampe torche
🏮 lanterne
📔 carnet
📕 livre fermé
📖 livre ouvert lecture
📗 livre vert
📘 livre bleu
📙 livre orange
📚 livres bibliothèque
📓 cahier
📒 registre
📃 page
📜 parchemin rouleau
📄 document feuille
📰 journal presse
🗞️ journal roulé
📑 onglets marque
🔖 marque page
🏷️ étiquette
💰 sac argent
🪙 pièce monnaie
💴 yen
💵 dollar
💶 euro
💷 livre sterling
💸 argent envolé dépense
💳 carte bancaire paiement
🧾 reçu facture
💹 graphique hausse yen
✉️ enveloppe courrier mail
📧 email
📨 courrier entrant
📩 courrier flèche
📤 sortant boîte
📥 entrant boîte
📦 colis paquet livraison
📫 boîte lettres
📪 boîte fermée
📬 boîte ouverte
📭 boîte vide
📮 boîte postale
🗳️ urne vote
✏️ crayon
✒️ plume
🖋️ stylo plume
🖊️ stylo
🖌️ pinceau
🖍️ craie
📝 note écrit mémo
💼 mallette travail boulot
📁 dossier
📂 dossier ouvert
🗂️ classeur onglets
📅 calendrier date
📆 calendrier arrache
🗒️ bloc notes
🗓️ calendrier spirale
📇 fichier cartes
📈 graphique hausse croissance
📉 graphique baisse
📊 barres statistiques
📋 presse papier liste
📌 punaise épingle
📍 épingle lieu position
📎 trombone
🖇️ trombones
📏 règle
📐 équerre
✂️ ciseaux couper
🗃️ boîte fiches
🗄️ classeur meuble
🗑️ poubelle supprime
🔒 cadenas fermé sécurité
🔓 cadenas ouvert
🔏 cadenas stylo
🔐 cadenas clé
🔑 clé
🗝️ vieille clé
🔨 marteau
🪓 hache
⛏️ pioche
⚒️ marteaux
🛠️ outils réparation
🗡️ dague épée
⚔️ épées combat
🔫 pistolet
🏹 arc
🛡️ bouclier protection
🔧 clé plate outil
🔩 boulon écrou
⚙️ engrenage réglage paramètres
🗜️ étau
⚖️ balance justice équilibre
🦯 canne blanche
🔗 lien chaîne
⛓️ chaînes
🧰 boîte outils
🧲 aimant
⚗️ alambic chimie
🧪 éprouvette test
🧫 boîte pétri
🧬 adn
🔬 microscope
🔭 télescope
📡 antenne satellite
💉 seringue vaccin
🩸 sang goutte
💊 pilule médicament
🩹 pansement
🩺 stéthoscope
🚪 porte
🪑 chaise
🛏️ lit
🛋️ canapé
🚽 toilettes
🚿 douche
🛁 baignoire
🧴 flacon lotion
🧷 épingle nourrice
🧹 balai
🧺 panier linge
🧻 papier toilette rouleau
🧼 savon
🧽 éponge
🧯 extincteur
🛒 caddie panier courses`,

  symboles: `❤️ coeur amour rouge
🧡 coeur orange
💛 coeur jaune
💚 coeur vert
💙 coeur bleu
💜 coeur violet
🖤 coeur noir
🤍 coeur blanc
🤎 coeur marron
💔 coeur brisé
❣️ coeur exclamation
💕 deux coeurs
💞 coeurs tournent
💓 coeur bat
💗 coeur grandit
💖 coeur brille
💘 coeur flèche
💝 coeur cadeau
💟 coeur décoration
☮️ paix
✝️ croix
☪️ croissant islam
🕉️ om
☸️ roue dharma
✡️ étoile david
🔯 étoile six
🕎 menorah
☯️ yin yang
☦️ croix orthodoxe
⛎ ophiuchus
♈ bélier
♉ taureau
♊ gémeaux
♋ cancer
♌ lion
♍ vierge
♎ balance
♏ scorpion
♐ sagittaire
♑ capricorne
♒ verseau
♓ poissons
🆔 identité
⚛️ atome
🉑 accepter
☢️ radioactif
☣️ biologique danger
📴 téléphone éteint
📳 vibreur
🈶 payant
🈚 gratuit
🈸 demande
🈺 ouvert
🈷️ montant mensuel
✴️ étoile
🆚 versus contre
💮 fleur blanche
🉐 bonne affaire
㊙️ secret
㊗️ félicitations
🈴 réussite
🈵 complet
🔴 rond rouge
🟠 rond orange
🟡 rond jaune
🟢 rond vert
🔵 rond bleu
🟣 rond violet
⚫ rond noir
⚪ rond blanc
🟥 carré rouge
🟧 carré orange
🟨 carré jaune
🟩 carré vert
🟦 carré bleu
🟪 carré violet
⬛ carré noir
⬜ carré blanc
◼️ carré moyen
🔶 losange orange
🔷 losange bleu
🔸 petit losange orange
🔹 petit losange bleu
🔺 triangle rouge haut
🔻 triangle rouge bas
💠 losange point
🔘 bouton radio
🔳 bouton blanc
🔲 bouton noir
▶️ lecture play
⏸️ pause
⏹️ stop
⏺️ enregistre
⏭️ suivant
⏮️ précédent
⏩ avance rapide
⏪ retour rapide
🔼 haut
🔽 bas
➡️ flèche droite
⬅️ flèche gauche
⬆️ flèche haut
⬇️ flèche bas
↗️ flèche haut droite
↘️ flèche bas droite
↙️ flèche bas gauche
↖️ flèche haut gauche
↕️ haut bas
↔️ gauche droite
🔄 recharge boucle
🔃 tourne
🔙 retour arrière
🔚 fin
🔛 activé
🔜 bientôt
🔝 haut top
✅ coche validé fait ok
☑️ case cochée
✔️ coche
❌ croix non faux
❎ croix carré
➕ plus ajouter
➖ moins retirer
➗ division
✖️ multiplication
♾️ infini
‼️ double exclamation
⁉️ exclamation question
❓ question
❔ question blanche
❗ exclamation attention
❕ exclamation blanche
〰️ vague tilde
💱 change devises
💲 dollar
⚕️ médical
♻️ recyclage
⚜️ fleur lys
🔱 trident
📛 badge nom
🔰 débutant
⭕ cercle rouge
🛑 stop arrêt
⛔ interdit
📵 téléphone interdit
🚫 interdit
🚭 fumer interdit
❗ attention
⚠️ avertissement attention danger
🚸 enfants attention
🔞 interdit mineurs
☢️ radiation
🔆 luminosité forte
🔅 luminosité faible
〽️ alternance
⚡ éclair rapide énergie
🔥 feu chaud top
💥 explosion boum
💫 étoile tourne
⭐ étoile
🌟 étoile brille
✨ étincelles magie
💤 dort zzz
💨 vent vitesse
💦 gouttes eau
🕐 une heure
🕑 deux heures
🕒 trois heures
🕓 quatre heures
⏰ réveil alarme
⏱️ chronomètre
⏳ sablier temps
⌛ sablier fini
🔔 cloche notification
🔕 cloche barrée silence
📢 haut parleur annonce
📣 mégaphone
📯 cor postal
🔊 son fort
🔉 son moyen
🔈 son faible
🔇 muet coupé
🌍 terre afrique europe
🌎 terre amérique
🌏 terre asie
🌐 globe monde internet
🌑 nouvelle lune
🌕 pleine lune
🌙 croissant lune
☀️ soleil
🌤️ soleil nuage
⛅ éclaircies
☁️ nuage
🌧️ pluie
⛈️ orage
🌩️ éclair orage
❄️ neige flocon
☃️ bonhomme neige
🌈 arc en ciel
🌊 vague mer
💧 goutte eau`,

  drapeaux: `🏳️ drapeau blanc
🏴 drapeau noir
🏁 damier arrivée
🚩 fanion
🏳️‍🌈 arc en ciel fierté
🇨🇲 cameroun
🇫🇷 france
🇬🇧 royaume uni angleterre
🇺🇸 états unis amérique
🇨🇦 canada
🇧🇪 belgique
🇨🇭 suisse
🇩🇪 allemagne
🇪🇸 espagne
🇮🇹 italie
🇵🇹 portugal
🇳🇱 pays bas
🇸🇳 sénégal
🇨🇮 côte ivoire
🇳🇬 nigeria
🇬🇭 ghana
🇰🇪 kenya
🇿🇦 afrique sud
🇲🇦 maroc
🇩🇿 algérie
🇹🇳 tunisie
🇪🇬 égypte
🇬🇦 gabon
🇹🇩 tchad
🇨🇬 congo
🇨🇩 congo kinshasa
🇷🇼 rwanda
🇹🇬 togo
🇧🇯 bénin
🇧🇫 burkina
🇲🇱 mali
🇬🇳 guinée
🇨🇳 chine
🇯🇵 japon
🇮🇳 inde
🇧🇷 brésil
🇲🇽 mexique
🇦🇺 australie
🇦🇪 émirats dubai
🇸🇦 arabie saoudite
🇹🇷 turquie
🇷🇺 russie`,
};

// On déplie une fois, au chargement du module.
function deplier(texte) {
  return texte.split('\n').map((l) => {
    const [emoji, ...mots] = l.trim().split(/\s+/);
    return { emoji, mots: mots.join(' ') };
  }).filter((e) => e.emoji);
}

export const PAR_CATEGORIE = Object.fromEntries(
  Object.entries(D).map(([cle, texte]) => [cle, deplier(texte)]),
);

export const TOUS = Object.values(PAR_CATEGORIE).flat();

// Les plus utilisés, pour la barre de réaction rapide sous un message.
export const RAPIDES = ['👍', '❤️', '😂', '😮', '😢', '🙏', '✅', '🔥'];

const SANS_ACCENT = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function chercher(texte) {
  const q = SANS_ACCENT(texte.trim());
  if (!q) return [];
  // Ce qui commence par le mot cherché d'abord: « co » doit donner « coeur »
  // avant « chocolat ».
  const debut = [];
  const dedans = [];
  for (const e of TOUS) {
    const m = SANS_ACCENT(e.mots);
    if (m.startsWith(q) || m.includes(' ' + q)) debut.push(e);
    else if (m.includes(q)) dedans.push(e);
  }
  return [...debut, ...dedans].slice(0, 80);
}

// Les récents vivent dans le navigateur de la personne. S'ils manquent (mode
// privé, stockage bloqué), on affiche les rapides: jamais d'écran vide.
const CLE_RECENTS = 'legion:emojis-recents';

export function lireRecents() {
  try {
    const brut = localStorage.getItem(CLE_RECENTS);
    const liste = brut ? JSON.parse(brut) : null;
    if (Array.isArray(liste) && liste.length) return liste.slice(0, 32);
  } catch { /* stockage indisponible: on retombe sur les rapides */ }
  return RAPIDES;
}

export function noterRecent(emoji) {
  try {
    const liste = [emoji, ...lireRecents().filter((e) => e !== emoji)].slice(0, 32);
    localStorage.setItem(CLE_RECENTS, JSON.stringify(liste));
    return liste;
  } catch {
    return lireRecents();
  }
}
