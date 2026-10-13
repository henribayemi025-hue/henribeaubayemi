# Dossier à remettre à un juriste — Finjaro (état au 12/10/2026)

Préparé par Claude à partir des textes tels qu'ils sont écrits aujourd'hui dans
`src/legal/` (branche staging). **Rien ici n'est un avis juridique** : ce sont
les promesses faites par les textes, les points qui paraissent fragiles, et la
question à poser. Aucun article de loi n'est cité de mémoire : c'est au juriste
de dire quel texte s'applique. Aucune donnée personnelle dans ce fichier (dépôt
public).

Décision à prendre par Beau : consulter un juriste, et lequel. Rien n'est
transmis à personne.

## Les textes concernés

| Texte | Fichier | Version / date écrite dans le texte |
| --- | --- | --- |
| Conditions Générales d'Utilisation et de Vente (20 articles, FR et EN) | `src/legal/terms.js` | version 1.1, 12 octobre 2026 |
| Politique de confidentialité (14 articles) | `src/legal/privacy.js` | 5 octobre 2026 |
| Procédure en cas de litige (provisoire) | `src/legal/dispute.js` | version 0.1, 12 octobre 2026 |
| À propos | `src/legal/about.js` | — |
| Suppression de compte | `src/legal/deletion.js` | — |

Les Conditions disent elles-mêmes (en-tête) : « Document en cours de
finalisation juridique. Il s'applique dès à présent aux utilisateurs de Finjaro
et pourra être précisé après relecture par un conseil juridique. »

## Ce que les textes disent de la situation de Finjaro

- **Il n'y a pas de société** aujourd'hui (dit par Beau ; les textes ne la nomment pas).
- Finjaro est présentée comme **« l'éditeur et exploitant de la Plateforme »** (Conditions, art. 1) et comme responsable du traitement (Confidentialité, art. 1), sans nom, forme, adresse ni numéro d'immatriculation.
- Aucun paiement en ligne n'est actif : les commandes se règlent **à la livraison** entre l'acheteuse et la boutique (Conditions, art. 6.2 ; Confidentialité, art. 7). Aucune commission n'est prélevée aujourd'hui (constat ; l'art. 17 des Conditions se réserve d'en prélever).

## Tableau des points à trancher

Priorité : haute = à régler avant d'aller plus loin dans la promotion, moyenne =
avant le premier paiement en ligne ou la première commission, basse = à surveiller.

