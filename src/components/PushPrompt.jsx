import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBell, IconX } from '@tabler/icons-react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { enablePush } from '../lib/push';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const DISMISSED_KEY = 'finjaro:push-prompt-dismissed';
// Trouvé en audit du 08/09 : l'ancien drapeau (juste "1", pour toujours)
// bloquait le réaffichage même quand la carte avait seulement été fermée
// (X) sans jamais toucher au vrai dialogue système — et si la personne
// changeait d'avis plus tard dans les réglages, la carte ne revenait
// jamais la relancer. Le drapeau ne sert plus qu'à ne pas insister tout de
// suite après un "plus tard": un vrai refus système ("denied") se relit à
// chaque montage via checkPermissions()/Notification.permission, qui EST
// déjà la mémoire permanente du système — inutile de la dupliquer ici.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

// Demande d'activer les alertes — AU BON MOMENT, pas à l'ouverture.
//
// La permission existait déjà, mais elle n'était proposée QUE dans Paramètres:
// il fallait aller la chercher dans un écran où personne ne va. Résultat mesuré
// en base: ZÉRO abonnement, sur 23 boutiques. Et onze commandes sur vingt et
// une sont restées « nouvelle » — des clientes qui ont commandé et n'ont jamais
// eu de réponse, parce que la vendeuse ne savait pas.
//
// On la propose donc là où l'intérêt est évident: sur le tableau de bord d'une
// vendeuse qui a une commande en attente. À ce moment-là, « ne rate plus une
// commande » n'est pas un argument, c'est une évidence.
//
// Refusé ou rejeté une fois, on n'insiste plus (mémorisé en local): une
// demande de permission qui revient sans cesse se fait refuser définitivement
// par le système, et on perd le canal pour toujours.
export function PushPrompt({ reason }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  function recentlyDismissed() {
    const last = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    return last > 0 && Date.now() - last < DISMISS_COOLDOWN_MS;
  }

  useEffect(() => {
    if (!user) return;
    if (recentlyDismissed()) return;
    if (Capacitor.isNativePlatform()) {
      // App installée: le canal est FCM/APNs (voir lib/push.js), pas le
      // Notification API du navigateur — `Notification` n'existe d'ailleurs
      // pas dans cette fenêtre. checkPermissions() est l'équivalent natif
      // de `Notification.permission`: on ne redemande pas si déjà tranché
      // — et si la personne l'a changé dans les réglages depuis, c'est ICI
      // qu'on le voit, à chaque montage, sans dépendre d'un drapeau local.
      PushNotifications.checkPermissions().then((perm) => {
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') setShow(true);
      });
      return;
    }
    // Web: `Notification` n'existe pas dans certains contextes (ancien
    // navigateur) — on ne montre rien plutôt que d'ouvrir une porte qui ne
    // mène nulle part.
    if (typeof Notification === 'undefined' || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return; // déjà accordé ou déjà refusé au niveau système
    setShow(true);
  }, [user]);

  function dismiss() {
    // "Plus tard", pas "jamais" : le dialogue système n'a pas été touché,
    // rien ne justifie d'attendre indéfiniment avant de reproposer.
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
  }

  async function turnOn() {
    setBusy(true);
    const res = await enablePush(user?.id);
    setBusy(false);
    setShow(false);
    if (res.ok) toast.success(t('notifications.enabled'));
    // Un vrai refus système ('denied') n'a pas besoin d'être mémorisé ici:
    // Notification.permission / checkPermissions() s'en souvient déjà pour
    // toujours, et c'est relu à chaque montage ci-dessus.
    else if (res.reason === 'denied') toast.error(t('notifications.blocked'));
  }

  if (!show) return null;

  return (
    <div className="flex items-start gap-3 rounded-card border border-hairline bg-white p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal">
        <IconBell size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{t('notifications.promptTitle')}</p>
        <p className="mt-0.5 text-caption text-muted">{t(reason || 'notifications.promptHint')}</p>
        <button
          onClick={turnOn}
          disabled={busy}
          className="mt-2 rounded-pill bg-teal px-3 py-1.5 text-caption font-semibold text-white disabled:opacity-60"
        >
          {t('notifications.promptCta')}
        </button>
      </div>
      <button onClick={dismiss} aria-label={t('common.close')} className="shrink-0 rounded-full p-1 text-muted hover:bg-hairline">
        <IconX size={16} />
      </button>
    </div>
  );
}
