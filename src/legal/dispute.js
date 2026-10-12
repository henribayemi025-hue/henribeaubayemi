// Procédure en cas de litige — Finjaro.
//
// Réunion du 10/10 (Beau et son collaborateur) : « il en faut une », et elle
// doit être rappelée à trois moments, comme les conditions et la politique de
// confidentialité : à la création d'un compte, à la création d'une boutique, et
// quand l'acheteuse valide sa commande. Elle est aussi liée dans le pied de
// page (Profil, Paramètres).
//
// TEXTE PROVISOIRE, rédigé pour Beau : il décrit ce qui existe VRAIMENT
// aujourd'hui (le paiement se fait à la livraison, entre l'acheteuse et la
// boutique ; Finjaro n'est pas partie à la vente) et reste cohérent avec les
// articles 2, 6, 12, 13 et 20 des Conditions. AUCUN délai chiffré, AUCUNE
// promesse de remboursement ni de garantie : rien de tout cela n'est décidé.
// Il doit être relu par un juriste d'affaires avant d'être opposé à qui que ce
// soit (même réserve que pour les Conditions).
//
// Structure : { fr | en } -> { title, updatedLabel, updatedAt, draftNotice,
// preamble[], sections[{ id, title, body[] }] } — « • » = puce.

import { CONTACT_EMAIL } from './terms';

export { CONTACT_EMAIL };
export const DISPUTE_VERSION = '0.1';

const fr = {
  title: 'Procédure en cas de litige',
  updatedLabel: 'Dernière mise à jour',
  updatedAt: '12 octobre 2026',
  versionLabel: 'Version',
  draftNotice:
    'Texte provisoire, en cours de relecture par un conseil juridique. Il décrit la façon dont Finjaro traite aujourd’hui les problèmes entre une acheteuse et une boutique.',
  preamble: [
    'Finjaro met en relation des acheteuses et des boutiques. La vente est conclue entre l’acheteuse et la boutique : Finjaro n’en est pas partie (voir l’article 2 des Conditions). Cette page explique quoi faire quand quelque chose se passe mal, et ce que Finjaro peut — et ne peut pas — faire.',
  ],
  sections: [
    {
      id: 'prevenir',
      title: '1. Avant de commander',
      body: [
        '• Regardez les photos, la description et les avis de la boutique, et posez vos questions par la messagerie de Finjaro avant de commander.',
        '• Gardez le numéro de commande et vos échanges : ce sont vos preuves.',
        '• N’envoyez jamais d’argent à l’avance en dehors de la plateforme et ne communiquez jamais de code ou de mot de passe (voir l’article 6 des Conditions).',
      ],
    },
    {
      id: 'boutique',
      title: '2. Première étape : parler à la boutique',
      body: [
        'La plupart des problèmes se règlent avec la boutique : article différent de la fiche, retard, article manquant ou abîmé. Écrivez-lui par la messagerie de Finjaro en indiquant votre numéro de commande et ce que vous attendez.',
        'Quand une boutique ne répond pas à une commande, Finjaro lui envoie des rappels. Si elle ne répond toujours pas, la commande peut être annulée et l’acheteuse peut être orientée vers d’autres boutiques.',
      ],
    },
    {
      id: 'finjaro',
      title: '3. Deuxième étape : écrire à Finjaro',
      body: [
        `Si vous n’obtenez pas de solution, écrivez à ${CONTACT_EMAIL} en indiquant : votre nom, le numéro de commande, le nom de la boutique, ce qui s’est passé, et vos preuves (captures d’écran de la messagerie, photos). Vous pouvez aussi signaler une annonce ou un message depuis l’application.`,
        'Finjaro accuse réception, écoute les deux côtés et examine la situation dans un délai raisonnable (articles 13 et 20 des Conditions).',
      ],
    },
    {
      id: 'peut',
      title: '4. Ce que Finjaro peut faire',
      body: [
        '• demander à la boutique et à l’acheteuse de donner chacune leur version ;',
        '• proposer une solution à l’amiable ;',
        '• retirer une annonce, avertir une boutique, limiter ou suspendre son compte si elle ne respecte pas les Conditions ;',
        '• conserver une trace du signalement et de ce qui a été décidé.',
      ],
    },
    {
      id: 'nepeutpas',
      title: '5. Ce que Finjaro ne fait pas',
      body: [
        'Finjaro n’est ni vendeuse ni garante de l’article. Avec le paiement à la livraison, l’argent est remis directement à la boutique ou à son livreur et ne passe pas par Finjaro : Finjaro ne peut ni le bloquer, ni le rendre, ni imposer un remboursement (articles 6 et 12 des Conditions).',
      ],
    },
    {
      id: 'fraude',
      title: '6. Fraude et situations graves',
      body: [
        'Si vous pensez être victime d’une escroquerie, signalez-le tout de suite à Finjaro et gardez toutes les preuves. En cas d’infraction, vous pouvez aussi vous adresser aux autorités de votre pays.',
      ],
    },
    {
      id: 'droits',
      title: '7. Vos droits',
      body: [
        'Cette procédure ne vous retire aucun des droits que la loi de votre pays vous donne comme consommatrice (article 16 des Conditions).',
      ],
    },
  ],
};

