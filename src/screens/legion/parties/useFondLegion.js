import { useEffect } from 'react';

// Le fond de la page, repeint en bleu nuit tant qu'on est dans Legion.
//
// Sans ça, sur téléphone, dès que la page dépasse l'écran, le crème de la
// place de marché réapparaît sous le contenu: Legion est sombre, le <body>
// ne l'est pas. On le repeint en entrant et on rend sa couleur en sortant.
export function useFondLegion() {
  useEffect(() => {
    const avant = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0B1120';
    return () => { document.body.style.backgroundColor = avant; };
  }, []);
}
