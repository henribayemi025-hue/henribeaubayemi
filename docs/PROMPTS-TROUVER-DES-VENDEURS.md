# Prompts à coller — trouver des vendeurs, partout dans le monde

Demandé par Beau le 18/09. Ces prompts se collent tels quels dans Claude
(navigateur Chrome). Ils sont écrits pour **n'importe quel pays**: la ville et
le site sont des variables, pas des constantes.

## Le principe, en une phrase

**Claude LIT sur les réseaux, Beau ÉCRIT sur WhatsApp.**

Facebook, Instagram et TikTok coupent l'envoi automatisé — leur métier est de
garder les gens chez eux. Les petites annonces et Google Maps ne coupent rien,
parce que le vendeur y publie son numéro *exprès pour qu'on l'appelle*. Donc
on collecte là où c'est public, et on écrit là où c'est attendu.

---

## Prompt 1 — Le collecteur (le principal, marche sur presque tout)

Remplacer ce qui est entre crochets. Fonctionne sur Google Maps, CoinAfrique,
Jiji, OLX, Leboncoin, Gumtree, Kijiji, MercadoLibre, Craigslist…

```
Tu m'aides à constituer une liste de vendeurs à contacter pour Finjaro, une
place de marché en ligne ouverte au monde entier.

SITE : [https://www.google.com/maps]
ZONE : [Douala, Cameroun]
CE QUE JE CHERCHE : [boutiques de vêtements et d'accessoires]

Ce que tu fais :
1. Ouvre le site, cherche cette activité dans cette zone.
2. Parcours les 30 premiers résultats. Pour chacun, ouvre la fiche et relève :
   nom, activité, ville et pays, numéro de téléphone s'il est affiché,
   Instagram ou site web s'il est affiché, et une phrase sur ce qu'il vend.
3. Rends-moi un tableau : Nom | Activité | Ville | Pays | Téléphone |
   Instagram/site | Ce qu'il vend | Lien de la fiche.

Règles, elles comptent plus que la quantité :
- Tu N'ENVOIES AUCUN message, tu ne remplis aucun formulaire de contact, tu ne
  crées aucun compte. Tu lis, tu notes, tu t'arrêtes là.
- Tu ne relèves QUE ce qui est affiché publiquement sur la page. Tu ne
  cherches pas un numéro ailleurs, tu ne devines pas une adresse e-mail.
- Si une fiche n'a pas de numéro, tu la mets quand même avec la case vide.
- Si le site demande une connexion, un captcha, ou affiche « trop de
  requêtes » : tu t'arrêtes et tu me le dis. Tu ne contournes rien.
- Aucune invention. Si tu n'es pas sûr d'une information, tu écris « non
  affiché ». Une ligne fausse me coûte plus qu'une ligne manquante.
```

## Prompt 1 bis — Trouver ET écrire dans la même passe

C'est celui que Beau veut: Claude ne rend pas une liste, il contacte. Demandé
explicitement le 18/09, après deux réserves de ma part. Sa décision.

L'envoi se fait sur **WhatsApp**, vers le numéro que le vendeur a lui-même
publié pour être appelé. C'est le seul canal où écrire à un inconnu n'est ni
un détournement de l'outil ni un motif de blocage.

