import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Field, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { CATEGORIES } from '../../lib/categories';

export function PublishListingModal({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { country } = useSettings();
  const toast = useToast();
  const [type, setType] = useState('cherche');
  const [category, setCategory] = useState('mode');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!description.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('near_you_listings').insert({
      user_id: user.id,
      type,
      category,
      description: description.trim(),
      photo_url: photo,
      country,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('nearYou.published'));
    setDescription('');
    setPhoto(null);
    onClose();
    onDone?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('nearYou.publishListing')}>
      <div className="space-y-3">
        <Field label={t('nearYou.listingType')}>
          {(id) => (
            <div id={id} className="flex gap-2">
              {['cherche', 'propose'].map((tp) => (
                <button key={tp} onClick={() => setType(tp)} className={`chip flex-1 justify-center ${type === tp ? 'chip-active' : 'text-ink'}`}>
                  {t(tp === 'cherche' ? 'nearYou.iLookFor' : 'nearYou.iOffer')}
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label={t('nearYou.listingCategory')}>
          {(id) => (
            <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
            </Select>
          )}
        </Field>
        <Field label={t('nearYou.listingDesc')}>
          {(id) => <TextArea id={id} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('nearYou.listingDescPlaceholder')} />}
        </Field>
        <ImageUpload bucket="listings" value={photo} onChange={setPhoto} label={`${t('nearYou.addPhoto')} ${t('common.optional')}`} shape="wide" />
        <Button onClick={submit} loading={busy} disabled={!description.trim()}>{t('nearYou.publish')}</Button>
      </div>
    </Modal>
  );
}
