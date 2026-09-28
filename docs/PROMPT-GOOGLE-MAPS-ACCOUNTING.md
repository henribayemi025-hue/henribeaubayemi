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

## Le message à envoyer ensuite

Beau a tranché le 28/09 : **Accounting est gratuit jusqu'en novembre**, comme
la place de marché. La date s'écrit toujours — un service annoncé gratuit sans
limite se lit comme un service sans valeur.

### Version e-mail (Google Maps)

> **Objet :** Votre caisse et votre comptabilité au même endroit
>
> Bonjour,
>
> Nous faisons partie de Finjaro. Nous avons vu votre commerce et nous vous
> écrivons parce que ce que nous construisons a été pensé pour des maisons
> comme la vôtre.
>
> Finjaro Accounting, c'est un comptoir de vente simple, le stock qui suit
> tout seul, et la comptabilité qui se tient d'elle-même — journal, bilan,
> audit — sans que vous ayez à y penser. Vous ouvrez votre caisse le matin,
> vous encaissez, et le soir vos livres sont à jour.
>
> Vous pouvez travailler à plusieurs sur le même espace : le caissier, le
> gérant, le comptable, chacun avec ses droits.
>
> **C'est gratuit jusqu'en novembre**, sans carte bancaire. Les commerces
> inscrits avant novembre gardent la gratuité.
>
> accounting.finjaro.net
>
> L'équipe Finjaro — finjaro.net
> *Pour ne plus recevoir nos messages, répondez « stop ».*

### Version message privé (Instagram, WhatsApp)

Plus court, et **sans la ligne de désabonnement** — sur un réseau social la
personne bloque en un geste, la ligne fait administratif. Dans un e-mail elle
reste obligatoire : c'est la loi.

> Bonjour, nous faisons partie de Finjaro. On a vu votre boutique — et on
> vient de sortir un outil qui pourrait vous servir : votre caisse, votre
> stock et votre comptabilité au même endroit, qui se tient toute seule.
> C'est gratuit jusqu'en novembre. accounting.finjaro.net

### Version pour une vendeuse DÉJÀ sur finjaro.net (le groupe A du test)

C'est l'argument le plus fort, parce qu'il est vrai et qu'il ne demande aucun
effort : **le pont existe déjà en base.**

> Bonjour, c'est Finjaro. Vous vendez déjà chez nous — et vos ventes peuvent
> maintenant tenir votre comptabilité toutes seules. Quand une commande est
> livrée, elle devient une écriture dans vos livres : vous n'avez rien à
> ressaisir. Votre caisse, votre stock et vos comptes au même endroit.
> C'est gratuit jusqu'en novembre. accounting.finjaro.net

### Ce qui ne bouge pas

- **La ligne de désabonnement est obligatoire dans un e-mail.**
- Aucun nom de personne : « nous faisons partie de Finjaro ».
- **Aucun chiffre non mesuré** : ne jamais écrire « des centaines de
  commerçants », ni combien de gens l'utilisent.
- Aucune phrase qui enferme Finjaro dans un pays.
- **Rien ne part avant que Beau l'ait dit.**

---

