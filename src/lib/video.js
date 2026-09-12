// Outillage vidéo côté client, pour les vidéos d'article.
//
// Le navigateur ne sait pas ré-encoder une vidéo (contrairement aux images,
// voir lib/image.js) — on ne peut donc pas l'alléger à l'envoi. La seule
// protection réaliste est de REFUSER ce qui est trop lourd ou trop long, avec
// un message clair, plutôt que de laisser une vidéo de 150 Mo saturer le
// stockage et le forfait data de chaque personne qui ouvrira l'accueil.

// Une vidéo d'article est une démonstration de quelques secondes, pas un film.
//
// UNE SEULE limite, ici. Il y en avait deux qui divergeaient en silence: 30 Mo
// pour la vidéo d'un article, et 15 Mo redéfinis dans VendorReels — si bien
// qu'un même fichier passait ou non selon l'écran. Le plafond s'applique
// APRÈS compression (voir compressVideo plus bas): il ne sert plus qu'à
// refuser ce qui reste énorme même allégé.
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 Mo
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

// ---------------------------------------------------------------------------
// Alléger une vidéo AVANT l'envoi
// ---------------------------------------------------------------------------
//
// Beau (12/09): « compresse les images et vidéos ». Les images l'étaient déjà
// (voir lib/image.js: 1200 px, AVIF/WebP, 74 Ko en moyenne). Les vidéos, non:
// 9 fichiers pesaient 133 Mo à eux seuls, un tiers de tout le stockage, dont
// un de 50 Mo. Le commentaire qui plafonnait la taille disait déjà que « la
// vraie réponse est de compresser AVANT l'envoi ». La voici.
//
// Le procédé: on rejoue la vidéo hors écran dans un <canvas> réduit, on
// enregistre ce canvas avec MediaRecorder à un débit plafonné, et on rattache
// la piste audio d'origine. Une vidéo filmée au téléphone (1080p, ~10 Mo pour
// 20 s) ressort autour de 1 à 2 Mo sans que la vendeuse ait rien à changer à
// sa façon de filmer.
//
// LA PRÉCAUTION QUI COMMANDE TOUT LE RESTE: on n'accepte QUE du MP4. iOS ne
// sait pas lire le WebM — produire du WebM «&nbsp;pour économiser&nbsp;» rendrait les
// vidéos muettes et noires sur tous les iPhone, ce qui serait bien pire que
// le problème de stockage. Si le navigateur ne sait pas enregistrer en MP4,
// ou si le résultat n'est pas plus léger que l'original, on renvoie null et
// l'appelant garde le fichier tel quel: on ne dégrade jamais, on n'ajoute
// jamais de risque.
//
// Le ré-encodage se fait en temps réel (une vidéo de 30 s prend ~30 s): d'où
// `onProgress`, pour que l'écran puisse dire ce qui se passe au lieu de
// paraître figé.

// 1 Mbit/s en 720p reste net sur un téléphone et divise le poids par cinq à
// dix. Au-delà, on paie des octets que personne ne voit — et c'est le forfait
// data de l'acheteuse qu'on dépense.
const VIDEO_BITRATE = 1_000_000;
const VIDEO_MAX_DIM = 720;
const AUDIO_BITRATE = 64_000;

// Les variantes MP4 acceptées, de la plus souhaitable à la moins. Chrome et
// Edge récents savent enregistrer en MP4/H.264; Safari aussi. Un navigateur
// qui ne sait pas fait retomber sur le fichier d'origine.
const MP4_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4',
];

function typeMp4Supporte() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null;
  return MP4_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || null;
}

// Le navigateur sait-il alléger une vidéo sans risquer de la rendre
// illisible ? Sert aussi aux écrans, pour n'annoncer « on s'en occupe » que
// si c'est vrai.
export function peutCompresserVideo() {
  return (
    typeof document !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    !!typeMp4Supporte()
  );
}

export async function compressVideo(file, { onProgress } = {}) {
  const mimeType = typeMp4Supporte();
  if (!mimeType || !peutCompresserVideo()) return null;

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true; // sinon la lecture hors écran est bloquée par le navigateur
  video.playsInline = true;

  const nettoyer = () => {
    try { video.pause(); } catch { /* déjà arrêtée */ }
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error('video_unreadable'));
    });

    let { videoWidth: w, videoHeight: h } = video;
    if (!w || !h) throw new Error('video_no_frame');
    if (w > h && w > VIDEO_MAX_DIM) { h = Math.round((h * VIDEO_MAX_DIM) / w); w = VIDEO_MAX_DIM; }
    else if (h >= w && h > VIDEO_MAX_DIM) { w = Math.round((w * VIDEO_MAX_DIM) / h); h = VIDEO_MAX_DIM; }
    // Certains encodeurs H.264 refusent une dimension impaire.
    w -= w % 2; h -= h % 2;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    // La piste audio vient de la vidéo source: un canvas n'en produit pas, et
    // une vendeuse qui se filme en train de présenter son article perdrait
    // sa voix.
    try {
      const src = video.captureStream ? video.captureStream() : video.mozCaptureStream?.();
      src?.getAudioTracks?.().forEach((piste) => stream.addTrack(piste));
    } catch {
      /* pas d'audio récupérable: la vidéo passe quand même, sans le son */
    }

    const morceaux = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    });
    recorder.ondataavailable = (e) => { if (e.data?.size) morceaux.push(e.data); };

    const fini = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start(1000);

    const duree = video.duration || 0;
    let animation = 0;
    const dessiner = () => {
      if (video.ended || video.paused) return;
      ctx.drawImage(video, 0, 0, w, h);
      if (duree > 0 && onProgress) onProgress(Math.min(video.currentTime / duree, 1));
      animation = requestAnimationFrame(dessiner);
    };

    await video.play();
    dessiner();
    await new Promise((resolve) => {
      video.onended = resolve;
      // Filet: une vidéo qui ne signale jamais sa fin ne doit pas bloquer
      // l'envoi indéfiniment. On laisse 10 s de marge au-delà de sa durée.
      setTimeout(resolve, (duree + 10) * 1000);
    });
    cancelAnimationFrame(animation);
    recorder.stop();
    await fini;

    const blob = new Blob(morceaux, { type: 'video/mp4' });
    // Deux refus: un résultat vide (l'enregistrement n'a rien capté) ou plus
    // lourd que l'original (vidéo déjà bien compressée). Dans les deux cas on
    // garde le fichier d'origine.
    if (!blob.size || blob.size >= file.size) return null;
    return blob;
  } catch {
    return null; // jamais bloquer un envoi à cause de la compression
  } finally {
    nettoyer();
  }
}
