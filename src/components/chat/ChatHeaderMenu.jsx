import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconDotsVertical, IconFlag, IconBan, IconTrash } from '@tabler/icons-react';
import { useBlock } from '../../hooks/useBlock';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../Modal';
import { Button } from '../Button';

// Beau: « en haut il y a delete, signaler, bloquer alors que ça devait être
// sur un truc » — trois icônes alignées dans l'en-tête, ça faisait barre
// d'outils, pas messagerie. Tout passe derrière un seul ⋮, comme WhatsApp:
// l'en-tête ne garde que l'identité de l'interlocuteur et les moyens de le
// joindre.
export function ChatHeaderMenu({ shopId = null, userId = null, onBlockChange, onReport, onDelete }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { blocked, busy, toggle, disponible } = useBlock({ shopId, userId, onChange: onBlockChange });
  const [ouvert, setOuvert] = useState(false);
  const [confirmBloc, setConfirmBloc] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const boite = useRef(null);

  useEffect(() => {
    if (!ouvert) return undefined;
    const dehors = (e) => {
      if (boite.current && !boite.current.contains(e.target)) setOuvert(false);
    };
    const echap = (e) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('pointerdown', dehors);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('pointerdown', dehors);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  async function appliquerBlocage() {
    const { error, blocked: next } = await toggle();
    if (error) {
      toast.error(error.message);
      return;
    }
    setConfirmBloc(false);
    toast.success(t(next ? 'report.blocked' : 'report.unblocked'));
  }

  async function appliquerSuppression() {
    setSuppression(true);
    try {
      await onDelete();
    } finally {
      setSuppression(false);
      setConfirmSuppr(false);
    }
  }

  const entrees = [
    { key: 'report', icon: IconFlag, label: t('report.report'), onClick: onReport },
    disponible && {
      key: 'block',
      icon: IconBan,
      label: t(blocked ? 'report.unblock' : 'report.block'),
      onClick: () => (blocked ? appliquerBlocage() : setConfirmBloc(true)),
    },
    { key: 'delete', icon: IconTrash, label: t('chat.deleteConversation'), danger: true, onClick: () => setConfirmSuppr(true) },
  ].filter(Boolean);

  return (
    <div className="relative shrink-0" ref={boite}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label={t('common.more')}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <IconDotsVertical size={19} />
      </button>
      {ouvert && (
        <div role="menu" className="animate-fade-in absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-card border border-hairline bg-white shadow-lg">
          {entrees.map((e) => (
            <button
              key={e.key}
              role="menuitem"
              type="button"
              onClick={() => {
                setOuvert(false);
                e.onClick();
              }}
              className={`flex w-full items-center gap-3 border-t border-hairline px-4 py-3 text-left text-body transition-colors first:border-t-0 hover:bg-base ${
                e.danger ? 'text-danger' : 'text-ink'
              }`}
            >
              <e.icon size={18} className={e.danger ? 'text-danger' : 'text-muted'} />
              {e.label}
            </button>
          ))}
        </div>
      )}

      <Modal open={confirmBloc} onClose={() => setConfirmBloc(false)} title={t('report.blockTitle')}>
        <div className="space-y-4">
          <p className="text-body text-muted">{t('report.blockConfirm')}</p>
          <Button onClick={appliquerBlocage} loading={busy} className="!bg-danger">
            {t('report.block')}
          </Button>
        </div>
      </Modal>

      <Modal open={confirmSuppr} onClose={() => setConfirmSuppr(false)} title={t('chat.deleteConversation')}>
        <div className="space-y-4">
          <p className="text-body text-muted">{t('chat.deleteConversationConfirm')}</p>
          <Button onClick={appliquerSuppression} loading={suppression} className="!bg-danger">
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
