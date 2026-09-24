# « Retirer le fond » sur les photos d'articles — choix de la brique et décision

- **Demandé par** : Beau, le 24/09/2026
- **Idée d'origine** : `docs/vestiaire/18-compositor-photoshop-libre.md` (fond uni crème pour les photos d'articles)
- **Besoin** : sur la fiche article, un geste sur téléphone qui pose l'objet sur un fond propre (crème ou blanc). Dans le navigateur, sans serveur à nous, sans clé payante, avec une licence qui permet un usage commercial partout dans le monde.

## Décision

**U²-Net « u2netp » (Apache-2.0), exécuté par ONNX Runtime Web (MIT), dans un Web Worker, tout servi par finjaro.net.**

- Le seul modèle vérifié qui soit à la fois **généraliste** (objets, pas seulement des personnes), **sous licence commerciale propre** ET **assez léger pour un téléphone sur un réseau lent** (4,6 Mo).
- Les modèles de meilleure qualité sous licence libre (BiRefNet, BEN2) pèsent de 115 à 490 Mo : inutilisables sur un forfait mobile, et trop gourmands en mémoire pour un Android d'entrée de gamme.
- Les modèles de meilleure qualité « prêts à l'emploi » (BRIA RMBG, @imgly) sont **non commerciaux** ou **AGPL** : exclus.

Limite connue et assumée : u2netp est un modèle « de base ». Il réussit bien un article posé sur un fond simple ; il peut garder un morceau de fond **à l'intérieur** d'une anse ou d'une boucle, ou rogner un détail fin (bretelle, chaîne). D'où l'aperçu avant/après et le message « Vérifie que l'article est entier avant de garder » : rien n'est remplacé sans l'accord de la vendeuse.

## Comparaison (licences lues à la source le 24/09/2026)

