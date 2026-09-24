# 08 — « Comment utiliser MiniMax H3 gratuitement » (Patreon, guide PDF)

- **Source** : https://www.patreon.com/unefilleia/posts/guide-comment-h3-169615075
- **Type** : billet Patreon + guide PDF de 3 pages joint
- **Accès** : ouvert et lu en entier, par un détour. La page web renvoie un 403 (écran « Enable JavaScript and cookies » de Cloudflare). Les données publiques du billet (API Patreon sans connexion) indiquent un billet **gratuit**, visible sans abonnement (niveau requis : 0 €), publié le 15/09/2026. J'ai lu le texte du billet et le PDF joint « guide-minimax-h3-wan2gp.pdf » (3 pages) en entier. Aucune connexion, aucune inscription, rien d'installé.
- **Licence / droits** : aucune licence indiquée (= tous droits réservés).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)

Un tutoriel pour débutants qui explique comment faire tourner MiniMax H3 sur son propre ordinateur, sans ligne de commande, en passant par Pinokio (un installeur d'IA « en un clic ») puis Wan2GP (une interface allégée). Il donne un tableau de matériel (NVIDIA 6 Go de mémoire graphique au minimum, 8-12 Go « confortable », 16 Go et plus « optimal »), les étapes d'installation, et cinq étapes pour générer une première vidéo (mode, description, durée courte pour tester, génération, téléchargement). Le billet précise qu'un Mac ou un PC sans carte NVIDIA ne suffit pas.

## Ce qui est vraiment utile pour Finjaro et Léo

Peu de choses directement : aucun agent de Léo n'installe de logiciel, et l'outil lui-même pose un problème de licence (voir fiche 05). Mais la ressource est un **bon cas d'école** de ce que nos agents doivent savoir repérer, parce qu'elle contredit sur plusieurs points la ressource 05 et la source officielle :

| Ce que dit le guide PDF | Ce que dit la source officielle (licence et fiche MiniMax, lues le 24/09/2026) |
| --- | --- |
| « modèle open source » | Poids ouverts seulement ; préprocesseur et module 2K fermés. La ressource 05 le dit aussi. |
| « gratuit », « aucune limite de génération » | Les poids sont sans redevance **dans le territoire autorisé** ; l'API officielle est payante (0,08 $/s en 768p). |
| Aucune mention de restriction | La licence **exclut l'UE, le Royaume-Uni, la Corée du Sud et les États-Unis**, pour l'usage comme pour l'affichage des résultats. Le guide, en français, ne le dit à aucun moment, alors qu'une grande partie de son public est probablement en France. |
| Aucune mention des obligations | Signaler tout contenu généré publié, interdiction des faux avis et de l'usurpation d'une personne, mention « MiniMax H3 » dans l'interface d'un produit commercial. |
| 6 Go de VRAM minimum | MiniMax ne publie aucun minimum pour ces versions allégées ; chiffre plausible (cohérent avec la ressource 05), non vérifié. |

Ce qui reste juste et utile : commencer par une vidéo courte pour tester, décrire la scène avec l'action, l'ambiance et le mouvement de caméra, prévoir un long téléchargement la première fois.

## Pour quels agents de Léo

- **Plume (contenu et réseaux)** et **Écho (marketing)** — ce sont eux qui seraient tentés par une vidéo générée pour une publication ; ils ont besoin de règles claires sur ce qu'on peut montrer.
- **Miroir (critique des pages)** — doit repérer, sur une page ou une publication, un visuel généré présenté comme réel.
- **Vigie (veille)** — doit savoir confronter deux tutoriels qui se contredisent à la source officielle avant de rapporter quoi que ce soit.
- **Mentor** — la comparaison ci-dessus est un bon exemple d'entraînement pour tous les agents qui lisent le web.

## Compétences à tirer (pour Mentor)

**Publier une vidéo ou une image générée par IA chez Finjaro** — Plume, Écho, Miroir
Quand s'en servir : avant de proposer, créer ou valider tout visuel ou toute vidéo produits par un modèle génératif.
Règles : 1) jamais pour montrer un article à vendre : les visuels d'articles viennent des vendeuses ou de Beau ; 2) jamais de fausse cliente, de faux témoignage, de fausse voix d'une personne réelle, de faux chiffre à l'écran (vendeuses, commandes, téléchargements) ; 3) toujours dire clairement que c'est généré (mention dans la légende ou à l'écran) ; 4) vérifier la licence du modèle, en particulier **où les résultats peuvent être montrés** : Finjaro parle au monde entier ; 5) aucun texte à l'écran qui enferme Finjaro dans un pays, aucune devise par défaut.
Usage acceptable : ambiance, décor abstrait, illustration d'une idée, clairement signalés comme générés.
Pièges : « c'est juste pour les réseaux » ne change rien, les réseaux sont publics ; un résultat très réaliste trompe davantage, il demande donc une mention plus visible.

**Confronter un tutoriel à la source officielle** — Vigie, Forge
Quand s'en servir : dès que deux sources disent des choses différentes sur un outil, ou qu'un tutoriel promet « gratuit, sans limite, open source ».
Comment faire : 1) relever chaque affirmation vérifiable (prix, licence, matériel, territoire, limites) ; 2) chercher la réponse chez l'éditeur (licence, fiche officielle, page de prix) ; 3) rendre un tableau « affirmation / source officielle / verdict : confirmé, faux, incomplet, non vérifiable » ; 4) signaler en premier ce que le tutoriel **omet** : les omissions (restriction de pays, obligations d'usage) coûtent plus cher que les erreurs visibles.
Pièges : deux tutoriels d'accord entre eux ne font pas une preuve, ils se recopient souvent ; la date compte : une licence ou un prix changent, noter le jour de lecture.

## Limites, risques, prudence

- **Licence MiniMax H3** : même problème que la fiche 05, en pire, puisque ce guide ne dit rien des pays exclus ; suivre ce tutoriel depuis la France ou un autre pays exclu revient à utiliser le modèle hors de ce que la licence autorise.
- **Pinokio** installe et exécute des scripts tiers « en un clic » : pratique, mais c'est du code non relu qui tourne sur la machine. Hors de portée de nos agents de toute façon.
- Le billet est un contenu d'appel d'un créateur ; je n'ai pas repris son texte, seulement analysé ses affirmations.
- L'accès passe par l'API publique de Patreon : si le billet devient payant ou est retiré, cette lecture ne pourra pas être refaite.

## Verdict

Retenu comme **cas d'école** et pour deux compétences (publier un visuel généré sans tromper ; confronter un tutoriel à la source officielle) destinées à Plume, Écho, Miroir, Vigie et Forge. Le **tutoriel lui-même est mis de côté** parce qu'il présente comme « open source » et « sans limite » un modèle dont la licence exclut l'UE, le Royaume-Uni, la Corée du Sud et les États-Unis, sans le dire ; il ne doit pas servir de mode d'emploi à qui que ce soit chez Finjaro.
