import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconEye, IconEyeOff, IconMail, IconPhone, IconArrowLeft, IconBrandGoogleFilled } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';

// Numéro international minimal: un "+" suivi de 7 à 15 chiffres (norme
// E.164). Volontairement permissif — on ne devine pas le format propre à
// chaque pays, Supabase/le fournisseur SMS refusera de toute façon un
// numéro invalide, et on relaie alors SON message d'erreur.
const E164_RE = /^\+[1-9]\d{6,14}$/;

// `consoleMode`: écran de connexion de la console d'administration. On n'y
// crée pas de compte (les droits admin s'accordent depuis la console
// elle-même) et « continuer sans compte » n'a aucun sens là où tout est
// derrière une authentification. Seule la connexion — et l'oubli de mot de
// passe — reste offerte.
export default function Auth({ consoleMode = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword, signInWithPhone, verifyPhoneOtp, signInWithGoogle } = useAuth();
  const toast = useToast();
  const refCode = new URLSearchParams(location.search).get('ref');
  const [mode, setMode] = useState(refCode && !consoleMode ? 'signup' : 'login');
  // 'email' | 'phone' — indépendant de `mode` (connexion/inscription/oubli),
  // exactement comme le prototype le proposait pour qui n'a pas d'e-mail.
  const [channel, setChannel] = useState('email');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  // Le flux téléphone se déroule en 2 temps: on envoie le code, PUIS on le
  // vérifie — deux écrans, pas un formulaire à choix multiples.
  const [otpSent, setOtpSent] = useState(false);
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

  async function sendPhoneCode(e) {
    e.preventDefault();
    const phone = form.phone.trim();
    if (!E164_RE.test(phone)) {
      toast.error(t('auth.phoneInvalid'));
      return;
    }
    setBusy(true);
    try {
      const { error } = await signInWithPhone(phone, { name: form.name.trim(), ref: refCode });
      if (error) throw error;
      setOtpSent(true);
      toast.success(t('auth.codeSent'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyPhoneCode(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await verifyPhoneOtp(form.phone.trim(), form.otp.trim());
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message === 'Token has expired or is invalid' ? t('auth.otpInvalid') : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await signInWithGoogle();
    // En cas de succès la page redirige vers Google — rien à faire ici.
    // On ne repasse busy à false qu'en cas d'échec (erreur réseau, provider
    // désactivé), sinon on verrait un clignotement juste avant la redirection.
    if (error) {
      toast.error(error.message);
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

      <h1 className="mb-1 text-title text-ink">
        {mode === 'login' ? t('auth.loginTitle') : mode === 'signup' ? t('auth.signupTitle') : t('auth.forgotTitle')}
      </h1>
      {mode === 'forgot' && <p className="mb-4 text-caption text-muted">{t('auth.forgotHint')}</p>}

      {/* Le mot de passe oublié n'a de sens que pour un compte e-mail — un
          compte téléphone n'a jamais eu de mot de passe à oublier. */}
      {mode !== 'forgot' && (
        <div className="mb-5 mt-3 flex rounded-card bg-base p-1">
          <button
            type="button"
            onClick={() => { setChannel('email'); setOtpSent(false); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-input py-2 text-caption font-semibold transition ${channel === 'email' ? 'bg-white text-teal shadow-sm' : 'text-muted'}`}
          >
            <IconMail size={16} /> {t('auth.byEmail')}
          </button>
          <button
            type="button"
            onClick={() => { setChannel('phone'); setOtpSent(false); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-input py-2 text-caption font-semibold transition ${channel === 'phone' ? 'bg-white text-teal shadow-sm' : 'text-muted'}`}
          >
            <IconPhone size={16} /> {t('auth.byPhone')}
          </button>
        </div>
      )}

      {channel === 'phone' && mode !== 'forgot' ? (
        otpSent ? (
          <form onSubmit={verifyPhoneCode} className="space-y-3">
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="flex items-center gap-1 text-caption font-semibold text-teal"
            >
              <IconArrowLeft size={14} /> {form.phone}
            </button>
            <Field label={t('auth.otpCode')} hint={t('auth.otpHint')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
                  required
                  autoFocus
                />
              )}
            </Field>
            <Button type="submit" loading={busy}>{t('auth.verifyCode')}</Button>
            <button type="button" onClick={sendPhoneCode} className="btn-ghost mx-auto block text-caption">
              {t('auth.resendCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={sendPhoneCode} className="space-y-3">
            {mode === 'signup' && (
              <Field label={t('auth.name')}>
                {(id) => <TextInput id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />}
              </Field>
            )}
            <Field label={t('auth.phone')} hint={t('auth.phoneHint')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  autoComplete="tel"
                />
              )}
            </Field>
            <Button type="submit" loading={busy}>{t('auth.sendCode')}</Button>
          </form>
        )
      ) : (
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
              {(id) => (
                <div className="relative">
                  <TextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors"
                    aria-label={showPassword ? t('common.hide') : t('common.show')}
                  >
                    {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              )}
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
      )}

      {mode !== 'forgot' && (
        <>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-caption text-muted">{t('auth.or')}</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-input border border-hairline py-3 text-body font-semibold text-ink transition active:scale-[0.98] disabled:opacity-50"
          >
            <IconBrandGoogleFilled size={18} />
            {t('auth.continueWithGoogle')}
          </button>
        </>
      )}

      {mode === 'forgot' ? (
        <button onClick={() => setMode('login')} className="btn-ghost mx-auto mt-4">{t('auth.backToLogin')}</button>
      ) : (
        !consoleMode && (
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setOtpSent(false); }} className="btn-ghost mx-auto mt-4">
            {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
          </button>
        )
      )}
      {!consoleMode && (
        <Link to="/" className="mx-auto mt-2 text-caption text-muted">{t('auth.continueAsGuest')}</Link>
      )}
    </div>
  );
}
