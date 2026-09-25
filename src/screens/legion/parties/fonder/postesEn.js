// Les postes du catalogue en anglais (lot 1.7, 25/09).
//
// Beau (audit) : sur un compte anglais, les 3 535 postes restaient en
// français. Les traductions vivent dans un fichier de l'application
// (public/leo/postes-en.json, écrit par le moteur par lots de 120, relu par
// échantillon), chargé une seule fois et seulement quand l'écran est en
// anglais. Sans le fichier, ou pour un poste qu'il ne connaît pas, le
// français reste : on ne montre jamais une case vide.
//
//   { "<modele>|<poste fr>": ["poste en", "département en", "mandat en"] }

let promesse = null;

export function chargerPostesEn() {
  if (!promesse) {
    promesse = fetch('/leo/postes-en.json', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return promesse;
}

export const enAnglais = (langue) => String(langue || '').toLowerCase().startsWith('en');

// Le département en anglais, celui que la table donne le plus souvent pour
// ce département de ce modèle (la traduction s'est faite poste par poste).
function departementsDe(table) {
  const votes = new Map();
  for (const [k, v] of Object.entries(table || {})) {
    const modele = k.split('|')[0];
    if (!v?.[1]) continue;
    const cle = `${modele}|${v[1]}`;
    votes.set(cle, (votes.get(cle) || 0) + 1);
  }
  return votes;
}

// Un poste (ligne de studio_modele_postes, ou poste de l'équipe composée)
// traduit s'il l'est ; sinon tel quel. `table` = le fichier chargé.
export function traduirePoste(p, table, deptEn) {
  if (!p || !table) return p;
  const v = table[`${p.modele}|${p.poste}`];
  if (!v) return p;
  const departement = (deptEn && deptEn.get(`${p.modele}|${p.departement}`)) || v[1] || p.departement;
  return { ...p, poste_fr: p.poste, departement_fr: p.departement, mandat_fr: p.mandat, poste: v[0] || p.poste, departement, mandat: v[2] || p.mandat };
}

// Toute une liste, avec des départements cohérents : pour un même
// département français d'un modèle, un seul libellé anglais (le plus
// fréquent dans la table).
export function traduirePostes(postes, table) {
  if (!table || !postes?.length) return postes;
  const votes = departementsDe(table);
  const parDept = new Map(); // "modele|dept fr" → "dept en"
  for (const p of postes) {
    const v = table[`${p.modele}|${p.poste}`];
    if (!v?.[1] || !p.departement) continue;
    const cle = `${p.modele}|${p.departement}`;
    const actuel = parDept.get(cle);
    if (!actuel || (votes.get(`${p.modele}|${v[1]}`) || 0) > (votes.get(`${p.modele}|${actuel}`) || 0)) parDept.set(cle, v[1]);
  }
  return postes.map((p) => traduirePoste(p, table, parDept));
}
