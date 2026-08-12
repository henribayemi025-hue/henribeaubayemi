const KEY = 'finjaro:visitor-id';

// Le jeton d'une visiteuse sans compte.
//
// Beau: « quelqu'un qui n'a pas de compte peut liker les vidéos ». Il faut
// bien distinguer deux appareils, sinon un même cœur compterait pour tout le
// monde ou pour personne.
//
// Ce n'est PAS une identité: rien ici ne dit qui est la personne, ni d'où elle
// vient. C'est un nombre tiré au hasard, gardé dans son navigateur, qui sert
// uniquement à deux choses: ne pas compter deux fois le même téléphone, et
// retrouver son propre cœur rempli quand elle revient.
//
// Si le stockage est indisponible (navigation privée, réglages stricts), on
// renvoie un jeton éphémère: le like partira quand même, il ne sera
// simplement pas reconnu à la visite suivante. Mieux vaut ça qu'un bouton
// qui ne fait rien.
export function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `v-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