| N° | Texte et article | Ce que dit le texte (extrait) | Question au juriste | Priorité |
| --- | --- | --- | --- | --- |
| 1 | Conditions, art. 1 ; Confidentialité, art. 1 | « Finjaro » = « l'éditeur et exploitant de la Plateforme », sans identité légale | Sans société, comment désigner l'éditeur dans les textes et les mentions légales ? Quelles conséquences pour la responsabilité personnelle du fondateur ? Quand et sous quelle forme créer la société ? | Haute |
| 2 | Conditions, art. 20 ; art. 15 | Droit **camerounais**, tribunaux de **Douala**, avec réserve pour le consommateur de l'Union européenne ; l'art. 15 cite la loi camerounaise n° 2010/012 et le RGPD | Ce choix de loi et de juridiction est-il adapté à une place de marché ouverte au monde entier ? Est-il opposable aux consommateurs d'autres pays ? Faut-il une clause neutre, ou des clauses par région ? (Note de produit : l'art. 8 donne en exemple « le Cameroun et l'Europe » ; Beau demande qu'aucun texte visible n'enferme Finjaro dans un pays.) | Haute |
| 3 | Conditions, art. 2 | « NI VENDEUR, NI ACHETEUR, NI MANDATAIRE, NI COURTIER… » ; Finjaro « agit en qualité d'hébergeur » ; pas de contrôle préalable des annonces | Cette qualification d'hébergeur tient-elle pour une place de marché qui propose la commande, des rappels aux boutiques et une page de litige ? Quelles obligations de plateforme s'appliquent selon les pays (identification des vendeurs professionnels, retrait de contenus, information des consommateurs) ? | Haute |
| 4 | Conditions, art. 6.2 et 6.3 | Le paiement à la livraison est « assimilé à un Paiement Hors Plateforme » ; exclusion totale de responsabilité, en majuscules, y compris « escroquerie, fraude, non-livraison, livraison non conforme, défaut de remboursement » | Cette exclusion est-elle valable face à un consommateur ? Faut-il la reformuler (en particulier pour la non-livraison) ? | Haute |
| 5 | Conditions, art. 12 | Responsabilité limitée « aux sommes effectivement encaissées par Finjaro au titre de cette Transaction » (aujourd'hui : zéro) | Une limitation à zéro est-elle admise ? Que se passe-t-il le jour où une commission est prélevée ? | Haute |
| 6 | Conditions, art. 5 et 16 ; Litige, art. 1 à 5 | Annulation, retour et remboursement « relèvent du contrat conclu avec le Vendeur » ; Finjaro « n'est pas partie à la vente » ; page « Procédure en cas de litige » sans délai chiffré ni promesse de remboursement ; phrase affichée sous le récapitulatif de commande : Finjaro « ne garantit pas l'article et ne rembourse pas » | Cette position est-elle compatible avec les droits des consommateurs dans les pays visés ? Quels délais ou engagements minimaux faut-il écrire ? La phrase du récapitulatif de commande suffit-elle comme information préalable ? | Haute |
| 7 | Confidentialité, art. 1, 9, 14 ; Conditions, art. 20 | Seul contact pour les droits des personnes : une **adresse Gmail** générique ; aucun nom, adresse postale ni représentant | Quelle identité, quelle adresse et quel moyen de contact faut-il pour le responsable du traitement ? Faut-il un représentant dans l'Union européenne ou au Royaume-Uni ? Un délégué à la protection des données ? | Haute |
| 8 | Confidentialité, art. 4 et 7 ; Conditions, art. 11 et 15 | Le contenu des échanges avec l'assistante part chez **Google Gemini** (offre gratuite : Google « peut conserver le contenu et s'en servir pour améliorer ses produits, et des personnes chez Google peuvent le relire »), puis en relais chez **DeepSeek (serveurs en Chine)**, Moonshot AI, Anthropic ou OpenAI ; « transferts encadrés par les clauses contractuelles types » | Ces transferts sont-ils licites sans consentement explicite ? Les clauses contractuelles dont parle le texte sont-elles réellement signées avec chaque prestataire (c'est à vérifier côté Finjaro) ? Faut-il retirer un prestataire de la liste, ou demander le consentement avant l'envoi ? | Haute |
| 9 | Confidentialité, art. 4 | « Aider l'assistante à s'améliorer » est **activé par défaut** pour les comptes (désactivable ; ce qui était gardé est alors effacé) ; échanges gardés sous forme anonymisée avec une empreinte hebdomadaire | L'activation par défaut est-elle admissible, en particulier pour les utilisateurs de l'Union européenne et du Royaume-Uni ? L'anonymisation décrite est-elle suffisante ? | Moyenne |
| 10 | Confidentialité, art. 4 et 5 | Lecture automatique d'une **pièce d'identité** par Google Gemini pour vérifier les vendeuses ; la lecture ne passe jamais par le relais | Base légale, durée de conservation, information préalable et sécurité attendues pour des pièces d'identité ? | Haute |
| 11 | Conditions, art. 3 ; Confidentialité, art. 11 | Réservé aux personnes de **18 ans** ou de la majorité légale du pays ; aucune vérification d'âge | Une simple déclaration suffit-elle ? Que faire d'un compte de mineur découvert ? | Moyenne |
| 12 | Conditions, art. 4 et 16 | Le Vendeur « professionnel ou particulier » assure ses obligations légales, fiscales et d'immatriculation ; Finjaro « ne procède à aucune retenue à la source » | Finjaro doit-elle collecter ou contrôler des informations sur les vendeurs professionnels ? Dans quels pays ? | Moyenne |
| 13 | Conditions, art. 17 ; e-mails de prospection du 07/10 | Les Conditions réservent la faculté d'introduire des services payants ; **8 e-mails** envoyés aux boutiques disent « gratuit à vie pour les boutiques inscrites avant fin octobre 2026 » | La promesse des e-mails a-t-elle une valeur contractuelle ? Faut-il la reprendre dans les Conditions ? Qui peut la modifier, et comment ? (La date est aussi en discussion côté Beau.) | Haute |
| 14 | Conditions, art. 11 (3e alinéa, nouveau en 1.1) | « Ce n'est pas un conseil fiscal ou comptable » pour les réponses de l'assistante sur les impôts et la comptabilité | Cette mention suffit-elle pour écarter le risque d'exercice d'une profession réglementée ? Faut-il la répéter sous chaque réponse (Accounting l'affiche déjà) ? | Moyenne |
| 15 | Conditions, art. 18 | Modification unilatérale ; « la poursuite de l'utilisation vaut acceptation » | Valable pour tous les utilisateurs, en particulier pour les consommateurs ? Comment notifier ? | Moyenne |
| 16 | Conditions, art. 19 | Les « registres informatisés de Finjaro » valent preuve ; la version française prévaut sur l'anglaise | Valables face aux consommateurs ? La primauté du français pose-t-elle un problème pour les lecteurs de la version anglaise ? | Basse |
| 17 | Conditions, art. 8 | Opérations transfrontalières : formalités, droits et taxes « à la charge de l'Acheteur » | Valable ? Faut-il détailler ? | Basse |

## Ce que les textes ne disent pas, et qu'on s'attendrait à y trouver

1. Une page de **mentions légales** (qui édite, qui héberge, comment contacter).
2. Un **médiateur de la consommation** ou un recours extrajudiciaire, pour les consommateurs de pays qui l'exigent.
3. Un **modèle de formulaire de rétractation** (l'art. 16 en parle sans le donner).
4. L'**identification de l'hébergeur** (Supabase, région de Paris, est cité en Confidentialité art. 7 ; pas dans les Conditions).
5. Le traitement des **signalements de contenus illicites** : un délai et une voie de recours pour la personne dont l'annonce est retirée (art. 13 et 14 : « sans préavis », « sans indemnité »).
6. Une règle sur les **avis** (modération, faux avis).

## Hors des textes mais liés

- **Prospection par e-mail** (depuis le 07/10) : messages signés « Léo, agent IA de Finjaro » envoyés à des adresses génériques d'entreprises en Europe, en Afrique et au Moyen-Orient, avec une phrase pour refuser. Quelle base légale, quelles mentions obligatoires selon le pays du destinataire, et que dit la règle sur l'obligation de se déclarer comme IA ?
- **Nom « Léo »** : Beau réfléchit à un renommage ; une recherche d'antériorité (marque) est à faire avant tout dépôt. Le dépôt éventuel (OAPI ou autre) est une démarche et une dépense de Beau.

## Ce que Claude a vérifié pour ce dossier

- Les articles et extraits cités ont été lus dans les fichiers de la branche staging le 12/10/2026 (terms.js lignes 18 à 251, privacy.js articles 1, 4, 7 et 11, dispute.js début).
- Rien n'a été vérifié hors de ces textes : l'existence réelle des contrats avec les prestataires d'IA (point 8) et le nombre de personnes concernées sont à établir par Beau.
