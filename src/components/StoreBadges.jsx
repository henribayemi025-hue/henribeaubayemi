import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { IconBrandGooglePlay, IconBrandApple, IconDeviceMobile } from '@tabler/icons-react';

// « Installe l'app » — là où quelqu'un navigue depuis un navigateur.
//
// Finjaro est sur le Play Store depuis fin août, mais le seul lien du site
// vivait sur /landing — une page que personne ne voit, puisque finjaro.net
// ouvre directement l'application. Le lien existait donc sans être trouvable.
//
// Deux raisons de vouloir l'app installée plutôt que l'onglet: elle revient
// d'un geste depuis l'écran d'accueil, et surtout c'est le SEUL moyen de
// recevoir une notification quand l'app est fermée (le push web n'existe pas
// sur iPhone hors écran d'accueil — voir send-push).
//
// L'ADRESSE DE LA FICHE APP STORE reste vide tant qu'Apple n'a pas rendu
// l'app publique: un badge qui mène à une page inexistante coûte plus cher
// que pas de badge du tout. Le jour où la fiche est en ligne, il n'y a que
// cette constante à remplir.
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=net.finjaro.app';
export const APP_STORE_URL = '';

export function StoreBadges({ compact = false }) {
  const { t } = useTranslation();

  // Inutile de proposer d'installer l'app à quelqu'un qui EST déjà dedans.
  if (Capacitor.isNativePlatform()) return null;
  if (!PLAY_STORE_URL && !APP_STORE_URL) return null;

  // On ne cache pas le badge de l'autre plateforme: un ordinateur ne dit pas
  // de façon fiable quel téléphone la personne a, et quelqu'un peut vouloir
  // envoyer le lien à quelqu'un d'autre.
  const badges = [
    APP_STORE_URL && { href: APP_STORE_URL, Icon: IconBrandApple, label: t('stores.apple') },
    PLAY_STORE_URL && { href: PLAY_STORE_URL, Icon: IconBrandGooglePlay, label: t('stores.google') },
  ].filter(Boolean);

  return (
    <div className={compact ? '' : 'rounded-card border border-hairline p-3'}>
      {!compact && (
        <p className="flex items-center gap-2 text-body font-semibold text-ink">
          <IconDeviceMobile size={18} className="shrink-0 text-brass" />
          {t('stores.title')}
        </p>
      )}
      {!compact && <p className="mt-0.5 text-caption text-muted">{t('stores.hint')}</p>}
      <div className={`flex gap-2 ${compact ? '' : 'mt-2.5'}`}>
        {badges.map((b) => (
          <a
            key={b.href}
            href={b.href}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-input border border-hairline py-2.5 text-caption font-semibold text-ink transition active:scale-[0.98]"
          >
            <b.Icon size={18} className="shrink-0" />
            {b.label}
          </a>
        ))}
      </div>
    </div>
  );
}
