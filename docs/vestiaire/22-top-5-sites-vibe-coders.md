# 22 — « Top 5 Sites pour Vibe Coders — Édition Niche » (page Notion)

- **Source** : https://rocky-cannon-2d6.notion.site/Top-5-Sites-pour-Vibe-Coders-dition-Niche-3861bf8e666f8084bfecdbd085110e90
- **Type** : page Notion publique
- **Accès** : la lecture directe de la page n'a rien donné (la page est construite par JavaScript et l'outil de lecture ne voit qu'un en-tête « Notion »). J'ai donc lu son contenu par l'interface publique de Notion (`loadCachedPageChunk`) : **lue en entier**, soit 42 blocs (5 sections, un tableau de 5 lignes, une citation). La page ne donne ni auteur ni date. D'après ses métadonnées, elle a été créée le 21/06/2026. J'ai ensuite ouvert les cinq sites cités pour vérifier ce qu'ils sont, ce qu'ils coûtent et sous quelle licence, sans créer de compte : `ui.aceternity.com` (accueil, prix, licence), `styles.refero.design` (accueil), `mobbin.com/pricing`, l'adresse de Godly, `10x.app`, et le dépôt `10x-app-builder/10x` (README et LICENSE lus, rien exécuté).
- **Licence / droits** :
  - **la page** : aucune licence indiquée (tous droits réservés par défaut). On n'en reprend pas le texte.
  - **les sites** : tous commerciaux. Aceternity UI a sa propre licence (voir Limites). Mobbin est payant. Refero Styles se consulte gratuitement. Le dépôt de 10X est sous **PolyForm Noncommercial 1.0.0**, qui n'est pas une licence libre : usage commercial interdit.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Une courte liste de cinq sites pour « donner du goût » à une IA qui code, chacun avec « ce que c'est » et « pourquoi l'utiliser » :
- **Aceternity UI** : composants React animés à copier-coller ;
- **Refero Styles** : des fichiers de style (couleurs, typographie, espacements, composants) tirés de sites connus, à donner à l'IA ;
- **Mobbin** : une base de captures d'écrans d'applications, classées par parcours ;
- **Godly** : une galerie de sites pour s'inspirer ;
- **10X** : un outil qui génère une application iOS à partir d'une description.

Un tableau les enchaîne en cinq étapes : s'inspirer, trouver le modèle d'écran, donner du goût à l'IA, accélérer, sortir une app. La page se termine par une phrase juste : le « vibe coding » ne consiste pas à laisser l'IA deviner, mais à lui donner de bonnes références.

