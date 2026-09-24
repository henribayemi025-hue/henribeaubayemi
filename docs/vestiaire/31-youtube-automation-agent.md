# 31 — youtube-automation-agent : une chaîne YouTube tenue par une file d'agents

- **Source** : https://github.com/darkzOGx/youtube-automation-agent
- **Type** : dépôt GitHub
- **Accès** : page d'accueil (README) lue, rien installé.
- **Licence / droits** : **MIT** (d'après la page du dépôt).
- **Reçu de Beau le** : 24/09/2026 (22 h 56)

## Ce que c'est
Une chaîne d'agents qui gère une chaîne YouTube : stratégie, script, miniature, référencement, production, contrôle qualité, publication, analyse. Il utilise plusieurs modèles (OpenAI, Gemini, Kimi, GLM…), des voix (ElevenLabs, OpenAI, Gemini) et des modèles vidéo (Seedance, MiniMax, Kling, Wan). Environ 3 700 étoiles. Le README précise que **rien ne se publie sans l'accord d'un humain**, avec les faits vérifiés et les droits des images confirmés.

## Ce qui est vraiment utile pour Finjaro et Léo
- **La file de 8 étapes, avec un contrôle qualité avant la publication** : c'est exactement la forme de notre « Studio de contenu » dans Léo. On peut comparer nos étapes aux siennes.
- **La règle « une production simulée ne peut pas publier »** : c'est une bonne idée à reprendre chez nous. Un livrable de test ou de brouillon ne doit jamais pouvoir partir.
- **Le quota de l'API YouTube** s'épuise vite : un connecteur YouTube par utilisateur doit compter ses envois.

## Pour quels agents de Léo
- **Forge** : comparer ce pipeline, MoneyPrinterTurbo (fiche 32) et notre HyperFrames pour fabriquer nos vidéos.
- **Plume** : les étapes script → miniature → référencement.
- **Rigo** : l'étape de contrôle qualité avant publication.

## Compétences à tirer (pour Mentor)
**Contrôler une vidéo avant qu'elle parte** — Rigo, Plume
Avant de proposer une vidéo à la publication, vérifie : chaque chiffre a sa source ; chaque image vient de nous, d'une vendeuse qui a donné son accord, ou d'un générateur dont les droits sont clairs (jamais une photo d'article prise sur le web) ; la mention « contenu généré par IA » est là quand la plateforme la demande ; aucun pays n'enferme Finjaro ; le titre ne promet rien de faux. Si un point manque, la vidéo reste en brouillon, et tu dis lequel.
*Source : inspiré de l'étape de contrôle qualité de youtube-automation-agent (MIT), adapté à CLAUDE.md §1 et §3.*

## Limites, risques, prudence
- Publier automatiquement sur YouTube est encadré par les règles de YouTube. Chez nous, publier reste toujours soumis au Confirmer.
- Les noms de modèles cités (« GPT-5.6 »…) viennent du README : non vérifiés.

## Verdict
**Retenu comme modèle d'organisation** pour le Studio de contenu. Rien à installer. Comparaison confiée à Forge le 25/09.
