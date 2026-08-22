# Réponse à Apple — Guideline 2.1 « Information Needed »

Refus du **14/08/2026**, soumission `1c6c8e63-4280-4ebd-833e-fdc0cc7e75d0`,
build **1.0.10 (10)**.

Apple ne dit pas que l'app est cassée. Elle demande **sept informations** pour
pouvoir continuer l'examen. Il n'y a donc **pas de nouveau build à envoyer**:
on répond dans App Store Connect (« Reply to App Review »), et l'examen
reprend.

---

## Ce que Beau doit faire (2 choses)

### 1. Créer le compte de démonstration

Sur https://finjaro.net → Créer un compte, **par e-mail** (pas Google: Apple
doit pouvoir se connecter sans téléphone ni compte Google).

- E-mail: une adresse que tu contrôles, par ex. `review@finjaro.net`
- Mot de passe: quelque chose de simple à taper, sans accent

Puis dis-le-moi: je remplis la boutique de ce compte avec des articles, pour
que l'examinateur voie une vraie boutique et pas un écran vide.

**Pourquoi par e-mail:** l'examinateur est aux États-Unis. Il n'a pas de
numéro camerounais ni français pour recevoir un SMS. S'il ne peut pas se
connecter, il refuse à nouveau.

### 2. Enregistrer la vidéo (point 1 de la demande d'Apple)

Sur ton iPhone: **Réglages → Centre de contrôle → Enregistrement de l'écran**,
puis ouvre Finjaro et filme **en une seule prise**, sans couper.

L'ordre exact, parce qu'Apple exige de voir précisément ces passages:

1. **Démarrer par le lancement de l'app** (écran d'accueil iOS, tu touches
   l'icône Finjaro). C'est écrit noir sur blanc: « must begin with launching
   the app ».
2. Faire défiler l'accueil, ouvrir une boutique, ouvrir un article.
3. **Création de compte**: se déconnecter, créer un compte neuf.
4. **Connexion**: se reconnecter avec le compte de démonstration.
5. **Suppression de compte**: Profil → Réglages → Supprimer mon compte.
   Va jusqu'à l'écran de confirmation (tu peux annuler à la fin).
6. **Contenu publié par les utilisateurs + signaler/bloquer**: ouvre un
   article ou une boutique, montre le bouton **Signaler**, puis le bouton
   **Bloquer** sur un profil. Apple insiste sur ce point.
7. **Demandes d'autorisation**: publie un article avec une photo pour
   déclencher la demande d'accès à l'appareil photo, et ouvre l'onglet
   Services pour déclencher la demande de localisation. Il faut qu'on VOIE
   les fenêtres d'autorisation.

Pas besoin de commenter à voix haute. 3 à 5 minutes suffisent.

**Pas de paiement à filmer**: il n'y en a pas dans l'app (voir plus bas).

---

## Le texte à coller dans « Reply to App Review »

Copier tel quel. Les points 2 à 7 sont déjà remplis avec les vraies
informations de Finjaro — vérifiées dans le code, pas devinées.

---

Hello,

Thank you for the detailed request. Please find below all the information
you asked for. A screen recording captured on a physical device is attached.

**1. Screen recording**

Attached. It was captured on a physical iPhone running the latest iOS,
starting from launching the app, and shows the typical user flow: browsing
the marketplace, opening a shop and a product listing, account registration,
login, account deletion, user-generated content with the reporting and
blocking mechanisms, and the permission prompts for camera and location.

**2. Devices and operating systems tested**

- iPhone (physical device), iOS 18 — full manual test pass
- iPhone 15 / iPhone SE simulators, iOS 18 — layout and navigation
- Safari and Chrome on iOS and Android — the same interface, tested daily

**3. What the app does and who it is for**

Finjaro is a worldwide online marketplace. Independent sellers — mostly very
small businesses and individual entrepreneurs — open a shop, list what they
sell, and reach buyers directly.

The problem it solves: these sellers currently do business through social
media conversations, with no catalogue, no order tracking, no reliable way to
be found, and no record of what they sold. Finjaro gives them a real shop
page, a product catalogue, an order flow with clear statuses, and simple
bookkeeping — without needing a website or technical skills.

Buyers get a searchable catalogue with prices shown in their own currency, a
short-video feed to discover products, direct messaging with the seller, and
an order history.

Our starting market is Cameroon, but the app is built and available for a
worldwide audience, with no country-specific restriction.

**4. How to set up and access the main features**

Demo account (buyer and seller — the same account can switch between both):

- Email: `<À REMPLIR>`
- Password: `<À REMPLIR>`

After signing in:

- **Browse**: the Home tab lists products and shops. The Fin tab is a
  short-video feed. The Services tab lists service providers.
- **Buy**: open any product → "Add to cart" → cart → "Place order". Payment
  is arranged directly with the seller (see point 5); no payment is taken in
  the app.
- **Sell**: the demo account already has a shop. Profile → "Switch to seller"
  opens the seller area: add a product, view orders, statistics and finances.
- **Report and block**: every product, shop, video and user profile has a
  "Report" action; user profiles also have a "Block" action.
- **Delete the account**: Profile → Settings → "Delete my account". The same
  page is publicly reachable at https://finjaro.net/suppression-compte

No sample file is needed.

**5. External services used**

- **Supabase** — authentication (email/password, phone one-time passcode,
  Sign in with Google, Sign in with Apple), database, file storage, and
  serverless functions.
- **Cloudflare Workers** — web hosting and content delivery.
- **Google Gemini API** — powers our in-app assistant ("Finia"), which helps
  buyers find products, helps sellers write their listings from a photo, and
  runs an automatic daily review of published content for prohibited items.
- **Resend** — transactional email (order notifications).

**No payment processor is active.** The app takes no payment: there are no
in-app purchases, no subscriptions, and no paid content. Buyers and sellers
settle directly with each other, in person or by their own means, outside the
app. (A Stripe integration exists in our codebase from earlier development
but is disabled and unreachable in this version — no purchase can be
initiated from the app.)

**6. Regional differences**

There are none. The app offers the same features and the same content in
every region. Two things adapt to the user, and neither removes or adds any
feature:

- Prices are displayed in the currency of the country set on the user's
  profile, which the user can change at any time in Settings.
- The interface is available in French and English, following the device
  language, and can be changed in Settings.

**7. Regulated industry / protected third-party material**

Finjaro does not operate in a regulated industry. It offers no financial,
medical, gambling or similar regulated service.

All product photos and videos are supplied by the sellers themselves for
their own listings. Our terms require sellers to own the rights to what they
upload.

Content is moderated on two levels: users can report or block any content or
user from within the app, and an automated review runs every morning over all
newly published listings, videos and shop descriptions. It removes prohibited
content from view immediately and flags doubtful content for human decision.
Nothing is published without being covered by this review.

We have added all of the above to the Notes field of the App Review
Information section for future submissions.

Thank you for your time.

Henri Beau Bayemi
Finjaro

---

## Après l'envoi

Coller **le même texte** dans App Store Connect → l'app → **App Review
Information → Notes**. Apple le demande explicitement pour les prochaines
soumissions, et ça évite de repasser par là à chaque mise à jour.

## Séparé, mais bloquant pour l'Europe

Le bandeau **trader status (DSA)** en haut de la liste des apps: tant qu'il
n'est pas rempli, l'app ne peut pas être distribuée dans l'Union européenne,
même acceptée. App Store Connect → **Business** → Trader Status. C'est Beau
qui doit le remplir, personne d'autre ne peut.
