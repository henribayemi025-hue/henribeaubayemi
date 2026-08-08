import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFlag } from '@tabler/icons-react';
import { ReportModal } from './ReportModal';

// Bouton « Signaler » réutilisable, à poser sur n'importe quel contenu publié
// par quelqu'un d'autre: un article, une vidéo, un commentaire.
//
// La règle 1.2 de l'App Store demande que le signalement porte sur LE CONTENU
// visé, pas seulement sur la boutique entière. Sans ça, une acheteuse gênée
// par une seule photo n'a d'autre choix que de dénoncer toute la vendeuse —
// disproportionné, donc personne ne le fait, donc rien ne remonte.
//
// `variant` s'adapte au fond: `overlay` pour la barre d'actions blanche
// posée sur une vidéo, `inline` pour un lien discret dans une page.
export function ReportButton({ targetType, targetId, variant = 'inline', className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const styles =
    variant === 'overlay'
      ? 'flex flex-col items-center gap-1 text-white'
      : 'inline-flex items-center gap-1.5 text-caption text-ink-soft hover:text-ink';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${styles} ${className}`}
        aria-label={t('report.report')}
      >
        <IconFlag size={variant === 'overlay' ? 26 : 16} />
        {variant === 'inline' && <span>{t('report.report')}</span>}
      </button>
      <ReportModal open={open} onClose={() => setOpen(false)} targetType={targetType} targetId={targetId} />
    </>
  );
}
