// Outillage vidéo côté client, pour les vidéos d'article.
//
// Le navigateur ne sait pas ré-encoder une vidéo (contrairement aux images,
// voir lib/image.js) — on ne peut donc pas l'alléger à l'envoi. La seule
// protection réaliste est de REFUSER ce qui est trop lourd ou trop long, avec
// un message clair, plutôt que de laisser une vidéo de 150 Mo saturer le
// stockage et le forfait data de chaque personne qui ouvrira l'accueil.

// Une vidéo d'article est une démonstration de quelques secondes, pas un film.
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30 Mo
export const MAX_VIDEO_SECONDS = 45;

export const isVideoFile = (file) =>
  (file?.type || '').startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|3gp)$/i.test(file?.name || '');

// Charge la vidéo hors écran juste assez pour lire ses métadonnées puis
// décoder une image. L'objet URL est toujours révoqué, y compris en échec —
// sinon chaque tentative fuiterait le fichier entier en mémoire.
function withVideoElement(file, fn) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const done = (result) => { URL.revokeObjectURL(url); resolve(result); };
    const fail = (err) => { URL.revokeObjectURL(url); reject(err); };
    video.onerror = () => fail(new Error('video_unreadable'));
    video.onloadedmetadata = () => { fn(video, done, fail); };
    video.src = url;
  });
}

export function videoDuration(file) {
  return withVideoElement(file, (video, done) => done(video.duration || 0));
}

// Image de couverture: c'est elle qui s'affiche AVANT que la vidéo ne se
// charge (et à la place de la vidéo sur un réseau lent). Sans elle, la carte
// resterait un rectangle noir le temps du téléchargement.
//
// On se place à ~0,3 s: la toute première image d'une vidéo prise au
// téléphone est souvent noire ou floue (autofocus).
export function videoPoster(file, { maxDim = 640, quality = 0.7 } = {}) {
  return withVideoElement(file, (video, done, fail) => {
    video.onseeked = () => {
      try {
        let { videoWidth: w, videoHeight: h } = video;
        if (!w || !h) return fail(new Error('video_no_frame'));
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(video, 0, 0, w, h);
        canvas.toBlob((blob) => (blob ? done(blob) : fail(new Error('poster_failed'))), 'image/jpeg', quality);
      } catch (err) {
        fail(err);
      }
    };
    video.currentTime = Math.min(0.3, (video.duration || 1) / 2);
  });
}

// Chemin de l'image de couverture déduit de celui de la vidéo — même
// convention que `_thumb` pour les images, donc rien à stocker en plus.
export function posterPathFor(videoPath) {
  if (!videoPath) return null;
  const dot = videoPath.lastIndexOf('.');
  return `${dot === -1 ? videoPath : videoPath.slice(0, dot)}_poster.jpg`;
}