```
Je suis le fondateur de Finjaro, une place de marché en ligne ouverte au
monde entier. Je t'autorise à écrire aux vendeurs en mon nom, sans me
redemander à chaque message.

SITE OÙ CHERCHER : [https://www.google.com/maps]
ZONE : [Douala, Cameroun]
CE QUE JE CHERCHE : [boutiques de vêtements et d'accessoires]
LANGUE DES MESSAGES : [français]
COMBIEN : [15] vendeurs maximum pour cette session

Pour CHAQUE vendeur, l'un après l'autre :

1. Ouvre sa fiche. Relève : nom, ce qu'il vend, ville, pays, numéro de
   téléphone. S'il n'y a pas de numéro affiché, passe au suivant.
2. Écris un message de 4 lignes maximum, qui commence par quelque chose de
   VRAI et de précis sur SA boutique — pris dans sa fiche, pas une formule
   qui marcherait pour n'importe qui. Dis-y que c'est GRATUIT JUSQU'EN
   NOVEMBRE, avec le mois écrit — jamais « gratuit » tout court.
3. Ouvre https://wa.me/<son numéro sans espaces ni +> dans un onglet, colle
   le message, ENVOIE-LE.
4. Note dans un tableau : Nom | Ville | Pays | Numéro | Message envoyé |
   Envoyé oui/non.
5. Attends 30 à 60 secondes, puis passe au suivant.

Règles :
- Un message à la fois. Jamais deux fenêtres d'envoi ouvertes ensemble.
- Chaque message est DIFFÉRENT. Un texte identique répété fait bloquer mon
  numéro par WhatsApp en quelques dizaines d'envois — c'est la limite qui
  m'arrêtera, pas toi.
- AUCUN chiffre que je ne t'ai pas donné. Pas de « des milliers d'acheteurs »,
  pas de « X vendeuses nous ont rejoints ». Si le chiffre n'est pas mesuré,
  il ne s'écrit pas.
- AUCUNE phrase qui enferme Finjaro dans un pays. Pas de « la place de marché
  camerounaise », pas de « partout au pays ».
- Pas de promesse de gain et pas de fausse urgence. La date de novembre n'en
  est pas une : elle est vraie et c'est moi qui l'ai fixée. En revanche, pas
  de « plus que 3 places », pas de compte à rebours inventé.
- Si WhatsApp affiche une limite, un avertissement, ou refuse un envoi : tu
  ARRÊTES tout et tu me préviens. Tu ne contournes rien, tu ne changes pas de
  compte, tu ne recommences pas plus tard sans me le dire.
- Si un vendeur répond pendant que tu travailles, tu me le signales et tu ne
  réponds pas à sa place.
- À la fin, donne-moi le tableau complet, y compris les vendeurs sautés et
  pourquoi.
```

**Pourquoi l'envoi ne passe pas par Instagram, TikTok ou Facebook.** Ce n'est
pas une précaution: ces trois réseaux détectent l'envoi automatisé et
restreignent le compte en quelques heures. On y trouve le numéro dans la bio,
et on écrit sur WhatsApp. Le compte survit, et le message arrive là où le
vendeur lit vraiment.

**Ce qui arrêtera Beau, c'est WhatsApp, pas Claude.** Un même numéro qui
envoie beaucoup de messages en peu de temps est signalé par les personnes qui
ne répondent pas, puis limité. Quinze par session, des textes différents, du
temps entre chaque: c'est ce qui fait passer la centaine.

---

## Prompt 1 ter — Prestataires de services en Europe, avec l'e-mail

C'est la version utilisée le 18/09 pour la première série. Elle change deux
choses par rapport au Prompt 1: on vise des **prestataires de services**
(coiffure, plomberie, couture, traiteur, esthétique, cordonnerie…) plutôt que
des boutiques, et on relève **l'e-mail**, parce que c'est le seul canal
qu'on peut automatiser de notre côté.

Sur trente fiches, on obtient environ quinze e-mails. C'est normal: beaucoup
de fiches Google Maps n'affichent qu'un téléphone.

