# Audit à 200 profils — la méthode

Beau, 07/10 : « 200 personnes de 200 orientations différentes, chacune avec
sa personnalité et sa mentalité, testent tout. À chaque écran, le lien de
causalité : si je fais ça, ça entraîne ça, donc il faut telle option.
Extrêmement détaillé. » Puis : « go, tout : Léo, Learn, place de marché et
Accounting. »

## Ce qu'on audite

| Application | Adresse auditée | Qui |
| --- | --- | --- |
| Place de marché | staging-finjaro.finjaro.workers.dev (même code que finjaro.net) | Claude |
| Léo | …/legion | Claude + agents de Léo (Ada, Miroir) |
| Learn | …/learn/ | Claude + Mentor (questions aux profs) |
| Accounting | accounting.finjaro.net | Claudinette |
| Les ponts | même compte, Learn ↔ Léo, Léo ↔ Accounting | Claude |

## Les 200 profils

`profils.md`. Six familles : débutants complets (50), « vu un peu à l'école »
(40), intermédiaires (40), porteurs de projet (30), avancés (25), profils
difficiles (15). Chaque profil a un pays, un métier, une personnalité, un
objectif, un ordre d'applications, un appareil (téléphone ou ordinateur) et
une langue. Graine fixe : la liste se régénère à l'identique.

Ce sont des profils de TEST. Aucun n'est une vraie personne ; aucun n'est
affiché aux utilisateurs ; les comptes créés pour les jouer portent
`profiles.is_test` et sortent de tous les chiffres.

## Les trois passages

1. **Écran par écran, sans compte** (`ecrans.md`). Un navigateur
   automatique ouvre chaque page publique à 390 px (téléphone) et 1 440 px
   (grand écran) et mesure : mots visibles au total et dans le premier
   écran, blocs de plus de 45 mots, textes sous 11 px, champs et boutons
   de moins de 44 px de haut, débordement horizontal, hauteur de page,
   erreurs de console, requêtes en échec, page « introuvable ». Puis l'œil :
   les captures sont regardées une à une.
2. **Parcours connectés, par famille** (`parcours/`). Chaque famille joue
   ses scénarios de bout en bout : arrivée, compte, Learn, Léo, place de
   marché, Accounting, et les ponts entre eux. À chaque étape : ce qu'il
   voit, ce qu'il comprend, ce qu'il clique, et le lien de causalité. Les
   questions aux profs et aux agents sont étalées sur plusieurs jours pour
   ne pas vider la part gratuite des vrais utilisateurs.
3. **Design et clarté** (dans chaque fichier) : trop de texte ? tailles ?
   cohérence crème / terracotta / laiton ? accueil guidé pour le premier pas ?
   écran vide, erreur, lenteur, hors ligne ?

## Les règles

- Aucun chiffre inventé : une mesure ou rien.
- Chaque constat a sa capture et sa gravité : **bloquant** (on ne peut pas
  continuer), **grave** (on continue mais on se perd ou on abandonne),
  **gênant** (ça marche mais c'est laid, long ou flou), **détail**.
- Chaque constat propose une correction simple. Les petites corrections
  sont faites au fil de l'eau ; les grandes vont dans le plan de travaux.
- Les livrables des agents de Léo et de Claudinette sont relus avant
  d'entrer ici.
- Point à Beau chaque soir : fait, trouvé, reste.

## Les fichiers

- `profils.md` — les 200 profils.
- `ecrans.md` — passage 1, constats classés.
- `parcours/<famille>.md` — passage 2, un fichier par famille.
- `TRAVAUX.md` — le plan de travaux classé, mis à jour chaque soir.
