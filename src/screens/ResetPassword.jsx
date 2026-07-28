import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';

// Landed on from the "reset password" email link — Supabase's redirect
// already carries a temporary recovery session, so updateUser() just works.
export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      toast.success(t('auth.resetSuccess'));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mx-auto flex max-w-app flex-col justify-center overflow-y-auto px-6"
      style={{ minHeight: 'var(--app-height, 100dvh)', height: 'var(--app-height, 100dvh)' }}
    >
      <Link to="/" className="mb-8 flex items-center justify-center gap-1">
        <span className="text-title font-semibold text-teal">Finjaro</span>
      </Link>

      {!session ? (
        <p className="text-center text-body text-muted">{t('auth.resetLinkInvalid')}</p>
      ) : (
        <>
          <h1 className="mb-4 text-title text-ink">{t('auth.resetTitle')}</h1>
          <form onSubmit={submit} className="space-y-3">
            <Field label={t('auth.newPassword')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              )}
            </Field>
            <Button type="submit" loading={busy}>{t('auth.resetPassword')}</Button>
          </form>
        </>
      )}
    </div>
  );
}
