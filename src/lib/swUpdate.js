// Quand une mise à jour a le droit de recharger l'écran.
//
// À chaque déploiement (il y en a eu QUATRE le 27/08), le service worker se
// met à jour et prenait le contrôle en rechargeant la page SUR-LE-CHAMP,
// sans regarder ce que la personne était en train de faire. Deux dégâts
// constatés par Beau le même jour, en vrai:
//
//   * Il tape son mot de passe, touche « Se connecter » — la page se
//     recharge en plein envoi, l'appel est coupé, et l'écran accuse... la
//     connexion internet. Le réseau n'y était pour rien.
//   * Dans Finia, il touche l'icône photo — l'appareil photo passe l'app en
//     arrière-plan, le retour déclenche la vérification de mise à jour, et
//     la page se recharge pendant que la photo revient: app blanche, morte.
//
// Règle: on ne recharge QUE si personne n'a encore touché l'écran. Dès le
// premier geste (doigt ou clavier), plus aucun rechargement automatique —
// la nouvelle version attendra la prochaine ouverture, que le service
// worker sert de toute façon fraîche (réseau d'abord sur les navigations).
// Et si un morceau de l'ancienne version vient vraiment à manquer,
// lazyWithReload (App.jsx) recharge à ce moment-là, sur un écran déjà cassé
// — jamais sous les doigts de quelqu'un.
export function creerGardienRechargement() {
  let aTouche = false;
  const marquer = () => {
    aTouche = true;
  };
  return {
    ecouter(win = window) {
      // capture: true — certains écrans arrêtent la propagation des clics.
      win.addEventListener('pointerdown', marquer, { capture: true, passive: true });
      win.addEventListener('keydown', marquer, { capture: true });
    },
    peutRecharger: () => !aTouche,
  };
}
