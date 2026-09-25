# 46 — GTA San Andreas, point par point, et ce que Léo en fait

- **Reçu de Beau le 25/09/2026** : plusieurs dossiers complets sur GTA San Andreas (2004) — tout ce que le joueur pouvait faire, les graphismes, les véhicules, les missions, l'océan, les activités, la personnalisation, la radio, la carte, la sauvegarde, l'IA et la police, les secrets, puis la technique (moteur RenderWare, streaming, niveaux de détail, scripts de mission `main.scm`, fichiers de données, modding) — et le lien https://github.com/gta-reversed/gta-reversed.
- **Pourquoi** : Beau veut que le monde de Léo se vive comme GTA (« une seconde vie »), mais **construit par les données de chacun** : dans la cité, les bâtiments sont SES projets, SES boutiques, SES clients ; en créant son compte, chacun choisit d'habiter une maison ou une cité ; « ça sera un Minecraft ». Pour tout le monde, pas pour Finjaro seul.

## Règles de lecture

- **Inspiration seulement.** Rien de Rockstar n'est repris : ni code, ni modèles, ni textures, ni sons, ni noms (Grove Street, Los Santos, Infernus…). `gta-reversed` est une réécriture du jeu faite par des fans à partir de l'exécutable de Rockstar : son code reste lié à la propriété de Rockstar / Take-Two. On le lit pour comprendre des **idées d'architecture** (streaming, niveaux de détail, scripts de mission, fichiers de données), on n'en copie pas une ligne.
- **Léo est un outil d'entreprise pour tout public.** Ce qui glorifie la violence contre des personnes ou le crime réel n'y entre pas (voir « laissé de côté »). On garde l'esprit : liberté, véhicules, missions, progression, vie de quartier.
- **Aucun chiffre inventé** : une statistique affichée vient d'une vraie donnée (tâches rendues, commandes livrées…).

## 1. Fonctionnalités du joueur

| GTA | Dans Léo | État |
| --- | --- | --- |
| Monde ouvert, marcher, courir, sauter | Ville entière à pied, sans traverser les immeubles | ✅ 25/09 |
| Nager, plonger, apnée | Mer devant les maisons des agents (lieu 🏡) : nager, plonger | à faire |
| Territoires de gangs (3 vagues, revenus, défense) | Transposé sans violence : **quartiers de l'entreprise** qui s'agrandissent quand l'activité réelle grandit (projets finis, commandes livrées) | à faire (avec « la ville de chacun ») |
| Parler aux passants par choix de phrases | Parler aux agents et à la réceptionniste (déjà) ; choix de répliques bien / neutre | en partie |
| Petits boulots : taxi, ambulance, pompier, camionneur, voiturier | **Missions de ville** : taxi (déposer un passant), livraison (colis d'une vraie boutique Finjaro vers un client), pompier | à faire |
| Statistiques RPG (graisse, muscle, endurance, respect, séduction, chance, compétences) | **Réputation** de l'entreprise = tâches rendues, projets finis, commandes livrées (mesurés) ; compétences de conduite / pilotage qui montent en conduisant | à faire |
| Relations amoureuses | — | laissé de côté |
| Mode 2 joueurs | **Plusieurs joueurs** : un ami visite ma ville, on se voit | à faire (gros chantier) |
| Vêtements, coiffure, tatouages | Avatar (choix de corps : déjà) ; garde-robe à venir | en partie |
| Manger, salle de sport | Restaurants, salle de sport de la ville | plus tard |
| Engager des gens pour une mission | **Déjà le cœur de Léo** : confier une tâche à un agent | ✅ |

## 2. Graphismes

| GTA | Dans Léo | État |
| --- | --- | --- |
| Flou de vitesse | Champ de vision qui s'élargit avec la vitesse et la nitro | ✅ 25/09 |
| Reflets sur les véhicules | Carrosseries qui reflètent le vrai ciel | ✅ |
| Ombres en temps réel | À l'ordinateur ; coupées au téléphone | ✅ |
| Distance d'affichage, brouillard qui cache le chargement | Brouillard de distance ; au téléphone, seulement les îlots proches | ✅ |
| Niveaux de détail (image plate au loin) | Voiture légère / détaillée (quand on monte dedans) | en partie |
| Cycle jour / nuit, météo selon l'heure | Ciel réel (heure, météo, température de la ville choisie) | ✅ |

## 3. Véhicules

| GTA | Dans Léo | État |
| --- | --- | --- |
| ~150–210 véhicules | Voitures en volume (modèle libre Car Concept, couleurs par voiture), taxis, SUV, bus, motos | en partie |
| Motos, vélos | Motos de la circulation (dessin simple) | à refaire en volume, à conduire |
| Hélicoptères | Hélicoptère à piloter + héliport | ✅ 25/09 |
| Avions | Avion de tourisme sur une piste | à faire |
| Bateaux | Bateau sur la mer des maisons | à faire |
| Transports en commun (bus, tram, train) sans les voler | Monter dans le bus comme passager | à faire |
| Dégâts de carrosserie | Chocs qui cabossent | à faire |
| Phares, clignotants, capote | Phares à la main (touche L), clignotants | à faire |
| Tuning : peinture, nitro, hydrauliques | Nitro ✅ ; garage pour changer la couleur, les jantes | en partie |

## 4. Missions

| GTA | Dans Léo | État |
| --- | --- | --- |
| ~100 missions scénarisées | Les **vraies tâches** de l'entreprise deviennent des missions dans la ville (marqueur au sol, objectif, récompense = tâche rendue) | à faire |
| Écoles (conduite, moto, bateau, avion, hélicoptère) | Écoles de conduite / pilotage avec médailles | à faire |
| Défis, courses | Course chronométrée autour du pâté de maisons ✅ ; autres circuits, courses d'hélicoptère | en partie |
| Objets à collectionner | Objets cachés liés aux vraies réussites (un trophée par projet fini) | à faire |

## 5. Océan

Nager, plonger, barre d'air, sortir d'une voiture tombée à l'eau, bateaux amarrés, remonter sur la plage : à faire sur la mer des maisons (lieu 🏡), qui existe déjà.

## 6. Activités

Basket, billard, danse, bornes d'arcade : plus tard, en petits jeux simples. Casino et paris : **laissé de côté** (argent réel, public d'entreprises). Courses de rue : ✅ (course). Vélo : à faire.

