import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconEye, IconEyeOff, IconMail, IconPhone, IconArrowLeft, IconBrandGoogleFilled, IconBrandApple } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { networkMessage } from '../lib/netError';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';

// Numéro international minimal: un "+" suivi de 7 à 15 chiffres (norme
// E.164). Volontairement permissif — on ne devine pas le format propre à
// chaque pays, Supabase/le fournisseur SMS refusera de toute façon un
// numéro invalide, et on relaie alors SON message d'erreur.
const E164_RE = /^\+[1-9]\d{6,14}$/;
// Tout le monde tape son numéro avec des espaces, points ou tirets
// (« +237 651 23 45 67 ») — on les retire avant de valider, plutôt que de
// rejeter un numéro correct pour une question de mise en forme. Un « 00 »
// initial (l'autre écriture de l'international) devient « + ».
const normalizePhone = (raw) => raw.trim().replace(/^00/, '+').replace(/[\s.\-()]/g, '');

// Le bouton « Continuer avec Apple » est écrit et testé, mais il ne peut pas
// aboutir tant que le fournisseur `apple` n'est pas activé côté Supabase
// (Services ID + Team ID + clé .p8 du compte développeur). Sans ça, un clic
// répond « Unsupported provider » et la cliente se retrouve devant une erreur
// sur l'écran de connexion — le pire endroit possible.
// Passer à `true` UNIQUEMENT après avoir vu une vraie connexion Apple
// aboutir. iOS ne peut pas être soumis à l'App Store avant (règle 4.8).
const APPLE_SIGNIN_ENABLED = false;

