# Correctifs prêts, en attente du mot de Beau

Ils touchent une fonction edge : pousser le fichier sur `staging` la
déploie aussitôt (CI `edge-functions.yml`), et les fonctions edge sont
communes à la préproduction et à la production. Donc rien ne part sans
l'accord de Beau.

| Fichier | Audit | Ce que ça change | Vérifié |
| --- | --- | --- | --- |
| `agents-rotation-legion-travail.patch` | Demande de Beau du 02/10 (« les agents Léo doivent finir leurs 150+ tâches ») | `legion-travail` : (1) l'agent servi il y a le plus longtemps passe en premier — depuis le 26/09, seuls les 6 premiers agents de Finjaro étaient pris, les 17 autres jamais ; (2) une tâche jamais rendue passe avant une tâche déjà rendue « bloquée » ou ratée 3 fois (Alpha refaisait la même 8 fois) ; (3) les tâches en revue ne mangent plus la limite de 300 ; (4) 2 agents à la fois au lieu de 3 (arrêts 546). Nouveau module pur `_shared/rotation.ts`. | 11 tests ajoutés (`rotation.test.ts`) + 9 existants (`reveil.test.ts`) : 20/20 ; compilation esbuild sans erreur. |
| `M-21-send-push-reessais.patch` | M-21 | `send-push` : un lot d'e-mails refusé par Resend (429 ou 5xx) est réessayé jusqu'à 3 fois, après le délai demandé (`retry-after`) ou 1 s, 2 s, 4 s ; la réponse compte les échecs (`email_echecs`). | Vérification des types : aucune erreur ajoutée (la seule restante, sur les clés VAPID, existait avant). |

Appliquer : `git apply docs/correctifs-en-attente/M-21-send-push-reessais.patch`, puis pousser sur `staging`.
