import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mode from '../assets/categories/hero-mode.webp';
import beaute from '../assets/categories/hero-beaute.webp';
import evenement from '../assets/categories/hero-evenement.webp';
import deco from '../assets/categories/hero-deco.webp';

const SLIDES = [
  { cat: 'mode', image: mode },
  { cat: 'beaute', image: beaute },
  { cat: 'evenement', image: evenement },
  { cat: 'deco', image: deco },
];

const SWIPE_THRESHOLD = 40; // px

// Auto-rotating promo banner (Amazon-style), not a static text block —
// cycles through a few categories with real photos instead of one fixed
// "Africa & Diaspora" headline that doesn't fit every buyer. Also swipeable
// and dot-tappable — manual interaction resets the auto-advance timer so it
// doesn't fight the user's own navigation.
export function HomeHeroCarousel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const dragX = useRef(null);
  const dragged = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, [index]);

  function goTo(i) {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }

  function onPointerDown(e) {
    dragX.current = e.clientX;
    dragged.current = false;
  }
  function onPointerMove(e) {
    if (dragX.current == null) return;
    if (Math.abs(e.clientX - dragX.current) > 10) dragged.current = true;
  }
  function onPointerUp(e) {
    if (dragX.current == null) return;
    const delta = e.clientX - dragX.current;
    dragX.current = null;
    if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
  }

  return (
    <div
      className="relative aspect-[2/1] w-full max-h-96 touch-pan-y select-none overflow-hidden rounded-2xl lg:aspect-[3/1]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {SLIDES.map((s, i) => (
        <button
          key={s.cat}
          onClick={() => { if (!dragged.current) navigate(`/category/${s.cat}`); }}
          className={`absolute inset-0 flex h-full w-full flex-col items-start justify-end p-4 text-left transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <img src={s.image} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <p className="relative text-title font-semibold text-white">{t(`categories.${s.cat}`)}</p>
          <p className="relative text-caption text-white/80">{t('home.heroCta')}</p>
        </button>
      ))}
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.cat}
            onClick={() => goTo(i)}
            aria-label={t(`categories.${s.cat}`)}
            className="p-1"
          >
            <span className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
