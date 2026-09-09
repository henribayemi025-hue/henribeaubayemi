import { useEffect, useRef, useState } from 'react';
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react';

// Lecteur vocal façon WhatsApp.
//
// Pourquoi ne PAS utiliser <audio controls>: un fichier WebM enregistré par
// le navigateur est un flux, son en-tête ne contient aucune durée. Le lecteur
// natif attend donc une durée qui n'arrive jamais et tourne indéfiniment sans
// démarrer — c'est très exactement ce que Beau a vu en testant. Ici la durée
// vient de la base (mesurée pendant l'enregistrement), donc l'affichage est
// juste dès la première seconde, sans rien demander au fichier.
//
// La forme d'onde est décorative mais STABLE: les hauteurs sont dérivées du
// nom du fichier, donc un même vocal a toujours la même allure d'un écran à
// l'autre, au lieu de gigoter à chaque rendu.
function barres(cle, n = 27) {
  let h = 0;
  for (let i = 0; i < cle.length; i += 1) h = (h * 31 + cle.charCodeAt(i)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const v = (h % 100) / 100;
    // Jamais tout à fait plat ni tout à fait plein: une vraie voix oscille.
    return 0.25 + v * 0.75 * (i < 2 || i > n - 3 ? 0.5 : 1);
  });
}

function mmss(s) {
  const total = Math.max(0, Math.round(s || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function VoiceMessage({ src, seconds = null, mine = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dureeFichier, setDureeFichier] = useState(null);

  // Durée affichée: celle mesurée à l'enregistrement d'abord (fiable), sinon
  // celle du fichier quand le navigateur arrive à la lire (mp4/ogg).
  const duree = seconds || dureeFichier || 0;
  const avance = duree > 0 ? Math.min(1, current / duree) : 0;
  const ondes = barres(src || 'x');

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
      a.currentTime = 0;
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDureeFichier(a.duration);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  async function basculer() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      return;
    }
    // Un seul vocal à la fois, comme dans WhatsApp.
    document.querySelectorAll('audio').forEach((autre) => {
      if (autre !== a) autre.pause();
    });
    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  const teinte = mine ? 'text-white' : 'text-teal';
  const plein = mine ? 'bg-white' : 'bg-teal';
  const vide = mine ? 'bg-white/35' : 'bg-hairline';

  return (
    <div className="flex w-56 max-w-full items-center gap-2.5 py-0.5">
      <audio ref={audioRef} src={src} preload="none" className="hidden" />
      <button
        type="button"
        onClick={basculer}
        aria-label={playing ? 'Pause' : 'Play'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          mine ? 'bg-white/20' : 'bg-teal-light'
        } ${teinte}`}
      >
        {playing ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex h-6 items-center gap-[2px]">
          {ondes.map((haut, i) => (
            <span
              key={i}
              className={`w-[3px] shrink-0 rounded-full ${i / ondes.length <= avance ? plein : vide}`}
              style={{ height: `${Math.round(haut * 22)}px` }}
            />
          ))}
        </div>
        <span className={`text-[11px] ${mine ? 'text-white/75' : 'text-muted'}`}>
          {mmss(playing || current > 0 ? current : duree)}
        </span>
      </div>
    </div>
  );
}
