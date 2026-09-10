import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { AppsList } from '../components/AppLauncher';

// L'environnement Finjaro sur une page: la même liste que la grille du haut,
// mais partageable par un lien (finjaro.net/apps) et lisible sans compte.
export default function Apps() {
  const { t } = useTranslation();
  return (
    <div className="pb-8">
      <AppHeader title={t('apps.title')} back />
      <div className="mx-auto w-full max-w-3xl p-4">
        <p className="mb-4 text-body text-muted">{t('apps.intro')}</p>
        <AppsList currentKey="marketplace" />
        <p className="mt-5 text-caption text-muted">{t('apps.sameAccount')}</p>
      </div>
    </div>
  );
}