## Ce qui est vraiment utile pour Finjaro et Léo
- **L'idée de Refero Styles, retournée à notre avantage** : un fichier qui décrit un style d'interface (couleurs, typographie, espacements, composants, animations) et qu'on donne à l'IA avant qu'elle code. On ne va pas emprunter le style d'un autre site. On va **écrire le nôtre** : celui de Finjaro, tiré du code réel. C'est la meilleure protection contre les pages génériques, et contre les agents qui « rabotent » le style vintage.
- **Mobbin et Godly, utilisés comme références** : pour un parcours précis (un panier, une inscription de vendeuse, une page de réglages), regarder comment de grandes applications le font. La page dit « donne-le à ton IA et demande-lui de le reproduire ». Nous, on en tire une **leçon** (l'ordre des étapes, ce qui est montré en premier), jamais une copie.
- **Le tableau en cinq étapes** rappelle un bon ordre : regarder, choisir un modèle de parcours, fixer le style, puis seulement produire.
- **10X** ne sert pas Finjaro : nos applications Android et iOS chargent déjà finjaro.net (CLAUDE.md §5).

## Pour quels agents de Léo
- **Ada Nkemba** et **Claude** : ils codent les écrans. La fiche de style maison et la méthode « modèle → leçon » leur servent tous les jours.
- **Miroir** : la fiche de style lui donne une référence objective pour juger la cohérence d'une page, sans imposer son goût.
- **Forge** : c'est lui qui donne la fiche de style aux outils IA qui génèrent du code ou des visuels.
- **Vigie** : suivre ces sites comme sources d'inspiration, en notant prix et licences.
- **Plume** : ses visuels de réseaux sociaux doivent suivre la même fiche de style.

## Compétences à tirer (pour Mentor)

**Tenir la fiche de style d'interface de Finjaro** — Ada Nkemba, Claude, Miroir, Forge
Quand s'en servir : avant de demander un écran à une IA, et chaque fois que le style change dans le code.
Comment faire : tiens un seul fichier qui décrit le style réel de Finjaro, tiré du code et non inventé :
- les couleurs, avec leur nom (crème, terracotta, laiton) et leur code, et l'usage de chacune ;
- les polices et la taille des grands titres ;
- les espacements, les arrondis, les ombres ;
- les composants existants (bouton, carte article, prix) ;
- les animations admises ;
- ce qui est interdit (style minimaliste gris, dégradés gadgets, photos prises sur le web).
Donne ce fichier à toute IA qui code ou génère un visuel, avant la demande. Quand Beau valide un changement de style, mets le fichier à jour le jour même.
Piège : importer la fiche de style d'un autre site « parce qu'elle est belle ». Le style de Finjaro est celui de Beau, on ne le remplace pas.
*Source : inspiré de l'idée de fichier de style de Refero Styles, citée par la page Notion (aucun texte repris).*

**S'inspirer d'un écran existant sans le recopier** — Ada Nkemba, Miroir, Vigie
Quand s'en servir : quand on conçoit un parcours déjà courant ailleurs (panier, inscription, suivi de commande).
Comment faire :
1. Regarde trois à cinq exemples dans des applications différentes.
2. Pour chacun, note en une ligne le modèle (« le total reste visible pendant tout le paiement ») et la raison qui le rend utile.
3. Garde les leçons qui servent nos utilisateurs et notre style, puis dessine l'écran avec les composants de Finjaro.
4. Cite dans ta note d'où vient chaque leçon.

Ne colle jamais une capture d'écran d'une autre marque en demandant « refais pareil » : ce serait recopier son travail et effacer notre style.
Piège : un modèle qui marche pour une grande marque américaine, mais pas pour une vendeuse qui paie depuis un téléphone modeste. Vérifie le poids de la page et le parcours sur téléphone.
*Source : inspiré de l'usage de Mobbin et Godly proposé par la page Notion, corrigé (la page conseille de reproduire, nous non).*

## Limites, risques, prudence
- **Aceternity UI** : il y a des composants gratuits et une offre payante (169 $ par an, 199 $ à vie, 1 590 $ pour une équipe, prix relevés le 24/09/2026 et affichés en promotion). La licence permet de les utiliser dans nos propres sites et applications. Elle interdit de les redistribuer ou de les revendre sur une place de marché, y compris sous forme de gabarits. Finjaro vend des articles, pas des gabarits, donc ce n'est pas un blocage. Mais il faut s'en souvenir si un jour Finjaro vend des outils. Les composants sont très animés, ce qui convient mal à un site qui doit rester léger sur téléphone.
- **Refero Styles** : on parcourt et on copie les fichiers gratuitement. La connexion de son IA au service semble faire partie d'une offre plus complète, dont je n'ai pas trouvé le prix. Aucune condition n'est affichée sur les droits des styles tirés de sites tiers. Raison de plus pour écrire notre propre fichier.
- **Mobbin** : offre gratuite limitée (pas de recherche, pas de parcours complets, pas d'animations). L'offre Pro coûte 10 $ par mois en paiement annuel, l'offre Équipe 16 $ par personne et par mois (relevé le 24/09/2026). Pas nécessaire aujourd'hui.
- **Godly** : l'adresse godly.website renvoie désormais vers « recent.design », une galerie gratuite financée par des annonces. Je n'ai pas trouvé d'explication officielle de ce changement. La page Notion donne d'ailleurs directement ce lien de redirection.
- **10X** : il faut un Mac (macOS 14 ou plus). Sa promesse (« de l'idée à l'App Store en quelques minutes, sans savoir coder ») n'a pas été vérifiée, et la publication sur l'App Store demande de toute façon un compte développeur Apple payant et une revue (fiche 03). Des sites tiers annoncent un modèle à crédits (offre gratuite avec 5 $ de crédits, 20 $ puis 200 $ par mois). Je ne l'ai pas vu sur la page officielle, donc c'est non vérifié. Son code source est public mais sous licence non commerciale, ce qui n'est pas de l'open source.
- **Coquille dans le tableau** : l'étape 3 écrit « Referral Styles » au lieu de « Refero Styles ».
- Page anonyme et non datée à l'affichage. Les prix et offres changent : tout est à revérifier avant usage.

## Verdict
**Retenu pour deux compétences** :
- tenir la fiche de style d'interface de Finjaro (Ada Nkemba, Claude, Miroir, Forge) ;
- s'inspirer d'un écran existant sans le recopier (Ada Nkemba, Miroir, Vigie).

Mobbin, Godly et Refero sont **gardés en réserve** comme sources d'inspiration à consulter, sans abonnement. Aceternity UI est **gardé en réserve** pour Claude, licence lue. **10X est mis de côté** : Finjaro a déjà ses applications, l'outil demande un Mac, et son code n'est pas libre pour un usage commercial.
