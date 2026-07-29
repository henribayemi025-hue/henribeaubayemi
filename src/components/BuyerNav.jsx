import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHome, IconHomeFilled,
  IconPlayerPlay, IconPlayerPlayFilled,
  IconMapPin, IconMapPinFilled,
  IconMessage, IconMessageFilled,
  IconUser, IconUserFilled,
  IconSparkles, IconX,
} from '@tabler/icons-react';
import { useUI } from '../hooks/useUI';
import { useEffect, useState } from 'react';

const HINT_SEEN_KEY = 'finjaro_finou_hint_seen';
const HINT_ROTATE_MS = 3200;

const items = [
  { to: '/', key: 'home', end: true, out: IconHome, on: IconHomeFilled },
  { to: '/fin', key: 'fin', out: IconPlayerPlay, on: IconPlayerPlayFilled },
  { to: '/near-you', key: 'nearYou', out: IconMapPin, on: IconMapPinFilled },
  { to: '/inbox', key: 'messages', out: IconMessage, on: IconMessageFilled },
  { to: '/profile', key: 'profile', out: IconUser, on: IconUserFilled },
];

export function BuyerNav() {
  const { t } = useTranslation();
  const { openFinou } = useUI();
  const { pathname } = useLocation();
  const isChat = pathname.startsWith('/chat');
  // Hide Finou where it would overlap another control: Near You (+ Publier),
  // the reels feed (right-side actions), and chat threads (send button).
  const showFinou = pathname !== '/near-you' && pathname !== '/fin' && !isChat;
  // A chat thread is a focused screen (like WhatsApp/TikTok DMs): hide the tab
  // bar so only the message input sits above the keyboard.
  const showNav = !isChat;

  // La bulle sparkle seule ne dit jamais ce qu'elle sait faire. Plutôt qu'un
  // libellé figé ("Discuter avec Finou"), la bulle joue en boucle de vraies
  // phrases qu'on peut lui dire — on comprend l'étendue de ses capacités sans
  // avoir à l'ouvrir. Uniquement sur l'accueil, et une seule fois par appareil.
  const [hintSeen, setHintSeen] = useState(() => {
    try { return localStorage.getItem(HINT_SEEN_KEY) === '1'; } catch { return true; }
  });
  const showHint = showFinou && pathname === '/' && !hintSeen;

  const phrases = t('finou.hints', { returnObjects: true });
  const hints = Array.isArray(phrases) ? phrases : [t('finou.hint')];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!showHint || hints.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % hints.length), HINT_ROTATE_MS);
    return () => clearInterval(id);
  }, [showHint, hints.length]);

  const dismissHint = () => {
    setHintSeen(true);
    try { localStorage.setItem(HINT_SEEN_KEY, '1'); } catch { /* noop */ }
  };

  return (
    <>
      {showFinou && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex flex-col items-end gap-2 px-4 lg:bottom-6 lg:px-6">
          {showHint && (
            <div className="pointer-events-auto flex max-w-[75vw] items-center gap-1.5 rounded-card bg-white py-2 pl-3 pr-1.5 shadow-lg ring-1 ring-hairline">
              <button
                onClick={() => { dismissHint(); openFinou(); }}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <IconSparkles size={15} className="shrink-0 text-teal" />
                <span key={idx} className="animate-hint-in truncate text-caption font-medium text-ink">
                  {hints[idx]}
                </span>
              </button>
              <button
                onClick={dismissHint}
                aria-label={t('common.close')}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted"
              >
                <IconX size={13} />
              </button>
            </div>
          )}
          <button
            onClick={() => { dismissHint(); openFinou(); }}
            aria-label={t('finou.title')}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-transform duration-150 hover:bg-teal-hover active:scale-95"
          >
            <IconSparkles size={26} />
          </button>
        </div>
      )}
      {showNav && (
      <nav className="flex items-stretch border-t border-hairline bg-white lg:hidden">
        {items.map((it) => (
          <NavLink key={it.key} to={it.to} end={it.end} className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-transform duration-150 active:scale-90">
            {({ isActive }) => {
              const Icon = isActive ? it.on : it.out;
              return (
                <>
                  <Icon size={23} className={`transition-colors duration-150 ${isActive ? 'text-teal' : 'text-muted'}`} />
                  <span className={`text-[11px] transition-colors duration-150 ${isActive ? 'font-semibold text-teal' : 'text-muted'}`}>
                    {t(`nav.${it.key}`)}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
      )}
    </>
  );
}
