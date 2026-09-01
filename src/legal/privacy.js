// Politique de confidentialité — Finjaro.
//
// Page PUBLIQUE et autonome, accessible sans connexion: c'est une exigence
// formelle du Google Play Console ET de l'App Store d'Apple, qui refusent une
// URL derrière un mur d'authentification, et qui n'acceptent pas non plus un
// simple article noyé dans les CGU (l'article 15 de terms.js ne suffit donc
// pas — il reste, mais renvoie ici pour le détail).
//
// Le contenu ci-dessous décrit ce que l'application collecte RÉELLEMENT,
// vérifié le 07/08/2026 contre le schéma de la base et la liste des fonctions
// edge, pas contre un modèle générique:
//   • profiles      -> name, phone, address, city, country, locale, currency,
//                      avatar_url, referral_code/referred_by
//   • shops         -> whatsapp, phone, instagram, lat/lng, pièce d'identité
//                      (bucket `ids`, PRIVÉ — le seul bucket non public)
//   • orders        -> buyer_name, buyer_phone, address, city, country
//   • conversations/messages, reviews, favorites
//   • push_subscriptions -> endpoint + clés du navigateur
//   • events        -> mesure d'audience PREMIÈRE PARTIE (aucun Google
//                      Analytics)
// Depuis le 01/09: un pixel Meta (Facebook/Instagram Ads) mesure les
// campagnes de pub, mais UNIQUEMENT sur le site (src/lib/pixel.js se
// désactive lui-même dans les apps natives, voir son commentaire) et
// UNIQUEMENT après consentement explicite (src/components/CookieConsent.jsx)
// — jamais par défaut. Si ce périmètre change (pixel actif en app, ou sans
// bandeau), ce document doit être corrigé AVANT, pas après.
// Sous-traitants réellement appelés: Supabase (eu-west-3 Paris), Cloudflare,
// Google Gemini (generativelanguage.googleapis.com), Resend, Google Sign-In.
// Stripe est présent dans le code mais le paiement par carte est MASQUÉ depuis
// le 01/08 (voir CheckoutCOD.jsx): aucun paiement n'est encaissé dans l'app
// aujourd'hui. Si le paiement carte est réactivé, CE DOCUMENT DOIT ÊTRE MIS À
// JOUR, ainsi que la déclaration "Sécurité des données" du Play Console.
//
// Structure identique à terms.js : { fr | en } -> { title, sections[] }.
// Les paragraphes commençant par "• " sont rendus comme des puces.

export const CONTACT_EMAIL = 'fin.finjaro@gmail.com';
export const PRIVACY_VERSION = '1.0';

