// L'export .zip du projet (V0 : la seule façon de sortir le code — pas
// d'envoi sur GitHub, pas de déploiement). Fait par le Worker à partir de
// sa copie des fichiers : le bac à sable n'intervient pas.
//
// Format ZIP « stocké » (sans compression) : simple, lisible par tous les
// systèmes, et nos projets V0 sont petits. Pur, testé.

const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(octets) {
  let c = 0xffffffff;
  for (let i = 0; i < octets.length; i++) c = TABLE[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dateDos(d) {
  const heure = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const jour = ((Math.max(1980, d.getUTCFullYear()) - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { heure, jour };
}

// fichiers : [{ chemin, contenu (string) }] → Uint8Array
export function fabriquerZip(fichiers, { dossier = '', quand = new Date() } = {}) {
  const enc = new TextEncoder();
  const { heure, jour } = dateDos(quand);
  const locaux = [];
  const centraux = [];
  let decalage = 0;
  for (const f of fichiers) {
    const nom = enc.encode((dossier ? `${dossier}/` : '') + f.chemin);
    const data = typeof f.contenu === 'string' ? enc.encode(f.contenu) : f.contenu;
    const crc = crc32(data);
    const local = new Uint8Array(30 + nom.length);
    const v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 0x0800, true); // noms en UTF-8
    v.setUint16(8, 0, true); // stocké
    v.setUint16(10, heure, true);
    v.setUint16(12, jour, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, data.length, true);
    v.setUint32(22, data.length, true);
    v.setUint16(26, nom.length, true);
    v.setUint16(28, 0, true);
    local.set(nom, 30);
    locaux.push(local, data);

    const central = new Uint8Array(46 + nom.length);
    const w = new DataView(central.buffer);
    w.setUint32(0, 0x02014b50, true);
    w.setUint16(4, 20, true);
    w.setUint16(6, 20, true);
    w.setUint16(8, 0x0800, true);
    w.setUint16(10, 0, true);
    w.setUint16(12, heure, true);
    w.setUint16(14, jour, true);
    w.setUint32(16, crc, true);
    w.setUint32(20, data.length, true);
    w.setUint32(24, data.length, true);
    w.setUint16(28, nom.length, true);
    w.setUint32(42, decalage, true);
    central.set(nom, 46);
    centraux.push(central);
    decalage += local.length + data.length;
  }
  const tailleCentrale = centraux.reduce((t, c) => t + c.length, 0);
  const fin = new Uint8Array(22);
  const e = new DataView(fin.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, fichiers.length, true);
  e.setUint16(10, fichiers.length, true);
  e.setUint32(12, tailleCentrale, true);
  e.setUint32(16, decalage, true);
  const morceaux = [...locaux, ...centraux, fin];
  const total = morceaux.reduce((t, m) => t + m.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const m of morceaux) { out.set(m, o); o += m.length; }
  return out;
}
