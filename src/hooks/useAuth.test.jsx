// Test basique "connexion" — couvre la demande QA du cycle de maintenance
// staging. Le client Supabase est mocké: on vérifie que useAuth() lit bien la
// session existante au montage, réagit à un changement d'état d'auth, et que
// signIn() appelle signInWithPassword avec les bons identifiants.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { signInWithPassword, signUp, getSession, getAuthChangeCallback, setAuthChangeCallback } = vi.hoisted(() => {
  let cb = null;
  return {
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    getAuthChangeCallback: () => cb,
    setAuthChangeCallback: (fn) => {
      cb = fn;
    },
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange: (cb) => {
        setAuthChangeCallback(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword,
      signUp,
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'user-1', name: 'Test' }, error: null }) }) }),
    }),
  },
}));

import i18n from '../lib/i18n';
import { AuthProvider, useAuth } from './useAuth';

beforeEach(() => {
  signInWithPassword.mockClear();
  signUp.mockClear();
  getSession.mockClear();
});

describe('useAuth — connexion', () => {
  it('starts with no session, then loads the profile once one appears', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    act(() => {
      getAuthChangeCallback()('SIGNED_IN', { user: { id: 'user-1', email: 'test@finjaro.net' } });
    });

    await waitFor(() => expect(result.current.user?.id).toBe('user-1'));
    await waitFor(() => expect(result.current.profile?.name).toBe('Test'));
  });

  it('signIn calls Supabase Auth with the given email/password', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('buyer@finjaro.net', 'hunter2');
    });

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'buyer@finjaro.net', password: 'hunter2' });
  });
});

// La langue choisie sur l'écran d'inscription doit partir AVEC le compte.
//
// Sans elle, `handle_new_user` n'a rien à recopier, `profiles.locale` reste
// nul, et le choix ne se retrouve sur aucun autre appareil. C'est le cas
// signalé en production: un vendeur anglophone bloqué devant un formulaire
// en français.
describe('useAuth — la langue voyage avec l\'inscription', () => {
  async function inscrire(langue) {
    await i18n.changeLanguage(langue);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signUp('new@finjaro.net', 'hunter2', 'Nouveau', null);
    });
    return signUp.mock.calls[0][0].options.data;
  }

  it('transmet « en » quand English est choisi avant de créer le compte', async () => {
    expect(await inscrire('en')).toMatchObject({ name: 'Nouveau', locale: 'en' });
  });

  it('transmet « fr » par défaut', async () => {
    expect(await inscrire('fr')).toMatchObject({ name: 'Nouveau', locale: 'fr' });
  });

  it("ramène « en-US » à « en » — profiles.locale ne connaît que fr et en", async () => {
    expect(await inscrire('en-US')).toMatchObject({ locale: 'en' });
  });
});
