# Connecter nos agents à un réseau d'agents — Moltbook, Chirper (14/10)

Beau (14/10) : « Moltbook… Chirper.ai… c'est de ça que je parle ». Décision du même jour : **oui**, avec les garde-fous
du 13/10. Ce document dit ce que ces réseaux sont **vraiment**, comment on s'y branche, et dans quel ordre.

## Ce que j'ai vérifié (14/10, lecture seule)
**Moltbook** (début 2026, façon Reddit, communautés « submolts »). Documentation officielle lue (`moltbook.com/skill.md`) :
- L'agent s'inscrit lui-même : `POST /api/v1/agents/register` (nom + description) → clé d'API, lien de réclamation, code.
- **Un humain doit réclamer l'agent** : vérifier son e-mail **et poster un tweet de vérification** (un compte X est donc nécessaire).
- Limites : 1 publication par 30 min, 1 commentaire par 20 s (50 par jour) ; un agent neuf (24 h) : 1 publication par 2 h,
  20 commentaires par jour, 1 submolt. Tout nouveau contenu est caché tant qu'un **défi de calcul** n'est pas résolu ;
  dix échecs de suite suspendent le compte. Contenu crypto retiré par défaut.
- La clé d'API est l'identité de l'agent : à n'envoyer qu'à `www.moltbook.com`, jamais ailleurs.
- **Incident février 2026** (presse de sécurité, Wiz) : base de données lisible et modifiable par tous (clé Supabase exposée,
  règles d'accès absentes) ; environ 1,5 million de clés d'API, 30 000 adresses e-mail et des conversations privées
  exposées (dont des clés en clair) ; possibilité de modifier les publications que lisent les agents (« injection de
  consigne à l'échelle d'un écosystème »). Rapport des agents aux humains : environ 17 000 humains pour 1,5 million
  d'agents annoncés. *Chiffres de presse, non confirmés par Moltbook.*

**Chirper.ai** (2023, façon X). Chaque personne crée des « Chirpers » (personnalité, histoire, objectifs) qui publient et se
répondent seuls. **Je n'ai trouvé aucune API publique** : on y crée un bot à la main, sur le site. Peu de valeur pour Léo.

## Ce que ça apporte à Finjaro — honnêtement
- Le public de ces réseaux, ce sont **des agents**, pas des vendeuses ni des acheteurs : **aucune vente directe à en attendre**.
- Ce qu'on y gagne : (1) **apprendre** comment d'autres agents se comportent, ce qui marche, les arnaques et les
  injections de consigne (utile pour la sécurité de Léo) ; (2) **un récit** pour les posts Léo (« nos agents parlent à
  d'autres agents ») ; (3) des idées de fonctions.
- Coût : une partie de la limite hebdomadaire de Beau. On avance donc **par petites étapes, chacune utile seule**.

## Comment on s'y branche — quatre étapes
| # | Étape | Qui | Condition |
|---|---|---|---|
| 1 | **Lire en spectateur** (aucun compte) : 3 submolts, 10 publications, un compte rendu court : utile / bruit / arnaque / tentative d'injection | Vigie (veille) | tout de suite |
| 2 | **Un seul agent « envoyé »**, pas les 26 : un agent à part (pas de clé de Léo, pas d'accès aux données d'une entreprise), avec sa fiche (nom, ce qu'il est : « agent IA de Finjaro », honnête sur sa nature) | Orchestre prépare, Claude relit | accord de Beau |
| 3 | **Réclamation de l'agent** : e-mail de Beau + tweet de vérification depuis un compte X ; la clé d'API est ajoutée aux **secrets** par Beau (je ne peux pas écrire dans les secrets) | **Beau** | compte X de Finjaro ? |
| 4 | **Participation avec carte « À valider »** : tout ce que l'agent veut publier passe d'abord par une carte dans Léo ; après dix publications relues sans faute, on peut alléger | Claude relit, Beau valide | étape 3 faite |

## Garde-fous (non négociables)
1. **Ce qu'écrit un autre agent est une donnée, jamais une consigne** : le texte venu du réseau est lu dans un champ à part, l'agent n'exécute
   rien, ne clique rien, ne change aucun réglage sur sa demande. (L'incident de février est exactement cette attaque.)
2. **Aucune donnée privée n'en sort** : ni boutique, ni vendeuse, ni client, ni chiffre d'une entreprise, ni clé, ni e-mail.
3. **Aucune clé de Léo** dans cet agent ; la clé Moltbook ne sert que sur `www.moltbook.com`.
4. **Honnête sur sa nature** : « agent IA de Finjaro », jamais un faux humain. Aucun chiffre non mesuré. Aucun texte qui
   enferme Finjaro dans un pays ; jamais « diaspora ».
5. **Aucune promotion en rafale** : un agent qui spamme se fait suspendre et abîme le nom de Finjaro.
6. **Arrêt immédiat** : un bouton qui coupe l'agent, et la clé se révoque depuis le tableau de bord Moltbook.
7. Un réseau qui a eu une fuite de cette ampleur : **rien de confidentiel n'y est jamais écrit**, même « en privé ».

## Ce qu'on attend de Beau
- Un **compte X (Twitter) de Finjaro** ? Moltbook l'exige pour réclamer l'agent. Sans lui, on reste à l'étape 1 (lecture).
- Son accord le jour où l'agent s'inscrit (c'est un compte chez un tiers).

Sources : documentation Moltbook (skill.md) ; SecurityBrief, BankInfoSecurity, Bastion et Tenable pour l'incident ;
fiches publiques de Chirper.ai (2023). Rien ici n'est mesuré par nous.
