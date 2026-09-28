# Prospection Accounting — le prompt à donner à Claude dans Chrome

Demandé par Beau le 28/09 : « un prompt que je vais envoyer sur Google Maps
sur Claude pour qu'ils prennent les mails des gens les plus susceptibles
d'accepter d'utiliser Finjaro Accounting… ensuite je vais faire de même sur
Insta, 10 personnes face à 10 ».

---

## D'abord ma réponse à « je sais pas si ça sera marketplace ou normal »

Tu m'as dit de réfléchir et de calculer. Voici ce que les chiffres disent, et
ils sont sans ambiguïté.

**Ce qui se passe aujourd'hui quand quelqu'un s'inscrit sur Accounting**
(mesuré, comptes de test exclus, du 10 au 23/09) :

| | |
|---|---|
| Comptes créés | 8 |
| Ont nommé leur entreprise | 7 |
| **Ont enregistré un article** | **0** |
| Ont enregistré une vente | 2 |
| Sont revenus un autre jour | **1 sur 8** |

**Personne, jamais, n'a saisi un article.** Le mur n'est pas l'inscription,
c'est le catalogue : taper son stock article par article sur un téléphone,
avant d'avoir vu le moindre bénéfice.

**Et il existe déjà un chemin qui saute ce mur.** Quand une commande de la
place de marché passe à « livrée », elle devient automatiquement une vente
dans l'espace Accounting de la vendeuse — zéro saisie. Ce pont s'est
déclenché **deux fois**, et les deux fois il a échoué pour une seule raison :
`espace_absent`. **La vendeuse n'avait pas de compte Accounting.**

Deux vraies ventes auraient rempli une comptabilité toutes seules.

### Donc : les deux, mais pas au même titre

- **Les vendeuses de la place de marché** sont le groupe à la plus forte
  probabilité, et de loin : leur catalogue est **déjà dans Finjaro**, le pont
  existe, et elles nous connaissent. C'est le seul groupe où Accounting se
  remplit sans effort.
- **Google Maps / Instagram** amène des gens qui devront tout taper. C'est
  exactement le profil des 8 qui se sont arrêtés.

**Ma recommandation : le face-à-face de 10 contre 10 doit opposer ces deux
groupes**, pas deux messages. Parce que la question qui décide de tout n'est
pas « quel texte marche », c'est **« est-ce qu'avoir déjà son catalogue change
tout ? »**. Si oui, la prospection froide sur Accounting est une perte de
temps tant que l'import n'existe pas, et on met l'énergie sur la place de
marché.

Et dans les deux cas : **envoyer 20 personnes dans un parcours où 8 sur 8 se
sont arrêtées, c'est brûler 20 contacts.** Le test vaut pour apprendre, pas
pour convertir. Je le dis franchement, la décision reste la tienne.

---

## Le face-à-face, à mesurer honnêtement

| | Groupe A | Groupe B |
|---|---|---|
| Qui | 10 vendeuses déjà sur finjaro.net | 10 commerces trouvés sur Google Maps |
| Ce qu'on leur dit | « vos ventes Finjaro deviennent votre comptabilité, sans rien taper » | « votre caisse et votre comptabilité au même endroit » |
| Ce qu'on compte | comptes créés · **articles saisis** · ventes · revenus le lendemain | idem |

**Le chiffre qui tranche n'est pas « combien se sont inscrits ». C'est
« combien ont enregistré un premier article ou une première vente », et
« combien sont revenus un autre jour ».** Aujourd'hui ces deux chiffres valent
0 et 1 sur 8. Tout ce qui les fait bouger est un vrai résultat.

Je peux mesurer les deux groupes dans la base sans rien te demander.

---

## Qui viser sur Google Maps, et pourquoi

Le critère n'est pas la taille : c'est **avoir déjà une liste de prix
quelque part**. Quelqu'un qui possède un catalogue papier, un tableur ou un
catalogue WhatsApp peut démarrer ; quelqu'un qui n'a rien devra tout inventer
au clavier, et s'arrêtera comme les huit autres.

**Viser, dans cet ordre :**

1. **Pharmacies et parapharmacies** — beaucoup de références, une liste de
   prix qui existe déjà, un besoin quotidien de stock.
2. **Quincailleries, magasins de matériaux, pièces détachées** — même raison,
   et la comptabilité leur est déjà imposée.
3. **Boutiques de cosmétiques, prêt-à-porter, chaussures** avec un catalogue
   visible en ligne.
