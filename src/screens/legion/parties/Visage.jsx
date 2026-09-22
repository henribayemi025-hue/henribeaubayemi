import { initiales } from './outils';

// Le visage d'un agent: sa tête (DiceBear ou photo), sinon ses initiales sur
// sa couleur. Un anneau dit s'il est allumé; éteint, il passe en gris —
// comme sur les maquettes de Beau, où l'on voit d'un coup d'œil qui dort.
export function Visage({ a, taille = 36, point = true, rond = true, className = '' }) {
  const allume = a ? a.actif !== false : true;
  const style = { width: taille, height: taille, backgroundColor: (a?.couleur || '#C25E38') + '22' };
  const forme = rond ? 'rounded-full' : 'rounded-card';
  const cls = `relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`;
  return (
    <span className={cls} style={{ width: taille, height: taille }} title={a?.poste || ''}>
      {a?.avatar_url ? (
        <img
          src={a.avatar_url}
          alt=""
          loading="lazy"
          className={`${forme} h-full w-full object-cover border-2 transition ${allume ? '' : 'grayscale opacity-60'}`}
          style={{ ...style, borderColor: allume ? (a?.couleur || '#2A9D8F') : '#E8DFD1' }}
        />
      ) : (
        <span
          className={`${forme} flex h-full w-full items-center justify-center border-2 text-[11px] font-semibold ${allume ? 'text-legion-ink' : 'text-legion-muted grayscale'}`}
          style={{ ...style, borderColor: allume ? (a?.couleur || '#C25E38') : '#E8DFD1', fontSize: Math.max(10, taille / 3) }}
        >
          {a?.emoji || initiales(a?.nom)}
        </span>
      )}
      {point && a && !a.user_id && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-legion-card"
          style={{ width: Math.max(8, taille / 4), height: Math.max(8, taille / 4), backgroundColor: allume ? '#2A9D8F' : '#9CA3AF' }}
        />
      )}
    </span>
  );
}
