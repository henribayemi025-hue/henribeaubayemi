// Convertit un enregistrement du micro (WebM/Opus sur Android, MP4/AAC sur
// iPhone) en WAV mono 16 kHz, dans le navigateur.
//
// Pourquoi: Gemini documente WAV, MP3, AAC, OGG, FLAC — pas WebM ni MP4.
// Envoyer le fichier tel quel, c'est parier sur une tolérance non garantie,
// et un vocal qui échoue chez Finia, personne ne saurait pourquoi. Le WAV,
// lui, est accepté sans discussion. 16 kHz mono suffit largement à la voix
// (c'est la fréquence de référence de la reconnaissance vocale) et divise
// le poids par trois par rapport au 48 kHz stéréo d'origine.
export async function blobToWavDataUrl(blob, sampleRate = 16000) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    ctx.close?.().catch?.(() => {});
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * sampleRate));
  const off = new OfflineAudioContext(1, frames, sampleRate);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start(0);
  const mono = await off.startRendering();
  const pcm = mono.getChannelData(0);

  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const ascii = (o, s) => { for (let i = 0; i < s.length; i += 1) v.setUint8(o + i, s.charCodeAt(i)); };
  ascii(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);            // PCM
  v.setUint16(22, 1, true);            // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i += 1) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const wav = new Blob([buf], { type: 'audio/wav' });
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(wav);
  });
}
