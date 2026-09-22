# Legion — chantier 3 : brancher Google (Gmail, Agenda, Drive)

Beau, 22/09 : « et mes connecteurs avec Google, Gmail et tout ». Le plan,
avant le code.

## Ce que ça donnera

Chaque personne relie **son** compte Google à Legion, une fois, en
cliquant sur « Relier Google » et en acceptant ce que Google lui montre.
Ensuite ses agents peuvent :

- **Gmail** : lire les derniers e-mails, les résumer, préparer une
  réponse. **Envoyer, jamais sans son clic** (le bouton « Confirmer »).
- **Agenda** : lire ses rendez-vous, proposer un créneau, préparer une
  invitation — envoyée seulement avec son clic.
- **Drive** : retrouver un document, le lire, le résumer.

On commence en **lecture seule** ; l'envoi vient ensuite, toujours derrière
une confirmation.

## Ce qu'il faut de Beau (je ne peux pas le faire à sa place)

Tout se passe dans la **console Google Cloud** du projet « Finjaro app »
(le même que la clé Gemini). Je le guiderai écran par écran :

1. **Écran d'autorisation** (« OAuth consent screen ») : nom « Finjaro »,
   son e-mail, le logo.
2. **Activer trois API** : Gmail API, Google Calendar API, Google Drive API
   (gratuites).
3. **Créer un identifiant « Application Web »** et y coller l'adresse de
   retour que je lui donnerai (une page de Legion).
4. Me donner l'**identifiant client** (public) ; le **secret client** va
   dans les secrets des fonctions Supabase — il me dira quand c'est fait,
   il ne me le colle pas dans le chat.

## Ce qu'il faut savoir avant

- **Gratuit** : les API Gmail, Agenda et Drive ne se paient pas.
- **Tant que l'application est « en test »**, seules 100 personnes qu'il
  inscrit lui-même peuvent relier leur Google. C'est parfait pour lui et
  son équipe.
- **Pour l'ouvrir à tout le monde**, Google exige une **vérification** ; et
  pour Gmail (lecture des e-mails), une **évaluation de sécurité** payante
  et longue. On n'en a pas besoin tant que Legion sert à l'équipe Finjaro.
- **Les jetons Google** (ce qui permet de lire) restent côté serveur,
  chiffrés, jamais dans le navigateur ; chaque personne peut débrancher son
  compte d'un clic, et Google le montre aussi dans son propre compte.

## Ce que je construis pendant ce temps

- La table des comptes reliés (par personne, chiffrée) et l'écran
  « Connecteurs » de l'entreprise : Google, et plus tard GitHub.
- Les outils de lecture pour les agents (derniers e-mails, prochains
  rendez-vous, recherche de document), branchés comme les outils de la base.
- Le bouton « Confirmer » pour tout ce qui part vers l'extérieur.
