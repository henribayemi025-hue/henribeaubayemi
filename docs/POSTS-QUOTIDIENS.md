# Un post par jour — méthode

Ordre de Beau, 13/10 : « chaque jour tu dois poster UN truc, flyer OU vidéo,
la qualité doit être extraordinaire ; Facebook, Instagram, TikTok ».

## Rythme
- Jeudi et samedi : une **vidéo** (vertical 1080×1920, 15 à 25 s).
- Les autres jours : un **flyer** (image 1080×1350, une seule idée).
- Un post = un message = un seul appel à l'action (« Ouvre ta boutique sur Finjaro »).

## Sujets (priorité Accounting, Beau 13/10)
Au moins deux posts sur trois parlent de Finjaro Accounting, avec de vrais
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
  LinkedIn n'est pas dans l'offre gratuite : Beau le publie à la main, je
  prépare le texte.
- Limite à vérifier : 20 posts programmés par mois dans l'offre gratuite (source
  non officielle). Si elle bloque, qualité d'abord, rythme réduit.
- Chaque post est noté au carnet (date, format, réseaux) ; les statistiques
  mesurées le lendemain (vues, partages) vont dans le compte rendu du soir.

## Ce que je ne peux pas faire
Regarder une vidéo comme un humain. J'étudie des analyses, des guides et les
statistiques de nos propres posts, et j'ajuste.
