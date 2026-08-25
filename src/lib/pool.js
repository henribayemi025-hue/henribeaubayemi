// File d'attente a largeur fixe, partagee par l'ajout en masse et le
// renommage: envoyer 72 requetes d'un coup fait tomber les connexions
// mobiles, et Google plafonne son IA a une quinzaine d'appels par minute.
export async function runPool(items, size, worker) {
  const queue = [...items.entries()];
  const runners = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) {
      const [index, item] = queue.shift();
      await worker(item, index);
    }
  });
  await Promise.all(runners);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Une photo a la fois, espacee: au-dela, Google refuse la majorite des
// appels et l'ecran ne remplit rien (constate le 04/08).
export const AI_POOL = 1;
export const AI_SPACING_MS = 1500;