| Brique | Licence vérifiée | Ce qu'elle détoure | Poids à télécharger | Verdict |
| --- | --- | --- | --- | --- |
| **u2netp** (U²-Net, Qin et al.) | **Apache-2.0** — fichier LICENSE du dépôt d'origine `xuebinqin/U-2-Net` ; fiche HF `BritishWerewolf/U-2-Netp` : `license: apache-2.0` | Objet saillant, tout type | **4,6 Mo** (4 574 861 octets) | **Retenu** |
| U²-Net complet | Apache-2.0 (même dépôt) | Objet saillant, meilleur que u2netp | 176 Mo | Trop lourd pour un téléphone |
| BiRefNet (Zheng Peng) | **MIT** — LICENSE de `ZhengPeng7/BiRefNet` ; fiches HF `ZhengPeng7/BiRefNet`, `onnx-community/BiRefNet-ONNX` : `mit` | Tout type, très bonne qualité | 490 Mo (fp16) | Licence propre, poids impossible |
| BiRefNet_lite | **MIT** — fiche HF `onnx-community/BiRefNet_lite-ONNX` | Tout type | 114,5 Mo (fp16) ; 224 Mo (fp32) | Piste « haute qualité » plus tard, en Wi-Fi seulement ; mémoire trop forte pour un Android modeste |
| BEN2 (Prama) | **MIT** — fiches HF `PramaLLC/BEN2`, `onnx-community/BEN2-ONNX` | Tout type | 219 Mo (fp16) | Trop lourd |
| RMBG-1.4 (BRIA) | **Non commercial** — fiche HF : « available as a source-available model for non-commercial use », « Commercial use is subject to a commercial agreement with BRIA » | Tout type | 44 à 176 Mo | **Exclu** (licence) |
| RMBG-2.0 (BRIA) | **CC BY-NC 4.0** — fiche HF : « released under a CC BY-NC 4.0 license for non-commercial use » ; accès restreint par formulaire | Tout type | non mesuré (accès restreint) | **Exclu** (licence) |
| @imgly/background-removal 1.7.0 | **AGPL-3.0** — `LICENSE.md` du paquet npm (« GNU Affero General Public License, Version 3 ») | Tout type | non mesuré (exclu avant) | **Exclu** : l'AGPL obligerait à publier le code de Finjaro |
| ISNet « onnx-community/ISNet-ONNX » | Fiche HF : `agpl-3.0` (reconditionnement ; le dépôt d'origine `xuebinqin/DIS` est Apache-2.0) | Tout type | 44 à 176 Mo | Exclu en l'état : licence ambiguë selon la copie, et lourd |
| MODNet (`Xenova/modnet`) | Apache-2.0 — LICENSE de `ZHKKKe/MODNet` ; fiche HF : `apache-2.0` | **Portraits seulement** | 6,6 à 26 Mo | Ne convient pas : un sac, un flacon, un pagne ne sont pas des portraits |
| MediaPipe Image Segmenter (Google) | Code Apache-2.0 ; modèles selon leurs fiches | Selfie/cheveux/peau : **personnes seulement** ; DeepLab-v3 : quelques classes (personne, chat, chien, plante) | non mesuré (inadapté) | Ne convient pas : pas d'objets du commerce |

Moteur d'exécution :

| Brique | Licence | Poids | Rôle |
| --- | --- | --- | --- |
| **onnxruntime-web 1.30.0** (Microsoft) | **MIT** (LICENSE de `microsoft/onnxruntime` ; npm : `MIT`) | JS 74 ko (25 ko compressé) + WebAssembly 14,2 Mo brut, **~2,8 à 3,7 Mo compressé** (brotli / gzip mesurés) | Exécute le modèle dans le navigateur |
| @huggingface/transformers 4.3.0 | Apache-2.0 | beaucoup plus lourd (embarque le même moteur) | Inutile ici : on appelle le moteur directement |

## Poids et vitesse mesurés

- **Premier usage, une fois par appareil** : ~**7,4 à 8,3 Mo** (modèle 4,6 Mo + moteur WebAssembly compressé 2,8 à 3,7 Mo + 25 ko de code). Les fichiers portent une empreinte dans leur nom et sont servis avec `Cache-Control: immutable` (`public/_headers`) : les fois suivantes, le navigateur les a déjà.
- Cloudflare compresse `application/wasm` (liste officielle des types compressés, developers.cloudflare.com/speed/optimization/content/compression, consultée le 24/09/2026) ; vérifié sur finjaro.net que les fichiers `/assets/*.js` partent bien en brotli.
- **Vitesse** mesurée dans un Chromium sans écran (serveur, un seul fil, pas un téléphone) sur une image de 900×700 : préparation du moteur 0,7 s, détourage 1,8 s. Sur un téléphone moyen, compter quelques secondes ; **à mesurer sur un vrai appareil** avant d'annoncer un chiffre.
- **Paquet principal** : 415,31 ko → 416,60 ko (+1,3 ko, le bouton sur la case photo). Le moteur, le modèle et le worker ne sont téléchargés qu'au premier appui sur « Fond ».

## Où sont servis le modèle et le moteur : finjaro.net, pas un CDN tiers

Choix : **fichiers servis par finjaro.net** (émis par Vite dans `dist/assets/`, noms à empreinte).

Pourquoi :
1. **Même origine** que l'application — y compris dans les applications Android/iOS, qui chargent `https://finjaro.net`. Aucun souci de CORS, aucun domaine de plus à autoriser.
2. **Version figée** : le modèle et le moteur changent seulement quand on redéploie. Un CDN tiers (Hugging Face, jsDelivr) peut être lent, bloqué dans certains pays, ou changer de politique.
3. **Discrétion** : aucun tiers ne voit quelle vendeuse utilise l'outil ni quand.
4. Les limites de Cloudflare sont respectées : 25 Mio maximum par fichier (le plus gros fait 14,2 Mo).

Coût : le dépôt contient un fichier binaire de 4,6 Mo (`src/assets/modeles/u2netp.onnx`).

## Provenance du fichier modèle

- `u2netp.onnx` de la publication v0.0.0 du projet rembg (`github.com/danielgatis/rembg`, MIT), conversion ONNX des poids officiels U²-Net.
- SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`, **identique octet pour octet** à `huggingface.co/BritishWerewolf/U-2-Netp/onnx/model.onnx` (vérifié le 24/09/2026).
- Redistribué sans modification. Mentions et textes complets des licences (Apache-2.0 pour U²-Net, MIT pour ONNX Runtime) : `public/licences/retirer-le-fond.txt`, servi à `https://finjaro.net/licences/retirer-le-fond.txt`.

## Ce qui a été construit

- `src/lib/detourage.worker.js` — le calcul dans un Web Worker (l'écran ne gèle pas).
- `src/lib/detourage.js` — préparation de l'image (1200 px max, comme l'envoi), masque, pose sur le fond.
- `src/components/RetirerFond.jsx` — fenêtre avant/après, choix Crème / Blanc, « Garder » / « Annuler ».
- `src/components/ImageUpload.jsx` — bouton « Fond » sur chaque case photo remplie ; le chemin d'envoi est sorti dans `uploadImageFile()` pour que l'image gardée parte **exactement** comme une photo de la galerie (compression AVIF/WebP/JPEG, vignette `_thumb`, bucket `products`).
- `src/screens/vendor/VendorProductEdit.jsx` — branchement sur la fiche article (ajout et modification).
- Textes fr et en (`vendor.removeBg*`).

Rien ne touche la base, l'authentification ni les fonctions edge.

## Pas encore fait / à surveiller

- **L'import en masse** (`VendorProductsBulk.jsx`) n'a pas le bouton : on commence par la fiche article, comme demandé.
- Les iPhone sous iOS antérieur à 16.4 n'ont pas le WebAssembly SIMD que demande le moteur : le message « Le fond n'a pas pu être retiré sur cet appareil » s'affiche et la photo d'origine reste.
- L'ancienne photo n'est pas effacée du stockage quand la nouvelle la remplace (même comportement qu'un remplacement ordinaire aujourd'hui).
- Si la qualité de u2netp déçoit sur de vrais articles : essayer BiRefNet_lite (MIT, 114 Mo) en option « haute qualité » proposée seulement en Wi-Fi, ou un service payant. Ne pas passer à BRIA ou @imgly sans licence commerciale achetée.

## Sources (consultées le 24/09/2026)

- U²-Net, licence Apache-2.0 : https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE
- Fiche u2netp ONNX : https://huggingface.co/BritishWerewolf/U-2-Netp
- Fichier ONNX d'origine : https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx ; licence rembg : https://github.com/danielgatis/rembg/blob/main/LICENSE.txt
- BiRefNet, licence MIT : https://github.com/ZhengPeng7/BiRefNet/blob/main/LICENSE ; https://huggingface.co/onnx-community/BiRefNet_lite-ONNX ; https://huggingface.co/onnx-community/BiRefNet-ONNX
- BEN2 : https://huggingface.co/PramaLLC/BEN2 ; https://huggingface.co/onnx-community/BEN2-ONNX
- BRIA RMBG-1.4 : https://huggingface.co/briaai/RMBG-1.4 ; licence : https://bria.ai/bria-huggingface-model-license-agreement/
- BRIA RMBG-2.0 : https://huggingface.co/briaai/RMBG-2.0
- @imgly/background-removal 1.7.0 : https://registry.npmjs.org/@imgly/background-removal/latest ; https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/LICENSE.md
- ISNet : https://huggingface.co/onnx-community/ISNet-ONNX ; https://github.com/xuebinqin/DIS
- MODNet : https://github.com/ZHKKKe/MODNet/blob/master/LICENSE ; https://huggingface.co/Xenova/modnet
- MediaPipe Image Segmenter : https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter
- ONNX Runtime, licence MIT : https://github.com/microsoft/onnxruntime/blob/main/LICENSE ; npm : https://registry.npmjs.org/onnxruntime-web/latest
- Compression Cloudflare (liste des types, dont `application/wasm`) : https://developers.cloudflare.com/speed/optimization/content/compression/
