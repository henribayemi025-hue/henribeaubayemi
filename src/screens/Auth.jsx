import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconEye, IconEyeOff, IconMail, IconPhone, IconBrandGoogleFilled, IconBrandApple } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { networkMessage } from '../lib/netError';
import { souvenirCode } from '../lib/referral';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { CONTACT_EMAIL } from '../legal/terms';

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

// Le fournisseur `apple` est activé côté Supabase depuis le 08/08 (Services ID
// net.finjaro.app.signin, clé .p8 YTXF8Y6SAQ). Le bouton est donc affiché.
//
// ⚠️ Le « client secret » d'Apple EXPIRE — six mois maximum, imposé par Apple,
// soit le 05/02/2027 pour celui en place. Passé cette date le bouton renvoie
// « invalid_client » sans autre avertissement. `scripts/apple-client-secret.mjs`
// refabrique le jeton à partir du fichier .p8 conservé hors du dépôt.
const APPLE_SIGNIN_ENABLED = true;

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
    signIn, signUp, resetPassword, signInWithGoogle,
    signInWithApple, signUpWithPhonePassword, signInWithPhonePassword,
  } = useAuth();
  const toast = useToast();
  const refCode = new URLSearchParams(location.search).get('ref');
  // Google et Apple partent sur leur propre site et reviennent sans rien
  // porter: le code doit être mis de côté AVANT de quitter la page, sinon il
  // est perdu. C'est ce qui explique zéro parrainage enregistré sur 55
  // comptes. Le rattrapage se fait au retour, dans `useAuth`.
  useEffect(() => { souvenirCode(refCode); }, [refCode]);
  const [mode, setMode] = useState(refCode && !consoleMode ? 'signup' : 'login');
  // 'email' | 'phone' — indépendant de `mode` (connexion/inscription/oubli),
  // exactement comme le prototype le proposait pour qui n'a pas d'e-mail.
  const [channel, setChannel] = useState('email');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  // Panneau « je n'arrive plus à entrer » sur un compte téléphone.
  const [aideCompte, setAideCompte] = useState(false);
  const from = location.state?.from || '/';

  // Un clic sur Google/Apple laisse `busy` à vrai le temps de quitter la page
  // — normal sur le web, où l'écran est remplacé. Mais si le détour échoue et
  // qu'on REVIENT sur cet écran (retour arrière, ou l'appli mobile qui éjecte
  // la page de connexion vers le navigateur du téléphone — le cas constaté par
  // Beau: « un bouton qui tourne, tourne, je dois refresh »), rien ne remettait
  // le formulaire en service. On le débloque dès que l'écran redevient visible.
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState === 'visible') setBusy(false);
    };
    document.addEventListener('visibilitychange', wake);
    // `pageshow` couvre le retour arrière depuis le cache du navigateur, qui
    // ne déclenche pas toujours visibilitychange.
    window.addEventListener('pageshow', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('pageshow', wake);
    };
  }, []);

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
        // Sans session, c'est que le projet Supabase exige encore une
        // confirmation du téléphone. On le dit au lieu de renvoyer vers un
        // code SMS qui n'arrivera pas — et Beau doit le voir dans les
        // réglages Supabase, pas la vendeuse dans un écran d'attente.
        else toast.error(t('auth.phoneConfirmBlocked'));
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
      style={{ minHeight: 'var(--app-height, 100dvh)', height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Link to="/" className="mb-8 flex items-center justify-center gap-1">
        <span className="text-title font-semibold text-teal">Finjaro</span>
      </Link>
      <p className="mb-4 text-center text-caption text-muted">{t('common.tagline')}</p>

      {/* Le choix de la langue est ici, au-dessus du formulaire, et pas
          seulement dans les Paramètres: on ne peut pas demander à quelqu'un
          de créer un compte pour pouvoir lire l'écran où il crée son compte.
          Visible aussi à la connexion — la même personne revient. */}
      {!consoleMode && <LanguageSwitch className="mb-6" />}

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
            onClick={() => { setChannel('email'); setAideCompte(false); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-input py-2 text-caption font-semibold transition ${channel === 'email' ? 'bg-white text-teal shadow-sm' : 'text-muted'}`}
          >
            <IconMail size={16} /> {t('auth.byEmail')}
          </button>
          <button
            type="button"
            onClick={() => { setChannel('phone'); setAideCompte(false); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-input py-2 text-caption font-semibold transition ${channel === 'phone' ? 'bg-white text-teal shadow-sm' : 'text-muted'}`}
          >
            <IconPhone size={16} /> {t('auth.byPhone')}
          </button>
        </div>
      )}

      {channel === 'phone' && mode !== 'forgot' ? (
        // TÉLÉPHONE = NUMÉRO + MOT DE PASSE. Rien d'autre.
        //
        // Il n'y a plus une seule ligne de SMS ici, et c'est délibéré: au
        // Cameroun les opérateurs filtrent les SMS automatiques, le code
        // n'arrive jamais, et un chemin qui ne marche pas est pire que pas de
        // chemin du tout. Il en restait pourtant un, caché derrière « mot de
        // passe oublié » — et c'est celui-là qui a piégé une vendeuse le
        // 27/08: code demandé à 14h22, jamais reçu, nouveau compte Google à
        // 14h29, deuxième boutique repartie de zéro. Trois comptes pour une
        // seule personne.
        <form onSubmit={submitPhonePassword} className="space-y-3">
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

          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => setAideCompte(true)}
                className="btn-ghost mx-auto block text-caption"
              >
                {t('auth.forgotPasswordPhone')}
              </button>

              {/* Un compte téléphone n'a pas d'e-mail où envoyer un lien de
                  réinitialisation. La seule voie honnête est donc une vraie
                  personne — pas un code qui n'arrivera pas. Et on dit
                  clairement de NE PAS ouvrir un deuxième compte: la boutique,
                  les articles et les photos sont sur celui-ci. */}
              {aideCompte && (
                <div className="rounded-card border border-warning/25 bg-warning-bg p-4">
                  <p className="text-caption font-semibold text-ink">{t('auth.phoneRecoverTitle')}</p>
                  <p className="mt-1 text-caption text-muted">{t('auth.phoneRecoverBody')}</p>
                  <p className="mt-3 rounded-input border border-warning/30 bg-white/60 p-2 text-caption text-ink">
                    {t('auth.dontCreateSecondAccount')}
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('auth.recoverMailSubject'))}&body=${encodeURIComponent(t('auth.recoverMailBody', { phone: form.phone }))}`}
                    className="btn-secondary mt-2 flex items-center justify-center gap-2"
                  >
                    <IconMail size={18} /> {t('auth.recoverWithSupport')}
                  </a>
                </div>
              )}
            </>
          )}
        </form>
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
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAideCompte(false); }} className="btn-ghost mx-auto mt-4">
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
