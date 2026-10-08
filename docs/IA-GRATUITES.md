# Les IA gratuites des agents — ce qui existe, ce qui est branché (08/10/2026)

Beau, 08/10 : « je ne recharge pas les crédits ; il n'y a pas une autre IA dont
on peut utiliser l'API gratuitement ? » Décision : **aucune recharge** des
moteurs payants (Google AI Studio, DeepSeek, Kimi, OpenAI). Les agents de Léo
et Finia vivent des offres gratuites.

Rien ici n'est inventé : chaque ligne a sa source, et les chiffres des sites
tiers sont donnés comme tels quand le fournisseur ne les publie pas.

## Déjà branchés

| Moteur | Préfixe | Ce que ça donne | Limite qui bloque |
| --- | --- | --- | --- |
| Gemini, offre gratuite | `gg:` | modèles Flash | quota du jour dépassé (429) le 08/10 au matin |
| Groq, offre gratuite | `gq:` | gpt-oss-120b, qwen, gpt-oss-20b | **8 000 jetons par minute** par modèle (6 000 pour qwen), pour toute l'organisation (Accounting compris) ; ~200 000 jetons par jour par modèle, sur une **fenêtre glissante de 24 h** (vu le 08/10 : « Used » baisse minute après minute, pas de remise à zéro à minuit). Répartition convenue avec Claudinette : Accounting d'abord sur gpt-oss-120b, Léo d'abord sur gpt-oss-20b |
| Cloudflare Workers AI | `cf:` | gemma-4 | la part du jour (repart à minuit UTC) ; épuisée le 08/10 à 05 h 45 UTC |

**Groq, depuis le 08/10** : une consigne d'agent fait 17 000 à 24 000 jetons,
donc elle ne passait jamais. `legion-travail` donne maintenant au moteur une
**consigne courte** (même tâche, mêmes règles, même format, contexte resserré :
pas de recherche web ni de souvenirs, quatre derniers messages du salon, un
plan, une compétence). Le moteur ne l'utilise que quand la consigne entière
ne tient pas. Quand la minute de Groq est prise par un collègue, l'agent
attend jusqu'à 30 s ; au-delà, il cède sa place pour cette tranche sans que
Groq soit compté « à sec ».

## Prêts, inactifs tant que la clé n'est pas posée (ou qu'elle n'est pas ouverte)

| Fournisseur | Préfixe | Clé (secret Supabase) | Pourquoi |
| --- | --- | --- | --- |
| Mistral, offre « Gratuit » | `mi:` | `MISTRAL_API_KEY` **posée le 08/10, mais limitée à 0 requête par minute** (voir plus bas) | gratuite, sans carte ; grande fenêtre, donc la consigne ENTIÈRE passe ; ~1 milliard de jetons par mois et ~500 000 par minute selon des guides tiers (non publié par Mistral) ; entreprise française |
| Z.ai, modèles « Flash » | `za:` | `ZAI_API_KEY` | GLM-4.7-Flash à 0 $ selon la page de prix relevée par un tiers (25/08) ; une requête à la fois |

Ordre de passage : Gemini gratuit → Mistral → Groq → Z.ai → Cloudflare →
(payants, à sec). Réglages possibles : `LEGION_MODELES_MISTRAL`
(par défaut `mistral-medium-latest,mistral-small-latest`) et
`LEGION_MODELES_ZAI` (par défaut `glm-4.7-flash`).

### Mistral : où on en est (08/10, 10 h 52)

**Ce que Beau a vu** : la page des offres de Mistral marque « Gratuit » comme
« Plan actuel », avec « Testez les API de modèles dans Studio » et « 10 $/mois
en crédits API ». L'offre gratuite est donc bien active : il n'y a plus de bouton
« Experiment » à chercher. Les pages d'aide de Mistral qui décrivaient l'ancienne
offre « Experiment » renvoient maintenant 404 : Mistral a refondu ses offres
autour de « Mistral Studio » et « Vibe ».

**Ce que la clé répond pourtant** : à 10 h 34, 10 h 48 et 10 h 52, chaque appel
est refusé (429, code 1300) avec `x-ratelimit-limit-req-minute=0`. Le compte a
droit à 0 requête par minute. Un rapport public décrit exactement la même erreur
depuis la refonte « Vibe », sans solution publiée (karthink/gptel, issue 1533).

**Ce qui reste à regarder, sans rien payer** :

1. Dans Studio, ouvrir « Playground » et envoyer « bonjour » avec
   mistral-small. S'il répond, le compte a accès aux modèles et c'est la clé
   ou son espace de travail qui coince. S'il demande un numéro de téléphone,
   le vérifier. S'il refuse, faire une capture.
2. Menu du compte → « Paramètres d'administration » → page des limites
   (« Limits ») : faire une capture des chiffres.
3. **Ne pas** cliquer « Passer au Pro » ni « Pay-as-you-go » : ce sont des offres
   payantes, et Beau ne recharge plus aucun crédit.

Rappel sur les données : en offre gratuite, Mistral peut utiliser les échanges
pour entraîner ses modèles. Le réglage se trouve dans les paramètres
d'administration, rubrique confidentialité.

## Les modèles chinois gratuits (08/10, question de Beau)