```
Tu m'aides à constituer une liste de professionnels à contacter pour Finjaro,
une place de marché en ligne ouverte au monde entier.

SITE : https://www.google.com/maps
ZONE : [Paris, France]
CE QUE JE CHERCHE : des prestataires de services indépendants — coiffure et
tresses, couture et retouches, plomberie, électricité, traiteur, esthétique,
cordonnerie, petits travaux.

Ce que tu fais :
1. Cherche chacune de ces activités dans cette zone.
2. Pour chaque fiche, ouvre-la et relève : nom du commerce, activité, ville,
   pays, e-mail s'il est affiché, téléphone s'il est affiché, site web, et la
   langue dans laquelle la fiche est rédigée.
3. Si la fiche renvoie vers un site, ouvre la page « contact » du site : c'est
   là que se trouve l'e-mail la plupart du temps.
4. Rends-moi un tableau : Nom | Activité | Ville | Pays | E-mail | Téléphone |
   Site | Langue.

Règles, elles comptent plus que la quantité :
- Tu N'ENVOIES AUCUN message et tu ne remplis aucun formulaire. Tu lis, tu
  notes, tu t'arrêtes là.
- Tu ne relèves QUE ce qui est affiché publiquement. Tu ne devines JAMAIS une
  adresse e-mail à partir d'un nom de domaine.
- Pas d'e-mail affiché : tu mets la ligne avec la case vide. Une case vide est
  utile, une adresse inventée me coûte cher.
- Tu ne juges pas l'origine ou la nationalité de qui que ce soit. Tu ne
  relèves que ce que le commerce dit de lui-même dans sa propre description.
- Captcha, connexion demandée, « trop de requêtes » : tu t'arrêtes et tu me le
  dis. Tu ne contournes rien.
- À la fin, dis-moi combien de fiches tu as ouvertes et combien d'e-mails tu
  as trouvés.
```

**Pourquoi on ne cible pas une origine.** On cible ce que le commerce écrit
lui-même de son activité (« salon afro », « tresses »). C'est plus juste, et
ça évite la catégorie de données sensibles du RGPD. Le mot « diaspora »
n'apparaît dans aucun texte visible — c'est une règle de `CLAUDE.md`.

---

## Prompt 1 quater — Pages Jaunes (celui qui tourne sans Beau)

Ajouté le 18/09. C'est la meilleure source d'**adresses e-mail** après Google
Maps, et la seule chaîne complète qui ne demande rien à Beau: un Claude de
Chrome collecte, je range en base, j'envoie.

Pourquoi elle donne plus d'e-mails que Maps: une fiche Pages Jaunes affiche
souvent le site du professionnel, et l'e-mail se trouve sur la page
« contact » de ce site. Sur Maps, la moitié des fiches n'ont qu'un téléphone.

```
Tu m'aides à constituer une liste de professionnels à contacter pour Finjaro,
une place de marché en ligne ouverte au monde entier.

SITE : https://www.pagesjaunes.fr
ZONE : [Paris et petite couronne]
CE QUE JE CHERCHE : [coiffure] — puis tu recommences avec : couture et
retouches, plomberie, électricité, traiteur, esthétique, cordonnerie.

Ce que tu fais, métier par métier :
1. Lance la recherche « [métier] » dans « [zone] » sur Pages Jaunes.
2. Parcours les 30 premiers résultats. Ouvre chaque fiche.
3. Relève : nom, activité, ville, code postal, téléphone, site web.
4. S'il y a un site, OUVRE-LE et va sur sa page « contact » ou « mentions
   légales » : c'est là qu'est l'e-mail. Relève-le.
5. Note aussi la langue du site, et une phrase sur ce que fait le
   professionnel, prise dans sa propre description.
6. Rends un tableau : Nom | Activité | Ville | Code postal | E-mail |
   Téléphone | Site | Langue | Ce qu'il fait.

Règles, elles comptent plus que la quantité :
- Tu N'ENVOIES AUCUN message et tu ne remplis aucun formulaire de contact. Tu
  lis, tu notes, tu t'arrêtes là.
- Tu ne relèves QUE ce qui est affiché publiquement. Tu ne DEVINES JAMAIS une
  adresse e-mail à partir d'un nom de domaine.
- Pas d'e-mail trouvé : tu mets quand même la ligne, case vide. Une case vide
  est utile, une adresse inventée me coûte cher.
- Tu ne juges l'origine ni la nationalité de personne. Tu ne relèves que ce
  que le professionnel écrit lui-même de son activité.
- Captcha, connexion demandée, « trop de requêtes » : tu t'arrêtes et tu me le
  dis. Tu ne contournes rien.
- À la fin: combien de fiches ouvertes, combien de sites visités, combien
  d'e-mails trouvés.
```

