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