| Moteur | Gratuit ? | Où on en est |
| --- | --- | --- |
| **Qwen** (Alibaba), servi par Groq | oui | **déjà branché** (`gq:qwen/…`), mais sa part est petite : 6 000 jetons par minute, trop peu pour la consigne d'un agent, même courte |
| Qwen, servi par Cloudflare | oui, dans la part du jour | déjà branché (`cf:`), part commune à tous les modèles Cloudflare, épuisée tôt le matin |
| **Z.ai (Zhipu)** : GLM-4.7-Flash, GLM-4.5-Flash, GLM-4.6V-Flash | **oui** : « Free » en entrée et en sortie sur la page de prix officielle (docs.z.ai/guides/overview/pricing, lue le 08/10) | **déjà branché** (`za:`), inactif faute de clé. C'est le moteur gratuit le plus simple à ajouter : créer un compte sur z.ai, créer une clé API, la poser dans les secrets Supabase sous `ZAI_API_KEY`. Une requête à la fois selon un relevé tiers |
| Qwen officiel (Alibaba Cloud Model Studio) | essai seulement | environ 1 million de jetons par modèle pendant 90 jours (région Singapour), puis payant. Une carte peut être demandée, ce qui ouvre une dépense possible : décision de Beau |
| DeepSeek, Kimi (Moonshot) | non | payants ; déjà branchés (`ds:`, `km:`), à sec, et on ne recharge pas |
| ModelScope, SiliconFlow | écartés | vérification d'identité chinoise |

## Écartés, et pourquoi

| Fournisseur | Raison |
| --- | --- |
| Cerebras | plus d'offre gratuite permanente depuis juillet 2026 : essai de 5 $ pour 30 jours, carte exigée |
| GitHub Models | fermé le 30/07/2026 (blog officiel de GitHub) |
| NVIDIA NIM (build.nvidia.com) | gratuit pour prototyper seulement ; servir de vrais utilisateurs demande une licence payante (FAQ NVIDIA) |
| OpenRouter, modèles `:free` | 50 requêtes par jour sans achat : un seul passage d'agents les consomme |
| SambaNova | ~20 requêtes par jour et par modèle, 200 000 jetons par jour (guides tiers) : trop peu |
| Cohere | clé d'essai réservée au développement, pas à un usage réel |

## Les listes de GitHub (08/10, demandé par Beau : « j'en ai vu beaucoup sur Insta »)

Trois listes tenues à jour ont été lues : mnfst/awesome-free-llm-apis,
nejib1/Free-LLM (données du 08/10) et les copies de awesome-freellm-apis.
Elles recoupent ce qui est au-dessus ; ce qu'elles ajoutent :

| Fournisseur | Verdict | Pourquoi |
| --- | --- | --- |
| Ollama Cloud | possible, clé à créer | compte par e-mail, sans carte ; gpt-oss:120b avec 131 000 jetons de fenêtre ; limites « par session » non publiées, un seul modèle à la fois. Branchable en quelques minutes si Mistral ne suffit pas |
| OVHcloud AI Endpoints (sans clé) | écarté | essayé le 08/10 : réponse 429 « API rate limit exceeded » dès le premier appel. L'accès sans clé est limité à 2 requêtes par minute **par adresse IP**, et nos serveurs partagent leurs adresses ; avec une clé, c'est payant au jeton |
| Hetzner Inference | écarté | expérimental, « ne pas utiliser en production » (page de Hetzner du 24/07), carte peut-être exigée |
| Kilo Code (passerelle sans clé) | écarté | passe par l'essai gratuit de NVIDIA : « ne pas envoyer de données personnelles ou confidentielles » |
| ModelScope, SiliconFlow | écartés | vérification d'identité chinoise (compte Alibaba Cloud, pièce d'identité) |
| LLM7.io, Pollinations, Api.Airforce | écartés | intermédiaires dont on ne sait pas d'où vient l'accès aux modèles |

**Les « API IA gratuites » d'Instagram** : beaucoup sont des projets comme
gpt4free, qui passent par des sites ou des comptes détournés (ChatGPT, Claude…
utilisés sans l'accord de leurs éditeurs). C'est contraire à leurs conditions,
ça casse sans prévenir, et les données des entreprises de Léo passeraient par
des inconnus. On n'en branche aucune.

## Sources

- Mistral, aide : « Can I opt out of my input or output data being used for training? » — https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training
- Mistral, guide Studio (« API access is enabled by default with no credit card required ») — https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key
- Mistral, annonce Vibe 2.0 (« Free API usage remains available on the Experiment plan ») — https://mistral.ai/news/mistral-vibe-2-0/
- Comparatif d'OpenRouter, mis à jour le 24/09/2026 — https://openrouter.ai/blog/tutorials/free-llm-apis-compared/
- Cerebras, fin de l'offre gratuite — https://github.com/robhunter/agentdeals/issues/1910
- GitHub Models retiré — https://github.blog/changelog/2026-07-30-github-models-is-now-retired/
- NVIDIA NIM, FAQ (usage de production) — https://forums.developer.nvidia.com/t/nvidia-nim-faq/300317
- Z.ai, page de prix officielle (GLM-4.7-Flash, GLM-4.5-Flash, GLM-4.6V-Flash « Free », lue le 08/10) — https://docs.z.ai/guides/overview/pricing
- Z.ai, offre Flash gratuite (relevé tiers du 25/08/2026) — https://blogs.novita.ai/glm-free-api/
- Alibaba Cloud Model Studio, quota gratuit des nouveaux comptes — https://help.aliyun.com/en/model-studio/new-free-quota
- Même erreur Mistral « req-minute 0 », code 1300, sans solution publiée — https://github.com/karthink/gptel/issues/1533
- mnfst/awesome-free-llm-apis — https://github.com/mnfst/awesome-free-llm-apis
- nejib1/Free-LLM (données du 08/10/2026) — https://github.com/nejib1/Free-LLM
- OVHcloud, limites d'AI Endpoints (2 requêtes par minute par IP sans clé) — https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-capabilities
- Hetzner, Inference API (expérimental) — https://docs.hetzner.com/general/company-and-policy/experiments/inference/
