import { useEffect } from 'react';

// La hauteur VISIBLE de l'écran, clavier compris — pour que Legion se
// comporte comme WhatsApp quand on touche la zone de saisie.
//
// Beau, 22/09, capture à l'appui: « regarde comment ça s'ouvre quand
// j'appuie ». Sur iPhone, le clavier ne rétrécit pas la page: Safari la
// fait glisser vers le haut sous le clavier, l'en-tête disparaît et le haut
// de l'écran devient un grand vide. `100dvh` n'y change rien (le clavier
// n'en fait pas partie).
//
// Le remède: on lit `visualViewport` (la partie réellement visible), on
// cale l'application dessus — hauteur et position — et on annule le
// glissement de Safari. Le fil rétrécit, la zone de saisie se pose juste
// au-dessus du clavier, l'en-tête reste en place.
export function useEcranVisible() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const racine = document.documentElement;
    const maj = () => {
      racine.style.setProperty('--legion-h', `${Math.round(vv.height)}px`);
      racine.style.setProperty('--legion-top', `${Math.round(vv.offsetTop)}px`);
    };
    // Safari fait glisser la page quand le clavier s'ouvre: on la remet en
    // haut, l'application étant déjà à la bonne hauteur.
    const recaler = () => { maj(); if (window.scrollY !== 0) window.scrollTo(0, 0); };
    maj();
    vv.addEventListener('resize', recaler);
    vv.addEventListener('scroll', maj);
    return () => {
      vv.removeEventListener('resize', recaler);
      vv.removeEventListener('scroll', maj);
      racine.style.removeProperty('--legion-h');
      racine.style.removeProperty('--legion-top');
    };
  }, []);
}
