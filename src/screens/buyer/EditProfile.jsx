import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';

export default function EditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar_url || null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ name: name.trim(), avatar_url: avatar }).eq('id', user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(t('common.saved'));
    navigate('/profile');
  }

  return (
    <div>
      <AppHeader title={t('profile.editProfile')} back />
      <div className="space-y-4 p-4">
        <ImageUpload bucket="shops" value={avatar} onChange={setAvatar} label={t('profile.title')} shape="round" />
        <Field label={t('profile.displayName')}>
          {(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Button onClick={save} loading={busy}>{t('common.save')}</Button>
      </div>
    </div>
  );
}
