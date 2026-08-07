// Page « Supprimer mon compte » — exigée par Google Play (champ « URL de
// suppression de compte » de la déclaration Sécurité des données) et par
// l'App Store.
//
// Google impose trois choses à cette page, et les vérifie à l'examen:
//   1. citer le nom de l'appli ou du développeur figurant sur la fiche;
//   2. afficher DISTINCTEMENT la procédure à suivre;
//   3. préciser ce qui est supprimé, ce qui est conservé, et combien de temps.
// Une politique de confidentialité générale se fait régulièrement refuser
// ici: le lien doit pointer sur une page qui ne parle que de ça. D'où cette
// page séparée plutôt qu'une ancre dans privacy.js.
//
// Le contenu décrit le flux RÉEL: Réglages -> « Supprimer mon compte »
// enregistre la demande (profiles.deletion_requested_at, migration 0044),
// déconnecte, et l'équipe traite ensuite. Ne PAS écrire « suppression
// immédiate »: ce n'est pas ce que fait le bouton.

export const CONTACT_EMAIL = 'fin.finjaro@gmail.com';

const fr = {
  title: 'Supprimer mon compte Finjaro',
  updatedLabel: 'Dernière mise à jour',
  updatedAt: '7 août 2026',
  preamble: [
    'Cette page explique comment demander la suppression de votre compte Finjaro et des données qui s’y rattachent, ce qui est effacé, et ce que nous devons conserver.',
    'Finjaro est la place de marché accessible sur finjaro.net et via l’application mobile Finjaro.',
  ],
  sections: [
    {
      id: 'depuis-app',
      title: 'Comment demander la suppression depuis l’application',
      body: [
        '1. Ouvrez l’application Finjaro, ou rendez-vous sur finjaro.net.',
        '2. Connectez-vous à votre compte.',
        '3. Ouvrez l’onglet « Profil », puis « Réglages ».',
        '4. Descendez tout en bas de l’écran et touchez « Supprimer mon compte ».',
        '5. Indiquez si vous le souhaitez la raison de votre départ, cochez la case de confirmation, puis validez.',
        'Votre demande est alors enregistrée et vous êtes immédiatement déconnecté. Notre équipe la traite et supprime le compte.',
      ],
    },
    {
      id: 'par-email',
      title: 'Comment demander la suppression par e-mail',
      body: [
        'Si vous ne parvenez pas à vous connecter, écrivez à ' + CONTACT_EMAIL + ' depuis l’adresse e-mail associée à votre compte, avec « Suppression de compte » en objet.',
        'Nous pouvons vous demander de confirmer votre identité avant de donner suite, afin qu’un tiers ne puisse pas faire supprimer votre compte à votre place.',
      ],
    },
    {
      id: 'supprime',
      title: 'Ce qui est supprimé',
      body: [
        '• Votre compte et vos identifiants de connexion.',
        '• Votre profil : nom, adresse e-mail, numéro de téléphone, adresse de livraison enregistrée, photo de profil, pays, ville, langue et devise.',
        '• Votre boutique, si vous en aviez une, ainsi que les articles et les vidéos que vous y aviez publiés.',
        '• Vos favoris et les boutiques que vous suiviez.',
        '• Vos conversations dans la messagerie.',
        '• Votre pièce d’identité, si vous en aviez téléversé une pour la vérification.',
        '• Vos identifiants de notification, ce qui met fin à l’envoi de notifications et d’e-mails.',
      ],
    },
    {
      id: 'conserve',
      title: 'Ce qui est conservé, et pourquoi',
      body: [
        'Certaines informations ne peuvent pas être effacées immédiatement, pour des raisons légales ou parce que d’autres personnes sont concernées :',
        '• Les commandes déjà passées, ainsi que les montants et les dates : conservées le temps requis par les obligations comptables et fiscales applicables, puis supprimées. Elles sont sorties de votre profil et ne sont plus rattachées à votre nom au-delà de ce qu’impose la loi.',
        '• Une commande en cours de livraison : les informations déjà transmises à la boutique pour vous livrer restent chez elle jusqu’à la fin de la livraison. Nous ne pouvons pas les retirer à sa place.',
        '• Les avis que vous avez publiés : ils peuvent rester affichés sous forme anonyme, sans votre nom, car ils informent les autres acheteuses sur des boutiques réelles.',
        '• Les journaux techniques et de sécurité : au maximum douze mois, puis supprimés automatiquement.',
      ],
    },
    {
      id: 'delai',
      title: 'Délais',
      body: [
        'Votre demande est prise en compte dès son enregistrement : vous êtes déconnecté immédiatement et votre compte n’est plus utilisable.',
        'La suppression effective des données intervient sous trente jours au plus, hors éléments listés ci-dessus dont la conservation est imposée par la loi.',
        'La suppression est définitive : un compte supprimé ne peut pas être restauré, et son contenu ne peut pas être récupéré.',
      ],
    },
    {
      id: 'contact',
      title: 'Une question ?',
      body: [
        `Écrivez-nous à ${CONTACT_EMAIL}. Vous pouvez aussi consulter notre politique de confidentialité, à l’adresse finjaro.net/legal/confidentialite, pour le détail de toutes les données traitées.`,
      ],
    },
  ],
};

