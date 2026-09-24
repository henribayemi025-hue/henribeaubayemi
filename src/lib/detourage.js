// « Retirer le fond » — côté page: préparer l'image, parler au Web Worker
// (detourage.worker.js), puis poser l'objet détouré sur un fond uni.
//
// Ce module n'est importé QU'AU PREMIER APPUI (import dynamique depuis
// components/RetirerFond.jsx): ni lui, ni le moteur, ni le modèle ne pèsent
// sur le chargement de l'application.

// Taille d'entrée du modèle u2netp.
const TAILLE = 320;
// Normalisation ImageNet, la même que rembg pour ce fichier ONNX.
const MOYENNE = [0.485, 0.456, 0.406];
const ECART = [0.229, 0.224, 0.225];
// Même plafond que l'envoi (lib/image.js): inutile de travailler plus grand
// que ce qui sera stocké, et un téléphone modeste manque vite de mémoire.
const MAX_DIM = 1200;

let worker = null;
let suivant = 0;
const enAttente = new Map();

function toutRejeter(err) {
  for (const p of enAttente.values()) p.reject(err);
  enAttente.clear();
}

function lancerWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./detourage.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const p = enAttente.get(e.data.id);
    if (!p) return;
    enAttente.delete(e.data.id);
    if (e.data.ok) p.resolve(e.data);
    else p.reject(new Error(e.data.error || 'detourage'));
  };
  worker.onerror = (e) => {
    toutRejeter(new Error(e.message || 'detourage'));
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function demander(message, transfert = []) {
  return new Promise((resolve, reject) => {
    const id = ++suivant;
    enAttente.set(id, { resolve, reject });
    try {
      lancerWorker().postMessage({ ...message, id }, transfert);
    } catch (err) {
      enAttente.delete(id);
      reject(err);
    }
  });
}

// Télécharge (la première fois) et initialise le moteur et le modèle.
export function preparer() {
  return demander({ type: 'preparer' });
}

function chargerImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

function toile(largeur, hauteur) {
  const c = document.createElement('canvas');
  c.width = largeur;
  c.height = hauteur;
  return c;
}

// Pixels RGBA 320×320 → tenseur CHW normalisé. Comme rembg: division par la
// valeur la plus forte de l'image, puis moyenne/écart ImageNet.
export function versTenseur(rgba, taille = TAILLE) {
  const n = taille * taille;
  let max = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] > max) max = rgba[i];
    if (rgba[i + 1] > max) max = rgba[i + 1];
    if (rgba[i + 2] > max) max = rgba[i + 2];
  }
  max = max || 1;
  const sortie = new Float32Array(3 * n);
  for (let p = 0; p < n; p++) {
    for (let c = 0; c < 3; c++) {
      sortie[c * n + p] = (rgba[p * 4 + c] / max - MOYENNE[c]) / ECART[c];
    }
  }
  return sortie;
}

// Détoure une image (Blob). Renvoie une toile de la taille de l'image, où le
// fond est transparent — à passer ensuite à composer().
export async function detourer(blob) {
  const img = await chargerImage(blob);
  let largeur = img.naturalWidth;
  let hauteur = img.naturalHeight;
  const echelle = Math.min(1, MAX_DIM / Math.max(largeur, hauteur));
  largeur = Math.round(largeur * echelle);
  hauteur = Math.round(hauteur * echelle);

  const source = toile(largeur, hauteur);
  source.getContext('2d').drawImage(img, 0, 0, largeur, hauteur);

  // Le modèle voit l'image étirée en 320×320 (comme rembg); le masque est
  // ensuite ré-étiré à la taille réelle, donc les proportions reviennent.
  const petite = toile(TAILLE, TAILLE);
  const cp = petite.getContext('2d', { willReadFrequently: true });
  cp.drawImage(source, 0, 0, TAILLE, TAILLE);
  const input = versTenseur(cp.getImageData(0, 0, TAILLE, TAILLE).data);

  const { masque } = await demander({ type: 'detourer', input, taille: TAILLE }, [input.buffer]);

  const alpha = cp.createImageData(TAILLE, TAILLE);
  for (let i = 0; i < masque.length; i++) alpha.data[i * 4 + 3] = Math.round(masque[i] * 255);
  cp.putImageData(alpha, 0, 0);

  const decoupe = toile(largeur, hauteur);
  const cd = decoupe.getContext('2d');
  cd.drawImage(source, 0, 0);
  cd.globalCompositeOperation = 'destination-in';
  cd.imageSmoothingEnabled = true;
  cd.imageSmoothingQuality = 'high';
  cd.drawImage(petite, 0, 0, largeur, hauteur);
  return decoupe;
}

// Pose l'objet détouré sur un fond uni. Renvoie un PNG (sans perte: c'est
// l'envoi habituel, lib/image.js, qui compresse ensuite comme pour toute
// autre photo).
export function composer(decoupe, couleur) {
  const finale = toile(decoupe.width, decoupe.height);
  const cf = finale.getContext('2d');
  cf.fillStyle = couleur;
  cf.fillRect(0, 0, finale.width, finale.height);
  cf.drawImage(decoupe, 0, 0);
  return new Promise((resolve, reject) => {
    finale.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png');
  });
}
