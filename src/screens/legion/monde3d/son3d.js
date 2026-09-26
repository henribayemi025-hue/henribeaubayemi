// Le son du monde 3D (Beau, 25/09 au soir : « il n'y a pas le son dans le téléphone »).
// Tout est fabriqué dans le navigateur (Web Audio) : aucun fichier à télécharger,
// aucun droit à payer. Le téléphone n'accepte le son qu'après un premier toucher :
// demarrer() est appelé à ce moment-là. Coupé ou non, c'est gardé sur l'appareil.
//
//   ambiance : la ville dehors (rumeur, klaxons au loin), le hall (une salle calme),
//              la mer chez les agents (vagues) ;
//   moteur   : voiture, moto, hélicoptère, bateau, selon la vitesse ;
//   pas      : en marchant, en courant ;
//   effets   : choc, trottoir, klaxon.

const CLE = 'leo:son-coupe';

function lire() { try { return localStorage.getItem(CLE) === '1'; } catch { return false; } }
function ecrire(v) { try { localStorage.setItem(CLE, v ? '1' : '0'); } catch { /* navigation privée */ } }

export function creerSon() {
  let ctx = null;
  let maitre = null;
  let coupe = lire();
  let bruit = null; // un tampon de bruit rose, partagé
  const etat = { lieu: 'hall', dehors: false, vehicule: null, kmh: 0, allure: 0, prochainPas: 0, prochainKlaxon: 0 };
  let amb = null; // { src, filtre, gain, lfo }
  let mot = null; // { osc, osc2, filtre, gain, lfo }

  function tamponBruit() {
    const n = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i += 1) { // bruit rose (filtre de Paul Kellet, version courte)
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    }
    return b;
  }

  function source() { const s = ctx.createBufferSource(); s.buffer = bruit; s.loop = true; return s; }

  function demarrer() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!C) return;
    ctx = new C();
    maitre = ctx.createGain(); maitre.gain.value = coupe ? 0 : 0.9; maitre.connect(ctx.destination);
    bruit = tamponBruit();
    ambiance();
  }

  // L'ambiance du lieu : on la refait en fondu quand on change de lieu ou qu'on sort.
  function ambiance() {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (amb) { const a = amb; a.gain.gain.setTargetAtTime(0, t, 0.4); setTimeout(() => { try { a.src.stop(); a.lfo?.stop(); } catch { /* déjà arrêté */ } }, 2000); }
    const src = source();
    const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass';
    const gain = ctx.createGain(); gain.gain.value = 0;
    let lfo = null;
    let niveau;
    if (etat.lieu === 'maisons') {
      // La mer : un bruit plus clair qui monte et descend, comme des vagues (7 s).
      filtre.frequency.value = 900; niveau = 0.55;
      lfo = ctx.createOscillator(); lfo.frequency.value = 1 / 7;
      const prof = ctx.createGain(); prof.gain.value = 0.35;
      lfo.connect(prof); prof.connect(gain.gain); lfo.start();
    } else if (etat.lieu === 'hall' && etat.dehors) {
      filtre.frequency.value = 520; niveau = 0.6; // la rumeur de la ville
    } else {
      filtre.frequency.value = 260; niveau = 0.22; // une salle calme
    }
    src.connect(filtre); filtre.connect(gain); gain.connect(maitre); src.start();
    gain.gain.setTargetAtTime(niveau, t, 0.6);
    amb = { src, filtre, gain, lfo };
  }

  function bip(freqs, duree, volume = 0.18, type = 'square') {
    if (!ctx || coupe) return;
    const t = ctx.currentTime;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(volume, t + 0.02); g.gain.setTargetAtTime(0, t + duree, 0.05);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    g.connect(f); f.connect(maitre);
    for (const fr of freqs) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.connect(g); o.start(t); o.stop(t + duree + 0.3); }
  }

  function coup(volume, grave = 180, duree = 0.25) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime;
    const s = source(); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = grave;
    const g = ctx.createGain(); g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    s.connect(f); f.connect(g); g.connect(maitre); s.start(t); s.stop(t + duree + 0.05);
  }

  function moteurCreer(genre) {
    const t = ctx.currentTime;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 700;
    filtre.connect(gain); gain.connect(maitre);
    let osc = null, osc2 = null, lfo = null, src = null;
    if (genre === 'helico') {
      // Les pales : un bruit sourd, coupé au rythme du rotor.
      src = source(); src.connect(filtre); filtre.frequency.value = 400; src.start();
      lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 11;
      const prof = ctx.createGain(); prof.gain.value = 0.12; lfo.connect(prof); prof.connect(gain.gain); lfo.start();
    } else {
      osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.connect(filtre); osc.start();
      osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.connect(filtre); osc2.start();
      if (genre === 'bateau') { src = source(); const fb = ctx.createBiquadFilter(); fb.type = 'lowpass'; fb.frequency.value = 600; src.connect(fb); fb.connect(filtre); src.start(); }
    }
    gain.gain.setTargetAtTime(genre === 'helico' ? 0.22 : 0.13, t, 0.3);
    return { genre, osc, osc2, lfo, src, filtre, gain };
  }

  function moteurArreter() {
    if (!mot) return;
    const m = mot; mot = null;
    m.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => { for (const n of [m.osc, m.osc2, m.lfo, m.src]) { try { n?.stop(); } catch { /* déjà arrêté */ } } }, 800);
  }

  return {
    demarrer,
    get coupe() { return coupe; },
    basculer() {
      coupe = !coupe; ecrire(coupe);
      demarrer();
      if (maitre) maitre.gain.setTargetAtTime(coupe ? 0 : 0.9, ctx.currentTime, 0.05);
      return coupe;
    },
    lieu(l) { if (etat.lieu === l) return; etat.lieu = l; ambiance(); },
    dehors(d) { if (etat.dehors === d) return; etat.dehors = d; ambiance(); },
    vehicule(genre, kmh = 0) {
      etat.vehicule = genre; etat.kmh = kmh;
      if (!ctx) return;
      if (!genre) { moteurArreter(); return; }
      if (!mot || mot.genre !== genre) { moteurArreter(); mot = moteurCreer(genre); }
      const t = ctx.currentTime;
      if (mot.osc) {
        const base = genre === 'bateau' ? 34 : 48;
        const f = base + Math.min(160, kmh) * (genre === 'bateau' ? 0.6 : 1.1);
        mot.osc.frequency.setTargetAtTime(f, t, 0.12); mot.osc2.frequency.setTargetAtTime(f * 1.5, t, 0.12);
        mot.filtre.frequency.setTargetAtTime(500 + Math.min(160, kmh) * 9, t, 0.15);
      } else {
        mot.lfo.frequency.setTargetAtTime(11 + Math.min(200, kmh) / 20, t, 0.3);
      }
    },
    // Appelé à chaque pas de simulation : 0 arrêté, 1 marche, 2 course.
    allure(a, maintenant = performance.now()) {
      etat.allure = a;
      if (!ctx || coupe) return;
      if (a > 0 && !etat.vehicule && maintenant > etat.prochainPas) {
        etat.prochainPas = maintenant + (a === 2 ? 300 : 480);
        coup(0.16, a === 2 ? 260 : 200, 0.09);
      }
      // En ville, dehors, un klaxon au loin de temps en temps.
      if (etat.lieu === 'hall' && etat.dehors && maintenant > etat.prochainKlaxon) {
        if (etat.prochainKlaxon) bip([330 + Math.random() * 80, 415 + Math.random() * 60], 0.25 + Math.random() * 0.3, 0.035);
        etat.prochainKlaxon = maintenant + 9000 + Math.random() * 14000;
      }
    },
    effet(type, force = 10) {
      if (type === 'choc') coup(Math.min(0.9, 0.2 + force / 30), 220, 0.35);
      else if (type === 'trottoir') coup(0.35, 160, 0.18);
      else if (type === 'klaxon') bip([392, 494], 0.45, 0.2);
    },
    arreter() {
      moteurArreter();
      try { amb?.src.stop(); amb?.lfo?.stop(); } catch { /* déjà arrêté */ }
      try { ctx?.close(); } catch { /* déjà fermé */ }
      ctx = null; amb = null;
    },
  };
}
