import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { reclamerParrainage } from '../lib/referral';
import { toutOublier } from '../lib/queryCache';
import i18n from '../lib/i18n';

const AuthCtx = createContext(null);

// La langue choisie sur l'écran d'inscription part AVEC le compte.
//
// `public.profiles.locale` avait « fr » pour valeur par défaut en base: un
// compte créé par quelqu'un qui venait de choisir English naissait quand même
// estampillé français, et `useSettings` — qui adopte la langue du profil à la
// connexion — rebasculait toute l'application en français dans la seconde qui
// suivait. Le choix était donc perdu au moment précis où il comptait. La
// migration 0063 enlève ce défaut et fait recopier cette valeur-ci par
// `handle_new_user`.
const langueChoisie = () => (i18n.language?.startsWith('en') ? 'en' : 'fr');

// Où revenir après un aller-retour chez Google ou Apple.
//
// C'était `window.location.origin`, c'est-à-dire TOUJOURS la racine. Quelqu'un
// qui ouvrait « Mon argent », cliquait « continuer avec Google » et revenait
// se retrouvait sur la place de marché, sans comprendre pourquoi. Signalé par
// Beau le 22/09, et ça valait pour chaque écran, pas seulement celui-là.
//
// Supabase accepte un chemin complet parce que `https://finjaro.net/**` est
// dans les Redirect URLs — c'est à ça que sert le `/**` (CLAUDE.md §8). Sans
// lui, Supabase ignorerait l'adresse EN SILENCE et retomberait sur le Site
// URL: exactement le comportement qu'on corrige ici.
//
// `destination` vient de `RequireAuth`, qui range dans l'état de navigation
// la page d'où l'on a été renvoyé. Cet état est en mémoire et ne survit pas à
// l'aller-retour OAuth — d'où le fait de le transformer en URL AVANT de
// partir.
export function retourApres(destination) {
  const { origin, pathname, search } = window.location;

  // Un chemin interne uniquement. `//ailleurs.example` est une adresse
  // absolue déguisée: on refuse tout ce qui n'est pas un chemin de chez nous.
  if (typeof destination === 'string' && /^\/(?!\/)/.test(destination)) {
    return `${origin}${destination}`;
  }

  // Pas de destination: on revient là où l'on est — sauf si l'on est déjà sur
  // un écran de connexion, où revenir n'aurait aucun sens.
  if (/^\/(auth|login|signup)(\/|$)/.test(pathname)) return origin;
  return `${origin}${pathname}${search}`;
}

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
    // Ne JAMAIS laisser cet appel remonter une exception.
    //
    // Sans réseau, `fetch` échoue et la promesse est rejetée — ce n'est pas
    // une erreur Postgrest qu'on lirait dans `{ error }`, c'est un rejet.
    // Or cette fonction est attendue dans le démarrage de l'authentification
    // ci-dessous: un rejet y empêchait `setLoading(false)` de s'exécuter, et
    // l'application entière restait sur un rond qui tourne, sans jamais
    // afficher un seul écran. Mesuré le 22/09 avec Supabase coupé.
    //
    // Sans profil on continue: les écrans ont tous un comportement par
    // défaut, et le profil reviendra au prochain passage en ligne.
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data || null);
    } catch {
      /* hors ligne: on garde ce qu'on a, on ne bloque rien */
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Garde-fou: l'application ne reste JAMAIS sur un rond qui tourne.
    //
    // Mesuré le 22/09 avec Supabase injoignable: `getSession()` ne se
    // terminait ni en succès ni en erreur — elle restait simplement en
    // attente. Ni `catch` ni `finally` ne se déclenchent sur une promesse qui
    // ne se résout pas, donc `loading` restait vrai et `RequireAuth`
    // affichait son rond indéfiniment. L'application s'ouvrait, et n'allait
    // jamais plus loin.
    //
    // Au bout de trois secondes on continue avec ce qu'on a. Ce n'est pas
    // grave: la session vit dans le stockage local, `onAuthStateChange`
    // s'exécute quand même, et le profil se chargera au retour du réseau.
    const secours = setTimeout(() => {
      if (active) setLoading(false);
    }, 3000);

    // `finally` plutôt que la fin du `then`, et un `catch`: quoi qu'il
    // arrive, l'application doit sortir de son écran de chargement. C'est la
    // ceinture qui va avec le `try` de `loadProfile` — deux endroits, parce
    // que `getSession` elle-même peut échouer.
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        await loadProfile(data.session?.user?.id);
      })
      .catch(() => { /* hors ligne: pas de session à charger, on continue */ })
      .finally(() => { if (active) { clearTimeout(secours); setLoading(false); } });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      const uid = s?.user?.id || null;
      // Only refetch when the user actually changed (sign in/out/switch),
      // not on token refreshes for the same user.
      if (uid !== loadedFor.current) {
        // Le retour de Google ou d'Apple passe par ici, et c'est le seul
        // endroit où l'on sait que la session vient de s'ouvrir: le code de
        // parrainage mis de côté avant le départ est réclamé maintenant.
        // Avant, un compte créé par Google perdait son parrainage.
        // Même raison qu'au-dessus: sans réseau, réclamer le parrainage
        // échoue, et un rejet ici empêcherait le profil de se charger.
        if (uid) await reclamerParrainage().catch(() => {});
        loadProfile(uid);
      }
    });
    return () => {
      active = false;
      clearTimeout(secours);
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
      supabase.auth.signUp({ email, password, options: { data: { name, locale: langueChoisie(), ...(ref ? { ref } : {}) } } }),
    // Numéro + mot de passe, SANS SMS — et c'est désormais la SEULE voie
    // téléphone. Les opérateurs camerounais filtrent les SMS automatiques:
    // le serveur dit « envoyé » et rien n'arrive jamais. Le code par SMS a
    // donc été retiré entièrement, y compris la récupération de mot de passe
    // qui en dépendait encore — un chemin qui ne marche pas coûte plus cher
    // que pas de chemin: il fait ouvrir un deuxième compte, vide, et la
    // boutique reste sur le premier.
    signUpWithPhonePassword: (phone, password, name, ref) =>
      supabase.auth.signUp({ phone, password, options: { data: { name, locale: langueChoisie(), ...(ref ? { ref } : {}) } } }),
    signInWithPhonePassword: (phone, password) =>
      supabase.auth.signInWithPassword({ phone, password }),
    // OAuth part vers Google puis revient — pas de deuxième étape à gérer
    // côté client, `onAuthStateChange` (ci-dessus) charge la session au
    // retour. Reste à savoir OÙ revenir: voir `retourApres` plus haut.
    signInWithGoogle: (destination) =>
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: retourApres(destination) } }),
    // Exigé par l'App Store (règle 4.8): une app qui propose Google Sign-In
    // doit aussi proposer Sign in with Apple. Même flux OAuth que Google —
    // le provider `apple` doit être configuré côté Supabase (Services ID,
    // Team ID, clé .p8 du compte développeur de Beau) avant que le bouton
    // fonctionne réellement.
    signInWithApple: (destination) =>
      supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: retourApres(destination) } }),
    // La déconnexion vide aussi le cache hors ligne. Il contient les
    // commandes et les messages de la personne: sur un téléphone prêté ou
    // partagé, les laisser sur l'appareil les montrerait à la suivante.
    signOut: async () => {
      const r = await supabase.auth.signOut();
      toutOublier();
      return r;
    },
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
