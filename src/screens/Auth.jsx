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
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email.trim(), form.password);
        if (error) throw error;
        navigate(from, { replace: true });
      } else {
        const { data, error } = await signUp(form.email.trim(), form.password, form.name.trim());
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
    <div className="mx-auto flex min-h-screen max-w-app flex-col justify-center px-6">
      <Link to="/" className="mb-8 flex items-center justify-center gap-1">
        <span className="text-title font-semibold text-teal">Finjaro</span>
        <span className="h-1.5 w-1.5 rounded-full bg-brass" />
      </Link>
      <p className="mb-6 text-center text-caption text-muted">{t('common.tagline')}</p>

      <h1 className="mb-4 text-title text-ink">{mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}</h1>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Field label={t('auth.name')}>
            {(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />}
          </Field>
        )}
        <Field label={t('auth.email')}>
          {(id) => <TextInput id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />}
        </Field>
        <Field label={t('auth.password')}>
          {(id) => <TextInput id={id} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
        </Field>
        <Button type="submit" loading={busy}>{mode === 'login' ? t('auth.login') : t('auth.signup')}</Button>
      </form>

      <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="btn-ghost mx-auto mt-4">
        {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
      </button>
      <Link to="/" className="mx-auto mt-2 text-caption text-muted">{t('auth.continueAsGuest')}</Link>
    </div>
  );
}
