import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToast();
  const refCode = new URLSearchParams(location.search).get('ref');
  const [mode, setMode] = useState(refCode ? 'signup' : 'login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(form.email.trim());
        if (error) throw error;
        toast.success(t('auth.resetLinkSent'));
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await signIn(form.email.trim(), form.password);
        if (error) throw error;
        navigate(from, { replace: true });
      } else {
        const { data, error } = await signUp(form.email.trim(), form.password, form.name.trim(), refCode);
        if (error) throw error;
        if (data.session) navigate(from, { replace: true });
        else toast.success(t('auth.checkEmail'));
      }
    } catch (err) {
      toast.error(err.message === 'Invalid login credentials' ? t('auth.invalidCredentials') : err.message);
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
      <p className="mb-6 text-center text-caption text-muted">{t('common.tagline')}</p>

      <h1 className="mb-4 text-title text-ink">
        {mode === 'login' ? t('auth.loginTitle') : mode === 'signup' ? t('auth.signupTitle') : t('auth.forgotTitle')}
      </h1>
      {mode === 'forgot' && <p className="mb-4 text-caption text-muted">{t('auth.forgotHint')}</p>}
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Field label={t('auth.name')}>
            {(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />}
          </Field>
        )}
        <Field label={t('auth.email')}>
          {(id) => <TextInput id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />}
        </Field>
        {mode !== 'forgot' && (
          <Field label={t('auth.password')}>
            {(id) => <TextInput id={id} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
          </Field>
        )}
        {mode === 'login' && (
          <button type="button" onClick={() => setMode('forgot')} className="block text-caption font-semibold text-teal">
            {t('auth.forgotPassword')}
          </button>
        )}
        <Button type="submit" loading={busy}>
          {mode === 'login' ? t('auth.login') : mode === 'signup' ? t('auth.signup') : t('auth.sendResetLink')}
        </Button>
      </form>

      {mode === 'forgot' ? (
        <button onClick={() => setMode('login')} className="btn-ghost mx-auto mt-4">{t('auth.backToLogin')}</button>
      ) : (
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="btn-ghost mx-auto mt-4">
          {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
        </button>
      )}
      <Link to="/" className="mx-auto mt-2 text-caption text-muted">{t('auth.continueAsGuest')}</Link>
    </div>
  );
}
