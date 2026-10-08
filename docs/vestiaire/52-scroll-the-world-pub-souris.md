# 52 — « Scroll the World » : les coulisses d'une pub IA de 20 s (souris Logitech)

- **Source** : page publique claude.ai « Scroll the World: Prompts » (https://claude.ai/artifact/QBqvBAznJcroXJ8Ck31vch ; l'adresse envoyée portait un jeton personnel et des traceurs, retirés ici). Auteurs : @rostishka.one et le studio @noxion.studio (Instagram)
- **Type** : déroulé de production d'une publicité vidéo générée par IA, avec tous les prompts dans l'ordre
- **Accès** : ouvert, lu en entier le 08/10/2026 (fiche produit, personnage en trois passes, prompt du film entier, retouches, titre, leçons)
- **Licence / droits** : aucune licence indiquée (tous droits réservés). C'est une pub « spec », faite pour un portfolio, sans lien avec Logitech. On garde la méthode et les leçons, pas le texte des prompts.
- **Reçu de Beau le** : 08/10/2026

## Ce que c'est
Une pub de 20 s en 16:9. Une graphiste s'ennuie et fait tourner la molette de sa souris. Le monde se met à défiler avec son doigt : sa tasse s'élève, puis la pièce, les murs, et enfin la rue de New York avec ses taxis. Quand elle pose le doigt sur la molette, tout redescend. Outils : GPT Image 2 et Higgsfield Soul pour les images, Seedance 2.5 sur Higgsfield pour la vidéo, After Effects pour le titre. Tous payants.

## Ce qui est vraiment utile pour Finjaro et Léo
La méthode, en six étapes, s'applique telle quelle à nos pubs (ascenseur Finjaro, Léo) :
1. **Fiche produit d'abord.** Avant toute vidéo, une planche de référence du VRAI produit, faite à partir de 3 ou 4 vraies photos : vues de dessus, de face, de côté, gros plans, palette. Ainsi le modèle n'invente jamais un autre produit. Pour nous : le sac terracotta Finjaro, et un téléphone qui affiche un vrai écran de Finjaro ou de Léo.
2. **Personnage en trois passes.** On trouve un visage (4 à 8 essais, on garde le plus naturel, pas le plus lisse), on corrige la peau (pores, duvet, pas d'effet plastique), puis on fige le tout dans une planche : face, profil, dos, gros plans, palette.
3. **Un seul prompt pour tout le film**, plan par plan avec leurs secondes, et seulement deux références (le personnage, le produit). Les décors sont décrits avec des mots : d'après l'auteur, c'est plus réaliste que des décors générés.
4. **Réparer seulement ce qui est cassé.** Un plan raté repasse dans le modèle avec la vidéo en référence, et on ne change que ce qui ne va pas.
5. **Titre : quatre mises en page dans une seule image**, utilisée comme simple modèle, puis refaite à la main dans un logiciel de montage. Le produit passe devant le mot, et le texte reçoit le même grain que l'image.
6. **Montage, agrandissement, son.**

Les leçons de l'auteur :
- **Décrire le geste exact** (« seul l'index bouge, la molette tourne avec le bout du doigt ») plutôt que l'action (« elle fait défiler »).
- **Nommer chaque objet dans chaque plan.** Une règle écrite en haut du prompt est souvent oubliée.
- **Décrire d'abord la scène au repos, puis ce qui change.** Sinon, on obtient une physique fantôme : la terre s'envolait avant que le pot ne bouge.
- **Refaire un plan difficile à part**, en 2 ou 3 essais courts, sans relancer tout le film.
- **L'étalonnage par les mots** (« pellicule 35 mm, négatif scanné, pas de HDR, hautes lumières douces ») marche mieux qu'un nom de caméra.
- **Essayer en 480p**, environ cinq fois moins cher. Ne demander que les bruitages, et mettre la musique au montage.
- **Ne jamais écrire « disparaît »** quand on veut dire « s'envole ».

## Pour quels agents de Léo
- **Forge** (IA) : l'ordre fiche produit → personnage → film entier → réparations, et les leçons sur les prompts vidéo.
- **Plume** (contenu et réseaux) : ses briefs vidéo (mission « Semaine de publications ») gagnent à suivre les mêmes règles. Geste exact, objets nommés dans chaque plan, scène au repos avant le changement.
- **Claude** : c'est moi qui produis les vidéos que proposent les agents de Finjaro (contrôle de 2 h, point 7). Je m'en sers directement.

## Compétences à tirer (pour Mentor)
**Écrire un brief vidéo qu'un modèle suit** — Plume, Forge — Avant d'écrire les plans, liste ce qui doit rester identique d'un plan à l'autre : la personne (visage, coiffure, vêtements) et le produit (forme, couleur, logo). Pour chaque plan, donne ses secondes, l'objectif (grand angle ou gros plan), la position de la caméra, le décor au repos, puis le seul changement du plan. Nomme chaque objet visible dans chaque plan, même s'il était déjà cité. Décris le geste, pas l'intention. Pas de « disparaît » : dis où l'objet va. Indique le grain et la lumière avec des mots simples. Pas de musique dans le brief : seulement les bruits. Piège : un plan trop chargé se casse. Coupe-le en deux.

## Limites, risques, prudence
- Tous les outils cités sont payants. Rien ne s'achète sans le mot de Beau, et pas de recharge de crédits.
- Pas de visage réel sans accord. Pas de produit d'une autre marque dans nos pubs.
- Une « spec ad » utilise la marque d'un autre sans son accord. Nous ne ferons jamais ça avec une vraie marque.
- Le prompt complet fait près de 10 000 caractères. Nos modèles gratuits ne suivraient pas une consigne aussi longue : on garde la structure, pas la longueur.

## Verdict
**Retenu** pour la production vidéo (Claude, Forge) et pour les briefs vidéo de Plume. La compétence ci-dessus est à proposer à Mentor.
