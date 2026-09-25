import { IconSun, IconMoon } from '@tabler/icons-react';
import { usePalette } from './useFondLegion';

// Le bouton soleil / lune : la palette sombre (le logo de Léo) ou la palette claire
// (la crème et la terracotta de Finjaro). Beau, 25/09 : « il doit pouvoir choisir ».
export function BoutonPalette({ t, className = '' }) {
  const [palette, changer] = usePalette();
  const clair = palette === 'clair';
  const libelle = clair ? t('legion.palette.sombre', 'Palette sombre') : t('legion.palette.claire', 'Palette claire (Finjaro)');
  return (
    <button type="button" onClick={() => changer(clair ? 'sombre' : 'clair')} title={libelle} aria-label={libelle} aria-pressed={clair}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-legion-line text-legion-muted transition hover:text-legion-gold ${className}`}>
      {clair ? <IconMoon size={15} /> : <IconSun size={15} />}
    </button>
  );
}
