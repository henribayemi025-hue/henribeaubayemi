# Journal — ce qui a été fait, jour par jour

Beau, 22/09 : « noter tous les steps dans le GitHub, tout ce qu'on fait
depuis là ». Ce fichier est tenu par Claude (Alpha) à chaque session : une
entrée par jour, les faits vérifiés, ce qui est en ligne et ce qui attend.
Le détail du code est dans les messages de commit ; ici, ce que ça change
pour Finjaro. Aucune donnée personnelle (le dépôt est public).

## 22/09/2026 (soir)

**Ce qui a été découvert**

- Six ajouts au panier depuis le 1er septembre, dans cinq boutiques, par
  des visiteurs **sans compte** — et aucune vendeuse au courant, aucune
  commande. Cause : « Passer commande » exigeait un compte, et rien ne
  prévenait la vendeuse. Les rappels du matin et du soir ne regardaient que
  les personnes connectées : c'est corrigé (les deux rappels montrent les
  visiteurs sans compte).
- Les agents Legion répondaient depuis Gemini **Flash** : tous les modèles
  Pro listés renvoyaient 404 (retirés ou renommés par Google). D'où des
  réponses creuses (« je peux te préparer une proposition »).
- Le premier plan d'Alpha comptait « 1 commande » : c'était une commande
  d'essai sur une boutique de test. Le filtre ne regardait que l'acheteuse.

**Ce qui est en ligne (base, donc pour tout le monde)**

- 0155 — la vendeuse reçoit cloche + push + e-mail quand un de ses
  articles entre dans un panier (« Ton article plaît »). Une par article
  et par heure ; pas quand elle teste elle-même. Les quatre vendeuses
  concernées cette semaine ont été prévenues rétroactivement.
- 0156 — **commander sans compte** : prénom + numéro WhatsApp, la demande
  arrive chez la vendeuse comme une commande « new » ; elle l'accepte et
  écrit sur WhatsApp. Fonction `place_guest_order`, garde-fous (10 demandes
  par navigateur et par jour, 5 par numéro). `orders.buyer_id` est devenu
  facultatif. Vérifié de bout en bout avec une commande d'essai, annulée.
- 0154 — **la journée de travail des agents** : chaque matin (06:30 UTC),
  chaque responsable écrit le plan de la semaine (et du mois), chaque agent
  allumé rend un livrable sur sa tâche ; la tâche passe « à revoir ».
  Premier essai : 4 plans (Direction, Argent, Concurrence, Marketing) et
  3 livrables, puis coupure à 150 s — refait en tranches.
- 0157 — une commande n'est comptée que si l'acheteuse et la boutique sont
  des comptes réels.
- legion-repondre : modèle `gemini-3.1-pro-preview` en tête ; interdit de
  proposer au lieu de livrer ; plans du département relus avant de
  répondre ; réponses point par point jusqu'à 4 000 signes.

**Ce qui attend le oui de Beau (mise en ligne du front sur finjaro.net)**

- La fiche « Pour que la boutique te réponde » (commande sans compte).
- Le lien WhatsApp et l'étiquette « sans compte » dans Commandes.
- La cloche qui mène à l'article (« Ton article plaît »).
- Legion : « Le plan de la semaine », bouton « Au travail maintenant »,
  badges Plan / Livrable / Bloqué, réponses mises en forme.

**Ce qu'on ne peut pas faire**

- Retrouver les cinq personnes qui ont rempli un panier sans compte : ni
  nom, ni numéro, ni compte créé ensuite. Si elles reviennent, la nouvelle
  fiche leur demande leur numéro.
