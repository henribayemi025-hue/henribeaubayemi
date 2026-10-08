# Rapport détaillé — nuit du 7 au 8 octobre et matinée du 8 octobre 2026

Demandé par Beau le 08/10 à 09 h 50 (« fais-moi un rapport détaillé de tout »).
Tout ce qui est écrit ici est mesuré ou vérifié ; rien n'est estimé sans le dire.
Heures en heure de Paris.

## 1. En dix lignes

1. La série de prospection du soir est partie : 71 e-mails (50 Léo en Europe, 21 Accounting au Cameroun), 10 non-remises (14,1 %), toutes notées.
2. Tous les moteurs d'IA payants sont à sec ; les agents de Léo n'ont tourné que sur la part gratuite de Cloudflare, entre 04 h 36 et 07 h 45, puis se sont arrêtés proprement.
3. Huit améliorations vérifiées aujourd'hui, toutes dans le registre : moteurs plus robustes, trois cibles tactiles à 44 px, porte de Léo qui dit où l'on allait, lecture du code sans jeton, liens de prospection, migration 0239.
4. Découverte : le connecteur Gmail réécrit chaque lien des e-mails envoyés en `google.com/url`, et le destinataire tombe d'abord sur une page d'avertissement Google. La série de ce soir partira sans aucun lien.
5. La Lettre de l'IA n° 5 est écrite et publiée dans Learn (sur staging) ; Vigie n'a pas pu la livrer faute de moteur.
6. La liaison commande → vente est bien en production depuis le 17/09 ; Claudinette se trompait, elle l'a reconnu et corrigé.
7. Chemin complet rejoué deux fois sur le projet de test, vérifié par Claudinette dans son moteur comptable : une seule vente, montants en centimes, bilan équilibré.
8. Défaut trouvé : les trois vendeuses réelles qui ont un espace Accounting avaient une devise illisible ; aucune vente n'aurait été écrite. Migration 0239 posée en production sur ton « oui », vérifiée : EUR, XAF, XAF.
9. Stockage Supabase : 604 Mo sur 1 Go (59 %), plein vers début février au rythme actuel.
10. Revue produit du jeudi faite : concurrence sourcée, trou « je regarde → je contacte » mesuré, idée « Encore disponible ? » en un geste.

## 2. La nuit (du 7 au 8 octobre)

### 2.1 Série de prospection du soir (19 h 16 à 19 h 22)

- 71 envois depuis la boîte Finjaro : 50 pour Léo (Europe, modèle 4 en français et 4-EN en anglais selon le pays), 21 pour Accounting (Cameroun, modèle 5).
- Chaque entreprise vérifiée avant l'envoi : page d'accueil et page « à propos » lues, serveurs de courrier contrôlés, exclusion de tout ce qui vend de l'IA, du logiciel ou du conseil numérique.
- 10 non-remises (14,1 %), juste sous le seuil d'arrêt de 15 % ; toutes marquées `rebond` dans la table privée. Deux serveurs allemands ont refusé le message pour « SPAM (B-SCORE) » : c'est le contenu ou l'expéditeur qui est noté.
- Deux refus « stop » reçus ce jour-là (un cabinet de conseil en IA, une agence digitale de Yaoundé) : notés `stop`, on ne leur réécrit jamais.
- Leçons écrites dans la méthode (section « Ce que la série du 07/10 au soir a appris »).

### 2.2 Panne des moteurs d'IA

- État constaté à 21 h 30 puis toute la nuit : Google AI Studio (clé payante) répond « crédits épuisés » (402), Gemini gratuit « quota dépassé » (429), DeepSeek « solde insuffisant » (402), Kimi « compte suspendu, solde insuffisant » (429), OpenAI « plus de crédits » (429). Groq (gratuit) répond, mais sa part est comptée par minute pour toute l'organisation : 8 000 jetons par minute pour gpt-oss, 6 000 pour qwen.
- Ce que j'ai changé dans le moteur commun (fonctions edge, communes à staging et production ; CI 266, 267 et 268 vertes, fonctions redéployées) :
  - une « part gratuite épuisée » compte comme « plus de moteur », donc le passage des agents s'arrête net au lieu de tourner à vide ;
  - un budget Groq par minute partagé par toute l'équipe : fini les 429 quand trois agents parlent en même temps ; une consigne trop longue pour la part est refusée avant l'appel ;
  - une réponse mal formée met le moteur de côté 60 secondes au lieu de 5 minutes ;
  - un modèle retiré par son fournisseur (« does not exist », « decommissioned », « deprecated », « no longer ») est mis de côté pour la journée (trouvé grâce à la veille de Claudinette) ;
  - lecture du code par les agents : quand le jeton de l'application GitHub répond 404 sur un dépôt public, l'outil relit sans jeton. Socle et Forge étaient bloqués là-dessus depuis 04 h 40.