## Les autres sources, classées par ce qu'elles rapportent

| Source | Ce qu'on y trouve | E-mail ? |
| --- | --- | --- |
| Google Maps | Le socle. Toutes activités, toutes zones. | ~1 sur 2 |
| **Pages Jaunes** | Le meilleur pour l'e-mail, parce qu'il mène au site. | Souvent |
| `annuaire-entreprises.data.gouv.fr` | TOUTES les entreprises déclarées en France. Donnée publique, gratuite, en masse. | Non |
| StarOfService, Wecasa, Yoojo | Des prestataires qui CHERCHENT des clients — donc réceptifs. | Non |
| Planity, Kiute | Salons de coiffure sur réservation. | Non |
| Instagram, TikTok (mots-dièses) | Le plus dense pour la beauté. Numéro dans la bio. | Non, WhatsApp |
| Groupes Facebook communautaires | La plus forte densité. Les gens s'y annoncent eux-mêmes. | Non |

**La règle qui explique ce tableau:** l'e-mail n'existe que si la personne a
un **site**. Les annuaires de réservation et les réseaux sociaux donnent
beaucoup de noms et presque aucun e-mail — pour ceux-là, c'est WhatsApp.

**Les groupes Facebook ne passent pas à l'échelle.** Il faut demander à
entrer dans chaque groupe et attendre qu'un administrateur accepte; il n'y a
aucune API; et publier une annonce dedans fait bannir le compte. On y lit, on
relève des numéros, on écrit en privé. Excellente qualité, faible volume, et
ça demande du temps à Beau — c'est exactement ce qu'il n'a pas.

**Pour un pays qu'on ne connaît pas**, ne pas inventer de noms de sites: le
Prompt 4 est fait pour les faire trouver.

---

## Prompt 2 — Instagram et TikTok (bio seulement)

Sur ces deux réseaux, le numéro WhatsApp est très souvent dans la bio. On ne
touche pas aux messages privés: c'est ce qui fait bloquer un compte.

```
Tu m'aides à trouver des boutiques à contacter pour Finjaro, une place de
marché ouverte au monde entier.

RÉSEAU : [Instagram]
RECHERCHE : [#boutiquedouala, #vendeuseenligne, #shoplagos]

Ce que tu fais :
1. Cherche ces mots-clés et ouvre les 25 premiers comptes qui vendent
   vraiment des produits (pas les comptes d'influence sans catalogue).
2. Pour chacun, lis UNIQUEMENT la bio publique et relève : nom du compte,
   ce qu'il vend, ville et pays si c'est écrit, numéro WhatsApp s'il est dans
   la bio, lien externe s'il y en a un.
3. Tableau : Compte | Ce qu'il vend | Ville | Pays | WhatsApp | Lien.

Règles :
- Tu N'ENVOIES AUCUN message privé, tu ne commentes pas, tu ne suis personne.
  Ce réseau bloque les comptes qui le font, et je ne veux pas perdre le mien.
- Tu lis la bio publique, rien d'autre. Pas de compte privé, pas de contenu
  réservé aux abonnés.
- Si le réseau demande de se connecter plus que d'habitude, ou affiche une
  limite : tu t'arrêtes et tu me le dis.
- Aucune invention : « non affiché » quand ce n'est pas écrit.
```

## Prompt 3 — Le message d'approche

À faire écrire par Claude une fois la liste prête. C'est Beau qui envoie.

