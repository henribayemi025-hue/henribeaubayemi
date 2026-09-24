# 03 — « Publier ton application sur l'App Store en 3 étapes » (Expo + Claude Code)

- **Source** : texte collé par Beau, reçu d'un créateur sur Instagram. Liens cités : https://expo.dev ; https://docs.expo.dev/submit/ios/ ; https://developer.apple.com/programs/ ; lien d'invitation https://taap.it/demarre-ici (redirige vers une communauté Skool nommée « IA.zip »)
- **Type** : texte (message promotionnel) + documentation officielle Expo et Apple
- **Accès** :
  - texte de Beau : lu en entier ;
  - lus : la page d'accueil d'Expo, la page de tarifs d'Expo (expo.dev/pricing), la documentation « Submit to the Apple App Store » ;
  - lues côté Apple : la page du programme développeur, la page d'inscription (developer.apple.com/programs/enroll) et, dans les règles de revue de l'App Store, les règles 4.2, 4.2.2, 4.8 et 5.1.1(v) ;
  - **IA.zip : bloqué**. La page publique est visible (gratuite, 79 membres affichés), mais tout le contenu annoncé (600+ skills, 150+ agents, 180+ commandes, 40+ workflows n8n) demande de rejoindre le groupe et de se connecter. Je ne me suis pas inscrit, donc ce contenu n'a pas été vu.
- **Licence / droits** : texte du créateur sans licence, on n'en reprend rien mot pour mot. Expo et son SDK sont en licence MIT (ce que dit expo.dev). Les pages Apple sont des documents publics soumis au droit d'auteur : on résume, on ne copie pas.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un message promotionnel promet qu'on publie une application sur l'App Store en trois gestes : installer Expo Go, décrire l'application à Claude Code avec le mot « Expo », scanner le QR code puis « demander à Claude de la publier ». Il se termine par une invitation vers une communauté gratuite (IA.zip) qui annonce des centaines de ressources. Les trois liens officiels sont réels et sérieux. Mais le message saute presque toutes les étapes qui coûtent de l'argent, du temps ou un refus d'Apple.

## Ce qui est vraiment utile pour Finjaro et Léo

### Vrai, faux, manquant : ce que disent les sources officielles
**Ce qui est vrai**
- Expo est un cadre open source (MIT) pour faire des applications iPhone et Android en React Native.
- Expo Go permet de tester une application sur son téléphone en scannant un QR code.
- EAS Submit envoie l'application compilée vers App Store Connect avec une seule commande, depuis macOS, Linux ou Windows. Pas besoin de Mac.

**Ce qui est trompeur**
- **Expo Go sert à tester, pas à publier.** Pour publier, il faut :
  1. une compilation de production (`eas build`) ;
  2. un envoi (`eas submit`) ;
  3. une soumission à la revue d'Apple, faite à la main dans App Store Connect.
- « Demande à Claude de la publier » : Claude peut lancer les commandes. Mais c'est un humain qui doit :
  - payer le compte Apple et s'y connecter ;
  - remplir la fiche App Store ;
  - répondre aux examinateurs d'Apple.

**Ce qui manque**
- **Le compte développeur Apple est payant : 99 USD par an**, sans lequel rien ne se publie. Une exonération existe, sur demande et sous conditions, pour les associations, les établissements d'enseignement agréés et les organismes publics.
- **S'inscrire comme entreprise** demande :
  - un numéro D-U-N-S ;
  - une entité légale (un nom commercial ne suffit pas) ;
  - un site web qui fonctionne sur un domaine de l'entreprise ;
  - une personne qui a le pouvoir d'engager l'entreprise.

  Le nom de l'entité s'affiche comme vendeur sur l'App Store.
- **Un compte Expo et les limites de l'offre gratuite EAS** : 15 compilations iOS par mois, en file d'attente lente. L'offre payante commence à 19 USD par mois.
- **La fiche App Store n'est pas faite par EAS Submit** : description, captures d'écran, icône, étiquettes de confidentialité. Tout se remplit à la main.
- **La revue d'Apple**, avec des refus possibles et des délais. Règles qui piègent souvent :
  - **4.2** : une application qui n'est qu'un site web « ré-emballé » peut être refusée ;
  - **5.1.1(v)** : si on peut créer un compte dans l'application, on doit aussi pouvoir le supprimer dans l'application ;
  - **4.8** : une connexion par Google impose une autre option de connexion respectueuse de la vie privée (en pratique, « Se connecter avec Apple ») ;
  - il faut aussi donner à l'examinateur un compte de démonstration qui fonctionne.
