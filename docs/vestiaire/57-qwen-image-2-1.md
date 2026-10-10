# 57 — Qwen-Image 2.1 (générateur et retoucheur d'images d'Alibaba, poids ouverts)

- **Source** : https://github.com/QwenLM/Qwen-Image-2.1 (lien donné en commentaire d'une vidéo Instagram du compte « ialan_automatise » : « sans filtre, tu peux générer… »)
- **Type** : dépôt GitHub d'un modèle d'images (poids sur Hugging Face et ModelScope), plus une version hébergée payante chez Alibaba Cloud (Model Studio, offres « Pro » et « Turbo »)
- **Accès** : ouvert. Lus le 10/10/2026 : la page du dépôt (README) et le fichier LICENSE. Le modèle n'a pas été lancé ici.
- **Licence / droits** : **Qwen Research License Agreement**. Usage **non commercial seulement** : la section 2(a) n'accorde les droits que « FOR NON-COMMERCIAL PURPOSES ONLY », définis comme « for research or evaluation purposes only » ; la section 2(b) interdit tout usage commercial « without obtaining a separate commercial license ». Rien ne précise à qui appartiennent les images produites. Le titulaire ne garantit pas la sûreté des images produites (6(b)), et l'utilisateur répond seul des réclamations de tiers (6(d)).
- **Reçu de Beau le** : 10/10/2026 (capture d'écran, sans message)

## Ce que c'est
Le modèle d'images le plus récent de l'équipe Qwen (Alibaba), sorti le 20/09/2026 ; une version « Turbo » (8 étapes, plus rapide) et les offres hébergées sont arrivées le 09/10. Un seul modèle fait deux choses :
- **créer** une image à partir d'un texte, en 2K (2048 × 2048 par défaut) ;
- **retoucher** une image : jusqu'à 10 images de référence, une zone entourée ou peinte, le visage d'une personne ou l'aspect d'un produit gardés d'une image à l'autre, un fond transparent, et le sujet détouré d'une photo.

Il écrit mieux le texte dans les images qu'avant (affiches). Les exemples du dépôt sont tous en anglais ; la page ne dit pas quelles langues il comprend. Il tourne sur une carte graphique (Diffusers, ComfyUI, etc.), avec un mode pour les cartes à peu de mémoire ; la page ne donne pas la mémoire nécessaire. 1,8 k étoiles au 10/10.

## Ce que dit la vidéo, et ce qu'il faut en penser
« Sans filtre » veut dire : installé sur sa propre machine, il n'y a pas le filtre de contenu des services en ligne. Pour Finjaro, ce n'est pas un avantage, c'est un risque (images trompeuses ou choquantes sous notre nom). La vidéo cherche surtout des commentaires (« Dans tes DM »), une méthode d'audience classique.

## Ce qui est vraiment utile pour Finjaro et Léo
- **Détourer la photo d'une vendeuse** (fond transparent ou fond propre) pour une fiche article plus nette, sans changer l'article. C'est l'usage le plus utile, et il respecte la règle « les visuels viennent des vendeuses » : on nettoie leur photo, on n'en invente pas.
- **Affiches et visuels de campagne** pour les réseaux de Finjaro (texte lisible dans l'image), à condition qu'aucune image ne fasse passer un article inventé pour un vrai.
- **Agents de Léo** : un futur outil « image » pour l'agent marketing (Plume) d'une entreprise, qui proposerait un visuel que la personne valide.

## Ce qui l'empêche aujourd'hui
- **La licence** : les poids ouverts sont réservés à la recherche et à l'essai. Finjaro et Léo sont commerciaux : il faudrait une licence commerciale d'Alibaba, ou passer par l'offre hébergée (payante, prix non affiché sur la page lue). Toute dépense est la décision de Beau.
- **Une carte graphique** pour la version ouverte : Finjaro n'en a pas (Cloudflare Workers, Supabase). Il faudrait louer un serveur, donc dépenser.
- **Règle de vérité** : jamais une photo d'article fabriquée. Une image générée ne peut pas montrer un article à vendre.
- Ce qu'on a déjà : le détourage existe dans des outils branchés à cette session (Canva). Il faut d'abord voir si ça suffit avant d'ajouter un fournisseur.

## Pour quels agents de Léo
- **Plume** (marketing) : visuels de campagne, toujours validés par une personne.
- **Forge** (technique) : si Beau le décide, brancher un outil « détourer la photo » dans l'espace vendeuse, avec le fournisseur le moins cher qui permet l'usage commercial.
- **Vigie** (veille) : suivre si Alibaba change la licence ou publie ses prix.

## Compétence à tirer (pour Mentor)
**Lire la licence avant l'outil** — tous les agents qui proposent un outil ou une ressource
Avant de proposer un modèle, un code ou une image trouvés en ligne : ouvrir le fichier LICENSE, chercher « commercial », et écrire en une ligne ce qui est permis (« usage commercial : oui / non / licence à part »). « Open source » ou « gratuit » dans une vidéo ne veut pas dire « utilisable pour vendre ». Piège : confondre poids téléchargeables et droit de s'en servir dans un produit payant.

## Verdict
**À garder en réserve.** Bon modèle, mais réservé à la recherche tant qu'on n'a pas de licence commerciale ; la version hébergée est payante. Idée à proposer à Beau quand l'espace vendeuse sera prêt : un bouton « nettoyer la photo » (fond propre, article inchangé), avec le fournisseur le moins cher qui permet l'usage commercial. Rien installé, rien dépensé.
