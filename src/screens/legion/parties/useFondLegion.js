import { useEffect, useState } from 'react';

// Le fond de la page, repeint tant qu'on est dans Léo, dans la palette choisie.
//
// Sans ça, sur téléphone, dès que la page dépasse l'écran, le crème de la
// place de marché réapparaît sous le contenu: Léo est sombre, le <body>
// ne l'est pas. On le repeint en entrant et on rend sa couleur en sortant.
//
// Deux palettes depuis le 25/09 (Beau : « deux palettes, la sombre et le blanc de
// Finjaro, il doit pouvoir choisir ») : « sombre » (le logo, bleu nuit et laiton) ou
// « clair » (la crème et la terracotta de la place de marché). Le choix est gardé sur
// l'appareil ; sans choix, la sombre — celle que Beau a validée le 22/09.
const CLE = 'leo:palette';
const FONDS = { sombre: '#0B1120', clair: '#FAF6F0' };
const EVENEMENT = 'leo:palette';

export function lirePalette() {
  try { return localStorage.getItem(CLE) === 'clair' ? 'clair' : 'sombre'; } catch { return 'sombre'; }
}

export function appliquerPalette(palette) {
  const p = palette === 'clair' ? 'clair' : 'sombre';
  try { localStorage.setItem(CLE, p); } catch { /* navigation privée */ }
  document.documentElement.dataset.leo = p;
  document.body.style.backgroundColor = FONDS[p];
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: p }));
}

export function useFondLegion() {
  useEffect(() => {
    const avant = document.body.style.backgroundColor;
    const p = lirePalette();
    document.documentElement.dataset.leo = p;
    document.body.style.backgroundColor = FONDS[p];
    return () => { document.body.style.backgroundColor = avant; delete document.documentElement.dataset.leo; };
  }, []);
}

// La palette courante, et de quoi la changer — pour le bouton soleil / lune.
export function usePalette() {
  const [palette, setPalette] = useState(lirePalette);
  useEffect(() => {
    const suivre = (e) => setPalette(e.detail);
    window.addEventListener(EVENEMENT, suivre);
    return () => window.removeEventListener(EVENEMENT, suivre);
  }, []);
  return [palette, (p) => appliquerPalette(p)];
}