- **TestFlight** : la version apparaît pour les testeurs 10 à 15 minutes après l'envoi, mais la mise en vente publique passe par la revue.

### Comparaison avec NOTRE cas (Finjaro)
- **Finjaro n'utilise pas Expo, et n'en a pas besoin.** Nos applications Android et iPhone sont faites avec Capacitor : ce sont des fenêtres qui affichent https://finjaro.net (`capacitor.config.json`, `docs/BUILDS-MOBILES.md`). Passer à Expo reviendrait à réécrire l'application en React Native. Aucun intérêt aujourd'hui.
- **Nous avons déjà franchi les étapes que le guide oublie** :
  - compte Apple, fichiers de fabrication et d'envoi (`fastlane/`), soumission ;
  - deux demandes d'informations d'Apple : règle 2.1 le 14/08, puis 2.1(b) le 31/08 sur les achats intégrés, à cause d'articles « abonnement Netflix / IPTV » vus dans le catalogue ;
  - un écran de suppression de compte (`src/screens/AccountDeletion.jsx`) ;
  - la connexion Apple, à côté de Google (`useAuth.jsx`) ;
  - un compte de démonstration par e-mail, avec une boutique de démonstration.
- **Le vrai risque pour nous, que le guide ne mentionne pas : la règle 4.2.** Une application qui charge un site peut être jugée « pas assez application ». Nos défenses, à maintenir :
  - connexion native Google et Apple dans l'application ;
  - appareil photo et localisation demandés au bon moment ;
  - navigation qui ne ressemble pas à un navigateur ;
  - à terme, des notifications natives (FCM / APNs, voir `BUILDS-MOBILES.md` §6).
- **Ce que Capacitor nous donne et qu'Expo vendrait aussi** : une mise en ligne du site atteint tout de suite les utilisateurs de l'application, sans repasser par les magasins. Expo propose la même chose avec « EAS Update », qui est payant au-delà de 1 000 utilisateurs actifs par mois.