```
Écris-moi le message WhatsApp que je vais envoyer à ce vendeur pour lui
proposer d'ouvrir sa boutique sur Finjaro.

LE VENDEUR : [nom, ce qu'il vend, ville, pays]

Le message doit :
- faire 4 lignes maximum, se lire sur un téléphone, en [français]
- commencer par quelque chose de VRAI et de précis sur SA boutique à lui,
  pris dans ce que j'ai relevé — pas une formule qui marcherait pour
  n'importe qui
- dire ce que Finjaro lui apporte concrètement : une boutique en ligne, ses
  articles visibles, ses clientes qui commandent sans qu'elle ait à tout
  retaper dans une conversation
- dire que **c'est gratuit jusqu'en novembre**, avec le mois écrit. Pas
  « gratuit » tout court : un service gratuit sans limite est lu comme un
  service sans valeur. La date fait comprendre que ça vaut quelque chose et
  qu'il y a une raison de s'y mettre maintenant. Décision de Beau.
- finir par une question simple, à laquelle on répond par oui ou non

Interdits absolus :
- AUCUN chiffre que je ne t'ai pas donné. Pas de « des milliers d'acheteurs »,
  pas de « X vendeuses nous ont rejoints ». Si le chiffre n'est pas mesuré, il
  ne s'écrit pas.
- AUCUNE phrase qui enferme Finjaro dans un pays. Pas de « la place de marché
  camerounaise », pas de « partout au pays ». Finjaro est ouverte au monde.
- Pas de promesse de gain et pas de fausse urgence. La date de novembre n'en
  est pas une : elle est vraie et c'est Beau qui l'a fixée. En revanche, pas
  de « plus que 3 places », pas de compte à rebours inventé.
- Tu écris le message. Tu ne l'envoies pas.
```

## Prompt 5 — TikTok: 15 messages par jour, ceux qui se lancent

Demandé par Beau le 18/09. Cible: des prestataires de services **qui
démarrent** — peu de vues, peu d'abonnés, mais qui ont publié récemment.
Répartition voulue: **10 en Europe, 5 au pays**.

**Pourquoi ceux qui démarrent.** Chrome-Paris l'a mesuré le matin même: les
petits comptes actifs répondent mieux que les gros. Ce sont eux qui manquent
de visibilité et qui en cherchent. Un gros compte n'a rien à gagner.

**Le filtre qui compte n'est pas le nombre d'abonnés, c'est la date de la
dernière publication.** Un compte à 20 000 abonnés muet depuis un an ne
répondra pas; un compte à 300 abonnés qui a publié hier, oui.

⚠️ **Deux limites réelles, elles sont dans le prompt.**

1. **TikTok n'autorise souvent le message privé que si la personne vous
   suit.** Une grande partie des profils seront injoignables en privé. Le
   repli est le numéro affiché dans la bio, et on écrit sur WhatsApp.
2. **TikTok restreint les comptes qui envoient beaucoup de messages.** 15 par
   jour, espacés, textes tous différents: c'est le plafond raisonnable. Un
   compte restreint ne revient pas.

**La salle commune est dans le prompt.** Les Claude de Chrome ne reçoivent
aucune notification: ils ne lisent l'issue #16 que si on le leur demande. Le
bloc « AVANT DE COMMENCER » le fait une fois, au début, et une fois à la fin.
C'est ce qui leur fait récupérer tout seuls les consignes qui ont changé
depuis la veille — sans que Beau ait à faire passer le mot à chaque onglet.

