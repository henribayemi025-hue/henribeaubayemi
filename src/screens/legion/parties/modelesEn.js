// Les modèles d'entreprise en anglais (Beau, 25/09 : « j'ai choisi l'anglais et les
// modèles sont restés en français »). La table studio_modeles n'a que le français ;
// plutôt qu'une migration sur la base commune, la traduction vit ici, rangée par clé.
// Un modèle absent de la liste (créé plus tard, ou demandé par quelqu'un) garde son texte.
const EN = {
  conseil: ['Consulting firm', 'A full leadership team that challenges your plan like a board would, and hands you a memo.', 'International consulting firm'],
  croissance: ['Growth agency', 'Marketing, content, sales: what brings customers in and keeps them.', 'Growth agency'],
  produit: ['Product & engineering studio', 'Design, build, ship and secure software — from idea to production.', 'Engineering studio'],
  marche: ['Trading floor', 'Quantitative analysis, risk management, financial models.', 'Finance and trading'],
  juridique: ['Law firm & legal', 'Contracts, compliance, personal data, country-by-country expansion.', 'Law firm'],
  recherche: ['Research lab', 'Read, form hypotheses, test, write up.', 'Laboratory'],
  'application-a-z': ['Build an app from A to Z', 'From idea to live app: product, design, code, payments, growth, legal, support.', 'App studio'],
  'studio-de-contenu': ['Content studio', 'Find your angle, find ideas, package them, tell them, create, adapt, turn them into an offer, measure.', 'Content studio'],
  cinema: ['Film & animation studio', 'From script to series: directing, image, animation, sound, and test viewers who judge the pace.', 'Studio'],
  'place-de-marche-en-ligne': ['Online marketplace', 'Connect buyers and third-party sellers on one smooth, highly secure platform.', 'E-commerce platform'],
  'operateur-telecom': ['Telecom operator', 'Connectivity, mobile and financial services: what links subscribers to the rest of the world.', 'National telecom operator'],
  'editeur-saas': ['SaaS company', 'Build, sell and maintain subscription software that solves a precise business problem.', 'B2B software publisher'],
  'compagnie-d-assurance': ['Insurance company', 'Pool risks to protect property and people against life’s hazards.', 'National multi-line insurer'],
  'hotel-et-hebergement-touristique': ['Hotel & hospitality', 'Welcome, comfort and service: a memorable stay that brings every traveller back.', 'Hotel'],
  'banque-de-detail': ['Retail bank', 'Collect savings, lend, and secure everyday transactions for individuals.', 'National banking network'],
  'restaurant-et-traiteur': ['Restaurant & catering', 'Create and serve memorable food experiences, from an intimate table to a large banquet.', 'Restaurant group'],
  'fintech-de-paiement': ['Payments fintech', 'Transactions, wallets and transfers: money moves fast, everywhere, safely.', 'Mobile payments fintech'],
  'agence-web-et-mobile': ['Web & mobile agency', 'Design, development and maintenance of custom web and mobile apps for businesses.', 'Digital services agency'],
  'distribution-pharmaceutique': ['Pharmaceutical distribution', 'Supply pharmacies and hospitals with medicines, with safety, traceability and on-time delivery.', 'Pharmaceutical wholesaler'],
  'cabinet-d-architecture': ['Architecture firm', 'Design, planning and site supervision: turning space into living buildings.', 'Architecture & urban planning firm'],
  'cabinet-d-expertise': ['Accounting firm', 'Reliable finances, optimised taxes and certified company accounts.', 'Accounting & audit firm'],
  'agence-de-voyages': ['Travel agency', 'Design, sell and run unforgettable trips, from a single ticket to a tailor-made tour.', 'Tour operator & agency network'],
  'clinique-privee': ['Private clinic', 'Medical care, surgery and patient follow-up: clinical excellence, safety and comfort at every step.', 'Private healthcare facility'],
  'transport-et-logistique': ['Transport & logistics', 'Move goods from origin to end customer, on time and undamaged.', 'Integrated logistics network'],
  'compagnie-aerienne': ['Airline', 'Carry passengers and cargo safely and on time while filling every seat.', 'International airline'],
  'ecole-privee': ['Private school', 'Teaching, guidance, success: educating pupils from kindergarten to final exams.', 'Private school'],
  'centre-de-formation': ['Training centre', 'Course design, learner recruitment and teaching that builds employability.', 'Training organisation'],
  'plateforme-vtc-et-livraison': ['Ride-hailing & delivery platform', 'Instantly match riders and orders with a fleet of independent drivers and couriers.', 'Global tech platform'],
  'entreprise-de-btp': ['Construction company', 'Studies, structural work, finishing: durable buildings and infrastructure, on schedule.', 'Builder & developer'],
  'marque-de-mode-et-atelier': ['Fashion brand & workshop', 'Design, making and distribution: dressing the world with style, from sketch to store.', 'Ready-to-wear house'],
  'industrie-agroalimentaire': ['Food industry', 'Turn farm produce into safe, tasty finished products distributed at scale.', 'Factory & distribution network'],
  'groupe-media': ['Media group', 'Inform, entertain and engage audiences, and earn from attention through subscriptions and ads.', 'National multimedia publisher'],
  'salon-de-coiffure-et-institut': ['Hair & beauty salon', 'Cuts, care, beauty: making clients look their best and giving them a relaxing moment.', 'Salon network'],
  'promoteur-et-agence-immobiliere': ['Real estate developer & agency', 'Design, build, sell and manage durable, profitable places to live and work.', 'Integrated real estate group'],
  'domaine-agro-industriel': ['Agro-industrial estate', 'Farm the land, raise livestock and process raw materials into quality products.', 'Agro-industrial complex'],
  'grande-distribution': ['Supermarket chain', 'Fresh produce, groceries and household goods: source, stock and sell at the best price.', 'Supermarket network'],
  'studio-et-label-musical': ['Music studio & label', 'Discover, produce, distribute and promote artists, turning talent into commercial success.', 'Independent or major label'],
  'club-de-sport-professionnel': ['Professional sports club', 'Performance, ticketing, TV rights and passion: what thrills fans and wins titles.', 'Sports franchise'],
  'studio-de-jeux-video': ['Video game studio', 'Create, develop and publish: bring virtual worlds to life and captivate players.', 'Development studio'],
  'usine-de-production': ['Manufacturing plant', 'Turn raw materials into finished goods at the expected pace, quality and cost.', 'Industrial production site'],
  'societe-miniere-et-petroliere': ['Mining & oil company', 'Extract, process and distribute natural resources safely, responsibly and profitably.', 'Resource operator'],
  'ong-et-fondation': ['NGO & foundation', 'Champion a cause, raise funds and run programmes with impact on the ground.', 'Non-governmental organisation'],
  'marque-de-cosmetiques': ['Cosmetics brand', 'Formulation, image, distribution: create desire and deliver effective, safe beauty products.', 'International beauty brand'],
  universite: ['University', 'Research, teaching and degrees: passing on knowledge and preparing students’ careers.', 'Higher education institution'],
  'entreprise-d-energie': ['Energy company', 'Generation, transmission and distribution of electricity: powering regions around the clock.', 'Producer & distributor'],
  'agence-evenementielle': ['Events agency', 'Design and produce memorable events that engage audiences and lift brands.', 'Event communication agency'],
  'collectivite-territoriale': ['Local government', 'Public service, planning and social cohesion, close to citizens.', 'Local public administration'],
  'cabinet-de-recrutement-et-interim': ['Recruitment & staffing agency', 'Find the right talent for companies and handle flexible staffing quickly and rigorously.', 'Employment agency network'],
  'concession-automobile': ['Car dealership', 'New and used car sales, servicing, repair and financing for customers’ mobility.', 'Regional multi-brand dealership'],
  'entreprise-de-securite-privee': ['Private security company', 'Protect property and people, prevent risks and respond fast to incidents.', 'Security services company'],
  'cooperative-de-micro-finance': ['Microfinance cooperative', 'Financial inclusion, community savings and micro-loans for the unbanked.', 'Microfinance institution'],
  'centre-d-appels': ['Call centre', 'Acquisition, support and loyalty: every call is a chance to convert or retain.', 'Outsourced contact centre'],
  'cabinet-de-conseil-en-communication': ['Communications consultancy', 'Strategy, influence and reputation: shape public image and protect brands in any situation.', 'Strategic advisory agency'],
  'association-caritative': ['Charity', 'Fundraising, mobilisation and social action to answer emergencies and help the most vulnerable.', 'Non-governmental organisation'],
  'commerce-de-detail': ['Retail shop', 'Select, showcase and sell quality products while building a loyal local clientele.', 'Store network'],
  'societe-de-nettoyage-b2b': ['B2B cleaning company', 'Cleanliness, hygiene and facility services: the invisible upkeep that keeps workplaces running.', 'Cleaning company'],
  'createur-solo-de-logiciel': ['Solo software maker', 'From idea to code to launch: design, build and monetise an app on your own.', 'Tech micro-business'],
  'academie-de-tutorat-et-coaching-etudiant': ['Tutoring & student coaching academy', 'Personal support, expert tutors and mental coaching to pass exams and competitive tests.', 'Training & coaching organisation'],
  'laboratoire-pharmaceutique': ['Pharmaceutical lab', 'Discover, develop and produce innovative therapies under strict health standards.', 'International biopharma lab'],
  'agence-d-interim-ia': ['AI staffing agency', 'Provide specialised, ready-to-work AI agents to strengthen clients’ teams on demand.', 'AI placement agency'],
  'vente-auto-en-ligne': ['Online car sales', 'Buy, refurbish and deliver used cars: the website that replaces the car lot.', 'Online car dealer'],
};

// Le modèle tel qu'il faut l'afficher dans la langue choisie.
export function modeleTraduit(m, langue) {
  const e = String(langue || '').startsWith('en') ? EN[m?.cle] : null;
  return e ? { ...m, nom: e[0], promesse: e[1], niveau: e[2] } : m;
}

// Le mot d'accueil du directeur, en anglais : « Bonjour. Je suis X, poste. L'équipe est en place — N
// personnes en service, M métiers[, et K postes encore à pourvoir]. Dis-nous… ».
export function accueilEnAnglais(texte) {
  const m = /^Bonjour\. Je suis (.+?), (.+?)\. L'équipe est en place — (\d+) personnes en service, (\d+) métiers(?:, et (\d+) postes encore à pourvoir)?\./.exec(String(texte || ''));
  if (!m) return null;
  return `Hello. I'm ${m[1]}, ${m[2]}. The team is in place — ${m[3]} people on duty, ${m[4]} roles${m[5] ? `, and ${m[5]} positions still open` : ''}. Tell us in one sentence what you want to achieve this week, and we'll split the work.`;
}