## 7. Personnalisation

Avatar ✅ (corps) ; garde-robe, coiffures : plus tard.

## 8. Radio

Radio de voiture avec animateurs : textes demandés à Plume le 25/09 (16 annonces), à relire ; musique libre de droits à trouver ; pas de chansons sous licence.

## 9. Carte

Trois villes et campagnes → Léo : **la ville de chaque entreprise** (style de la ville choisie), la campagne et la mer des maisons des agents, la planète 🌍. Radar : mini-carte ✅ 25/09.

## 10. Sauvegarde

La voiture reste où on la laisse (pendant la visite) ✅ ; à garder d'une visite à l'autre : garage de la maison / de l'appartement choisi.

## 11. IA et police

Circulation qui s'arrête derrière la voiture du joueur ✅, piétons qui attendent au passage ✅, feux aux carrefours (tâche difficile confiée à Forge le 25/09). Police et étoiles de recherche : **laissé de côté** dans leur forme GTA ; éventuellement une amende pour excès de vitesse, sans poursuite armée.

## 12. Secrets

Une « grosse étoile » la nuit, des clins d'œil cachés : facile et amusant, plus tard.

## Technique : ce qu'on retient (idées, pas de code)

- **Streaming** : charger la ville par secteurs autour du joueur, décharger ce qui est loin → à faire pour agrandir la ville sans ralentir le téléphone.
- **Niveaux de détail** : modèle détaillé de près, simple de loin, image plate très loin → déjà pour les voitures, à étendre aux immeubles.
- **Missions dans des scripts séparés du moteur** (`main.scm`) : chez nous, les missions viendront des **données** (tâches, projets, boutiques) plutôt que d'être écrites à la main — c'est ce qui rend chaque ville différente.
- **Fichiers de données lisibles** (`handling.cfg` pour la tenue de route, `popcycle.dat` pour qui se promène où) : chez nous, `conduite.js` (réglages de la voiture et de l'hélicoptère) et `region.js` (style de ville) jouent ce rôle.

## Laissé de côté (et pourquoi)

Violence contre des personnes (tuer, torturer, fusillades, armes), drogue, proxénétisme, prostitution, cambriolages, vols de voitures, gangs armés, casino et paris d'argent, relations amoureuses : ce n'est pas ce qu'une entreprise, ses clients et ses employés viennent faire dans Léo, et ce n'est pas l'image de Finjaro.
