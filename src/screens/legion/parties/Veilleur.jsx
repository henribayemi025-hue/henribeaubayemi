// LE VEILLEUR — la mascotte de Legion (idée 193 des 200, 24/09) : une
// chouette en laiton et terracotta, dessinée ici (aucune image prise sur le
// web), qui cligne des yeux et respire doucement. Elle porte le nom de la
// tâche de nuit de Legion (legion-veilleur). Elle habite les écrans vides.
export function Veilleur({ taille = 72, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={taille} height={taille} className={className} aria-hidden="true">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.2; 0 0" dur="3.2s" repeatCount="indefinite" />
        <path d="M14 22 L20 12 L26 20 Z M50 22 L44 12 L38 20 Z" fill="#C25E38" />
        <ellipse cx="32" cy="36" rx="19" ry="21" fill="#E3A857" />
        <ellipse cx="32" cy="43" rx="11" ry="12" fill="#F2C98A" />
        <path d="M26 44 q6 3 12 0 M27 49 q5 2.5 10 0" stroke="#C25E38" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <circle cx="24.5" cy="30" r="7" fill="#FBF6EE" />
        <circle cx="39.5" cy="30" r="7" fill="#FBF6EE" />
        <circle cx="24.5" cy="30.5" r="3.2" fill="#0B1120" />
        <circle cx="39.5" cy="30.5" r="3.2" fill="#0B1120" />
        <circle cx="25.6" cy="29.3" r="1" fill="#fff" />
        <circle cx="40.6" cy="29.3" r="1" fill="#fff" />
        {/* Les paupières : elles se ferment une fois de temps en temps */}
        <g fill="#E3A857">
          <rect x="17" y="23" width="15" height="14" rx="7" transform="scale(1 0)" style={{ transformOrigin: '24.5px 23px' }}>
            <animateTransform attributeName="transform" type="scale" values="1 0; 1 0; 1 1; 1 0" keyTimes="0; 0.9; 0.95; 1" dur="4.5s" repeatCount="indefinite" additive="replace" />
          </rect>
          <rect x="32" y="23" width="15" height="14" rx="7" transform="scale(1 0)" style={{ transformOrigin: '39.5px 23px' }}>
            <animateTransform attributeName="transform" type="scale" values="1 0; 1 0; 1 1; 1 0" keyTimes="0; 0.9; 0.95; 1" dur="4.5s" repeatCount="indefinite" additive="replace" />
          </rect>
        </g>
        <path d="M30 35 L34 35 L32 39 Z" fill="#C25E38" />
        <path d="M22 56 l-2 4 M26 57 l0 4 M38 57 l0 4 M42 56 l2 4" stroke="#C25E38" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
