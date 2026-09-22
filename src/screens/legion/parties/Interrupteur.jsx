// L'interrupteur. Beau: « je dois avoir le pouvoir de désactiver et
// réactiver ». Il est partout où il y a un agent, toujours de la même forme:
// vert quand ça tourne (et que ça coûte), gris quand ça dort.
export function Interrupteur({ on, onChange, petit = false, label, disabled = false }) {
  const w = petit ? 'h-4 w-7' : 'h-6 w-11';
  const b = petit ? 'h-3 w-3' : 'h-5 w-5';
  const d = petit ? 'translate-x-3' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={`relative inline-flex ${w} shrink-0 items-center rounded-full border-2 border-transparent transition-colors disabled:opacity-40 ${on ? 'bg-success' : 'bg-hairline'}`}
    >
      <span className={`pointer-events-none inline-block ${b} transform rounded-full bg-white shadow transition ${on ? d : 'translate-x-0'}`} />
    </button>
  );
}
