// La voix d'un agent au téléphone (D3, relevé du 25/09 : « ça sonne, il
// décroche, « allô », mains libres, vraie voix d'homme ou de femme »).
// Tout est gratuit et local : la sonnerie est fabriquée par le navigateur,
// la voix est celle du téléphone. Chaque agent garde la même voix et le
// même ton d'un appel à l'autre.

const FEMME = /female|femme|woman|amelie|amélie|audrey|marie|julie|virginie|celine|céline|hortense|denise|aurelie|aurélie|samantha|victoria|karen|zira|susan|serena|moira|tessa|fiona|allison|ava|joanna|salli/i;
const HOMME = /\bmale\b|homme|\bman\b|thomas|daniel|paul|nicolas|henri|claude|alex\b|fred|mark|david|george|guy|jacques|mathieu|antoine|james|tom\b|oliver|arthur/i;

// Le genre d'un agent, d'après la description de son portrait ; à défaut, rien.
export function genreDe(agent) {
  const d = String(agent?.apparence?.description || '');
  if (/\b(woman|female|girl|lady|femme|fille)\b/i.test(d)) return 'f';
  if (/\b(man|male|boy|guy|homme|garçon)\b/i.test(d)) return 'm';
  if (agent?.apparence?.barbe && agent.apparence.barbe !== 'aucune') return 'm';
  return null;
}

function empreinte(texte) {
  let h = 0;
  for (const c of String(texte || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// La voix du navigateur la plus proche : la langue, puis le genre, puis
// toujours la même pour un même agent.
export function choisirVoix(voix, langue, genre, cle) {
  const code = langue === 'en' ? 'en' : 'fr';
  const dansLaLangue = (voix || []).filter((v) => String(v.lang || '').toLowerCase().startsWith(code));
  if (!dansLaLangue.length) return null;
  const estFemme = (v) => FEMME.test(v.name || '');
  const estHomme = (v) => !estFemme(v) && HOMME.test(v.name || '');
  const bonnes = genre === 'f' ? dansLaLangue.filter(estFemme) : genre === 'm' ? dansLaLangue.filter(estHomme) : [];
  const liste = bonnes.length ? bonnes : dansLaLangue;
  return liste[empreinte(cle) % liste.length];
}

// Un ton propre à chaque agent, entre 0,9 et 1,1.
export function tonDe(cle) {
  return 0.9 + (empreinte(cle) % 21) / 100;
}

// Deux sonneries de téléphone (440 + 480 Hz, comme une ligne fixe). Rend une
// promesse résolue à la fin ; rien ne se passe si le navigateur n'a pas d'audio.
export function sonner(fois = 2) {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return Promise.resolve();
  const c = new Ctx();
  const t0 = c.currentTime + 0.05;
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(c.destination);
  for (const f of [440, 480]) {
    const o = c.createOscillator();
    o.frequency.value = f;
    o.connect(gain);
    o.start(t0);
    o.stop(t0 + fois * 2);
  }
  for (let i = 0; i < fois; i++) {
    gain.gain.setValueAtTime(0.12, t0 + i * 2);
    gain.gain.setValueAtTime(0, t0 + i * 2 + 1.2);
  }
  return new Promise((ok) => setTimeout(() => { c.close?.().catch?.(() => {}); ok(); }, fois * 2000 + 100));
}
