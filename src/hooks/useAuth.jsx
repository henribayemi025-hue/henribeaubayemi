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
