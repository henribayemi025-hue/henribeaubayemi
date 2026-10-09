// LES HABITANTS QUI PARLENT (A5, plan du 08/10 : « habitants nommés qui parlent,
// nos agents »). Quand on passe près de quelqu'un dans la ville, une bulle courte
// apparaît au-dessus de sa tête, quelques secondes, puis s'efface.
//
// - Un agent dit ce qu'il fait VRAIMENT (sa tâche, sa pause, son travail rendu),
//   d'après les mêmes données que son étiquette. Un agent en veille ne parle pas.
// - Un passant dit une phrase de la vie en ville, accordée à l'heure et au ciel réels
//   (pas de « quel soleil ! » sous la pluie).
// - Une seule bulle à la fois, jamais la même personne deux fois de suite à quelques
//   secondes d'intervalle, rien au volant (Beau, 08/10 : « du texte partout »).
//
// Ici, la logique pure (testée). L'affichage est dans moteur.js.

// Une tâche raccourcie pour tenir dans une bulle : sans « X te demande : », coupée à un mot.
export function court(t, max = 48) {
  const s = String(t || '').replace(/^.*?(te demande|asks you)\s*:\s*/i, '').replace(/\s+/g, ' ').trim().replace(/[.!?:;,\s]+$/, '');
  if (s.length <= max) return s;
  const coupe = s.slice(0, max + 1);
  const i = coupe.lastIndexOf(' ');
  return `${(i > max * 0.6 ? coupe.slice(0, i) : s.slice(0, max)).replace(/[.,;:\s]+$/, '')}…`;
}

// Ce que dit un agent, selon ce qu'il fait. `cas` vient de son placement dans le monde
// (moteur.js) : dispo, pause, aFaire, rendu, travaille, attend, arrive, part, dejeune,
// court, joue, boit, dort. `n` = combien de fois il t'a déjà parlé (pour varier).
const AGENT = {
  fr: {
    dispo: ['Je suis libre. Tu as une tâche pour moi ?', 'Disponible ! Dis-moi ce dont tu as besoin.', 'Rien en cours : je t\'écoute.'],
    pause: ['Petite pause, puis je reprends : {t}.', 'Je souffle un peu. Ensuite : {t}.'],
    aFaire: ['Ma prochaine tâche : {t}.', 'Je m\'y mets bientôt : {t}.'],
    rendu: ['J\'ai rendu mon travail : {t}.', 'Fini ! J\'ai rendu : {t}.'],
    travaille: ['Je suis en plein dedans : {t}.', 'Je travaille sur : {t}.'],
    arrive: ['Bonjour ! J\'arrive au bureau.', 'Bonjour ! J\'arrive, la journée commence.'],
    part: ['Je pars au travail, à tout à l\'heure !', 'En route pour le bureau !'],
    dejeune: ['Pause déjeuner. Bon appétit !', 'Je déjeune, je reprends après.'],
    court: ['Je fais ma course, ça vide la tête !', 'Un petit footing avant ce soir.'],
    joue: ['Une partie de ballon, tu viens ?', 'On joue un peu, la journée est finie !'],
    boit: ['Un verre sur ma terrasse, la journée est finie.', 'Je me repose un peu sur ma terrasse.'],
    dort: ['Zzz…'],
    attend: {
      question: 'J\'ai une question pour toi.',
      decision: 'J\'attends ta décision pour continuer.',
      bloque: 'Je suis bloqué, j\'ai besoin de toi.',
      revue: 'J\'ai fini. Tu peux relire mon travail ?',
      autre: 'Je t\'attends, j\'ai besoin de toi.',
    },
  },
  en: {
    dispo: ['I\'m free. Got a task for me?', 'Available! Tell me what you need.', 'Nothing on my plate: I\'m listening.'],
    pause: ['Short break, then back to: {t}.', 'Catching my breath. Next: {t}.'],
    aFaire: ['My next task: {t}.', 'Starting soon on: {t}.'],
    rendu: ['I\'ve delivered my work: {t}.', 'Done! I delivered: {t}.'],
    travaille: ['Deep in it: {t}.', 'Working on: {t}.'],
    arrive: ['Good morning! On my way in.', 'Morning! The day is starting.'],
    part: ['Off to work, see you later!', 'Heading to the office!'],
    dejeune: ['Lunch break. Enjoy your meal!', 'Having lunch, back right after.'],
    court: ['Going for a run, it clears my head!', 'A quick jog before tonight.'],
    joue: ['A ball game, want to join?', 'Playing a bit, the day is over!'],
    boit: ['A drink on my terrace, the day is over.', 'Resting a bit on my terrace.'],
    dort: ['Zzz…'],
    attend: {
      question: 'I have a question for you.',
      decision: 'I need your decision to go on.',
      bloque: 'I\'m blocked, I need you.',
      revue: 'I\'m done. Can you check my work?',
      autre: 'I\'m waiting for you, I need you.',
    },
  },
};

// Rend la phrase, ou null quand l'agent ne dit rien (veille, réunion, cas inconnu, tâche
// manquante là où elle est nécessaire : on n'invente pas ce qu'il fait).
export function phraseAgent({ cas, tache, raison } = {}, langue = 'fr', n = 0) {
  const L = AGENT[langue === 'en' ? 'en' : 'fr'];
  if (cas === 'attend') return L.attend[raison] || L.attend.autre;
  const liste = L[cas];
  if (!Array.isArray(liste)) return null;
  const t = court(tache);
  const choix = liste.filter((p) => !p.includes('{t}') || t);
  if (!choix.length) return cas === 'pause' ? (langue === 'en' ? 'Short break, back in a minute.' : 'Petite pause, je reviens.') : null;
  return choix[Math.abs(n) % choix.length].replace('{t}', t);
}

