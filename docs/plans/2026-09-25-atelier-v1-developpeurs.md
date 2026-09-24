# L'atelier V1 : « 5 jours de travail en une heure »

_Écrit le 24/09/2026 au soir, à la demande de Beau : « un développeur doit se
sentir super à l'aise ; ce qu'il fait en 5 jours avec VS Code et Claude, avec
nous il doit le faire en une heure avec les agents. Toi seul sais ce que les
devs aiment : c'est à toi de gérer. » Et : « si je veux faire Finjaro Learn,
je vais sur mes agents, ils me le font en 5 minutes, avec tout. » Base :
`docs/plans/2026-09-24-atelier-de-code-et-jarvis.md` (partie 1) et la V0
(`docs/ATELIER-V0.md`)._

## Le scénario à tenir : « Fais-moi Finjaro Learn »

1. Beau écrit une phrase : « une appli pour apprendre à vendre en ligne :
   cours courts, quiz, badges, connexion avec le compte Finjaro ».
2. L'**Architecte** répond en une minute avec un plan de 5 lignes, le choix
   technique expliqué simplement, et une estimation de coût et de temps.
   Beau touche « Valider ».
3. L'atelier part d'un **modèle de projet prêt** (pas d'une page blanche) et
   **plusieurs agents travaillent en même temps** : écrans, données, tests.
4. Au bout de quelques minutes, un **aperçu en direct** s'ouvre : Beau
   clique dans sa vraie application, sur son téléphone (QR code).
5. Il dit ce qui ne va pas, à l'écrit ou à la voix ; les agents corrigent,
   les tests repassent tout seuls.
6. « Mettre en ligne » → **Confirmer** → l'application a son adresse.
   « Envoyer sur GitHub » → **Confirmer** → une branche et une demande de
   fusion, jamais la branche principale directement.

## Ce que les développeurs aiment (et ce qui les fait fuir)

| Ils aiment | Ils fuient |
|---|---|
| Ne pas cliquer « Autoriser » 200 fois : un mode **Accepter les modifications** et un **Auto surveillé** | Un agent qui casse tout sans point de retour |
| Voir **tout** : le terminal, les journaux, les tests, le diff | Une boîte noire qui « a fait des trucs » |
| Garder **leur éditeur** (VS Code, Cursor, Claude Code) et leur dépôt GitHub | Être enfermés dans un outil maison |
| **Rembobiner** n'importe quelle étape | Perdre une heure de travail |
| Des **tests qui tournent seuls** après chaque changement | Découvrir la casse en production |
| Choisir **leur modèle** (Astra, Claude, DeepSeek…) et **leur clé** | Payer des marges cachées |
| Un projet qui respecte **leurs règles** (`AGENTS.md`, `CLAUDE.md`, lint) | Un code qui ne ressemble pas au leur |

## Les étapes, dans l'ordre

| # | Quoi | Pourquoi c'est le levier | Garde-fou |
|---|---|---|---|
| 0 | **Tous les modèles** par les clés de Supabase (en cours le 24/09) puis **premier vrai essai** de la V0 | Rien ne vaut avant qu'un vrai projet tourne | — |
| 1 | **Modèles de projets** : site Vite + React, application Expo, API (Hono ou FastAPI), projet Supabase ; plus « depuis mon dépôt GitHub » | On gagne les 2 premiers jours d'installation | Modèles relus par nous, licences libres |
| 2 | **Aperçu en direct** (le port du bac à sable exposé par une adresse privée et temporaire) + QR code | « Voir » tout de suite, c'est ce qui donne envie | Adresse non indexée, liée à la session |
| 3 | **Modes Accepter les modifications et Auto surveillé** (un second modèle relit chaque commande ; retour en Demander après 3 refus) | Fin de la fatigue des clics | Auto ne vaut que DANS le bac à sable ; réseau et clés jamais élargis |
| 4 | **Tests et journaux visibles, et relancés seuls** ; un test rouge → l'agent corrige avant de rendre la main | La confiance | Arrêt après 3 échecs identiques |
| 5 | **Rembobiner** : un point de retour git après chaque action | Oser | — |
| 6 | **Plusieurs agents en parallèle** (Architecte, Écrans, Données, Tests, Rigo relecteur), une branche chacun, fusionnées à la fin | C'est ce qui fait passer de 5 jours à 1 heure | Plafond de coût par session et par jour |
| 7 | **GitHub** : application GitHub (dépôts choisis, jetons d'une heure), import, branche `leo/…`, demande de fusion après **Confirmer** | Le travail sort proprement | Jamais la branche principale ; Confirmer obligatoire |
| 8 | **Mettre en ligne en un geste** (Cloudflare) après **Confirmer** | « Avec tout » | Confirmer ; adresse de test d'abord |
| 9 | **Brancher son éditeur** : les outils de l'atelier dans le serveur MCP de Léo (VS Code, Cursor, Claude Code s'y connectent) | Le développeur garde ses habitudes | Mêmes droits que dans l'écran |
| 10 | **Sa clé, son modèle** (Anthropic, OpenAI…) et **les règles du projet** (`AGENTS.md`, `CLAUDE.md`) lues d'office | Ils se sentent chez eux | La clé reste hors du bac à sable |
| 11 | **Parler à l'atelier** (Jarvis) : « ajoute un quiz à la leçon 3 » | Le côté magique pour Beau | — |

Les étapes 1 à 5 forment une **V1 courte** : elles suffisent pour faire
« Finjaro Learn » avec un seul agent, en une heure environ. Les étapes 6 à 8
font passer à « 5 minutes avec tout ». 9 à 11 sont pour fidéliser les
développeurs.

## Ce qu'il faudra de Beau

- Rien pour les étapes 0 à 6 (tout se fait dans le Worker et les tables
  `atelier_*`).
- Étape 7 : créer l'**application GitHub** (je donnerai les clics).
- Étape 8 : choisir où vivent les applications mises en ligne (son compte
  Cloudflare, sous `*.finjaro.workers.dev`, ou un domaine à lui).
- Toujours : son accord pour chaque mise en ligne réelle.
