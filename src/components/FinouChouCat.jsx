// Le chat de Finou Chou : l'assistante de Finjaro (réunion du 10/10, « une
// interface qui représente un chat mignon »).
//
// Dessin ORIGINAL, en vecteur : aucune photo, aucune image prise sur le web
// (règle de Finjaro). Le même dessin existe en grand dans
// public/mascotte/finou-chou.svg, pour les affiches et les influenceuses. Il
// est crème, donc lisible aussi bien sur le rond terracotta de l'acheteuse que
// sur le rond bleu-vert de la vendeuse.
export function FinouChouCat({ size = 26, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" className={className}>
      <polygon points="9,26 13,5 29,16" fill="#FBEFD9" stroke="#E7D3B5" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="55,26 51,5 35,16" fill="#FBEFD9" stroke="#E7D3B5" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="13.5,21 15.5,10.5 23.5,16" fill="#F2B3A0" />
      <polygon points="50.5,21 48.5,10.5 40.5,16" fill="#F2B3A0" />
      <ellipse cx="32" cy="37" rx="24" ry="21" fill="#FBEFD9" stroke="#E7D3B5" strokeWidth="1.2" />
      <circle cx="14.5" cy="44" r="3.8" fill="#F2A58B" opacity=".55" />
      <circle cx="49.5" cy="44" r="3.8" fill="#F2A58B" opacity=".55" />
      <ellipse cx="22" cy="36" rx="3.3" ry="4.4" fill="#2A1D17" />
      <ellipse cx="42" cy="36" rx="3.3" ry="4.4" fill="#2A1D17" />
      <circle cx="23.3" cy="34.4" r="1.25" fill="#fff" />
      <circle cx="43.3" cy="34.4" r="1.25" fill="#fff" />
      <path d="M29.4 41.4 Q32 40.2 34.6 41.4 Q33.6 44.4 32 45 Q30.4 44.4 29.4 41.4Z" fill="#C25E38" />
      <path d="M32 45 Q32 48.2 28.4 48.6 M32 45 Q32 48.2 35.6 48.6" fill="none" stroke="#6B4A38" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 41 L15 42.6 M7 47 L15 46 M57 41 L49 42.6 M57 47 L49 46" stroke="#BFA58A" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
