// Où vit une discussion, et pourquoi ça se décide ici.
//
// Il y a DEUX sortes de fils: avec une boutique (/chat/<id>) et avec une
// personne (/profile/messages/<id>). La règle « dans un fil, on efface la
// barre d'onglets et la bulle Finia » ne connaissait que le premier, si bien
// que dans un fil personnel Finia se posait pile sur le bouton d'envoi —
// Astrid, une vraie utilisatrice: « Pourquoi je peux pas cliquer sur la
// fleche d'envoi ? ».
//
// La règle vit donc ici, partagée par la barre de navigation et la mise en
// page, pour qu'un troisième type de fil ne puisse plus en oublier une.
const FILS = [/^\/chat\/[^/]+/, /^\/vendor\/messages\/[^/]+/, /^\/profile\/messages\/[^/]+/];

export function estFilDiscussion(pathname) {
  return FILS.some((re) => re.test(pathname));
}
