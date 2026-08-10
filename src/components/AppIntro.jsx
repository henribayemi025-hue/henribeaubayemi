import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { IconBuildingStore, IconShieldCheck, IconSparkles } from '@tabler/icons-react';

const SEEN_KEY = 'finjaro:intro-seen';

// Les écrans d'accueil du tout premier lancement.
//
// Beau: « dès que quelqu'un télécharge l'application pour la première fois, il
// doit pouvoir faire le tour. Ça explique, après il peut passer ou accepter. »
//
// C'est le geste que fait toute application au premier lancement, et il
// manquait: on tombait directement sur un fil d'articles, sans savoir ce
// qu'est Finjaro ni ce qu'on peut y faire. La question « acheter ou vendre »
// vient APRÈS l'inscription — elle ne remplace pas cette explication-là, elle
// la prolonge.
//
// Trois écrans, pas six: ce qu'est Finjaro, comment on achète, comment on
// vend. On peut passer à tout moment.
//
// Aucune photo: les visuels seraient des images d'articles qui ne sont pas
// les nôtres. Un médaillon dessiné tient le rôle sans rien inventer.
const SLIDES = [
  { key: 'discover', Icon: IconSparkles, tint: 'bg-teal-light text-teal' },
  { key: 'buy', Icon: IconShieldCheck, tint: 'bg-[#FDF6E3] text-[#B8860B]' },
  { key: 'sell', Icon: IconBuildingStore, tint: 'bg-teal-light text-teal' },
];

// Écrans autonomes: la politique de confidentialité, les CGU, la page
// d'inscription… Y superposer une présentation serait déplacé — et c'est
// exactement là qu'atterrissent les relecteurs des magasins d'applications.
const STANDALONE = ['/auth', '/legal', '/landing', '/a-propos', '/suppression-compte'];

export function AppIntro() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const touchX = useRef(null);

  useEffect(() => {
    if (STANDALONE.some((p) => pathname.startsWith(p))) return;
    // Porte de secours, comme pour la visite guidée: /?intro=1 rejoue la
    // présentation, seul moyen de la revoir depuis un téléphone.
    let forced = false;
    try {
      forced = new URLSearchParams(search).get('intro') === '1';
    } catch { /* URL illisible */ }
    if (forced) {
      setI(0);
      setShow(true);
      // On retire ?intro=1 de l'adresse tout de suite.
      //
      // Beau: « je sors, je sors, et je revois ça ». C'est le lien que je lui
      // ai donné qui le lui remettait: tant que le paramètre reste dans la
      // barre d'adresse, chaque rechargement rouvre la présentation — même
      // après l'avoir passée, puisque « forcé » saute justement la marque.
      // Une porte de secours ne doit s'ouvrir qu'une fois.
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('intro');
        window.history.replaceState({}, '', u.pathname + u.search + u.hash);
      } catch { /* URL illisible: sans gravité */ }
      return;
    }
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch { /* stockage indisponible: on montre */ }
    setShow(true);
  }, [pathname, search]);

  function close() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* noop */ }
    setShow(false);
  }

  function next() {
    if (i < SLIDES.length - 1) setI(i + 1);
    else close();
  }

  if (!show) return null;

  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-base"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -50) next();
        else if (dx > 50 && i > 0) setI(i - 1);
      }}
    >
      {/* C'est le tout premier écran que quelqu'un voit de Finjaro: le nom y
          a sa place, sinon on explique un service sans jamais le nommer. */}
      <div className="mx-auto flex w-full max-w-app items-center justify-between px-6 py-4">
        <span className="text-title font-semibold text-teal">Finjaro</span>
        <button onClick={close} className="px-2 py-1 text-caption font-semibold text-muted">
          {t('intro.skip')}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-app flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Le cercle de laiton: la marque du style vintage de Finjaro, celui
            que les gens ont aimé — pas un cercle gris de plus. */}
        <span className={`flex h-24 w-24 items-center justify-center rounded-full ring-1 ring-brass/40 ${slide.tint}`}>
          <slide.Icon size={44} stroke={1.5} />
        </span>
        {/* Les grands titres font le style de Finjaro — on ne les rétrécit pas. */}
        <h1 className="mt-8 text-[28px] font-semibold leading-tight tracking-tight text-ink">
          {t(`intro.${slide.key}.title`)}
        </h1>
        <p className="mt-3 max-w-[300px] text-body text-muted">
          {t(`intro.${slide.key}.body`)}
        </p>
      </div>

      <div className="mx-auto w-full max-w-app px-6 pb-8">
        <div className="mb-6 flex justify-center gap-2">
          {SLIDES.map((s, n) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-pill transition-all ${n === i ? 'w-6 bg-teal' : 'w-1.5 bg-hairline'}`}
            />
          ))}
        </div>
        <button onClick={next} className="btn-primary">
          {last ? t('intro.start') : t('intro.next')}
        </button>
      </div>
    </div>
  );
}