const en = {
  title: 'Delete my Finjaro account',
  updatedLabel: 'Last updated',
  updatedAt: '7 August 2026',
  preamble: [
    'This page explains how to request deletion of your Finjaro account and the data attached to it, what is erased, and what we are required to keep.',
    'Finjaro is the marketplace available at finjaro.net and through the Finjaro mobile app.',
  ],
  sections: [
    {
      id: 'depuis-app',
      title: 'How to request deletion from the app',
      body: [
        '1. Open the Finjaro app, or go to finjaro.net.',
        '2. Sign in to your account.',
        '3. Open the "Profile" tab, then "Settings".',
        '4. Scroll to the very bottom of the screen and tap "Delete my account".',
        '5. Optionally tell us why you are leaving, tick the confirmation box, then confirm.',
        'Your request is then recorded and you are signed out immediately. Our team processes it and deletes the account.',
      ],
    },
    {
      id: 'par-email',
      title: 'How to request deletion by email',
      body: [
        'If you cannot sign in, write to ' + CONTACT_EMAIL + ' from the email address linked to your account, with "Account deletion" as the subject.',
        'We may ask you to confirm your identity before acting, so that a third party cannot have your account deleted in your place.',
      ],
    },
    {
      id: 'supprime',
      title: 'What is deleted',
      body: [
        '• Your account and your sign-in credentials.',
        '• Your profile: name, email address, phone number, saved delivery address, profile picture, country, city, language and currency.',
        '• Your shop, if you had one, along with the items and videos you published there.',
        '• Your favourites and the shops you followed.',
        '• Your conversations in the messaging.',
        '• Your identity document, if you had uploaded one for verification.',
        '• Your notification identifiers, which ends all notifications and emails.',
      ],
    },
    {
      id: 'conserve',
      title: 'What is kept, and why',
      body: [
        'Some information cannot be erased straight away, for legal reasons or because other people are involved:',
        '• Orders already placed, with their amounts and dates: kept for as long as applicable accounting and tax obligations require, then deleted. They are removed from your profile and are no longer linked to your name beyond what the law requires.',
        '• An order being delivered: the information already passed to the shop so it can deliver stays with that shop until delivery is complete. We cannot remove it on its behalf.',
        '• Reviews you published: they may remain visible in anonymised form, without your name, as they inform other buyers about real shops.',
        '• Technical and security logs: twelve months at most, then deleted automatically.',
      ],
    },
    {
      id: 'delai',
      title: 'Timing',
      body: [
        'Your request takes effect as soon as it is recorded: you are signed out immediately and your account can no longer be used.',
        'Actual deletion of the data happens within thirty days at most, apart from the items listed above whose retention is required by law.',
        'Deletion is permanent: a deleted account cannot be restored, and its content cannot be recovered.',
      ],
    },
    {
      id: 'contact',
      title: 'Any question?',
      body: [
        `Write to us at ${CONTACT_EMAIL}. You can also read our privacy policy, at finjaro.net/legal/confidentialite, for the full detail of the data we process.`,
      ],
    },
  ],
};

export function deletionFor(language) {
  return String(language || '').startsWith('en') ? en : fr;
}
