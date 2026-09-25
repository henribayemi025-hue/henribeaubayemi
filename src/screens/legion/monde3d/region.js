// La ville du monde 3D ressemble à celle de la personne (Beau, 25/09 : photos
// de Yaoundé — le grand rond-point, le marché, les taxis jaunes ; de Tokyo ; de
// Paris). Le lieu vient du fuseau horaire ou de la ville choisie dans la Ville,
// jamais de la langue du téléphone. Aucun texte visible ne nomme un pays : on
// ne change que l'allure (hauteur des tours, circulation, marchés, néons).

export const STYLES = {
  // Afrique : immeubles plus bas, beaucoup de taxis jaunes et de motos-taxis,
  // un marché sur le trottoir, un grand rond-point avec son monument.
  afrique: { hauteur: 0.55, verre: 0.25, taxis: 0.4, motos: 0.35, bus: 0.05, neons: 0.25, marche: true, rondPoint: true, terrasses: false },
  // Europe : immeubles moyens en pierre, terrasses de café, peu de néons.
  europe: { hauteur: 0.5, verre: 0.2, taxis: 0.1, motos: 0.15, bus: 0.1, neons: 0.15, marche: false, rondPoint: true, terrasses: true },
  // Asie de l'Est : grandes tours, néons partout, taxis.
  asie: { hauteur: 1.2, verre: 0.7, taxis: 0.25, motos: 0.2, bus: 0.08, neons: 0.75, marche: false, rondPoint: false, terrasses: false },
  // Amériques : tours de verre, taxis jaunes, grosses voitures.
  amerique: { hauteur: 1.3, verre: 0.8, taxis: 0.3, motos: 0.08, bus: 0.08, neons: 0.35, marche: false, rondPoint: false, terrasses: false },
  // Ailleurs ou inconnu : le mélange d'origine.
  mixte: { hauteur: 1, verre: 0.55, taxis: 0.24, motos: 0.18, bus: 0.08, neons: 0.45, marche: false, rondPoint: false, terrasses: true },
};

const ASIE_EST = /^Asia\/(Tokyo|Seoul|Shanghai|Hong_Kong|Taipei|Singapore|Bangkok|Manila|Kuala_Lumpur|Jakarta|Ho_Chi_Minh|Macau|Chongqing|Harbin|Pyongyang)/;

export function regionDuFuseau(tz) {
  const s = String(tz || '');
  if (s.startsWith('Africa/')) return 'afrique';
  if (s.startsWith('Europe/') || s.startsWith('Atlantic/Canary') || s.startsWith('Atlantic/Madeira')) return 'europe';
  if (ASIE_EST.test(s)) return 'asie';
  if (s.startsWith('America/')) return 'amerique';
  return 'mixte';
}

export function styleVille(tz) {
  const nom = regionDuFuseau(tz);
  return { nom, ...STYLES[nom] };
}
