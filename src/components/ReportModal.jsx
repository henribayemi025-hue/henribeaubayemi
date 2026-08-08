import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { Field, TextArea, Select } from './Field';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useUI } from '../hooks/useUI';

// Signaler une boutique, une personne, ou un contenu précis (article, vidéo,
// commentaire) — voir migration 0047.
// Trois signalements suspendent automatiquement une BOUTIQUE ou une PERSONNE
// (déclencheur en base). Un contenu signalé, lui, est examiné à la main depuis
// la console: retirer un article parce qu'il déplaît à trois personnes serait
// disproportionné.
export function ReportModal({ open, onClose, targetType, targetId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [reason, setReason] = useState('counterfeit');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) {
      onClose();
      requireLogin();
      return;
    }
    setBusy(true);
    const label = t(`report.reasons.${reason}`);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: detail ? `${label}: ${detail}` : label,
    });
    setBusy(false);
    if (error && !error.message.includes('duplicate')) {
      toast.error(error.message);
      return;
    }
    toast.success(t('report.submitted'));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t(targetType === 'shop' ? 'report.reportShop' : 'report.reportContent')}>
      <div className="space-y-3">
        <Field label={t('report.reason')}>
          {(id) => (
            <Select id={id} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="counterfeit">{t('report.reasons.counterfeit')}</option>
              <option value="scam">{t('report.reasons.scam')}</option>
              <option value="inappropriate">{t('report.reasons.inappropriate')}</option>
              <option value="other">{t('report.reasons.other')}</option>
            </Select>
          )}
        </Field>
        <Field>
          <TextArea
            placeholder={t('report.reasonPlaceholder')}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </Field>
        <Button onClick={submit} loading={busy}>
          {t('report.submit')}
        </Button>
      </div>
    </Modal>
  );
}
