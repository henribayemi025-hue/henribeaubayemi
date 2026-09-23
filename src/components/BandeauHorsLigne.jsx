import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconWifiOff, IconCloudUpload } from '@tabler/icons-react';
import { enAttente, envoyer, ecouterFile } from '../lib/fileAttente';
import { useToast } from '../hooks/useToast';

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

  // Ce qui a été AJOUTÉ sans réseau (lib/fileAttente): on l'envoie au
  // démarrage et dès que le réseau revient, et on dit combien attend.
  const toast = useToast();
  // useToast rend un objet neuf à chaque rendu: on le lit par une référence
  // pour ne pas relancer l'envoi à chaque message affiché.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [attente, setAttente] = useState(() => enAttente().length);
  useEffect(() => ecouterFile(setAttente), []);
  useEffect(() => {
    const vider = async () => {
      const { envoyees, refusees } = await envoyer();
      if (envoyees > 0) toastRef.current.success(t('offline.sent', { count: envoyees }));
      if (refusees.length > 0) toastRef.current.error(t('offline.refused', { count: refusees.length }));
    };
    vider();
    window.addEventListener('online', vider);
    return () => window.removeEventListener('online', vider);
  }, [t]);

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

  if (!horsLigne && attente === 0) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-caption text-white"
    >
      {horsLigne ? <IconWifiOff size={16} aria-hidden="true" /> : <IconCloudUpload size={16} aria-hidden="true" />}
      <span>
        {horsLigne && t('offline.banner')}
        {horsLigne && attente > 0 && ' · '}
        {attente > 0 && t('offline.pending', { count: attente })}
      </span>
    </div>
  );
}
