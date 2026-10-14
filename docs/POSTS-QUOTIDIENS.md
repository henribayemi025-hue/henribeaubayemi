# Un post par jour — méthode

Ordre de Beau, 13/10 : « chaque jour tu dois poster UN truc, flyer OU vidéo,
la qualité doit être extraordinaire ; Facebook, Instagram, TikTok ».

## Rythme
- Jeudi et samedi : une **vidéo** (vertical 1080×1920, 15 à 25 s).
- Les autres jours : un **flyer** (image 1080×1350, une seule idée).
- Un post = un message = un seul appel à l'action (« Ouvre ta boutique sur Finjaro »).

## Sujets (priorité Accounting, Beau 13/10)
Sur Facebook, Instagram, TikTok et YouTube, au moins deux posts sur trois parlent de Finjaro Accounting, avec de vrais
écrans d'un compte de test. Le post du 14/10 (afficher son prix) est le dernier
de la place de marché avant le prochain.

## Fabrication
- Vidéo : `docs/videos/outil/` (page HTML + Playwright + ffmpeg, voix ElevenLabs
  ou Piper), vraies photos de vendeuses et vrais écrans seulement.
- Flyer : page HTML rendue en PNG par Playwright (mêmes couleurs : crème,
  terracotta, laiton ; grands titres).

## Contrôle avant de programmer (rien ne part sans ces cinq vérifications)
1. Chaque image est regardée (cadrage, texte lisible à 390 px, aucun visage coupé).
2. Aucune photo prise sur le web ; aucun visuel de démonstration `/demo-products/`.
3. Aucun chiffre non mesuré ; un exemple est écrit « exemple ».
4. Aucun texte qui enferme Finjaro dans un pays ; jamais « diaspora ».
5. Sous-titres présents pour la vidéo (beaucoup la regardent sans le son).

## Publication
- Hébergement du fichier : `public/social/` (adresse publique du site), puis
  Metricool le récupère. Le fichier peut être retiré du dépôt ensuite.
- Programmation par Metricool (offre **gratuite**, aucun upgrade sans le mot de
  Beau) : page Facebook, Instagram (Reel ou image), TikTok et YouTube (Short)
  de Finjaro, à 18 h (Paris) par défaut. Beau peut annuler dans Metricool.
  LinkedIn passe par **Typefully** (offre gratuite, page entreprise de Finjaro,
  quota mesuré le 13/10 : 10 publications par mois). Réservé à **Léo**
  (Beau, 13/10 : « sur LinkedIn, ça doit être les posts reliés à Léo »),
  au plus 2 posts par semaine, après relecture de Beau par e-mail pour les deux
  premiers.
- Limite à vérifier : 20 posts programmés par mois dans l'offre gratuite (source
  non officielle). Si elle bloque, qualité d'abord, rythme réduit.
- Chaque post est noté au carnet (date, format, réseaux) ; les statistiques
  mesurées le lendemain (vues, partages) vont dans le compte rendu du soir.

## Ce que je ne peux pas faire
Regarder une vidéo comme un humain. J'étudie des analyses, des guides et les
statistiques de nos propres posts, et j'ajuste.

## Ce que disent les posts déjà faits (lu le 14/10)

Seul TikTok a pu être lu (Metricool, 26 publications du 03/08 au 13/10, chiffres
rendus tels quels). LinkedIn exige une connexion ; Instagram, Facebook et YouTube ne
renvoient aucun post (anciens non importés ou page non lisible).

| Date | Post (début) | Durée | Vues | J'aime |
| --- | --- | --- | --- | --- |
| 02/09 | « Même quand tu tombes, nous sommes là. » | 25 s | 20 987 | 2 058 |
| 28/09 | « Tu galères à trouver une coiffeuse… » | 38 s | 15 837 | 27 |
| 28/08 | « Finjaro beyond your dreams » | 60 s | 10 410 | 14 |
| 06/08 | « Devenez vendeur… 100 % gratuite » | 43 s | 9 046 | 16 |
| 04/09 | « Il n'y a pas de limites à ce qu'on peut faire. Au-delà des rêves. » | 20 s | 8 433 | 1 896 |
| 13/10 | « Ton business sans Finjaro vs avec Finjaro » | 13 s | 544 | 4 |
| 04/10 | « Mon pouce quand je suis sur Finjaro à 2h du mat » | 10 s | 401 | 10 |
| 02/10 | « Et si vous pouviez tout contrôler ? » (Accounting) | 34 s | 309 | 13 |

**Ce qu'on en tire** (lecture prudente : on ne voit ni les images ni le public) :
- Les deux posts les plus aimés (2 058 et 1 896 J'aime) sont de courtes phrases de marque,
  20 à 25 s, signées « Au-delà des rêves » : on les refait dans cet esprit.
- Une vidéo très vue peut être très peu aimée (15 837 vues, 27 J'aime) : les vues seules
  ne disent pas si le message touche.
- Les posts d'octobre ne dépassent pas 544 vues : la cadence n'a pas suffi, le contenu doit changer.
- À ne plus écrire : « des milliers de clients vous attendent déjà » (08/09, chiffre non
  mesuré), les marques tagguées (Amazon, SHEIN, AliExpress), les hashtags de pays
  (CLAUDE.md §1), le jeu « gagne 1 000 FCFA en invitant 100 personnes » (05/08).
- Profil : la bio TikTok contient un drapeau de pays ; le nom de la page Facebook contient
  une ville. À corriger par Beau (CLAUDE.md §1).