```
AVANT DE COMMENCER — une seule fois, maintenant.

Va lire cette page, c'est là que les différents Claude qui travaillent sur
Finjaro se parlent :
https://github.com/henribayemi025-hue/henribeaubayemi/issues/16

Lis les commentaires DU PLUS RÉCENT AU PLUS ANCIEN. Les consignes les plus
récentes l'emportent sur les anciennes, et sur ce prompt s'il y a conflit.
Dis-moi en trois lignes ce que tu en retiens, puis commence le travail.

À LA FIN de ta session, écris un commentaire sur cette même page avec
l'en-tête :
[QUI] Chrome-TikTok
[POUR] Alpha
[QUOI] ce que tu as appris, ce qui t'a bloqué, ta question s'il y en a une

⚠️ Ce dépôt est PUBLIC. Dans ce commentaire : AUCUN nom de personne, aucun
pseudo, aucun numéro, aucune adresse e-mail. Tu écris des métiers, des
villes, des nombres et des enseignements — jamais quelqu'un d'identifiable.

---

Je suis le fondateur de Finjaro, une place de marché en ligne ouverte au
monde entier. C'est mon compte TikTok. Je t'autorise à écrire aux gens en mon
nom, sans me redemander à chaque message.

OBJECTIF DU JOUR : 15 personnes maximum. Pas une de plus.
  - 10 en Europe (France, Belgique, Royaume-Uni, Allemagne, Italie, Espagne)
  - 5 au Cameroun (Douala et Yaoundé)

QUI JE CHERCHE : des prestataires de services qui DÉMARRENT — coiffure et
tresses, onglerie, maquillage, couture et retouches, traiteur et cuisine à
domicile, esthétique, photographie, petits travaux.

COMMENT LES TROUVER :
1. Passe par les mots-dièses, pas par la recherche de comptes : la recherche
   de comptes remonte surtout des comptes morts. Ouvre un mot-dièse du métier
   et de la ville, et relève les AUTEURS des publications récentes.
2. Garde un compte seulement s'il coche les trois :
   - il a publié dans les 7 derniers jours ;
   - ses vues sont faibles (quelques centaines, pas des dizaines de milliers) ;
   - c'est bien un professionnel qui vend un service, pas un particulier.
3. Le nombre d'abonnés n'est PAS un critère. Un petit compte actif vaut mieux
   qu'un gros compte endormi.
4. Tu ne juges l'origine ni la nationalité de personne. Tu ne te fondes que
   sur ce que le compte dit de lui-même dans sa bio et ses publications
   (par exemple « tresses », « couture », « traiteur »), et sur la ville
   qu'il affiche.

POUR CHAQUE PERSONNE, l'une après l'autre :
1. Ouvre son profil. Note : pseudo, métier, ville, pays, date de la dernière
   publication, abonnés, et le numéro s'il est affiché dans la bio.
2. Essaie de lui envoyer un message privé.
   - Si TikTok refuse parce qu'elle ne me suit pas : tu N'INSISTES PAS. Tu
     notes « MP fermé » et tu relèves son numéro de bio pour que je lui écrive
     sur WhatsApp. S'il n'y a pas de numéro, tu passes au suivant.
3. Le message fait 3 à 4 lignes, et il COMMENCE par quelque chose de vrai et
   de précis sur SA publication à elle — ce qu'elle a montré, pas une formule
   qui marcherait pour n'importe qui.
4. Attends 3 à 5 minutes entre deux envois. Jamais deux d'affilée.
5. Note dans un tableau : Pseudo | Métier | Ville | Pays | Abonnés |
   Dernière publi | MP envoyé oui/non/fermé | Numéro bio | Message envoyé.

CE QUE LE MESSAGE DIT :
- qu'on a vu son travail et ce qu'on y a aimé (précis) ;
- qu'elle peut présenter son travail sur Finjaro : elle publie une fois, sa
  page reste en ligne, et ses clientes retrouvent tout au même endroit — au
  lieu de republier à chaque fois ;
- que c'est GRATUIT JUSQU'EN NOVEMBRE. Le mois s'écrit. Jamais « gratuit »
  tout court : un service gratuit sans limite est lu comme un service sans
  valeur.
- qu'il y a aussi Finjaro Accounting pour suivre son stock et ses ventes ;
- et ça finit par une question simple, à laquelle on répond par oui ou non.

INTERDITS, ils comptent plus que le nombre :
- JAMAIS mon nom ni mon prénom. On écrit « nous faisons partie de Finjaro ».
- Chaque message est DIFFÉRENT. Un texte identique répété fait restreindre le
  compte en quelques heures.
- AUCUN chiffre que je ne t'ai pas donné. Pas de « des milliers d'acheteurs »,
  pas de « X vendeuses nous ont rejoints ».
- AUCUNE phrase qui enferme Finjaro dans un pays. Pas de « la place de marché
  camerounaise », pas de « partout au pays ».
- Ne promets PAS de publier ses articles à sa place.
- Pas de fausse urgence autour de novembre : pas de « plus que 3 places », pas
  de compte à rebours. La date est vraie, ça suffit.
- Si TikTok affiche un avertissement, une limite, ou refuse un envoi : tu
  ARRÊTES TOUT et tu me préviens. Tu ne contournes rien, tu ne changes pas de
  compte, tu ne reprends pas plus tard sans me le dire.
- Si quelqu'un répond pendant que tu travailles : tu me le signales et tu ne
  réponds pas à sa place.
- À 15 personnes, tu t'arrêtes. Même si ça marche bien.

À LA FIN : le tableau complet, plus le compte des MP envoyés, des MP fermés,
et des personnes sautées avec la raison.
```