// `consoleMode`: écran de connexion de la console d'administration. On n'y
// crée pas de compte (les droits admin s'accordent depuis la console
// elle-même) et « continuer sans compte » n'a aucun sens là où tout est
// derrière une authentification. Seule la connexion — et l'oubli de mot de
// passe — reste offerte.
export default function Auth({ consoleMode = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signIn, signUp, resetPassword, signInWithPhone, verifyPhoneOtp, signInWithGoogle,
    signInWithApple, signUpWithPhonePassword, signInWithPhonePassword,
  } = useAuth();
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
  // Le téléphone marche d'abord SANS SMS (numéro + mot de passe). Le code
  // par SMS reste accessible d'un lien — c'est la seule façon de récupérer un
  // compte téléphone dont le mot de passe est oublié, puisqu'il n'y a pas
  // d'e-mail où envoyer un lien de réinitialisation.
  const [phoneMethod, setPhoneMethod] = useState('password'); // 'password' | 'otp'
  // Certains opérateurs (constaté au Cameroun: MTN/Orange) filtrent les SMS
  // automatiques venus de l'étranger — le serveur SMS dit « envoyé » et rien
  // n'arrive jamais. Sans porte de sortie, la personne attend indéfiniment
  // devant un champ vide: on lui propose une autre voie au bout de 20 s.
  const [smsLate, setSmsLate] = useState(false);
  const from = location.state?.from || '/';

  useEffect(() => {
    if (!otpSent) {
      setSmsLate(false);
      return undefined;
    }
    const id = setTimeout(() => setSmsLate(true), 20000);
    return () => clearTimeout(id);
  }, [otpSent]);

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
      toast.error(err.message === 'Invalid login credentials' ? t('auth.invalidCredentials') : networkMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  // Numéro + mot de passe, sans aucun SMS. Si le projet Supabase exige encore
  // la confirmation du téléphone, l'inscription ne renvoie pas de session —
  // on bascule alors proprement sur l'écran du code plutôt que de laisser la
  // personne devant un formulaire qui « ne fait rien ».
  async function submitPhonePassword(e) {
    e.preventDefault();
    const phone = normalizePhone(form.phone);
    if (!E164_RE.test(phone)) {
      toast.error(t('auth.phoneInvalid'));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await signUpWithPhonePassword(phone, form.password, form.name.trim(), refCode);
        if (error) throw error;
        if (data.session) navigate(from, { replace: true });
        else {
          setPhoneMethod('otp');
          setOtpSent(true);
          toast.success(t('auth.codeSent'));
        }
      } else {
        const { error } = await signInWithPhonePassword(phone, form.password);
        if (error) throw error;
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Les messages bruts de Supabase sont en anglais et parlent d'e-mail —
      // hors sujet pour quelqu'un qui s'inscrit avec son numéro. On traduit
      // les deux cas qui arrivent réellement, en disant quoi faire ensuite.
      const m = err.message || '';
      if (/already registered|already exists/i.test(m)) toast.error(t('auth.phoneAlreadyRegistered'));
      else if (m === 'Invalid login credentials') toast.error(t('auth.invalidPhoneCredentials'));
      else toast.error(networkMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function sendPhoneCode(e) {
    e.preventDefault();
    const phone = normalizePhone(form.phone);
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
      toast.error(networkMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function verifyPhoneCode(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await verifyPhoneOtp(normalizePhone(form.phone), form.otp.trim());
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message === 'Token has expired or is invalid' ? t('auth.otpInvalid') : networkMessage(err, t));
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
      toast.error(networkMessage(error, t));
      setBusy(false);
    }
  }

  // Même mécanique que Google. Bouton requis sur iOS (App Store, règle 4.8)
  // dès lors que Google Sign-In est proposé — affiché partout, par symétrie
  // et parce que Sign in with Apple fonctionne aussi sur le web.
  async function handleApple() {
    setBusy(true);
    const { error } = await signInWithApple();
    if (error) {
      toast.error(networkMessage(error, t));
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
            onClick={() => { setChannel('phone'); setOtpSent(false); setPhoneMethod('password'); }}
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

            {/* Porte de sortie quand le SMS ne vient pas. On ne fait PAS de
                promesse qu'on ne tient pas (« vérifie ton réseau »): on dit ce
                qui se passe vraiment et on propose deux voies qui marchent
                tout de suite. */}
            {smsLate && (
              <div className="rounded-card border border-warning/25 bg-warning-bg p-4">
                <p className="text-caption font-semibold text-ink">{t('auth.smsLateTitle')}</p>
                <p className="mt-1 text-caption text-muted">{t('auth.smsLateBody')}</p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => { setOtpSent(false); setPhoneMethod('password'); }}
                >
                  {t('auth.usePasswordInstead')}
                </Button>
                <Button variant="secondary" className="mt-2" onClick={handleGoogle} loading={busy}>
                  <IconBrandGoogleFilled size={18} /> {t('auth.continueWithGoogle')}
                </Button>
                {APPLE_SIGNIN_ENABLED && (
                  <Button variant="secondary" className="mt-2" onClick={handleApple} loading={busy}>
                    <IconBrandApple size={18} /> {t('auth.continueWithApple')}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setChannel('email'); }}
                  className="btn-ghost mx-auto mt-1 block text-caption"
                >
                  {t('auth.useEmailInstead')}
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={phoneMethod === 'password' ? submitPhonePassword : sendPhoneCode} className="space-y-3">
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
            {phoneMethod === 'password' ? (
              <>
                <Field label={t('auth.password')} hint={mode === 'signup' ? t('auth.phonePasswordHint') : undefined}>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-ink"
                        aria-label={showPassword ? t('common.hide') : t('common.show')}
                      >
                        {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                      </button>
                    </div>
                  )}
                </Field>
                <Button type="submit" loading={busy}>
                  {mode === 'signup' ? t('auth.signup') : t('auth.login')}
                </Button>
                {/* Seule voie de secours pour un compte téléphone: pas d'e-mail,
                    donc pas de lien de réinitialisation possible. */}
                <button
                  type="button"
                  onClick={() => setPhoneMethod('otp')}
                  className="btn-ghost mx-auto block text-caption"
                >
                  {mode === 'signup' ? t('auth.useSmsCodeInstead') : t('auth.forgotPasswordPhone')}
                </button>
              </>
            ) : (
              <>
                <Button type="submit" loading={busy}>{t('auth.sendCode')}</Button>
                <button
                  type="button"
                  onClick={() => setPhoneMethod('password')}
                  className="btn-ghost mx-auto block text-caption"
                >
                  {t('auth.usePasswordInstead')}
                </button>
              </>
            )}
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
          {APPLE_SIGNIN_ENABLED && (
            <button
              type="button"
              onClick={handleApple}
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-2 rounded-input border border-hairline py-3 text-body font-semibold text-ink transition active:scale-[0.98] disabled:opacity-50"
            >
              <IconBrandApple size={18} />
              {t('auth.continueWithApple')}
            </button>
          )}
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
      {mode === 'signup' && (
        <p className="mx-auto mt-4 max-w-xs text-center text-caption text-muted">
          {t('legal.signupConsent')}{' '}
          <Link to="/legal/terms" className="font-semibold text-teal underline">{t('legal.termsTitle')}</Link>
          {' '}{t('legal.and')}{' '}
          <Link to="/legal/confidentialite" className="font-semibold text-teal underline">
            {t('legal.privacyTitle')}
          </Link>
        </p>
      )}
    </div>
  );
}
