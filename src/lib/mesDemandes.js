// Les demandes passées sans compte depuis CE téléphone (idée 3 du 01/10).
//
// Gardées au moment de l'envoi, pour que « Mes demandes » (/ma-commande)
// retrouve le suivi sans compte et sans rien en base. Vingt au plus, les
// plus récentes d'abord. Un stockage bloqué (navigation privée) ne casse
// rien: la liste est vide, le lien envoyé par la boutique marche toujours.

const KEY = 'finjaro_mes_demandes';

export function mesDemandes() {
  try {
    const liste = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(liste) ? liste.filter((d) => d && d.id) : [];
  } catch {
    return [];
  }
}

export function garderDemande({ id, no, shop }) {
  if (!id) return;
  try {
    const liste = [{ id, no: no || '', shop: shop || '', at: new Date().toISOString() }, ...mesDemandes().filter((d) => d.id !== id)].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(liste));
  } catch {
    /* stockage indisponible: le lien de la boutique reste le chemin */
  }
}

// Le lien public de suivi. Toujours l'adresse de production: c'est celui que
// la vendeuse envoie sur WhatsApp, il doit marcher où qu'on l'ouvre.
export function lienSuivi(id) {
  return `https://finjaro.net/ma-commande/${id}`;
}
