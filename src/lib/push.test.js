// Renouvellement des clés VAPID (audit du 01/10) : un navigateur abonné avec
// l'ancienne clé doit être réabonné tout seul, sans fenêtre de permission.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const upsert = vi.fn(async () => ({ error: null }));
vi.mock('./supabase', () => ({
  supabase: { functions: { invoke }, from: () => ({ upsert }) },
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/push-notifications', () => ({ PushNotifications: {} }));

const { resyncWebPush } = await import('./push');

const b64url = (octets) => Buffer.from(octets).toString('base64url');
const CLE_A = b64url(new Uint8Array(65).fill(1));
const CLE_B = b64url(new Uint8Array(65).fill(2));

function abonnement(cle, endpoint) {
  return {
    options: { applicationServerKey: Buffer.from(cle, 'base64url') },
    unsubscribe: vi.fn(async () => true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
  };
}

function navigateur(existant) {
  const subscribe = vi.fn(async ({ applicationServerKey }) =>
    abonnement(b64url(applicationServerKey), 'https://push.example/nouveau'));
  const reg = { pushManager: { getSubscription: vi.fn(async () => existant), subscribe } };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: vi.fn(async () => reg) },
  });
  window.PushManager = function PushManager() {};
  globalThis.Notification = { permission: 'granted' };
  return { reg, subscribe };
}

describe('resyncWebPush', () => {
  beforeEach(() => {
    invoke.mockReset();
    upsert.mockClear();
  });

  it('réabonne un navigateur abonné avec une ancienne clé', async () => {
    invoke.mockResolvedValue({ data: { publicKey: CLE_B } });
    const ancien = abonnement(CLE_A, 'https://push.example/ancien');
    const { subscribe } = navigateur(ancien);
    await resyncWebPush('u1');
    expect(ancien.unsubscribe).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(b64url(subscribe.mock.calls[0][0].applicationServerKey)).toBe(CLE_B);
    expect(upsert.mock.calls[0][0]).toMatchObject({ user_id: 'u1', endpoint: 'https://push.example/nouveau' });
  });

  it('garde un abonnement déjà fait avec la bonne clé, et le réenregistre', async () => {
    invoke.mockResolvedValue({ data: { publicKey: CLE_A } });
    const actuel = abonnement(CLE_A, 'https://push.example/actuel');
    const { subscribe } = navigateur(actuel);
    await resyncWebPush('u1');
    expect(actuel.unsubscribe).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(upsert.mock.calls[0][0]).toMatchObject({ endpoint: 'https://push.example/actuel' });
  });

  it('ne fait rien sans permission déjà accordée', async () => {
    const { subscribe } = navigateur(null);
    globalThis.Notification = { permission: 'default' };
    await resyncWebPush('u1');
    expect(invoke).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ne fait rien sans personne connectée', async () => {
    const { subscribe } = navigateur(null);
    await resyncWebPush(null);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
