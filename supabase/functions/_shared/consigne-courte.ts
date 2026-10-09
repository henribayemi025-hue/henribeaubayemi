// La consigne COURTE (08/10, Beau : « ok pour Groq, on fait comme ça ») : la même tâche,
// les mêmes règles et le même format de réponse, mais le contexte resserré — pour les
// moteurs gratuits à petite part par minute (Groq : 8 000 jetons, réponse comprise).
// Trois niveaux de resserrage ; on garde le premier qui tient sous `max` signes.
// Ce qui ne bouge jamais : la charte, l'identité, la tâche, les règles absolues, « ÉCRIS ».
// Partagée depuis le 09/10 : les réponses dans les salons (legion-repondre) n'en avaient
// pas, et une consigne de 23 450 jetons sautait les trois modèles Groq d'un coup.
export const COMPACTE_MAX = 14_500;
export type Resserrage = { n: number; coupe: (t: string, max: number) => string; garde: <T>(l: T[], max: number) => T[] };
export function consigneCourte(construire: (r: Resserrage) => string, max = COMPACTE_MAX): string {
  const niveaux = [1, 0.6, 0.3];
  let derniere = '';
  for (const k of niveaux) {
    const r: Resserrage = {
      n: k,
      coupe: (t, m) => { const borne = Math.max(80, Math.round(m * k)); return t.length > borne ? `${t.slice(0, borne)}…` : t; },
      garde: (l, m) => l.slice(0, Math.max(1, Math.round(m * k))),
    };
    derniere = construire(r);
    if (derniere.length <= max) return derniere;
  }
  return derniere; // trop longue même resserrée : moteur.ts le dira (« consigne trop longue »)
}
