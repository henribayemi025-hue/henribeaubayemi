import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconWifiOff } from '@tabler/icons-react';

// « Tu es hors ligne. Voici ce que tu avais. »
//
// Depuis le 22/09 l'application garde sur l'appareil ce qu'elle a lu, et le
// réaffiche sans réseau. C'est utile — et c'est aussi un piège: quelqu'un qui
// voit ses commandes croit les voir À JOUR. Un prix peut avoir changé, une
// commande peut être passée en « expédiée », un article peut être épuisé.
//
// Montrer des données d'hier sans le dire serait malhonnête. Ce bandeau est
// donc la moitié obligatoire du cache hors ligne, pas une décoration.
//
// Il ne coupe rien et ne recouvre rien: il se pose en haut, il pousse le
// contenu vers le bas, et il disparaît dès que le réseau revient.

export function BandeauHorsLigne() {
  const { t } = useTranslation();
  const [horsLigne, setHorsLigne] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    const partie = () => setHorsLigne(true);
    const revenu = () => setHorsLigne(false);
    window.addEventListener('offline', partie);
    window.addEventListener('online', revenu);
    return () => {
      window.removeEventListener('offline', partie);
      window.removeEventListener('online', revenu);
    };
  }, []);

  if (!horsLigne) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-caption text-white"
    >
      <IconWifiOff size={16} aria-hidden="true" />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
