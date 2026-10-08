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
| Groq, offre gratuite | `gq:` | gpt-oss-120b, qwen, gpt-oss-20b | **8 000 jetons par minute** par modèle (6 000 pour qwen), pour toute l'organisation (Accounting compris) ; ~200 000 jetons par jour par modèle |
| Cloudflare Workers AI | `cf:` | gemma-4 | la part du jour (repart à minuit UTC) ; épuisée le 08/10 à 05 h 45 UTC |

**Groq, depuis le 08/10** : une consigne d'agent fait 17 000 à 24 000 jetons,
donc elle ne passait jamais. `legion-travail` donne maintenant au moteur une
**consigne courte** (même tâche, mêmes règles, même format, contexte resserré :
pas de recherche web ni de souvenirs, quatre derniers messages du salon, un
plan, une compétence). Le moteur ne l'utilise que quand la consigne entière
ne tient pas. Quand la minute de Groq est prise par un collègue, l'agent
attend jusqu'à 30 s ; au-delà, il cède sa place pour cette tranche sans que
Groq soit compté « à sec ».

## Prêts, inactifs tant que la clé n'est pas posée

| Fournisseur | Préfixe | Clé (secret Supabase) | Pourquoi |
| --- | --- | --- | --- |
| Mistral, offre « Experiment » | `mi:` | `MISTRAL_API_KEY` | gratuite, sans carte ; grande fenêtre, donc la consigne ENTIÈRE passe ; ~1 milliard de jetons par mois et ~500 000 par minute selon des guides tiers (non publié par Mistral) ; entreprise française |
| Z.ai, modèles « Flash » | `za:` | `ZAI_API_KEY` | GLM-4.7-Flash à 0 $ selon la page de prix relevée par un tiers (25/08) ; une requête à la fois |

Ordre de passage : Gemini gratuit → **Mistral** → Groq → Z.ai → Cloudflare →
(payants, à sec). Réglages possibles : `LEGION_MODELES_MISTRAL`
(par défaut `mistral-medium-latest,mistral-small-latest`) et
`LEGION_MODELES_ZAI` (par défaut `glm-4.7-flash`).

### Mistral : ce que Beau fait (10 minutes, gratuit)

1. Créer un compte sur console.mistral.ai (« Mistral Studio »), plan gratuit
   « Experiment » ; aucune carte demandée (sources ci-dessous).
2. Créer une clé API.
3. **Données** : en offre gratuite, Mistral peut utiliser les échanges pour
   entraîner ses modèles. Pour l'empêcher : Admin → Privacy → désactiver
   « Anonymous improvement data » (aide officielle de Mistral). À faire,
   puisque les agents lisent les données des entreprises qui utilisent Léo.
4. Poser la clé dans Supabase → Edge Functions → Secrets, nom
   `MISTRAL_API_KEY`. Ne jamais la coller dans une conversation.
5. Prévenir Claude : un passage d'agents est lancé et le journal dit si
   Mistral a répondu (et quel modèle).

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
- Z.ai, offre Flash gratuite (relevé tiers du 25/08/2026) — https://blogs.novita.ai/glm-free-api/
- mnfst/awesome-free-llm-apis — https://github.com/mnfst/awesome-free-llm-apis
- nejib1/Free-LLM (données du 08/10/2026) — https://github.com/nejib1/Free-LLM
- OVHcloud, limites d'AI Endpoints (2 requêtes par minute par IP sans clé) — https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-capabilities
- Hetzner, Inference API (expérimental) — https://docs.hetzner.com/general/company-and-policy/experiments/inference/
