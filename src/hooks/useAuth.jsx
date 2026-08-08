import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Which user's profile we've already loaded — lets us skip redundant fetches
  // on the frequent auth events (TOKEN_REFRESHED, focus) that don't change user.
  const loadedFor = useRef(undefined);

  const loadProfile = useCallback(async (userId) => {
    loadedFor.current = userId || null;
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const uid = s?.user?.id || null;
      // Only refetch when the user actually changed (sign in/out/switch),
      // not on token refreshes for the same user.
      if (uid !== loadedFor.current) loadProfile(uid);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Reprise de session au réveil de l'app.
  //
  // Le jeton d'accès dure 1 h. Sur iPhone, quand Safari est en arrière-plan,
  // les minuteurs de la bibliothèque sont gelés: au retour, le jeton est
  // périmé et il faut le renouveler AVANT toute requête. Or à cet instant
  // précis le réseau mobile n'est pas encore rétabli — le renouvellement part,
  // échoue, et la session est perdue. C'est ce qui obligeait à se reconnecter
  // à chaque retour après une heure.
  //
  // On reprend donc la main: au réveil (ou au retour du réseau), on renouvelle
  // nous-mêmes, en réessayant, et seulement quand le navigateur se dit en
  // ligne. Un échec réseau ne doit jamais valoir une déconnexion.
  useEffect(() => {
    let busy = false;

    async function recover() {
      if (busy || document.visibilityState !== 'visible') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      if (!s) return; // vraiment déconnecté: rien à sauver ici
      // Marge de 60 s: on renouvelle avant l'expiration plutôt qu'après.
      const expiresAt = (s.expires_at || 0) * 1000;
      if (expiresAt - Date.now() > 60_000) return;

      busy = true;
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const { error } = await supabase.auth.refreshSession();
          if (!error) break;
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      } finally {
        busy = false;
      }
    }

    document.addEventListener('visibilitychange', recover);
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
    recover();
    return () => {
      document.removeEventListener('visibilitychange', recover);
      window.removeEventListener('online', recover);
      window.removeEventListener('focus', recover);
    };
  }, []);

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    refreshProfile: () => loadProfile(session?.user?.id),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, name, ref) =>
      supabase.auth.signUp({ email, password, options: { data: { name, ...(ref ? { ref } : {}) } } }),
    // Connexion/inscription par téléphone (SMS OTP) — sans e-mail ni mot de
    // passe, pour les personnes qui n'ont qu'un numéro WhatsApp/SMS. Un seul
    // appel gère les deux cas: Supabase crée le compte au premier passage et
    // se contente de vérifier le code aux suivants. `name`/`ref` ne servent
    // que pour un compte NOUVEAU — sur un compte existant, Supabase les
    // ignore silencieusement (le profil garde son nom déjà enregistré).
    signInWithPhone: (phone, { name, ref } = {}) =>
      supabase.auth.signInWithOtp({ phone, options: { channel: 'sms', data: { name, ...(ref ? { ref } : {}) } } } ),
    verifyPhoneOtp: (phone, token) => supabase.auth.verifyOtp({ phone, token, type: 'sms' }),
    // Numéro + mot de passe, SANS SMS — la voie principale au Cameroun, où
    // les opérateurs filtrent les SMS automatiques (constaté en production:
    // toutes les inscriptions en +237 restaient bloquées). Même principe que
    // Jumia. Supabase renvoie une session immédiatement tant que la
    // confirmation du téléphone est désactivée côté projet; si elle est
    // active, `data.session` est nul et l'appelant bascule sur le code SMS.
    signUpWithPhonePassword: (phone, password, name, ref) =>
      supabase.auth.signUp({ phone, password, options: { data: { name, ...(ref ? { ref } : {}) } } }),
    signInWithPhonePassword: (phone, password) =>
      supabase.auth.signInWithPassword({ phone, password }),
    // OAuth redirige vers Google puis revient sur cette même URL — pas de
    // deuxième étape à gérer côté client, `onAuthStateChange` (ci-dessus)
    // s'occupe de charger la session au retour.
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    // Exigé par l'App Store (règle 4.8): une app qui propose Google Sign-In
    // doit aussi proposer Sign in with Apple. Même flux OAuth que Google —
    // le provider `apple` doit être configuré côté Supabase (Services ID,
    // Team ID, clé .p8 du compte développeur de Beau) avant que le bouton
    // fonctionne réellement.
    signInWithApple: () =>
      supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