const fr = {
  title: 'Politique de confidentialité',
  updatedLabel: 'Dernière mise à jour',
  updatedAt: '7 août 2026',
  versionLabel: 'Version',
  preamble: [
    'La présente politique explique quelles données personnelles Finjaro collecte lorsque vous utilisez la plateforme (site finjaro.net et applications mobiles), pourquoi elle les collecte, avec qui elle les partage, combien de temps elle les conserve et quels sont vos droits.',
    'Elle est rédigée pour être lue et comprise sans connaissance juridique. En cas de question, écrivez-nous : ' + CONTACT_EMAIL + '.',
  ],
  sections: [
    {
      id: 'responsable',
      title: '1. Qui est responsable de vos données',
      body: [
        'Finjaro exploite la plateforme finjaro.net et les applications mobiles associées, et détermine les finalités et les moyens des traitements décrits ci-dessous.',
        `Pour toute question relative à vos données personnelles, ou pour exercer l’un des droits décrits à l’article 9, écrivez à ${CONTACT_EMAIL}.`,
      ],
    },
    {
      id: 'donnees',
      title: '2. Les données que nous collectons',
      body: [
        'Nous ne collectons que les données nécessaires au fonctionnement du service. Concrètement :',
        '• Compte : votre adresse e-mail, votre nom ou pseudonyme, et votre mot de passe (jamais stocké en clair — uniquement sous forme chiffrée irréversible). Si vous vous connectez avec Google, nous recevons votre e-mail, votre nom et votre photo de profil Google.',
        '• Profil : numéro de téléphone, pays, ville, adresse de livraison enregistrée, photo de profil, langue et devise préférées.',
        '• Commandes : nom, numéro de téléphone, adresse et ville de livraison, contenu et montant de la commande, statut et historique de la livraison.',
        '• Vendeuses et vendeurs : nom de la boutique, description, photos, numéro de téléphone, WhatsApp, compte Instagram, catégories, horaires, zones de livraison, ainsi que la position géographique de la boutique si vous choisissez de la renseigner.',
        '• Vérification d’identité (vendeuses et vendeurs uniquement) : si vous demandez le badge « identité vérifiée », la copie de la pièce d’identité que vous téléversez. Voir l’article 5.',
        '• Messages : le contenu des conversations échangées entre acheteuses et boutiques via la messagerie de la plateforme.',
        '• Avis : la note et le commentaire que vous publiez après une commande, associés à votre nom public.',
        '• Notifications : si vous les activez, l’identifiant technique de notification fourni par votre navigateur ou votre téléphone.',
        '• Contenus publiés : photos d’articles, vidéos, images envoyées dans la messagerie ou à l’assistante IA.',
        '• Usage : pages et fiches consultées, recherches effectuées, articles mis en favori, afin de mesurer l’audience et d’améliorer le service.',
        '• Techniques : adresse IP, type d’appareil et de navigateur, date et heure de connexion, journaux de sécurité.',
        'Nous ne collectons PAS : vos coordonnées bancaires (aucun paiement n’est encaissé dans l’application, voir l’article 7), votre localisation en arrière-plan, vos contacts, votre agenda, ni le contenu d’autres applications de votre téléphone.',
      ],
    },
    {
      id: 'finalites',
      title: '3. Pourquoi nous utilisons ces données',
      body: [
        '• Créer et gérer votre compte, vous authentifier et sécuriser vos accès.',
        '• Afficher les annonces, permettre la recherche et vous mettre en relation avec les boutiques.',
        '• Traiter les commandes : transmettre à la boutique les informations nécessaires pour vous livrer, suivre l’avancement, gérer les annulations et les litiges.',
        '• Vous envoyer les notifications et e-mails liés à votre activité (commande acceptée, expédiée, message reçu, rappels).',
        '• Faire fonctionner l’assistante Finia et le Miroir IA lorsque vous les utilisez. Voir l’article 4.',
        '• Lutter contre la fraude, les faux comptes, les annonces illicites et les abus, et faire respecter nos Conditions.',
        '• Mesurer l’audience de manière agrégée pour améliorer la plateforme.',
        '• Respecter nos obligations légales et répondre aux demandes des autorités compétentes.',
        'Selon votre pays de résidence, ces traitements reposent sur l’exécution du contrat qui nous lie (compte, commandes), sur votre consentement (notifications, vérification d’identité, fonctions d’IA que vous déclenchez vous-même), sur notre intérêt légitime (sécurité, lutte contre la fraude, amélioration du service) ou sur une obligation légale.',
      ],
    },
    {
      id: 'ia',
      title: '4. Assistante Finia, Miroir IA et fonctions d’intelligence artificielle',
      body: [
        'Finjaro propose plusieurs fonctions d’intelligence artificielle : l’assistante de discussion Finia, le Miroir IA (essayage virtuel), l’aide à la publication pour les vendeuses, la lecture automatique d’une pièce d’identité et l’estimation d’articles.',
        'Ces fonctions s’appuient sur le service Google Gemini. Lorsque vous les utilisez, le contenu que vous fournissez à ce moment-là — votre message, la photo que vous envoyez, ou les informations de l’article concerné — est transmis à Google pour produire la réponse.',
        'Ces fonctions ne se déclenchent JAMAIS toutes seules : rien n’est envoyé tant que vous n’ouvrez pas l’assistante, n’envoyez pas un message ou ne lancez pas un essayage.',
        'Vos photos personnelles envoyées au Miroir IA servent uniquement à produire l’image demandée et à vous l’afficher. Elles ne sont pas publiées, ni utilisées pour identifier une personne, ni vendues.',
        'Nous n’utilisons pas vos conversations privées ni vos photos pour entraîner nos propres modèles d’intelligence artificielle.',
      ],
    },
    {
      id: 'identite',
      title: '5. Vérification d’identité des vendeuses et vendeurs',
      body: [
        'La vérification d’identité est facultative : elle sert uniquement à obtenir le badge « identité vérifiée », qui rassure les acheteuses. Vous pouvez vendre sans la demander.',
        'Si vous la demandez, la copie de votre pièce d’identité est stockée dans un espace PRIVÉ, séparé des photos publiques de la plateforme. Elle n’est jamais affichée sur votre boutique, ni visible par les autres utilisateurs, ni par les acheteuses.',
        'Seule l’équipe Finjaro y accède, et uniquement pour vérifier la concordance entre le document et les informations de la boutique.',
        'Le document est conservé le temps nécessaire à la vérification et à la preuve de celle-ci en cas de litige ou de contrôle. Vous pouvez en demander la suppression à tout moment, étant entendu que le badge sera alors retiré.',
      ],
    },
    {
      id: 'partage',
      title: '6. Avec qui vos données sont partagées',
      body: [
        'Finjaro ne vend pas vos données personnelles. Elles sont partagées uniquement dans les cas suivants :',
        '• Avec la boutique concernée, quand vous passez commande : votre nom, votre numéro de téléphone et votre adresse de livraison lui sont transmis, car c’est elle qui prépare et livre la commande. C’est le cœur du service : sans cela, la livraison est impossible.',
        '• Avec les autres utilisateurs, pour ce que vous publiez volontairement : votre nom public, votre photo de profil, vos avis, et — pour les boutiques — les coordonnées de contact que vous choisissez d’afficher.',
        '• Avec nos prestataires techniques, qui agissent sur nos instructions et n’ont pas le droit d’utiliser vos données pour leur propre compte. Voir la liste à l’article 7.',
        '• Avec les autorités compétentes, lorsque la loi nous y oblige, ou pour établir, exercer ou défendre un droit en justice.',
        'Sur le SITE finjaro.net (pas dans les applications mobiles), un pixel publicitaire Meta (Facebook/Instagram) mesure l’efficacité de nos campagnes de publicité. Il ne se déclenche qu’après votre accord explicite, donné via le bandeau affiché à la première visite — vous pouvez le refuser sans que cela limite l’usage de la plateforme. Aucun autre traceur publicitaire n’est utilisé, et les applications iOS et Android n’en contiennent aucun.',
      ],
    },
    {
      id: 'prestataires',
      title: '7. Nos prestataires et l’hébergement de vos données',
      body: [
        'Nous faisons appel aux prestataires suivants, chacun pour une fonction précise :',
        '• Supabase — hébergement de la base de données, des comptes et des fichiers. Les données sont hébergées dans l’Union européenne (région de Paris, France).',
        '• Cloudflare — diffusion du site et des applications, protection contre les attaques.',
        '• Google (Gemini) — fonctions d’intelligence artificielle décrites à l’article 4.',
        '• Google (Sign-In) — connexion avec un compte Google, si vous choisissez cette option.',
        '• Resend — envoi des e-mails de notification.',
        'Certains de ces prestataires sont établis hors de l’Union européenne, ou peuvent traiter des données depuis un pays tiers. Ces transferts sont encadrés par les garanties prévues par la réglementation applicable, notamment les clauses contractuelles types de la Commission européenne.',
        'Aucun paiement par carte bancaire n’est encaissé dans l’application à ce jour : les commandes se règlent à la livraison, directement entre vous et la boutique. Finjaro ne collecte donc aucune donnée de carte bancaire. Si un paiement en ligne est mis en service, la présente politique sera mise à jour avant son activation.',
      ],
    },
    {
      id: 'conservation',
      title: '8. Combien de temps nous conservons vos données',
      body: [
        '• Compte et profil : tant que votre compte existe, puis supprimés ou anonymisés après la clôture, sous réserve des durées ci-dessous.',
        '• Commandes et factures : conservées le temps requis par les obligations comptables et fiscales applicables, même après la fermeture du compte.',
        '• Messages et avis : tant que votre compte existe. Les avis peuvent rester affichés de façon anonymisée après la suppression du compte, car ils informent les autres acheteuses.',
        '• Pièce d’identité : voir l’article 5.',
        '• Journaux techniques et de sécurité : au maximum douze mois.',
        '• Identifiants de notification : jusqu’à ce que vous désactiviez les notifications ou changiez d’appareil.',
      ],
    },
    {
      id: 'droits',
      title: '9. Vos droits',
      body: [
        'Vous disposez des droits suivants sur vos données :',
        '• Y accéder et en obtenir une copie.',
        '• Les faire corriger si elles sont inexactes — la plupart sont modifiables directement dans « Modifier mon profil ».',
        '• En demander la suppression.',
        '• Vous opposer à certains traitements, ou en demander la limitation.',
        '• Retirer votre consentement à tout moment, notamment pour les notifications, sans que cela remette en cause ce qui a été fait avant.',
        '• Déposer une réclamation auprès de l’autorité de protection des données de votre pays.',
        'Pour supprimer votre compte : ouvrez « Réglages », puis « Supprimer mon compte » en bas de l’écran. Votre demande est enregistrée et traitée par notre équipe. Vous pouvez aussi nous écrire à ' + CONTACT_EMAIL + '. La procédure complète, avec le détail de ce qui est supprimé et de ce qui est conservé, figure sur la page finjaro.net/suppression-compte.',
        'Attention : la suppression du compte n’efface pas les commandes déjà passées, que nous devons conserver pour des raisons comptables et en cas de litige, ni les informations déjà transmises à une boutique pour une livraison en cours.',
        `Pour exercer l’un de ces droits, écrivez à ${CONTACT_EMAIL}. Nous répondons dans un délai raisonnable, et au plus tard dans le délai prévu par la réglementation applicable. Nous pouvons vous demander de justifier votre identité avant de donner suite, afin d’éviter qu’un tiers n’obtienne vos données.`,
      ],
    },
    {
      id: 'securite',
      title: '10. Sécurité',
      body: [
        'Les échanges entre votre appareil et la plateforme sont chiffrés (HTTPS). Les mots de passe ne sont jamais stockés en clair.',
        'L’accès aux données est cloisonné : chaque utilisateur ne peut lire que ce qui le concerne, et ces règles sont appliquées côté serveur, pas seulement dans l’application.',
        'Les pièces d’identité sont stockées dans un espace privé, distinct des fichiers publics.',
        'Aucun système n’est infaillible. Si une violation de données susceptible d’engendrer un risque élevé pour vous survenait, nous vous en informerions ainsi que l’autorité compétente, dans les conditions prévues par la réglementation.',
      ],
    },
    {
      id: 'mineurs',
      title: '11. Âge minimum',
      body: [
        'Finjaro est réservée aux personnes âgées d’au moins 18 ans, ou ayant atteint la majorité légale dans leur pays de résidence.',
        'Nous ne collectons pas sciemment de données concernant des mineurs. Si vous constatez qu’un compte a été créé par un mineur, écrivez-nous : le compte sera fermé et les données supprimées.',
      ],
    },
    {
      id: 'stockage-local',
      title: '12. Cookies et stockage local',
      body: [
        'La plateforme enregistre sur votre appareil un petit nombre d’informations strictement nécessaires à son fonctionnement : votre session de connexion (pour ne pas devoir vous reconnecter à chaque ouverture), votre langue, votre devise, votre pays et le contenu de votre panier.',
        'Sur le site (hors applications mobiles), un cookie publicitaire du pixel Meta décrit à l’article 6 peut être déposé, mais uniquement après votre accord explicite via le bandeau de consentement — jamais par défaut.',
        'Vous pouvez les effacer à tout moment en vidant les données du site dans les réglages de votre navigateur, ou en désinstallant l’application. Vous serez alors déconnecté et votre panier sera vidé.',
      ],
    },
    {
      id: 'modification',
      title: '13. Modification de cette politique',
      body: [
        'Cette politique peut être mise à jour pour refléter une évolution du service, d’un prestataire ou de la réglementation.',
        'La version applicable est celle publiée sur la plateforme au jour de votre utilisation. En cas de changement important — par exemple l’ajout d’un paiement en ligne ou d’un nouveau prestataire — les titulaires d’un compte en seront informés par un moyen approprié.',
      ],
    },
    {
      id: 'contact',
      title: '14. Nous contacter',
      body: [
        'Pour toute question sur cette politique, sur les données que nous détenons vous concernant, ou pour exercer vos droits :',
        `• Par e-mail : ${CONTACT_EMAIL}`,
        'Nous nous engageons à répondre à toute demande dans un délai raisonnable.',
      ],
    },
  ],
};

