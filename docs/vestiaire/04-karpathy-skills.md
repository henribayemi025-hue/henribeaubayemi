# 04 — Consignes « Karpathy » contre les travers des IA qui codent

- **Source** : https://github.com/multica-ai/andrej-karpathy-skills
- **Type** : dépôt GitHub
- **Accès** : ouvert. Cloné le 24/09/2026 (dernier commit le 20/04/2026). Les 9 fichiers ont été lus en entier : README, CLAUDE.md, CURSOR.md, EXAMPLES.md, la fiche `skills/karpathy-guidelines/SKILL.md`, la règle Cursor et les deux manifestes du plugin. La version chinoise du README n'a pas été relue en détail, car c'est une traduction.
- **Licence / droits** : **MIT déclarée**, mais le dépôt ne contient **pas de fichier LICENSE**. La mention figure dans le README (« License: MIT »), dans `plugin.json` et dans l'en-tête de la fiche. On traite donc le contenu comme réutilisable avec mention de la source. Comme il n'y a pas de texte de licence à joindre, la prudence veut qu'on réécrive avec nos mots, ce qui est fait ci-dessous.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
C'est un seul fichier de consignes, de moins d'une page, qu'on ajoute à un assistant de code. L'auteur (compte GitHub « forrestchang », dépôt aujourd'hui hébergé sous « multica-ai ») a tiré ces consignes d'un message public d'Andrej Karpathy sur les défauts des IA qui codent : elles supposent sans vérifier, compliquent, touchent à ce qu'on ne leur a pas demandé. Quatre principes y répondent : réfléchir avant de coder, faire simple, changer de façon chirurgicale, travailler vers un objectif vérifiable. `EXAMPLES.md` illustre chaque principe par un « ce que fait l'IA / ce qu'elle devrait faire ».

## Ce qui est vraiment utile pour Finjaro et Léo
- **Le principe « changement chirurgical »** : chaque ligne modifiée doit se rattacher à la demande. On signale le code mort qu'on n'a pas créé, sans le supprimer. C'est l'esprit exact de nos migrations additives et de la règle « ne pas raboter le style de Beau ».
- **Le principe « objectif vérifiable »** : transformer « corrige le bug » en « écris un test qui le reproduit, puis fais-le passer ». Ou encore écrire un plan en étapes, chacune avec son « → vérifier : … ». Cela évite exactement l'erreur que CLAUDE.md §7 reproche : annoncer fait ce qui ne l'est pas.
- **« Montrer ses hypothèses avant d'agir »** : l'exemple de l'export des données utilisateurs, qui dans `EXAMPLES.md` pose d'abord les questions de périmètre et de confidentialité, s'applique tel quel à nos tables partagées avec Accounting et à `auth.users`.
- **La règle s'étend au-delà du code.** « Ne rien livrer de plus que demandé, présenter les interprétations au lieu d'en choisir une en silence » vaut aussi pour un agent de contenu ou de prospection, puisque Beau dicte à la voix et que ses messages arrivent parfois déformés.
- **Les signes que ça marche** : moins de modifications inutiles, moins de réécritures, des questions posées avant et non après l'erreur. Rigo peut s'en servir comme critères de suivi.

## Pour quels agents de Léo
- **Claude** (développeur de Léo) et **Ada Nkemba** (développeuse place de marché) : ce sont les deux agents qui codent vraiment et ont un accès aux fichiers et au terminal. Les quatre principes s'appliquent directement.
- **Alpha** (direction technique) : il peut exiger ces principes dans ses revues et refuser un changement qui touche plus que la demande.
- **Rigo** (qualité) : les « signes que ça marche » donnent une grille simple pour juger une modification.
- **Mentor** : ces principes sont courts et bien formulés, ce qui en fait un bon modèle de fiche compacte.
- **Orchestre** : le plan « étape → vérifier » est un format de découpage des tâches qu'il peut imposer à tous les agents.
- **Plume, Écho, Traque** (version non-code) : « ne pas livrer au-delà de la demande » et « présenter les interprétations quand la demande est ambiguë ».

## Compétences à tirer (pour Mentor)

**Montrer ses hypothèses avant d'agir** — Claude, Ada Nkemba, Alpha (et en version courte, tous les agents)
Avant de commencer une tâche qui n'est pas triviale, écris en 2 à 4 lignes ce que tu supposes : le périmètre, les données concernées, l'endroit où ça s'affiche. Si la demande peut se lire de deux façons, présente les deux et demande laquelle, au lieu d'en choisir une en silence. Si une voie plus simple existe, dis-le. Si quelque chose n'est pas clair, arrête-toi et nomme précisément ce qui bloque. Sur Finjaro, c'est obligatoire dès que la tâche touche l'authentification, une migration, une fonction edge ou une table partagée : ces changements concernent aussi Accounting et doivent être annoncés à Beau avant. Piège : poser dix questions pour une correction de faute de frappe. Pour les tâches évidentes, on agit.
*Source : inspiré de karpathy-guidelines, MIT déclarée, forrestchang / multica-ai.*

**Faire le changement le plus petit qui répond à la demande** — Claude, Ada Nkemba
Ne modifie que ce que la demande exige. N'« améliore » pas le code voisin, les commentaires ou la mise en forme, et ne refactorise pas ce qui marche. Suis le style existant même si tu écrirais autrement. Si tu vois du code mort qui n'est pas le tien, signale-le sans le supprimer. Supprime seulement ce que TON changement a rendu inutile (un import, une variable). Avant de rendre, relis ton diff : chaque ligne changée doit pouvoir se justifier par la demande. Côté base de données, la même idée devient : on ajoute, on ne supprime pas, on ne renomme pas.
*Source : inspiré de karpathy-guidelines, MIT déclarée.*

**Transformer une consigne en critère vérifiable** — Claude, Ada Nkemba, Rigo, Orchestre
Avant de coder, reformule la demande en un résultat qu'on peut constater. « Ajoute une validation » devient « des essais avec des saisies invalides échouent comme prévu ». « Corrige le bug » devient « un test reproduit le bug, puis il passe ». Pour une tâche en plusieurs étapes, écris le plan ainsi : « 1. [étape] → vérifier : [ce que je regarde] ». N'annonce une étape faite qu'après sa vérification. Sur Finjaro, « en ligne » se vérifie à l'adresse réelle (staging ou finjaro.net), pas au vert de la CI. Pour un agent non codeur, c'est la même chose : « écris 3 posts » devient « 3 posts, chacun avec un seul appel à l'action et aucun chiffre non mesuré ».
*Source : inspiré de karpathy-guidelines (Goal-Driven Execution), MIT déclarée.*

**Préférer le plus simple qui marche** — Claude, Ada Nkemba, Forge
Écris le minimum de code qui résout le problème posé : aucune fonction que personne n'a demandée, aucune abstraction pour un usage unique, aucune option « au cas où », aucune gestion d'erreur pour un cas impossible. Si tu as écrit 200 lignes et que 50 suffisent, réécris. Test de sortie : un développeur expérimenté trouverait-il ça trop compliqué ? Si oui, simplifie. Piège : confondre simplicité et négligence. Une vérification de sécurité ou un contrôle des comptes de test (`is_test`) n'est pas du superflu.
*Source : inspiré de karpathy-guidelines, MIT déclarée.*

## Limites, risques, prudence
- **Pas de fichier LICENSE** : la licence MIT est seulement annoncée. On cite l'origine et on n'a rien recopié mot pour mot.
- **Le contenu est mince** : quatre principes et des exemples. C'est sa force (on l'intègre vite), mais il ne remplace pas une vraie méthode de revue.
- **Le lien avec Karpathy est une inspiration, pas une caution.** Le dépôt reformule un message public de Karpathy. Ce n'est pas un texte écrit ou validé par lui, et le nom sert aussi de vitrine. Le README fait d'ailleurs de la publicité pour un autre projet de l'auteur (Multica).
- **Les commandes d'installation** du README (`curl … >> CLAUDE.md`, ajout du plugin) n'ont pas été exécutées, conformément aux consignes. Si on reprend l'idée, on écrit nos propres consignes plutôt que d'ajouter un fichier distant à notre CLAUDE.md.
- Le README dit lui-même que ces consignes privilégient la prudence à la vitesse : pour les tâches triviales, il faut du jugement.
- Aucune instruction piégée trouvée.

## Verdict
**Retenu** pour Claude, Ada Nkemba et Alpha : les quatre principes, réécrits ci-dessus en quatre fiches, recoupent les règles déjà écrites dans CLAUDE.md et les rendent opérationnelles (changement minimal, vérification réelle, hypothèses annoncées). **Retenu aussi**, en version courte, pour tous les agents de Léo avec le principe « ne pas livrer au-delà de la demande ».
