// Le 28/09, le bouton « WhatsApp » de la fiche article et de la fiche boutique
// était MORT pour 45 boutiques sur 62 : le champ est saisi en format local
// (« 691024291 ») et `wa.me` exige l'international. Chaque écran avait
// reconstruit son propre lien à la main, et chacun avait oublié l'indicatif.
//
// Ce test empêche que ça revienne. Il ne regarde pas un rendu : il regarde le
// CODE. Un lien WhatsApp se compose avec `whatsappLink`, qui prend le pays de
// la boutique et rend `null` quand il ne peut pas composer — pas de bouton
// vaut mieux qu'un bouton qui fait croire que le message est parti.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fichiers(dossier, acc = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) fichiers(chemin, acc);
    else if (/\.(jsx?|tsx?)$/.test(nom) && !/\.test\./.test(nom)) acc.push(chemin);
  }
  return acc;
}

// Les seules exceptions admises, avec leur raison.
const TOLERE = {
  // Le numéro du support est écrit en dur, déjà au format international.
  'src/screens/buyer/Help.jsx': 'numéro de support constant, déjà international',
  // Composé à partir de `whatsappNumber`, qui a déjà validé l'indicatif.
  'src/screens/admin/AdminDemandes.jsx': 'passe par whatsappNumber',
  // C'est la fonction qui compose le lien.
  'src/lib/phone.js': 'la source',
};

describe('aucun lien WhatsApp composé à la main', () => {
  it("passe par whatsappLink, sinon l'indicatif finit par manquer", () => {
    const coupables = [];
    for (const f of fichiers('src')) {
      const code = readFileSync(f, 'utf8');
      // `wa.me/` suivi d'autre chose que le partage sans destinataire
      // (`wa.me/?text=`, qui laisse la personne choisir son contact).
      const suspect = /wa\.me\/(?!\?)/.test(code) || /wa\.me\/\$\{/.test(code);
      if (suspect && !TOLERE[f.replace(/\\/g, '/')]) coupables.push(f);
    }
    expect(coupables).toEqual([]);
  });
});