// Les passants : 20 phrases de base par langue, puis celles de l'heure et du ciel.
// Moins de 70 caractères, chaleureuses, sans pays, sans chiffre.
export const PASSANTS = {
  fr: {
    toujours: [
      'Bonne journée à toi !',
      'Tu connais un bon café par ici ?',
      'Je file, je vais être en retard !',
      'Cette ville change tous les jours.',
      'Belle tenue, ça te va bien !',
      'Tu sais où s\'arrête le bus ?',
      'J\'adore marcher ici, on croise tout le monde.',
      'Les vendeurs de la place ont de bonnes choses.',
      'Attention en traversant, ça roule vite !',
      'Salut ! On s\'est déjà vus, non ?',
      'Je cherche une boutique de chaussures, une idée ?',
      'Pardon, je ne t\'avais pas vu !',
      'Toi aussi, tu travailles dans le coin ?',
      'Encore un appel et je suis libre !',
      'Il y a toujours du monde dans cette rue.',
      'Tu as l\'air pressé, bon courage !',
      'Je viens d\'ouvrir ma boutique en ligne !',
      'On se croise souvent, toi et moi.',
      'Le marché est par où, déjà ?',
      'Prends soin de toi !',
    ],
    aube: ['Bonjour ! Le premier café, ça n\'a pas de prix.', 'Bonjour ! Tu es matinal, toi.'],
    couchant: ['Bonsoir ! Enfin la fin de la journée.', 'La ville est belle à cette heure-ci.'],
    nuit: ['Il est tard, rentre bien !', 'Encore dehors à cette heure ?'],
    clair: ['Quel beau temps aujourd\'hui !', 'Il fait bon, on en profite.'],
    couvert: ['Le ciel est gris, mais ça va passer.'],
    pluie: ['Quelle pluie ! J\'ai oublié mon parapluie.', 'Vite, à l\'abri !'],
    orage: ['Tu entends l\'orage ? Rentre vite !'],
    brouillard: ['On n\'y voit rien avec ce brouillard !'],
    neige: ['Tu as vu cette neige ?'],
  },
  en: {
    toujours: [
      'Have a great day!',
      'Know a good coffee place around here?',
      'Gotta run, I\'m going to be late!',
      'This city changes every day.',
      'Nice outfit, it suits you!',
      'Do you know where the bus stops?',
      'I love walking here, you meet everyone.',
      'The stalls on the square have good stuff.',
      'Careful crossing, cars go fast here!',
      'Hi! Have we met before?',
      'Looking for a shoe shop, any idea?',
      'Sorry, I didn\'t see you there!',
      'Do you work around here too?',
      'One more call and I\'m free!',
      'This street is always busy.',
      'You look in a hurry, good luck!',
      'I just opened my online shop!',
      'We keep bumping into each other.',
      'Which way is the market again?',
      'Take care!',
    ],
    aube: ['Good morning! Nothing beats the first coffee.', 'Morning! You\'re up early.'],
    couchant: ['Good evening! Finally, the day is done.', 'The city looks lovely at this hour.'],
    nuit: ['It\'s late, get home safe!', 'Still out at this hour?'],
    clair: ['What lovely weather today!', 'It\'s nice out, let\'s enjoy it.'],
    couvert: ['Grey skies, but it\'ll pass.'],
    pluie: ['What rain! I forgot my umbrella.', 'Quick, get under cover!'],
    orage: ['Hear that storm? Get inside!'],
    brouillard: ['Can\'t see a thing in this fog!'],
    neige: ['Have you seen this snow?'],
  },
};

// Une phrase de passant : `graine` = qui parle (son rang), `n` = combien de fois il a
// déjà parlé. Le ciel ne compte que s'il se voit : « clair » seulement de jour.
export function phrasePassant({ langue = 'fr', phase = 'jour', genre = 'clair', graine = 0, n = 0 } = {}) {
  const P = PASSANTS[langue === 'en' ? 'en' : 'fr'];
  const ciel = genre === 'clair' ? (phase === 'jour' ? P.clair : []) : (P[genre] || []);
  const liste = [...(P[phase] || []), ...ciel, ...P.toujours];
  // Un passant ne répète pas sa phrase : il avance dans la liste à chaque fois, en partant
  // d'un endroit qui lui est propre (deux passants voisins ne disent pas la même chose).
  const debut = (Math.abs(Math.floor(graine)) * 7) % liste.length;
  return liste[(debut + Math.abs(n) * 3) % liste.length];
}

// Qui a le droit de parler maintenant : une seule bulle à la fois, une pause entre deux
// bulles, et la même personne pas avant un long moment (elle ne te répète pas la même
// chose chaque fois que tu repasses).
export function creerBavardage({ pauseEntre = 4, memePersonne = 40 } = {}) {
  const dernier = new Map(), fois = new Map();
  let finBulle = -Infinity;
  return {
    peut(cle, t) {
      if (t < finBulle + pauseEntre) return false;
      const d = dernier.get(cle);
      return d == null || t - d >= memePersonne;
    },
    // Combien de fois cette personne a déjà parlé (pour qu'elle varie sa phrase).
    combien: (cle) => fois.get(cle) || 0,
    parle(cle, t, duree) { dernier.set(cle, t); fois.set(cle, (fois.get(cle) || 0) + 1); finBulle = t + duree; },
    // La bulle s'efface plus tôt (la personne s'est éloignée, on est monté en voiture).
    fini(t) { finBulle = Math.min(finBulle, t); },
  };
}

// Combien de temps une bulle reste : de quoi la lire, sans s'éterniser.
export const dureeBulle = (texte) => Math.min(6, Math.max(3, 1.6 + String(texte || '').length * 0.05));