const en = {
  title: 'Privacy Policy',
  updatedLabel: 'Last updated',
  updatedAt: '7 August 2026',
  versionLabel: 'Version',
  preamble: [
    'This policy explains what personal data Finjaro collects when you use the platform (finjaro.net and its mobile apps), why we collect it, who we share it with, how long we keep it, and what your rights are.',
    'It is written to be understood without legal training. If you have any question, write to us: ' + CONTACT_EMAIL + '.',
  ],
  sections: [
    {
      id: 'responsable',
      title: '1. Who is responsible for your data',
      body: [
        'Finjaro operates the finjaro.net platform and its mobile apps, and determines the purposes and means of the processing described below.',
        `For any question about your personal data, or to exercise one of the rights described in section 9, write to ${CONTACT_EMAIL}.`,
      ],
    },
    {
      id: 'donnees',
      title: '2. The data we collect',
      body: [
        'We only collect what the service needs to work. Specifically:',
        '• Account: your email address, your name or nickname, and your password (never stored in clear text — only as an irreversible hash). If you sign in with Google, we receive your Google email, name and profile picture.',
        '• Profile: phone number, country, city, saved delivery address, profile picture, preferred language and currency.',
        '• Orders: name, phone number, delivery address and city, order contents and amount, delivery status and history.',
        '• Sellers: shop name, description, photos, phone number, WhatsApp, Instagram account, categories, opening hours, delivery areas, and the shop’s location if you choose to provide it.',
        '• Identity verification (sellers only): if you request the “verified identity” badge, the copy of the identity document you upload. See section 5.',
        '• Messages: the content of conversations exchanged between buyers and shops through the platform’s messaging.',
        '• Reviews: the rating and comment you publish after an order, shown together with your public name.',
        '• Notifications: if you enable them, the technical notification identifier provided by your browser or phone.',
        '• Published content: product photos, videos, and images sent through messaging or to the AI assistant.',
        '• Usage: pages and listings viewed, searches made, items favourited, in order to measure audience and improve the service.',
        '• Technical: IP address, device and browser type, connection date and time, security logs.',
        'We do NOT collect: your bank card details (no payment is taken inside the app, see section 7), your background location, your contacts, your calendar, or the content of other apps on your phone.',
      ],
    },
    {
      id: 'finalites',
      title: '3. Why we use this data',
      body: [
        '• To create and manage your account, authenticate you and keep your access secure.',
        '• To display listings, power search, and connect you with shops.',
        '• To process orders: pass on to the shop the information it needs to deliver, track progress, handle cancellations and disputes.',
        '• To send you notifications and emails related to your activity (order accepted, shipped, message received, reminders).',
        '• To run the Finia assistant and the AI Mirror when you use them. See section 4.',
        '• To fight fraud, fake accounts, unlawful listings and abuse, and to enforce our Terms.',
        '• To measure audience in aggregate form and improve the platform.',
        '• To comply with our legal obligations and respond to requests from competent authorities.',
        'Depending on your country of residence, this processing relies on the performance of our contract with you (account, orders), on your consent (notifications, identity verification, AI features you trigger yourself), on our legitimate interest (security, fraud prevention, service improvement), or on a legal obligation.',
      ],
    },
    {
      id: 'ia',
      title: '4. Finia assistant, AI Mirror and artificial intelligence features',
      body: [
        'Finjaro offers several AI features: the Finia chat assistant, the AI Mirror (virtual try-on), publishing assistance for sellers, automatic reading of an identity document, and item valuation.',
        'These features rely on the Google Gemini service. When you use them, the content you provide at that moment — your message, the photo you send, or the relevant item details — is transmitted to Google in order to produce the response.',
        'These features NEVER run on their own: nothing is sent unless you open the assistant, send a message, or start a try-on.',
        'Personal photos sent to the AI Mirror are used solely to produce the requested image and show it to you. They are not published, not used to identify anyone, and not sold.',
        'We do not use your private conversations or your photos to train our own AI models.',
      ],
    },
    {
      id: 'identite',
      title: '5. Seller identity verification',
      body: [
        'Identity verification is optional: it only serves to obtain the “verified identity” badge, which reassures buyers. You can sell without requesting it.',
        'If you request it, the copy of your identity document is stored in a PRIVATE area, separate from the platform’s public images. It is never displayed on your shop, nor visible to other users or buyers.',
        'Only the Finjaro team can access it, and only to check that the document matches the shop’s information.',
        'The document is kept for as long as needed for the verification and to evidence it in the event of a dispute or an audit. You may request its deletion at any time, in which case the badge will be removed.',
      ],
    },
    {
      id: 'partage',
      title: '6. Who your data is shared with',
      body: [
        'Finjaro does not sell your personal data. It is shared only in the following cases:',
        '• With the shop concerned, when you place an order: your name, phone number and delivery address are passed on, because the shop is the one preparing and delivering the order. This is the core of the service — without it, delivery is impossible.',
        '• With other users, for what you publish voluntarily: your public name, profile picture, reviews, and — for shops — the contact details you choose to display.',
        '• With our technical providers, who act on our instructions and may not use your data for their own purposes. See the list in section 7.',
        '• With competent authorities, where the law requires it, or to establish, exercise or defend a legal claim.',
        'On the finjaro.net WEBSITE (not in the mobile apps), a Meta (Facebook/Instagram) advertising pixel measures the performance of our ad campaigns. It only activates after your explicit consent, given via the banner shown on your first visit — you can decline it without any impact on using the platform. No other advertising tracker is used, and the iOS and Android apps contain none at all.',
      ],
    },
    {
      id: 'prestataires',
      title: '7. Our providers and where your data is hosted',
      body: [
        'We rely on the following providers, each for a specific function:',
        '• Supabase — hosting of the database, accounts and files. Data is hosted in the European Union (Paris region, France).',
        '• Cloudflare — delivery of the site and apps, protection against attacks.',
        '• Google (Gemini) — the AI features described in section 4.',
        '• Google (Sign-In) — signing in with a Google account, if you choose that option.',
        '• Resend — sending notification emails.',
        'Some of these providers are established outside the European Union, or may process data from a third country. Such transfers are covered by the safeguards required under applicable law, in particular the European Commission’s standard contractual clauses.',
        'No card payment is taken inside the app to date: orders are paid on delivery, directly between you and the shop. Finjaro therefore collects no bank card data. If online payment is switched on, this policy will be updated before it goes live.',
      ],
    },
    {
      id: 'conservation',
      title: '8. How long we keep your data',
      body: [
        '• Account and profile: for as long as your account exists, then deleted or anonymised after closure, subject to the periods below.',
        '• Orders and invoices: kept for as long as required by applicable accounting and tax obligations, even after the account is closed.',
        '• Messages and reviews: for as long as your account exists. Reviews may remain visible in anonymised form after account deletion, as they inform other buyers.',
        '• Identity document: see section 5.',
        '• Technical and security logs: twelve months at most.',
        '• Notification identifiers: until you turn notifications off or change device.',
      ],
    },
    {
      id: 'droits',
      title: '9. Your rights',
      body: [
        'You have the following rights over your data:',
        '• Access it and obtain a copy.',
        '• Have it corrected if inaccurate — most of it can be changed directly under “Edit my profile”.',
        '• Request its deletion.',
        '• Object to certain processing, or ask for it to be restricted.',
        '• Withdraw your consent at any time, in particular for notifications, without affecting what was done beforehand.',
        '• Lodge a complaint with the data protection authority in your country.',
        'To delete your account: open “Settings”, then “Delete my account” at the bottom of the screen. Your request is recorded and handled by our team. You may also write to us at ' + CONTACT_EMAIL + '. The full procedure, detailing what is deleted and what is kept, is on the page finjaro.net/suppression-compte.',
        'Please note: deleting your account does not erase orders already placed, which we must keep for accounting reasons and in case of dispute, nor information already passed to a shop for a delivery in progress.',
        `To exercise any of these rights, write to ${CONTACT_EMAIL}. We reply within a reasonable time, and at the latest within the period set by applicable law. We may ask you to confirm your identity first, so that a third party cannot obtain your data.`,
      ],
    },
    {
      id: 'securite',
      title: '10. Security',
      body: [
        'Traffic between your device and the platform is encrypted (HTTPS). Passwords are never stored in clear text.',
        'Access to data is compartmentalised: each user can only read what concerns them, and these rules are enforced on the server, not merely in the app.',
        'Identity documents are stored in a private area, separate from public files.',
        'No system is infallible. Should a data breach likely to result in a high risk to you occur, we would inform you and the competent authority, as required by applicable law.',
      ],
    },
    {
      id: 'mineurs',
      title: '11. Minimum age',
      body: [
        'Finjaro is reserved for people aged 18 or over, or who have reached the age of majority in their country of residence.',
        'We do not knowingly collect data about minors. If you become aware that an account was created by a minor, write to us: the account will be closed and the data deleted.',
      ],
    },
    {
      id: 'stockage-local',
      title: '12. Cookies and local storage',
      body: [
        'The platform stores on your device a small amount of information strictly necessary for it to work: your sign-in session (so you need not log in every time), your language, currency, country, and the contents of your basket.',
        'On the website (not in the mobile apps), an advertising cookie from the Meta pixel described in section 6 may be set, but only after your explicit consent via the consent banner — never by default.',
        'You can clear these at any time by clearing the site data in your browser settings, or by uninstalling the app. You will then be signed out and your basket emptied.',
      ],
    },
    {
      id: 'modification',
      title: '13. Changes to this policy',
      body: [
        'This policy may be updated to reflect a change in the service, in a provider, or in the law.',
        'The applicable version is the one published on the platform on the day you use it. In the event of a material change — for example the addition of online payment or of a new provider — account holders will be informed by an appropriate means.',
      ],
    },
    {
      id: 'contact',
      title: '14. Contact us',
      body: [
        'For any question about this policy, about the data we hold about you, or to exercise your rights:',
        `• By email: ${CONTACT_EMAIL}`,
        'We undertake to respond to any request within a reasonable time.',
      ],
    },
  ],
};

export const PRIVACY = { fr, en };

export function privacyFor(language) {
  return String(language || '').startsWith('en') ? en : fr;
}
