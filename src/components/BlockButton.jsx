import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBan } from '@tabler/icons-react';
import { useBlock } from '../hooks/useBlock';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';

// Bouton "Bloquer" autonome (fiche publique d'une personne).
//
// Exigé par la règle 1.2 de l'App Store: une app avec messagerie doit
// permettre de bloquer quelqu'un d'abusif. Dans les fils de discussion, la
// même action vit maintenant dans le menu ⋮ de l'en-tête (ChatHeaderMenu) —
// les deux passent par le hook useBlock, donc par la même logique.
export function BlockButton({ shopId = null, userId = null, onChange }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { blocked, busy, toggle, disponible } = useBlock({ shopId, userId, onChange });
  const [open, setOpen] = useState(false);

  async function appliquer() {
    const { error, blocked: next } = await toggle();
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    toast.success(t(next ? 'report.blocked' : 'report.unblocked'));
  }

  if (!disponible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (blocked ? appliquer() : setOpen(true))}
        aria-label={t(blocked ? 'report.unblock' : 'report.block')}
        title={t(blocked ? 'report.unblock' : 'report.block')}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          blocked ? 'bg-danger-bg text-danger' : 'text-muted hover:text-ink'
        }`}
      >
        <IconBan size={18} />
      </button>

      {/* Débloquer est immédiat; bloquer demande confirmation — c'est le sens
          qui coupe la conversation. */}
      <Modal open={open} onClose={() => setOpen(false)} title={t('report.blockTitle')}>
        <div className="space-y-4">
          <p className="text-body text-muted">{t('report.blockConfirm')}</p>
          {/* Button ne connaît que primary/secondary/ghost: la teinte
              d'avertissement passe par className, pas par une variante qui
              n'existe pas et laisserait le bouton sans aucun style. */}
          <Button onClick={appliquer} loading={busy} className="!bg-danger">
            {t('report.block')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
