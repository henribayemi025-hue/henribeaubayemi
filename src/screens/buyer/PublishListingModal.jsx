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
import { CATEGORIES, SERVICE_CATEGORIES } from '../../lib/categories';
import { getPosition } from '../../lib/geo';

export function PublishListingModal({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { country } = useSettings();
  const toast = useToast();
  const [type, setType] = useState('cherche');
  // Article vs Service reuses the SAME near_you_listings table/flow — just a
  // second category list (category is a free-text column, no DB change
  // needed). Lets a service request/offer ("réparer mon frigo", "cours de
  // maths") live in the same "Autour de moi" annonces buyers already browse.
  const [kind, setKind] = useState('article');
  const [category, setCategory] = useState('mode');
  const categoryOptions = kind === 'service' ? SERVICE_CATEGORIES : CATEGORIES;
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!description.trim()) return;
    setBusy(true);
    // Best-effort geolocation so the listing shows up in "Autour de moi".
    const pos = await getPosition();
    const { error } = await supabase.from('near_you_listings').insert({
      user_id: user.id,
      type,
      category,
      description: description.trim(),
      photo_url: photo,
      country,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
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
        <Field label={t('nearYou.listingKind')}>
          {(id) => (
            <div id={id} className="flex gap-2">
              {['article', 'service'].map((k) => (
                <button
                  key={k}
                  onClick={() => { setKind(k); setCategory(k === 'service' ? SERVICE_CATEGORIES[0].id : CATEGORIES[0].id); }}
                  className={`chip flex-1 justify-center ${kind === k ? 'chip-active' : 'text-ink'}`}
                >
                  {t(`nearYou.kind.${k}`)}
                </button>
              ))}
            </div>
          )}
        </Field>
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
              {categoryOptions.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
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
