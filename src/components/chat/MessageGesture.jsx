import { useRef, useState } from 'react';
import { IconArrowBackUp } from '@tabler/icons-react';

// Les deux gestes de WhatsApp sur une bulle, dans UN seul composant — parce
// qu'ils partagent le même appui et se marcheraient dessus s'ils étaient
// séparés: l'appui long ouvre le menu d'actions, le glissement latéral
// répond au message.
//
// Trois pièges traités ici, tous vus en vrai:
// - le glissement vertical doit rester un DÉFILEMENT: tant que le doigt part
//   plutôt vers le haut/bas, on ne prend pas la main (touch-action: pan-y).
// - après un appui long, le navigateur envoie quand même un `click` au
//   relâchement: sans le garde-fou, il rouvrirait la photo en plein écran.
// - le doigt qui sort de la bulle ne doit pas laisser le geste coincé: on
//   capture le pointeur, donc le relâchement revient toujours ici.
const SEUIL_REPONSE = 52;
const DELAI_APPUI_LONG = 420;

export function MessageGesture({ onLongPress, onReply, disabled = false, children }) {
  const [dx, setDx] = useState(0);
  const depart = useRef(null);
  const engage = useRef(false);
  const abandonne = useRef(false);
  const minuteur = useRef(null);
  const longPressFait = useRef(false);

  function nettoyer() {
    clearTimeout(minuteur.current);
    minuteur.current = null;
  }

  function onPointerDown(e) {
    if (disabled || e.button === 2) return;
    depart.current = { x: e.clientX, y: e.clientY };
    engage.current = false;
    abandonne.current = false;
    longPressFait.current = false;
    nettoyer();
    minuteur.current = setTimeout(() => {
      if (engage.current || abandonne.current) return;
      longPressFait.current = true;
      // Retour haptique quand l'appareil le permet: c'est ce qui fait
      // "sentir" que le menu va s'ouvrir, comme dans WhatsApp.
      try { navigator.vibrate?.(12); } catch { /* non supporté */ }
      onLongPress?.();
    }, DELAI_APPUI_LONG);
  }

  function onPointerMove(e) {
    if (!depart.current || abandonne.current) return;
    const ecartX = e.clientX - depart.current.x;
    const ecartY = e.clientY - depart.current.y;
    if (!engage.current) {
      if (Math.abs(ecartY) > Math.abs(ecartX) && Math.abs(ecartY) > 6) {
        // C'est un défilement: on laisse la page tranquille.
        abandonne.current = true;
        nettoyer();
        return;
      }
      if (ecartX > 8) {
        engage.current = true;
        nettoyer();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* déjà relâché */ }
      } else if (Math.abs(ecartX) > 8) {
        abandonne.current = true;
        nettoyer();
        return;
      }
    }
    if (engage.current) {
      // Résistance croissante: le glissement freine au lieu de filer, ce qui
      // rend le seuil perceptible au doigt.
      const brut = Math.max(0, ecartX);
      setDx(Math.min(72, brut * (brut > SEUIL_REPONSE ? 0.35 : 0.9) + (brut > SEUIL_REPONSE ? SEUIL_REPONSE * 0.55 : 0)));
    }
  }

  function terminer() {
    nettoyer();
    if (engage.current && dx >= SEUIL_REPONSE * 0.72) onReply?.();
    engage.current = false;
    depart.current = null;
    setDx(0);
  }

  function onClickCapture(e) {
    if (longPressFait.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressFait.current = false;
    }
  }

  const pret = dx >= SEUIL_REPONSE * 0.72;

  return (
    <div className="relative flex min-w-0 items-center">
      {dx > 0 && (
        <span
          className={`pointer-events-none absolute left-0 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            pret ? 'bg-teal text-white' : 'bg-hairline text-muted'
          }`}
          style={{ opacity: Math.min(1, dx / SEUIL_REPONSE), transform: `translateX(${Math.min(dx, 40) - 34}px)` }}
        >
          <IconArrowBackUp size={16} />
        </span>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={terminer}
        onPointerCancel={terminer}
        onClickCapture={onClickCapture}
        onContextMenu={(e) => e.preventDefault()}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: 'pan-y' }}
        className={`flex min-w-0 ${dx ? '' : 'transition-transform duration-150'}`}
      >
        {children}
      </div>
    </div>
  );
}
