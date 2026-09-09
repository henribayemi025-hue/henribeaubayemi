import { useRef, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';

// Beau: « c'est quand je swipe à droite que je peux delete une conversation ».
// La ligne glisse et découvre un fond rouge; passé le seuil, on demande
// confirmation. Rien n'est supprimé au simple glissement — un doigt qui
// dérape ne doit pas effacer une conversation.
//
// touch-action: pan-y garde le défilement vertical de la liste intact: on ne
// prend la main que si le doigt part franchement sur le côté.
const SEUIL = 76;

export function SwipeRow({ onDelete, label, children }) {
  const [dx, setDx] = useState(0);
  const depart = useRef(null);
  const engage = useRef(false);
  const abandonne = useRef(false);

  function onPointerDown(e) {
    if (e.button === 2) return;
    depart.current = { x: e.clientX, y: e.clientY };
    engage.current = false;
    abandonne.current = false;
  }

  function onPointerMove(e) {
    if (!depart.current || abandonne.current) return;
    const ecartX = e.clientX - depart.current.x;
    const ecartY = e.clientY - depart.current.y;
    if (!engage.current) {
      if (Math.abs(ecartY) > Math.abs(ecartX) && Math.abs(ecartY) > 6) {
        abandonne.current = true;
        return;
      }
      if (Math.abs(ecartX) > 10) {
        engage.current = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* déjà relâché */ }
      } else {
        return;
      }
    }
    setDx(Math.max(0, Math.min(110, ecartX)));
  }

  function terminer() {
    const franchi = engage.current && dx >= SEUIL;
    engage.current = false;
    depart.current = null;
    setDx(0);
    if (franchi) onDelete();
  }

  return (
    <div className="relative overflow-hidden">
      {dx > 0 && (
        <div className="absolute inset-y-0 left-0 flex items-center gap-2 bg-danger px-4 text-white" style={{ width: dx }}>
          <IconTrash size={18} className="shrink-0" />
          {dx > SEUIL && <span className="whitespace-nowrap text-caption font-semibold">{label}</span>}
        </div>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={terminer}
        onPointerCancel={terminer}
        // Une ligne de conversation est un lien: sans ça, le navigateur
        // démarre son propre glisser-déposer d'URL et avale le geste — la
        // ligne ne bougeait pas d'un pixel.
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: 'pan-y' }}
        className={`select-none bg-white ${dx ? '' : 'transition-transform duration-150'}`}
      >
        {children}
      </div>
    </div>
  );
}
