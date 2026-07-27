import { useEffect, useState } from 'react';
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

// Auto-rotating promo banner (Amazon-style), not a static text block —
// cycles through a few categories with real photos instead of one fixed
// "Africa & Diaspora" headline that doesn't fit every buyer.
export function HomeHeroCarousel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative aspect-[2/1] w-full max-w-2xl overflow-hidden rounded-2xl">
      {SLIDES.map((s, i) => (
        <button
          key={s.cat}
          onClick={() => navigate(`/category/${s.cat}`)}
          className={`absolute inset-0 flex h-full w-full flex-col items-start justify-end p-4 text-left transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <p className="relative text-title font-semibold text-white">{t(`categories.${s.cat}`)}</p>
          <p className="relative text-caption text-white/80">{t('home.heroCta')}</p>
        </button>
      ))}
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <span key={s.cat} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