4. **Restaurants, snacks, pâtisseries** — peu de références, beaucoup de
   petites ventes : le comptoir a une valeur immédiate.
5. **Salons de coiffure et instituts** — prestations à prix fixes, donc une
   « liste » qui existe déjà dans leur tête et sur leur mur.

**À écarter :** les professions de service avec peu de factures (conseil,
avocat, architecte). Elles n'ont pas de stock, pas de comptoir, et un carnet
leur suffit. Elles ne répondront pas, ou pire, elles répondront et
n'utiliseront rien.

**Le filtre qui compte le plus, appris sur la place de marché :** pas le
nombre d'avis, mais **la date de la dernière activité**. Une fiche sans photo
ni avis depuis un an est un commerce qui ne cherche rien.

---

## LE PROMPT — à copier tel quel dans Claude sur Chrome

> Tu travailles sur Google Maps dans ce navigateur. Objectif : constituer une
> liste de commerces qui ont de fortes chances d'adopter un outil de caisse et
> de comptabilité, et relever leur adresse e-mail publique.
>
> **Ville à traiter :** [Beau écrit la ville ici]
>
> **Cherche, dans cet ordre :** pharmacie · parapharmacie · quincaillerie ·
> magasin de matériaux · pièces détachées · boutique de cosmétiques ·
> prêt-à-porter · chaussures · restaurant · snack · pâtisserie · salon de
> coiffure · institut de beauté.
>
> **Garde une fiche seulement si les trois conditions sont réunies :**
> 1. elle montre une activité récente — photos ou avis de moins de six mois ;
> 2. elle a une **adresse e-mail publique** sur la fiche ou sur le site lié
>    (pas de numéro seul : le but ici, ce sont les e-mails) ;
> 3. c'est un commerce avec des produits ou des prestations à prix fixes,
>    pas un cabinet de conseil ni une profession libérale.
>
> **Écarte** toute fiche fermée définitivement, toute chaîne ou franchise
> nationale, et tout ce qui n'a pas publié depuis plus d'un an.
>
> **Ce que tu me rends**, en tableau, une ligne par commerce :
> `nom du commerce | catégorie | ville/quartier | e-mail | date du dernier
> signe d'activité | ce qui te fait penser qu'il est preneur (une phrase)`
>
> **Arrête-toi à 25 fiches retenues**, ou quand tu as épuisé les recherches.
>
> **Ce que tu ne fais PAS :**
> - tu n'envoies **aucun message, aucun e-mail** — tu prépares, Beau décide ;
> - tu ne publies **aucun nom de personne, e-mail, téléphone ou adresse** dans
>   l'issue GitHub n° 16 : ce dépôt est **public**. Là-bas tu écris seulement
>   des catégories, des villes et des nombres. Les coordonnées, tu les donnes
>   à Beau directement dans cette conversation ;
> - tu n'inventes aucun chiffre. Si tu ne sais pas, tu écris « inconnu ».
>
> Quand tu as fini, dis-moi combien de fiches tu as ouvertes, combien tu en as
> retenues, et **pourquoi tu as écarté les autres** — cette raison m'intéresse
> autant que la liste.

---

## Le message à envoyer ensuite — ⏳ il manque UNE décision de Beau

Je ne l'écris pas encore complètement, parce qu'il manque un élément, et
l'inventer serait exactement ce qu'on s'interdit.

**Accounting n'annonce aujourd'hui aucun prix.** L'écran d'inscription dit
seulement « Gratuit pour démarrer — aucune carte bancaire ». La place de
marché, elle, a une règle claire : « gratuit jusqu'en novembre », avec la date
toujours écrite.

⏳ **Beau : est-ce qu'Accounting est gratuit jusqu'en novembre lui aussi, ou
est-ce qu'il reste gratuit sans date ?** Dès que tu réponds, j'écris le
message en une minute — il est déjà prêt dans ma tête, il ne lui manque que
cette phrase.

Ce qui est certain d'avance, et qui ne changera pas :
- **la ligne de désabonnement est obligatoire dans un e-mail.** C'est la loi,
  pas une préférence ;
- aucun nom de personne dans le message : « nous faisons partie de Finjaro » ;
- aucun chiffre non mesuré : pas de « des centaines de commerçants » ;
- aucune phrase qui enferme Finjaro dans un pays ;
- **rien ne part avant que tu l'aies dit.**
