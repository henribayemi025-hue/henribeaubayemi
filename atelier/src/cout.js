// Ce que coûte une session d'atelier : MESURÉ, pas deviné.
//
// - Les modèles : chaque réponse rend ses jetons (champ `usage`) ; on les
//   multiplie par les prix PUBLIÉS, en dollars US comme ils sont publiés
//   (aucune conversion : chacun paie dans sa monnaie). Pour DeepSeek, le
//   tarif des heures pleines, le plus cher, pour ne jamais sous-compter.
// - La machine (le bac à sable) : le temps où le conteneur tourne, multiplié
//   par les tarifs publiés de Cloudflare. Le processeur n'est facturé qu'à
//   l'usage réel, que le Worker ne voit pas : on le compte à 100 %, donc
//   c'est une estimation HAUTE. La part incluse de l'offre payante n'est pas
//   déduite (elle est partagée par tout le compte).
//
// Sources lues le 24/09/2026 :
// - https://api-docs.deepseek.com/quick_start/pricing
// - https://platform.kimi.ai/docs/pricing/chat
// - https://ai.google.dev/gemini-api/docs/pricing (mise à jour du 24/09/2026)
// - https://developers.cloudflare.com/containers/pricing/ (mise à jour du 28/08/2026)
// Quand un fournisseur change ses prix, on change CE tableau.

// dollars par million de jetons : [entrée en cache, entrée, sortie]
export const PRIX_MODELES = {
  'ds:deepseek-flash': [0.006, 0.30, 1.20],
  'ds:deepseek-v4-pro': [0.044, 1.32, 3.96],
  'km:kimi-k2.6': [0.16, 0.95, 4.00],
  'gm:gemini-2.5-flash': [0.03, 0.30, 2.50],
  'gm:gemini-3.5-flash': [0.15, 1.50, 9.00],
  // Prix pour une requête de 200 000 jetons au plus ; l'atelier coupe bien avant.
  'gm:gemini-3.1-pro-preview': [0.20, 2.00, 12.00],
  // OpenAI, page officielle des prix lue le 24/09/2026 (Beau : « Astra doit
  // être présent quand il veut coder »).
  'oa:gpt-6-astra': [1.00, 10.00, 50.00],
  'oa:gpt-6-sol': [0.20, 2.00, 10.00],
  'oa:gpt-5.4-mini': [0.075, 0.75, 4.50],
};

// Cloudflare Containers, offre payante Workers (dollars par seconde et par unité).
export const PRIX_MACHINE = { gioSeconde: 0.0000025, vcpuSeconde: 0.000020, goDisqueSeconde: 0.00000007 };
// Les tailles publiées (vCPU, Gio de mémoire, Go de disque).
export const TAILLES = {
  lite: [1 / 16, 0.25, 2],
  basic: [1 / 4, 1, 4],
  'standard-1': [1 / 2, 4, 8],
  'standard-2': [1, 6, 12],
  'standard-3': [2, 8, 16],
  'standard-4': [4, 12, 20],
};

export function prixMachineParSeconde(taille = 'standard-1') {
  const [vcpu, gio, go] = TAILLES[taille] || TAILLES['standard-1'];
  return vcpu * PRIX_MACHINE.vcpuSeconde + gio * PRIX_MACHINE.gioSeconde + go * PRIX_MACHINE.goDisqueSeconde;
}

// Les jetons d'une réponse compatible OpenAI (DeepSeek, Kimi, Gemini).
export function lireUsage(usage) {
  const u = usage || {};
  const entreeTotale = Number(u.prompt_tokens ?? 0);
  const cache = Number(u.prompt_cache_hit_tokens ?? u.cached_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0);
  const completion = Number(u.completion_tokens ?? 0);
  // Certains fournisseurs comptent la réflexion à part : le total la contient.
  const sortie = Math.max(completion, Number(u.total_tokens ?? 0) - entreeTotale);
  return { entree: Math.max(0, entreeTotale - cache), cache, sortie };
}

export function coutAppel(modele, usage) {
  const prix = PRIX_MODELES[modele];
  const j = lireUsage(usage);
  if (!prix) return { ...j, usd: null };
  return { ...j, usd: (j.cache * prix[0] + j.entree * prix[1] + j.sortie * prix[2]) / 1_000_000 };
}

// Le pire cas d'un appel, AVANT de le faire : pour que le plafond soit dur.
// Un jeton fait au moins ~2,5 caractères : on compte large.
export function estimationMaxAppel(modele, caracteresEntree, maxSortie) {
  const prix = PRIX_MODELES[modele];
  if (!prix) return Infinity; // un modèle sans prix connu ne passe pas le plafond
  return ((caracteresEntree / 2.5) * prix[1] + maxSortie * prix[2]) / 1_000_000;
}

export function arrondi(usd) {
  return Math.round(usd * 10_000) / 10_000;
}
