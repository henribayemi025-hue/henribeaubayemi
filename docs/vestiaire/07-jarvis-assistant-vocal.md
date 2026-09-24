# 07 — Jarvis, assistant vocal local (et sa doctrine « un agent pense, l'autre agit »)

- **Source** : https://github.com/sosoj92/jarvis-assistant-vocal
- **Type** : dépôt GitHub
- **Accès** : ouvert. Cloné le 24/09/2026 (dernier commit le 20/09/2026). Lus en entier : README, LICENSE, `docs/CONTEXTE_IA.md`, `docs/hermes.md`, `docs/costs.md`, `docs/suivi_contenu.md`, `docs/hub_contenu.md`, le filtre `core/confidentialite.py` et les personnalités `core/personnalite.py`. Lus en partie : la consigne système de base (`jarvis14.py`, constante `SYSTEME_BASE`), les niveaux de permission (`core/registre.py`) et le début de `INSTALL_WITH_AI.md`. Les 30 autres guides d'intégration (Hue, OBS, Alexa, satellites…) et le reste du code Python : seulement leur liste, parce qu'ils décrivent du matériel domestique hors sujet. Aucun code n'a été exécuté.
- **Licence / droits** : **MIT**, 2026, auteur « sosoj92 ». Réutilisable en citant l'auteur.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un assistant vocal francophone pour PC Windows, fait par un particulier et partagé tel quel. On dit « Hey Jarvis », il transcrit en local, raisonne avec un modèle de langage (cloud ou local), agit par des outils (domotique, agenda, mails, navigateur, appels) et répond à voix haute. L'intérêt pour nous n'est pas le vocal : c'est l'**architecture de confiance** autour des agents. Un agent de fond, « Hermes », réfléchit et rédige des brouillons sans aucun identifiant. Jarvis garde les clés et exécute. Chaque outil a un niveau de risque, et les dépenses IA ont des plafonds et une bascule automatique vers le mode gratuit.

## Ce qui est vraiment utile pour Finjaro et Léo
- **La doctrine « Hermes pense, Jarvis détient les clés »** : l'agent qui fait les recherches longues, l'analyse ou la rédaction n'a aucun accès aux comptes. Il écrit seulement des brouillons, et c'est un autre composant qui agit après confirmation. C'est transposable tel quel à Léo : Vigie, Plume ou Traque produisent, Orchestre (ou Beau) déclenche les actions réelles.
- **Les niveaux de permission N1 / N2 / N3** :
  - N1 : lecture et actions sûres, sans confirmation ;
  - N2 : actions sensibles avec confirmation, qu'on peut marquer « toujours autoriser » (révocable) ;
  - N3 : actions critiques (envoi de mail, appel, réservation, extinction). Confirmation à chaque fois, jamais mémorisable, jamais à distance.

  C'est une grille simple et directement applicable aux outils de Léo.
