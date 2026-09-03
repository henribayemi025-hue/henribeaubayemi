// Shared client-side image downscale/compress via canvas. Phone camera photos
// are routinely 3-8MB (and sometimes HEIC, which browsers can't always
// display back) — uploading them raw is a real, avoidable cause of slow
// image loads on mobile data. Every upload path in the app should go through
// compressImage() before hitting Supabase Storage; canvas re-encoding to
// JPEG also sidesteps HEIC display issues as a side effect.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function resizeToCanvas(file, maxDim) {
  const img = await loadImage(file);
  let { width, height } = img;
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas;
}

// For Supabase Storage uploads (product/shop photos) — returns a WebP (or JPEG)
// Blob.
//
// 1600 px / qualité 0.82 produisait des fichiers de 100 à 300 Ko, parfois
// 1,7 Mo. Une grille de catégorie faisait alors ~1 Mo à télécharger pour des
// vignettes affichées à 150-300 px. Le plan Supabase gratuit n'offre pas de
// redimensionnement à la volée, donc tout doit être réglé À L'ENVOI.
//
// 1200 px reste largement au-dessus de ce que la fiche produit affiche sur un
// grand écran, et le WebP retire encore 25 à 35 % à qualité perçue égale.
// AVIF fait encore -30 % par rapport au WebP à qualité perçue égale; on l'essaie
// en premier et on retombe sur WebP puis JPEG selon ce que le navigateur du
// vendeur sait encoder (Chrome/Edge OK, Safari récent OK, vieux Safari retombe
// sur JPEG). Repli JPEG si le navigateur n'encode ni AVIF ni WebP.
export async function compressImage(file, { maxDim = 1200, quality = 0.72 } = {}) {
  const canvas = await resizeToCanvas(file, maxDim);
  const encode = (type) =>
    new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));

  // toBlob renvoie du PNG quand le format demandé n'est pas supporté — on
  // vérifie le type effectif pour ne PAS envoyer des octets PNG annoncés AVIF.
  const avif = await encode('image/avif');
  if (avif && avif.type === 'image/avif') return avif;

  const webp = await encode('image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  return (await encode('image/jpeg')) || file;
}

// Le format de sortie dépend maintenant du navigateur (AVIF, WebP ou JPEG):
// les appelants ne peuvent plus coder ".jpg" en dur, sinon on stocke des
// octets AVIF/WebP annoncés comme du JPEG. Ce helper renvoie le blob ET ce
// qu'il faut pour l'uploader correctement.
export async function compressForUpload(file, opts) {
  const blob = await compressImage(file, opts);
  const contentType = blob.type || 'image/jpeg';
  let ext = 'jpg';
  if (contentType === 'image/avif') ext = 'avif';
  else if (contentType === 'image/webp') ext = 'webp';
  return { blob, contentType, ext };
}

// 480 px suffit très largement à une vignette de grille affichée à 150-300 px,
// même sur un écran 2x (Retina). Qualité un peu plus basse: à cette taille,
// l'œil ne fait pas la différence, et le poids compte plus qu'ailleurs — c'est
// ce fichier qui part des dizaines de fois par écran (grilles, carrousel de
// boutiques, chat, panier…).
export const THUMB_OPTS = { maxDim: 480, quality: 0.6 };

function extFromFile(file) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  const m = /\.([a-z0-9]+)$/i.exec(file.name || '');
  return m ? m[1].toLowerCase() : 'jpg';
}

// Génère les DEUX tailles à partir d'un seul fichier source, pour un envoi de
// produit/boutique. `full` reste la taille normale (fiche détail, essayage
// virtuel); `thumb` est la nouvelle vignette légère pour tout ce qui s'affiche
// en petit. Les deux sont uploadées; seul le chemin de `full` est stocké en
// base (voir storageThumbUrl côté lecture pour retrouver la vignette par
// convention de nom — pas de migration de schéma nécessaire).
//
// Certains fichiers ne se décodent pas en <canvas> (HEIC pris par l'appareil
// photo iPhone, notamment: Safari sait parfois l'afficher dans une balise
// <img> mais canvas.drawImage() échoue quand même). Sans repli, ça bloquait
// TOUT l'envoi avec une erreur générique — c'était visiblement le cas pour la
// pièce d'identité: aucun document n'a jamais été envoyé avec succès en
// production. On envoie alors le fichier original tel quel plutôt que de
// bloquer — pas de vignette dans ce cas, mais l'envoi aboutit.
export async function compressForUploadWithThumb(file, fullOpts) {
  try {
    const [full, thumb] = await Promise.all([
      compressForUpload(file, fullOpts),
      compressForUpload(file, THUMB_OPTS),
    ]);
    return { full, thumb };
  } catch {
    return {
      full: { blob: file, contentType: file.type || 'application/octet-stream', ext: extFromFile(file) },
      thumb: null,
    };
  }
}

// For inline data: URLs (Finou / Mirror AI payloads to Gemini).
export async function fileToDataUrl(file, maxDim = 1024, quality = 0.8) {
  const canvas = await resizeToCanvas(file, maxDim);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function fileToBase64(file, maxDim = 1024, quality = 0.85) {
  const dataUrl = await fileToDataUrl(file, maxDim, quality);
  return dataUrl.split(',')[1];
}
