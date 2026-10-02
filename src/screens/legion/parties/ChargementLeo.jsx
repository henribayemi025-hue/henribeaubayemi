import { useTranslation } from 'react-i18next';

// Ce que Léo montre pendant qu'un écran se charge (Beau, 02/10 : « le truc qui
// apparaît toujours quand je veux ouvrir quelque chose »). Avant : le squelette
// clair de la place de marché, un grand bandeau blanc qui scintillait sur le
// fond nuit. Maintenant : le fond de Léo et un anneau doré discret.
export default function ChargementLeo() {
  const { t } = useTranslation();
  return (
    <div className="legion-app flex min-h-dvh items-center justify-center bg-legion-bg" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-legion-line border-t-legion-gold motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-caption text-legion-muted">{t('common.loading')}</span>
      </div>
    </div>
  );
}
