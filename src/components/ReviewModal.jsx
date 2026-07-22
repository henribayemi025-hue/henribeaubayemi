import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextArea } from './Field';
import { StarRating } from './StarRating';

// Review unlocks only after the buyer confirms receipt (enforced in UI + policy).
export function ReviewModal({ open, onClose, order, onDone }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.from('reviews').insert({
      shop_id: order.shop_id,
      order_id: order.id,
      buyer_id: user.id,
      rating,
      body: body.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('orderStatus.reviewSubmitted'));
    onClose();
    onDone?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('orderStatus.leaveReview')}>
      <div className="space-y-3">
        <div className="flex justify-center py-2">
          <StarRating value={rating} size={32} onChange={setRating} />
        </div>
        <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('orderStatus.writeReview')} />
        <Button onClick={submit} loading={busy}>{t('orderStatus.submitReview')}</Button>
      </div>
    </Modal>
  );
}