### 2.3 Les agents de Léo

- À 04 h 31, premier passage après minuit UTC : part Cloudflare renouvelée. Résultat : 3 plans de département (Qualité, Produit, International ; 9 tâches ajoutées) et 18 livrables rendus entre 04 h 36 et 04 h 44 (Plume, Alpha, Boussole, Miroir, Lien, Orchestre, Atelier, Tirelire, Traque, Cap, Maître, Semeur, Balance, Vigie, Radar, Écho, plus 2 bloqués : Socle et Forge sur « GitHub 404 »).
- Coût : 0 €. Tout sur les moteurs gratuits.
- À 07 h 45, la part Cloudflare du jour était épuisée ; les moteurs payants restent à sec ; Groq refuse les consignes des agents (17 000 à 24 000 jetons, au-dessus de sa part par minute). Les agents ne reprennent qu'à 02 h du matin, sauf recharge.
- Socle et Forge ont eu une réponse « pour Beau » dans Produit : les fichiers existent, l'outil est corrigé, reprendre au prochain passage.
- Tâche difficile du jour confiée à Alpha : la règle « pas de mise en avant sans photo » (M3 de l'audit).

### 2.4 Audit « 200 personnes » et autres améliorations de la nuit

- Trois cibles tactiles passées à 44 px (bouton EN/FR et lien de connexion de la page d'accueil, bouton « Passer » de l'introduction, points du carrousel).
- La porte de Léo dit maintenant où l'on allait : « Connecte-toi pour continuer vers la création de ton entreprise / l'Atelier / l'invitation / ton entreprise », en français et en anglais. Vérifié à 390 et 1 440 px, capture dans docs/audit-200/ecrans/.
- 511 tests, compilation, Playwright : tout vert.

### 2.5 Veille de Claudinette (07 h 30)

- BCEAO : paiement instantané PI-SPI obligatoire le 02/11 pour la monnaie électronique entre personnes ; StashUp Kiosk (Ghana) : vitrine WhatsApp, 1,5 % par vente conclue, sans abonnement ; AIFE a coupé une plateforme de facturation après une intrusion par génération de PDF ; qwen3.8-27b encore « Preview » chez Groq.
- Répondu : aucune promesse de paiement gratuit dans nos textes ; la place de marché ne fabrique aucun PDF côté serveur ; relances déjà automatiques ; motif « modèle retiré » élargi.

## 3. La matinée (8 octobre)

### 3.1 Les liens des e-mails de prospection (07 h 40 à 08 h 05)

- Lecture du courrier brut d'un e-mail envoyé hier : chaque adresse web est réécrite en `https://www.google.com/url?q=…&source=gmail&sa=E`, dans le texte brut comme dans le HTML.
- Deux essais vers nous-mêmes (neuf formes d'adresse, envoi direct et brouillon) : tout est réécrit. C'est le connecteur Gmail de claude.ai qui le fait, à la composition.
- Ouvert, le lien affiche d'abord une page Google « Redirect Notice » (vérifié : HTTP 200), avant d'arriver chez nous. Pour un premier contact, c'est une page d'avertissement Google à la place de notre site. Toutes les séries envoyées depuis cette boîte sont concernées ; on ne réécrit à personne pour autant.
- Décision prise (modifiable par toi) : plus aucune adresse web dans les messages ; le produit nommé en toutes lettres ; appel à l'action « répondez à cet e-mail et nous vous envoyons l'accès » ; plus de lien LinkedIn. Méthode, registre et routine du soir modifiés.
- Option (b), à ta main : envoyer depuis une adresse @finjaro.net via Resend (déjà en place pour les e-mails de Léo, 100 par jour gratuits), à condition de vérifier ses conditions sur la prospection non sollicitée ; c'est le même compte que les e-mails de Léo.

### 3.2 La Lettre de l'IA n° 5 (07 h 55 à 08 h 35)

- Vigie n'a rien livré : sa tâche est restée « à faire », les moteurs étaient à sec. Ce n'est pas sa faute ; sa tâche est close avec une relecture qui le dit et qui rappelle la méthode.
- Numéro écrit par moi, chaque source ouverte : Claude Haiku 5.5 (Anthropic, 07/10 : dix fois moins cher que Haiku 4.5), « Intelligent UI » de ChatGPT (TechCrunch, 07/10), SynthID ouvert à tous (TechCrunch, 07/10), « Execution Containers » de Windows 11 (TechCrunch, 07/10) ; neuf dépôts GitHub relevés le matin même ; prompt du jour (écrire sa propre consigne réutilisable), astuce (petit modèle pour les tâches simples), mot du jour « skill ».
- Écarté faute de source : la rumeur « Haiku 5.5 plus fort qu'Opus », le total « 74,1 milliards levés », la levée de Mistral (trop ancienne), des levées hors sujet.
- Publié dans docs/lettre-ia/ et dans le dépôt Finjaro-learn (public/lettre + index.json), Learn réimporté sur staging (622aeec).

### 3.3 Rappel du matin (08 h 20)

- Personne n'a bougé sur Finjaro en 36 heures ; aucune commande n'attend une vendeuse.
- Léo : 3 plans, 18 livrables, 2 bloqués, 0 €.
- Six points pour toi (repris au chapitre 6).

### 3.4 Boîte Finjaro, Legion, salle commune (08 h 40)

- Boîte : rien de nouveau (aucune réponse dans les fils du 29/09, rien par leo-contact, aucune réponse de prospect) ; les dix non-remises sont celles d'hier, déjà notées.
- Legion : mon agent est allumé ; aucun message de toi ; aucun agent n'attend depuis plus de 2 heures.
- Issue publique #16 : toujours 9 commentaires, le dernier du 22/09.

### 3.5 Claudinette : réunion n° 18, revue du jeudi, mode expert (08 h 35 à 09 h 00)

- Réunion n° 18 : Accounting en ligne (secours Groq avec clé en Secret, WhatsApp corrigé, « À quoi ça sert » replié après trois visites). Sa question — Finia a-t-elle répondu par Groq ? — : personne n'a appelé Finia depuis hier 20 h, mais la chaîne commune a répondu par Groq à 08 h 00 (relais de modération) ; la part Groq est commune à toute l'organisation.
- Revue du jeudi : en Côte d'Ivoire, la facture normalisée électronique (FNE) et le reçu (RNE) sont contrôlés depuis le 01/09/2026, micro-entreprises comprises ; le document « Facture » d'Accounting n'est pas une FNE. Ses trois idées : document vrai par pays (« Reçu de caisse »), module Learning de dix minutes sur la facture électronique, grille de prix (caisse/stock/dettes gratuits ; repères : Caisse Boutique 5 000 FCFA par mois, Massiwa 10 à 30 € par mois, StashUp 1,5 % par vente).
- Sa question — la place de marché émet-elle quelque chose qu'on prendrait pour une facture ? — : non, vérifié dans le code : aucun écran « Facture » ni « Reçu », aucun PDF ; seules les pages « Ma commande » et « Commandes » à l'écran. Une seule mention : la page Kit cite « le reçu envoyé sur WhatsApp » d'Accounting, à aligner si elle renomme.
- Mes trois idées côté place de marché, dans son registre (docs/IDEES.md) : une carte « ce que la loi demande dans votre pays » dans l'espace vendeuse ; le prix de la place de marché à la commission plutôt qu'à l'abonnement (2 commandes en 30 jours sur 59 boutiques) ; la démo à trois écrans « de la commande à l'écriture ».
- Elle confirme : en mode expert, sa démonstration affiche « Revenir au mode simple » (en ligne depuis 08 h 16).

### 3.6 La liaison commande → vente : la vérité, la répétition, le défaut, la réparation (09 h 10 à 09 h 55)

1. **La vérité.** Claudinette écrivait que la liaison « attend l'accord de Beau » et que la démo s'arrête à deux écrans. Faux, vérifié en production : le déclencheur `trg_finia_order_to_sale` est posé sur les commandes depuis le 17/09 (migration 0127, ton accord), il s'est déclenché deux fois le 23/09 sur des commandes d'essai. Ce qui manque : une commande réelle livrée chez une vendeuse qui a un espace Accounting (0 en 30 jours ; réelles depuis le début : 2 annulées, 1 chiffrée sans réponse). Elle a reconnu ses deux erreurs, remis la phrase d'origine de sa page de connexion et corrigé son audit ; j'ai corrigé le point A2 de notre audit.
2. **La répétition sur le projet de test** (sans toucher la production) : commande FJ-526845 passée par un compte de test (1 sac de riz, 2 huiles, livraison, 34 000 FCFA), transitions faites en tant que la gérante (garde de statut respectée), livrée → vente écrite dans son espace (3 lignes, 56,11 $ car l'espace de test est en dollars). Claudinette l'a rejouée dans son moteur : une seule vente (doublon ignoré), montants lus en centimes, bilan équilibré, aucun mouvement de stock, « coût à compléter » affiché. Rien à changer dans la fonction.
3. **Le défaut.** Mesuré en production : trois vendeuses réelles ont un espace Accounting (K-Drinks et Ricardo Azebaze CMR au Cameroun, Didi_beauty56 en France) et pour les trois la devise lue par la fonction était vide. Cause trouvée par Claudinette : l'instantané de l'espace porte une chaîne vide (pas « rien »), et la fonction s'arrêtait dessus sans lire la vraie devise choisie à l'installation (EUR, XAF, XAF). Conséquence : à la première commande livrée, aucune vente écrite, « devise inconnue » dans le journal, en silence.
4. **La réparation.** Migration 0239, une ligne (une chaîne vide vaut « pas de devise »), essayée sur le projet de test (fonction : vide → USD ; commande FJ-4D2F9E livrée → vente écrite), puis posée en production à 09 h 55 sur ton « oui ». Remesuré juste après : EUR, XAF, XAF, taux connus. Aucune table touchée. Claudinette prévenue ; sa branche (a), qui réécrit l'instantané côté Accounting, reste à part.

### 3.7 Stockage (09 h 20)

- 604 Mo sur 1 Go gratuit (59 %, contre 57 % le 30/09). Photos d'articles 388 Mo (5 116 fichiers, +48 Mo en 30 jours), vidéos 146 Mo (12), boutiques 41 Mo (+25 Mo en 30 jours), Léo 9 Mo, chat 6 Mo.
- +23 Mo en 7 jours, environ 26 Mo par semaine sur un mois : plein dans 16 à 18 semaines, vers début février. Rien à faire aujourd'hui ; le jour venu : Supabase Pro (environ 25 $ par mois) ou alléger les vidéos.

### 3.8 Revue produit du jeudi, côté place de marché (09 h 45 à 10 h 00)

- Mesuré en 30 jours, comptes de test exclus : 2 092 fiches produit vues, 474 boutiques vues, 207 recherches, 12 ajouts au panier, 2 commandes, 10 intentions de contact, 1 clic WhatsApp. Moins d'une fiche vue sur 200 mène à un contact : c'est le trou numéro un, inchangé.
- Concurrence, sourcée dans docs/IDEES.md du dépôt Accounting : Facebook Marketplace pré-remplit « Hi, is this available? » et Meta propose au vendeur une réponse automatique de Meta AI ; Jumia T2 2026 : revenu place de marché +34 %, ventes des vendeurs tiers +26 %, Nigeria +36 %, cap sur l'activation des vendeurs locaux ; le catalogue WhatsApp reste la vitrine n° 1 des petits vendeurs (Sénégal, Nigeria) ; Jiji : rien de neuf côté produit ; Bumpa : 40 % des transactions depuis Instagram.
- Quatrième idée, pour le trou : « Encore disponible ? » en un geste (question pré-écrite dans WhatsApp depuis la fiche) et la réponse affichée avant même d'écrire (stock de la fiche, ville de la boutique), sans IA.

## 4. Moteurs et coûts

| Moteur | État ce matin | Reprise |
| --- | --- | --- |
| Google AI Studio (clé payante) | crédits épuisés (402) | à ta recharge |
| Gemini gratuit | quota dépassé (429) | quotidien |
| Cloudflare (gratuit) | part du jour épuisée à 07 h 45 | 02 h du matin |
| Groq (gratuit) | répond, mais part par minute trop petite pour les agents ; commune à Accounting | permanent |
| DeepSeek, Kimi, OpenAI | sans crédit | à ta recharge |

Coût des 14 dernières heures : 0 €. Les agents travaillent environ une heure par jour tant que seul le gratuit répond.

## 5. Chiffres de la journée

| Quoi | Nombre |
| --- | --- |
| Améliorations vérifiées au registre (08/10) | 8 |
| Commits poussés sur staging depuis hier 20 h | 21 |
| Commits de ma main sur le dépôt Accounting aujourd'hui | 15 |
| Exécutions CI fonctions edge | 3 (266, 267, 268), toutes vertes |
| Messages échangés avec Claudinette par le canal direct | 9 reçus, 8 envoyés |
| E-mails envoyés hier soir | 71 (10 non-remises) |
| Livrables d'agents cette nuit | 18 rendus, 2 bloqués |
| Migration posée en production | 1 (0239, sur ton oui) |

## 6. Ce qui t'attend (consolidé)

1. **Moteurs** : recharger Google AI Studio (ou DeepSeek, OpenAI). Sinon les agents ne tournent qu'une heure par jour.
2. **E-mails de prospection** : (a) sans lien, « répondez à cet e-mail » — c'est ce qui part ce soir si tu ne dis rien ; (b) envoyer depuis une adresse @finjaro.net via Resend, après lecture de ses conditions.
3. **GitHub** : Settings → Applications → application Léo, vérifier que le dépôt henribeaubayemi est autorisé avec « Contents : read ».
4. **Accounting** (Claudinette attend) : ton essai réel de Finia ; un oui sur le régime fiscal par défaut ; la version gratuite de la relance des créances.
5. **Cloudflare et Stripe** : réautoriser les deux connecteurs dans claude.ai.
6. **Learn** : l'ouvrir sur finjaro.net (aujourd'hui sur staging, avec la Lettre n° 5).
7. **Idées à cocher** dans docs/IDEES.md (dépôt Accounting) : ses trois, mes trois, et la quatrième « Encore disponible ? ».
8. **Démo à trois écrans** : une date pour la répéter avec toi ; elle marche de bout en bout.
9. **Acheteuse de FJ-4Y8MK2** : la recontacter ou non (commande chiffrée le 27/09, jamais informée).
10. **Stockage** : rien aujourd'hui ; je te redirai à 80 %.

## 7. Ce qui n'est pas fait, et les risques

- Vigie n'a pas écrit la lettre ; tant que les moteurs sont à sec, c'est moi qui l'écrirai.
- Socle et Forge reprendront au prochain passage où un moteur répond ; à vérifier.
- Les consignes des agents sont trop longues pour la part Groq par minute : Groq ne leur sert à rien tant qu'on ne raccourcit pas leurs consignes (chantier possible : consignes compactes pour Groq).
- La série de ce soir utilise la réserve française vérifiée hier (28 entreprises) plus de nouvelles entreprises européennes ; sans lien, l'appel à l'action est la réponse par e-mail, donc il faudra lire et répondre aux réponses.
- Rien n'a été envoyé à une vraie personne en ton nom aujourd'hui ; aucune donnée personnelle dans les dépôts publics.

## 8. Où tout est écrit

- Carnet : docs/A-FAIRE.md, lignes du 08/10 (de 04 h 42 à 09 h 55).
- Registre des améliorations : docs/AMELIORATIONS.md, lignes du 08/10.
- Méthode de prospection : docs/prospection/2026-10-07-messages-et-methode.md.
- Lettre : docs/lettre-ia/2026-10-08-numero-5.md.
- Audit Accounting : docs/audit-200/ACCOUNTING.md (point A2 annulé).
- Tableau commun des deux sessions : docs/A-FAIRE-PARTAGE.md du dépôt Accounting, section « Réunion du matin, 08/10 ».
- Registre des idées : docs/IDEES.md du dépôt Accounting.
- Migration : supabase/migrations/0239_finia_devise_espace_chaine_vide.sql.