### Ce qu'on en garde
- **La liste de contrôle de publication** qu'on peut reconstruire à partir des sources officielles. Elle sert à toute future application de l'environnement Finjaro (Léo, Accounting) qui voudrait aller sur l'App Store.
- **Un cas d'école pour Vigie et Mentor** : comment lire un tuto « en 3 étapes ». On cherche ce qu'il omet : le coût, la revue, les comptes, les délais.
- **La réponse à la question « Léo ou Accounting doivent-ils être sur l'App Store ? »** :
  - techniquement possible, avec Capacitor comme Finjaro ou avec Expo ;
  - il faut un compte Apple (déjà payé pour Finjaro, à vérifier s'il peut porter plusieurs applications sous la même entité) ;
  - il faut une fiche par application ;
  - il faut passer la règle 4.2 à chaque fois.

## Pour quels agents de Léo
- **Ada Nkemba (développeuse place de marché)** : elle maintient l'application Capacitor. Elle doit connaître les règles 4.2, 4.8 et 5.1.1(v), pour ne pas casser ce qui nous fait accepter : suppression de compte, connexion Apple.
- **Alpha (direction technique)** : il arbitre « Expo ou Capacitor » si une nouvelle application est envisagée, et chiffre le coût réel (compte Apple, EAS, temps de revue).
- **Claude (développeur de Léo)** : si Léo doit un jour avoir une application iPhone, il part de cette liste de contrôle.
- **Vigie (veille)** : trier les promesses « publie en 3 étapes » et prévenir Beau avant qu'il y passe du temps.
- **Mentor** : faire de la lecture critique des tutos une compétence.
- **Lien (relation)** : quand un vendeur ou un partenaire demande « comment vous avez fait l'application », il faut une réponse honnête : Capacitor, le compte Apple, la revue.

## Compétences à tirer (pour Mentor)

**Préparer une publication sur l'App Store** — Ada Nkemba, Alpha, Claude
Avant de promettre une date de sortie sur l'iPhone, vérifie cinq choses et note où en est chacune :
1. le compte développeur Apple est payé (99 USD par an) et accessible par Beau ;
2. la fiche App Store est prête : description sans chiffre inventé, captures d'écran, icône, étiquettes de confidentialité ;
3. un compte de démonstration par e-mail fonctionne et montre du contenu ;
4. on peut supprimer son compte depuis l'application, et « Se connecter avec Apple » existe si « Continuer avec Google » existe ;
5. l'application fait plus qu'afficher un site : connexion native, appareil photo, notifications.

Compte ensuite quelques jours pour la revue, et prévois au moins un aller-retour avec Apple. Piège : croire qu'une version visible dans TestFlight est publiée. Elle ne l'est qu'après l'acceptation d'Apple et la mise en vente.
*Source : documentation Expo (Submit iOS), pages Apple Developer Program et App Review Guidelines, résumées ; expérience Finjaro (docs/BUILDS-MOBILES.md).*

**Répondre à une demande d'informations d'Apple** — Ada Nkemba, Lien
Quand Apple écrit « Information Needed » (règle 2.1), ce n'est pas un refus. N'envoie pas de nouvelle version : réponds dans App Store Connect (« Reply to App Review »), point par point, dans l'ordre de leurs questions. Pour une vidéo demandée, filme en une seule prise, depuis le lancement de l'application, exactement les parcours cités. Si la question porte sur les achats intégrés, explique clairement que Finjaro met en relation acheteurs et vendeurs pour des biens et services réels, et retire du catalogue ce qui contredit cette réponse. Piège : répondre en généralités, ou changer l'application sans le dire.
*Source : expérience Finjaro (docs/APPLE-REPONSE-2.1.md et 2.1b.md) ; aucune reprise du texte promotionnel.*

**Lire un tuto « en 3 étapes » avant d'y croire** — Vigie, Mentor, Écho
Pour chaque guide rapide reçu, pose quatre questions :
- Qu'est-ce que ça coûte vraiment (abonnements, comptes payants) ?
- Qui doit décider ou valider à la fin (une revue, un humain, une plateforme) ?
- Quelles étapes sont présentées comme automatiques alors qu'elles sont manuelles ?
- Où mène le lien final (vente, inscription, collecte d'e-mails) ?

Vérifie chaque affirmation sur la documentation officielle, pas sur le message. Résume pour Beau en trois lignes : vrai / manquant / piège. Piège : une affirmation techniquement vraie peut cacher un coût important. Ici, « Expo est gratuit » était vrai, mais le compte Apple ne l'est pas.
*Source : méthode tirée de l'analyse de ce message ; pas de reprise de texte.*

## Limites, risques, prudence
- **Le lien d'invitation** passe par un raccourcisseur (taap.it) avant d'arriver sur Skool. Il porte un identifiant de suivi du créateur, et le contenu est réservé aux membres inscrits. **Non vérifiable sans s'inscrire, et non vérifié.** Les chiffres annoncés (600+ skills, etc.) ne sont donc pas vérifiés. La page affiche 79 membres, ce qui invite à la prudence sur la qualité annoncée.
- **Les prix** (Apple 99 USD par an, EAS à partir de 19 USD par mois, offre gratuite de 15 compilations iOS) ont été lus le 24/09/2026 et peuvent changer. On les relit avant toute décision.
- **Aucune bascule vers Expo** ne doit être proposée pour Finjaro sans une vraie raison : ce serait une réécriture complète.
- La fiche ne contient aucun identifiant ni mot de passe de compte de démonstration. Ils existent dans le dépôt : ne jamais les recopier dans une consigne d'agent.

## Verdict
**Retenu, mais pas le message lui-même.** On garde les sources officielles, et la liste de contrôle « publier sur l'App Store » qu'on en tire, croisée avec notre propre expérience d'Apple. Elle servira à Ada, Alpha et Claude si Léo ou Accounting visent un jour l'iPhone. Le tuto promotionnel est **mis de côté** : il promet une publication en trois gestes et omet le compte Apple payant, la fiche, la revue et la règle 4.2, qui est pourtant celle qui menace une application comme la nôtre. **IA.zip n'est pas accessible sans inscription** : non évalué.
