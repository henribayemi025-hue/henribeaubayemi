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
   qui marcherait pour n'importe qui.
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
- Pas de promesse de gain, pas de fausse urgence, pas d'« offre limitée ».
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
- dire ce que Finjaro lui apporte concrètement : une boutique en ligne
  gratuite, ses articles visibles, ses clientes qui commandent sans qu'elle
  ait à tout retaper dans une conversation
- finir par une question simple, à laquelle on répond par oui ou non

Interdits absolus :
- AUCUN chiffre que je ne t'ai pas donné. Pas de « des milliers d'acheteurs »,
  pas de « X vendeuses nous ont rejoints ». Si le chiffre n'est pas mesuré, il
  ne s'écrit pas.
- AUCUNE phrase qui enferme Finjaro dans un pays. Pas de « la place de marché
  camerounaise », pas de « partout au pays ». Finjaro est ouverte au monde.
- Pas de promesse de gain, pas de fausse urgence, pas de « offre limitée ».
- Tu écris le message. Tu ne l'envoies pas.
```

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
