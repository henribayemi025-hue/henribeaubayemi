# 32 — MoneyPrinterTurbo : une vidéo courte à partir d'un sujet

- **Source** : https://github.com/harry0703/MoneyPrinterTurbo
- **Type** : dépôt GitHub
- **Accès** : page d'accueil (README) lue, rien installé.
- **Licence / droits** : **MIT** (d'après la page du dépôt).
- **Reçu de Beau le** : 25/09/2026 (00 h 54)

## Ce que c'est
On donne un sujet ; l'outil écrit le script, trouve ou génère les images, fait la voix, les sous-titres, la musique, et monte une vidéo au format 9:16, 16:9 ou 1:1. Il marche avec beaucoup de modèles (Kimi, DeepSeek, Gemini, OpenAI, Claude…) et de voix, dont Edge TTS (gratuit) et **Fish Audio**. Il existe en Docker, avec une API REST et une interface web. C'est un projet très suivi (environ 125 000 étoiles).

## Ce qui est vraiment utile pour Finjaro et Léo
- **Une machine à vidéos libre, réutilisable** : ses API peuvent tourner dans un conteneur, et un agent de Léo pourrait l'appeler (« fais une vidéo de 30 s sur ce sujet »), avec le Confirmer avant publication.
- **Les voix** : il prend déjà en charge Fish Audio, c'est l'essai que Beau a demandé.
- **Attention aux images** : par défaut, il va chercher des vidéos sur Pexels ou Pixabay. Pour les vidéos d'ambiance, c'est permis (licences libres). Pour montrer un article, c'est **interdit chez nous** : les visuels d'article viennent des vendeuses ou de Beau (CLAUDE.md §3).

## Pour quels agents de Léo
- **Forge** : l'essayer contre HyperFrames pour une vidéo Finjaro de 30 s (coût, qualité, temps).
- **Plume** : les scripts courts.

## Compétences à tirer (pour Mentor)
**Choisir les images d'une vidéo sans tricher** — Forge, Plume
Pour une ambiance (ville, marché, mains qui emballent), une banque libre comme Pexels ou Pixabay est permise : note la source de chaque plan. Pour montrer un article, une boutique ou une personne de Finjaro, uniquement les photos de la vendeuse (avec son accord) ou de Beau. Jamais une photo d'article trouvée sur le web. Dans le doute, demande.
*Source : adapté de la chaîne d'images de MoneyPrinterTurbo (MIT) et de CLAUDE.md §3.*

## Limites, risques, prudence
- 4 à 8 Go de mémoire : ça ne tourne pas dans une fonction edge. Il faudrait un conteneur (Cloudflare ou un serveur).
- La publication automatique sur TikTok, Instagram ou YouTube reste chez nous derrière le Confirmer.
- Le nom (« imprimante à argent ») promet un revenu : aucune promesse ne se reprend.

## Verdict
**Retenu pour un essai** (Forge), à comparer avec HyperFrames. Rien installé sans l'accord de Beau.