**Ce qu'il faut me remonter le lendemain**, et qui vaut plus que le tableau:
**ce que les gens ont répondu**, mot pour mot. « je n'ai pas compris », « ça
coûte combien », « c'est où » sont trois problèmes différents, et aucun ne se
devine depuis la base.

---

## Prompt 4 — Trouver le bon site dans un pays que je ne connais pas

```
Je veux trouver des vendeurs de [ce que je cherche] en [pays].

Dis-moi les 3 sites où les petits vendeurs de ce pays publient leurs annonces
avec leur numéro de téléphone visible — le genre de site qui remplace le
journal de petites annonces. Pour chacun : le nom, l'adresse, et si le numéro
du vendeur y est affiché ou caché derrière un formulaire.

Ne me propose pas Facebook : je sais déjà, et ça bloque.
```

---

## Où chercher, par région

Le tableau sert à remplir la variable SITE du prompt 1.

| Région | Sites où le numéro est public |
| --- | --- |
| **Partout** | **Google Maps** — le seul vraiment mondial. Chaque commerce avec son numéro. |
| Afrique francophone | CoinAfrique, Afribaba, Expat-Dakar (Sénégal) |
| Nigeria, Kenya, Ghana, Ouganda, Tanzanie | Jiji |
| Afrique du Nord, Europe de l'Est, Asie du Sud | OLX |
| France | Leboncoin |
| Royaume-Uni, Australie | Gumtree |
| Canada | Kijiji |
| États-Unis | Craigslist, Facebook Marketplace (bloque) |
| Amérique latine | MercadoLibre |
| Pays-Bas, Belgique | Marktplaats, 2dehands |
| Asie du Sud-Est | Carousell, Shopee |
| Japon, États-Unis | Mercari |
| Créateurs, artisanat, monde entier | Etsy, Depop, Vinted |

**Commencer par Google Maps.** C'est le seul qui marche à l'identique dans
tous les pays, et le seul où Claude ne fait que lire une fiche publique.

---

## Ce qui n'est PAS dans ces prompts, et pourquoi

- **L'envoi ne passe que par WhatsApp** (prompt 1 bis), vers un numéro que le
  vendeur a publié lui-même. Sur Instagram, TikTok et Facebook, les prompts
  collectent seulement: un compte qui y envoie en rafale est restreint en
  quelques heures, et on perd l'outil.
- **Aucune récolte de masse.** Trente fiches lues à la main ressemblent à
  quelqu'un qui cherche. Trois mille ressemblent à un robot, et se traitent
  comme tel.
- **Aucun chiffre inventé** dans le message d'approche. C'est la règle de
  Finjaro, elle vaut aussi quand on recrute.
- **Aucun texte qui enferme Finjaro dans un pays.** Le Cameroun est là où on
  commence, pas ce que Finjaro est.

## Le rappel qui vaut plus que ces prompts

Mesuré le 18/09 : 82 inscriptions → 57 boutiques → 38 avec au moins un
article. L'entonnoir vendeuses se tient. Le mur est côté acheteuses. Recruter
cinquante vendeuses de plus ne débloquera pas le chiffre qui bloque.
