import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBan } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';

// Bloquer l'autre partie d'une conversation.
//
// Exigé par la règle 1.2 de l'App Store: une app avec messagerie doit
// permettre de bloquer quelqu'un d'abusif. C'est la première chose que cherche
// une examinatrice Apple quand elle ouvre un fil de discussion.
//
// La messagerie relie une PERSONNE à une BOUTIQUE, donc le blocage a deux
// sens (voir migration 0047): l'acheteuse bloque la boutique (`shopId`), la
// vendeuse bloque l'acheteuse (`userId`). On en passe exactement un.
//
// Le blocage est appliqué EN BASE par un déclencheur sur chat_messages: cacher
// les messages ici ne ferait qu'une illusion, la personne bloquée pourrait
// continuer à écrire.
export function BlockButton({ shopId = null, userId = null, onChange }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const column = shopId ? 'shop_id' : 'blocked_user_id';
  const value = shopId || userId;

  useEffect(() => {
    if (!user || !value) return;
    let alive = true;
    supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq(column, value)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setBlocked(!!data);
        onChange?.(!!data);
      });
    return () => { alive = false; };
    // onChange est recréé à chaque rendu du parent: l'inclure relancerait la
    // requête en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, value, column]);

  async function toggle() {
    if (!user || !value) return;
    setBusy(true);
    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocker_id', user.id).eq(column, value)
      : await supabase.from('blocks').insert({ blocker_id: user.id, [column]: value });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const next = !blocked;
    setBlocked(next);
    onChange?.(next);
    setOpen(false);
    toast.success(t(next ? 'report.blocked' : 'report.unblocked'));
  }

  if (!user || !value) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (blocked ? toggle() : setOpen(true))}
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
          <Button onClick={toggle} loading={busy} className="!bg-danger">
            {t('report.block')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
