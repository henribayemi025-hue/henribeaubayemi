# Legion — tri des propositions de Gemini (22/09)

Beau a collé deux textes de Gemini : un « catalogue de 125 capacités » et
« 5 ruptures ». Tout a été lu. Ce fichier dit, pour chaque bloc, ce qui
existe déjà, ce qui se fait vite, ce qui demande son accord, et ce qui n'est
pas réel ou pas pour maintenant.

Un fait d'abord : le catalogue compte **115** points, pas 125 (le dernier
bloc en a 15, pas 25).

Et le fait qui compte le plus : **aujourd'hui les agents Gemini n'ont aucun
outil.** Ils parlent, c'est tout. Chaque capacité du catalogue, c'est un
outil à construire, avec ses droits. D'où l'ordre ci-dessous.

## Le catalogue, bloc par bloc

| Bloc | Déjà là | Vite, gratuit, sans risque | Avec l'accord de Beau | Pas réel / pas maintenant |
| --- | --- | --- | --- | --- |
| 1. Code et GitHub (1-25) | — | Lire le code, expliquer une erreur à partir des journaux | Écrire sur une **branche**, préparer un zip, ouvrir une proposition de changement | Mise en production seule ; fusion automatique des conflits sans relecture |
| 2. Sécurité (26-50) | Journal des actions (les messages et les tâches) | Relire les règles d'accès de la base en lecture seule, alerte d'expiration des certificats | Bloquer un agent ou une application en cas d'anomalie | Tests d'intrusion et « DDoS simulés » sur une base **partagée avec d'autres applications** ; VLAN ; audit PCI-DSS (Finjaro n'encaisse pas de carte) |
| 3. Finance (51-75) | — | Compter les commandes, le panier moyen, le coût des serveurs | Relances de factures (elles partent au nom de quelqu'un) | Bilans « prédictifs », levée de fonds simulée : pas de données pour ça aujourd'hui |
| 4. Marketing (76-100) | — | Lire le tunnel (visites → fiches → contacts → commandes), écrire des textes à relire | Publier sur les réseaux, envoyer des e-mails | Mesurer la « notoriété », NPS : rien ne le mesure encore |
| 5. Commandes et connecteurs (101-115) | Parler en message, `@nommer` un agent, interrupteur par agent et pour tous, voyants allumé/éteint, tableau des tâches | « Combien de personnes ont fait X » ; résumé quotidien ; tâches programmées (« chaque lundi 8 h ») ; recherche dans l'historique | « Alpha, déconnecte Finia » : l'agent prépare, Beau confirme d'un clic | Fusionner deux agents ; traduction « entre agents de nationalités différentes » (gadget) |

## Les 5 ruptures

1. **Multivers / shadow forks** — la partie vraie existe déjà : staging.
   Deux versions testées côte à côte avant la production, oui. « 24 heures
   simulées » avec « chiffres réels », non : une simulation ne produit pas de
   vrais utilisateurs.
2. **Économie des tokens** — oui, c'est utile : un compteur de dépense par
   département, avec un plafond. C'est le point B9 du plan.
3. **Red team** — oui, peu cher : un agent critique relit chaque proposition
   avant qu'elle n'arrive à Beau.
4. **Auto-guérison** — oui pour : repérer l'erreur, écrire la correction sur
   une branche, la tester. Non pour la mise en production seule : les
   applications Android et iOS chargent finjaro.net directement, une erreur
   toucherait tout le monde d'un coup.
5. **Synthèse cognitive** — pas de « fine-tuning à la volée ». La partie
   vraie : une **mémoire des règles**. Quand Beau corrige un agent, la règle
   est notée et relue par tous les agents à chaque réponse. Faisable.

## Ordre proposé

1. Trois outils en lecture seule pour les agents : compter (visites, fiches,
   contacts, commandes), lire l'état des applications, chercher dans
   l'historique.
2. La mémoire des règles, et l'agent critique.
3. Le compteur de dépense par département.
4. Les actions qui changent quelque chose (GitHub sur branche, allumer ou
   éteindre une application) : toujours avec la confirmation de Beau.
