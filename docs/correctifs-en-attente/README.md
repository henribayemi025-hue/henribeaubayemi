# Correctifs prêts, en attente du mot de Beau

Ils touchent une fonction edge : pousser le fichier sur `staging` la
déploie aussitôt (CI `edge-functions.yml`), et les fonctions edge sont
communes à la préproduction et à la production. Donc rien ne part sans
l'accord de Beau.

| Fichier | Audit | Ce que ça change | Vérifié |
| --- | --- | --- | --- |
| `M-21-send-push-reessais.patch` | M-21 | `send-push` : un lot d'e-mails refusé par Resend (429 ou 5xx) est réessayé jusqu'à 3 fois, après le délai demandé (`retry-after`) ou 1 s, 2 s, 4 s ; la réponse compte les échecs (`email_echecs`). | Vérification des types : aucune erreur ajoutée (la seule restante, sur les clés VAPID, existait avant). |

Appliquer : `git apply docs/correctifs-en-attente/M-21-send-push-reessais.patch`, puis pousser sur `staging`.