const en = {
  title: 'Dispute procedure',
  updatedLabel: 'Last updated',
  updatedAt: 'October 12, 2026',
  versionLabel: 'Version',
  draftNotice:
    'Provisional text, being reviewed by legal counsel. It describes how Finjaro currently handles problems between a buyer and a shop.',
  preamble: [
    'Finjaro connects buyers and shops. The sale is made between the buyer and the shop: Finjaro is not a party to it (see article 2 of the Terms). This page explains what to do when something goes wrong, and what Finjaro can — and cannot — do.',
  ],
  sections: [
    {
      id: 'prevenir',
      title: '1. Before you order',
      body: [
        '• Look at the shop’s photos, description and reviews, and ask your questions through Finjaro’s messaging before ordering.',
        '• Keep your order number and your conversations: they are your evidence.',
        '• Never send money in advance outside the platform and never share a code or a password (see article 6 of the Terms).',
      ],
    },
    {
      id: 'boutique',
      title: '2. First step: talk to the shop',
      body: [
        'Most problems are settled with the shop: an item that differs from its listing, a delay, a missing or damaged item. Write to the shop through Finjaro’s messaging, giving your order number and what you expect.',
        'When a shop does not answer an order, Finjaro sends it reminders. If it still does not answer, the order may be cancelled and the buyer may be directed to other shops.',
      ],
    },
    {
      id: 'finjaro',
      title: '3. Second step: write to Finjaro',
      body: [
        `If you cannot reach a solution, write to ${CONTACT_EMAIL} with: your name, the order number, the shop’s name, what happened, and your evidence (screenshots of the messaging, photos). You can also report a listing or a message from the app.`,
        'Finjaro acknowledges receipt, hears both sides and looks into the situation within a reasonable time (articles 13 and 20 of the Terms).',
      ],
    },
    {
      id: 'peut',
      title: '4. What Finjaro can do',
      body: [
        '• ask the shop and the buyer to each give their version;',
        '• suggest a friendly settlement;',
        '• remove a listing, warn a shop, restrict or suspend its account if it does not follow the Terms;',
        '• keep a record of the report and of what was decided.',
      ],
    },
    {
      id: 'nepeutpas',
      title: '5. What Finjaro does not do',
      body: [
        'Finjaro is neither the seller nor a guarantor of the item. With cash on delivery, the money is handed directly to the shop or its courier and does not go through Finjaro: Finjaro cannot block it, return it or force a refund (articles 6 and 12 of the Terms).',
      ],
    },
    {
      id: 'fraude',
      title: '6. Fraud and serious situations',
      body: [
        'If you think you are the victim of a scam, report it to Finjaro right away and keep all the evidence. In case of an offence, you can also contact the authorities of your country.',
      ],
    },
    {
      id: 'droits',
      title: '7. Your rights',
      body: [
        'This procedure does not take away any of the rights the law of your country gives you as a consumer (article 16 of the Terms).',
      ],
    },
  ],
};

export function disputeFor(language) {
  return language?.startsWith('en') ? en : fr;
}