- **Un budget IA jamais bloqué en silence** : plafond par jour et par mois, alerte à 80 %, puis bascule annoncée vers un mode gratuit et suspension des tâches de fond non critiques. Retour automatique le lendemain. Un changement manuel de mode désarme la bascule.
- **Les appels se présentent honnêtement** (« je suis l'assistant automatisé de… »). Au téléphone, l'assistant ne confirme que ce qui a été validé avant l'appel, jamais de paiement ni de mot de passe. C'est une bonne règle pour tout agent qui parle à un tiers.
- **Le filtre de confidentialité** : avant de restituer un résumé, on masque les adresses e-mail, les longues suites de chiffres (téléphones, cartes) et les clés ou jetons. C'est un dernier garde-fou, et l'auteur le présente honnêtement comme imparfait.
- **Le suivi de contenus** : un pipeline idée → script → tournage → montage → publié, avec échéance, repérage des retards et question « où j'en suis ? ». Les contenus publiés ne sont jamais comptés en retard. C'est utile tel quel pour Plume.
- **Les règles de réponse** : aucune phrase de remplissage pour une demande simple, un accusé court et précis seulement quand une tâche est vraiment lente (« je regarde tes mails »), et ne jamais reposer une question déjà posée.
- **`docs/CONTEXTE_IA.md`** : un document de contexte à donner à une IA, sans secret ni chemin personnel. Il se termine par « traite les demandes comme des étapes ciblées, pas comme une autorisation d'implémenter toute la feuille de route ». C'est un bon modèle pour les fiches de contexte que Mentor donne aux agents.

## Pour quels agents de Léo
- **Orchestre** : c'est lui qui doit porter la séparation « penser / agir », les niveaux N1/N2/N3 et le budget avec alerte et repli. Ce sont des règles d'outil, pas de simples consignes.
- **Alpha** : il décide quels outils de Léo sont N1, N2 ou N3, et valide qu'aucun agent « penseur » ne reçoit d'identifiants.
- **Forge** (IA) : le routage entre modèles (économique au quotidien, puissant pour l'exigeant, gratuit en repli) et le suivi des coûts relèvent de son périmètre.
- **Claudinette** (comptabilité) : le suivi des dépenses IA par poste, jour et mois, avec plafond, est une donnée comptable.
- **Plume** : le pipeline de contenus idée → publié, avec échéances et « où j'en suis ».
- **Lien, Traque, Semeur** : ils parlent à des tiers, donc la règle de présentation honnête comme assistant automatisé les concerne, tout comme « ne confirmer que ce qui a été validé avant ».
- **Mentor** : le modèle de document de contexte pour une IA, et la leçon « pas de phrase de remplissage ».
- **Claude** (développeur de Léo) : il implémentera les niveaux de permission et le filtre de confidentialité dans l'outil.

## Compétences à tirer (pour Mentor)

**Classer ses actions en trois niveaux de risque** — Orchestre, Alpha, et tout agent qui a des outils
Avant d'utiliser un outil, situe l'action :
- **N1** (lire, chercher, préparer un brouillon interne) : tu y vas ;
- **N2** (action réversible qui touche des données : ranger, étiqueter, programmer un brouillon) : demande confirmation, sauf si Beau a dit « toujours autoriser » pour cet outil précis ;
- **N3** (tout ce qui sort ou ne se rattrape pas : envoyer un message à une vendeuse ou un acheteur, publier, payer, supprimer, migrer la base, déployer) : confirmation de Beau à CHAQUE fois, jamais d'autorisation permanente.

Si tu hésites entre deux niveaux, prends le plus élevé. Piège : croire qu'un « oui » donné pour un envoi vaut pour le suivant. En N3, chaque action se confirme.
*Source : inspiré des niveaux N1/N2/N3 de Jarvis, MIT, sosoj92.*

**Séparer celui qui pense de celui qui agit** — Orchestre, Forge, Alpha
Un agent chargé de réfléchir, chercher ou rédiger (Vigie, Plume, Traque en phase de recherche) ne reçoit aucun identifiant ni aucun outil qui agit à l'extérieur. Il lit ce qu'on l'autorise à lire et rend des brouillons. L'action réelle est faite par un autre maillon (Orchestre, ou Beau), après la vérification et la confirmation prévues par le niveau de risque. Ne donne jamais plus de droits à un agent penseur pour simplifier une fonctionnalité. Si c'est nécessaire, fais-le décider par Beau. Piège : un résumé produit par l'agent penseur peut contenir des données sensibles qu'il a lues. Passe-le au filtre de confidentialité avant de le montrer ou de le transmettre.
*Source : inspiré de la doctrine Jarvis / Hermes, MIT, sosoj92.*

**Tenir un budget IA sans jamais bloquer en silence** — Orchestre, Forge, Claudinette
Compte les dépenses IA par jour et par mois, par poste (modèle, voix, appels). À 80 % d'un plafond, préviens Beau une fois, avec le montant restant. Au plafond, bascule sur le mode le moins cher et suspends les tâches de fond non critiques, en l'annonçant clairement : ce qui a basculé, pourquoi, jusqu'à quand. Le lendemain, reviens au mode normal. Si Beau change le mode lui-même, sa décision prime sur la bascule automatique. Les tarifs changent : ne les écris jamais en dur sans date. Piège : une boucle de requêtes payantes qui réessaie en échec. Un quota épuisé déclenche la bascule, pas une nouvelle tentative.
*Source : inspiré de `docs/costs.md` de Jarvis, MIT, sosoj92.*

**Se présenter honnêtement quand on parle à un tiers** — Lien, Traque, Semeur
Dans tout message ou appel vers une vendeuse, un acheteur ou un partenaire, présente-toi comme l'assistant automatisé de Finjaro. Ne te fais jamais passer pour Beau ni pour un humain. Ne confirme que ce que Beau a validé AVANT l'échange (un prix, un délai, une offre) : pour toute nouvelle demande, dis que tu transmets et que la réponse viendra. Ne demande et n'accepte jamais de mot de passe, de code ou de coordonnées bancaires. Piège : la pression du moment (« vous pouvez me le garantir tout de suite ? »). La bonne réponse est « je vérifie et je reviens vers vous ».
*Source : inspiré des règles d'éthique des appels de Jarvis, MIT, sosoj92.*

**Masquer les données sensibles avant de restituer** — Orchestre, Lien, Vigie
Avant de montrer ou de transmettre un résumé, un extrait ou un compte rendu, remplace par une étiquette :
- les adresses e-mail → « [adresse mail] » ;
- les longues suites de chiffres (téléphones, cartes, comptes) → « [numéro] » ;
- tout ce qui ressemble à une clé ou un jeton → « [clé] ».

Garde le texte court. C'est un dernier filet, pas une protection complète : l'essentiel reste de ne pas faire circuler ces données au départ. Sur Finjaro, cela vaut en particulier pour les coordonnées des vendeuses et des acheteurs dans les rapports internes. Piège : masquer un numéro de commande utile. Signale-le plutôt que de le supprimer si Beau en a besoin.
*Transposition : un agent LLM peut appliquer la règle en écrivant. Le vrai filtre automatique est à coder par Claude côté outil. Source : inspiré de `core/confidentialite.py`, MIT, sosoj92.*

**Suivre un contenu de l'idée à la publication** — Plume, Écho
Chaque contenu a un titre, un statut (idée → rédaction → production → relecture → publié), une plateforme, une échéance facultative et une note. Quand Beau demande « où j'en suis ? », réponds en trois lignes :
- combien de contenus à chaque étape ;
- ce qui est en retard, ou dû dans les 3 jours ;
- la prochaine action conseillée.

Un contenu publié n'est jamais « en retard ». Ne fais avancer un statut que sur un fait (texte validé par Beau, post réellement en ligne). Piège : croire qu'un contenu est publié parce qu'il est programmé. Programmé n'est pas publié.
*Source : inspiré de `docs/suivi_contenu.md` de Jarvis, MIT, sosoj92. Étapes renommées pour des contenus écrits et visuels.*

## Limites, risques, prudence
- **Le « Hub de contenu » est à NE PAS reprendre.** Il télécharge des vidéos Instagram et TikTok d'autres créateurs (avec les cookies du navigateur pour les comptes privés), les transcrit et les indexe comme « inspirations ». Cela heurte les droits d'auteur et les conditions des plateformes, et c'est contraire à notre règle « aucun visuel pris sur le web » (CLAUDE.md §3).
- **Outil personnel, Windows, matériel domestique** : l'essentiel du code (Hue, OBS, Alexa via une API non officielle, satellites Raspberry Pi, gestes à la webcam) est hors sujet pour Finjaro. Aucune installation, aucun script lancé.
- **Coûts** : les modes cloud demandent des clés API payantes (OpenAI, Anthropic, ElevenLabs, Twilio). Les ordres de grandeur de coûts du dépôt sont indicatifs et datés, donc à ne pas recopier.
- **La barrière des rôles d'Hermes est partiellement une consigne, pas un verrou.** L'auteur écrit lui-même qu'il n'existe pas encore de droits distincts par rôle. Chez nous, la séparation doit être imposée par Orchestre dans les outils, pas seulement écrite dans une fiche.
- **Le filtre de confidentialité est rudimentaire** (quelques motifs d'expressions régulières). L'auteur le dit, et il faut le redire.
- **`INSTALL_WITH_AI.md`** est une consigne destinée à être collée dans une IA pour guider une installation. Elle ne m'était pas adressée et je ne l'ai pas suivie. Aucune instruction piégée trouvée.
- Une personnalité « majordome sarcastique » calquée sur un personnage de fiction existe dans le code. Elle n'est pas reprise, car le ton de Finjaro est celui de Beau.

## Verdict
**Retenu** pour Orchestre, Alpha et Forge, pour trois idées d'architecture qui manquent aujourd'hui à Léo et se transposent directement :
- les niveaux de risque N1/N2/N3 ;
- la séparation entre l'agent qui pense et celui qui agit ;
- un budget IA qui prévient à 80 % puis bascule en l'annonçant.

**Retenu** pour Plume (suivi idée → publié), et pour Lien, Traque et Semeur (présentation honnête face aux tiers). Deux parties sont **mises de côté**, raisons à l'appui : le Hub de contenu (contraire aux droits d'auteur et à notre règle sur les visuels) et toute la partie domotique et matériel (hors sujet).
