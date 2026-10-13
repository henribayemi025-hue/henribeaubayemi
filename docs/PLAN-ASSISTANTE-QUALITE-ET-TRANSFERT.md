# L'assistante « Finou Chou » : limites, mention fiscale, transfert vers une personne, mesure de qualité

Réunion du 10/10 (Beau et son collaborateur). Ce plan répond à quatre actions décidées :
« définir les sujets refusés », « mention : pas un conseil fiscal », « planifier le transfert
vers une personne », « suivre la performance de l'assistante ». C'est un **premier jet à relire par
Beau** (et, pour la partie fiscale, par un expert-comptable). Aucun chiffre ici n'est une promesse.

## 1. Ce qui existe déjà (vérifié le 12/10)

- L'assistante ne lit que ce que la personne connectée a le droit de voir (règles d'accès de la base,
  jamais d'accès administrateur).
- Un quota contre les abus et un budget mensuel plafonné.
- Sous chaque vraie réponse, deux pouces « utile / pas utile » ; une correction (« non, ce n'est pas ça »)
  est apprise et revue par l'équipe.
- Les Conditions (version 1.1 du 12/10) disent qu'aucune suggestion d'un assistant n'est un conseil
  juridique, fiscal, médical ou financier, et ajoutent un paragraphe sur la comptabilité et les impôts.
- Une adresse de contact et une fonction de contact (`leo-contact`) qui prévient Beau par e-mail.

## 2. Sujets que l'assistante refuse (proposition à valider)

| Sujet | Ce qu'elle fait à la place |
| --- | --- |
| Conseil fiscal personnalisé : déclaration, optimisation, interprétation d'une loi | Explique le principe général, dit que ce n'est pas un conseil fiscal, renvoie vers un expert-comptable |
| Conseil juridique (contrat, litige, société) | Renvoie vers la page « Procédure en cas de litige » et vers un professionnel |
| Conseil médical | Refuse poliment |
| Données d'une autre personne ou d'une autre boutique | Refuse (et ne peut pas les lire) |
| Promettre un prix, une gratuité, une date, un remboursement, une garantie | Ne dit que la règle écrite ; renvoie vers une personne pour le reste |
| Faire un paiement, un virement, un achat à la place de la personne | Refuse |

Formulation du refus : courte, aimable, une seule phrase de renvoi, jamais un sermon.

## 3. La mention « ceci n'est pas un conseil fiscal »

Texte proposé, à afficher sous chaque réponse d'Accounting qui parle d'impôts, de taxes ou de comptabilité
(c'est Claudinette qui l'ajoute dans Accounting) :

- FR : « Ces informations aident à comprendre et à calculer ; ce n'est pas un conseil fiscal.
  Faites-les relire et confirmer par un expert-comptable avant toute décision ou déclaration. »
- EN : « This information helps you understand and calculate; it is not tax advice. Have it reviewed
  and confirmed by a certified accountant before any decision or filing. »

Déjà fait côté place de marché : article 11 des Conditions (version 1.1).

## 4. Le transfert vers une personne

**Quand** (déclencheurs proposés) : question fiscale, juridique ou médicale ; demande de remboursement ou de
litige ; réclamation ; deux réponses « ce n'est pas ça » de suite ; demande explicite d'une personne.

**Comment** (sur ce qui existe) :
1. L'assistante dit qu'elle passe la main et demande l'accord de la personne.
2. Elle transmet un résumé court (le sujet, l'écran, la langue) et **pas** l'historique complet.
3. Le message arrive par le canal de contact existant (e-mail à l'équipe) avec un identifiant de billet.
4. La personne reçoit un accusé de réception qui dit en clair que ce n'est plus une IA qui répond.
5. L'échange est compté dans la table de qualité (résultat « transféré »).

**À décider par Beau** (rien n'est inventé ici) : qui répond, à quelles heures, dans quel délai promis,
et si ce canal reste un e-mail ou devient un salon dans Léo.

## 5. Mesurer la qualité

Table `assistant_qualite` (proposition SQL dans `docs/en-attente/assistant-qualite.sql`, essayée sur le
projet de test, **non appliquée en production**) : un échange = une ligne (résultat, avis, sujet grossier,
moteur), **jamais le texte de la question ni de la réponse**.

Indicateurs du rapport hebdomadaire : part des échanges résolus sans personne ; part transférée ; part
d'avis positifs ; moteur qui a répondu (pour repérer une baisse quand un moteur gratuit remplace un autre).

Alerte « baisse de qualité » : quand la part résolue de la semaine tombe nettement sous la moyenne des
quatre semaines d'avant. « Nettement » = un seuil à fixer par Beau.

## 6. Ce qui attend Beau

1. Valider (ou corriger) la liste des sujets refusés.
2. Dire qui répond aux transferts, quand, et avec quel délai.
3. Dire oui à l'application de la table de qualité sur la base commune (Claudinette prévenue).
4. Faire relire la partie fiscale par un expert-comptable.
