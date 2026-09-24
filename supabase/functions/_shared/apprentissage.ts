// La Finia commune (0202) — reconnaître ce qui vaut la peine d'être appris,
// et nettoyer un texte avant qu'il ne serve.
//
// Module PUR (aucune API de Deno ni de Supabase) : finou-chat et
// finia-apprentissage s'en servent, et les tests de la place de marché le
// vérifient (src/lib/apprentissage.test.js).
//
// Le nettoyage VRAI se fait dans la base (ia_nettoyer, 0202) : tout ce qui
// entre dans ia_apprentissage y passe, quelle que soit l'application. Ici,
// c'est le même filet, pour ce qui ne passe pas par la base : ce qu'un
// modèle PROPOSE comme savoir, relu avant d'être montré à Beau.

// Ce que Finia répond quand elle n'a pas su. Seulement des tournures
// franches : « je ne sais pas », « je n'ai pas cette information », « je ne
// peux pas te répondre »… Pas « je ne trouve pas d'article » : un rayon vide
// est déjà suivi ailleurs (demandes_acheteurs), ce n'est pas un savoir qui
// manque.
const SANS_REPONSE = [
  /\bje ne (le )?sais (pas|rien)\b/i,
  /\bje n['’]en sais rien\b/i,
  /\bje n['’]ai pas (cette |l['’]|d['’]|de |la )?(information|info|réponse|reponse)s?\b/i,
  /\bje ne (suis pas|peux pas) (en mesure de )?(te |vous )?(répondre|repondre|le dire|l['’]affirmer)\b/i,
  /\bje ne connais pas (la réponse|la reponse|ce|cette)\b/i,
  /\bje n['’]ai pas bien compris\b/i,
  /\bI (do not|don['’]t) know\b/i,
  /\bI (do not|don['’]t) have (that|this|the) (information|info|answer)\b/i,
  /\bI['’]m not (sure|able to answer)\b/i,
  /\bI (can['’]t|cannot) answer\b/i,
];
export function estSansReponse(reponse: string): boolean {
  const t = String(reponse || '');
  return SANS_REPONSE.some((re) => re.test(t));
}

// La personne corrige Finia : « non, ce n'est pas ça », « c'est faux », « tu
// te trompes », « that's wrong »… Le début du message compte le plus : un
// « non » au milieu d'une phrase n'est pas une correction.
const CORRECTION = [
  /^\s*(non|nan|no|nope)\b[\s,.!]*(ce n['’]est pas|c['’]est pas|pas ça|pas ca|c['’]est faux|tu te trompes|that['’]?s not|it['’]?s not|wrong)/i,
  /\b(c['’]est|c)\s*(faux|pas vrai|pas (du tout )?ça|pas (du tout )?ca|pas ce que (j['’]ai|je t['’]ai) demandé)\b/i,
  /\btu (te trompes|t['’]es trompée?|as tort|n['’]as pas compris|réponds? à côté)\b/i,
  /\b(ce n['’]est|c['’]est) pas (la bonne|le bon|ce que je)\b/i,
  /\bthat['’]?s (wrong|not (right|true|what I asked|it))\b/i,
  /\b(you['’]re|you are) wrong\b/i,
  /\bnot what I asked\b/i,
];
export function estCorrection(message: string): boolean {
  const t = String(message || '').trim();
  if (!t || t.length > 600) return false;
  return CORRECTION.some((re) => re.test(t));
}

// Le même nettoyage que ia_nettoyer (0202), dans le même ordre.
export function nettoyer(texte: string): string {
  let t = String(texte || '');
  t = t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-mail]');
  t = t.replace(/https?:\/\/\S+/gi, '[lien]').replace(/www\.\S+/gi, '[lien]');
  t = t.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[numéro]');
  t = t.replace(/((?:commande|order|cmd)\s*(?:n°|no\.?|num[ée]ro|number|#)?\s*:?\s*)#?[A-Za-z0-9-]*[0-9][A-Za-z0-9-]*/gi, '$1[numéro de commande]');
  t = t.replace(/#\s?[A-Za-z0-9-]*[0-9][A-Za-z0-9-]*/g, '[numéro]');
  t = t.replace(/\+?[0-9](?:[\s.()-]*[0-9]){7,}/g, '[téléphone]');
  t = t.replace(/[0-9]{6,}/g, '[numéro]');
  t = t.replace(/[0-9]{1,4}\s*(?:bis|ter)?,?\s+(?:rue|avenue|av\.|boulevard|bd|chemin|all[ée]e|impasse|place|route|quai|street|st\.|road|rd\.|lane|drive)\s+[^,.;!?\n]{2,40}/gi, '[adresse]');
  t = t.replace(/(^|[^\p{L}\p{N}])(?:rue|avenue|boulevard|impasse|street|road)\s+[^,.;!?\n]{2,40}/giu, '$1[adresse]');
  t = t.replace(/(?:B\.?P\.?|P\.?O\.? ?Box)\s*[0-9]+/gi, '[adresse]');
  t = t.replace(/(je m['’]appelle|mon nom est|mon nom c['’]est|my name is|call me|appelez-moi|appelle-moi|moi c['’]est)\s+[^\s,.;!?]+(?:\s+\p{Lu}[^\s,.;!?]*)?/giu, '$1 [nom]');
  t = t.replace(/(^|[^\p{L}\p{N}])(M\.|Mr\.?|Mrs\.?|Ms\.?|Mme|Mlle|Madame|Monsieur|Dr\.?)\s+\p{Lu}[\p{L}\p{N}'’-]+/gu, '$1$2 [nom]');
  t = t.replace(/@[A-Za-z0-9_.]{2,}/g, '[pseudo]');
  return t.trim();
}

// Un texte qui garde encore une trace de donnée personnelle après
// nettoyage ne doit pas être proposé (filet pour les propositions de savoir).
export function contientDonneePerso(texte: string): boolean {
  const t = String(texte || '');
  return nettoyer(t) !== t.trim();
}

// Les nombres d'un texte (« 7 jours », « 1 500 », « 20 % »), pour vérifier
// qu'une proposition n'en invente pas : chaque nombre doit venir des
// échanges d'où elle est tirée (CLAUDE.md §3, aucun chiffre inventé).
export function nombres(texte: string): string[] {
  return (String(texte || '').match(/\d[\d\s.,]*\d|\d/g) || []).map((n) => n.replace(/[\s.,]/g, ''));
}
