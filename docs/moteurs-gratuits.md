# Moteurs d'IA gratuits — ce qu'on sait, vérifié ou non

Tenu par la veille quotidienne (voir `docs/OBJECTIFS.md`, O5). Beau n'a pas de
budget : seuls les moteurs sans carte bancaire et sans recharge comptent.
Règle de ce fichier : une ligne est **vérifiée** seulement si je l'ai essayée
ou lue dans les journaux ; sinon elle est **annoncée** (affirmation d'un
fournisseur ou d'un article, à confirmer avant d'y compter). Créer un compte =
une identité : c'est Beau qui le fait, je prépare les étapes.

## Déjà branchés dans Léo (état lu dans les journaux, 13/10)

| Moteur | État | Remarque |
| --- | --- | --- |
| Cloudflare Workers AI (modèle gratuit) | Marche, mais la « part gratuite du jour » de Finjaro est épuisée tôt ; remise à zéro à 00:00 UTC | Partagée entre les agents de Léo et d'autres usages |
| Groq | Branché pour les consignes courtes | Limites par minute et par jour |
| Mistral | Limite atteinte (quota gratuit) | |
| Z.ai | Parfois « occupé » | |
| Google Gemini | Crédits prépayés épuisés (erreur 402) | Pas de recharge |
| OpenAI, DeepSeek, Kimi | Sans crédit | Pas de recharge |

## Recherche approfondie du 13/10 (demande de Beau) : y a-t-il des IA « illimitées » à brancher ?

**Réponse honnête : non.** Aucun service hébergé n'est vraiment illimité ; tous ont un plafond par minute et par jour. La seule vraie « illimitée » est une IA hébergée soi-même (voir plus bas), au prix d'un petit modèle et d'un débit faible. Le bon moyen d'en avoir beaucoup : **brancher plusieurs offres gratuites et passer de l'une à l'autre** quand une atteint sa limite (c'est déjà le principe du moteur commun de Léo).

Source des chiffres : un comparatif publié par OpenRouter (juin 2026, mis à jour le 24/09, limites vérifiées en avril 2026) et des guides de tiers. **Annoncés, pas essayés** ; les limites changent souvent.

| Offre | Limites annoncées | Carte exigée | Déjà dans Léo ? | Remarque |
| --- | --- | --- | --- | --- |
| **Cerebras** | environ 30 requêtes par minute, environ 1 million de jetons par jour | non | **non** | La plus généreuse en jetons ; une source parle d'une carte pour un crédit d'essai : à vérifier à l'inscription |
| **OpenRouter** (modèles « :free ») | 20 par minute, 50 par jour | non | **non** | Peu par jour, mais donne accès à 20 modèles et sert de roue de secours |
| **GitHub Models** | de 150 à 1 000 par jour selon le modèle | non | **non** | Lié à un compte GitHub (Beau en a déjà un) |
| **NVIDIA NIM** | environ 1 000 par jour | non | **non** | Limites peu publiées |
| Groq | 30 par minute, 1 000 par jour | non | oui | Des sources récentes disent que certains modèles Llama ont quitté l'offre gratuite |
| Google AI Studio (Gemini) | de 5 à 15 par minute, de 20 à 1 500 par jour | non | oui, mais les crédits payants sont épuisés | **Les textes envoyés peuvent servir à l'entraînement hors Europe** : pas pour des données privées |
| Mistral | environ 1 milliard de jetons par mois | non | oui, limite atteinte | L'offre gratuite demande d'accepter l'entraînement sur les données |
| Cloudflare Workers AI | environ 10 000 « neurones » par jour | non | oui, épuisé tôt | Partagé entre tous les usages |
| Cohere | environ 100 par jour | non | non | **Usage non commercial seulement : écarté** |
| Hugging Face, Chutes | variable | non | non | Pas fiables pour la production |
| SambaNova | 5 $ d'essai | oui | non | Pas une offre gratuite durable : écarté |

**Auto-hébergement** (la seule piste réellement sans plafond) : une machine gratuite d'Oracle Cloud (4 cœurs Arm, 24 Go) peut faire tourner un petit modèle (de l'ordre de 8 à 12 jetons par seconde annoncés). Faible débit, capacité souvent indisponible dans certaines régions, conditions à relire : bon pour des tâches simples de fond, pas pour tout.

**Ordre de branchement que je recommande** (Beau crée les comptes, c'est sa seule marche à suivre ; je branche le code après) :
1. **Cerebras** : le plus de jetons par jour.
2. **GitHub Models** : un compte qu'il a déjà.
3. **OpenRouter** : la roue de secours à plusieurs modèles.
Si un jour il faut payer un seul moteur : **DeepSeek** (Beau, 13/10), jamais sans son mot.

## Vidéo, voix : ce qui marche sans crédit

| Piste | Statut | Détail |
| --- | --- | --- |
| **Piper** (voix locale, modèle `fr_FR-siwis-medium`) | **Vérifiée le 13/10** | Tourne dans mon environnement, aucune API : 7 s de parole en moins de 2 minutes ; voix correcte, pas luxueuse |
| Voix « Edge » (edge-tts) | **Ne marche pas ici** | Passe par un WebSocket que le relais réseau ne prend pas en charge |
| Montage vidéo local (page HTML animée + Playwright + ffmpeg) | **Disponible** | Chromium et ffmpeg sont installés ici ; c'est ce que fait HyperFrames |

## Vidéo par API : pistes annoncées (non vérifiées, 13/10)

Sources : articles comparatifs, à relire sur les pages officielles avant tout
usage. Aucune n'a été essayée.

| Piste | Ce qui est annoncé | À vérifier |
| --- | --- | --- |
| Pixazo | API gratuite pour développeurs, texte-vers-vidéo et image-vers-vidéo (modèle LTX), sans carte annoncée | Limites réelles, droits commerciaux, filigrane |
| GenRelay | Crédits d'essai uniques (Veo 3.1 cité) | Ce n'est pas récurrent |
| Kling (site web) | 66 crédits par jour, clips de 5 s, filigrane | Pas une API |
| Krea (site web) | 100 unités de calcul par jour | Pas une API |
| Google Vids | 10 vidéos Veo par mois par compte Google, éditeur web | Pas une API ; utilisable par Beau lui-même |
| Mochi 1 (Genmo, Apache 2.0) | Modèle ouvert, à héberger soi-même | Demande un GPU : pas possible ici |

**Veo 3 de Beau** : l'abonnement Google AI Pro ne donne pas accès à l'API (réponse
d'un employé de Google sur le forum des développeurs) et l'API Veo n'a pas
d'offre gratuite. Je n'ai aucun outil branché sur son application Gemini. Il
peut générer une vidéo lui-même dans Flow ou Vids et me passer le fichier.

## À faire par la veille quotidienne

1. Relire les limites des moteurs déjà branchés (pages officielles).
2. Chercher chaque jour une piste nouvelle : LLM, image, voix, vidéo, avec
   limites chiffrées et conditions d'usage commercial.
3. Essayer ce qui peut l'être sans compte. Écrire ici la date et le résultat.
4. Si une piste est bonne mais demande un compte : une seule demande à Beau
   (trois lignes, étapes comprises), au plus une par semaine.
